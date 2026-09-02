const express = require('express');
const router = express.Router();
const ClubHeadRequest = require('../models/ClubHeadRequest');

// Submit a club head/domain head request
router.post('/request', async (req, res) => {
  try {
    const { userId, userName, clubName, domain } = req.body;

    const existingApproved = await ClubHeadRequest.findOne({
      clubName, domain, status: 'approved'
    });
    if (existingApproved) {
      return res.status(400).json({ message: 'This position is already filled for this club.' });
    }

    const request = new ClubHeadRequest({ userId, userName, clubName, domain });
    await request.save();
    res.status(201).json({ message: 'Request submitted, pending approval.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get approved club head info for a specific user (used on profile page)
router.get('/approved/:userId', async (req, res) => {
  try {
    const approved = await ClubHeadRequest.find({
      userId: req.params.userId,
      status: 'approved'
    });
    res.json(approved);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;