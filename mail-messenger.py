import imaplib
import email
import requests
from email.header import decode_header
import time
from dotenv import load_dotenv
import os
from groq import Groq
import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()
STRAPI_API_TOKEN = os.getenv('STRAPI_API_TOKEN')
#check is emails are being read multiple times, if yes, mark email as read

client = Groq(
    api_key= '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', 
)

model = ChatGoogleGenerativeAI(model="gemini-1.0-pro", google_api_key='AIzaSyBpD8n0V6-9MiBPsJEM9ymX0G0awBb-V1Y')

EMAIL = os.getenv('EMAIL')
PASSWORD = os.getenv('APP_PASSWORD')
IMAP_SERVER = "imap.gmail.com"
IMAP_PORT = 993

# Add Strapi configuration
STRAPI_URL = os.getenv('STRAPI_API_URL')+'/calendar-events'
# STRAPI_URL = "http://localhost:1337/api/calendar-events"

email_data = []

def clean_text(text):
    return "".join(c if c.isalnum() else "_" for c in text)

def check_inbox():
    global email_data
    try:
        # Connect to the server
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        mail.login(EMAIL, PASSWORD)

        # Select the mailbox to monitor
        mail.select('"test"')

        # Search for unread emails
        status, messages = mail.search(None, 'ALL')
        email_ids = messages[0].split()

        # If you want to reverse the order of traversal: email_ids = email_ids[::-1]

        if email_ids:
            print(f"Found {len(email_ids)} new email(s):")
            body = ""
            original_msg_id = ""
            prev_references = ""
            for email_id in email_ids:
                # Fetch the email
                res, msg = mail.fetch(email_id, "(RFC822)")
                for response_part in msg:
                    if isinstance(response_part, tuple):
                        # Parse the email
                        msg = email.message_from_bytes(response_part[1])
                        subject, encoding = decode_header(msg["Subject"])[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding if encoding else "utf-8")
                        from_ = msg.get("From")
                        msg_id = msg.get("Message-ID")
                        references = msg.get("References")
                        
                        if (references != None and prev_references in references):
                            original_msg_id = "Found"
                        else:
                            original_msg_id = None    
                        
                        # in_reply_to = msg.get("In-Reply-To")

                        print(f"Subject: {subject}")
                        # print(references)
                        # print(f"Original message ID: {original_msg_id}"+"\n\n")

                        if msg.is_multipart():
                            for part in msg.walk():
                                content_type = part.get_content_type()
                                content_disposition = str(part.get("Content-Disposition"))
                                if content_type == "text/plain" and "attachment" not in content_disposition:
                                    charset = part.get_content_charset() or "ISO-8859-1"  # Default fallback
                                    body = part.get_payload(decode=True).decode(charset, errors="replace")  + body # Replace invalid characters
                                    break
                        else:
                            charset = msg.get_content_charset() or "ISO-8859-1"
                            body = msg.get_payload(decode=True).decode(charset, errors="replace") + body

                        # print(body)
                        # print("\n\n")
                        # If the below code block is getting executed it means that there is at least one email such that the current email is written in reply to that
                        if (original_msg_id == "Found"):
                            # print('Here :))))')
                            # We append the body of the current email consecutively as long as the thread continues. Each time, we give an appropriate disclaimer to the LLM.
                            # This is necessary only to tackle the edge case that in a reply email, the sender deletes the contents of the original email (it is still tagged as a reply email)
                            body = f"""This is a thread email. Look out for changes in the original event based on the time when the email was sent. 
                            Threads also by default contain the portion of the email they are written in reply to. This content begins in the following way: On Sat, Nov 16, 2024 at 10:19 AM Eeshto: The Gaming Society <eeshto@ashoka.edu.in> wrote: 
                            i.e. it is a timestamp followed by the sender. And the body of this email is preceeded by the characters > . So note that this is simply a reference to the previous / any of the previous
                            emails and so do not consider this content as an update to the event. Ignore it."""+"\n"+f"Subject: {subject}"  + body
                            prev_references = references
                            continue
                    
                        # If we have reached the end of subsequent shared references, we can pass the complete String to the LLM
                        # Or simply if the email is stand alone and has to references linked to it
                        if (msg.get("In-Reply-To") == None and references == None):
                            # print(body)
                            response = model.invoke(
                            f"""You are given the body of an email sent out to a college student of Ashoka University. 
                                Your task is to identify whether or not the email is an event email. 
                                An event is defined as the following - 
                                An event is something that happens or is regarded as happening; an occurrence, especially one of some importance.

                                Some key aspects of what constitutes an event are Change, Specificity, Significance.
                                An event always has a date, time (compulsorily) and a venue (optionally, venue could be 'tbd' or unspecified) associated with it. Moreover, the language
                                in the email corresponds to a that of an event clearly. Note that 'deadlines' are not the same as timings of an events. Look out
                                for differences in date-time mentioned in deadlines v/s for events.
                                Once you have identified it, respond with a tuple. The first item in the tuple is a boolean True or False ONLY. Do not even change the case of the words. It has to be True/False.
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
                                {{
                                    "Name of the event": "AI and Ethics Symposium",
                                    "Organising Body": ["Computer Science Department", "Centre for AI Policy"],
                                    "Date, Time, Venue": {{
                                        "Date": "2025-03-15",
                                        "Time": "10:00 AM - 4:00 PM",
                                        "Venue": "AC-02-LR-011"
                                    }},
                                    "Descriptive Summary": "The AI and Ethics Symposium brings together leading experts, scholars, and students to explore the ethical implications of artificial intelligence. The event includes keynote speeches and poster presentations."
                                }}
                                Make sure you appropriately close the braces in the JSON object and follow all specifications of how a JSON object should be.
                                Your answer should be ONLY the tuple. No other surrounding words or phrases. The tuple must NOT be enclosed in brackets. I repeat, the tuple must NOT be enclosed in brackets and there should be no other surrounding characters or words from you. Just write True/False followed by a comma and then the object. No other characters.
                                The email is provided to you below: 
                                Subject: {subject} From: {from_}
                                Body: {body}."""
                            )

                            llm_response = response.content
                            print(f"Here is my response: {llm_response}")
                            response_tuple = eval(llm_response)  

                            if response_tuple[0]:  # If it's an event
                                send_to_strapi(response_tuple[1])
                            
                            email_data.append({
                                "Subject": subject,
                                "From": from_,
                                "Body Summary": body[:200] + "..." if len(body) > 200 else body,
                                "LLM Response (True/False)": response_tuple[0],
                                "LLM Object Returned": response_tuple[1],
                            })
                            # Reset body for the next iteration
                            body = ""

        else:
            print("No new emails.")

        mail.logout()


    except Exception as e:
        # I'm saving it here in the exception block because gemini will throw an error after processing about 20 mails so that's when it gets saved
        if email_data:
            df = pd.DataFrame(email_data)
            df.to_excel("LLM-results-5.xlsx", index=False)
            print("Data saved to LLM-results.xlsx")
        print(f"Error: {e}")

def send_to_strapi(event_data):
    headers = {
        "Authorization": f"Bearer {STRAPI_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Transform the event data to match Strapi schema
    strapi_data = {
        "data": {
            "title": event_data["Name of the event"],
            "description": event_data["Descriptive Summary"],
            "kind": "event",  # You can modify this based on your needs
            "start": event_data["Date, Time, Venue"]["Date"] + "T" + event_data["Date, Time, Venue"]["Time"].split(" - ")[0],
            "end": event_data["Date, Time, Venue"]["Date"] + "T" + event_data["Date, Time, Venue"]["Time"].split(" - ")[1],
            "venue": event_data["Date, Time, Venue"]["Venue"],
            "display": "block",  # You can modify this based on your needs
            "color": "#4a5568"  # You can modify this based on your needs
        }
    }
    
    try:
        response = requests.post(STRAPI_URL, json=strapi_data, headers=headers)
        response.raise_for_status()
        print(f"Successfully sent event to Strapi: {event_data['Name of the event']}")
    except Exception as e:
        print(f"Error sending to Strapi: {e}")

check_inbox()


# # Periodically check the inbox - disabled for testing purposes 
# while True:
#     print("Checking for new emails...")
#     check_inbox()
#     time.sleep(60)  # Check every 60 seconds
