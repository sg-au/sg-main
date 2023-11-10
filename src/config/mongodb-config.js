// mongodb-config.js
const dotenv = require("dotenv"); // Load environment variables from a .env file
dotenv.config({ path: ".././.env" }); // Load environment variables from a .env file

const mongoose = require("mongoose");

function connectToMongoDB() {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection;

  db.on("error", (error) => {
    console.error("MongoDB connection error:", error);
  });

  db.once("open", () => {
    console.log("Connected to MongoDB for Session Store");
  });
}

module.exports = connectToMongoDB;
