const Imap = require('imap');
const { simpleParser } = require('mailparser');
const dotenv = require('dotenv');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const util = require('util');
const moment = require('moment');
dotenv.config();

const { default: fetch, Headers } = require('node-fetch');
globalThis.fetch = fetch;
globalThis.Headers = Headers;

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.APP_PASSWORD;
const IMAP_SERVER = "imap.gmail.com";
const IMAP_PORT = 993;
const STRAPI_API_TOKEN = process.env.STRAPI_API_KEY;
const STRAPI_URL = process.env.STRAPI_API_URL + '/calendar-events';
const genAI = new GoogleGenerativeAI('AIzaSyDizK_MmGhXjOSBleHy2rI-sbV20l2j1_A');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

//Create Imap connection
const imapConfig = {
    user: EMAIL,
    password: PASSWORD,
    host: IMAP_SERVER,
    port: IMAP_PORT,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    keepalive: true,
    authTimeout: 30000 
};

function createImapConnection(imapConfig) {
    return new Imap(imapConfig);
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

const imap = new Imap(imapConfig);
imap.connect();

imap.once('error', (err) => {
    console.error('IMAP Error:', err);
    if (err.source === 'timeout') {
        console.log('Reconnecting in 10 seconds...');
        setTimeout(() => imap.connect(), 10000); // Retry connection
    }
});

imap.once('end', () => {
    console.log('IMAP Connection closed. Reconnecting...');
    setTimeout(() => imap.connect(), 5000); // Reconnect after 5 seconds
});

function openInbox(imap, cb) {
    const labelName = 'test';  // Change this to text for some other label
    imap.openBox(labelName, false, cb);
}

imap.once('ready', function () {
    openInbox(imap, (err, box) => {
        if (err) throw err;
        console.log(`Listening for new emails in ${box.name}...`);

        setInterval(() => {
            console.log('Periodically checking for new emails...');
            checkEmails();
        }, 60000); // 60 seconds

        imap.on('mail', function () {
            console.log('New email detected...');
            checkEmails();
        });
    });
});

// ISSUE: It is sending eventData twice due to some asynchronity issue
function checkEmails() {
    imap.search(['UNSEEN'], (err, results) => {
        if (err || !results.length) return;

        const fetch = imap.fetch(results, { 
            bodies: ['HEADER.FIELDS (SUBJECT FROM REFERENCES IN-REPLY-TO MESSAGE-ID)', 'TEXT'], 
            markSeen: true 
        });

        let processed = false;

        fetch.on('message', (msg) => {
            let emailData = {
                inReplyTo: '',
                messageId: '',
                fromEmail: '',
                body: '',
                references: '',
                subject: ''
            };

            msg.on('body', (stream, info) => {
                if (info.which === 'HEADER.FIELDS (SUBJECT FROM REFERENCES IN-REPLY-TO MESSAGE-ID)') {
                    let buffer = '';
                    stream.on('data', (chunk) => {
                        buffer += chunk.toString('utf8');
                    });
                    stream.on('end', () => {
                        const header = Imap.parseHeader(buffer);
                        emailData.inReplyTo = header['in-reply-to']?.[0] || '';
                        emailData.messageId = header['message-id']?.[0] || '';
                        emailData.references = header['references']?.[0] || '';
                        emailData.subject = header['subject']?.[0] || '';
                        emailData.fromEmail = header.from?.[0] || '';
                        emailData.fromEmail = emailData.fromEmail.match(/<(.+)>/)?.[1] || emailData.fromEmail;
                        console.log("Header processed");
                        console.log("From email: ", emailData.fromEmail);
                    });
                } 
                else if (info.which === 'TEXT') {
                    simpleParser(stream, (err, parsed) => {
                        if (err) {
                            console.error('Parsing error:', err);
                            return;
                        }
                        emailData.body = parsed.text || '';
                        console.log("Email data: ", emailData);
                        const references = emailData.references;
                        const terms = references.match(/<([^>]+)>/g);
                            if (terms) {
                            for (const term of terms) {
                                const uid = emailData.messageId
                                    .replace(/[^a-zA-Z0-9]/g, '') 
                                    .replace(/mailgmailcom$/, ''); 
                                console.log("\nUID: ", uid);

                                if (eventExistsInStrapiWithID(uid)) {
                                const data = getDataFromStrapi(uid);
                                console.log(`Data for ${uid}:`, data);
                                // Concatenate strapi data with email Data, ask LLM to come up with updated event details
                                const compiledData = {
                                    message: `These are the old event details: ${JSON.stringify(data, null, 2)}\n\nLook for changes in content given to you below and give a response accordingly, following all previously mentioned instructions: ${JSON.stringify(emailData, null, 2)}`
                                };
                                processEvent(compiledData, emailData.messageId, emailData.fromEmail);
                                
                                }
                            }
                            }
                        if (references != '') // Means it is not a reply email that corresponds to an event
                        {}
                        else if (emailData.references == '') // Means it is a standalone email, the first of its kind 
                        {
                            console.log("\nHERE!")
                            processEvent(emailData, emailData.messageId, emailData.fromEmail);
                            
                        }
                    });
                }
            });

            msg.once('end', () => {
                
            });

            msg.once('end', () => {
                
                console.log('Finished processing email');
            });
        });

        fetch.once('error', (err) => console.error('Fetch error:', err));
    });
}

// The two below functions can be combined into one easily
async function eventExistsInStrapiWithID(uid) {
    const headers = {
        "Authorization": `Bearer ${STRAPI_API_TOKEN}`,
        "Content-Type": "application/json",
        "uid": uid
    };

    const response = await axios.get(STRAPI_URL, { headers });
    return response.data.data.length > 0; //True if exists, false if otherwise
}

// Working
async function getDataFromStrapi(uid) {
    const headers = {
        "Authorization": `Bearer ${STRAPI_API_TOKEN}`,
        "Content-Type": "application/json"
    };

    const response = await axios.get(`${STRAPI_URL}?filters[uid][$eq]=${uid}`, { headers });
    //console.log(response.data.data);
    console.log(response.data.data);
    const id = getIDfromUID(uid);
    deleteEvent(id);
}

// Working
async function getIDfromUID(uid) {
    const headers = {
        "Authorization": `Bearer ${STRAPI_API_TOKEN}`,
        "Content-Type": "application/json"
    };

    const response = await axios.get(`${STRAPI_URL}?filters[uid][$eq]=${uid}`, { headers });
    return response.data.data[0].id;
}

// Working
async function deleteEvent(eventID){
    console.log(eventID);
    const headers = {
        "Authorization": `Bearer ${STRAPI_API_TOKEN}`,
        "Content-Type": "application/json"
    };
    try {
    const response = await axios.delete(`${STRAPI_URL}/${eventID}`, { headers });
    console.log(`Event with UID ${uid} deleted.`);
    }
    catch(error) {
        console.log("Error in deleting strapi event: ", error);
    }
}

//Working
//Send to LLM -> get response -> sendToStrapi
async function processEvent(emailData, messageID, fromEmail) {
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
            console.log("\nResponse tuple cool.");
            if (isEvent) 
                sendToStrapi(responseTuple, messageID, fromEmail);
            else    
                console.log("\nNot an event.");

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

// Send to Strapi function, used by processEvent
async function sendToStrapi(responseTuple, messageID, fromEmail) {
    // Extract the event data from the tuple
    const eventData = responseTuple[1];  // The second element is the JSON content
    console.log("\nEvent Data: ", eventData);
  
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
      // Strapi has constraints on the UID format, so we are following those.
      const uid = messageID
        .replace(/[^a-zA-Z0-9]/g, '') // Remove all special characters
        .replace(/mailgmailcom$/, ''); // Remove "mailgmailcom" if it exists at the end

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
          "allDay": false , // Add the allDay field
          "uid": uid,
          "host": fromEmail
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




