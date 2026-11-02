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

// Helper: Check if user has professor / faculty role
function isProfessorRole(user) {
  if (!user || !user.role) return false;
  const roleStr = String(user.role).trim().toLowerCase();
  return roleStr === "professor" || roleStr === "faculty";
}

// Helper: Safely resolve a valid User model instance
async function resolveUserDoc(inputUserId) {
  if (!inputUserId) return null;
  if (mongoose.Types.ObjectId.isValid(inputUserId)) {
    const existing = await User.findById(inputUserId);
    if (existing) return existing;
  }
  return await User.findOne({
    $or: [
      { googleId: inputUserId },
      { email: inputUserId },
      { contactEmail: inputUserId },
      { name: inputUserId }
    ]
  });
}

// Auto-seed verified research opportunities
async function seedFacultyPosts() {
  try {
    const count = await FacultyPost.countDocuments({ status: "approved" });
    if (count < 5) {
      let facultyUser = await User.findOne({
        role: { $in: ["Professor", "Faculty", "Admin", "professor", "faculty"] }
      });
      if (!facultyUser) {
        facultyUser = await User.create({
          name: "Dr. R. K. Pandit",
          department: "Electronics & Communication",
          role: "Professor",
          email: "rkpandit@mitsgwalior.in",
          contactEmail: "rkpandit@mitsgwalior.in",
          profileCompleted: true
        });
      }
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

// CREATE a new research collaboration post (Role-Based Access Control: Professor/Faculty only)
router.post("/", async (req, res) => {
  try {
    const { userId, category, title, description, skillsNeeded, discussionTime, contactEmail, status } = req.body;

    if (!title || !title.trim() || !contactEmail || !contactEmail.trim()) {
      return res.status(400).json({ error: "Title and contact email are required." });
    }

    // Role check: Only users logged in as professor can create research opportunities
    const reqUserId = userId || req.headers["x-user-id"];
    if (!reqUserId) {
      return res.status(401).json({ error: "Authentication required. Please sign in to create a post." });
    }

    const postingUser = await resolveUserDoc(reqUserId);
    if (!postingUser) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!isProfessorRole(postingUser)) {
      return res.status(403).json({
        error: "Access denied. Only professors can create research opportunities."
      });
    }

    const newPost = new FacultyPost({
      userId: postingUser._id,
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

// UPDATE an existing research post (Role-Based Access Control: Professor/Faculty only)
router.put("/:id", async (req, res) => {
  try {
    const { userId, category, title, description, skillsNeeded, discussionTime, contactEmail, status } = req.body;

    const existingPost = await FacultyPost.findById(req.params.id);
    if (!existingPost) {
      return res.status(404).json({ error: "Research post not found." });
    }

    // Role check: Only users logged in as professor can edit research opportunities
    const reqUserId = userId || req.headers["x-user-id"] || req.query.userId;
    if (reqUserId) {
      const updatingUser = await resolveUserDoc(reqUserId);
      if (!updatingUser) {
        return res.status(404).json({ error: "User not found." });
      }
      if (!isProfessorRole(updatingUser)) {
        return res.status(403).json({
          error: "Access denied. Only professors can edit research opportunities."
        });
      }
    } else {
      const postAuthor = await User.findById(existingPost.userId);
      if (postAuthor && !isProfessorRole(postAuthor)) {
        return res.status(403).json({
          error: "Access denied. Only professors can edit research opportunities."
        });
      }
    }

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

    res.json(updated);
  } catch (err) {
    console.error("FACULTY POST UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the research posting." });
  }
});

// DELETE a research post (Role-Based Access Control: Professor/Faculty only)
router.delete("/:id", async (req, res) => {
  try {
    const existingPost = await FacultyPost.findById(req.params.id);
    if (!existingPost) {
      return res.status(404).json({ error: "Research post not found." });
    }

    const reqUserId = req.body?.userId || req.headers["x-user-id"] || req.query.userId;
    if (reqUserId) {
      const deletingUser = await resolveUserDoc(reqUserId);
      if (!deletingUser) {
        return res.status(404).json({ error: "User not found." });
      }
      if (!isProfessorRole(deletingUser)) {
        return res.status(403).json({
          error: "Access denied. Only professors can delete research opportunities."
        });
      }
    }

    await FacultyPost.findByIdAndDelete(req.params.id);
    res.json({ message: "Research posting deleted successfully." });
  } catch (err) {
    console.error("FACULTY POST DELETE ERROR:", err);
    res.status(500).json({ error: "Something went wrong deleting the research posting." });
  }
});

// APPLY to research post (Students and researchers can apply)
router.post("/:id/apply", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required to apply." });
    }

    const validUser = await resolveUserDoc(userId);
    if (!validUser) {
      return res.status(400).json({ error: "Invalid user." });
    }
    const validUserId = validUser._id;

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
