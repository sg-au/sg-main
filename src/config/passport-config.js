// passport-config.js
const dotenv = require("dotenv"); // Load environment variables from a .env file
dotenv.config({ path: ".././.env" }); // Load environment variables from a .env file

const passport = require("passport"); // Passport for authentication
const GoogleStrategy = require("passport-google-oauth20").Strategy; // Passport strategy for Google OAuth

// Configure Google OAuth 2.0 strategy for Passport.js
passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID, // Google OAuth client ID
        clientSecret: process.env.CLIENT_SECRET, // Google OAuth client secret
        callbackURL: process.env.CALLBACK_URL, // Callback URL after Google authentication
      },
      (accessToken, refreshToken, profile, done) => {
        return done(null, profile); // Store the user's profile data
      }
    )
  );
  
  // Serialize and deserialize user information for Passport.js
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });

module.exports = passport;
