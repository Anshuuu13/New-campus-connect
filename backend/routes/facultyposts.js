const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const FacultyPost = require("../models/FacultyPost");

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
  }
];

const User = require("../models/User");

async function seedFacultyPosts() {
  try {
    const count = await FacultyPost.countDocuments({ status: "approved" });
    if (count < 5) {
      const facultyUser = await User.findOne({ role: { $in: ["Professor", "Admin"] } }) || await User.findOne({});
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
setTimeout(seedFacultyPosts, 2000);

// CREATE a new post (starts as "pending")
router.post("/", async (req, res) => {
  try {
    const { userId, category, title, description, skillsNeeded, discussionTime, contactEmail } = req.body;

    if (!userId || !title || !contactEmail) {
      return res.status(400).json({ error: "userId, title, and contactEmail are required." });
    }

    const newPost = new FacultyPost({ userId, category, title, description, skillsNeeded, discussionTime, contactEmail });
    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    console.error("FACULTY POST CREATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong posting." });
  }
});

// GET only approved posts (for the public page)
router.get("/", async (req, res) => {
  try {
    const posts = await FacultyPost.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .populate("userId", "name department")
      .populate("applicants", "name department");
    res.json(posts);
  } catch (err) {
    console.error("FACULTY POSTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching posts." });
  }
});

// APPLY (adds the student to the applicants list, prevents duplicates and self-apply)
router.post("/:id/apply", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const post = await FacultyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    if (post.userId.toString() === userId) {
      return res.status(400).json({ error: "You can't apply to your own posting." });
    }

    if (post.applicants.some((a) => a.toString() === userId)) {
      return res.status(400).json({ error: "You've already applied to this posting." });
    }

    post.applicants.push(userId);
    await post.save();

    res.json({ contactEmail: post.contactEmail, applicantCount: post.applicants.length });
  } catch (err) {
    console.error("FACULTY POST APPLY ERROR:", err);
    res.status(500).json({ error: "Something went wrong applying." });
  }
});

module.exports = router;