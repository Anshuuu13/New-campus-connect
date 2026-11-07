const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
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
    enum: [
      "Examinations",
      "Results",
      "Holidays",
      "College Events",
      "Club Recruitment",
      "Placements",
      "Academic Deadlines",
      "Complaints",
      "System",
      "General"
    ],
    default: "General"
  },
  icon: {
    type: String,
    default: "🔔"
  },
  actionUrl: {
    type: String,
    default: "/announcements.html"
  },
  circularNumber: {
    type: String,
    default: ""
  },
  priority: {
    type: String,
    enum: ["Normal", "High", "Urgent"],
    default: "Normal"
  },
  targetBranches: {
    type: [String],
    default: ["ALL"]
  },
  targetSemesters: {
    type: [Number],
    default: [1, 2, 3, 4, 5, 6, 7, 8]
  },
  recipientUserId: {
    type: String, // "ALL" or specific User ObjectId string
    default: "ALL"
  },
  readByUsers: {
    type: [String], // Array of User IDs who marked this notification as read
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
