const mongoose = require('mongoose');

const clubHeadRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  clubName: { type: String, required: true },
  domain: { type: String, required: true },
  status: { type: String, default: 'pending' }, // pending / approved / rejected
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClubHeadRequest', clubHeadRequestSchema);