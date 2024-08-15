const express = require('express');
const router = express.Router();
const fs = require('fs');
const axios=require("axios");
// Read HTML Template
    
const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers if required by your Strapi API
      'Authorization': `Bearer ${process.env.STRAPI_API_KEY}`,
    },
};


const apiUrl = process.env.STRAPI_API_URL;

router.get('/sopaan-register', async (req, res) => {
    var users = (await axios.get(`${apiUrl}/users?filters[batch][$eqi]=UG2024&fields[0]=username&fields[1]=email&fields[2]=profile_url`, axiosConfig)).data;
    res.render("platform/pages/sopaan-register",{users:users});
}) ;

module.exports = router;