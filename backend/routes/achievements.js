const express = require("express");
const router = express.Router();
const Achievement = require("../models/Achievement");

// SUBMIT a new student achievement (starts as "self-reported" / unverified)
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      title,
      studentName,
      competition,
      category,
      achievementType,
      description,
      date,
      evidenceUrl,
      photoUrl,
      imageUrl,
      image,
      photo,
      sourceName,
      sourceUrl,
      stack
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Achievement title is required." });
    }

    const resolvedPhoto = (photoUrl || imageUrl || image || photo || "").trim();

    const newAchievement = new Achievement({
      userId: userId || null,
      title: title.trim(),
      studentName: studentName ? studentName.trim() : "",
      competition: competition ? competition.trim() : "",
      category: category && category.trim() ? category.trim() : "Hackathon",
      achievementType: achievementType === "Institutional" ? "Institutional" : "Student",
      description: description ? description.trim() : "",
      date: date ? date.trim() : "",
      evidenceUrl: evidenceUrl ? evidenceUrl.trim() : "",
      photoUrl: resolvedPhoto,
      sourceName: sourceName ? sourceName.trim() : "Self-Reported Student Submission",
      sourceUrl: sourceUrl ? sourceUrl.trim() : (evidenceUrl ? evidenceUrl.trim() : ""),
      stack: stack ? stack.trim() : "",
      status: "self-reported",
      isVerified: false
    });

    await newAchievement.save();
    if (userId) {
      await newAchievement.populate("userId", "name department branch");
    }

    const result = newAchievement.toObject();
    result.isVerified = false;
    result.verificationStatus = "self-reported";

    res.status(201).json(result);
  } catch (err) {
    console.error("ACHIEVEMENT SUBMIT ERROR:", err);
    res.status(500).json({ error: "Something went wrong submitting the achievement." });
  }
});

// GET genuine student & institutional achievements (both verified and self-reported; excluding rejected)
router.get("/", async (req, res) => {
  try {
    const achievements = await Achievement.find({ status: { $ne: "rejected" } })
      .populate("userId", "name department branch")
      .sort({ createdAt: -1 });

    const normalized = achievements.map((ach) => {
      const item = ach.toObject();
      const isVerified = Boolean(item.isVerified === true || item.status === "approved");
      const authorName = item.studentName || item.userId?.name || (item.achievementType === "Institutional" ? "Madhav Institute of Technology & Science" : "Student");
      return {
        ...item,
        studentName: authorName,
        isVerified,
        verificationStatus: isVerified ? "verified" : "self-reported"
      };
    });

    res.json(normalized);
  } catch (err) {
    console.error("ACHIEVEMENTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching achievements." });
  }
});

// GET achievements for a specific user (for profile view)
router.get("/user/:userId", async (req, res) => {
  try {
    const achievements = await Achievement.find({
      userId: req.params.userId,
      status: { $ne: "rejected" }
    }).sort({ createdAt: -1 });

    const normalized = achievements.map((ach) => {
      const item = ach.toObject();
      const isVerified = Boolean(item.isVerified === true || item.status === "approved");
      return {
        ...item,
        isVerified,
        verificationStatus: isVerified ? "verified" : "self-reported"
      };
    });

    res.json(normalized);
  } catch (err) {
    console.error("USER ACHIEVEMENTS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching achievements." });
  }
});

module.exports = router;
