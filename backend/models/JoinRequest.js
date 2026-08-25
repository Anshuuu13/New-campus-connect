const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema({
  teamPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TeamPost",
    required: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("JoinRequest", joinRequestSchema);