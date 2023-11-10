// Import required Node.js modules and external packages
const express = require("express"); // Express web framework
const app = express(); // Create an Express application
const port = process.env.PORT || 3000; // Define the port to listen on (default is 3000)
const bodyParser = require("body-parser"); // Middleware to parse request bodies
const dotenv = require("dotenv"); // Load environment variables from a .env file
const session = require("express-session"); // Session management middleware
const MongoDBStore = require("connect-mongodb-session")(session); // Store sessions in MongoDB
const cors = require("cors"); // Middleware for handling Cross-Origin Resource Sharing (CORS)
const passport = require("./config/passport-config"); // Import the Passport configuration module
dotenv.config({ path: "../.env" }); // Load environment variables from a .env file
// Require MongoDB configuration
const connectToMongoDB = require("./config/mongodb-config.js");
connectToMongoDB(); // Call the function to connect to MongoDB

// Create a new MongoDBStore instance to store sessions
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions",
});

const cookieParser = require("cookie-parser"); // Middleware for parsing cookies
const { v4: uuidv4 } = require("uuid"); // Generate UUIDs
const threeDays = 3 * 1000 * 60 * 60 * 24; // Define a three-day duration in milliseconds

// Import route handlers for different parts of the application
const websiteRoutes = require("./routes/websiteRoutes.js");
const platformRoutes = require("./routes/platformRoutes.js");

// Configure application settings and middleware

// Set "trust proxy" to enable req.ip and req.ips for secure proxy deployment
app.set("trust proxy", 1);

// Use cookieParser middleware to parse cookies in requests
app.use(cookieParser());

// Configure session middleware to manage user sessions
app.use(
  session({
    secret: process.env.SECRET_KEY, // Session secret key
    store: store, // Session store using MongoDB
    saveUninitialized: false, // Do not save uninitialized sessions
    resave: false, // Do not save unchanged sessions
    cookie: {
      secure: false, // If true, only transmit cookies over HTTPS
      httpOnly: true, // Prevent client-side JavaScript from reading the cookie
      maxAge: threeDays, // Maximum session duration (three days)
    },
  })
);

// Initialize Passport.js and use it for authentication
app.use(passport.initialize());
app.use(passport.session());

// Parse incoming request bodies as JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(
  "/",
  express.static(__dirname + "/public", {
    dotfiles: "ignore", // Ignore dotfiles (e.g., .gitignore)
    etag: false, // Disable ETags for better caching control
    extensions: ["htm", "html"], // Serve HTML files without specifying the extension
    index: false, // Disable directory listing
    maxAge: "2d", // Cache static assets for two days
    redirect: false, // Disable automatic redirect
    setHeaders(res, path, stat) {
      res.set("x-timestamp", Date.now()); // Set custom response header
    },
  })
);

// Use route handlers for website and platform routes
app.use("/", websiteRoutes);
app.use("/platform", ensureAuthenticated, platformRoutes);

// Middleware to ensure the user is authenticated before accessing platform routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/auth/google");
}


// Set the view engine to EJS (Embedded JavaScript)
app.set("view engine", "ejs");

// Route for initiating Google OAuth authentication
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback route after successful Google authentication
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/platform");
  }
);

// Route to log the user out
app.get("/logout", (req, res) => {
  req.logout(function(err) {
    if (err) {
      return next(err); // Handle any errors during logout
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.clearCookie("connect.sid"); // Clear the session cookie
      res.redirect("/");
    });
  });
});

// Default route for handling 404 errors
app.get("*", (req, res) => {
  res.send("error 404");
});

// Start the Express application and listen on the specified port
app.listen(port, () => {
  console.log("Listening on port " + port);
});
