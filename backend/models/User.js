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
    enum: ["Student", "Faculty", "Professor", "Senior", "Admin", "ClubCoordinator"],
    default: "Student"
  },
  email: {
    type: String,
    default: "",
    trim: true,
    lowercase: true
  },
  googleId: {
    type: String,
    default: ""
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "google"
  },
  password: {
    type: String,
    required: false
  },
  profileCompleted: {
    type: Boolean,
    default: false
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
  clubRole: {
    type: String,
    default: ""
  },
  interests: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
