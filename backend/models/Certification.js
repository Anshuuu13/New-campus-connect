const mongoose = require("mongoose");

const certificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  issuingOrganization: {
    type: String,
    required: true
  },
  issueDate: {
    type: String,
    default: ""
  },
  credentialUrl: {
    type: String,
    default: ""
  },
  imageUrl: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Certification", certificationSchema);
