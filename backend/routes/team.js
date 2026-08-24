const express = require("express");
const router = express.Router();
const TeamPost = require("../models/TeamPost");

// CREATE a new team post
router.post("/", async (req, res) => {
  try {
    const { userId, title, description, rolesNeeded, status } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: "userId and title are required." });
    }

    const newPost = new TeamPost({ userId, title, description, rolesNeeded, status });
    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    console.error("TEAM POST ADD ERROR:", err);
    res.status(500).json({ error: "Something went wrong posting your project." });
  }
});

// GET all team posts (public, newest first)
router.get("/", async (req, res) => {
  try {
    const posts = await TeamPost.find().sort({ createdAt: -1 }).populate("userId", "name department");
    res.json(posts);
  } catch (err) {
    console.error("TEAM POSTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching posts." });
  }
}); // DELETE a team post
router.delete("/:id", async (req, res) => {
  try {
    await TeamPost.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted." });
  } catch (err) {
    console.error("TEAM POST DELETE ERROR:", err);
    res.status(500).json({ error: "Something went wrong deleting the post." });
  }
});

module.exports = router;