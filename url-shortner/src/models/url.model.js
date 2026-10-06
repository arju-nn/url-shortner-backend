const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
      trim: true
    },

    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    customCode: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    },

    expiresAt: {
      type: Date,
      default: null
    },

    clicks: {
      type: Number,
      default: 0
    },

    lastAccessedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Automatically remove expired documents from MongoDB.
// This is cleanup only; redirect logic will independently
// check expiresAt.
urlSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      expiresAt: { $type: "date" }
    }
  }
);

module.exports = mongoose.model("Url", urlSchema);