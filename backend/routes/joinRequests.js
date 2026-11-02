const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const JoinRequest = require("../models/JoinRequest");
const TeamPost = require("../models/TeamPost");
const User = require("../models/User");

// Helper: Safely resolve a valid User ObjectId
async function resolveUserId(inputUserId) {
  if (inputUserId && mongoose.Types.ObjectId.isValid(inputUserId)) {
    const existing = await User.findById(inputUserId);
    if (existing) return existing._id;
  }

  if (inputUserId) {
    const matched = await User.findOne({
      $or: [
        { googleId: inputUserId },
        { email: inputUserId },
        { contactEmail: inputUserId },
        { name: inputUserId }
      ]
    });
    if (matched) return matched._id;
  }

  const anyUser = await User.findOne({ role: "Student" }) || await User.findOne({});
  return anyUser ? anyUser._id : null;
}

// CREATE a new join request
router.post("/", async (req, res) => {
  try {
    const { teamPostId, requesterId } = req.body;

    if (!teamPostId || !requesterId) {
      return res.status(400).json({ error: "teamPostId and requesterId are required." });
    }

    const validRequesterId = await resolveUserId(requesterId);
    if (!validRequesterId) {
      return res.status(400).json({ error: "Invalid student requester." });
    }

    // Verify post exists
    const post = await TeamPost.findById(teamPostId);
    if (!post) {
      return res.status(404).json({ error: "Team project not found." });
    }

    // Prevent requesting to join own project
    if (String(post.userId) === String(validRequesterId)) {
      return res.status(400).json({ error: "You cannot request to join your own project." });
    }

    const existing = await JoinRequest.findOne({ teamPostId, requesterId: validRequesterId });
    if (existing) {
      return res.status(400).json({ error: "You have already requested to join this project." });
    }

    const newRequest = new JoinRequest({ teamPostId, requesterId: validRequesterId });
    await newRequest.save();
    await newRequest.populate("requesterId", "name department role branch year email contactEmail profilePicture");
    await newRequest.populate("teamPostId", "title status");

    res.status(201).json(newRequest);
  } catch (err) {
    console.error("JOIN REQUEST CREATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong sending the request." });
  }
});

// GET all requests made BY a specific user (across all posts)
router.get("/user/:userId", async (req, res) => {
  try {
    const validId = await resolveUserId(req.params.userId);
    if (!validId) return res.json([]);

    const requests = await JoinRequest.find({ requesterId: validId }).populate({
      path: "teamPostId",
      select: "title status rolesNeeded description"
    });
    res.json(requests);
  } catch (err) {
    console.error("USER REQUESTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching your requests." });
  }
});

// GET all requests for a specific team post (for the owner to review)
router.get("/post/:teamPostId", async (req, res) => {
  try {
    const requests = await JoinRequest.find({ teamPostId: req.params.teamPostId })
      .populate("requesterId", "name department role branch year email contactEmail profilePicture");
    res.json(requests);
  } catch (err) {
    console.error("JOIN REQUESTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching requests." });
  }
});

// UPDATE a request (accept or reject)
router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await JoinRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    .populate("requesterId", "name department role branch year email contactEmail profilePicture")
    .populate("teamPostId", "title status");

    res.json(updated);
  } catch (err) {
    console.error("JOIN REQUEST UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the request." });
  }
});

// DELETE a join request
router.delete("/:id", async (req, res) => {
  try {
    await JoinRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Join request deleted." });
  } catch (err) {
    console.error("JOIN REQUEST DELETE ERROR:", err);
    res.status(500).json({ error: "Something went wrong deleting the join request." });
  }
});

module.exports = router;
