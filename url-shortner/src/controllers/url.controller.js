const { nanoid } = require("nanoid");
const Url = require("../models/url.model");


// ------------------------------------
// Validate URL
// ------------------------------------

const isValidUrl = (value) => {
  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};


// ------------------------------------
// Create Short URL
// ------------------------------------

const createUrl = async (req, res) => {
  try {
    const {
      originalUrl,
      customCode,
      expiresAt
    } = req.body;

    // Validate original URL
    if (!originalUrl || !isValidUrl(originalUrl)) {
      return res.status(400).json({
        message: "A valid HTTP/HTTPS URL is required"
      });
    }

    // Validate expiry date
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);

      if (isNaN(expiryDate.getTime())) {
        return res.status(400).json({
          message: "Invalid expiry date"
        });
      }

      if (expiryDate <= new Date()) {
        return res.status(400).json({
          message: "Expiry date must be in the future"
        });
      }
    }

    let shortCode;

    // --------------------------------
    // Custom short code
    // --------------------------------

    if (customCode) {
      // Basic validation
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(customCode)) {
        return res.status(400).json({
          message:
            "Custom code must contain 3-30 letters, numbers, _ or -"
        });
      }

      const existingUrl = await Url.findOne({
        shortCode: customCode
      });

      if (existingUrl) {
        return res.status(409).json({
          message: "Short code already exists"
        });
      }

      shortCode = customCode;
    }

    // --------------------------------
    // Automatically generated code
    // --------------------------------

    else {
      shortCode = nanoid(7);

      // Extremely unlikely collision protection
      while (await Url.exists({ shortCode })) {
        shortCode = nanoid(7);
      }
    }

    // --------------------------------
    // Create database record
    // --------------------------------

    const url = await Url.create({
      originalUrl,
      shortCode,
      customCode: Boolean(customCode),
      expiresAt: expiresAt || null
    });

    return res.status(201).json({
      id: url._id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
      expiresAt: url.expiresAt,
      isActive: url.isActive
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create short URL"
    });
  }
};


// ------------------------------------
// Redirect to Original URL
// ------------------------------------

const redirectToOriginalUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const url = await Url.findOne({
      shortCode
    });

    // Short code doesn't exist
    if (!url) {
      return res.status(404).json({
        message: "Short URL not found"
      });
    }

    // Manually deactivated
    if (!url.isActive) {
      return res.status(410).json({
        message: "Short URL has been deactivated"
      });
    }

    // Expired
    if (
      url.expiresAt &&
      url.expiresAt <= new Date()
    ) {
      return res.status(410).json({
        message: "Short URL has expired"
      });
    }

    // Track usage
    await Url.updateOne(
      { _id: url._id },
      {
        $inc: {
          clicks: 1
        },
        $set: {
          lastAccessedAt: new Date()
        }
      }
    );

    // Redirect
    return res.redirect(302, url.originalUrl);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to redirect"
    });
  }
};


// ------------------------------------
// Get URL Statistics
// ------------------------------------

const getUrlStats = async (req, res) => {
  try {
    const { id } = req.params;

    const url = await Url.findById(id);

    if (!url) {
      return res.status(404).json({
        message: "URL not found"
      });
    }

    return res.json({
      id: url._id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      clicks: url.clicks,
      createdAt: url.createdAt,
      lastAccessedAt: url.lastAccessedAt,
      expiresAt: url.expiresAt,
      isActive: url.isActive
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to get statistics"
    });
  }
};


// ------------------------------------
// Deactivate URL
// ------------------------------------

const deactivateUrl = async (req, res) => {
  try {
    const { id } = req.params;

    const url = await Url.findByIdAndUpdate(
      id,
      {
        isActive: false
      },
      {
        new: true
      }
    );

    if (!url) {
      return res.status(404).json({
        message: "URL not found"
      });
    }

    return res.json({
      message: "URL deactivated successfully",
      id: url._id,
      shortCode: url.shortCode,
      isActive: url.isActive
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to deactivate URL"
    });
  }
};


module.exports = {
  createUrl,
  redirectToOriginalUrl,
  getUrlStats,
  deactivateUrl
};