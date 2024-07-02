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
const axios=require("axios");
const fs = require('fs');

// Require MongoDB configuration
const connectToMongoDB = require("./config/mongodb-config.js");
connectToMongoDB(); // Call the function to connect to MongoDB
const whitelist = JSON.parse(fs.readFileSync('../whitelist.json'));

// Create a new MongoDBStore instance to store sessions
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions",
});

//

const axiosConfig = {
  headers: {
    'Content-Type': 'application/json',
    // Include authentication headers if required by your Strapi API
    'Authorization': `Bearer ${process.env.STRAPI_API_KEY}`,
  },
};
const apiUrl = process.env.STRAPI_API_URL;

//

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

var returnTo="/platform";
// Use route handlers for website and platform routes
app.use("/", websiteRoutes);
app.use("/platform", ensureAuthenticated, putImage, ensureIsStudent, ensureIsNotBlocked, platformRoutes);

// Middleware to ensure the user is authenticated before accessing platform routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  returnTo = req.originalUrl;
  res.redirect("/auth/google");
}

// Define a middleware function for image url
function putImage(req, res, next) {
  // Assuming you have a user object or user data available after authentication
  if (req.user) {
    // Fetch the user's picture
    const userPicture = req.user._json.picture;
    res.locals.imageUrl = encodeURI(userPicture);
    next();
    // Make the GET request to fetch data
  }
}


// Define a middleware function for ensuring a user is not blocked
function ensureIsNotBlocked(req, res, next) {
  // Assuming you have a user object or user data available after authentication
  if (req.user) {
    // Fetch the user's data based on the email or any other unique identifier
    const userEmail = req.user._json.email;

    // Make the GET request to fetch data
    axios.get(`${apiUrl}/users?filters[email][$eqi]=${userEmail}`, axiosConfig)
      .then(response => {
        // Access the response data
        const responseData = response.data[0];

        // Check if the user is blocked
        if (responseData && responseData.blocked) {
          // The user is blocked, so you can take action as needed (e.g., redirect or respond with an error)
          return res.render("platform/pages/blocked",{reason:responseData.reason_blocked || ""});
        }

        // User is not blocked, continue to the next middleware
        next();
      })
      .catch(error => {
        // Handle errors, e.g., network errors or API response errors
        console.error('Error fetching data:', error);
        // Optionally, you can respond with an error here
        res.status(500).send("Internal server error");
      });
  } else {
    // User is not authenticated, so you may want to handle that case as well
    res.status(401).send("User is not authenticated");
  }
}

// Define a middleware function for image url
function ensureIsStudent(req, res, next) {
  // Assuming you have a user object or user data available after authentication
  if (req.user) {
    const userEmail = req.user._json.email;
    if((userEmail && userEmail.includes('_')) || userEmail.includes("ministry") || userEmail.includes("campus.life") ||   whitelist.includes(userEmail) || true){
      next();
    }else{
      res.render("platform/pages/not-student")
    }
  } else {
    // User is not authenticated, so you may want to handle that case as well
    res.status(401).send("User is not authenticated");
  }
}

// Set the view engine to EJS (Embedded JavaScript)
app.set("view engine", "ejs");

// Route for initiating Google OAuth authentication
app.get(
  "/auth/google",
  passport.authenticate("google", { hd:'ashoka.edu.in',scope: ["profile", "email"] })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      const endpoint = '/users';

      // Function to create a user in the Strapi /users collection
      const createUserInStrapi = async (userData) => {
        try {
          const response = await axios.post(`${apiUrl}${endpoint}`, userData, axiosConfig);
          console.log('User created successfully:', response.data);
        } catch (error) {
          console.error('Error creating user:', error);
        }
      };
      // find the text between the underscore and the @, and capitalise it
      batch=(req.user._json.email.match(/_(.*?)@/) || [])[1]?.toUpperCase() || "";
      username=req.user._json.name.length>2?req.user._json.name:req.user._json.name.padStart(3, ' ');
      const userData = {
        email: req.user._json.email,
        username: username,
        profile_url: req.user._json.picture,
        password: "XXXXXXXXXXX",
        role: 1,
        confirmed: req.user._json.email_verified,
        batch:batch
      };


      // Check if a user with the same email exists
      const response1 = await axios.get(`${apiUrl}${endpoint}?filters[email][$eqi]=${req.user._json.email}`, axiosConfig);
      const response2 = await axios.get(`${apiUrl}${endpoint}?filters[username][$eqi]=${username}`, axiosConfig);
      // console.log(req.user._json.email, response)
      if (!response1.data || response1.data.length === 0) {
        // Create a new user if no matching user found
        if(!response2.data || response2.data.length === 0){
          await createUserInStrapi(userData);
        }else{
          userData.username=userData.username+" "+Math.floor(Math.random() * 100) + 1;
          await createUserInStrapi(userData);
        }
      } else {
        console.log("Updating user...");
      }

      res.redirect(returnTo);
    } catch (error) {
      console.error('An error occurred:', error);
      res.redirect("/");
    }
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
