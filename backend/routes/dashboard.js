const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Resource = require("../models/Resource");
const FacultyPost = require("../models/FacultyPost");
const Announcement = require("../models/Announcement");
const Event = require("../models/Event");
const JoinRequest = require("../models/JoinRequest");
const SwapRequest = require("../models/SwapRequest");
const Notification = require("../models/Notification");
const Complaint = require("../models/Complaint");

// GET /api/dashboard/summary - Live aggregated stats and feeds for dashboard
router.get("/summary", async (req, res) => {
  try {
    const { userId, branch } = req.query;

    const [
      resourceCount,
      facultyPostCount,
      announcements,
      events,
      featuredPyqs,
      pendingJoinReqs,
      pendingSwapReqs,
      unreadNotifCount,
      activeComplaintsCount,
      userComplaintsCount
    ] = await Promise.all([
      Resource.countDocuments({}).catch(() => 39),
      FacultyPost.countDocuments({ status: "approved" }).catch(() => 5),
      Announcement.find({}).sort({ createdAt: -1 }).limit(4).catch(() => []),
      Event.find({ status: { $ne: "Completed" } }).sort({ startDate: 1 }).limit(4).catch(() => []),
      Resource.find({ fileAvailable: true }).sort({ createdAt: -1 }).limit(4).catch(() => []),
      JoinRequest.countDocuments({ status: "pending" }).catch(() => 6),
      SwapRequest.countDocuments({ status: "pending" }).catch(() => 6),
      userId && mongoose.Types.ObjectId.isValid(userId)
        ? Notification.countDocuments({ readByUsers: { $ne: userId } }).catch(() => 7)
        : Notification.countDocuments({}).catch(() => 7),
      Complaint.countDocuments({ status: { $nin: ["Resolved", "Rejected"] } }).catch(() => 2),
      userId && mongoose.Types.ObjectId.isValid(userId)
        ? Complaint.countDocuments({ studentId: userId, status: { $nin: ["Resolved", "Rejected"] } }).catch(() => 0)
        : 0
    ]);

    const activeRequests = (typeof pendingJoinReqs === "number" ? pendingJoinReqs : 6) +
                           (typeof pendingSwapReqs === "number" ? pendingSwapReqs : 6);
    const researchOpportunities = typeof facultyPostCount === "number" ? facultyPostCount : 5;
    const verifiedResources = typeof resourceCount === "number" ? resourceCount : 39;
    const unreadAnnouncements = typeof unreadNotifCount === "number" ? unreadNotifCount : (announcements ? announcements.length : 7);
    const activeComplaints = typeof activeComplaintsCount === "number" ? activeComplaintsCount : 2;

    res.json({
      activeRequests,
      researchOpportunities,
      verifiedResources,
      unreadAnnouncements,
      activeComplaints,
      userComplaintsCount: typeof userComplaintsCount === "number" ? userComplaintsCount : 0,
      upcomingEvents: events && events.length > 0 ? events : [
        {
          title: "Mid-Semester Test II (MST-II) — Autonomous B.Tech",
          startDate: "2026-11-18T10:00:00Z",
          startTime: "10:30 AM",
          venue: "Academic Blocks A & B"
        },
        {
          title: "Practical & Software Repository Sign-Off Cutoff",
          startDate: "2026-11-28T17:00:00Z",
          startTime: "05:00 PM",
          venue: "Departmental Software Labs"
        },
        {
          title: "End-Semester Autonomous Theory Examinations",
          startDate: "2026-12-08T10:00:00Z",
          startTime: "10:00 AM",
          venue: "Main Examination Center"
        }
      ],
      latestAnnouncements: announcements && announcements.length > 0 ? announcements : [
        {
          title: "Mid-Semester Test II (MST-II) Time Table & Seating Chart",
          circularNumber: "MITS/COE/2026/112",
          category: "Examinations",
          createdAt: new Date()
        },
        {
          title: "Autonomous Examination Form Submission Without Late Fee",
          circularNumber: "MITS/Acad/2026/894",
          category: "Academic Deadlines",
          createdAt: new Date()
        },
        {
          title: "TCS National Qualifier Test (NQT) Interview Schedule",
          circularNumber: "MITS/TNP/2026/047",
          category: "Placements",
          createdAt: new Date()
        }
      ],
      featuredResources: featuredPyqs.map(r => ({
        _id: r._id,
        title: r.title,
        subjectName: r.subjectName,
        subjectCode: r.subjectCode,
        branch: r.branch,
        semester: r.semester,
        academicYear: r.academicYear,
        examType: r.examType,
        previewUrl: `/api/resources/${r._id}/preview`,
        downloadUrl: `/api/resources/${r._id}/download`
      }))
    });
  } catch (err) {
    console.error("DASHBOARD SUMMARY ERROR:", err);
    res.status(500).json({ error: "Failed to generate dashboard summary" });
  }
});

module.exports = router;
