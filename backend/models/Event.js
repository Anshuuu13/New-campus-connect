const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Examination",
      "Holiday",
      "Lab & Practical",
      "Club Activity",
      "Workshop & Seminar",
      "Placement & Career",
      "Deadline",
      "Cultural & Sports",
      "General"
    ],
    default: "College Event"
  },
  description: {
    type: String,
    default: ""
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  dateString: {
    type: String,
    default: ""
  },
  startTime: {
    type: String,
    default: "10:00 AM"
  },
  endTime: {
    type: String,
    default: "05:00 PM"
  },
  venue: {
    type: String,
    default: "MITS Gwalior Campus"
  },
  department: {
    type: String,
    default: "Dean Academics Office"
  },
  eligibleBranches: {
    type: [String],
    default: ["ALL"]
  },
  eligibleSemesters: {
    type: [Number],
    default: [1, 2, 3, 4, 5, 6, 7, 8]
  },
  registrationUrl: {
    type: String,
    default: ""
  },
  registrationDeadline: {
    type: Date
  },
  importantInstructions: {
    type: String,
    default: ""
  },
  sourceUrl: {
    type: String,
    default: "https://web.mitsgwalior.in"
  },
  verifiedDate: {
    type: String,
    default: "Verified Oct 2024"
  },
  contactPerson: {
    type: String,
    default: ""
  },
  contactEmail: {
    type: String,
    default: ""
  },
  contactPhone: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["Scheduled", "Postponed", "Cancelled", "Completed"],
    default: "Scheduled"
  },
  academicYear: {
    type: String,
    default: "2026-2027"
  },
  imageUrl: {
    type: String,
    default: ""
  },
  isOfficial: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Event", eventSchema);
