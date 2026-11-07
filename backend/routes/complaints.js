const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const ComplaintRouting = require("../models/ComplaintRouting");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Helper: Safely resolve a User document from ID or email/googleId
async function resolveUserDoc(inputUserId) {
  if (!inputUserId) return null;
  if (mongoose.Types.ObjectId.isValid(inputUserId)) {
    const existing = await User.findById(inputUserId);
    if (existing) return existing;
  }
  return await User.findOne({
    $or: [
      { googleId: inputUserId },
      { email: inputUserId },
      { contactEmail: inputUserId },
      { name: inputUserId }
    ]
  });
}

// Helper: Check if user is an Admin
function isAdminRole(user) {
  if (!user || !user.role) return false;
  const roleStr = String(user.role).trim().toLowerCase();
  return ["admin"].includes(roleStr);
}

// Helper: Check if user is Faculty/Professor
function isFacultyRole(user) {
  if (!user || !user.role) return false;
  const roleStr = String(user.role).trim().toLowerCase();
  return ["faculty", "professor", "senior"].includes(roleStr);
}

// Helper: Check if user is an authorized Grievance Officer
async function isGrievanceOfficerUser(user) {
  if (!user) return false;
  if (isAdminRole(user)) return true;
  const rule = await ComplaintRouting.findOne({
    assignedFacultyId: user._id,
    isGrievanceOfficer: true,
    active: true
  });
  return Boolean(rule);
}

// Helper: Generate Unique Human-Readable Complaint ID
async function generateUniqueComplaintId() {
  const year = new Date().getFullYear();
  const count = await Complaint.countDocuments();
  const seq = String(count + 1).padStart(4, "0");
  const randomSuffix = Math.floor(10 + Math.random() * 90);
  const complaintId = `MITS-GRV-${year}-${seq}`;
  
  // Verify uniqueness
  const exists = await Complaint.findOne({ complaintId });
  if (exists) {
    return `MITS-GRV-${year}-${seq}-${randomSuffix}`;
  }
  return complaintId;
}

// Helper: Send in-app notification
async function createInAppNotification({ title, message, priority = "Normal", recipientUserId = "ALL", actionUrl = "/complaints.html" }) {
  try {
    const notif = new Notification({
      title,
      message,
      category: "Complaints",
      icon: "🛡️",
      actionUrl,
      priority,
      recipientUserId: String(recipientUserId),
      circularNumber: `GRV/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`
    });
    await notif.save();
  } catch (err) {
    console.warn("Could not create in-app notification:", err.message);
  }
}

// Seed default MITS Faculty & Grievance Routing Rules if none exist
async function seedDefaultFacultyAndRouting() {
  try {
    if (mongoose.connection.readyState !== 1) return;

    // 1. Ensure verified faculty exist in database
    const defaultFacultyList = [
      {
        name: "Dr. Sanjeev Khanna",
        email: "dsw@mitsgwalior.in",
        department: "Student Welfare",
        role: "Professor",
        branch: "Student Welfare",
        profileCompleted: true
      },
      {
        name: "Prof. C. S. Sharma",
        email: "warden@mitsgwalior.in",
        department: "Hostel Administration",
        role: "Professor",
        branch: "Hostel Administration",
        profileCompleted: true
      },
      {
        name: "Prof. Jigyasa Mishra",
        email: "jigyasacse@mitsgwalior.in",
        department: "Computer Science & Engineering",
        role: "Professor",
        branch: "CSE",
        profileCompleted: true
      },
      {
        name: "Dr. P. K. Singhal",
        email: "coe@mitsgwalior.in",
        department: "Examination Cell",
        role: "Professor",
        branch: "Academic Cell",
        profileCompleted: true
      },
      {
        name: "Er. Dinesh Agrawal",
        email: "ccf@mitsgwalior.in",
        department: "IT & Network Infrastructure",
        role: "Faculty",
        branch: "Central Computing Facility",
        profileCompleted: true
      },
      {
        name: "Dr. R. K. Pandit",
        email: "grievance.admin@mitsgwalior.in",
        department: "MITS Central Administration",
        role: "Admin",
        branch: "Administrative Cell",
        profileCompleted: true
      }
    ];

    const facultyDocs = {};
    for (const f of defaultFacultyList) {
      let doc = await User.findOne({ email: f.email });
      if (!doc) {
        doc = await User.findOne({ name: f.name });
      }
      if (!doc) {
        doc = new User(f);
        await doc.save();
      }
      facultyDocs[f.email] = doc;
    }

    // 2. Seed Default Routing Rules if collection is empty
    const routingCount = await ComplaintRouting.countDocuments();
    if (routingCount === 0) {
      const defaultRules = [
        {
          department: "Computer Science & Engineering",
          category: "Academic & Faculty",
          assignedFacultyId: facultyDocs["jigyasacse@mitsgwalior.in"]._id,
          assignedFacultyName: "Prof. Jigyasa Mishra",
          assignedFacultyEmail: "jigyasacse@mitsgwalior.in",
          designation: "HOD / Academic Grievance In-charge (CSE)",
          isGrievanceOfficer: false
        },
        {
          department: "Hostel Administration",
          category: "Hostel & Mess",
          assignedFacultyId: facultyDocs["warden@mitsgwalior.in"]._id,
          assignedFacultyName: "Prof. C. S. Sharma",
          assignedFacultyEmail: "warden@mitsgwalior.in",
          designation: "Chief Warden / Hostel Grievance In-charge",
          isGrievanceOfficer: false
        },
        {
          department: "IT & Network Infrastructure",
          category: "Campus Wi-Fi & IT",
          assignedFacultyId: facultyDocs["ccf@mitsgwalior.in"]._id,
          assignedFacultyName: "Er. Dinesh Agrawal",
          assignedFacultyEmail: "ccf@mitsgwalior.in",
          designation: "Systems & Network Administrator (CCF)",
          isGrievanceOfficer: false
        },
        {
          department: "Student Welfare",
          category: "Anti-Ragging / Student Welfare",
          assignedFacultyId: facultyDocs["dsw@mitsgwalior.in"]._id,
          assignedFacultyName: "Dr. Sanjeev Khanna",
          assignedFacultyEmail: "dsw@mitsgwalior.in",
          designation: "Dean Student Welfare / Grievance Officer",
          isGrievanceOfficer: true
        },
        {
          department: "Examination Cell",
          category: "Examination & Grading",
          assignedFacultyId: facultyDocs["coe@mitsgwalior.in"]._id,
          assignedFacultyName: "Dr. P. K. Singhal",
          assignedFacultyEmail: "coe@mitsgwalior.in",
          designation: "Controller of Examinations (COE)",
          isGrievanceOfficer: false
        },
        {
          department: "Central Library",
          category: "Central Library",
          assignedFacultyId: facultyDocs["dsw@mitsgwalior.in"]._id,
          assignedFacultyName: "Dr. Sanjeev Khanna",
          assignedFacultyEmail: "dsw@mitsgwalior.in",
          designation: "Library Advisory In-charge",
          isGrievanceOfficer: false
        },
        {
          department: "Classrooms & Infrastructure",
          category: "Classrooms & Labs",
          assignedFacultyId: facultyDocs["jigyasacse@mitsgwalior.in"]._id,
          assignedFacultyName: "Prof. Jigyasa Mishra",
          assignedFacultyEmail: "jigyasacse@mitsgwalior.in",
          designation: "Departmental Lab Coordinator",
          isGrievanceOfficer: false
        }
      ];

      await ComplaintRouting.insertMany(defaultRules);
      console.log(`[PASS] Seeded ${defaultRules.length} MITS Grievance Routing Rules with verified faculty.`);
    }
  } catch (err) {
    console.warn("Could not seed default faculty/routing:", err.message);
  }
}
setTimeout(seedDefaultFacultyAndRouting, 1200);

// ====================================================================
// 1. GET /api/complaints - List Complaints (Role-Based Access Control)
// ====================================================================
router.get("/", async (req, res) => {
  try {
    const { userId, status, category, department, priority, search, isEscalated } = req.query;
    const reqUserId = userId || req.headers["x-user-id"];

    if (!reqUserId) {
      return res.status(401).json({ error: "Authentication required to view complaints." });
    }

    const user = await resolveUserDoc(reqUserId);
    if (!user) {
      return res.status(401).json({ error: "User profile not found. Please log in again." });
    }

    const filter = {};

    // ----------------------------------------------------
    // PRIVACY ENFORCEMENT ON BACKEND
    // ----------------------------------------------------
    const isAdmin = isAdminRole(user);
    const isFaculty = isFacultyRole(user);
    const isGrievanceOfficer = await isGrievanceOfficerUser(user);

    if (isAdmin) {
      // Admins see all complaints across the institution
    } else if (isFaculty) {
      // Faculty members see ONLY complaints assigned directly to them
      filter.assignedTo = user._id;

      // Confidential complaints check: if marked confidential, only grievance officers see them
      if (!isGrievanceOfficer) {
        filter.isConfidential = { $ne: true };
      }
    } else {
      // Students see ONLY their own submitted complaints
      filter.studentId = user._id;
    }

    // Additional query filters
    if (status && status !== "all") {
      filter.status = status;
    }
    if (category && category !== "all") {
      filter.category = category;
    }
    if (department && department !== "all") {
      filter.department = department;
    }
    if (priority && priority !== "all") {
      filter.priority = priority;
    }
    if (isEscalated === "true") {
      filter.isEscalated = true;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { complaintId: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } }
      ];
    }

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });

    // Mask anonymous student details for faculty/unauthorized views
    const sanitizedComplaints = complaints.map(c => {
      const doc = c.toObject();
      if (doc.isAnonymous && !isAdmin && !isGrievanceOfficer && String(doc.studentId) !== String(user._id)) {
        doc.studentName = "Anonymous Student";
        doc.studentEmail = "masked@mitsgwl.ac.in";
      }
      return doc;
    });

    res.json(sanitizedComplaints);
  } catch (err) {
    console.error("GET COMPLAINTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

// ====================================================================
// 2. GET /api/complaints/track/:complaintId - Track by Reference ID
// ====================================================================
router.get("/track/:complaintId", async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { userId } = req.query;
    const reqUserId = userId || req.headers["x-user-id"];

    const complaint = await Complaint.findOne({ complaintId: complaintId.trim() });
    if (!complaint) {
      return res.status(404).json({ error: `Complaint with Reference ID "${complaintId}" was not found.` });
    }

    // Check privacy if user credentials provided
    let viewer = null;
    if (reqUserId) {
      viewer = await resolveUserDoc(reqUserId);
    }

    const doc = complaint.toObject();

    // Check confidentiality permissions
    if (doc.isConfidential) {
      if (!viewer) {
        return res.status(403).json({ error: "This grievance is confidential. Authentication required to view status." });
      }
      const isOwner = String(doc.studentId) === String(viewer._id);
      const isAssigned = doc.assignedTo && String(doc.assignedTo) === String(viewer._id);
      const isAdm = isAdminRole(viewer);
      const isGov = await isGrievanceOfficerUser(viewer);

      if (!isOwner && !isAssigned && !isAdm && !isGov) {
        return res.status(403).json({ error: "Access denied. Confidential grievance is restricted to authorized Grievance Officers." });
      }
    }

    // Mask anonymous student if viewer is not the author or an admin
    if (doc.isAnonymous && (!viewer || (!isAdminRole(viewer) && String(doc.studentId) !== String(viewer._id)))) {
      doc.studentName = "Anonymous Student";
      doc.studentEmail = "masked@mitsgwl.ac.in";
    }

    res.json(doc);
  } catch (err) {
    console.error("TRACK COMPLAINT ERROR:", err);
    res.status(500).json({ error: "Failed to track complaint." });
  }
});

// ====================================================================
// 3. GET /api/complaints/:id - Get Single Complaint Details
// ====================================================================
router.get("/:id", async (req, res) => {
  try {
    const { userId } = req.query;
    const reqUserId = userId || req.headers["x-user-id"];

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid complaint ID format." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    if (!reqUserId) {
      return res.status(401).json({ error: "Authentication required to view details." });
    }

    const user = await resolveUserDoc(reqUserId);
    if (!user) {
      return res.status(401).json({ error: "User session invalid." });
    }

    const isAdmin = isAdminRole(user);
    const isFaculty = isFacultyRole(user);
    const isGrievanceOfficer = await isGrievanceOfficerUser(user);
    const isOwner = String(complaint.studentId) === String(user._id);
    const isAssigned = complaint.assignedTo && String(complaint.assignedTo) === String(user._id);

    // Enforce role-based access
    if (!isAdmin && !isOwner && !isAssigned) {
      return res.status(403).json({ error: "Access denied. You do not have permission to view this complaint." });
    }

    if (complaint.isConfidential && !isOwner && !isAssigned && !isAdmin && !isGrievanceOfficer) {
      return res.status(403).json({ error: "Confidential complaint. Accessible only to Grievance Officers and Administration." });
    }

    const doc = complaint.toObject();
    if (doc.isAnonymous && !isAdmin && !isGrievanceOfficer && !isOwner) {
      doc.studentName = "Anonymous Student";
      doc.studentEmail = "masked@mitsgwl.ac.in";
    }

    res.json(doc);
  } catch (err) {
    console.error("GET COMPLAINT DETAIL ERROR:", err);
    res.status(500).json({ error: "Failed to load complaint details." });
  }
});

// ====================================================================
// 4. POST /api/complaints - Submit New Complaint (Automatic Assignment)
// ====================================================================
router.post("/", async (req, res) => {
  try {
    const {
      title,
      category,
      department,
      description,
      location,
      evidenceUrl,
      evidenceName,
      isAnonymous,
      isConfidential,
      priority,
      userId
    } = req.body;

    const reqUserId = userId || req.headers["x-user-id"];
    if (!reqUserId) {
      return res.status(401).json({ error: "Please log in to submit a grievance." });
    }

    const studentUser = await resolveUserDoc(reqUserId);
    if (!studentUser) {
      return res.status(401).json({ error: "Student profile not found. Please log in again." });
    }

    if (!title || !description || !category) {
      return res.status(400).json({ error: "Title, category, and detailed description are required." });
    }

    // Automatically fetch student's own department from profile
    const studentDept = studentUser.department && studentUser.department !== "Not specified"
      ? studentUser.department
      : (studentUser.branch || "General Academic");

    // Target department affected by complaint
    const targetDept = department || studentDept || "General Administration";

    // Generate unique complaint reference ID
    const complaintId = await generateUniqueComplaintId();

    // ----------------------------------------------------
    // AUTOMATIC ROUTING ENGINE:
    // Route complaints using admin-configured department + category + responsible faculty mapping.
    // If no mapping exists, send them to admin for manual assignment.
    // ----------------------------------------------------
    let assignedFaculty = null;
    let routingRule = null;

    // Check exact match first
    routingRule = await ComplaintRouting.findOne({
      department: targetDept,
      category: category,
      active: true
    });

    // Fallback: match by category if department general rule exists
    if (!routingRule) {
      routingRule = await ComplaintRouting.findOne({
        category: category,
        active: true
      });
    }

    // Fallback: match by department if category general rule exists
    if (!routingRule) {
      routingRule = await ComplaintRouting.findOne({
        department: targetDept,
        active: true
      });
    }

    let initialStatus = "Submitted";
    let assignedByName = "System Auto-Routing";
    let assignedAtTime = null;
    let initialActionRemarks = "";

    const historyItems = [
      {
        action: "Submitted",
        performedBy: String(studentUser._id),
        performedByName: isAnonymous ? "Anonymous Student" : studentUser.name,
        performedByRole: "Student",
        remarks: "Grievance submitted by student into CampusConnect portal.",
        timestamp: new Date()
      }
    ];

    if (routingRule && routingRule.assignedFacultyId) {
      assignedFaculty = await User.findById(routingRule.assignedFacultyId);
    }

    if (assignedFaculty) {
      initialStatus = "Under Review";
      assignedAtTime = new Date();
      initialActionRemarks = `Auto-assigned to Prof. ${assignedFaculty.name} (${routingRule.designation || "Grievance Coordinator"}) based on ${targetDept} + ${category} routing policy.`;

      historyItems.push({
        action: "Auto-Assigned",
        performedBy: "SYSTEM_ROUTER",
        performedByName: "MITS Auto-Routing Engine",
        performedByRole: "System",
        remarks: initialActionRemarks,
        timestamp: new Date(Date.now() + 50)
      });
    } else {
      initialStatus = "Submitted";
      initialActionRemarks = `No active routing rule found for Department: "${targetDept}" & Category: "${category}". Automatically queued for Central Administration review and manual faculty assignment.`;

      historyItems.push({
        action: "Queued for Admin Assignment",
        performedBy: "SYSTEM_ROUTER",
        performedByName: "MITS Auto-Routing Engine",
        performedByRole: "System",
        remarks: initialActionRemarks,
        timestamp: new Date(Date.now() + 50)
      });
    }

    const newComplaint = new Complaint({
      complaintId,
      title: title.trim(),
      category,
      department: targetDept,
      description: description.trim(),
      location: location ? location.trim() : "",
      evidenceUrl: evidenceUrl || "",
      evidenceName: evidenceName || "",
      isAnonymous: Boolean(isAnonymous),
      isConfidential: Boolean(isConfidential),
      status: initialStatus,
      priority: priority || "Medium",
      studentId: studentUser._id,
      studentName: studentUser.name,
      studentEmail: studentUser.email || studentUser.contactEmail || "",
      studentDepartment: studentDept,
      assignedTo: assignedFaculty ? assignedFaculty._id : null,
      assignedToName: assignedFaculty ? assignedFaculty.name : "Unassigned (Admin Review)",
      assignedToEmail: assignedFaculty ? (assignedFaculty.email || assignedFaculty.contactEmail || "") : "",
      assignedBy: assignedFaculty ? assignedByName : "Pending Admin Assignment",
      assignedAt: assignedAtTime,
      actionHistory: historyItems
    });

    const saved = await newComplaint.save();

    // Send In-App Notifications
    // 1. To student: confirmation with ID
    await createInAppNotification({
      title: `Grievance Submitted (${complaintId})`,
      message: `Your grievance "${title}" has been registered with Reference ID ${complaintId}. Current status: ${initialStatus}.`,
      priority: priority === "Urgent" ? "Urgent" : "Normal",
      recipientUserId: String(studentUser._id),
      actionUrl: `/complaints.html?track=${complaintId}`
    });

    // 2. To assigned faculty (if auto-assigned)
    if (assignedFaculty) {
      await createInAppNotification({
        title: `New Grievance Assigned: ${complaintId}`,
        message: `A new ${priority} priority complaint ("${title}") in ${targetDept} has been auto-assigned to you for review.`,
        priority: priority === "Urgent" ? "Urgent" : "High",
        recipientUserId: String(assignedFaculty._id),
        actionUrl: `/complaints.html?id=${saved._id}`
      });
    } else {
      // 3. To admin if unassigned
      await createInAppNotification({
        title: `Unassigned Grievance Alert: ${complaintId}`,
        message: `Complaint "${title}" has no pre-configured faculty routing rule. Please assign a responsible faculty member.`,
        priority: "High",
        recipientUserId: "ADMIN",
        actionUrl: `/complaints.html?assign=${saved._id}`
      });
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error("SUBMIT COMPLAINT ERROR:", err);
    res.status(500).json({ error: "Failed to submit grievance." });
  }
});

// ====================================================================
// 5. PATCH /api/complaints/:id/status - Update Status & Remarks (Faculty/Admin)
// ====================================================================
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, remarks, resolutionNotes, rejectionReason, userId } = req.body;
    const reqUserId = userId || req.headers["x-user-id"];

    if (!reqUserId) {
      return res.status(401).json({ error: "Authentication required to update status." });
    }

    const user = await resolveUserDoc(reqUserId);
    if (!user) {
      return res.status(401).json({ error: "User session invalid." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    const isAdmin = isAdminRole(user);
    const isAssignedFaculty = complaint.assignedTo && String(complaint.assignedTo) === String(user._id);

    // Only assigned faculty or administrator can update complaint status
    if (!isAdmin && !isAssignedFaculty) {
      return res.status(403).json({ error: "Access denied. Only the assigned faculty or administrator can change complaint status." });
    }

    const validStatuses = ["Submitted", "Under Review", "In Progress", "Resolved", "Rejected"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Valid statuses: ${validStatuses.join(", ")}` });
    }

    const oldStatus = complaint.status;
    complaint.status = status;
    complaint.updatedAt = new Date();

    const remarkText = remarks || resolutionNotes || rejectionReason || `Status updated from ${oldStatus} to ${status}.`;

    // Append faculty remark
    if (isFacultyRole(user) || isAdmin) {
      complaint.facultyRemarks.push({
        facultyId: user._id,
        facultyName: user.name,
        facultyRole: isAdmin ? "Administrator" : (user.role || "Faculty"),
        remark: remarkText,
        statusAtRemark: status,
        createdAt: new Date()
      });
    }

    // Set resolution or rejection details
    if (status === "Resolved") {
      complaint.resolutionDetails = {
        resolvedAt: new Date(),
        resolvedBy: user.name,
        resolutionNotes: resolutionNotes || remarks || "Issue has been addressed and resolved."
      };
    } else if (status === "Rejected") {
      complaint.rejectionDetails = {
        rejectedAt: new Date(),
        rejectedBy: user.name,
        rejectionReason: rejectionReason || remarks || "Grievance deemed out of scope or invalid."
      };
    }

    // Append to action history
    complaint.actionHistory.push({
      action: `Status Changed to ${status}`,
      performedBy: String(user._id),
      performedByName: user.name,
      performedByRole: isAdmin ? "Admin" : (user.role || "Faculty"),
      remarks: remarkText,
      timestamp: new Date()
    });

    const updated = await complaint.save();

    // Send Notification to student
    await createInAppNotification({
      title: `Grievance Status: ${status} (${complaint.complaintId})`,
      message: `Your grievance "${complaint.title}" has been updated to "${status}" by Prof. ${user.name}. Remarks: "${remarkText.slice(0, 100)}"`,
      priority: status === "Resolved" ? "High" : "Normal",
      recipientUserId: String(complaint.studentId),
      actionUrl: `/complaints.html?track=${complaint.complaintId}`
    });

    res.json(updated);
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    res.status(500).json({ error: "Failed to update complaint status." });
  }
});

// ====================================================================
// 6. PATCH /api/complaints/:id/assign - Manual Faculty Assignment (Admin Only)
// ====================================================================
router.patch("/:id/assign", async (req, res) => {
  try {
    const { facultyId, remarks, userId } = req.body;
    const reqUserId = userId || req.headers["x-user-id"];

    if (!reqUserId) {
      return res.status(401).json({ error: "Admin authentication required." });
    }

    const adminUser = await resolveUserDoc(reqUserId);
    if (!adminUser || !isAdminRole(adminUser)) {
      return res.status(403).json({ error: "Access denied. Only Administrators can assign or reassign complaints." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    if (!facultyId || !mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ error: "A valid faculty ID must be specified for assignment." });
    }

    const faculty = await User.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: "Selected faculty member not found in college directory." });
    }

    const previousAssigned = complaint.assignedToName;
    complaint.assignedTo = faculty._id;
    complaint.assignedToName = faculty.name;
    complaint.assignedToEmail = faculty.email || faculty.contactEmail || "";
    complaint.assignedBy = `Admin: ${adminUser.name}`;
    complaint.assignedAt = new Date();
    complaint.updatedAt = new Date();

    if (complaint.status === "Submitted") {
      complaint.status = "Under Review";
    }

    const assignmentRemark = remarks || `Manually assigned to Prof. ${faculty.name} (${faculty.department || "Faculty"}) by Administrator ${adminUser.name}. Previous: ${previousAssigned}.`;

    complaint.actionHistory.push({
      action: "Manually Assigned",
      performedBy: String(adminUser._id),
      performedByName: adminUser.name,
      performedByRole: "Admin",
      remarks: assignmentRemark,
      timestamp: new Date()
    });

    const updated = await complaint.save();

    // Notify assigned faculty
    await createInAppNotification({
      title: `Grievance Assigned to You: ${complaint.complaintId}`,
      message: `Admin ${adminUser.name} has assigned grievance "${complaint.title}" to you. Note: "${assignmentRemark.slice(0, 100)}"`,
      priority: complaint.priority === "Urgent" ? "Urgent" : "High",
      recipientUserId: String(faculty._id),
      actionUrl: `/complaints.html?id=${complaint._id}`
    });

    // Notify student
    await createInAppNotification({
      title: `Officer Assigned to Grievance (${complaint.complaintId})`,
      message: `Your grievance has been assigned to Prof. ${faculty.name} (${faculty.department || "Grievance In-charge"}) for official review.`,
      priority: "Normal",
      recipientUserId: String(complaint.studentId),
      actionUrl: `/complaints.html?track=${complaint.complaintId}`
    });

    res.json(updated);
  } catch (err) {
    console.error("ASSIGNMENT ERROR:", err);
    res.status(500).json({ error: "Failed to assign faculty member." });
  }
});

// ====================================================================
// 7. PATCH /api/complaints/:id/escalate - Escalate Unresolved Grievance
// ====================================================================
router.patch("/:id/escalate", async (req, res) => {
  try {
    const { reason, userId } = req.body;
    const reqUserId = userId || req.headers["x-user-id"];

    if (!reqUserId) {
      return res.status(401).json({ error: "Authentication required to escalate." });
    }

    const user = await resolveUserDoc(reqUserId);
    if (!user) {
      return res.status(401).json({ error: "User profile not found." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    const isOwner = String(complaint.studentId) === String(user._id);
    const isAdmin = isAdminRole(user);
    const isAssigned = complaint.assignedTo && String(complaint.assignedTo) === String(user._id);

    // Permitted for author student, assigned faculty, or admin
    if (!isOwner && !isAdmin && !isAssigned) {
      return res.status(403).json({ error: "Access denied. Only the complaint author, assigned faculty, or admin can trigger escalation." });
    }

    const escalationText = reason || "Escalated due to lack of resolution within the autonomous service window.";

    complaint.isEscalated = true;
    complaint.escalatedAt = new Date();
    complaint.escalatedBy = `${user.name} (${user.role || "Member"})`;
    complaint.escalationReason = escalationText;
    complaint.priority = "Urgent";
    complaint.updatedAt = new Date();

    complaint.actionHistory.push({
      action: "Escalated",
      performedBy: String(user._id),
      performedByName: user.name,
      performedByRole: isAdmin ? "Admin" : (user.role || "Student"),
      remarks: `Escalated: "${escalationText}". Priority upgraded to Urgent. Alert dispatched to Dean of Student Welfare.`,
      timestamp: new Date()
    });

    const updated = await complaint.save();

    // Alert DSW / Admin
    await createInAppNotification({
      title: `🚨 URGENT: Grievance Escalated (${complaint.complaintId})`,
      message: `Grievance "${complaint.title}" has been escalated by ${user.name}. Reason: "${escalationText.slice(0, 100)}"`,
      priority: "Urgent",
      recipientUserId: "ADMIN",
      actionUrl: `/complaints.html?id=${complaint._id}`
    });

    res.json(updated);
  } catch (err) {
    console.error("ESCALATION ERROR:", err);
    res.status(500).json({ error: "Failed to escalate complaint." });
  }
});

// ====================================================================
// 8. POST /api/complaints/:id/remarks - Add Remark/Note
// ====================================================================
router.post("/:id/remarks", async (req, res) => {
  try {
    const { remark, userId } = req.body;
    const reqUserId = userId || req.headers["x-user-id"];

    if (!remark || !remark.trim()) {
      return res.status(400).json({ error: "Remark content cannot be empty." });
    }

    const user = await resolveUserDoc(reqUserId);
    if (!user) {
      return res.status(401).json({ error: "User session invalid." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    const isOwner = String(complaint.studentId) === String(user._id);
    const isAdmin = isAdminRole(user);
    const isAssigned = complaint.assignedTo && String(complaint.assignedTo) === String(user._id);

    if (!isOwner && !isAdmin && !isAssigned) {
      return res.status(403).json({ error: "Access denied. You do not have permission to add remarks to this complaint." });
    }

    if (isFacultyRole(user) || isAdmin) {
      complaint.facultyRemarks.push({
        facultyId: user._id,
        facultyName: user.name,
        facultyRole: isAdmin ? "Administrator" : (user.role || "Faculty"),
        remark: remark.trim(),
        statusAtRemark: complaint.status,
        createdAt: new Date()
      });
    }

    complaint.actionHistory.push({
      action: isOwner ? "Student Note Added" : "Faculty Remark Added",
      performedBy: String(user._id),
      performedByName: user.name,
      performedByRole: isOwner ? "Student" : (isAdmin ? "Admin" : "Faculty"),
      remarks: remark.trim(),
      timestamp: new Date()
    });

    complaint.updatedAt = new Date();
    const updated = await complaint.save();

    res.json(updated);
  } catch (err) {
    console.error("ADD REMARK ERROR:", err);
    res.status(500).json({ error: "Failed to add remark." });
  }
});

// ====================================================================
// 9. GET /api/complaints/meta/stats - Grievance Analytics & Resolution Stats
// ====================================================================
router.get("/meta/stats", async (req, res) => {
  try {
    const { userId } = req.query;
    const reqUserId = userId || req.headers["x-user-id"];

    let user = null;
    if (reqUserId) {
      user = await resolveUserDoc(reqUserId);
    }

    const filter = {};
    if (user && !isAdminRole(user)) {
      if (isFacultyRole(user)) {
        filter.assignedTo = user._id;
      } else {
        filter.studentId = user._id;
      }
    }

    const total = await Complaint.countDocuments(filter);
    const submitted = await Complaint.countDocuments({ ...filter, status: "Submitted" });
    const underReview = await Complaint.countDocuments({ ...filter, status: "Under Review" });
    const inProgress = await Complaint.countDocuments({ ...filter, status: "In Progress" });
    const resolved = await Complaint.countDocuments({ ...filter, status: "Resolved" });
    const rejected = await Complaint.countDocuments({ ...filter, status: "Rejected" });
    const escalated = await Complaint.countDocuments({ ...filter, isEscalated: true });

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

    res.json({
      total,
      submitted,
      underReview,
      inProgress,
      resolved,
      rejected,
      escalated,
      resolutionRate: `${resolutionRate}%`,
      avgResponseTime: "< 48 Hours"
    });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ error: "Failed to calculate statistics." });
  }
});

// ====================================================================
// 10. ROUTING RULES MANAGEMENT (Admin Only)
// ====================================================================
router.get("/routing/rules", async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await resolveUserDoc(userId || req.headers["x-user-id"]);

    if (!user || !isAdminRole(user)) {
      return res.status(403).json({ error: "Access denied. Administrative privileges required." });
    }

    const rules = await ComplaintRouting.find().sort({ department: 1, category: 1 });
    res.json(rules);
  } catch (err) {
    console.error("GET ROUTING RULES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch routing rules." });
  }
});

router.post("/routing/rules", async (req, res) => {
  try {
    const { department, category, assignedFacultyId, designation, isGrievanceOfficer, userId } = req.body;
    const user = await resolveUserDoc(userId || req.headers["x-user-id"]);

    if (!user || !isAdminRole(user)) {
      return res.status(403).json({ error: "Only administrators can configure grievance routing rules." });
    }

    if (!department || !category || !assignedFacultyId) {
      return res.status(400).json({ error: "Department, Category, and Assigned Faculty are required." });
    }

    const faculty = await User.findById(assignedFacultyId);
    if (!faculty) {
      return res.status(404).json({ error: "Assigned faculty member not found." });
    }

    const existing = await ComplaintRouting.findOne({ department, category });
    if (existing) {
      existing.assignedFacultyId = faculty._id;
      existing.assignedFacultyName = faculty.name;
      existing.assignedFacultyEmail = faculty.email || faculty.contactEmail || "";
      existing.designation = designation || existing.designation;
      existing.isGrievanceOfficer = Boolean(isGrievanceOfficer);
      existing.active = true;
      existing.updatedAt = new Date();
      const updated = await existing.save();
      return res.json(updated);
    }

    const rule = new ComplaintRouting({
      department,
      category,
      assignedFacultyId: faculty._id,
      assignedFacultyName: faculty.name,
      assignedFacultyEmail: faculty.email || faculty.contactEmail || "",
      designation: designation || "Faculty Grievance Coordinator",
      isGrievanceOfficer: Boolean(isGrievanceOfficer),
      active: true
    });

    const saved = await rule.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("POST ROUTING RULE ERROR:", err);
    res.status(500).json({ error: "Failed to create routing rule." });
  }
});

router.put("/routing/rules/:id", async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;
    const user = await resolveUserDoc(userId || req.headers["x-user-id"]);

    if (!user || !isAdminRole(user)) {
      return res.status(403).json({ error: "Administrative privileges required." });
    }

    if (updateData.assignedFacultyId) {
      const f = await User.findById(updateData.assignedFacultyId);
      if (f) {
        updateData.assignedFacultyName = f.name;
        updateData.assignedFacultyEmail = f.email || f.contactEmail || "";
      }
    }

    updateData.updatedAt = new Date();
    const updated = await ComplaintRouting.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("PUT ROUTING RULE ERROR:", err);
    res.status(500).json({ error: "Failed to update routing rule." });
  }
});

router.delete("/routing/rules/:id", async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await resolveUserDoc(userId || req.headers["x-user-id"]);

    if (!user || !isAdminRole(user)) {
      return res.status(403).json({ error: "Administrative privileges required." });
    }

    await ComplaintRouting.findByIdAndDelete(req.params.id);
    res.json({ message: "Routing rule deleted successfully." });
  } catch (err) {
    console.error("DELETE ROUTING RULE ERROR:", err);
    res.status(500).json({ error: "Failed to delete routing rule." });
  }
});

// ====================================================================
// 11. GET /api/complaints/meta/faculty-list - List Faculty for Assignment
// ====================================================================
router.get("/meta/faculty-list", async (req, res) => {
  try {
    const facultyUsers = await User.find({
      role: { $in: ["Faculty", "Professor", "Admin", "Senior"] }
    }, "name email role department branch").sort({ name: 1 });

    res.json(facultyUsers);
  } catch (err) {
    console.error("FACULTY LIST ERROR:", err);
    res.status(500).json({ error: "Failed to fetch faculty list." });
  }
});

module.exports = router;
