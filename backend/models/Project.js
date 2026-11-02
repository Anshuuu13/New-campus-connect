const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  technologies: {
    type: String,
    default: ""
  },
  githubUrl: {
    type: String,
    default: ""
  },
  liveUrl: {
    type: String,
    default: ""
  },
  imageUrl: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["In Progress", "Completed"],
    default: "In Progress"
  },
  progress: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Project", projectSchema);
