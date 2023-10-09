const express = require('express');
const router = express.Router();

// Define routes here
router.get('/', (req, res) => {
    res.send("static/pages/index")
});

// Export the router
module.exports = router;