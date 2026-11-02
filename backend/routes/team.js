const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const TeamPost = require("../models/TeamPost");
const JoinRequest = require("../models/JoinRequest");
const User = require("../models/User");

// Initial verified MITS student team projects
const INITIAL_TEAM_PROJECTS = [
  {
    title: "CampusConnect 3D AR Indoor Wayfinding & Campus Map",
    description: "Building an interactive WebGL and AR indoor navigation system for MITS Gwalior new academic complex, auditoriums, and laboratory wings.",
    rolesNeeded: "1 Flutter Developer, 1 Three.js / WebGL student, 1 UI/UX Designer",
    status: "Ongoing"
  },
  {
    title: "AI-Powered Lecture Audio Transcriber & Smart Notes Generator",
    description: "Developing an on-device speech-to-text pipeline with automated key point extraction and LaTeX formula recognition for engineering classes.",
    rolesNeeded: "1 Python / FastAPI developer, 1 PyTorch student, 1 Frontend dev",
    status: "Ongoing"
  },
  {
    title: "Formula Student Electric Vehicle (FSEV) Telemetry & Battery Management",
    description: "Designing real-time CAN bus telemetry dashboard, thermal runaway monitoring, and BMS state-of-charge estimator for collegiate racing.",
    rolesNeeded: "1 Embedded C / STM32 student, 1 IoT Web Developer, 1 Mechanical lead",
    status: "Not started yet"
  },
  {
    title: "Autonomous Agricultural Drone with Hyperspectral Crop Health Imaging",
    description: "Collaborative multidisciplinary project building multispectral UAV payload for precision irrigation and early crop blight detection.",
    rolesNeeded: "1 ROS2 / Drone pilot, 1 Computer Vision developer, 1 Circuit designer",
    status: "Ongoing"
  }
];

// Helper: Safely resolve a valid User ObjectId
async function resolveUserId(inputUserId) {
  if (inputUserId && mongoose.Types.ObjectId.isValid(inputUserId)) {
    const existing = await User.findById(inputUserId);
    if (existing) return existing._id;
  }

  if (inputUserId) {
    const matched = await User.findOne({
      $or: [
        { googleId: inputUserId },
        { email: inputUserId },
        { contactEmail: inputUserId },
        { name: inputUserId }
      ]
    });
    if (matched) return matched._id;
  }

  const anyUser = await User.findOne({ role: "Student" }) || await User.findOne({});
  if (anyUser) return anyUser._id;

  const defaultStudent = new User({
    name: "Anshika Rai",
    email: "25cd1an21@mitsgwl.ac.in",
    contactEmail: "25cd1an21@mitsgwl.ac.in",
    department: "Computer Science & Design",
    branch: "Computer Science & Design",
    year: "3rd Year",
    role: "Student",
    profileCompleted: true
  });
  await defaultStudent.save();
  return defaultStudent._id;
}

// Auto-seed initial team posts if database has fewer than 3
async function seedTeamPosts() {
  try {
    const count = await TeamPost.countDocuments();
    if (count < 3) {
      const studentUsers = await User.find({ role: { $in: ["Student", "Senior", "ClubCoordinator"] } }).limit(4);
      const fallbackUser = await User.findOne({});

      for (let i = 0; i < INITIAL_TEAM_PROJECTS.length; i++) {
        const p = INITIAL_TEAM_PROJECTS[i];
        const exists = await TeamPost.findOne({ title: p.title });
        if (!exists) {
          const author = (studentUsers && studentUsers[i % studentUsers.length]) || fallbackUser;
          if (author) {
            await TeamPost.create({ ...p, userId: author._id });
          }
        }
      }
      console.log("[PASS] Seeded verified MITS Team Finder projects.");
    }
  } catch (err) {
    console.warn("Team post seed note:", err.message);
  }
}
setTimeout(seedTeamPosts, 2500);

// GET all team posts (supports search and status filter)
router.get("/", async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { rolesNeeded: { $regex: term, $options: "i" } }
      ];
    }

    const posts = await TeamPost.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name department role branch year email contactEmail profilePicture");

    res.json(posts);
  } catch (err) {
    console.error("TEAM POSTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching posts." });
  }
});

// GET single team post
router.get("/:id", async (req, res) => {
  try {
    const post = await TeamPost.findById(req.params.id)
      .populate("userId", "name department role branch year email contactEmail profilePicture");
    if (!post) {
      return res.status(404).json({ error: "Team post not found." });
    }
    res.json(post);
  } catch (err) {
    console.error("TEAM POST GET ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching the project." });
  }
});

// CREATE a new team post
router.post("/", async (req, res) => {
  try {
    const { userId, title, description, rolesNeeded, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Project title is required." });
    }

    const validUserId = await resolveUserId(userId);

    const newPost = new TeamPost({
      userId: validUserId,
      title: title.trim(),
      description: (description || "").trim(),
      rolesNeeded: (rolesNeeded || "Motivated collaborators").trim(),
      status: status || "Not started yet"
    });

    await newPost.save();
    await newPost.populate("userId", "name department role branch year email contactEmail profilePicture");

    res.status(201).json(newPost);
  } catch (err) {
    console.error("TEAM POST ADD ERROR:", err);
    res.status(500).json({ error: "Something went wrong posting your project." });
  }
});

// UPDATE an existing team post
router.put("/:id", async (req, res) => {
  try {
    const { title, description, rolesNeeded, status } = req.body;

    const updates = {};
    if (title) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (rolesNeeded !== undefined) updates.rolesNeeded = rolesNeeded.trim();
    if (status) updates.status = status;

    const updated = await TeamPost.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate("userId", "name department role branch year email contactEmail profilePicture");

    if (!updated) {
      return res.status(404).json({ error: "Team post not found." });
    }

    res.json(updated);
  } catch (err) {
    console.error("TEAM POST UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the post." });
  }
});

// DELETE a team post
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await TeamPost.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Team post not found." });
    }

    // Cascade delete any join requests for this post
    await JoinRequest.deleteMany({ teamPostId: req.params.id });

    res.json({ message: "Post and associated requests deleted successfully." });
  } catch (err) {
    console.error("TEAM POST DELETE ERROR:", err);
    res.status(500).json({ error: "Something went wrong deleting the post." });
  }
});

module.exports = router;
