const mongoose = require("mongoose");

const actionHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: String,
    default: "System"
  },
  performedByName: {
    type: String,
    default: "System"
  },
  performedByRole: {
    type: String,
    enum: ["Student", "Faculty", "Professor", "Admin", "System"],
    default: "System"
  },
  remarks: {
    type: String,
    default: ""
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const facultyRemarkSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  facultyName: {
    type: String,
    required: true
  },
  facultyRole: {
    type: String,
    default: "Faculty"
  },
  remark: {
    type: String,
    required: true,
    trim: true
  },
  statusAtRemark: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Academic & Faculty",
      "Hostel & Mess",
      "Classrooms & Labs",
      "Central Library",
      "Campus Wi-Fi & IT",
      "Anti-Ragging / Student Welfare",
      "Administrative & Accounts",
      "Campus Facilities & Cleanliness",
      "Examination & Grading",
      "Other"
    ],
    default: "Other"
  },
  department: {
    type: String,
    required: true,
    trim: true,
    default: "General Administration"
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    default: "",
    trim: true
  },
  evidenceUrl: {
    type: String,
    default: ""
  },
  evidenceName: {
    type: String,
    default: ""
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isConfidential: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["Submitted", "Under Review", "In Progress", "Resolved", "Rejected"],
    default: "Submitted",
    index: true
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium"
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    default: ""
  },
  studentDepartment: {
    type: String,
    default: "Not specified"
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
  },
  assignedToName: {
    type: String,
    default: "Unassigned"
  },
  assignedToEmail: {
    type: String,
    default: ""
  },
  assignedBy: {
    type: String,
    default: "System Auto-Routing"
  },
  assignedAt: {
    type: Date,
    default: null
  },
  isEscalated: {
    type: Boolean,
    default: false,
    index: true
  },
  escalatedAt: {
    type: Date,
    default: null
  },
  escalationReason: {
    type: String,
    default: ""
  },
  escalatedBy: {
    type: String,
    default: ""
  },
  facultyRemarks: [facultyRemarkSchema],
  actionHistory: [actionHistorySchema],
  resolutionDetails: {
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: String, default: "" },
    resolutionNotes: { type: String, default: "" }
  },
  rejectionDetails: {
    rejectedAt: { type: Date, default: null },
    rejectedBy: { type: String, default: "" },
    rejectionReason: { type: String, default: "" }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Complaint", complaintSchema);
