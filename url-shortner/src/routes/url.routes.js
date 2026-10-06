const express = require("express");

const {
  createUrl,
  redirectToOriginalUrl,
  getUrlStats,
  deactivateUrl
} = require("../controllers/url.controller");

const router = express.Router();


// Create short URL
router.post(
  "/api/urls",
  createUrl
);


// Get statistics
router.get(
  "/api/urls/:id/stats",
  getUrlStats
);


// Deactivate URL
router.patch(
  "/api/urls/:id",
  deactivateUrl
);


// Redirect
router.get(
  "/:shortCode",
  redirectToOriginalUrl
);


module.exports = router;