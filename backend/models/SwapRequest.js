const mongoose = require("mongoose");

const swapRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  skillWanted: {
    type: String,
    required: true
  },
  skillOffered: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },
  time: {
    type: String,
    default: ""
  },
  venue: {
    type: String,
    default: ""
  },
  notes: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SwapRequest", swapRequestSchema);