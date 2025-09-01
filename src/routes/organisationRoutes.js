const express = require("express");
const router = express.Router();
const fs = require("fs");
const helpers = require("../config/helperFunctions.js");
const axios = require("axios");
const { google } = require("googleapis");
const { youtube } = require("googleapis/build/src/apis/youtube/index.js");

// Initialize Google Calendar API with OAuth2
const calendarOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set the refresh token if you have one
if (process.env.GOOGLE_REFRESH_TOKEN) {
  calendarOAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
}

const calendar = google.calendar({
  version: 'v3',
  auth: calendarOAuth2Client
});

const axiosConfig = {
  headers: {
    "Content-Type": "application/json",
    // Include authentication headers if required by your Strapi API
    Authorization: `Bearer ${process.env.STRAPI_API_KEY}`,
  },
};

const apiUrl = process.env.STRAPI_API_URL;

// Helper function to convert date to IST and format for Google Calendar
function toISTDateTime(dateString) {
  // Parse the date string and ensure it's treated as IST
  const date = new Date(dateString);
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const utcTime = date.getTime() - istOffset;
  return new Date(utcTime);
}

// Helper function to create Google Calendar event for induction deadline
async function createInductionCalendarEvent(organisationName, inductionEnd, organisationId, orgData = null) {
  try {
    // Convert to proper IST date
    const deadline = toISTDateTime(inductionEnd);
    const eventStart = new Date(deadline.getTime() - 60 * 60 * 1000); // 1 hour before deadline
    
    // Build enhanced description with additional induction info
    let description = `🎯 Induction deadline for ${organisationName}\n\n`;
    description += `📅 Deadline: ${deadline.toLocaleDateString('en-IN', {timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})} at ${deadline.toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata'})} IST\n\n`;
    description += `⚠️ All applications must be submitted by this time.\n\n`;
    
    // Add induction description if available
    if (orgData && orgData.induction_description) {
      // Strip HTML tags for plain text calendar description
      const plainDescription = orgData.induction_description;
      if (plainDescription) {
        description += `📋 Induction Information:\n${plainDescription}\n\n`;
      }
    }
    
    description += `💡 This event was created automatically by Ministry of Technology to help you track induction deadlines.`;
    
    const event = {
      summary: `${organisationName} - Induction Deadline`,
      description: description,
      start: {
        dateTime: eventStart.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: deadline.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: [], // Will be populated with interested students
      reminders: {
        useDefault: false,
        overrides: [
          {'method': 'email', 'minutes': 24 * 60}, // 1 day before
          {'method': 'email', 'minutes': 60}, // 1 hour before
        ],
      },
      extendedProperties: {
        private: {
          organisationId: organisationId.toString(),
          type: 'induction_deadline'
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: process.env.INDUCTIONS_CALENDAR_ID,
      resource: event,
    });

    return response.data.id;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Helper function to update existing calendar event
async function updateInductionCalendarEvent(eventId, organisationName, inductionEnd, interestedEmails = [], orgData = null) {
  try {
    // Get the current event to check if it's still in the future
    const existingEvent = await calendar.events.get({
      calendarId: process.env.INDUCTIONS_CALENDAR_ID,
      eventId: eventId
    });

    const now = new Date();
    const eventStart = new Date(existingEvent.data.start.dateTime);

    // Only update if the event hasn't passed yet
    if (eventStart > now) {
      // Convert to proper IST date
      const deadline = toISTDateTime(inductionEnd);
      const newEventStart = new Date(deadline.getTime() - 60 * 60 * 1000); // 1 hour before deadline
      
      // Build enhanced description with additional induction info
      let description = `🎯 Induction deadline for ${organisationName}\n\n`;
      description += `📅 Deadline: ${deadline.toLocaleDateString('en-IN', {timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})} at ${deadline.toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata'})} IST\n\n`;
      description += `⚠️ All applications must be submitted by this time.\n\n`;
      
      // Add induction description if available
      if (orgData && orgData.induction_description) {
        // Strip HTML tags for plain text calendar description
        const plainDescription = orgData.induction_description;
        if (plainDescription) {
          description += `📋 Induction Information:\n${plainDescription}\n\n`;
        }
      }
      
      description += `💡 This event was created automatically by Ministry of Technology to help you track induction deadlines.`;
      
      const updatedEvent = {
        summary: `${organisationName} - Induction Deadline`,
        description: description,
        start: {
          dateTime: newEventStart.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: deadline.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        attendees: interestedEmails.map(email => ({ email: email })),
        reminders: {
          useDefault: false,
          overrides: [
            {'method': 'email', 'minutes': 24 * 60},
            {'method': 'email', 'minutes': 60},
          ],
        }
      };

      await calendar.events.update({
        calendarId: process.env.INDUCTIONS_CALENDAR_ID,
        eventId: eventId,
        resource: updatedEvent,
        sendUpdates: 'all' // Send notifications to all attendees
      });

      return true;
    } else {
      console.log('Event has already passed, creating new event instead');
      return false;
    }
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
}

// Helper function to get interested students' emails
async function getInterestedStudentsEmails(organisationId) {
  try {
    const orgResponse = await axios.get(
      `${apiUrl}/organisations/${organisationId}?populate=interested_applicants`,
      axiosConfig
    );

    if (orgResponse.data.data && orgResponse.data.data.attributes.interested_applicants.data) {
      const userIds = orgResponse.data.data.attributes.interested_applicants.data.map(user => user.id);
      
      if (userIds.length > 0) {
        const usersResponse = await axios.get(
          `${apiUrl}/users?filters[id][$in]=${userIds.join(',')}&fields[0]=email`,
          axiosConfig
        );
        
        return usersResponse.data.map(user => user.email);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error getting interested students emails:', error);
    return [];
  }
}

router.get("/", async (req, res) => {
  try {
    let organisation = await axios.get(
      `${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`,
      axiosConfig
    );
    organisation = organisation.data[0];
    res.render("organisation/pages/index", {
      organisation: organisation,
    });
  } catch (err) {
    res.send(err);
  }
});

router.get("/organisation-catalogue", async (req, res) => {
  try {
    let organisation = await axios.get(
      `${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&populate=organisations`,
      axiosConfig
    );
    organisation = organisation.data[0];
    let linkedListings = organisation.organisations;    
    res.render("organisation/pages/organisation-catalogue", {
      organisation: organisation,
      linkedListings: linkedListings,
    });
  } catch (err) {
    res.send(err);
  }
});

router.get("/edit-catalogue-listing/:id", async (req, res) => {
  try {    
    let listing = await axios.get(
      `${apiUrl}/organisations/${req.params.id}?populate=profile&populate=circle1_humans&populate=circle2_humans`,
      axiosConfig
    );
    listing = listing.data.data;
    function escapeString(str) {
      if (typeof str !== 'string') return str;
      return str
        .replace(/\\/g, '\\\\')    // Escape backslashes
        .replace(/"/g, '\\"')      // Escape double quotes
        .replace(/\n/g, '\\n')     // Escape newlines
        .replace(/\r/g, '\\r')     // Escape carriage returns
        .replace(/\t/g, '\\t')     // Escape tabs
        .replace(/\f/g, '\\f');    // Escape form feeds
    }
    listing.attributes.description = escapeString(listing.attributes.description);
    listing.attributes.short_description = escapeString(listing.attributes.short_description);
    listing.attributes.induction_description = escapeString(listing.attributes.induction_description);
    linkedOrganisations = listing.attributes.profile.data;    
    const hasAccess = linkedOrganisations.some(org => 
      org.attributes.email === req.user._json.email
    );
    // console.log(listing.attributes.circle1_humans.data);
    if (hasAccess) {
      let users = await axios.get(
        `${apiUrl}/users?pagination[pageSize]=4000`,
        axiosConfig
      );
      
      // Extract only the required user data
      const simplifiedUsers = users.data.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username
      }));
      
      res.render("organisation/pages/edit-catalogue-listing", {            
        listing: listing,
        users: simplifiedUsers,
      });
    } else {
      res.send("error 404");
    }
  } catch (err) {
    res.send(err);
  }
});

router.post("/update-catalogue-listing", async (req, res) => {  
  try {
      const listingId = req.body.id;
      let circle1HumansData = [];
      let circle2HumansData = [];
      let circle1UserIds = [];
      
      try {
          if (req.body.circle1_humans) {
            circle1HumansData = JSON.parse(req.body.circle1_humans);
            circle1UserIds = circle1HumansData.map(user => user.id);
          }
          
          if (req.body.circle2_humans) {
            circle2HumansData = JSON.parse(req.body.circle2_humans);
          }
      } catch (jsonError) {
          console.error("Error parsing JSON data:", jsonError);
          return res.status(400).send("Failed to parse user data");
      } 
      
      let induction_end = null;
      if (req.body.induction === 'on' && req.body.induction_end) {
          // Use the date string directly from the input - it will be in ISO format from datetime-local input
          induction_end = req.body.induction_end;
      }

      // Get existing listing to check for calendar event
      const { data: existingListing } = await axios.get(`${apiUrl}/organisations/${listingId}`, axiosConfig);
      
      // Prepare updated listing data
      const updatedListing = {
          data: {
              name: req.body.name,
              short_description: req.body.short_description,
              description: req.body.description,
              circle1_humans: circle1HumansData,
              circle2_humans: circle2HumansData,
              induction: req.body.induction === 'on' ? true : false,
              induction_end: induction_end,
              induction_description: req.body.induction_description,
              website_blog: req.body.website_blog,
              instagram: req.body.instagram,
              linkedin: req.body.linkedin,
              twitter: req.body.twitter,
              youtube: req.body.youtube,
          }
      };

      // Handle calendar event creation/update for inductions
      if (req.body.induction === 'on' && induction_end) {
          try {
              // Get interested students' emails
              const interestedEmails = await getInterestedStudentsEmails(listingId);
              
              // Prepare organization data for calendar event
              const orgDataForCalendar = {
                  name: req.body.name,
                  induction_description: req.body.induction_description
              };
              
              const existingCalendarEventId = existingListing.data.attributes.calendar_event_id;
              
              if (existingCalendarEventId) {
                  // Try to update existing event
                  const updateSuccess = await updateInductionCalendarEvent(
                      existingCalendarEventId, 
                      req.body.name, 
                      induction_end, 
                      interestedEmails,
                      orgDataForCalendar
                  );
                  
                  if (!updateSuccess) {
                      // Event has passed, create new one
                      const newEventId = await createInductionCalendarEvent(
                          req.body.name, 
                          induction_end, 
                          listingId,
                          orgDataForCalendar
                      );
                      updatedListing.data.calendar_event_id = newEventId;
                      
                      // Update the event with interested students
                      if (interestedEmails.length > 0) {
                          await updateInductionCalendarEvent(newEventId, req.body.name, induction_end, interestedEmails, orgDataForCalendar);
                      }
                  }
              } else {
                  // Create new calendar event
                  const eventId = await createInductionCalendarEvent(
                      req.body.name, 
                      induction_end, 
                      listingId,
                      orgDataForCalendar
                  );
                  updatedListing.data.calendar_event_id = eventId;
                  
                  // Update the event with interested students
                  if (interestedEmails.length > 0) {
                      await updateInductionCalendarEvent(eventId, req.body.name, induction_end, interestedEmails, orgDataForCalendar);
                  }
              }
          } catch (calendarError) {
              console.error("Error handling calendar event:", calendarError);
              // Continue with the update even if calendar fails
          }
      } else if (existingListing.data.attributes.calendar_event_id && req.body.induction !== 'on') {
          // If inductions are turned off, we could optionally delete the calendar event
          // For now, we'll just remove the reference from the database
          updatedListing.data.calendar_event_id = null;
      }

      // Update the organisation
      await axios.put(`${apiUrl}/organisations/${listingId}`, updatedListing, axiosConfig);
      res.redirect("/organisation/organisation-catalogue");
  } catch (err) {
      console.error("Error updating listing:", err.response?.data || err.message);
      res.status(500).send("Failed to update listing.");
  }
});

// Test route for calendar integration (remove in production)
router.get("/test-calendar", async (req, res) => {
  try {
    // Test creating a calendar event
    const testOrgData = {
      name: "Test Organisation",
      induction_description: "Test induction description with <strong>HTML</strong> tags. Apply through this link: https://example.com/form"
    };
    
    const testEvent = await createInductionCalendarEvent(
      "Test Organisation", 
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      "123",
      testOrgData
    );
    
    res.json({ 
      success: true, 
      message: "Test calendar event created", 
      eventId: testEvent 
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to create test event", 
      details: error.message 
    });
  }
});

module.exports = router;