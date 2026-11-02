const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const FacultyPost = require("../models/FacultyPost");
const User = require("../models/User");

const INITIAL_FACULTY_POSTS = [
  {
    category: "Research",
    title: "Autonomous Aerial Navigation & Obstacle Avoidance for Agricultural Drones",
    description: "Developing computer vision algorithms and LiDAR point cloud processing for low-altitude autonomous UAV flight in unstructured farm environments.",
    skillsNeeded: "Python, OpenCV, ROS2, PyTorch",
    discussionTime: "Tuesday & Thursday 3:30 PM, Robotics Lab 3",
    contactEmail: "robotics@mitsgwalior.in",
    status: "approved"
  },
  {
    category: "Technical Work",
    title: "Smart Microgrid Optimization & Renewable Energy Integration",
    description: "Simulation and dynamic load-balancing modeling for campus solar PV rooftop arrays and lithium-ion battery energy storage systems.",
    skillsNeeded: "MATLAB, Simulink, Power Electronics, IoT",
    discussionTime: "Wednesday 4:00 PM, Electrical Machines Lab",
    contactEmail: "microgrid@mitsgwalior.in",
    status: "approved"
  },
  {
    category: "Lab Assistance",
    title: "Edge AI Implementation on Embedded RISC-V Architectures",
    description: "Deploying quantized neural networks onto FPGA boards and RISC-V development microcontrollers for low-power edge sensing.",
    skillsNeeded: "Embedded C, Verilog/VHDL, TinyML",
    discussionTime: "Friday 2:00 PM, VLSI & Embedded Lab",
    contactEmail: "embedded@mitsgwalior.in",
    status: "approved"
  },
  {
    category: "Research",
    title: "Biomedical Signal Processing & ECG Arrhythmia Classification via Transformers",
    description: "Analyzing PhysioNet cardiovascular datasets using lightweight attention models for portable wearable clinical monitors.",
    skillsNeeded: "Python, Signal Processing, Deep Learning, NumPy",
    discussionTime: "Monday & Wednesday 4:30 PM, Biomedical Lab",
    contactEmail: "biomedical@mitsgwalior.in",
    status: "approved"
  },
  {
    category: "Writing & Publishing",
    title: "IEEE Survey: Blockchain Scalability via Zero-Knowledge Rollups (zk-SNARKs)",
    description: "Conducting systematic literature survey and architectural comparison for decentralized high-throughput consensus mechanisms.",
    skillsNeeded: "Technical Writing, LaTeX, Cryptography fundamentals, Blockchain",
    discussionTime: "Thursday 5:00 PM, CSE Conference Room",
    contactEmail: "csresearch@mitsgwalior.in",
    status: "approved"
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

  const facultyUser = await User.findOne({ role: { $in: ["Professor", "Faculty", "Admin"] } });
  if (facultyUser) return facultyUser._id;

  const anyUser = await User.findOne({});
  return anyUser ? anyUser._id : null;
}

// Auto-seed verified research opportunities
async function seedFacultyPosts() {
  try {
    const count = await FacultyPost.countDocuments({ status: "approved" });
    if (count < 5) {
      const facultyUser = await User.findOne({ role: { $in: ["Professor", "Faculty", "Admin"] } }) || await User.findOne({});
      if (facultyUser) {
        for (const p of INITIAL_FACULTY_POSTS) {
          const exists = await FacultyPost.findOne({ title: p.title });
          if (!exists) {
            await FacultyPost.create({ ...p, userId: facultyUser._id });
          }
        }
        console.log("[PASS] Seeded verified MITS faculty research posts.");
      }
    }
  } catch (err) {
    console.warn("Faculty post seed note:", err.message);
  }
}
setTimeout(seedFacultyPosts, 2500);

// GET all approved research posts (supports category and search query)
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { status: "approved" };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { skillsNeeded: { $regex: term, $options: "i" } }
      ];
    }

    const posts = await FacultyPost.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name department role email contactEmail profilePicture")
      .populate("applicants", "name department role branch year email contactEmail profilePicture");

    res.json(posts);
  } catch (err) {
    console.error("FACULTY POSTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching posts." });
  }
});

// GET single research post
router.get("/:id", async (req, res) => {
  try {
    const post = await FacultyPost.findById(req.params.id)
      .populate("userId", "name department role email contactEmail profilePicture")
      .populate("applicants", "name department role branch year email contactEmail profilePicture");
    if (!post) {
      return res.status(404).json({ error: "Research post not found." });
    }
    res.json(post);
  } catch (err) {
    console.error("FACULTY POST GET ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching the research post." });
  }
});

// CREATE a new research collaboration post (default status: "approved" so it appears immediately)
router.post("/", async (req, res) => {
  try {
    const { userId, category, title, description, skillsNeeded, discussionTime, contactEmail, status } = req.body;

    if (!title || !title.trim() || !contactEmail || !contactEmail.trim()) {
      return res.status(400).json({ error: "Title and contact email are required." });
    }

    const validUserId = await resolveUserId(userId);

    const newPost = new FacultyPost({
      userId: validUserId,
      category: category || "Research",
      title: title.trim(),
      description: (description || "").trim(),
      skillsNeeded: (skillsNeeded || "").trim(),
      discussionTime: (discussionTime || "To be arranged with professor/team").trim(),
      contactEmail: contactEmail.trim(),
      status: status || "approved"
    });

    await newPost.save();
    await newPost.populate("userId", "name department role email contactEmail profilePicture");

    res.status(201).json(newPost);
  } catch (err) {
    console.error("FACULTY POST CREATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong creating the research posting." });
  }
});

// UPDATE an existing research post
router.put("/:id", async (req, res) => {
  try {
    const { category, title, description, skillsNeeded, discussionTime, contactEmail, status } = req.body;

    const updates = {};
    if (category) updates.category = category;
    if (title) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (skillsNeeded !== undefined) updates.skillsNeeded = skillsNeeded.trim();
    if (discussionTime !== undefined) updates.discussionTime = discussionTime.trim();
    if (contactEmail) updates.contactEmail = contactEmail.trim();
    if (status) updates.status = status;

    const updated = await FacultyPost.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    )
    .populate("userId", "name department role email contactEmail profilePicture")
    .populate("applicants", "name department role branch year email contactEmail profilePicture");

    if (!updated) {
      return res.status(404).json({ error: "Research post not found." });
    }

    res.json(updated);
  } catch (err) {
    console.error("FACULTY POST UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the research posting." });
  }
});

// DELETE a research post
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await FacultyPost.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Research post not found." });
    }
    res.json({ message: "Research posting deleted successfully." });
  } catch (err) {
    console.error("FACULTY POST DELETE ERROR:", err);
    res.status(500).json({ error: "Something went wrong deleting the research posting." });
  }
});

// APPLY to research post
router.post("/:id/apply", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required to apply." });
    }

    const validUserId = await resolveUserId(userId);
    if (!validUserId) {
      return res.status(400).json({ error: "Invalid user." });
    }

    const post = await FacultyPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Research post not found." });
    }

    if (String(post.userId) === String(validUserId)) {
      return res.status(400).json({ error: "You cannot apply to your own posting." });
    }

    if (post.applicants.some((a) => String(a) === String(validUserId))) {
      return res.status(400).json({ error: "You have already applied to this research posting." });
    }

    post.applicants.push(validUserId);
    await post.save();
    await post.populate("applicants", "name department role branch year email contactEmail profilePicture");

    res.json({
      contactEmail: post.contactEmail,
      applicantCount: post.applicants.length,
      applicants: post.applicants
    });
  } catch (err) {
    console.error("FACULTY POST APPLY ERROR:", err);
    res.status(500).json({ error: "Something went wrong applying." });
  }
});

module.exports = router;
