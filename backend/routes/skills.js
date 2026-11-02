const express = require("express");
const router = express.Router();
const Skill = require("../models/Skill");

function proficiencyToLevel(prof) {
  if (prof === "Beginner") return 35;
  if (prof === "Advanced") return 90;
  return 65; // Intermediate
}

// ADD a new skill for a user
router.post("/", async (req, res) => {
  try {
    const { userId, name, proficiency, category, level } = req.body;

    if (!userId || !name || !name.trim()) {
      return res.status(400).json({ error: "userId and skill name are required." });
    }

    const assignedProf = proficiency || "Intermediate";
    const assignedLevel = level !== undefined ? Number(level) : proficiencyToLevel(assignedProf);

    const newSkill = new Skill({
      userId,
      name: name.trim(),
      proficiency: assignedProf,
      category: category || "Programming",
      level: assignedLevel
    });
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
    const skills = await Skill.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(skills);
  } catch (err) {
    console.error("SKILLS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching skills." });
  }
});

// UPDATE an existing skill
router.put("/:id", async (req, res) => {
  try {
    const { name, proficiency, category, level } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (proficiency) {
      updates.proficiency = proficiency;
      if (level === undefined) updates.level = proficiencyToLevel(proficiency);
    }
    if (category) updates.category = category;
    if (level !== undefined) updates.level = Number(level);

    const updated = await Skill.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Skill not found." });
    }

    res.json(updated);
  } catch (err) {
    console.error("SKILL UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the skill." });
  }
});

// DELETE a skill
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Skill.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Skill not found." });
    }
    res.json({ message: "Skill deleted successfully." });
  } catch (err) {
    console.error("SKILL DELETE ERROR:", err);
    res.status(500).json({ error: "Something went wrong deleting the skill." });
  }
});

module.exports = router;
