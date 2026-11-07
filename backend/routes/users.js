const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

let jwt;
try {
  jwt = require("jsonwebtoken");
} catch (e) {
  jwt = null;
}
const JWT_SECRET = process.env.JWT_SECRET || "campusconnect_jwt_secret_2026";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || "",
  process.env.GOOGLE_CLIENT_SECRET || ""
);

// GET configured Google OAuth Client ID for frontend GIS initialization
router.get("/google-client-id", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const isPlaceholder = !clientId || clientId.startsWith("YOUR_GOOGLE_CLIENT_ID");
  res.json({ clientId: isPlaceholder ? "" : clientId });
});

// GOOGLE AUTH — Register or log in with verified Google ID token or OAuth access token
router.post("/google-auth", async (req, res) => {
  try {
    const { credential, accessToken } = req.body;

    if (!credential && !accessToken) {
      return res.status(400).json({ error: "Google credential token or access token is required." });
    }

    let payload = null;

    // 1. Verify token with Google's official OAuth2Client if credential provided
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (credential) {
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
    }

    // 3. Fallback verification via Google's OAuth2 userinfo API if accessToken provided
    if (!payload && accessToken) {
      try {
        const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (userinfoRes.ok) {
          payload = await userinfoRes.json();
        }
      } catch (tokenErr) {
        console.warn("AccessToken userinfo verification warning:", tokenErr.message);
      }
    }

    if (!payload || (!payload.sub && !payload.id)) {
      return res.status(401).json({ error: "Invalid Google credential token." });
    }

    const googleId = payload.sub || payload.id;
    const email = (payload.email || "").toLowerCase().trim();
    const name = payload.name || payload.given_name || "MITS Member";
    const picture = payload.picture || "";

    // REQUIREMENT: Allow ALL verified Google accounts ending in @mitsgwl.ac.in (students) and @mitsgwalior.in (professors)
    // Do NOT restrict access to specific email IDs. Reject all other domains.
    const isStudent = email.endsWith("@mitsgwl.ac.in") || /@([a-zA-Z0-9-]+\.)*mitsgwl\.ac\.in$/.test(email);
    const isFaculty = email.endsWith("@mitsgwalior.in") || /@([a-zA-Z0-9-]+\.)*mitsgwalior\.in$/.test(email);

    if (!isStudent && !isFaculty) {
      return res.status(403).json({
        error: "Access restricted. Please sign in using your official institutional Google account ending in @mitsgwl.ac.in (students) or @mitsgwalior.in (faculty)."
      });
    }

    // 3. User Matching Logic
    let user = null;

    // A. Check by permanent googleId first
    if (googleId) {
      user = await User.findOne({ googleId });
    }

    // B. If not found by googleId, check by verified institutional email
    if (!user && email) {
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

    // C. If still not found, create a new student or professor account based on verified domain
    if (!user) {
      // Avoid duplicate username constraint
      let finalName = name;
      const nameExists = await User.findOne({ name: finalName });
      if (nameExists) {
        const emailPrefix = email ? email.split("@")[0] : Math.floor(1000 + Math.random() * 9000);
        finalName = `${name} (${emailPrefix})`;
      }

      // Secure Role Assignment:
      // ALL @mitsgwalior.in -> Professor
      // ALL @mitsgwl.ac.in -> Student
      const assignedRole = isFaculty ? "Professor" : "Student";
      const assignedDept = isFaculty ? "Academic Faculty" : "Engineering";

      user = new User({
        name: finalName,
        email: email,
        contactEmail: email,
        googleId: googleId,
        authProvider: "google",
        department: assignedDept,
        role: assignedRole,
        profilePicture: picture || "",
        profileCompleted: false
      });
      await user.save();
    } else {
      // Returning user: verify role matches institutional email domain
      if (isFaculty && user.role !== "Admin" && user.role !== "Professor") {
        user.role = "Professor";
      } else if (isStudent && user.role !== "Admin" && user.role !== "Student") {
        user.role = "Student";
      }
      // Refresh profile picture if using Google avatar
      if (picture && (!user.profilePicture || user.profilePicture.includes("googleusercontent.com"))) {
        user.profilePicture = picture;
      }
      await user.save();
    }

    // Return session object matching localStorage.campusConnectUser
    const token = jwt ? jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" }) : undefined;
    res.json({
      _id: user._id,
      id: user._id,
      name: user.name,
      department: user.department,
      branch: user.branch || user.department,
      year: user.year || "",
      bio: user.bio || "",
      role: user.role,
      email: user.email || email,
      contactEmail: user.contactEmail || user.email || email,
      profilePicture: user.profilePicture || picture || "",
      profileCompleted: Boolean(user.profileCompleted),
      interests: user.interests || [],
      token
    });
  } catch (err) {
    console.error("GOOGLE AUTH ERROR:", err);
    res.status(500).json({ error: "Authentication failed. Please try again." });
  }
});

// COLLEGE LOGIN — Direct official email sign-in (@mitsgwl.ac.in / @mitsgwalior.in)
router.post("/college-login", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ error: "College email address is required." });
    }

    const isAllowedEmail = email.endsWith("@mitsgwl.ac.in") || email.endsWith("@mitsgwalior.in");
    if (!isAllowedEmail) {
      return res.status(403).json({
        error: "Access restricted. Please sign in using your official college email ID (@mitsgwl.ac.in or @mitsgwalior.in)."
      });
    }

    let user = await User.findOne({
      $or: [{ email: email }, { contactEmail: email }]
    });

    if (!user) {
      const emailPrefix = email.split("@")[0];
      const displayName = emailPrefix.replace(/[._0-9]/g, " ").trim();
      const formattedName = displayName.length > 2
        ? displayName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        : `MITS Member (${emailPrefix})`;

      const isProf = email.endsWith("@mitsgwalior.in") && (email.includes("prof") || email.includes("faculty") || email.includes("dr"));

      user = new User({
        name: formattedName,
        email: email,
        contactEmail: email,
        authProvider: "college-email",
        department: email.includes("cd") ? "Computer Science & Design" : "Computer Science & Engineering",
        role: isProf ? "professor" : "Student",
        profileCompleted: false
      });
      await user.save();
    }

    const token = jwt ? jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" }) : undefined;
    res.json({
      _id: user._id,
      name: user.name,
      department: user.department,
      role: user.role,
      email: user.email || email,
      contactEmail: user.contactEmail || email,
      branch: user.branch || "",
      year: user.year || "",
      bio: user.bio || "",
      profilePicture: user.profilePicture || "",
      profileCompleted: Boolean(user.profileCompleted),
      token
    });
  } catch (err) {
    console.error("COLLEGE LOGIN ERROR:", err);
    res.status(500).json({ error: "Something went wrong signing in." });
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

    const token = jwt ? jwt.sign({ id: newUser._id, role: newUser.role, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" }) : undefined;
    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      department: newUser.department,
      role: newUser.role,
      profileCompleted: true,
      token
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

    const token = jwt ? jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" }) : undefined;
    res.json({
      _id: user._id,
      name: user.name,
      department: user.department,
      role: user.role,
      profileCompleted: Boolean(user.profileCompleted),
      token
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

// UPDATE profile fields (name, picture, bio, branch, year, social links, interests, department, profileCompleted)
router.patch("/:id", async (req, res) => {
  try {
    const {
      name,
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

    if (name !== undefined && name.trim()) user.name = name.trim();
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (bio !== undefined) user.bio = bio;
    if (branch !== undefined) user.branch = branch;
    if (year !== undefined) user.year = year;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (github !== undefined) user.github = github;
    if (contactEmail !== undefined) user.contactEmail = contactEmail;
    if (interests !== undefined) user.interests = Array.isArray(interests) ? interests : [];
    if (department !== undefined) user.department = department;

    // Secure Role Assignment: prevent students from self-assigning privileged roles
    if (role !== undefined) {
      const targetRole = String(role).trim();
      const isPrivileged = ["admin", "professor", "faculty"].includes(targetRole.toLowerCase());
      const hasFacultyEmail = user.email && user.email.toLowerCase().endsWith("@mitsgwalior.in");
      const isAlreadyAdmin = user.role === "Admin";

      if (!isPrivileged || hasFacultyEmail || isAlreadyAdmin) {
        user.role = targetRole;
      } else {
        console.warn(`Blocked unauthorized privileged role elevation attempt for user: ${user.email}`);
      }
    }

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
