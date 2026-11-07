const mongoose = require("mongoose");

const complaintRoutingSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  assignedFacultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  assignedFacultyName: {
    type: String,
    required: true
  },
  assignedFacultyEmail: {
    type: String,
    default: ""
  },
  designation: {
    type: String,
    default: "Faculty Grievance Coordinator"
  },
  isGrievanceOfficer: {
    type: Boolean,
    default: false // Authorized to handle confidential & sensitive complaints
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

complaintRoutingSchema.index({ department: 1, category: 1 });

module.exports = mongoose.model("ComplaintRouting", complaintRoutingSchema);
