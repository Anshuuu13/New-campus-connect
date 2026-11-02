const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  title: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    default: ""
  },
  competition: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    default: "Hackathon"
  },
  achievementType: {
    type: String,
    enum: ["Student", "Institutional"],
    default: "Student"
  },
  description: {
    type: String,
    default: ""
  },
  date: {
    type: String,
    default: ""
  },
  photoUrl: {
    type: String,
    default: ""
  },
  sourceName: {
    type: String,
    default: ""
  },
  sourceUrl: {
    type: String,
    default: ""
  },
  evidenceUrl: {
    type: String,
    default: ""
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  stack: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["pending", "approved", "self-reported", "rejected"],
    default: "self-reported"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Achievement", achievementSchema);
