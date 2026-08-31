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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);