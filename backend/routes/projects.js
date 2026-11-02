const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// ADD a new project for a user
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      title,
      description,
      technologies,
      githubUrl,
      liveUrl,
      imageUrl,
      status,
      progress,
      isPublic
    } = req.body;

    if (!userId || !title || !title.trim()) {
      return res.status(400).json({ error: "userId and title are required." });
    }

    const calculatedProgress = progress !== undefined ? Number(progress) : (status === "Completed" ? 100 : 40);

    const newProject = new Project({
      userId,
      title: title.trim(),
      description: description ? description.trim() : "",
      technologies: technologies ? technologies.trim() : "",
      githubUrl: githubUrl ? githubUrl.trim() : "",
      liveUrl: liveUrl ? liveUrl.trim() : "",
      imageUrl: imageUrl ? imageUrl.trim() : "",
      status: status || "In Progress",
      progress: calculatedProgress,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true
    });

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
    const projects = await Project.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("PROJECTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching projects." });
  }
});

// UPDATE an entire project
router.put("/:id", async (req, res) => {
  try {
    const {
      title,
      description,
      technologies,
      githubUrl,
      liveUrl,
      imageUrl,
      status,
      progress,
      isPublic
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (technologies !== undefined) updates.technologies = technologies.trim();
    if (githubUrl !== undefined) updates.githubUrl = githubUrl.trim();
    if (liveUrl !== undefined) updates.liveUrl = liveUrl.trim();
    if (imageUrl !== undefined) updates.imageUrl = imageUrl.trim();
    if (status !== undefined) {
      updates.status = status;
      if (progress === undefined && status === "Completed") updates.progress = 100;
    }
    if (progress !== undefined) updates.progress = Number(progress);
    if (isPublic !== undefined) updates.isPublic = Boolean(isPublic);

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.json(updated);
  } catch (err) {
    console.error("PROJECT PUT ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the project." });
  }
});

// PATCH progress and/or visibility on a project
router.patch("/:id", async (req, res) => {
  try {
    const { progress, isPublic, status } = req.body;

    const updateFields = {};
    if (progress !== undefined) updateFields.progress = Number(progress);
    if (isPublic !== undefined) updateFields.isPublic = Boolean(isPublic);
    if (status !== undefined) updateFields.status = status;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.json(updated);
  } catch (err) {
    console.error("PROJECT PATCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the project." });
  }
});

// DELETE a project
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Project not found." });
    }
    res.json({ message: "Project deleted successfully." });
  } catch (err) {
    console.error("PROJECT DELETE ERROR:", err);
    res.status(500).json({ error: "Something went wrong deleting the project." });
  }
});

// GET only public projects for a specific user (for public profile view)
router.get("/public/:userId", async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.userId, isPublic: true }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("PUBLIC PROJECTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching public projects." });
  }
});

module.exports = router;
