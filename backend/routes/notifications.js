const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// Initial verified notifications for MITS Gwalior students
const INITIAL_NOTIFICATIONS = [
  {
    title: "Exam Form Submission Deadline Approaching",
    message: "Last date to submit odd-semester autonomous examination forms without late fee is 15 November 2026. Deposit fees on the IMS portal immediately to avoid Rs. 500 late penalty.",
    category: "Academic Deadlines",
    icon: "⚠️",
    actionUrl: "https://ims.mitsgwalior.in",
    circularNumber: "MITS/Acad/2026/894",
    priority: "Urgent",
    targetBranches: ["ALL"],
    targetSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    recipientUserId: "ALL"
  },
  {
    title: "MST-II Time Table & Guidelines Released",
    message: "Mid-Semester Test II commences on 18 November 2026 for B.Tech 3rd, 5th, and 7th semesters. Check departmental seating arrangements.",
    category: "Examinations",
    icon: "📝",
    actionUrl: "/events.html",
    circularNumber: "MITS/COE/2026/112",
    priority: "Urgent",
    targetBranches: ["ALL"],
    targetSemesters: [3, 5, 7],
    recipientUserId: "ALL"
  },
  {
    title: "TCS National Qualifier Test (NQT) Interview Schedule",
    message: "Panel interviews for shortlisted final year candidates commence on 18 October in T&P suites. Bring formal attire and two printed resume sets.",
    category: "Placements",
    icon: "💼",
    actionUrl: "/announcements.html",
    circularNumber: "MITS/TNP/2026/047",
    priority: "High",
    targetBranches: ["CSE", "IT", "AI-DS", "CSD", "ECE", "EE", "ME", "CE"],
    targetSemesters: [7, 8],
    recipientUserId: "ALL"
  },
  {
    title: "Laboratory Practical Manual Submission Cutoff",
    message: "Final deadline for getting practical manuals and software repositories signed by instructors is 28 November 2026.",
    category: "Academic Deadlines",
    icon: "🔬",
    actionUrl: "/events.html",
    circularNumber: "MITS/Acad/2026/910",
    priority: "High",
    targetBranches: ["ALL"],
    targetSemesters: [1, 3, 5, 7],
    recipientUserId: "ALL"
  },
  {
    title: "Winter Vacation & Hostel Mess Schedule",
    message: "Inter-semester winter vacation is scheduled from 26 December 2026 to 05 January 2027 following end-sem theory exams.",
    category: "Holidays",
    icon: "🏖️",
    actionUrl: "/events.html",
    circularNumber: "MITS/Admin/2026/205",
    priority: "Normal",
    targetBranches: ["ALL"],
    targetSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    recipientUserId: "ALL"
  }
];

async function seedInitialNotifications() {
  try {
    if (mongoose.connection.readyState !== 1) {
      mongoose.connection.once("open", () => setTimeout(seedInitialNotifications, 800));
      return;
    }

    const ops = INITIAL_NOTIFICATIONS.map(item => ({
      updateOne: {
        filter: { title: item.title },
        update: { $set: item },
        upsert: true
      }
    }));

    await Notification.bulkWrite(ops);
    console.log(`[PASS] Synchronized ${INITIAL_NOTIFICATIONS.length} smart notifications with MongoDB Atlas.`);
  } catch (err) {
    console.warn("Could not seed notifications:", err.message);
  }
}
setTimeout(seedInitialNotifications, 1500);

// GET /api/notifications - Fetch student notifications with branch/semester filtering
router.get("/", async (req, res) => {
  try {
    const { userId, branch, semester, category, unreadOnly } = req.query;
    const filter = {};

    if (branch && branch !== "all" && branch !== "ALL") {
      filter.targetBranches = { $in: [branch, "ALL"] };
    }
    if (semester && semester !== "all") {
      filter.targetSemesters = Number(semester);
    }
    if (category && category !== "all") {
      filter.category = category;
    }

    if (userId) {
      filter.$or = [
        { recipientUserId: "ALL" },
        { recipientUserId: userId }
      ];

      if (unreadOnly === "true") {
        filter.readByUsers = { $ne: userId };
      }
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });

    // Mark isRead per user
    const results = notifications.map(n => ({
      ...n.toObject(),
      isRead: userId ? n.readByUsers.includes(userId) : false
    }));

    res.json(results);
  } catch (err) {
    console.error("GET NOTIFICATIONS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readByUsers: userId } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Notification not found" });
    res.json({ success: true, notificationId: updated._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// POST /api/notifications/mark-all-read - Mark all notifications as read for user
router.post("/mark-all-read", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    await Notification.updateMany(
      {},
      { $addToSet: { readByUsers: userId } }
    );

    res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

// POST /api/notifications - Create a new notification (Admin / System broadcast)
router.post("/", async (req, res) => {
  try {
    const {
      title,
      message,
      category,
      icon,
      actionUrl,
      circularNumber,
      priority,
      targetBranches,
      targetSemesters,
      recipientUserId
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    const newNotif = new Notification({
      title,
      message,
      category: category || "General",
      icon: icon || "🔔",
      actionUrl: actionUrl || "/announcements.html",
      circularNumber: circularNumber || "",
      priority: priority || "Normal",
      targetBranches: targetBranches || ["ALL"],
      targetSemesters: targetSemesters || [1, 2, 3, 4, 5, 6, 7, 8],
      recipientUserId: recipientUserId || "ALL"
    });

    const saved = await newNotif.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("CREATE NOTIFICATION ERROR:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Notification not found" });
    res.json({ message: "Notification deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

module.exports = router;
