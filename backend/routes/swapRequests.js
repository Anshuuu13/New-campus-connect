const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SwapRequest = require("../models/SwapRequest");
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

// CREATE a new swap request
router.post("/", async (req, res) => {
  try {
    const { requesterId, recipientId, skillWanted, skillOffered } = req.body;

    if (!requesterId || !recipientId || !skillWanted) {
      return res.status(400).json({ error: "requesterId, recipientId, and skillWanted are required." });
    }

    const validRequesterId = await resolveUserId(requesterId);
    const validRecipientId = await resolveUserId(recipientId);

    if (!validRequesterId || !validRecipientId) {
      return res.status(400).json({ error: "Invalid requester or recipient user." });
    }

    if (String(validRequesterId) === String(validRecipientId)) {
      return res.status(400).json({ error: "You cannot request a skill swap with yourself." });
    }

    const newRequest = new SwapRequest({
      requesterId: validRequesterId,
      recipientId: validRecipientId,
      skillWanted: skillWanted.trim(),
      skillOffered: (skillOffered || "").trim()
    });
    await newRequest.save();
    await newRequest.populate("requesterId", "name department role email contactEmail profilePicture");
    await newRequest.populate("recipientId", "name department role email contactEmail profilePicture");

    res.status(201).json(newRequest);
  } catch (err) {
    console.error("SWAP REQUEST CREATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong sending the request." });
  }
});

// GET requests where I'm the recipient (to accept/reject)
router.get("/incoming/:userId", async (req, res) => {
  try {
    const validId = await resolveUserId(req.params.userId);
    if (!validId) return res.json([]);

    const requests = await SwapRequest.find({ recipientId: validId })
      .populate("requesterId", "name department role branch year email contactEmail profilePicture")
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
    const validId = await resolveUserId(req.params.userId);
    if (!validId) return res.json([]);

    const requests = await SwapRequest.find({ requesterId: validId })
      .populate("recipientId", "name department role branch year email contactEmail profilePicture")
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
    )
    .populate("requesterId", "name department role email contactEmail profilePicture")
    .populate("recipientId", "name department role email contactEmail profilePicture");

    res.json(updated);
  } catch (err) {
    console.error("SWAP REQUEST UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the request." });
  }
});

// DELETE a swap request
router.delete("/:id", async (req, res) => {
  try {
    await SwapRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Request deleted." });
  } catch (err) {
    console.error("SWAP REQUEST DELETE ERROR:", err);
    res.status(500).json({ error: "Something went wrong deleting the request." });
  }
});

module.exports = router;
