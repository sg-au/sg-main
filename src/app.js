const express=require("../node_modules/express");
const app=express();
const port=process.env.PORT || 3000;
const bodyParser=require("../node_modules/body-parser");
const fs = require('fs');
const ejs=require("../node_modules/ejs");
const mongoose = require('mongoose');
const axios = require('axios');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require("../node_modules/cookie-parser");
const sessions = require('express-session');
const { v4: uuidv4} = require('uuid');
const cors = require('cors')
const threeDays = 3 * 1000 * 60 * 60 * 24;

const websiteRoutes = require('./websiteRoutes.js');
const platformRoutes = require('./platformRoutes.js');

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(cors());
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { 
        secure: false, // if true only transmit cookie over https
        httpOnly: false, // if true prevent client side JS from reading the cookie
        maxAge: threeDays },
    resave: false 
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/',express.static(__dirname+"/public",
{
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
}));

app.use('/', websiteRoutes); // Mount the routes on '/'
app.use('/platform', ensureAuthenticated, platformRoutes); // Mount the routes on '/platform'

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  // Store the original URL in the session
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/google'); // Redirect to the Google OAuth2 login page
}

// Initialize Passport and session

// REDIRECT_URI='https://toofantalks.com/auth/google/callback';
REDIRECT_URI='http://localhost:3000/auth/google/callback';
// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: '34689862788-r4jamvrmrksp6f1hd3rq7ijkmu0gtbns.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: REDIRECT_URI,
  }, (accessToken, refreshToken, profile, done) => {
    // The user's Google profile information is available in the 'profile' object      
    return done(null, profile);
  }));
  
  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user, done) => {
    done(null, user);
  });



app.set('view engine', 'ejs');

app.get('/auth/google', passport.authenticate('google', { hd: 'ashoka.edu.in',scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
(req, res) => {
   // Function to update a user by email
   
}
);
app.listen(port, function(req,res){
    console.log("listening on port "+ port)
});
// EMAIL Template: https://github.com/mailpace/templates/blob/main/dist/confirmation.html

app.get('*', (req, res) => {
    res.send("error 404");
});
