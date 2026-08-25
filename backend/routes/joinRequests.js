const express = require("express");
const router = express.Router();
const JoinRequest = require("../models/JoinRequest");

// CREATE a new join request
router.post("/", async (req, res) => {
  try {
    const { teamPostId, requesterId } = req.body;

    if (!teamPostId || !requesterId) {
      return res.status(400).json({ error: "teamPostId and requesterId are required." });
    }

    const existing = await JoinRequest.findOne({ teamPostId, requesterId });
    if (existing) {
      return res.status(400).json({ error: "You already requested to join this project." });
    }

    const newRequest = new JoinRequest({ teamPostId, requesterId });
    await newRequest.save();

    res.status(201).json(newRequest);
  } catch (err) {
    console.error("JOIN REQUEST CREATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong sending the request." });
  }
});

// GET all requests for a specific team post (for the owner to review)
// GET all requests made BY a specific user (across all posts)
router.get("/user/:userId", async (req, res) => {
  try {
    const requests = await JoinRequest.find({ requesterId: req.params.userId }).populate({
      path: "teamPostId",
      select: "title"
    });
    res.json(requests);
  } catch (err) {
    console.error("USER REQUESTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching your requests." });
  }
});
router.get("/post/:teamPostId", async (req, res) => {
  try {
    const requests = await JoinRequest.find({ teamPostId: req.params.teamPostId }).populate("requesterId", "name department");
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
    );

    res.json(updated);
  } catch (err) {
    console.error("JOIN REQUEST UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the request." });
  }
});

module.exports = router;