const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  subjectCode: {
    type: String,
    default: ""
  },
  branch: {
    type: String,
    required: true,
    enum: ["CSE", "IT", "ECE", "EE", "ME", "CE", "AI-DS", "CSD", "Common", "Other"]
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  academicYear: {
    type: String,
    default: "2024"
  },
  category: {
    type: String,
    required: true,
    enum: [
      "PYQ",
      "Subject Notes",
      "Unit Notes",
      "Important Questions",
      "Lecture PDF",
      "Lab Manual",
      "Practical File",
      "Assignment",
      "Reference Book",
      "Syllabus",
      "GATE Prep",
      "Interview Prep"
    ],
    default: "PYQ"
  },
  examType: {
    type: String,
    enum: ["Mid-Sem", "End-Sem", "Supplementary", "Mid Sem", "End Sem", "Remid", "General"],
    default: "End-Sem"
  },
  filename: {
    type: String,
    default: ""
  },
  fileUrl: {
    type: String,
    default: ""
  },
  fileAvailable: {
    type: Boolean,
    default: true
  },
  fileSize: {
    type: String,
    default: "1.5 MB"
  },
  fileType: {
    type: String,
    default: "PDF"
  },
  description: {
    type: String,
    default: ""
  },
  source: {
    type: String,
    default: "MITS Autonomous Examination Cell"
  },
  uploadedBy: {
    type: String,
    default: "MITS Academic Cell"
  },
  uploaderRole: {
    type: String,
    default: "Faculty"
  },
  downloadsCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Resource", resourceSchema);
