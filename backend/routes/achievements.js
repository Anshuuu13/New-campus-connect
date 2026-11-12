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

    const trimmedTitle = title.trim();
    const resolvedPhoto = (photoUrl || imageUrl || image || photo || "").trim();

    // Prevent duplicate records: if an achievement with this title already exists, update and return it
    const escapedRegex = trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await Achievement.findOne({
      title: { $regex: new RegExp(`^${escapedRegex}$`, "i") }
    });

    if (existing) {
      if (userId) existing.userId = userId;
      if (studentName && studentName.trim()) existing.studentName = studentName.trim();
      if (competition && competition.trim()) existing.competition = competition.trim();
      if (category && category.trim()) existing.category = category.trim();
      if (achievementType) existing.achievementType = achievementType === "Institutional" ? "Institutional" : "Student";
      if (description && description.trim()) existing.description = description.trim();
      if (date && date.trim()) existing.date = date.trim();
      if (evidenceUrl && evidenceUrl.trim()) existing.evidenceUrl = evidenceUrl.trim();
      if (resolvedPhoto) existing.photoUrl = resolvedPhoto;
      if (sourceName && sourceName.trim()) existing.sourceName = sourceName.trim();
      if (sourceUrl && sourceUrl.trim()) existing.sourceUrl = sourceUrl.trim();
      if (stack && stack.trim()) existing.stack = stack.trim();
      await existing.save();

      if (existing.userId) {
        await existing.populate("userId", "name department branch");
      }
      const existingObj = existing.toObject();
      existingObj.isVerified = Boolean(existingObj.isVerified === true || existingObj.status === "approved");
      existingObj.verificationStatus = existingObj.isVerified ? "verified" : "self-reported";

      return res.status(201).json(existingObj);
    }

    const newAchievement = new Achievement({
      userId: userId || null,
      title: trimmedTitle,
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

    // Deduplicate records by normalized title so each achievement appears only once
    const seenTitles = new Set();
    const uniqueNormalized = [];
    for (const ach of achievements) {
      const item = ach.toObject();
      const normTitle = (item.title || "").toLowerCase().trim();
      if (!normTitle || seenTitles.has(normTitle)) continue;
      seenTitles.add(normTitle);

      const isVerified = Boolean(item.isVerified === true || item.status === "approved");
      const authorName = item.studentName || item.userId?.name || (item.achievementType === "Institutional" ? "Madhav Institute of Technology & Science" : "Student");
      uniqueNormalized.push({
        ...item,
        studentName: authorName,
        isVerified,
        verificationStatus: isVerified ? "verified" : "self-reported"
      });
    }

    res.json(uniqueNormalized);
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
