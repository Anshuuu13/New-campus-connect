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

// UPDATE progress and/or visibility on a project
router.patch("/:id", async (req, res) => {
  try {
    const { progress, isPublic } = req.body;

    const updateFields = {};
    if (progress !== undefined) updateFields.progress = progress;
    if (isPublic !== undefined) updateFields.isPublic = isPublic;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("PROJECT UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the project." });
  }
});
// GET only public projects for a specific user (for public profile view)
router.get("/public/:userId", async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.userId, isPublic: true });
    res.json(projects);
  } catch (err) {
    console.error("PUBLIC PROJECTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching public projects." });
  }
});

module.exports = router;