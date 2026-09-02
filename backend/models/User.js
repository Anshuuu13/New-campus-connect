const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    default: "Not specified"
  },
  role: {
    type: String,
    enum: ["Student", "Senior", "Professor", "Admin", "ClubCoordinator"],
    default: "Student"
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: ""
  },
  branch: {
    type: String,
    default: ""
  },
  year: {
    type: String,
    default: ""
  },
  linkedin: {
    type: String,
    default: ""
  },
  github: {
    type: String,
    default: ""
  },
  contactEmail: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);