const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Examinations",
      "Results",
      "Holidays",
      "College Events",
      "Club Recruitment",
      "Placements",
      "Academic Deadlines",
      "General"
    ],
    default: "General"
  },
  priority: {
    type: String,
    enum: ["Normal", "High", "Urgent"],
    default: "Normal"
  },
  type: {
    type: String,
    default: "General"
  },
  clubName: {
    type: String,
    default: ""
  },
  posterImage: {
    type: String,
    default: ""
  },
  documentUrl: {
    type: String,
    default: ""
  },
  formLink: {
    type: String,
    default: ""
  },
  circularNumber: {
    type: String,
    default: ""
  },
  sourceUrl: {
    type: String,
    default: "https://web.mitsgwalior.in"
  },
  targetBranches: {
    type: [String],
    default: ["ALL"]
  },
  targetSemesters: {
    type: [Number],
    default: [1, 2, 3, 4, 5, 6, 7, 8]
  },
  academicYear: {
    type: String,
    default: "2026-2027"
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  postedByName: {
    type: String,
    default: "Dean Academics Office"
  },
  postedByRole: {
    type: String,
    default: "Admin"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Announcement", announcementSchema);
