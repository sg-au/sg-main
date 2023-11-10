const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require("body-parser");
const passport = require("passport");
const dotenv = require("dotenv");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const cors = require("cors");

dotenv.config({ path: "../.env" });

// Connect to your MongoDB database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a new MongoDBStore instance
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions",
});

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const threeDays = 3 * 1000 * 60 * 60 * 24;

const websiteRoutes = require("./websiteRoutes.js");
const platformRoutes = require("./platformRoutes.js");

app.set("trust proxy", 1);
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SECRET_KEY,
    store: store,
    saveUninitialized: false,
    resave: false,
    cookie: {
      secure: false, // if true, only transmit cookie over https
      httpOnly: true, // if true, prevent client-side JS from reading the cookie
      maxAge: threeDays,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  "/",
  express.static(__dirname + "/public", {
    dotfiles: "ignore",
    etag: false,
    extensions: ["htm", "html"],
    index: false,
    maxAge: "2d",
    redirect: false,
    setHeaders(res, path, stat) {
      res.set("x-timestamp", Date.now());
    },
  })
);

app.use("/", websiteRoutes);
app.use("/platform", ensureAuthenticated, platformRoutes);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/auth/google");
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.set("view engine", "ejs");

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/platform");
  }
);

app.get("/logout", (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.clearCookie("connect.sid"); // Clear the session cookie
      res.redirect("/");
    });
  });
});

app.get("*", (req, res) => {
  res.send("error 404");
});

app.listen(port, () => {
  console.log("Listening on port " + port);
});
