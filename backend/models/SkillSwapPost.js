const mongoose = require("mongoose");

const skillSwapPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  skillOffered: {
    type: String,
    required: true,
    trim: true
  },
  skillWanted: {
    type: String,
    required: true,
    trim: true
  },
  proficiency: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Intermediate"
  },
  description: {
    type: String,
    default: "",
    trim: true
  },
  availability: {
    type: String,
    default: "Flexible / Weekends & Evenings",
    trim: true
  },
  status: {
    type: String,
    enum: ["Active", "Completed", "Closed"],
    default: "Active"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SkillSwapPost", skillSwapPostSchema);
