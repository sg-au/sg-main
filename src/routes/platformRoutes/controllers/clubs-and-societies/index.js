const { Router } = require("express");
const router = Router();

router.get("/", (req, res) => {
  res.renderPage("index");
});

module.exports = router;
