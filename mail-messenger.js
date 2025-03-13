const Imap = require('imap');
const { simpleParser } = require('mailparser');
const axios = require('axios');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const util = require('util');
const moment = require('moment');

const { default: fetch, Headers } = require('node-fetch');
globalThis.fetch = fetch;
globalThis.Headers = Headers;

// Load environment variables
dotenv.config();

const STRAPI_API_TOKEN = process.env.STRAPI_API_KEY;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.APP_PASSWORD;
const IMAP_SERVER = "imap.gmail.com";
const IMAP_PORT = 993;
const RECONNECT_DELAY = 4000; // 4 seconds delay for reconnection

// Strapi configuration
const STRAPI_URL = process.env.STRAPI_API_URL + '/calendar-events';

// Initialize Google AI
const genAI = new GoogleGenerativeAI('AIzaSyAgMK_EkfiYjVWlsEnC9em6gFnlR2zEAQM');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

let emailData = [];
let imapReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function cleanText(text) {
  return text.replace(/[^a-zA-Z0-9]/g, '_');
}

function createImapConnection() {
  return new Imap({
    user: EMAIL,
    password: PASSWORD,
    host: IMAP_SERVER,
    port: IMAP_PORT,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    keepalive: true,
    authTimeout: 30000 // Increase auth timeout to 30 seconds
  });
}

function handleImapError(imap, error) {
  console.log(`IMAP Error: ${error}`);
  
  // Only attempt to reconnect if we haven't reached the maximum number of attempts
  if (imapReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    imapReconnectAttempts++;
    console.log(`Connection lost. Attempting to reconnect (attempt ${imapReconnectAttempts} of ${MAX_RECONNECT_ATTEMPTS})...`);
    
    // Close existing connection if it's still active
    try {
      if (imap && imap.state !== 'disconnected') {
        imap.end();
      }
    } catch (e) {
      console.log(`Error ending existing connection: ${e.message}`);
    }
    
    // Wait before reconnecting
    setTimeout(() => {
      console.log(`Reconnecting to IMAP server...`);
      checkInbox();
    }, RECONNECT_DELAY);
  } else {
    console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
    // Reset the counter after giving up
    setTimeout(() => {
      imapReconnectAttempts = 0;
    }, 60000); // Reset after 1 minute
  }
}

function checkInbox() {
  try {
    const imap = createImapConnection();

    // Opens the inbox at the specified labelName
    function openInbox(cb) {
      const labelName = 'test';  // Change this to text for some other label
      imap.openBox(labelName, false, (err, box) => {
        if (err) {
          console.log(`Error opening label: ${err.message}`); 
          handleImapError(imap, err);
          return;
        }
        cb(null, box);
      });
    }

    imap.once('ready', function() {
      // Reset reconnect attempts on successful connection
      imapReconnectAttempts = 0;
      console.log("Successfully connected to IMAP server");

      openInbox(function(err, box) {
        if (err) {
          handleImapError(imap, err);
          return;
        }

        imap.search(['ALL'], function(err, results) { // change 'ALL' to 'UNSEEN' or 'SEEN' to look for emails under those categories
          if (err) {
            handleImapError(imap, err);
            return;
          }

          if (results.length > 0) {
            console.log(`Found ${results.length} new email(s):`);

            let body = "";
            let originalMsgId = ""; // Stores whether the current email points to a parent email or not
            let prevReferences = ""; // Stores the 'References' of the previous email. if this matches (substring) the references of the current email we know they are part of the same thread
            let msgIds = [];  // This will store the message IDs of the emails in the thread

            const fetch = imap.fetch(results, { bodies: '', struct: true });

            fetch.on('message', function(msg, seqno) {
              msg.on('body', function(stream, info) {
                let buffer = '';

                stream.on('data', function(chunk) {
                  buffer += chunk.toString('utf8');
                });

                stream.on('error', function(err) {
                  console.log(`Error in message stream: ${err}`);
                });

                stream.once('end', function() {
                  simpleParser(buffer)
                    .then(async (parsed) => {
                      const subject = parsed.subject;
                      const from = parsed.from.text;
                      const msgId = parsed.messageId;
                      const references = parsed.references ?
                        (Array.isArray(parsed.references) ? parsed.references.join(' ') : parsed.references) 
                        : null; 
                      console.log("\nPrevious references: ", prevReferences);
                      console.log("\nReferences: ",references);
                      // Track message ID in case of threading
                      if (references !== null && prevReferences !== null) { // Conditions that the current email points to a parent email
                        // Originally prrevReferences is "" so it works for the first result too
                        console.log("\nHERE!");
                        originalMsgId = "Found";
                        prevReferences = (references !== null) ? references : ""; // set current references as Previous References for the next iteration, if the email does not contain references then this becomes null
                        console.log("\nPrev References set as: ", prevReferences);
                        msgIds.push(msgId);  // Add the current msgId to the list if it's part of a thread - we maintain this for event ID
                      } else {
                        originalMsgId = null;
                        msgIds = [msgId];  // Start a new list with the current msgId
                      }

                      console.log(`Subject: ${subject}`);
                      console.log(originalMsgId);

                      // Get message body
                      body = (parsed.text || '') + body;

                      // Handle threaded emails
                      if (originalMsgId === "Found") {
                        body = `This is a thread email. Look out for changes in the original event based on the time when the email was sent. 
                        Threads also by default contain the portion of the email they are written in reply to. This content begins in the following way: On Sat, Nov 16, 2024 at 10:19 AM Eeshto: The Gaming Society <eeshto@ashoka.edu.in> wrote: 
                        i.e. it is a timestamp followed by the sender. And the body of this email is preceeded by the characters > . So note that this is simply a reference to the previous / any of the previous
                        emails and so do not consider this content as an update to the event. Ignore it.\n` + `Subject: ${subject}` + body;
                        return;
                      }

                      // Process standalone emails - this means they are not 'inReplyTo' any emails.
                      if (!parsed.inReplyTo) {
                        console.log("\n\nBODY: ", body);
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
                        Similarly, if the event is taking place 'in the mess lawns', the venue is 'the mess lawns', not 'lawns'. Be liberal in selecting the venue, it can be a phrase too, not just a location.
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
                        Make sure you appropriately close the braces in the JSON object and follow all specifications of how a JSON object should be.
                        Your answer should be ONLY the tuple. No other surrounding words or phrases.
                        The tuple must NOT be enclosed in brackets and there should be no other surrounding characters or words from you. Just write True/False followed by a comma and then the object. No other characters.
                        The email is provided to you below: 
                        Subject: ${subject} From: ${from}
                        Body: ${body}.`;
                        
                
                        try {
                          // (using proper Node.js HTTP client):
                        const result = await model.generateContent(prompt);
                        const llmResponse = await result.response.text(); // Add 'await'
                          console.log(`Here is my response: ${llmResponse}`);

                          // Parse tuple from response using regex
                          const match = llmResponse.match(/(True|False),\s*({.*}|\{\})/s);

                          if (match) {
                            const isEvent = match[1] === 'True';
                            let eventObject = match[2];

                            try {
                              // Parse event object if it's a string
                              if (typeof eventObject === 'string') {
                                eventObject = JSON.parse(eventObject);
                              }

                              const responseTuple = [isEvent, eventObject, msgIds]; // Add msgIds as the third item
                              console.log("Response tuple: ", responseTuple);

                              if (responseTuple[0]) {  // If it's an event
                                sendToStrapi(responseTuple);
                              }

                              emailData.push({
                                "Subject": subject,
                                "From": from,
                                "Body Summary": body.length > 200 ? body.substring(0, 200) + "..." : body,
                                "LLM Response (True/False)": responseTuple[0],
                                "LLM Object Returned": responseTuple[1],
                                "Message IDs": responseTuple[2],  // Add message IDs to the data
                              });
                            } catch (error) {
                              console.log(`Error parsing event object: ${error}`);
                            }
                          } else {
                            console.log("Could not parse LLM response as a tuple");
                          }
                            // Reset body for the next iteration
                          body = "";
                        } catch (error) {
                          console.log(`Error getting response from AI model: ${error}`);
                        }
                      }
                    })
                    .catch(err => {
                      console.log(`Error parsing email: ${err}`);
                    });
                });
              });

              msg.once('error', function(err) {
                console.log(`Error processing message: ${err}`);
              });
            });

            fetch.once('error', function(err) {
              console.log(`Fetch error: ${err}`);
              handleImapError(imap, err);
            });

            fetch.once('end', function() {
              console.log('Done fetching all messages!');
              imap.end();
            });
          } else {
            console.log("No new emails.");
            imap.end();
          }
        });
      });
    });

    imap.once('error', function(err) {
      handleImapError(imap, err);
    });

    imap.once('close', function() {
      console.log('IMAP connection closed');
    });

    imap.once('end', function() {
      console.log('IMAP connection ended');
    });

    // Set up a timeout for connection
    const connectionTimeout = setTimeout(() => {
      if (imap.state !== 'connected') {
        console.log('Connection timeout. Attempting to reconnect...');

        try {
          imap.end();
        } catch (e) {
          console.log(`Error ending timed-out connection: ${e.message}`);
        }

        handleImapError(imap, new Error('Connection timeout'));
      }
    }, 30000); // 30 second timeout

    // Clear the timeout when connected
    imap.once('ready', () => {
      clearTimeout(connectionTimeout);
    });

    imap.connect();
  } catch (e) {
    console.log(`Setup error: ${e}`);

    // Attempt to reconnect after delay
    setTimeout(() => {
      console.log(`Attempting to reconnect after setup error...`);
      checkInbox();
    }, RECONNECT_DELAY);
  }
}

async function sendToStrapi(responseTuple) {
  // Extract the event data from the tuple
  const eventData = responseTuple[1];  // The second element is the JSON content

  // Validate event_data structure
  if (typeof eventData !== 'object') {
    console.log("Invalid eventData: Not an object");
    return;
  }

  if (!eventData["Date, Time, Venue"] || typeof eventData["Date, Time, Venue"] !== 'object') {
    console.log("Invalid eventData: Missing or incorrect 'Date, Time, Venue' field");
    return;
  }

  // Extract date and time
  const dateStr = eventData["Date, Time, Venue"].Date || "TBD";
  const timeStr = eventData["Date, Time, Venue"].Time || "TBD";
  const venue = eventData["Date, Time, Venue"].Venue || "TBD";  // Default to "TBD" if venue is missing

  // Handle time (single timestamp or range)
  let startTimeStr, endTimeStr;
  if (timeStr.includes(" - ")) {
    [startTimeStr, endTimeStr] = timeStr.split(" - ");
  } else {
    startTimeStr = timeStr;
    endTimeStr = timeStr;  // Use the same time for start and end if no range is provided
  }

  // Parse date and time into datetime objects
  try {
    // Combine date and time into a single string
    const startDatetimeStr = `${dateStr} ${startTimeStr}`;
    const endDatetimeStr = `${dateStr} ${endTimeStr}`;

    // Parse into datetime objects using moment
    const startDatetime = moment(`${startDatetimeStr}`, "YYYY-MM-DD h:mm A");
    const endDatetime = moment(`${endDatetimeStr}`, "YYYY-MM-DD h:mm A");

    // Check if parsing was successful
    if (!startDatetime.isValid() || !endDatetime.isValid()) {
      throw new Error("Invalid date/time format");
    }

    // Convert to ISO 8601 format
    const startIso = startDatetime.toISOString();
    const endIso = endDatetime.toISOString();

    // Transform the event data to match Strapi schema
    const strapiData = {
      "data": {
        "title": eventData["Name of the event"] || "Untitled Event",
        "description": eventData["Descriptive Summary"] || "No description available",
        "kind": "event",  // You can modify this based on your needs
        "start": startIso,  // Use ISO 8601 format
        "end": endIso,  // Use ISO 8601 format
        "venue": venue,
        "display": "block",  // You can modify this based on your needs
        "color": "#4a5568",  // You can modify this based on your needs
        "allDay": false  // Add the allDay field
      }
    };

    console.log(`Strapi Data: ${util.inspect(strapiData, false, null)}`);

    // Send data to Strapi
    const headers = {
      "Authorization": `Bearer ${STRAPI_API_TOKEN}`,
      "Content-Type": "application/json"
    };

    try {
      const response = await axios.post(STRAPI_URL, strapiData, { headers });
      console.log(`Successfully sent event to Strapi: ${eventData["Name of the event"] || "Untitled Event"}`);
      return response;
    } catch (error) {
      console.log(`Error sending to Strapi: ${error}`);
      console.log(`Response: ${error.response ? error.response.data : 'No response'}`);
    }
  } catch (e) {
    console.log(`Error parsing date or time: ${e}`);
    return;
  }
}

// Execute once
checkInbox();

// Uncomment to run periodically
// setInterval(() => {
//   console.log("Checking for new emails...");
//   checkInbox();
// }, 60000);  // Check every 60 seconds

