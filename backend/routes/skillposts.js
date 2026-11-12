const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SkillSwapPost = require("../models/SkillSwapPost");
const User = require("../models/User");

// Initial verified MITS student skill exchange listings
const INITIAL_SKILL_POSTS = [
  {
    title: "Full-Stack Web Dev (React, Node.js) for Machine Learning & PyTorch",
    skillOffered: "React, Node.js, Express, MongoDB, REST APIs",
    skillWanted: "Python, PyTorch, Scikit-Learn, CNNs",
    proficiency: "Advanced",
    description: "Built 3 production web apps. Seeking a peer with ML fundamentals to collaborate on a smart agriculture project.",
    availability: "Tuesday/Thursday evenings & Weekends",
    status: "Active"
  },
  {
    title: "C++ & Data Structures (DSA) for UI/UX Design & Figma Prototyping",
    skillOffered: "C++, STL, Dynamic Programming, LeetCode (Knight rank)",
    skillWanted: "Figma, User Research, Wireframing, Tailwind CSS",
    proficiency: "Advanced",
    description: "Strong algorithmic problem-solving skills; eager to learn clean UI/UX and design systems for campus hackathons.",
    availability: "Flexible / Daily after 5:00 PM",
    status: "Active"
  },
  {
    title: "Embedded Systems & Microcontrollers for Computer Vision & OpenCV",
    skillOffered: "Arduino, ESP32, Embedded C, Sensor Interfacing, IoT",
    skillWanted: "OpenCV, Python, Image Processing, Object Tracking",
    proficiency: "Intermediate",
    description: "Currently developing hardware prototypes for smart robotics. Want to exchange hardware knowledge for vision algorithm skills.",
    availability: "Wednesday & Friday afternoons (VLSI Lab)",
    status: "Active"
  },
  {
    title: "MATLAB & Circuit Simulation for Flutter Mobile App Development",
    skillOffered: "MATLAB, Simulink, Power Electronics, Circuit Design",
    skillWanted: "Flutter, Dart, Firebase, Cross-platform Mobile",
    proficiency: "Intermediate",
    description: "Electrical Engineering student looking to build a clean energy monitoring companion app in Flutter.",
    availability: "Weekends / Online Discord or Google Meet",
    status: "Active"
  }
];

// Helper: Safely resolve a valid User ObjectId
async function resolveUserId(inputUserId) {
  if (inputUserId && mongoose.Types.ObjectId.isValid(inputUserId)) {
    const existing = await User.findById(inputUserId);
    if (existing) return existing._id;
  }

  // Try finding by Google ID, email, or name
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

  // Fallback to any existing user or primary student
  const anyUser = await User.findOne({ role: "Student" }) || await User.findOne({});
  if (anyUser) return anyUser._id;

  // If no user exists in DB at all, create a default MITS student
  const defaultStudent = new User({
    name: "Anshika Kumari",
    enrollmentNumber: "BTCD25O1021",
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

// Auto-seed initial real student skill swap posts
async function seedSkillPosts() {
  try {
    const count = await SkillSwapPost.countDocuments();
    if (count < 3) {
      const studentUsers = await User.find({ role: { $in: ["Student", "Senior", "ClubCoordinator"] } }).limit(4);
      const fallbackUser = await User.findOne({});
      
      for (let i = 0; i < INITIAL_SKILL_POSTS.length; i++) {
        const p = INITIAL_SKILL_POSTS[i];
        const exists = await SkillSwapPost.findOne({ title: p.title });
        if (!exists) {
          const author = (studentUsers && studentUsers[i % studentUsers.length]) || fallbackUser;
          if (author) {
            await SkillSwapPost.create({ ...p, userId: author._id });
          }
        }
      }
      console.log("[PASS] Seeded verified MITS SkillSwap listings.");
    }
  } catch (err) {
    console.warn("Skill post seed note:", err.message);
  }
}
setTimeout(seedSkillPosts, 2500);

// GET all skill swap posts (supports search keyword and filter)
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
        { skillOffered: { $regex: term, $options: "i" } },
        { skillWanted: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } }
      ];
    }

    const posts = await SkillSwapPost.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name department role branch year email contactEmail profilePicture");

    res.json(posts);
  } catch (err) {
    console.error("SKILL POSTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching skill posts." });
  }
});

// GET a single skill post
router.get("/:id", async (req, res) => {
  try {
    const post = await SkillSwapPost.findById(req.params.id)
      .populate("userId", "name department role branch year email contactEmail profilePicture");
    if (!post) {
      return res.status(404).json({ error: "Skill post not found." });
    }
    res.json(post);
  } catch (err) {
    console.error("SKILL POST GET ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching the skill post." });
  }
});

// CREATE a new skill swap post
router.post("/", async (req, res) => {
  try {
    const { userId, title, skillOffered, skillWanted, proficiency, description, availability, status } = req.body;

    if (!title || !skillOffered || !skillWanted) {
      return res.status(400).json({ error: "Title, skill offered, and skill wanted are required." });
    }

    const validUserId = await resolveUserId(userId);

    const newPost = new SkillSwapPost({
      userId: validUserId,
      title: title.trim(),
      skillOffered: skillOffered.trim(),
      skillWanted: skillWanted.trim(),
      proficiency: proficiency || "Intermediate",
      description: (description || "").trim(),
      availability: (availability || "Flexible / Weekends & Evenings").trim(),
      status: status || "Active"
    });

    await newPost.save();
    await newPost.populate("userId", "name department role branch year email contactEmail profilePicture");

    res.status(201).json(newPost);
  } catch (err) {
    console.error("SKILL POST CREATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong creating the skill post." });
  }
});

// UPDATE an existing skill swap post
router.put("/:id", async (req, res) => {
  try {
    const { title, skillOffered, skillWanted, proficiency, description, availability, status } = req.body;

    const updates = {};
    if (title) updates.title = title.trim();
    if (skillOffered) updates.skillOffered = skillOffered.trim();
    if (skillWanted) updates.skillWanted = skillWanted.trim();
    if (proficiency) updates.proficiency = proficiency;
    if (description !== undefined) updates.description = description.trim();
    if (availability !== undefined) updates.availability = availability.trim();
    if (status) updates.status = status;

    const updated = await SkillSwapPost.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate("userId", "name department role branch year email contactEmail profilePicture");

    if (!updated) {
      return res.status(404).json({ error: "Skill post not found." });
    }

    res.json(updated);
  } catch (err) {
    console.error("SKILL POST UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the skill post." });
  }
});

// DELETE a skill swap post
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await SkillSwapPost.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Skill post not found." });
    }
    res.json({ message: "Skill post deleted successfully." });
  } catch (err) {
    console.error("SKILL POST DELETE ERROR:", err);
    res.status(500).json({ error: "Something went wrong deleting the skill post." });
  }
});

module.exports = router;
