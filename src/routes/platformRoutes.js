const express = require('express');
const router = express.Router();

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


router.get('/public-forum', (req, res) => {
    res.render("platform/pages/public-forum")
});

router.get('/public-forum/:id', (req, res) => {
    res.render("platform/pages/petition")
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