const express = require("express");
const router = express.Router();
const SwapRequest = require("../models/SwapRequest");

// CREATE a new swap request
router.post("/", async (req, res) => {
  try {
    const { requesterId, recipientId, skillWanted, skillOffered } = req.body;

    if (!requesterId || !recipientId || !skillWanted) {
      return res.status(400).json({ error: "requesterId, recipientId, and skillWanted are required." });
    }

    if (requesterId === recipientId) {
      return res.status(400).json({ error: "You can't request a swap with yourself." });
    }

    const newRequest = new SwapRequest({ requesterId, recipientId, skillWanted, skillOffered });
    await newRequest.save();

    res.status(201).json(newRequest);
  } catch (err) {
    console.error("SWAP REQUEST CREATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong sending the request." });
  }
});

// GET requests where I'm the recipient (to accept/reject)
router.get("/incoming/:userId", async (req, res) => {
  try {
    const requests = await SwapRequest.find({ recipientId: req.params.userId })
      .populate("requesterId", "name department")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("INCOMING SWAP REQUESTS ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching requests." });
  }
});

// GET requests I sent (to see their status)
router.get("/sent/:userId", async (req, res) => {
  try {
    const requests = await SwapRequest.find({ requesterId: req.params.userId })
      .populate("recipientId", "name department")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("SENT SWAP REQUESTS ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching requests." });
  }
});

// UPDATE (accept with time/venue/notes, or reject)
router.patch("/:id", async (req, res) => {
  try {
    const { status, time, venue, notes } = req.body;

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (time !== undefined) updateFields.time = time;
    if (venue !== undefined) updateFields.venue = venue;
    if (notes !== undefined) updateFields.notes = notes;

    const updated = await SwapRequest.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("SWAP REQUEST UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the request." });
  }
});

module.exports = router;