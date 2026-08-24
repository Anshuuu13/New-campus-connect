const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// ADD a new project for a user
router.post("/", async (req, res) => {
  try {
    const { userId, title, progress } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: "userId and title are required." });
    }

    const newProject = new Project({ userId, title, progress });
    await newProject.save();

    res.status(201).json(newProject);
  } catch (err) {
    console.error("PROJECT ADD ERROR:", err);
    res.status(500).json({ error: "Something went wrong adding the project." });
  }
});

// GET all projects for a specific user
router.get("/:userId", async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.userId });
    res.json(projects);
  } catch (err) {
    console.error("PROJECTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching projects." });
  }
});

// UPDATE progress on a project
router.patch("/:id", async (req, res) => {
  try {
    const { progress } = req.body;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { progress },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("PROJECT UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the project." });
  }
});

module.exports = router;