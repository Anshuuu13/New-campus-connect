const express = require("express");
const router = express.Router();
const Achievement = require("../models/Achievement");

// SUBMIT a new achievement (starts as "pending")
router.post("/", async (req, res) => {
  try {
    const { userId, title, description, stack } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: "userId and title are required." });
    }

    const newAchievement = new Achievement({ userId, title, description, stack });
    await newAchievement.save();

    res.status(201).json(newAchievement);
  } catch (err) {
    console.error("ACHIEVEMENT SUBMIT ERROR:", err);
    res.status(500).json({ error: "Something went wrong submitting the project." });
  }
});

// GET only approved achievements (for the public page)
router.get("/", async (req, res) => {
  try {
    const achievements = await Achievement.find({ status: "approved" }).populate("userId", "name department");
    res.json(achievements);
  } catch (err) {
    console.error("ACHIEVEMENTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching achievements." });
  }
});
// GET approved achievements for a specific user (for public profile)
router.get("/user/:userId", async (req, res) => {
  try {
    const achievements = await Achievement.find({ userId: req.params.userId, status: "approved" });
    res.json(achievements);
  } catch (err) {
    console.error("USER ACHIEVEMENTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching achievements." });
  }
});
module.exports = router;