const express = require("express");
const router = express.Router();
const Certification = require("../models/Certification");

// ADD a new certification for a user
router.post("/", async (req, res) => {
  try {
    const { userId, name, issuingOrganization, issueDate, credentialUrl, imageUrl } = req.body;

    if (!userId || !name || !name.trim() || !issuingOrganization || !issuingOrganization.trim()) {
      return res.status(400).json({ error: "userId, certificate name, and issuing organization are required." });
    }

    const newCert = new Certification({
      userId,
      name: name.trim(),
      issuingOrganization: issuingOrganization.trim(),
      issueDate: issueDate ? issueDate.trim() : "",
      credentialUrl: credentialUrl ? credentialUrl.trim() : "",
      imageUrl: imageUrl ? imageUrl.trim() : ""
    });

    await newCert.save();
    res.status(201).json(newCert);
  } catch (err) {
    console.error("CERTIFICATION ADD ERROR:", err);
    res.status(500).json({ error: "Something went wrong adding the certification." });
  }
});

// GET all certifications for a specific user
router.get("/:userId", async (req, res) => {
  try {
    const certs = await Certification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(certs);
  } catch (err) {
    console.error("CERTIFICATIONS FETCH ERROR:", err);
    res.status(500).json({ error: "Something went wrong fetching certifications." });
  }
});

// UPDATE an existing certification
router.put("/:id", async (req, res) => {
  try {
    const { name, issuingOrganization, issueDate, credentialUrl, imageUrl } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (issuingOrganization) updates.issuingOrganization = issuingOrganization.trim();
    if (issueDate !== undefined) updates.issueDate = issueDate.trim();
    if (credentialUrl !== undefined) updates.credentialUrl = credentialUrl.trim();
    if (imageUrl !== undefined) updates.imageUrl = imageUrl.trim();

    const updated = await Certification.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Certification not found." });
    }

    res.json(updated);
  } catch (err) {
    console.error("CERTIFICATION UPDATE ERROR:", err);
    res.status(500).json({ error: "Something went wrong updating the certification." });
  }
});

// DELETE a certification
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Certification.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Certification not found." });
    }
    res.json({ message: "Certification deleted successfully." });
  } catch (err) {
    console.error("CERTIFICATION DELETE ERROR:", err);
    res.status(500).json({ error: "Something went wrong deleting the certification." });
  }
});

module.exports = router;
