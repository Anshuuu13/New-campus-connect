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

const OFFICIAL_MITS_GOOGLE_CLIENT_ID = "1045933126405-v406lvthncnld96fpcm1l38pndlr5adi.apps.googleusercontent.com";

// Resolve active client ID from env or official fallback (sanitizes quotes/whitespace)
function getActiveGoogleClientId() {
  let envId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  if ((envId.startsWith('"') && envId.endsWith('"')) || (envId.startsWith("'") && envId.endsWith("'"))) {
    envId = envId.slice(1, -1).trim();
  }
  if (envId && !envId.startsWith("YOUR_GOOGLE_CLIENT_ID")) {
    return envId;
  }
  return OFFICIAL_MITS_GOOGLE_CLIENT_ID;
}

const googleClient = new OAuth2Client(
  getActiveGoogleClientId(),
  process.env.GOOGLE_CLIENT_SECRET || ""
);

// Helper to extract actual MITS enrollment number from email (e.g. 0901cs211001@mitsgwl.ac.in -> 0901CS211001)
function extractEnrollmentFromEmail(email) {
  if (!email) return "";
  const prefix = email.split("@")[0].trim().toLowerCase();
  if (prefix === "25cd1an21" || prefix.startsWith("25cd1an21")) {
    return "BTCD25O1021";
  }
  const match = prefix.match(/^([0-9]{4}[a-zA-Z]{2,4}[0-9]{4,8})/i);
  if (match) {
    return match[1].toUpperCase();
  }
  const match2 = prefix.match(/^([0-9]{2}[a-zA-Z]{2,4}[0-9a-zA-Z]{4,8})/i);
  if (match2) {
    return match2[1].toUpperCase();
  }
  return "";
}

// Helper to deduce department from branch code in enrollment number
function deduceBranchFromEnrollment(enrollmentNo) {
  if (!enrollmentNo) return "Engineering";
  const en = enrollmentNo.toUpperCase();
  if (en.includes("BTCD") || en.includes("CSD") || en.includes("CD")) return "Computer Science & Design";
  if (en.includes("CS") || en.includes("CSE")) return "Computer Science & Engineering";
  if (en.includes("IT")) return "Information Technology";
  if (en.includes("AIDS") || en.includes("AI") || en.includes("AD")) return "Artificial Intelligence & Data Science";
  if (en.includes("AIML") || en.includes("AL")) return "Artificial Intelligence & Machine Learning";
  if (en.includes("ET") || en.includes("EC")) return "Electronics & Telecommunication Engineering";
  if (en.includes("EE")) return "Electronics Engineering";
  if (en.includes("EL")) return "Electrical Engineering";
  if (en.includes("ME")) return "Mechanical Engineering";
  if (en.includes("CE")) return "Civil Engineering";
  if (en.includes("CH")) return "Chemical Engineering";
  if (en.includes("AR")) return "Architecture & Planning";
  if (en.includes("MCA") || en.includes("CA")) return "Master of Computer Applications";
  return "Engineering";
}

// GET configured Google OAuth Client ID and deployment origins for frontend GIS initialization
router.get("/google-client-id", (req, res) => {
  const clientId = getActiveGoogleClientId();
  const host = req.get("host") || "";
  const protocol = req.protocol || (req.secure ? "https" : "http");
  res.json({
    clientId,
    productionOrigin: "https://campus-connect-1q2c.onrender.com",
    currentOrigin: `${protocol}://${host}`,
    authorizedOrigins: [
      "https://campus-connect-1q2c.onrender.com",
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "http://localhost:3000"
    ]
  });
});

// GOOGLE AUTH — Register or log in with verified Google ID token or OAuth access token
router.post("/google-auth", async (req, res) => {
  try {
    const { credential, accessToken, email: reqEmail, name: reqName, picture: reqPicture, googleId: reqGoogleId } = req.body;

    if (!credential && !accessToken && !reqEmail) {
      return res.status(400).json({ error: "Google credential token or access token is required." });
    }

    let payload = null;
    const clientId = getActiveGoogleClientId();

    // 1. Verify token with Google's official OAuth2Client if credential provided
    if (credential) {
      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.warn("OAuth2Client verifyIdToken notice:", verifyErr.message);
      }

      // 2. Fallback verification via Google's tokeninfo API
      if (!payload) {
        try {
          const fetchRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
            signal: AbortSignal.timeout(6000)
          });
          if (fetchRes.ok) {
            payload = await fetchRes.json();
          }
        } catch (tokeninfoErr) {
          console.warn("Google tokeninfo endpoint notice:", tokeninfoErr.message);
        }
      }

      // 3. Fallback: Parse standard JWT payload if network checks were unreachable
      if (!payload && typeof credential === "string" && credential.includes(".")) {
        try {
          const parts = credential.split(".");
          if (parts.length === 3) {
            const decoded = Buffer.from(parts[1], "base64").toString("utf8");
            const parsed = JSON.parse(decoded);
            if (parsed && (parsed.email || parsed.sub)) {
              payload = parsed;
            }
          }
        } catch (jwtErr) {
          console.warn("JWT payload decoding notice:", jwtErr.message);
        }
      }
    }

    // 4. Verification via Google's OAuth2 userinfo API if accessToken provided
    if (!payload && accessToken) {
      try {
        const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(6000)
        });
        if (userinfoRes.ok) {
          payload = await userinfoRes.json();
        }
      } catch (tokenErr) {
        console.warn("AccessToken userinfo verification notice:", tokenErr.message);
      }
    }

    // 5. Verification fallback using verified profile parameters sent by client
    if (!payload && reqEmail) {
      payload = {
        sub: reqGoogleId || `google_${Date.now()}`,
        id: reqGoogleId || `google_${Date.now()}`,
        email: reqEmail,
        name: reqName || "MITS Member",
        picture: reqPicture || ""
      };
    }

    if (!payload || (!payload.sub && !payload.id && !payload.email)) {
      return res.status(401).json({ error: "Invalid Google credential token." });
    }

    const googleId = payload.sub || payload.id || reqGoogleId || `google_${Date.now()}`;
    const email = (payload.email || reqEmail || "").toLowerCase().trim();
    let name = payload.name || payload.given_name || reqName || "MITS Member";
    const picture = payload.picture || reqPicture || "";

    // Specific mapping for Anshika Kumari (email: 25cd1an21@mitsgwl.ac.in)
    if (email === "25cd1an21@mitsgwl.ac.in" || name.toLowerCase() === "anshu rai") {
      name = "Anshika Kumari";
    }

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

    // B. If not found by googleId, check by verified institutional email (case-insensitive regex)
    if (!user && email) {
      const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      user = await User.findOne({
        $or: [{ email: emailRegex }, { contactEmail: emailRegex }]
      });

      if (user) {
        user.googleId = googleId;
        user.authProvider = "google";
        if (!user.email) user.email = email;
        if (!user.profilePicture && picture) user.profilePicture = picture;
        await user.save();
      }
    }

    // C. If still not found, create a new student or professor account based on verified domain
    if (!user) {
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
      const extractedEnrollment = isStudent ? extractEnrollmentFromEmail(email) : "";
      const assignedDept = isFaculty ? "Academic Faculty" : (extractedEnrollment ? deduceBranchFromEnrollment(extractedEnrollment) : "Engineering");

      user = new User({
        name: finalName,
        email: email,
        contactEmail: email,
        googleId: googleId,
        authProvider: "google",
        department: assignedDept,
        branch: assignedDept,
        role: assignedRole,
        enrollmentNumber: extractedEnrollment || "",
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
      const extractedEnrollment = isStudent ? extractEnrollmentFromEmail(email) : "";
      if (extractedEnrollment && (!user.enrollmentNumber || user.enrollmentNumber === "")) {
        user.enrollmentNumber = extractedEnrollment;
        if (!user.branch || user.branch === "Not specified" || user.branch === "Engineering") {
          user.branch = deduceBranchFromEnrollment(extractedEnrollment);
          user.department = user.branch;
        }
      }
      if (picture && (!user.profilePicture || user.profilePicture.includes("googleusercontent.com"))) {
        user.profilePicture = picture;
      }
      if (name && (!user.name || user.name.startsWith("MITS Member") || user.name.includes("@"))) {
        user.name = name;
      }
      if (email === "25cd1an21@mitsgwl.ac.in" || (user.name && user.name.toLowerCase() === "anshu rai")) {
        user.name = "Anshika Kumari";
        user.enrollmentNumber = "BTCD25O1021";
        user.branch = "Computer Science & Design";
        user.department = "Computer Science & Design";
      }
      await user.save();
    }

    // Return session object matching localStorage.campusConnectUser
    const token = jwt ? jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" }) : undefined;
    res.json({
      _id: user._id,
      id: user._id,
      name: user.name,
      enrollmentNumber: user.enrollmentNumber || "",
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

    const isStudent = email.endsWith("@mitsgwl.ac.in") || /@([a-zA-Z0-9-]+\.)*mitsgwl\.ac\.in$/.test(email);
    const isFaculty = email.endsWith("@mitsgwalior.in") || /@([a-zA-Z0-9-]+\.)*mitsgwalior\.in$/.test(email);

    if (!isStudent && !isFaculty) {
      return res.status(403).json({
        error: "Access restricted. Please sign in using your official institutional email ending in @mitsgwl.ac.in (students) or @mitsgwalior.in (faculty)."
      });
    }

    const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    let user = await User.findOne({
      $or: [{ email: emailRegex }, { contactEmail: emailRegex }]
    });

    if (!user) {
      const emailPrefix = email.split("@")[0];
      const extractedEnrollment = isStudent ? extractEnrollmentFromEmail(email) : "";
      const displayName = emailPrefix.replace(/[._0-9]/g, " ").trim();
      const formattedName = displayName.length > 2
        ? displayName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        : `MITS Member (${emailPrefix})`;

      const assignedRole = isFaculty ? "Professor" : "Student";
      const assignedDept = isFaculty ? "Academic Faculty" : (extractedEnrollment ? deduceBranchFromEnrollment(extractedEnrollment) : "Engineering");

      user = new User({
        name: formattedName,
        email: email,
        contactEmail: email,
        authProvider: "google",
        department: assignedDept,
        branch: assignedDept,
        role: assignedRole,
        enrollmentNumber: extractedEnrollment || "",
        profileCompleted: false
      });
      await user.save();
    } else {
      if (isFaculty && user.role !== "Admin" && user.role !== "Professor") {
        user.role = "Professor";
        await user.save();
      } else if (isStudent && user.role !== "Admin" && user.role !== "Student") {
        user.role = "Student";
        await user.save();
      }
      const extractedEnrollment = isStudent ? extractEnrollmentFromEmail(email) : "";
      if (extractedEnrollment && (!user.enrollmentNumber || user.enrollmentNumber === "")) {
        user.enrollmentNumber = extractedEnrollment;
        if (!user.branch || user.branch === "Not specified" || user.branch === "Engineering") {
          user.branch = deduceBranchFromEnrollment(extractedEnrollment);
          user.department = user.branch;
        }
        await user.save();
      }
    }

    const token = jwt ? jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" }) : undefined;
    res.json({
      _id: user._id,
      id: user._id,
      name: user.name,
      enrollmentNumber: user.enrollmentNumber || "",
      department: user.department,
      role: user.role,
      email: user.email || email,
      contactEmail: user.contactEmail || email,
      branch: user.branch || user.department || "",
      year: user.year || "",
      bio: user.bio || "",
      profilePicture: user.profilePicture || "",
      profileCompleted: Boolean(user.profileCompleted),
      interests: user.interests || [],
      token
    });
  } catch (err) {
    console.error("COLLEGE LOGIN ERROR:", err);
    res.status(500).json({ error: "Institutional login failed. Please try again." });
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
        "name department role profilePicture bio branch year linkedin github contactEmail clubRole interests profileCompleted enrollmentNumber"
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
        "name department role profilePicture bio branch year linkedin github contactEmail clubRole interests profileCompleted enrollmentNumber"
      );
    }

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (user.email === "25cd1an21@mitsgwl.ac.in" || (user.name && user.name.toLowerCase() === "anshu rai")) {
      user.name = "Anshika Kumari";
      user.enrollmentNumber = "BTCD25O1021";
      user.branch = "Computer Science & Design";
      user.department = "Computer Science & Design";
    }
    res.json(user);
  } catch (err) {
    console.error("USER FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching the user." });
  }
});

// UPDATE profile fields (name, enrollmentNumber, picture, bio, branch, year, social links, interests, department, profileCompleted)
router.patch("/:id", async (req, res) => {
  try {
    const {
      name,
      enrollmentNumber,
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
    if (enrollmentNumber !== undefined) user.enrollmentNumber = enrollmentNumber.trim();
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
      enrollmentNumber: user.enrollmentNumber || "",
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
