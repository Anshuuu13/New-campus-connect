const mongoose = require("mongoose");

const teamPostSchema = new mongoose.Schema({
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
  rolesNeeded: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["Not started yet", "Ongoing"],
    default: "Not started yet"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("TeamPost", teamPostSchema);