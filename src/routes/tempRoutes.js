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
    var users = (await axios.get(`${apiUrl}/users?filters[$or][0][batch][$eqi]=UG2024&filters[$or][1][batch][$eqi]=UGT2024&fields[0]=username&fields[1]=email&fields[2]=profile_url`, axiosConfig)).data;
    res.render("platform/pages/sopaan-register",{users:users});
}) ;

router.get('/stats', async (req, res) => {
    var usersCount = (await axios.get(`${apiUrl}/users/count`, axiosConfig)).data;
    var poolCount = (await axios.get(`${apiUrl}/pools`, axiosConfig)).data.meta.pagination.total;
    var servicesCount = (await axios.get(`${apiUrl}/services`, axiosConfig)).data.meta.pagination.total;
    var reviewsCount = (await axios.get(`${apiUrl}/reviews`, axiosConfig)).data.meta.pagination.total;
    res.render("platform/pages/stats",{usersCount:usersCount,poolCount:poolCount,servicesCount:servicesCount,reviewsCount:reviewsCount});
}) ;

module.exports = router;