const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");

// SIGN UP — create a new user
router.post("/", async (req, res) => {

  try {
    const { name, department, role, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: "Name and password are required." });
    }

    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this name already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      department,
      role,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      department: newUser.department,
      role: newUser.role
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ error: "Something went wrong signing up." });
  }
});

// LOGIN — check name + password
router.post("/login", async (req, res) => {

  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: "Name and password are required." });
    }

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(400).json({ error: "No account found with that name." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      department: user.department,
      role: user.role
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Something went wrong logging in." });
  }
});

// GET all users (for testing)
router.get("/", async (req, res) => { 

  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("USERS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching users." });
  }
}); 

// GET a single user's public info (for profile page)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name department role profilePicture bio branch year linkedin github contactEmail"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(user);
  } catch (err) {
    console.error("USER FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching the user." });
  }
});

// UPDATE profile fields (picture, bio, branch, year, social links)
router.patch("/:id", async (req, res) => {
  try {
    const { profilePicture, bio, branch, year, linkedin, github, contactEmail } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { profilePicture, bio, branch, year, linkedin, github, contactEmail },
      { new: true }
    ).select("name department role profilePicture bio branch year linkedin github contactEmail");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the profile." });
  }
});

module.exports = router;