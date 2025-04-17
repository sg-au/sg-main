const express = require("express");
const router = express.Router();
const fs = require("fs");
const helpers = require("../config/helperFunctions.js");
const axios = require("axios");
const { google } = require("googleapis");
const { youtube } = require("googleapis/build/src/apis/youtube/index.js");

const axiosConfig = {
  headers: {
    "Content-Type": "application/json",
    // Include authentication headers if required by your Strapi API
    Authorization: `Bearer ${process.env.STRAPI_API_KEY}`,
  },
};

const apiUrl = process.env.STRAPI_API_URL;

router.get("/", async (req, res) => {
  try {
    let organisation = await axios.get(
      `${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`,
      axiosConfig
    );
    organisation = organisation.data[0];
    res.render("organisation/pages/index", {
      organisation: organisation,
    });
  } catch (err) {
    res.send(err);
  }
});

router.get("/organisation-catalogue", async (req, res) => {
  try {
    let organisation = await axios.get(
      `${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&populate=organisations`,
      axiosConfig
    );
    organisation = organisation.data[0];
    let linkedListings = organisation.organisations;    
    res.render("organisation/pages/organisation-catalogue", {
      organisation: organisation,
      linkedListings: linkedListings,
    });
  } catch (err) {
    res.send(err);
  }
});

router.get("/edit-catalogue-listing/:id", async (req, res) => {
  try {    
    let listing = await axios.get(
      `${apiUrl}/organisations/${req.params.id}?populate=profile&populate=circle1_humans&populate=circle2_humans`,
      axiosConfig
    );
    listing = listing.data.data;
    function escapeString(str) {
      if (typeof str !== 'string') return str;
      return str
        .replace(/\\/g, '\\\\')    // Escape backslashes
        .replace(/"/g, '\\"')      // Escape double quotes
        .replace(/\n/g, '\\n')     // Escape newlines
        .replace(/\r/g, '\\r')     // Escape carriage returns
        .replace(/\t/g, '\\t')     // Escape tabs
        .replace(/\f/g, '\\f');    // Escape form feeds
    }
    listing.attributes.description = escapeString(listing.attributes.description);
    listing.attributes.short_description = escapeString(listing.attributes.short_description);
    listing.attributes.induction_description = escapeString(listing.attributes.induction_description);
    linkedOrganisations = listing.attributes.profile.data;    
    const hasAccess = linkedOrganisations.some(org => 
      org.attributes.email === req.user._json.email
    );
    // console.log(listing.attributes.circle1_humans.data);
    if (hasAccess) {
      let users = await axios.get(
        `${apiUrl}/users?pagination[pageSize]=4000`,
        axiosConfig
      );
      
      // Extract only the required user data
      const simplifiedUsers = users.data.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username
      }));
      
      res.render("organisation/pages/edit-catalogue-listing", {            
        listing: listing,
        users: simplifiedUsers,
      });
    } else {
      res.send("error 404");
    }
  } catch (err) {
    res.send(err);
  }
});

router.post("/update-catalogue-listing", async (req, res) => {  
  try {
      const listingId = req.body.id;
      let circle1HumansData = [];
      let circle2HumansData = [];
      let circle1UserIds = [];
      
      try {
          if (req.body.circle1_humans) {
            circle1HumansData = JSON.parse(req.body.circle1_humans);
            circle1UserIds = circle1HumansData.map(user => user.id);
          }
          
          if (req.body.circle2_humans) {
            circle2HumansData = JSON.parse(req.body.circle2_humans);
          }
      } catch (jsonError) {
          console.error("Error parsing JSON data:", jsonError);
          return res.status(400).send("Failed to parse user data");
      } 
      
      let induction_end = null;
      if (req.body.induction === 'on' && req.body.induction_end) {
          // Use the date string directly from the input - it will be in ISO format from datetime-local input
          induction_end = req.body.induction_end;
      }

      const { data: existingListing } = await axios.get(`${apiUrl}/organisations/${listingId}`, axiosConfig);
      const updatedListing = {
          data: {
              name: req.body.name,
              short_description: req.body.short_description,
              description: req.body.description,
              circle1_humans: circle1HumansData,
              circle2_humans: circle2HumansData,
              induction: req.body.induction === 'on' ? true : false,
              induction_end: induction_end,
              induction_description: req.body.induction_description,
              website_blog: req.body.website_blog,
              instagram: req.body.instagram,
              linkedin: req.body.linkedin,
              twitter: req.body.twitter,
              youtube: req.body.youtube,
          }
      };
      await axios.put(`${apiUrl}/organisations/${listingId}`, updatedListing, axiosConfig);
      res.redirect("/organisation/organisation-catalogue");
  } catch (err) {
      console.error("Error updating listing:", err.response?.data || err.message);
      res.status(500).send("Failed to update listing.");
  }
});

module.exports = router;