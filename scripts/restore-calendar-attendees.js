const axios = require('axios');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Script to restore interested applicants to calendar events for organizations with open inductions
 * This fixes the issue where people were removed from calendar events due to update function problems
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

// Helper function to get emails from interested applicants
async function getInterestedStudentsEmails(organisationId) {
  try {
    const orgResponse = await axios.get(
      `${apiUrl}/organisations/${organisationId}?populate[interested_applicants][fields][0]=email`,
      axiosConfig
    );

    if (orgResponse.data.data && orgResponse.data.data.attributes.interested_applicants.data) {
      return orgResponse.data.data.attributes.interested_applicants.data.map(user => user.attributes.email);
    }
    
    return [];
  } catch (error) {
    console.error(`Error getting interested students emails for org ${organisationId}:`, error.message);
    return [];
  }
}

// Helper function to update calendar event attendees
async function updateCalendarEventAttendees(eventId, attendeeEmails, orgName) {
  try {
    // Get current event
    const existingEvent = await calendar.events.get({
      calendarId: process.env.INDUCTIONS_CALENDAR_ID,
      eventId: eventId
    });

    const currentAttendees = existingEvent.data.attendees || [];
    const currentEmails = currentAttendees.map(attendee => attendee.email);
    
    // Find emails that need to be added
    const emailsToAdd = attendeeEmails.filter(email => !currentEmails.includes(email));
    
    if (emailsToAdd.length > 0) {
      console.log(`  Adding ${emailsToAdd.length} new attendees to ${orgName}: ${emailsToAdd.join(', ')}`);
      
      // Create new attendees list
      const updatedAttendees = [
        ...currentAttendees,
        ...emailsToAdd.map(email => ({ email: email }))
      ];

      // Update the event
      await calendar.events.update({
        calendarId: process.env.INDUCTIONS_CALENDAR_ID,
        eventId: eventId,
        resource: {
          ...existingEvent.data,
          attendees: updatedAttendees
        }
      });

      console.log(`  ✅ Successfully updated calendar event for ${orgName}`);
      return { added: emailsToAdd.length, total: updatedAttendees.length };
    } else {
      console.log(`  ✅ All attendees already present for ${orgName}`);
      return { added: 0, total: currentAttendees.length };
    }

  } catch (error) {
    console.error(`  ❌ Error updating calendar event for ${orgName}:`, error.message);
    return { added: 0, total: 0, error: error.message };
  }
}

async function restoreCalendarAttendees() {
  console.log('🔄 Starting calendar attendees restoration...\n');

  try {
    // Fetch all organizations with open inductions that have calendar events
    console.log('📋 Fetching organizations with open inductions...');
    const orgsResponse = await axios.get(
      `${apiUrl}/organisations?filters[induction][$eq]=true&filters[calendar_event_id][$notNull]=true&populate[interested_applicants][fields][0]=email&pagination[pageSize]=1000`,
      axiosConfig
    );

    const organizations = orgsResponse.data.data;
    console.log(`Found ${organizations.length} organizations with open inductions and calendar events\n`);

    if (organizations.length === 0) {
      console.log('No organizations found. Exiting...');
      return;
    }

    let totalProcessed = 0;
    let totalAttendeesAdded = 0;
    let totalErrors = 0;

    for (const org of organizations) {
      totalProcessed++;
      const orgName = org.attributes.name;
      const calendarEventId = org.attributes.calendar_event_id;
      
      console.log(`${totalProcessed}. Processing: ${orgName}`);
      console.log(`   Calendar Event ID: ${calendarEventId}`);

      // Get interested applicants emails
      const interestedEmails = org.attributes.interested_applicants.data.map(user => user.attributes.email);
      console.log(`   Interested applicants: ${interestedEmails.length} (${interestedEmails.join(', ') || 'none'})`);

      if (interestedEmails.length === 0) {
        console.log(`   ⏭️  No interested applicants found, skipping...\n`);
        continue;
      }

      // Update calendar event with interested applicants
      const result = await updateCalendarEventAttendees(calendarEventId, interestedEmails, orgName);
      
      if (result.error) {
        totalErrors++;
      } else {
        totalAttendeesAdded += result.added;
      }

      console.log(`   Current attendees: ${result.total}\n`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('📊 RESTORATION SUMMARY:');
    console.log(`   Organizations processed: ${totalProcessed}`);
    console.log(`   Total attendees added: ${totalAttendeesAdded}`);
    console.log(`   Errors encountered: ${totalErrors}`);
    console.log('\n✅ Calendar attendees restoration completed!');

  } catch (error) {
    console.error('❌ Fatal error during restoration:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Calendar Attendees Restoration Script');
  console.log('==========================================\n');

  // Ask for confirmation
  console.log('⚠️  This script will:');
  console.log('   1. Find all organizations with open inductions and calendar events');
  console.log('   2. Check if interested applicants are invited to calendar events');
  console.log('   3. Add missing attendees to calendar events');
  console.log('   4. Skip attendees that are already present\n');

  await restoreCalendarAttendees();
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { restoreCalendarAttendees, updateCalendarEventAttendees };
