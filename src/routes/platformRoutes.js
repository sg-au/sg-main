const express = require('express');
const router = express.Router();
const axios=require("axios");
const { route } = require('./websiteRoutes');

const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers if required by your Strapi API
      'Authorization': `Bearer ${process.env.STRAPI_API_KEY}`,
    },
};
const apiUrl = process.env.STRAPI_API_URL;

// Define routes here
router.get('/', (req, res) => {
    res.render("platform/pages/index")
});

router.get('/tickets', (req, res) => {
    res.render("platform/pages/tickets")
});

router.get('/create-ticket', (req, res) => {
    res.render("platform/pages/create-ticket")
});

router.get('/tickets/:id', (req, res) => {
    res.render("platform/pages/ticket")
});


router.get('/public-forum', async (req, res) => {
    try {
        var endpoint = '/forums';
        var response = await axios.get(`${apiUrl}${endpoint}`, axiosConfig);
        res.render("platform/pages/public-forum", {petitions: response.data});
    } catch (error) {
        console.error('An error occurred:', error);
    }
});

router.get('/public-forum/:id', async (req, res) => {
    try {
        var endpoint = '/forums';
        var com_endpoint = '/comments';
        var petitionID = req.params.id;
        var user_response = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig);
        var userID = user_response.data[0].id;
        var response = await axios.get(`${apiUrl}${endpoint}/${petitionID}?populate=signatures,comments`, axiosConfig);
        var comments = await axios.get(`${apiUrl}${com_endpoint}?populate=author,forum`, axiosConfig);
        var com_array = []
        if(comments.data.data.length != 0) {
            (comments.data.data).forEach(comment => {
                if(comment.attributes.forum.data.id == petitionID) {
                    com_array.push(comment);
                } 
            });
        }
        console.log(com_array);
        res.render("platform/pages/petition", {petition: response.data.data, comments: com_array, user: userID});
    } catch (error) {
        console.error('An error occurred:', error);
    }
});

router.post('/create-comment', async (req, res) => {
    var com_endpoint = '/comments';
    var petitionID = Number(req.body.petitionId);
    var commentContent = req.body.commentContent;
    var user_response = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig);
    var userID = user_response.data[0].id;   
    const commentData = {
        data: {
            comment: commentContent, // Add comment content
            author: userID, // Link the comment to the user
            forum: petitionID, // Link the comment to the petition
        } 
    }
    console.log(commentData);
    try {
        // Make an API request to create a new comment in Strapi
        var com_response = await axios.post(`${apiUrl}${com_endpoint}`, commentData, axiosConfig);
        console.log(com_response.status);
        res.redirect('/platform/forum/' + petitionID); // Redirect to the petition page after comment creation
      } catch (error) {
        console.error('Error creating comment:', error.response.data);
        res.status(500).send('Error creating comment.');
      }
});

router.get('/profile', (req, res) => {
    res.render("platform/pages/profile")
});

router.get('/announcements', (req, res) => {
    res.render("platform/pages/announcements")
});


router.get('/events', (req, res) => {
    res.render("platform/pages/events")
});


// Export the router
module.exports = router;