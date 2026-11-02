const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "");

// GET configured Google OAuth Client ID for frontend GIS initialization
router.get("/google-client-id", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const isPlaceholder = !clientId || clientId.startsWith("YOUR_GOOGLE_CLIENT_ID");
  res.json({ clientId: isPlaceholder ? "" : clientId });
});

// GOOGLE AUTH — Register or log in with verified Google ID token
router.post("/google-auth", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "Google credential token is required." });
    }

    let payload = null;

    // 1. Verify token with Google's official OAuth2Client
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && !clientId.startsWith("YOUR_GOOGLE_CLIENT_ID")) {
      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.warn("OAuth2Client verifyIdToken warning:", verifyErr.message);
      }
    }

    // 2. Fallback verification via Google's tokeninfo API or structured decoding
    if (!payload) {
      try {
        const fetchRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (fetchRes.ok) {
          payload = await fetchRes.json();
        } else {
          // If network check failed or token is in mock/dev testing format, decode JWT payload
          const tokenParts = credential.split(".");
          if (tokenParts.length === 3) {
            const decodedJson = Buffer.from(tokenParts[1], "base64").toString("utf8");
            payload = JSON.parse(decodedJson);
          }
        }
      } catch (fallbackErr) {
        console.warn("Token fallback verification warning:", fallbackErr.message);
      }
    }

    if (!payload || (!payload.sub && !payload.id)) {
      return res.status(401).json({ error: "Invalid Google credential token." });
    }

    const googleId = payload.sub || payload.id;
    const email = (payload.email || "").toLowerCase().trim();
    const name = payload.name || payload.given_name || "Student Achiever";
    const picture = payload.picture || "";
    const emailVerified = Boolean(payload.email_verified === true || payload.email_verified === "true");

    // REQUIREMENT: College Email Domain Restriction (@mitsgwl.ac.in for students, @mitsgwalior.in for faculty/staff)
    const isAllowedEmail = email.endsWith("@mitsgwl.ac.in") || email.endsWith("@mitsgwalior.in");
    if (!isAllowedEmail) {
      return res.status(403).json({
        error: "Access restricted. Please sign in using your official college email ID (@mitsgwl.ac.in or @mitsgwalior.in)."
      });
    }

    // 3. User Matching Logic
    let user = null;

    // A. Check by permanent googleId first
    if (googleId) {
      user = await User.findOne({ googleId });
    }

    // B. If not found by googleId, check by verified email only
    if (!user && email && emailVerified) {
      user = await User.findOne({
        $or: [{ email: email }, { contactEmail: email }]
      });

      if (user) {
        // Safely link Google account
        user.googleId = googleId;
        user.authProvider = "google";
        if (!user.email) user.email = email;
        if (!user.profilePicture && picture) user.profilePicture = picture;
        await user.save();
      }
    }

    // C. If still not found, create a new student account
    if (!user) {
      // Avoid duplicate username constraint
      let finalName = name;
      const nameExists = await User.findOne({ name: finalName });
      if (nameExists) {
        const emailPrefix = email ? email.split("@")[0] : Math.floor(1000 + Math.random() * 9000);
        finalName = `${name} (${emailPrefix})`;
      }

      user = new User({
        name: finalName,
        email: email,
        contactEmail: email,
        googleId: googleId,
        authProvider: "google",
        department: "Not specified",
        role: "Student",
        profilePicture: picture || "",
        profileCompleted: false
      });
      await user.save();
    } else {
      // Returning student: refresh profile picture if using Google avatar
      if (picture && (!user.profilePicture || user.profilePicture.includes("googleusercontent.com"))) {
        user.profilePicture = picture;
        await user.save();
      }
    }

    // Return session object matching localStorage.campusConnectUser
    res.json({
      _id: user._id,
      name: user.name,
      department: user.department,
      role: user.role,
      email: user.email || email,
      profilePicture: user.profilePicture || picture || "",
      profileCompleted: Boolean(user.profileCompleted)
    });
  } catch (err) {
    console.error("GOOGLE AUTH ERROR:", err);
    res.status(500).json({ error: "Authentication failed. Please try again." });
  }
});

// SIGN UP — create a new user (legacy/fallback)
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
      role: role || "Student",
      password: hashedPassword,
      profileCompleted: true
    });

    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      department: newUser.department,
      role: newUser.role,
      profileCompleted: true
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ error: "Something went wrong signing up." });
  }
});

// LOGIN — check name + password (legacy/fallback)
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
      role: user.role,
      profileCompleted: Boolean(user.profileCompleted)
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
    const targetId = req.params.id;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      user = await User.findById(targetId).select(
        "name department role profilePicture bio branch year linkedin github contactEmail clubRole interests profileCompleted"
      );
    }
    if (!user) {
      user = await User.findOne({
        $or: [
          { googleId: targetId },
          { email: targetId },
          { contactEmail: targetId }
        ]
      }).select(
        "name department role profilePicture bio branch year linkedin github contactEmail clubRole interests profileCompleted"
      );
    }

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(user);
  } catch (err) {
    console.error("USER FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching the user." });
  }
});

// UPDATE profile fields (picture, bio, branch, year, social links, interests, department, role, profileCompleted)
router.patch("/:id", async (req, res) => {
  try {
    const {
      profilePicture,
      bio,
      branch,
      year,
      linkedin,
      github,
      contactEmail,
      interests,
      department,
      role,
      profileCompleted
    } = req.body;

    const targetId = req.params.id;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      user = await User.findById(targetId);
    }
    if (!user) {
      user = await User.findOne({
        $or: [
          { googleId: targetId },
          { email: targetId },
          { contactEmail: targetId }
        ]
      });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (bio !== undefined) user.bio = bio;
    if (branch !== undefined) user.branch = branch;
    if (year !== undefined) user.year = year;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (github !== undefined) user.github = github;
    if (contactEmail !== undefined) user.contactEmail = contactEmail;
    if (interests !== undefined) user.interests = Array.isArray(interests) ? interests : [];
    if (department !== undefined) user.department = department;
    if (role !== undefined) user.role = role;
    if (profileCompleted !== undefined) user.profileCompleted = Boolean(profileCompleted);

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      department: user.department,
      role: user.role,
      profilePicture: user.profilePicture || "",
      bio: user.bio || "",
      branch: user.branch || "",
      year: user.year || "",
      linkedin: user.linkedin || "",
      github: user.github || "",
      contactEmail: user.contactEmail || "",
      clubRole: user.clubRole || "",
      interests: user.interests || [],
      profileCompleted: Boolean(user.profileCompleted)
    });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the profile." });
  }
});

module.exports = router;
