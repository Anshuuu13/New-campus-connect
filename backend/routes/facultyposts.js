const express = require("express");
const router = express.Router();
const FacultyPost = require("../models/FacultyPost");

// CREATE a new post (starts as "pending")
router.post("/", async (req, res) => {
  try {
    const { userId, category, title, description, skillsNeeded, discussionTime, contactEmail } = req.body;

    if (!userId || !title || !contactEmail) {
      return res.status(400).json({ error: "userId, title, and contactEmail are required." });
    }

    const newPost = new FacultyPost({ userId, category, title, description, skillsNeeded, discussionTime, contactEmail });
    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    console.error("FACULTY POST CREATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong posting." });
  }
});

// GET only approved posts (for the public page)
router.get("/", async (req, res) => {
  try {
    const posts = await FacultyPost.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .populate("userId", "name department")
      .populate("applicants", "name department");
    res.json(posts);
  } catch (err) {
    console.error("FACULTY POSTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching posts." });
  }
});

// APPLY (adds the student to the applicants list, prevents duplicates and self-apply)
router.post("/:id/apply", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const post = await FacultyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    if (post.userId.toString() === userId) {
      return res.status(400).json({ error: "You can't apply to your own posting." });
    }

    if (post.applicants.some((a) => a.toString() === userId)) {
      return res.status(400).json({ error: "You've already applied to this posting." });
    }

    post.applicants.push(userId);
    await post.save();

    res.json({ contactEmail: post.contactEmail, applicantCount: post.applicants.length });
  } catch (err) {
    console.error("FACULTY POST APPLY ERROR:", err);
    res.status(500).json({ error: "Something went wrong applying." });
  }
});

module.exports = router;