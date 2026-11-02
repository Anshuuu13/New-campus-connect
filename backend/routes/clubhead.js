const express = require("express");
const router = express.Router();
let ClubHeadRequest;
try {
  ClubHeadRequest = require("../models/clubheadrequest");
} catch (e) {
  ClubHeadRequest = require("../models/ClubHeadRequest");
}
const User = require("../models/User");

// Student submits a club head request
router.post("/request", async (req, res) => {
  try {
    const { userId, club, role } = req.body;

    const newRequest = new ClubHeadRequest({
      user: userId,
      club,
      role
    });

    await newRequest.save();
    res.json(newRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all pending requests
router.get("/pending", async (req, res) => {
  try {
    const requests = await ClubHeadRequest.find({ status: "pending" }).populate("user", "name department");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: approve a request
router.patch("/:id/approve", async (req, res) => {
  try {
    const request = await ClubHeadRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Block duplicate: check if someone else already holds this club+role approved
    const existing = await ClubHeadRequest.findOne({
      club: request.club,
      role: request.role,
      status: "approved"
    });
    if (existing) {
      return res.status(400).json({ error: "Someone already holds this role for this club." });
    }

    request.status = "approved";
    await request.save();

    
    await User.findByIdAndUpdate(request.user, {
      clubRole: `${request.role} - ${request.club}`
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.patch("/:id/reject", async (req, res) => {
  try {
    const request = await ClubHeadRequest.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;