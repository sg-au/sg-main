const axios = require('axios');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * One-off script to create calendar events for existing organizations with open inductions
 * Run this script once to set up calendar integration for organizations that already have inductions open
 */

// Initialize Google Calendar API
const calendarOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

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
    Authorization: `Bearer ${process.env.STRAPI_API_KEY}`,
  },
};

const apiUrl = process.env.STRAPI_API_URL;

// Helper function to convert date to IST and format for Google Calendar
function toISTDateTime(dateString) {
  // Parse the date string and ensure it's treated as IST
  const date = new Date(dateString);
  
  // If the date doesn't have timezone info, treat it as IST
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-')) {
    // Add IST offset (+05:30) to the date
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const utcTime = date.getTime() - istOffset;
    return new Date(utcTime);
  }
  
  return date;
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
      const plainDescription = orgData.induction_description.replace(/<[^>]*>/g, '').trim();
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
      attendees: [], // Will be populated later
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

// Helper function to update calendar event with attendees
async function updateCalendarEventWithAttendees(eventId, attendeeEmails) {
  try {
    if (attendeeEmails.length === 0) return;

    const updatedEvent = {
      attendees: attendeeEmails.map(email => ({ email: email, responseStatus: 'needsAction' }))
    };

    await calendar.events.patch({
      calendarId: process.env.INDUCTIONS_CALENDAR_ID,
      eventId: eventId,
      resource: updatedEvent,
      sendUpdates: 'all' // Send notifications to all attendees
    });

    console.log(`  ✓ Added ${attendeeEmails.length} attendees to calendar event`);
  } catch (error) {
    console.error('  ✗ Error updating calendar event with attendees:', error.message);
  }
}

async function setupExistingInductionEvents() {
  console.log('🚀 Starting setup of calendar events for existing organizations with open inductions...\n');
  
  try {
    // Get all organizations with open inductions
    console.log('📋 Fetching organizations with open inductions...');
    const organisationsResponse = await axios.get(
      `${apiUrl}/organisations?filters[induction][$eq]=true&populate=interested_applicants&pagination[pageSize]=1000`,
      axiosConfig
    );
    
    const organisations = organisationsResponse.data.data;
    console.log(`✅ Found ${organisations.length} organizations with open inductions\n`);
    
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const org of organisations) {
      const orgId = org.id;
      const orgData = org.attributes;
      
      console.log(`📝 Processing: ${orgData.name}`);
      
      // Skip if already has calendar_event_id
      if (orgData.calendar_event_id) {
        console.log(`  ⏭️  Already has calendar event (ID: ${orgData.calendar_event_id}), skipping`);
        skippedCount++;
        continue;
      }
      
      // Skip if no induction deadline set
      if (!orgData.induction_end) {
        console.log(`  ⏭️  No induction deadline set, skipping`);
        skippedCount++;
        continue;
      }
      
      // Check if deadline is in the future (using IST)
      const deadline = toISTDateTime(orgData.induction_end);
      const now = new Date();
      
      if (deadline <= now) {
        // Format deadline in IST for display
        const istDeadline = new Date(deadline.getTime() + (5.5 * 60 * 60 * 1000));
        console.log(`  ⏭️  Deadline has passed (${istDeadline.toLocaleDateString('en-IN', {timeZone: 'Asia/Kolkata'})} ${istDeadline.toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata'})}), skipping`);
        skippedCount++;
        continue;
      }
      
      try {
        // Create calendar event
        // Format deadline in IST for display
        const istDeadline = new Date(deadline.getTime() + (5.5 * 60 * 60 * 1000));
        console.log(`  📅 Creating calendar event for deadline: ${istDeadline.toLocaleDateString('en-IN', {timeZone: 'Asia/Kolkata'})} ${istDeadline.toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata'})} IST`);
        const eventId = await createInductionCalendarEvent(
          orgData.name,
          orgData.induction_end,
          orgId,
          orgData // Pass the full organization data
        );
        
        console.log(`  ✓ Calendar event created (ID: ${eventId})`);
        
        // Update organization with calendar_event_id
        const updatedData = {
          data: {
            calendar_event_id: eventId
          }
        };
        
        await axios.put(`${apiUrl}/organisations/${orgId}`, updatedData, axiosConfig);
        console.log(`  ✓ Updated organization with calendar event ID`);
        
        // Get interested students and add them as attendees
        const interestedEmails = await getInterestedStudentsEmails(orgId);
        if (interestedEmails.length > 0) {
          console.log(`  👥 Found ${interestedEmails.length} interested students`);
          await updateCalendarEventWithAttendees(eventId, interestedEmails);
        } else {
          console.log(`  👥 No interested students found`);
        }
        
        processedCount++;
        console.log(`  ✅ Successfully processed ${orgData.name}\n`);
        
      } catch (error) {
        console.error(`  ❌ Error processing ${orgData.name}:`, error.message);
        errorCount++;
        console.log(); // Empty line for readability
      }
    }
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log(`✅ Successfully processed: ${processedCount} organizations`);
    console.log(`⏭️  Skipped: ${skippedCount} organizations`);
    console.log(`❌ Errors: ${errorCount} organizations`);
    console.log(`📋 Total organizations checked: ${organisations.length}`);
    
    if (processedCount > 0) {
      console.log('\n🎉 Setup completed! Calendar events have been created for organizations with open inductions.');
      console.log('📧 Students who were already tracking these organizations will receive calendar invitations.');
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Only run if called directly
if (require.main === module) {
  setupExistingInductionEvents()
    .then(() => {
      console.log('\n🏁 Script execution completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script execution failed:', error);
      process.exit(1);
    });
}

module.exports = { setupExistingInductionEvents };
