const express = require("express");
const cors = require("cors");

const urlRoutes = require("./routes/url.routes");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
  })
);


// Parse JSON request body
app.use(express.json());


// Routes
app.use(urlRoutes);


// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK"
  });
});


module.exports = app;