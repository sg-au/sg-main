// passport-config.js
const dotenv = require("dotenv"); // Load environment variables from a .env file
dotenv.config({ path: ".././.env" }); // Load environment variables from a .env file
const nodemailer = require('nodemailer');

// Create a SMTP transporter object
const transporter = nodemailer.createTransport({
    service: 'gmail',
    
      auth: {
        user: process.env.SGMAIL_ID,
        pass: process.env.SGMAIL_PWD,
      },
    });
  
module.exports = transporter;

  
  