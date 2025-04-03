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
      res.render("organisation/pages/edit-catalogue-listing", {            
        listing: listing,
        users: users.data,
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
      req.body.circle1_humans = JSON.parse(req.body.circle1_humans);
      req.body.circle2_humans = JSON.parse(req.body.circle2_humans);        

      const { data: existingListing } = await axios.get(`${apiUrl}/organisations/${listingId}`, axiosConfig);
      const updatedListing = {
          data: {
              name: req.body.name,
              short_description: req.body.short_description,
              description: req.body.description,
              circle1_humans: req.body.circle1_humans,
              circle2_humans: req.body.circle2_humans,
              induction: req.body.induction === 'on' ? true : false,
              induction_end: req.body.induction_end,
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