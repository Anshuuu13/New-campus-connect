const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["General", "Club Recruitment"], default: "General" },
  clubName: { type: String },
  posterImage: { type: String },
  formLink: { type: String },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  postedByName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Announcement", announcementSchema);