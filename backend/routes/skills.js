const express = require("express");
const router = express.Router();
const Skill = require("../models/Skill");

// ADD a new skill for a user
router.post("/", async (req, res) => {
  try {
    const { userId, name, level } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: "userId and name are required." });
    }

    const newSkill = new Skill({ userId, name, level });
    await newSkill.save();

    res.status(201).json(newSkill);
  } catch (err) {
    console.error("SKILL ADD ERROR:", err);
    res.status(500).json({ error: "Something went wrong adding the skill." });
  }
});

// GET all skills for a specific user
router.get("/:userId", async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.params.userId });
    res.json(skills);
  } catch (err) {
    console.error("SKILLS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching skills." });
  }
});

module.exports = router;