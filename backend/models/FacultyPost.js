const mongoose = require("mongoose");

const facultyPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  category: {
    type: String,
    enum: ["Research", "Lab Assistance", "Writing & Publishing", "Event Support", "Technical Work", "Other"],
    default: "Research"
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  skillsNeeded: {
    type: String,
    default: ""
  },
  discussionTime: {
    type: String,
    default: ""
  },
  contactEmail: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved"],
    default: "pending"
  },
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("FacultyPost", facultyPostSchema);