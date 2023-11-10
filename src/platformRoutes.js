const express = require('express');
const router = express.Router();

// Define routes here
router.get('/', (req, res) => {
    res.render("platform/pages/test")
});

router.get('/test', (req, res) => {
    res.render("platform/pages/test")
});

// Export the router
module.exports = router;