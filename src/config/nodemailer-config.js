// passport-config.js
const dotenv = require("dotenv"); // Load environment variables from a .env file
dotenv.config({ path: ".././.env" }); // Load environment variables from a .env file
const nodemailer = require('nodemailer');

// Create a SMTP transporter object
const transporterSG = nodemailer.createTransport({
    service: 'gmail',
    
      auth: {
        user: process.env.SGMAIL_ID,
        pass: process.env.SGMAIL_PWD,
      },
    });
  
// Create a SMTP transporter object
const transporterTECH = nodemailer.createTransport({
    service: 'gmail',
    
      auth: {
        user: process.env.TECHMAIL_ID,
        pass: process.env.TECHMAIL_PWD,
      },
    });
  
module.exports = {transporterSG,transporterTECH};

  
  