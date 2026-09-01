const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

// GET all events, sorted by date (soonest first)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error("GET EVENTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

module.exports = router;