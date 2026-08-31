const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const User = require("../models/User");

// GET all announcements, newest first
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// POST a new announcement
router.post("/", async (req, res) => {
  try {
    const { userId, title, message, type, clubName, posterImage, formLink } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const allowedRoles = ["Professor", "Admin", "ClubCoordinator"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "You are not authorized to post announcements." });
    }

    const newAnnouncement = new Announcement({
      title,
      message,
      type: type || "General",
      clubName: type === "Club Recruitment" ? clubName : undefined,
      posterImage: type === "Club Recruitment" ? posterImage : undefined,
      formLink: type === "Club Recruitment" ? formLink : undefined,
      postedBy: user._id,
      postedByName: user.name
    });

    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (err) {
    console.error("POST ANNOUNCEMENT ERROR:", err);
    res.status(500).json({ error: "Failed to post announcement" });
  }
});

module.exports = router;