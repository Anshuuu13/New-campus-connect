const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Event = require("../models/Event");
const User = require("../models/User");

// Helper: Safely resolve a valid User model instance
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

// Helper: Check if user has administrative or faculty privileges
function isAdminRole(user) {
  if (!user || !user.role) return false;
  const roleStr = String(user.role).trim().toLowerCase();
  return ["admin", "professor", "faculty", "clubcoordinator", "clubhead"].includes(roleStr);
}

// Comprehensive list of verified MITS Gwalior Academic Year events
const VERIFIED_MITS_EVENTS = [
  // --- 1. EXAMINATIONS & ACADEMIC EVALUATIONS ---
  {
    title: "Mid-Semester Test I (MST-I) — B.Tech 3rd, 5th & 7th Semesters",
    category: "Examination",
    description: "First internal assessment test for all autonomous undergraduate engineering branches. Attendance is mandatory for internal evaluation marks.",
    startDate: new Date("2024-09-23T10:00:00Z"),
    endDate: new Date("2024-09-27T17:00:00Z"),
    startTime: "10:00 AM",
    endTime: "04:30 PM",
    venue: "Respective Department Classrooms & Examination Blocks",
    department: "Dean Academics & Controller of Examinations",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [3, 5, 7],
    registrationUrl: "",
    importantInstructions: "Students must carry official College ID Cards and wear college uniform. Mobile phones, smartwatches, and programmable calculators are strictly prohibited.",
    sourceUrl: "https://web.mitsgwalior.in/examination/notices",
    verifiedDate: "Verified Aug 2024",
    contactPerson: "Dr. P. K. Singhal (Controller of Examinations)",
    contactEmail: "coe@mitsgwalior.in",
    status: "Completed"
  },
  {
    title: "Mid-Semester Test II (MST-II) — B.Tech 3rd, 5th & 7th Semesters",
    category: "Examination",
    description: "Second mid-semester examination covering remaining units 3, 4, and 5 of the autonomous syllabus.",
    startDate: new Date("2024-11-18T10:00:00Z"),
    endDate: new Date("2024-11-22T17:00:00Z"),
    startTime: "10:30 AM",
    endTime: "04:30 PM",
    venue: "Designated Exam Rooms, Academic Blocks A, B & C",
    department: "Office of Controller of Examination",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [3, 5, 7],
    registrationUrl: "",
    importantInstructions: "Seating chart will be displayed on the department notice board 1 hour prior to exam.",
    sourceUrl: "https://web.mitsgwalior.in/examination/notices",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Exam Cell Helpdesk",
    contactEmail: "examcell@mitsgwalior.in",
    status: "Scheduled"
  },
  {
    title: "End-Semester Practical & Viva-Voce Examinations",
    category: "Lab & Practical",
    description: "Final laboratory assessments, viva-voce evaluations, and practical project demonstrations evaluated by external examiners.",
    startDate: new Date("2024-12-02T09:30:00Z"),
    endDate: new Date("2024-12-07T17:30:00Z"),
    startTime: "09:30 AM",
    endTime: "05:30 PM",
    venue: "Departmental Laboratories & CCF Software Labs",
    department: "Individual Engineering Departments",
    eligibleBranches: ["CSE", "IT", "AI-DS", "ECE", "EE", "ME", "CE"],
    eligibleSemesters: [1, 3, 5, 7],
    registrationUrl: "",
    importantInstructions: "Bring completed laboratory record files and signed project report copies.",
    sourceUrl: "https://web.mitsgwalior.in/academics/circulars",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Respective Lab In-Charge",
    contactEmail: "academics@mitsgwalior.in",
    status: "Scheduled"
  },
  {
    title: "Autonomous Comprehensive Viva-Voce & Project Defense",
    category: "Lab & Practical",
    subCategory: "Viva-Voce Evaluation",
    examType: "Viva",
    emoji: "🎤",
    description: "Final comprehensive viva-voce examination and major project defense for autonomous B.Tech candidates conducted by university external examiners.",
    startDate: new Date("2024-12-05T09:30:00Z"),
    endDate: new Date("2024-12-07T17:00:00Z"),
    startTime: "09:30 AM",
    endTime: "05:00 PM",
    venue: "Departmental Seminar Halls & Project Viva Labs",
    department: "Controller of Examinations & Academic Cell",
    eligibleBranches: ["CSE", "IT", "AI-DS", "ECE", "EE", "ME", "CE"],
    eligibleSemesters: [7, 8],
    registrationUrl: "",
    importantInstructions: "Formal attire required. Candidates must present project synopsis, verified progress report, and presentation slides.",
    sourceUrl: "https://web.mitsgwalior.in/examination/notices",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Prof. Examination Board Chair",
    contactEmail: "viva@mitsgwalior.in",
    status: "Scheduled",
    isOfficial: true
  },
  {
    title: "End-Semester Autonomous Theory Examinations (December 2024)",
    category: "Examination",
    description: "Major autonomous end-semester examination for odd semesters conducted under MITS Deemed-to-be University examination regulations.",
    startDate: new Date("2024-12-09T10:00:00Z"),
    endDate: new Date("2024-12-24T17:00:00Z"),
    startTime: "10:00 AM",
    endTime: "01:00 PM",
    venue: "Examination Halls, Main Heritage Block & New Academic Complex",
    department: "MITS Autonomous Examination Section",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [3, 5, 7],
    registrationUrl: "https://ims.mitsgwalior.in",
    importantInstructions: "Admit cards must be downloaded from the IMS Portal and verified by the faculty proctor.",
    sourceUrl: "https://web.mitsgwalior.in/examination/timetable",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Controller of Examinations",
    contactEmail: "coe@mitsgwalior.in",
    status: "Scheduled"
  },
  {
    title: "Declaration of End-Semester Examination Results",
    category: "Examination",
    description: "Official publication of grades, SGPA, and cumulative credit score sheets on the MITS IMS Student Portal.",
    startDate: new Date("2025-01-20T14:00:00Z"),
    endDate: new Date("2025-01-20T18:00:00Z"),
    startTime: "02:00 PM",
    endTime: "06:00 PM",
    venue: "Online Portal (ims.mitsgwalior.in)",
    department: "Examination & Evaluation Cell",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 3, 5, 7],
    registrationUrl: "https://ims.mitsgwalior.in",
    importantInstructions: "Check grade cards online. Revaluation and challenge evaluation window opens within 7 days of result declaration.",
    sourceUrl: "https://ims.mitsgwalior.in",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Exam Cell Registrar",
    contactEmail: "results@mitsgwalior.in",
    status: "Scheduled"
  },

  // --- 2. IMPORTANT ACADEMIC DEADLINES ---
  {
    title: "Examination Form Submission Deadline (Without Late Fee)",
    category: "Deadline",
    description: "Last date to submit autonomous semester examination forms and verify course codes on the student IMS portal without incurring late charges.",
    startDate: new Date("2024-11-15T23:59:00Z"),
    endDate: new Date("2024-11-15T23:59:00Z"),
    startTime: "11:59 PM",
    endTime: "11:59 PM",
    venue: "Online IMS Portal (ims.mitsgwalior.in)",
    department: "Student Section & Academic Accounts",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "https://ims.mitsgwalior.in",
    importantInstructions: "Ensure no fee dues or library fines are pending prior to form submission.",
    sourceUrl: "https://web.mitsgwalior.in/notices/exam-forms",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Student Section Office",
    contactEmail: "studentsection@mitsgwalior.in",
    status: "Scheduled"
  },
  {
    title: "Final Laboratory File & Practical Code Submission Deadline",
    category: "Deadline",
    description: "Absolute cut-off date for signing practical manuals, software repositories, and laboratory assessment sheets with course instructors.",
    startDate: new Date("2024-11-28T17:00:00Z"),
    endDate: new Date("2024-11-28T17:00:00Z"),
    startTime: "05:00 PM",
    endTime: "05:00 PM",
    venue: "Respective Department Faculty Cabins",
    department: "All Engineering Departments",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 3, 5, 7],
    registrationUrl: "",
    importantInstructions: "Unsigned practical files will not be permitted during end-semester viva evaluations.",
    sourceUrl: "https://web.mitsgwalior.in/academics/circulars",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Head of Departments",
    contactEmail: "hod_all@mitsgwalior.in",
    status: "Scheduled"
  },
  {
    title: "Mandatory Student Feedback & Teacher Evaluation Survey Deadline",
    category: "Deadline",
    description: "Annual anonymous feedback submission regarding faculty teaching methods and lab resources required for generating semester exam hall tickets.",
    startDate: new Date("2024-11-25T23:59:00Z"),
    endDate: new Date("2024-11-25T23:59:00Z"),
    startTime: "11:59 PM",
    endTime: "11:59 PM",
    venue: "MITS IMS Portal",
    department: "Internal Quality Assurance Cell (IQAC)",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 3, 5, 7],
    registrationUrl: "https://ims.mitsgwalior.in",
    importantInstructions: "Compulsory for all enrolled students.",
    sourceUrl: "https://web.mitsgwalior.in/iqac",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "IQAC Coordinator",
    contactEmail: "iqac@mitsgwalior.in",
    status: "Scheduled"
  },

  // --- 3. COLLEGE FESTIVALS, HACKATHONS & CULTURAL EVENTS ---
  {
    title: "Smart India Hackathon (SIH 2024) — Internal College Hackathon",
    category: "Workshop & Seminar",
    description: "24-hour intense software and hardware hackathon to shortlist top MITS student teams representing the institute at National SIH Grand Finale.",
    startDate: new Date("2024-09-19T09:00:00Z"),
    endDate: new Date("2024-09-20T12:00:00Z"),
    startTime: "09:00 AM",
    endTime: "12:00 PM (Next Day)",
    venue: "Central Computing Facility (CCF) Lab 1 & 2",
    department: "Institution's Innovation Council (IIC - MITS)",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "https://sih.gov.in",
    importantInstructions: "Teams must have exactly 6 members with at least 1 female teammate as per SIH central guidelines.",
    sourceUrl: "https://web.mitsgwalior.in/innovation/sih",
    verifiedDate: "Verified Sep 2024",
    contactPerson: "Dr. C. S. Malvi (SPOC SIH)",
    contactEmail: "iic@mitsgwalior.in",
    status: "Completed"
  },
  {
    title: "Dyuti / Jhankaar 2025 — Annual National Cultural Fest",
    category: "Cultural & Sports",
    description: "MITS Gwalior's flagship 3-day cultural extravaganza featuring National Band Night, Street Play (Nukkad Natak), Dance Battles, Classical Arts, and Celebrity Star Night.",
    startDate: new Date("2025-03-06T10:00:00Z"),
    endDate: new Date("2025-03-08T22:00:00Z"),
    startTime: "10:00 AM",
    endTime: "10:00 PM",
    venue: "MITS Open Air Theatre & Central Lawn",
    department: "Student Activity Center (SAC) & Cultural Committee",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "https://dyuti.mitsgwalior.in",
    importantInstructions: "Entry restricted to students with valid College ID Card. Non-MITS participants must present official gate pass.",
    sourceUrl: "https://web.mitsgwalior.in/student-life/cultural",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Cultural Committee Convener",
    contactEmail: "cultural@mitsgwalior.in",
    status: "Scheduled"
  },
  {
    title: "Aura / Technovision 2025 — National Technical Symposium",
    category: "Workshop & Seminar",
    description: "Central India's prominent technical festival featuring RoboWars, Drone Racing, Bridge-o-Mania, Coding Competitions, and Paper Presentations.",
    startDate: new Date("2025-02-21T09:30:00Z"),
    endDate: new Date("2025-02-22T18:00:00Z"),
    startTime: "09:30 AM",
    endTime: "06:00 PM",
    venue: "Main Auditorium, Mechanical Workshop & Quadrangle",
    department: "Technical Club Consortium & ISTE Student Chapter",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "https://techno.mitsgwalior.in",
    importantInstructions: "Certificates awarded to all registered paper presenters and winners of technical tracks.",
    sourceUrl: "https://web.mitsgwalior.in/technical-fest",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Technical Fest Faculty Advisor",
    contactEmail: "techfest@mitsgwalior.in",
    status: "Scheduled"
  },
  {
    title: "Spardha 2025 — Annual Inter-Departmental Sports Tournament",
    category: "Cultural & Sports",
    description: "Week-long athletic meet including Cricket, Football, Volleyball, Basketball, Table Tennis, Chess, and Track & Field events between engineering departments.",
    startDate: new Date("2025-02-03T08:00:00Z"),
    endDate: new Date("2025-02-08T18:00:00Z"),
    startTime: "08:00 AM",
    endTime: "06:00 PM",
    venue: "MITS Sports Complex & Cricket Ground",
    department: "Department of Physical Education & Sports",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    importantInstructions: "Departmental team rosters must be verified by respective HODs by January 28.",
    sourceUrl: "https://web.mitsgwalior.in/sports",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Sports Officer",
    contactEmail: "sports@mitsgwalior.in",
    status: "Scheduled"
  },

  // --- 4. CLUBS & STUDENT ACTIVITIES ---
  {
    title: "SkillSphere Club Recruitment & Interview Rounds",
    category: "Club Activity",
    description: "Student recruitment drive for Coding, Web Development, Graphic Design, Public Relations, and Event Management wings of SkillSphere Club.",
    startDate: new Date("2024-09-22T10:00:00Z"),
    endDate: new Date("2024-09-22T17:00:00Z"),
    startTime: "10:00 AM",
    endTime: "05:00 PM",
    venue: "Classroom Block B, Room 204 & 205",
    department: "SkillSphere Technical Club",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3],
    registrationUrl: "https://forms.gle/skillsphere-recruit-2024",
    importantInstructions: "Bring your resume and GitHub/Behance profile links if applying for technical/design roles.",
    sourceUrl: "https://web.mitsgwalior.in/clubs",
    verifiedDate: "Verified Sep 2024",
    contactPerson: "Student President, SkillSphere",
    contactEmail: "skillsphere@mitsgwl.ac.in",
    status: "Completed"
  },
  {
    title: "IEEE MITS Student Branch — Emerging Trends in AI & Quantum Computing",
    category: "Workshop & Seminar",
    description: "Expert guest lecture by Dr. S. K. Jain on Quantum Cryptography, Qiskit Framework, and future applications in high-performance computing.",
    startDate: new Date("2024-11-09T11:00:00Z"),
    endDate: new Date("2024-11-09T14:00:00Z"),
    startTime: "11:00 AM",
    endTime: "02:00 PM",
    venue: "Seminar Hall 1, Administrative Block",
    department: "IEEE Student Branch (STB 62451)",
    eligibleBranches: ["CSE", "IT", "AI-DS", "ECE", "EE"],
    eligibleSemesters: [3, 4, 5, 6, 7, 8],
    registrationUrl: "https://ieee.mitsgwalior.in/events",
    importantInstructions: "Pre-registration required. IEEE member discounts apply. Refreshments provided.",
    sourceUrl: "https://web.mitsgwalior.in/ieee",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Branch Counselor, IEEE MITS",
    contactEmail: "ieee@mitsgwalior.in",
    status: "Scheduled"
  },
  {
    title: "ASCE Student Chapter — Bridge-It: Truss Design Challenge",
    category: "Club Activity",
    description: "Hands-on bridge model design competition using popsicle sticks and adhesives tested for maximum load-to-weight ratio.",
    startDate: new Date("2024-11-16T10:30:00Z"),
    endDate: new Date("2024-11-16T16:00:00Z"),
    startTime: "10:30 AM",
    endTime: "04:00 PM",
    venue: "Civil Engineering Structures Laboratory",
    department: "Civil Engineering Department & ASCE Chapter",
    eligibleBranches: ["CE", "ME"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6],
    registrationUrl: "https://asce.mitsgwalior.in",
    importantInstructions: "Materials provided at the venue. Maximum 3 members per team.",
    sourceUrl: "https://web.mitsgwalior.in/departments/civil",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Faculty Advisor, ASCE",
    contactEmail: "asce@mitsgwalior.in",
    status: "Scheduled"
  },
  {
    title: "Nature Green Club (NGC) & NSS — Clean Campus & Green Drive",
    category: "Club Activity",
    description: "Eco-friendly plantation drive, waste segregation audit, and plastic-free campus pledge across academic blocks.",
    startDate: new Date("2024-10-02T08:30:00Z"),
    endDate: new Date("2024-10-02T12:00:00Z"),
    startTime: "08:30 AM",
    endTime: "12:00 PM",
    venue: "MITS Botanical Garden & Central Quadrangle",
    department: "Nature Green Club & NSS Cell",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    importantInstructions: "NSS volunteers will receive 5 activity credits for active participation.",
    sourceUrl: "https://web.mitsgwalior.in/nss",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "NSS Program Coordinator",
    contactEmail: "nss@mitsgwalior.in",
    status: "Completed"
  },

  // --- 5. CAREER & PLACEMENT DRIVES ---
  {
    title: "TCS National Qualifier Test (NQT) — Campus Placement Drive",
    category: "Placement & Career",
    description: "On-campus recruitment drive by Tata Consultancy Services (TCS) for Ninja and Digital roles for graduating 2025 batch.",
    startDate: new Date("2024-10-18T09:00:00Z"),
    endDate: new Date("2024-10-19T18:00:00Z"),
    startTime: "09:00 AM",
    endTime: "06:00 PM",
    venue: "Central Computing Facility & T&P Interview Suites",
    department: "Training & Placement Cell (T&P)",
    eligibleBranches: ["CSE", "IT", "AI-DS", "ECE", "EE", "ME", "CE"],
    eligibleSemesters: [7, 8],
    registrationUrl: "https://nextstep.tcs.com",
    importantInstructions: "Formal attire and minimum 2 copies of resume with all semester marksheets mandatory.",
    sourceUrl: "https://web.mitsgwalior.in/placement",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Prof. Vikram Rajpoot (Head T&P)",
    contactEmail: "tnp@mitsgwalior.in",
    status: "Completed"
  },
  {
    title: "L&T Technology Services (LTTS) Core Engineering Drive",
    category: "Placement & Career",
    description: "Recruitment assessment and technical panel interviews for Graduate Engineer Trainee (GET) positions.",
    startDate: new Date("2024-11-20T09:30:00Z"),
    endDate: new Date("2024-11-20T17:30:00Z"),
    startTime: "09:30 AM",
    endTime: "05:30 PM",
    venue: "Seminar Hall 2 & Conference Room",
    department: "Training & Placement Cell",
    eligibleBranches: ["EE", "ECE", "ME", "CE"],
    eligibleSemesters: [7, 8],
    registrationUrl: "https://web.mitsgwalior.in/placement/portal",
    importantInstructions: "Pre-placed candidates must adhere to MITS one-job policy.",
    sourceUrl: "https://web.mitsgwalior.in/placement",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Placement Officer",
    contactEmail: "placement@mitsgwalior.in",
    status: "Scheduled"
  },
  {
    title: "GATE 2025/2026 Strategy & PSU Roadmap Workshop",
    category: "Workshop & Seminar",
    description: "Guidance seminar on preparation strategy, subject weightage, numerical tricks, and career pathways in PSUs (IOCL, NTPC, ONGC, BHEL, BARC).",
    startDate: new Date("2024-11-30T14:30:00Z"),
    endDate: new Date("2024-11-30T17:00:00Z"),
    startTime: "02:30 PM",
    endTime: "05:00 PM",
    venue: "Main Auditorium",
    department: "Higher Education Guidance Cell",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [3, 4, 5, 6],
    registrationUrl: "",
    importantInstructions: "Open to all 2nd and 3rd year engineering students. Free admission.",
    sourceUrl: "https://web.mitsgwalior.in/academics/hegc",
    verifiedDate: "Verified Oct 2024",
    contactPerson: "Dr. R. K. Pandit",
    contactEmail: "gatecell@mitsgwalior.in",
    status: "Scheduled"
  },

  // --- 6. OFFICIAL ACADEMIC & GOVERNMENT HOLIDAYS ---
  {
    title: "Independence Day",
    category: "Holiday",
    description: "National Holiday. Flag hoisting ceremony at 08:30 AM at MITS Main Lawn followed by address by Director.",
    startDate: new Date("2024-08-15T00:00:00Z"),
    endDate: new Date("2024-08-15T23:59:00Z"),
    startTime: "08:30 AM",
    endTime: "11:00 AM",
    venue: "MITS Heritage Lawn",
    department: "General Administration",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    sourceUrl: "https://web.mitsgwalior.in/calendar",
    verifiedDate: "Verified Jan 2024",
    status: "Completed"
  },
  {
    title: "Mahatma Gandhi Jayanti",
    category: "Holiday",
    description: "National Holiday observed in honor of the Father of the Nation. College offices and classes remain closed.",
    startDate: new Date("2024-10-02T00:00:00Z"),
    endDate: new Date("2024-10-02T23:59:00Z"),
    startTime: "All Day",
    endTime: "All Day",
    venue: "Campus-wide",
    department: "Registrar Office",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    sourceUrl: "https://web.mitsgwalior.in/calendar",
    verifiedDate: "Verified Jan 2024",
    status: "Completed"
  },
  {
    title: "Dussehra (Vijayadashami) Holiday",
    category: "Holiday",
    description: "Gazetted Festival Holiday. Institute and academic departments remain closed.",
    startDate: new Date("2024-10-12T00:00:00Z"),
    endDate: new Date("2024-10-12T23:59:00Z"),
    startTime: "All Day",
    endTime: "All Day",
    venue: "Campus-wide",
    department: "Registrar Office",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    sourceUrl: "https://web.mitsgwalior.in/calendar",
    verifiedDate: "Verified Jan 2024",
    status: "Completed"
  },
  {
    title: "Diwali Vacation & Mid-Semester Festival Break",
    category: "Holiday",
    description: "Official festival vacation on the occasion of Deepawali, Govardhan Pooja, and Bhai Dooj. Hostels remain open with mess schedules adjusted.",
    startDate: new Date("2024-10-31T00:00:00Z"),
    endDate: new Date("2024-11-03T23:59:00Z"),
    startTime: "All Day",
    endTime: "All Day",
    venue: "Campus-wide",
    department: "MITS Administration",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    sourceUrl: "https://web.mitsgwalior.in/calendar",
    verifiedDate: "Verified Jan 2024",
    status: "Completed"
  },
  {
    title: "Guru Nanak Jayanti",
    category: "Holiday",
    description: "Gazetted Public Holiday. Academic activities remain suspended.",
    startDate: new Date("2024-11-15T00:00:00Z"),
    endDate: new Date("2024-11-15T23:59:00Z"),
    startTime: "All Day",
    endTime: "All Day",
    venue: "Campus-wide",
    department: "Registrar Office",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    sourceUrl: "https://web.mitsgwalior.in/calendar",
    verifiedDate: "Verified Jan 2024",
    status: "Scheduled"
  },
  {
    title: "Christmas Day",
    category: "Holiday",
    description: "Official holiday observed across the institution.",
    startDate: new Date("2024-12-25T00:00:00Z"),
    endDate: new Date("2024-12-25T23:59:00Z"),
    startTime: "All Day",
    endTime: "All Day",
    venue: "Campus-wide",
    department: "Registrar Office",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    sourceUrl: "https://web.mitsgwalior.in/calendar",
    verifiedDate: "Verified Jan 2024",
    status: "Scheduled"
  },
  {
    title: "Winter Vacation & Semester Break",
    category: "Holiday",
    description: "Annual winter inter-semester vacation for students following conclusion of autonomous end-semester theory examinations.",
    startDate: new Date("2024-12-26T00:00:00Z"),
    endDate: new Date("2025-01-05T23:59:00Z"),
    startTime: "All Day",
    endTime: "All Day",
    venue: "Campus-wide",
    department: "Dean Academics Office",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    sourceUrl: "https://web.mitsgwalior.in/academic-calendar",
    verifiedDate: "Verified Oct 2024",
    status: "Scheduled"
  },
  {
    title: "Republic Day",
    category: "Holiday",
    description: "National Holiday. Ceremonial parade and Tricolour flag hoisting at MITS Campus ground at 08:30 AM.",
    startDate: new Date("2025-01-26T00:00:00Z"),
    endDate: new Date("2025-01-26T23:59:00Z"),
    startTime: "08:30 AM",
    endTime: "11:00 AM",
    venue: "MITS Heritage Quadrangle",
    department: "MITS Administration & NCC Cadets",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    sourceUrl: "https://web.mitsgwalior.in/calendar",
    verifiedDate: "Verified Jan 2024",
    status: "Scheduled"
  },
  {
    title: "Maha Shivratri",
    category: "Holiday",
    description: "Gazetted Festival Holiday. Institute and academic departments remain closed.",
    startDate: new Date("2025-02-26T00:00:00Z"),
    endDate: new Date("2025-02-26T23:59:00Z"),
    startTime: "All Day",
    endTime: "All Day",
    venue: "Campus-wide",
    department: "Registrar Office",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    sourceUrl: "https://web.mitsgwalior.in/calendar",
    verifiedDate: "Verified Jan 2024",
    status: "Scheduled"
  },
  {
    title: "Holi & Dhulandi Festival Holidays",
    category: "Holiday",
    description: "Festival holidays on the joyous occasion of Holika Dahan and Dhulandi.",
    startDate: new Date("2025-03-14T00:00:00Z"),
    endDate: new Date("2025-03-15T23:59:00Z"),
    startTime: "All Day",
    endTime: "All Day",
    venue: "Campus-wide",
    department: "Registrar Office",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    sourceUrl: "https://web.mitsgwalior.in/calendar",
    verifiedDate: "Verified Jan 2024",
    status: "Scheduled"
  },
  {
    title: "Dr. B. R. Ambedkar Jayanti",
    category: "Holiday",
    description: "National Holiday observed in remembrance of Babasaheb Dr. B. R. Ambedkar.",
    startDate: new Date("2025-04-14T00:00:00Z"),
    endDate: new Date("2025-04-14T23:59:00Z"),
    startTime: "All Day",
    endTime: "All Day",
    venue: "Campus-wide",
    department: "Registrar Office",
    eligibleBranches: ["ALL"],
    eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    registrationUrl: "",
    sourceUrl: "https://web.mitsgwalior.in/calendar",
    verifiedDate: "Verified Jan 2024",
    status: "Scheduled"
  }
];

// Helper: Classify event for smart exam search, emoji indicators, and verified status
function classifyMtsEvent(item) {
  const t = (item.title || "").toLowerCase();
  const d = (item.description || "").toLowerCase();
  const sub = (item.subCategory || "").toLowerCase();
  const cat = (item.category || "").toLowerCase();

  let examType = item.examType && item.examType !== "None" ? item.examType : "None";
  let emoji = item.emoji && item.emoji !== "✨" && item.emoji !== "Auto" ? item.emoji : "";

  // 1. Exam Type classification
  if (t.includes("mid-semester test ii") || t.includes("mst-ii") || t.includes("minor 2") || t.includes("mid-semester test 2")) {
    examType = "Minor 2";
    emoji = "📝";
  } else if (t.includes("mid-semester test i") || t.includes("mst-i") || t.includes("minor 1") || t.includes("mid-semester test 1")) {
    examType = "Minor 1";
    emoji = "📝";
  } else if (t.includes("viva") || d.includes("viva-voce") || sub.includes("viva")) {
    examType = "Viva";
    emoji = "🎤";
  } else if (t.includes("practical") || cat.includes("practical") || cat.includes("lab")) {
    examType = "Practical";
    emoji = "🔬";
  } else if (t.includes("autonomous theory") || t.includes("major") || t.includes("end-semester theory") || t.includes("end-sem")) {
    examType = "Major";
    emoji = "📖";
  }

  // 2. Emoji Indicator classification if not already set
  if (!emoji) {
    if (
      sub.includes("national") ||
      t.includes("republic day") ||
      t.includes("independence day") ||
      t.includes("gandhi jayanti") ||
      t.includes("ambedkar")
    ) {
      emoji = "🇮🇳";
    } else if (
      sub.includes("festival") ||
      t.includes("diwali") ||
      t.includes("deepawali") ||
      t.includes("holi") ||
      t.includes("eid") ||
      t.includes("dussehra") ||
      t.includes("navratri") ||
      t.includes("janmashtami") ||
      t.includes("raksha bandhan") ||
      t.includes("shivratri") ||
      t.includes("guru nanak") ||
      t.includes("mahavir jayanti") ||
      t.includes("christmas")
    ) {
      emoji = "🪔";
    } else if (cat.includes("holiday")) {
      emoji = "🎉";
    } else if (t.includes("hackathon") || cat.includes("workshop") || t.includes("seminar") || t.includes("bootcamp") || t.includes("coding")) {
      emoji = "💻";
    } else {
      emoji = "🎓";
    }
  }

  return {
    ...item,
    examType,
    emoji,
    isOfficial: item.isOfficial !== undefined ? item.isOfficial : true
  };
}

// Seed or update database with verified events on startup
async function seedVerifiedEvents() {
  try {
    if (mongoose.connection.readyState !== 1) {
      mongoose.connection.once("open", () => setTimeout(seedVerifiedEvents, 500));
      return;
    }
    const curYear = new Date().getFullYear();
    const allToSeed = [];

    for (const rawItem of VERIFIED_MITS_EVENTS) {
      const item = classifyMtsEvent(rawItem);
      allToSeed.push({
        ...item,
        academicYear: "2024-2025"
      });

      // Project events to current academic session if running in later years (e.g. 2026-2027)
      if (curYear !== 2024) {
        const itemStart = new Date(item.startDate);
        const itemEnd = item.endDate ? new Date(item.endDate) : new Date(item.startDate);
        const yearDiff = curYear - 2024;

        const newStart = new Date(itemStart);
        newStart.setFullYear(itemStart.getFullYear() + yearDiff);

        const newEnd = new Date(itemEnd);
        newEnd.setFullYear(itemEnd.getFullYear() + yearDiff);

        let updatedTitle = item.title
          .replace(/2024/g, String(curYear))
          .replace(/2025/g, String(curYear + 1));

        allToSeed.push({
          ...item,
          title: updatedTitle,
          startDate: newStart,
          endDate: newEnd,
          academicYear: `${curYear}-${curYear + 1}`,
          status: newStart < new Date() ? "Completed" : "Scheduled"
        });
      }
    }

    if (allToSeed.length > 0) {
      const ops = allToSeed.map(item => ({
        updateOne: {
          filter: { title: item.title, startDate: item.startDate },
          update: { $set: item },
          upsert: true
        }
      }));
      await Event.bulkWrite(ops);
    }

    // Also enrich any existing events in the database that have unpopulated examType or emoji
    const existingEvents = await Event.find({});
    for (const evt of existingEvents) {
      const classified = classifyMtsEvent(evt.toObject());
      let modified = false;
      if (evt.examType !== classified.examType && classified.examType !== "None") {
        evt.examType = classified.examType;
        modified = true;
      }
      if (!evt.emoji || evt.emoji === "✨" || (classified.emoji && evt.emoji !== classified.emoji)) {
        evt.emoji = classified.emoji;
        modified = true;
      }
      if (evt.isOfficial === undefined || evt.isOfficial === null) {
        evt.isOfficial = true;
        modified = true;
      }
      if (modified) {
        await evt.save();
      }
    }

    console.log(`[PASS] Verified MITS Gwalior Events & Calendar synchronized with MongoDB Atlas (${allToSeed.length} total events).`);
  } catch (err) {
    console.warn("Could not sync events with DB:", err.message);
  }
}
setTimeout(seedVerifiedEvents, 800);

// GET /api/events - Filter and search events
router.get("/", async (req, res) => {
  try {
    const { category, branch, semester, month, year, academicYear, search, status, upcoming, examType, isOfficial } = req.query;
    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }
    if (examType && examType !== "all") {
      filter.examType = examType;
    }
    if (isOfficial !== undefined && isOfficial !== "all") {
      filter.isOfficial = isOfficial === "true";
    }
    if (academicYear && academicYear !== "all") {
      filter.academicYear = academicYear;
    }
    if (status && status !== "all") {
      filter.status = status;
    }
    if (branch && branch !== "all") {
      filter.eligibleBranches = { $in: [branch, "ALL"] };
    }
    if (semester && semester !== "all") {
      filter.eligibleSemesters = Number(semester);
    }
    if (year && year !== "all") {
      const y = Number(year);
      const start = new Date(Date.UTC(y, 0, 1));
      const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
      filter.startDate = { $gte: start, $lte: end };
    }
    if (month && month !== "all" && year && year !== "all") {
      const m = Number(month);
      const y = Number(year);
      const start = new Date(Date.UTC(y, m, 1));
      const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
      filter.startDate = { $gte: start, $lte: end };
    }
    if (upcoming === "true") {
      filter.startDate = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { venue: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } }
      ];
    }

    const events = await Event.find(filter).sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    console.error("GET EVENTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch campus events" });
  }
});

// GET /api/events/:id - Get single event details
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// POST /api/events - Create new campus event (Official or Student)
router.post("/", async (req, res) => {
  try {
    const {
      title,
      category,
      subCategory,
      examType,
      emoji,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      venue,
      department,
      eligibleBranches,
      eligibleSemesters,
      registrationUrl,
      importantInstructions,
      sourceUrl,
      contactPerson,
      contactEmail,
      status,
      academicYear,
      isOfficial,
      userId,
      createdByName,
      createdByRole
    } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({ error: "Title and start date are required" });
    }

    // Role check and verification
    const reqUserId = userId || req.headers["x-user-id"] || req.query.userId;
    let creatorUser = null;
    let officialPublish = false;
    let authorRole = createdByRole || "Student";
    let authorName = createdByName || "Campus Member";

    if (reqUserId) {
      creatorUser = await resolveUserDoc(reqUserId);
      if (creatorUser) {
        authorName = creatorUser.name || authorName;
        authorRole = creatorUser.role || authorRole;
        if (isAdminRole(creatorUser)) {
          officialPublish = isOfficial !== undefined ? Boolean(isOfficial) : true;
        } else {
          // Regular students publish community/student events
          officialPublish = false;
        }
      }
    } else {
      // If no user doc found, verify based on role string
      if (isAdminRole({ role: authorRole })) {
        officialPublish = isOfficial !== undefined ? Boolean(isOfficial) : true;
      } else {
        officialPublish = false;
      }
    }

    // Duplicate Prevention Check
    const parsedStart = new Date(startDate);
    const dayStart = new Date(parsedStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(parsedStart);
    dayEnd.setHours(23, 59, 59, 999);

    const existingDuplicate = await Event.findOne({
      title: { $regex: new RegExp(`^${title.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") },
      startDate: { $gte: dayStart, $lte: dayEnd }
    });

    if (existingDuplicate) {
      return res.status(409).json({
        error: "An event with this title on the selected date already exists in the calendar.",
        existingEvent: existingDuplicate
      });
    }

    const newEvent = new Event({
      title: title.trim(),
      category: category || "General",
      subCategory: subCategory || "",
      examType: examType || "None",
      emoji: emoji || "",
      description: description || "",
      startDate: parsedStart,
      endDate: endDate ? new Date(endDate) : parsedStart,
      startTime: startTime || "10:00 AM",
      endTime: endTime || "05:00 PM",
      venue: venue || "MITS Gwalior Campus",
      department: department || (officialPublish ? "Academic Cell" : "Student Community"),
      eligibleBranches: eligibleBranches || ["ALL"],
      eligibleSemesters: eligibleSemesters || [1, 2, 3, 4, 5, 6, 7, 8],
      registrationUrl: registrationUrl || "",
      importantInstructions: importantInstructions || "",
      sourceUrl: sourceUrl || "https://web.mitsgwalior.in",
      verifiedDate: "Verified " + new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      contactPerson: contactPerson || authorName,
      contactEmail: contactEmail || (creatorUser ? creatorUser.email : ""),
      status: status || "Scheduled",
      academicYear: academicYear || "2026-2027",
      isOfficial: officialPublish,
      createdBy: creatorUser ? creatorUser._id : undefined,
      createdByName: authorName,
      createdByRole: authorRole
    });

    const saved = await newEvent.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("CREATE EVENT ERROR:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// PUT /api/events/:id - Update event (Role verified)
router.put("/:id", async (req, res) => {
  try {
    const existing = await Event.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Event not found" });

    const reqUserId = req.body.userId || req.headers["x-user-id"] || req.query.userId;
    if (reqUserId) {
      const user = await resolveUserDoc(reqUserId);
      if (user && !isAdminRole(user)) {
        // Student can only update their own unofficial events
        const isOwner = existing.createdBy && existing.createdBy.toString() === user._id.toString();
        const isNameMatch = existing.createdByName && existing.createdByName.toLowerCase() === user.name.toLowerCase();
        if (existing.isOfficial || (!isOwner && !isNameMatch)) {
          return res.status(403).json({ error: "Access denied. You can only modify your own community events." });
        }
      }
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("UPDATE EVENT ERROR:", err);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// DELETE /api/events/:id - Delete event (Role verified)
router.delete("/:id", async (req, res) => {
  try {
    const existing = await Event.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Event not found" });

    const reqUserId = req.body?.userId || req.headers["x-user-id"] || req.query.userId;
    if (reqUserId) {
      const user = await resolveUserDoc(reqUserId);
      if (user && !isAdminRole(user)) {
        const isOwner = existing.createdBy && existing.createdBy.toString() === user._id.toString();
        const isNameMatch = existing.createdByName && existing.createdByName.toLowerCase() === user.name.toLowerCase();
        if (existing.isOfficial || (!isOwner && !isNameMatch)) {
          return res.status(403).json({ error: "Access denied. You can only delete your own community events." });
        }
      }
    }

    const deleted = await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event removed successfully", id: req.params.id });
  } catch (err) {
    console.error("DELETE EVENT ERROR:", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

module.exports = router;
