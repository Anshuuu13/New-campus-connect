const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  proficiency: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Intermediate"
  },
  category: {
    type: String,
    default: "Programming"
  },
  level: {
    type: Number,
    default: 65
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Skill", skillSchema);
