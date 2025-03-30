const Imap = require('imap');
const { simpleParser } = require('mailparser');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const moment = require('moment');
const { google } = require('googleapis');
dotenv.config();

const { default: fetch, Headers } = require('node-fetch');
globalThis.fetch = fetch;
globalThis.Headers = Headers;

// IMAP reconnection settings
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 10000; // 10 seconds
const CHECK_INTERVAL = 60000; // 60 seconds
let imapReconnectAttempts = 0;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Set up Google Calendar auth
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// IMAP configuration
const imapConfig = {
  user: process.env.EMAIL,
  password: process.env.APP_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  keepalive: true,
  authTimeout: 30000
};

// Create IMAP connection
const imap = new Imap(imapConfig);

// Error handling with reconnection
function handleImapError(error) {
  console.error(`IMAP Error: ${error}`);
  
  if (imapReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    imapReconnectAttempts++;
    console.log(`Connection lost. Attempting to reconnect (attempt ${imapReconnectAttempts} of ${MAX_RECONNECT_ATTEMPTS})...`);
    
    try {
      if (imap && imap.state !== 'disconnected') {
        imap.end();
      }
    } catch (e) {
      console.log(`Error ending existing connection: ${e.message}`);
    }
    
    setTimeout(() => {
      console.log(`Reconnecting to IMAP server...`);
      imap.connect();
    }, RECONNECT_DELAY);
  } else {
    console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
    setTimeout(() => {
      imapReconnectAttempts = 0;
    }, 60000); // Reset after 1 minute
  }
}

// Event handlers for IMAP connection
imap.once('error', (err) => {
  console.error('IMAP Error:', err);
  if (err.source === 'timeout') {
    console.log('Reconnecting in 10 seconds...');
    setTimeout(() => imap.connect(), 10000);
  } else {
    handleImapError(err);
  }
});

imap.once('end', () => {
  console.log('IMAP Connection closed. Reconnecting...');
  setTimeout(() => imap.connect(), 5000);
});

// When connection is ready
imap.once('ready', function() {
  openInbox((err, box) => {
    if (err) {
      console.error('Error opening inbox:', err);
      return;
    }
    
    console.log(`Listening for new emails in ${box.name}...`);
    
    // Set up periodic checking
    setInterval(() => {
      console.log('Periodically checking for new emails...');
      checkEmails();
    }, CHECK_INTERVAL);
    
    // Listen for new emails
    imap.on('mail', function() {
      console.log('New email detected...');
      checkEmails();
    });
  });
});

// Open the inbox/label
function openInbox(cb) {
  const labelName = 'test'; // Change this to your desired label
  imap.openBox(labelName, false, cb);
}

async function isEventCancelled(emailData) {
  const prompt = `Analyze the following email to determine if it's cancelling an event. 
                 Respond with ONLY "true" or "false" (lowercase, no quotes) based on whether 
                 the email is cancelling an event mentioned in a previous email.
                 
                 Email Subject: ${emailData.subject}
                 Email Body: ${emailData.body}
                 
                 Look for keywords like (not exhaustively):
                 - "cancelled"
                 - "called off"
                 - "will not take place"
                 - "is cancelled"
                 - "we regret to inform"
                 - "unfortunately" combined with cancellation context
                 
                 Only respond with "true" or "false". No other text.`;
  
  try {
      const result = await model.generateContent(prompt);
      const response = result.response.text().trim().toLowerCase();
      return response === 'true';
  } catch (error) {
      console.log(`Error checking for cancellation: ${error}`);
      return false;
  }
}

// Add this function to remove cancelled events
async function removeCancelledEvent(threadId) {
  try {
      const existingEvent = await findExistingEvent(threadId);
      if (existingEvent) {
          await calendar.events.delete({
              calendarId: process.env.GOOGLE_CALENDAR_ID,
              eventId: existingEvent.id
          });
          console.log(`Successfully deleted cancelled event with threadId: ${threadId}`);
          return true;
      }
      return false;
  } catch (error) {
      console.log(`Error deleting cancelled event: ${error}`);
      return false;
  }
}


// Check for new emails
function checkEmails() {
  imap.search(['UNSEEN'], (err, results) => {
    if (err) {
      console.error('Error searching for unread emails:', err);
      return;
    }

    if (!results.length) {
      console.log('No unread emails found');
      return;
    }

    console.log(`Found ${results.length} unread email(s)`);

    const fetch = imap.fetch(results, {
      bodies: ['HEADER.FIELDS (SUBJECT FROM DATE REFERENCES MESSAGE-ID X-GM-THRID)', 'TEXT'],
      markSeen: true,
      struct: true
    });

    const emails = [];
    let partsProcessed = 0;
    let totalParts = 2;

    fetch.on('message', (msg, seqno) => {
      console.log(`Processing message #${seqno}`);
      
      let emailData = {
        subject: '',
        fromEmail: '',
        body: '',
        date: '',
        threadId: ''
      };

      msg.on('attributes', (attrs) => {
        if (attrs['x-gm-thrid']) {
          emailData.threadId = attrs['x-gm-thrid'].toString();
        }
      });

      msg.on('body', (stream, info) => {
        let buffer = '';
        
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });

        stream.on('end', () => {
          if (info.which === 'HEADER.FIELDS (SUBJECT FROM DATE REFERENCES MESSAGE-ID X-GM-THRID)') {
            const header = Imap.parseHeader(buffer);
            emailData.subject = header.subject?.[0] || '';
            emailData.date = header.date?.[0] || '';
            
            if (!emailData.threadId && header['message-id']?.[0]) {
              emailData.threadId = header['message-id'][0].replace(/[<>]/g, '');
            }
            
            const fromField = header.from?.[0] || '';
            emailData.fromEmail = fromField.match(/<(.+)>/)?.[1] || fromField;
            partsProcessed++;
          } 
          else if (info.which === 'TEXT') {
            emailData.body = buffer;
            
            simpleParser(buffer, (err, parsed) => {
              if (!err && parsed.text) {
                emailData.body = parsed.text;
              }
              partsProcessed++;
              
              if (partsProcessed === totalParts) {
                if (emailData.fromEmail && emailData.body && emailData.threadId) {
                  emails.push(emailData);
                } else {
                  console.log('Missing required email data for message #' + seqno);
                }
              }
            });
          }
        });
      });

      msg.once('end', () => {
        console.log(`Finished fetching message #${seqno}`);
      });
    });

    fetch.once('error', (err) => {
      console.error('Error fetching emails:', err);
    });

    fetch.once('end', () => {
      console.log('Done fetching all messages');
      
      if (emails.length > 0) {
        console.log(`Processing ${emails.length} valid emails`);
        async for (const email of emails) {
          // Fix: use 'email' instead of 'emailData'
          const isCancelled = isEventCancelled(email); 
          if (isCancelled) {
            console.log(`Detected cancellation email for thread ${email.threadId}`);
            await removeCancelledEvent(email.threadId);
            continue; // Skip to next email
          }
          await processEvent(email, email.fromEmail);
        }
      }
    });
  });
}

// Check if an event with the given threadId already exists
async function findExistingEvent(threadId) {
  try {
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      privateExtendedProperty: `threadId=${threadId}`
    });
    
    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0]; // Return the first matching event
    }
    return null;
  } catch (error) {
    console.log(`Error finding existing event: ${error}`);
    return null;
  }
}

// Check if the email contains updated event information
async function checkForEventUpdates(emailData, existingEventDetails) {
    const prompt = `You are given the body of an email and details of an existing event.
                   Your task is to incorporate any changes or updates to the event and return the final event object.
                   
                   Existing event details:
                   ${JSON.stringify(existingEventDetails, null, 2)}
                   
                   The email is provided below:
                   Subject: ${emailData.subject}
                   From: ${emailData.fromEmail}
                   Body: ${emailData.body}
                   
                   Return the updated event object in the following format:
                   {
                     "Name of the event": "Updated event name",
                     "Organising Body": ["Updated Organising Body"],
                     "Date, Time, Venue": {
                       "Date": "Updated date",
                       "Time": "Updated time",
                       "Venue": "Updated venue"
                     },
                     "Descriptive Summary": "Updated description"
                   }. Return ONLY this object as a valid JSON such that it can be parsed without error. Do not add any true/false boolean here. ONLY the valid JSON.`;
    
    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Clean the response to ensure it's valid JSON
        const cleanedResponse = response.replace(/```json|```|`|\n/g, '').trim();
        
        try {
            // Parse the JSON response
            const parsedResponse = JSON.parse(cleanedResponse);
            // console.log(`Final event object:`, JSON.stringify(parsedResponse, null, 2));
            return parsedResponse; // Return the complete event object
        } catch (jsonError) {
            console.log(`Error parsing response from model: ${jsonError}`);
            return null; // Handle error appropriately
        }
    } catch (error) {
        console.log(`Error checking for event updates: ${error}`);
        return null; // Handle error appropriately
    }
}

function applyUpdatesToEvent(existingEvent, updates) {


    const updatedEvent = {...existingEvent};
    
    // Check if there are venue updates
    if (updates["Date, Time, Venue"] && updates["Date, Time, Venue"].Venue) {
      updatedEvent.location = updates["Date, Time, Venue"].Venue;
      console.log(`Updating venue to: ${updates["Date, Time, Venue"].Venue}`);
    }
    
    // Check for date or time updates
    if (updates["Date, Time, Venue"]) {
      // Handle date updates
      if (updates["Date, Time, Venue"].Date) {
        const newDate = updates["Date, Time, Venue"].Date;
        const startDateTime = moment(existingEvent.start.dateTime);
        const endDateTime = moment(existingEvent.end.dateTime);
        
        console.log(`Updating date from ${startDateTime.format('YYYY-MM-DD')} to ${newDate}`);
        
        // Update date portion while preserving time
        startDateTime.set({
          'year': moment(newDate).year(),
          'month': moment(newDate).month(),
          'date': moment(newDate).date()
        });
        
        endDateTime.set({
          'year': moment(newDate).year(),
          'month': moment(newDate).month(),
          'date': moment(newDate).date()
        });
        
        updatedEvent.start.dateTime = startDateTime.toISOString();
        updatedEvent.end.dateTime = endDateTime.toISOString();
      }
      
      // Handle time updates
      if (updates["Date, Time, Venue"].Time) {
        const timeString = updates["Date, Time, Venue"].Time;
        const timeParts = timeString.split(' - ');
        
        // console.log(`Updating time to: ${timeString}`);
        
        if (timeParts.length >= 2) {
          const startTime = moment(timeParts[0], "h:mm A");
          const endTime = moment(timeParts[1], "h:mm A");
          
          const startDateTime = moment(existingEvent.start.dateTime);
          const endDateTime = moment(existingEvent.end.dateTime);
          
          // Calculate original duration in minutes before we change anything
          const originalDurationMinutes = endDateTime.diff(startDateTime, 'minutes');
          // console.log(`Original event duration: ${originalDurationMinutes} minutes`);
          
          // Update start time
          startDateTime.set({
            'hour': startTime.hour(),
            'minute': startTime.minute(),
            'second': 0
          });
          
          // Two approaches for end time:
          // 1. Use the specified end time
          if (timeParts.length === 2) {
            endDateTime.set({
              'hour': endTime.hour(),
              'minute': endTime.minute(),
              'second': 0
            });
            // console.log(`Using explicitly specified end time: ${endTime.format('h:mm A')}`);
          } 
          // 2. Maintain the original duration if only start time was clearly specified
          else {
            const newEndTime = moment(startDateTime).add(originalDurationMinutes, 'minutes');
            endDateTime.set({
              'hour': newEndTime.hour(),
              'minute': newEndTime.minute(),
              'second': 0
            });
            console.log(`Maintaining original duration. New end time: ${newEndTime.format('h:mm A')}`);
          }
          
          updatedEvent.start.dateTime = startDateTime.toISOString();
          updatedEvent.end.dateTime = endDateTime.toISOString();
          
          console.log(`Updated time: ${moment(updatedEvent.start.dateTime).format('h:mm A')} - ${moment(updatedEvent.end.dateTime).format('h:mm A')}`);
        }
      }
    }
    
    return updatedEvent;
  }

async function sendToGoogleCalendar(responseTuple, fromEmail, threadId) {
    const eventData = responseTuple[1];
  
    if (typeof eventData !== 'object') {
        console.log("Invalid eventData: Not an object");
        return;
    }
  
    if (!eventData["Date, Time, Venue"] || typeof eventData["Date, Time, Venue"] !== 'object') {
        console.log("Invalid eventData: Missing or incorrect 'Date, Time, Venue' field");
        return;
    }
  
    try {
        // Check if an event with this threadId already exists
        const existingEvent = await findExistingEvent(threadId);
        
        if (existingEvent) {
            console.log(`Found existing event with threadId: ${threadId}`);
            
            // Get the final event object from the LLM
            const finalEventObject = await checkForEventUpdates(eventData, existingEvent);
            
            if (finalEventObject) {
                // Update the event in Google Calendar
                const event = {
                    summary: eventData["Name of the event"] || "Untitled Event",
                    location: eventData["Date, Time, Venue"].Venue || "",
                    description: eventData["Descriptive Summary"] || "No description available",
                    start: {
                        dateTime: moment(`${eventData["Date, Time, Venue"].Date} ${eventData["Date, Time, Venue"].Time.split(' - ')[0]}`, "YYYY-MM-DD h:mm A").format("YYYY-MM-DDTHH:mm:ssZ"),
                        timeZone: 'Asia/Kolkata',
                    },
                    end: {
                        dateTime: moment(`${eventData["Date, Time, Venue"].Date} ${eventData["Date, Time, Venue"].Time.split(' - ')[1] || eventData["Date, Time, Venue"].Time.split(' - ')[0]}`, "YYYY-MM-DD h:mm A").format("YYYY-MM-DDTHH:mm:ssZ"),
                        timeZone: 'Asia/Kolkata',
                    },
                    attendees: [{ email: fromEmail }],
                    extendedProperties: {
                        private: {
                            emailSource: fromEmail,
                            threadId: threadId
                        },
                        shared: {
                            emailSource: fromEmail,
                            threadId: threadId
                        }
                    }
                };
                
                const response = await calendar.events.update({
                    calendarId: process.env.GOOGLE_CALENDAR_ID,
                    eventId: existingEvent.id,
                    resource: event
                });
                
                console.log(`Event updated response:`, response.data);
                return response;
            } else {
                console.log('Failed to get final event object from LLM.');
            }
        } else {
            // Create new event
            console.log(`Creating new event with threadId: ${threadId}`);
            const event = {
                summary: eventData["Name of the event"] || "Untitled Event",
                location: eventData["Date, Time, Venue"].Venue || "",
                description: eventData["Descriptive Summary"] || "No description available",
                start: {
                    dateTime: moment(`${eventData["Date, Time, Venue"].Date} ${eventData["Date, Time, Venue"].Time.split(' - ')[0]}`, "YYYY-MM-DD h:mm A").format("YYYY-MM-DDTHH:mm:ssZ"),
                    timeZone: 'Asia/Kolkata',
                },
                end: {
                    dateTime: moment(`${eventData["Date, Time, Venue"].Date} ${eventData["Date, Time, Venue"].Time.split(' - ')[1] || eventData["Date, Time, Venue"].Time.split(' - ')[0]}`, "YYYY-MM-DD h:mm A").format("YYYY-MM-DDTHH:mm:ssZ"),
                    timeZone: 'Asia/Kolkata',
                },
                attendees: [{ email: fromEmail }],
                extendedProperties: {
                    private: {
                        emailSource: fromEmail,
                        threadId: threadId
                    },
                    shared: {
                        emailSource: fromEmail,
                        threadId: threadId
                    }
                }
            };
            const response = await calendar.events.insert({
                calendarId: process.env.GOOGLE_CALENDAR_ID,
                resource: event,
            });
            console.log(`Event created: ${response.data.htmlLink}`);
            return response;
        }
    } catch (error) {
        console.log(`Error creating/updating event: ${error}`);
        console.log(`Response: ${error.response ? error.response.data : 'No response'}`);
    }
}

async function processEvent(emailData, fromEmail) {

    const prompt = `You are given the body of an email sent out to a college student of Ashoka University. 
                        Your task is to identify whether or not the email is an event email. 
                        An event is defined as the following - 
                        An event is something that happens or is regarded as happening; an occurrence, especially one of some importance.

                        Some key aspects of what constitutes an event are Change, Specificity, Significance.
                        An event always has a date, time (compulsorily) and a venue (optionally, venue could be 'tbd' or unspecified) associated with it. Moreover, the language
                        in the email corresponds to a that of an event clearly. Note that 'deadlines' are not the same as timings of an events. Look out
                        for differences in date-time mentioned in deadlines v/s for events.
                        Once you have identified it, respond with a tuple. The first item in the tuple is a boolean True or False ONLY. Do not even change the case of the words.
                        If your answer is false, the second item is an empty object. 
                        If you answer is true, the second item is a JSON object containing specifications of the event.
                        Specifications of the event include: 
                        1. Name of the event
                        2. Organising Body (If the event is a collaboration between 2 or more bodies, mention all)
                        3. Date, Time, Venue (If this is a word like 'Today' or 'Tomorrow', then use look at the timestamp of the email mentioning
                        this day to calculate the date of the event from the day and replace appropriately. Words should not appear in the JSON object, only proper dates.)
                        4. A concise descriptive summary of the event
                        Only extract names of organising bodies from the 'From' part provided to you. No other part of the email should be consulted for this. 
                        Moreover the descriptive summary should not involve you elaborating on any terms mentioned in the email. Simply summarise the email content. Do not elaborate or use your knowledge to explain the event at all. 
                        Moreover, when figuring out the venue, look out for the entire venue. For example if the event is 'in front of the mess' then the venue is 'in front of the mess', not just 'mess'. 
                        Similarly, if the event is taking place 'in the mess lawns', the venue is 'the mess lawns', not 'lawns'. Be liberal in selecting the venue, it can be a phrase too, not just a location. Also, the time should be in the 12 hour H:MM format with AM/PM.
                        Example of a valid JSON object is: 
                        {
                            "Name of the event": "AI and Ethics Symposium",
                            "Organising Body": ["Computer Science Department", "Centre for AI Policy"],
                            "Date, Time, Venue": {
                                "Date": "2025-03-15",
                                "Time": "10:00 AM - 4:00 PM",
                                "Venue": "AC-02-LR-011"
                            },
                            "Descriptive Summary": "The AI and Ethics Symposium brings together leading experts, scholars, and students to explore the ethical implications of artificial intelligence. The event includes keynote speeches and poster presentations."
                        }
                        While determining "Time", make sure you NEVER enter any words except time in 12-hour format. Do not use words like "onwards". Only numbers separated by ':' and followed by 'AM' or 'PM' are permissible.
                        Make sure you appropriately close the braces in the JSON object and follow all specifications of how a JSON object should be.
                        Your answer should be ONLY the tuple. No other surrounding words or phrases. Pick up the date of event based on the date, year, month attached here: ${emailData.date}. Give me the time output in the h:mm AM/PM format.
                        The tuple must NOT be enclosed in brackets and there must be no other surrounding characters or words from you. Just write True/False followed by a comma and then the object. No other characters.
                        The email is provided to you below: 
                        Subject: ${emailData.subject} From: ${emailData.fromEmail}
                    Body: ${emailData.body}.`;
    try {
        const result = await model.generateContent(prompt);
        const llmResponse = result.response.text(); 
        console.log(`Here is my response: ${llmResponse}`);

        const match = llmResponse.match(/(True|False),\s*({.*}|\{\})/s);

        if (match) {
            const isEvent = match[1] === 'True';
            let eventObject = match[2];

            try {
                if (typeof eventObject === 'string') {
                    eventObject = JSON.parse(eventObject);
                }

                const responseTuple = [isEvent, eventObject]; 
                // console.log("\nResponse tuple cool.");
                if (isEvent) {
                    // Check for existing event using thread ID
                    const existingEvent = await findExistingEvent(emailData.threadId);
                    if (existingEvent) {
                        console.log(`Found existing event with threadId: ${emailData.threadId}`);
                        // Check for updates on the existing event
                        const finalEventObject = await checkForEventUpdates(emailData, existingEvent);
                        if (finalEventObject) {
                            console.log('Detected changes in the event:');
                            console.log(JSON.stringify(finalEventObject, null, 2));
                            const updatedEvent = applyUpdatesToEvent(existingEvent, finalEventObject);
                            responseTuple[1] = finalEventObject;
                            await sendToGoogleCalendar(responseTuple, fromEmail, emailData.threadId);
                        } else {
                            console.log('Failed to get final event object from LLM.');
                        }
                    } else {
                        sendToGoogleCalendar(responseTuple, fromEmail, emailData.threadId);
                    }
                } else {
                    console.log("\nNot an event.");
                }

            } catch (error) {
                console.log(`Error parsing event object: ${error}`);
            }
        } else {
            console.log("Could not parse LLM response as a tuple");
        }
    } catch (error) {
        console.log(`Error getting response from AI model: ${error}`);
    }
}



// Connect to the IMAP server
imap.connect();