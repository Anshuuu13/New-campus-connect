/**
 * CampusConnect - Events & Academic Calendar Module
 * Madhav Institute of Technology & Science (MITS), Gwalior
 * 
 * Interactive Multi-View Calendar (Month, Week, Year, Cards, Directory),
 * Live Countdown Timers, Photography & Badges, Google Calendar & .ICS Sync,
 * MITS AMS Notice Board Auto-Sync Simulation, Bookmarks & Reminders.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Ensure user session exists or fallback gracefully
  let currentUser = null;
  try {
    const saved = localStorage.getItem("campusConnectUser");
    if (saved) {
      currentUser = JSON.parse(saved);
      const nameEl = document.getElementById("navUserName");
      if (nameEl && currentUser.name) {
        nameEl.textContent = currentUser.name;
      }
      const picEl = document.getElementById("navProfilePic");
      if (picEl && currentUser.picture) {
        picEl.src = currentUser.picture;
      }
    }
  } catch (e) {
    console.warn("Could not parse saved user:", e);
  }

  // State Management
  const state = {
    events: [],
    filteredEvents: [],
    currentDate: new Date(),
    viewMode: "month", // 'month' | 'week' | 'year' | 'cards' | 'directory'
    selectedCategory: "all",
    selectedAcademicYear: "2026-2027",
    selectedBranch: "all",
    selectedSemester: "all",
    selectedStatus: "all",
    selectedEmojiFilter: "all",
    selectedSourceFilter: "all", // 'all' | 'official' | 'student'
    isPersonalizedActive: false,
    searchQuery: "",
    showSavedOnly: false,
    savedEventIds: new Set(),
    reminders: new Set(),
    apiBase: "",
    activeTab: "this-week",
    countdownInterval: null
  };

  // Load saved bookmarks and reminders
  try {
    const savedBookmarks = JSON.parse(localStorage.getItem("mits_saved_events") || "[]");
    state.savedEventIds = new Set(savedBookmarks);
  } catch (e) {
    state.savedEventIds = new Set();
  }

  try {
    const savedReminders = JSON.parse(localStorage.getItem("mits_event_reminders") || "[]");
    state.reminders = new Set(savedReminders);
  } catch (e) {
    state.reminders = new Set();
  }

  // Category Configuration (Visual Theme, Icons, Backgrounds)
  const CATEGORY_CONFIG = {
    "Examination": {
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.15)",
      border: "rgba(239, 68, 68, 0.4)",
      label: "Examination",
      icon: "📝",
      defaultImage: "assets/images/mits-campus.jpg"
    },
    "Holiday": {
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.4)",
      label: "Holiday",
      icon: "🏖️",
      defaultImage: "assets/images/campus-event.webp"
    },
    "Lab & Practical": {
      color: "#8b5cf6",
      bg: "rgba(139, 92, 246, 0.15)",
      border: "rgba(139, 92, 246, 0.4)",
      label: "Lab & Practical",
      icon: "🔬",
      defaultImage: "assets/images/robotics-innovation.webp"
    },
    "Club Activity": {
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.15)",
      border: "rgba(245, 158, 11, 0.4)",
      label: "Club Activity",
      icon: "🎯",
      defaultImage: "assets/images/g20-innovation.webp"
    },
    "Workshop & Seminar": {
      color: "#06b6d4",
      bg: "rgba(6, 182, 212, 0.15)",
      border: "rgba(6, 182, 212, 0.4)",
      label: "Workshop & Seminar",
      icon: "💡",
      defaultImage: "assets/images/academic-presentation.webp"
    },
    "Placement & Career": {
      color: "#f97316",
      bg: "rgba(249, 115, 22, 0.15)",
      border: "rgba(249, 115, 22, 0.4)",
      label: "Placement & Career",
      icon: "💼",
      defaultImage: "assets/images/naac-accreditation.webp"
    },
    "Deadline": {
      color: "#ec4899",
      bg: "rgba(236, 72, 153, 0.15)",
      border: "rgba(236, 72, 153, 0.4)",
      label: "Deadline",
      icon: "⚠️",
      defaultImage: "assets/images/naac-accreditation.webp"
    },
    "Cultural & Sports": {
      color: "#6366f1",
      bg: "rgba(99, 102, 241, 0.15)",
      border: "rgba(99, 102, 241, 0.4)",
      label: "Cultural & Sports",
      icon: "🏆",
      defaultImage: "assets/images/campus-event.webp"
    },
    "General": {
      color: "#64748b",
      bg: "rgba(100, 116, 139, 0.15)",
      border: "rgba(100, 116, 139, 0.4)",
      label: "General",
      icon: "📌",
      defaultImage: "assets/images/mits-campus.jpg"
    }
  };

  // DOM Elements
  const DOM = {
    // Navigation & Views
    prevPeriodBtn: document.getElementById("prevPeriodBtn"),
    nextPeriodBtn: document.getElementById("nextPeriodBtn"),
    todayBtn: document.getElementById("todayBtn"),
    calendarPeriodTitle: document.getElementById("calendarPeriodTitle"),
    viewMonthBtn: document.getElementById("viewMonthBtn"),
    viewWeekBtn: document.getElementById("viewWeekBtn"),
    viewYearBtn: document.getElementById("viewYearBtn"),
    viewCardsBtn: document.getElementById("viewCardsBtn"),
    viewDirectoryBtn: document.getElementById("viewDirectoryBtn"),
    monthViewContainer: document.getElementById("monthViewContainer"),
    weekViewContainer: document.getElementById("weekViewContainer"),
    yearViewContainer: document.getElementById("yearViewContainer"),
    cardsViewContainer: document.getElementById("cardsViewContainer"),
    directoryViewContainer: document.getElementById("directoryViewContainer"),
    monthGrid: document.getElementById("monthGrid"),
    weekGrid: document.getElementById("weekGrid"),
    yearGrid: document.getElementById("yearGrid"),
    eventCardsModernGrid: document.getElementById("eventCardsModernGrid"),
    eventsDirectoryTbody: document.getElementById("eventsDirectoryTbody"),

    // Filters & Search
    categoryPills: document.querySelectorAll(".cat-pill"),
    eventSearchInput: document.getElementById("eventSearchInput"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    academicYearFilterSelect: document.getElementById("academicYearFilterSelect"),
    branchFilterSelect: document.getElementById("branchFilterSelect"),
    semesterFilterSelect: document.getElementById("semesterFilterSelect"),
    statusFilterSelect: document.getElementById("statusFilterSelect"),
    resetFiltersBtn: document.getElementById("resetFiltersBtn"),
    toggleSavedFilterBtn: document.getElementById("toggleSavedFilterBtn"),
    savedFilterLabel: document.getElementById("savedFilterLabel"),
    activeFilterIndicators: document.getElementById("activeFilterIndicators"),
    filterTagsList: document.getElementById("filterTagsList"),

    // Countdowns & Ribbon
    examCountdownCard: document.getElementById("examCountdownCard"),
    examTargetName: document.getElementById("examTargetName"),
    examTargetDate: document.getElementById("examTargetDate"),
    examDays: document.getElementById("examDays"),
    examHours: document.getElementById("examHours"),
    examMins: document.getElementById("examMins"),
    examSecs: document.getElementById("examSecs"),
    holidayTargetName: document.getElementById("holidayTargetName"),
    holidayTargetDate: document.getElementById("holidayTargetDate"),
    holidayDays: document.getElementById("holidayDays"),
    holidayHours: document.getElementById("holidayHours"),
    holidayMins: document.getElementById("holidayMins"),
    holidaySecs: document.getElementById("holidaySecs"),
    urgentDeadlineCount: document.getElementById("urgentDeadlineCount"),
    nextUrgentDeadlineTitle: document.getElementById("nextUrgentDeadlineTitle"),
    nextUrgentDeadlineMeta: document.getElementById("nextUrgentDeadlineMeta"),
    nextUrgentDeadlineDate: document.getElementById("nextUrgentDeadlineDate"),
    totalEventsCount: document.getElementById("totalEventsCount"),
    thisMonthCount: document.getElementById("thisMonthCount"),
    refreshEventsBtn: document.getElementById("refreshEventsBtn"),
    exportAllIcsBtn: document.getElementById("exportAllIcsBtn"),
    syncAmsBtn: document.getElementById("syncAmsBtn"),
    amsSyncTimestamp: document.getElementById("amsSyncTimestamp"),

    // Smart Examination Search
    smartExamFinderSection: document.getElementById("smartExamFinderSection"),
    examFinderType: document.getElementById("examFinderType"),
    examFinderBranch: document.getElementById("examFinderBranch"),
    examFinderSemester: document.getElementById("examFinderSemester"),
    examFinderSession: document.getElementById("examFinderSession"),
    btnSearchExamSchedule: document.getElementById("btnSearchExamSchedule"),
    btnResetExamSearch: document.getElementById("btnResetExamSearch"),
    examSearchResults: document.getElementById("examSearchResults"),

    // Emoji Indicator Legend
    emojiLegendStrip: document.getElementById("emojiLegendStrip"),
    legendEmojiPills: document.querySelectorAll(".legend-emoji-pill"),

    // Event Source & Personalized Schedule
    eventSourceToggleGroup: document.getElementById("eventSourceToggleGroup"),
    sourceToggleBtns: document.querySelectorAll(".source-toggle-btn"),
    personalizedScheduleBtn: document.getElementById("personalizedScheduleBtn"),
    personalizedScheduleLabel: document.getElementById("personalizedScheduleLabel"),

    // Highlights Tabs
    tabThisWeekBtn: document.getElementById("tabThisWeekBtn"),
    tabExamsBtn: document.getElementById("tabExamsBtn"),
    tabHolidaysBtn: document.getElementById("tabHolidaysBtn"),
    tabWorkshopsBtn: document.getElementById("tabWorkshopsBtn"),
    tabDeadlinesBtn: document.getElementById("tabDeadlinesBtn"),
    tabFlagshipBtn: document.getElementById("tabFlagshipBtn"),
    badgeThisWeek: document.getElementById("badgeThisWeek"),
    badgeExams: document.getElementById("badgeExams"),
    badgeHolidays: document.getElementById("badgeHolidays"),
    badgeWorkshops: document.getElementById("badgeWorkshops"),
    badgeDeadlines: document.getElementById("badgeDeadlines"),
    badgeFlagship: document.getElementById("badgeFlagship"),
    paneThisWeek: document.getElementById("paneThisWeek"),
    paneExams: document.getElementById("paneExams"),
    paneHolidays: document.getElementById("paneHolidays"),
    paneWorkshops: document.getElementById("paneWorkshops"),
    paneDeadlines: document.getElementById("paneDeadlines"),
    paneFlagship: document.getElementById("paneFlagship"),
    thisWeekGrid: document.getElementById("thisWeekGrid"),
    examsGrid: document.getElementById("examsGrid"),
    holidaysGrid: document.getElementById("holidaysGrid"),
    workshopsGrid: document.getElementById("workshopsGrid"),
    deadlinesGrid: document.getElementById("deadlinesGrid"),
    flagshipGrid: document.getElementById("flagshipGrid"),

    // Event Details Modal
    eventDetailsBackdrop: document.getElementById("eventDetailsBackdrop"),
    modalDateHeader: document.getElementById("modalDateHeader"),
    modalEventsListContainer: document.getElementById("modalEventsListContainer"),
    closeEventDetailsBtn: document.getElementById("closeEventDetailsBtn"),
    closeModalBottomBtn: document.getElementById("closeModalBottomBtn"),

    // Admin & Student Event Modal
    adminEventBackdrop: document.getElementById("adminEventBackdrop"),
    adminModalHeading: document.getElementById("adminModalHeading"),
    openAddEventModalBtn: document.getElementById("openAddEventModalBtn"),
    closeAdminModalBtn: document.getElementById("closeAdminModalBtn"),
    cancelAdminModalBtn: document.getElementById("cancelAdminModalBtn"),
    adminEventForm: document.getElementById("adminEventForm"),
    adminFormFeedback: document.getElementById("adminFormFeedback"),
    saveEventSubmitBtn: document.getElementById("saveEventSubmitBtn"),
    evtExamType: document.getElementById("evtExamType"),
    evtSubCategory: document.getElementById("evtSubCategory"),
    evtEmoji: document.getElementById("evtEmoji"),
    evtIsOfficialWrap: document.getElementById("evtIsOfficialWrap"),
    evtIsOfficial: document.getElementById("evtIsOfficial"),
    evtIsOfficialHint: document.getElementById("evtIsOfficialHint"),
    evtEditId: document.getElementById("evtEditId"),

    // Toast Container
    toastContainer: document.getElementById("toastContainer")
  };

  // Helper: Check if user has admin/faculty privileges
  function isUserAdmin(u) {
    if (!u || !u.role) return false;
    const r = String(u.role).trim().toLowerCase();
    return ["admin", "professor", "faculty", "clubcoordinator", "clubhead"].includes(r);
  }

  // Exact Emoji Indicator Mapping (Requirement 4)
  // 🎉 General holidays, 🇮🇳 National holidays, 🪔 Festivals, 📝 Minor exams,
  // 📖 Major exams, 🔬 Practical exams, 🎤 Viva, 🎓 College events, 💻 Hackathons and workshops
  function getEventEmoji(e) {
    if (!e) return "📌";
    if (e.emoji && e.emoji.trim() && e.emoji !== "✨" && e.emoji !== "Auto") {
      return e.emoji.trim();
    }
    const title = (e.title || "").toLowerCase();
    const desc = (e.description || "").toLowerCase();
    const subCat = (e.subCategory || "").toLowerCase();
    const cat = (e.category || "").toLowerCase();
    const examType = (e.examType || "").toLowerCase();

    // 1. National holidays 🇮🇳
    if (
      subCat.includes("national") ||
      title.includes("republic day") ||
      title.includes("independence day") ||
      title.includes("gandhi jayanti") ||
      title.includes("ambedkar") ||
      desc.includes("national holiday")
    ) {
      return "🇮🇳";
    }

    // 2. Festivals 🪔
    if (
      subCat.includes("festival") ||
      title.includes("diwali") ||
      title.includes("deepawali") ||
      title.includes("holi") ||
      title.includes("eid") ||
      title.includes("dussehra") ||
      title.includes("navratri") ||
      title.includes("janmashtami") ||
      title.includes("raksha bandhan") ||
      title.includes("shivratri") ||
      title.includes("guru nanak") ||
      title.includes("mahavir jayanti") ||
      title.includes("christmas") ||
      title.includes("durga puja") ||
      title.includes("chhat") ||
      title.includes("muharram")
    ) {
      return "🪔";
    }

    // 3. General holidays 🎉
    if (
      cat.includes("holiday") ||
      subCat.includes("holiday") ||
      title.includes("holiday") ||
      title.includes("vacation") ||
      title.includes("break")
    ) {
      return "🎉";
    }

    // 4. Minor exams 📝
    if (
      examType === "minor 1" ||
      examType === "minor 2" ||
      title.includes("minor 1") ||
      title.includes("minor 2") ||
      title.includes("minor exam") ||
      title.includes("mst-i") ||
      title.includes("mst-ii") ||
      title.includes("mid-semester") ||
      title.includes("mid semester") ||
      title.includes("internal assessment")
    ) {
      return "📝";
    }

    // 5. Viva 🎤
    if (
      examType === "viva" ||
      title.includes("viva") ||
      title.includes("viva-voce") ||
      title.includes("oral evaluation") ||
      title.includes("oral examination") ||
      desc.includes("viva-voce")
    ) {
      return "🎤";
    }

    // 6. Practical exams 🔬
    if (
      examType === "practical" ||
      cat.includes("practical") ||
      cat.includes("lab") ||
      title.includes("practical exam") ||
      title.includes("lab exam") ||
      title.includes("laboratory assessment") ||
      subCat.includes("practical")
    ) {
      return "🔬";
    }

    // 7. Major exams 📖
    if (
      examType === "major" ||
      title.includes("major exam") ||
      title.includes("end-semester theory") ||
      title.includes("end semester theory") ||
      title.includes("autonomous theory") ||
      title.includes("end-sem") ||
      title.includes("end sem") ||
      cat.includes("examination")
    ) {
      return "📖";
    }

    // 8. Hackathons & Workshops 💻
    if (
      title.includes("hackathon") ||
      title.includes("coding contest") ||
      title.includes("datathon") ||
      title.includes("workshop") ||
      title.includes("seminar") ||
      title.includes("hands-on") ||
      title.includes("bootcamp") ||
      cat.includes("workshop")
    ) {
      return "💻";
    }

    // 9. College events 🎓
    if (
      cat.includes("cultural") ||
      cat.includes("club") ||
      cat.includes("placement") ||
      cat.includes("college") ||
      title.includes("dyuti") ||
      title.includes("aura") ||
      title.includes("spardha") ||
      title.includes("orientation") ||
      title.includes("convocation") ||
      title.includes("induction") ||
      title.includes("fest")
    ) {
      return "🎓";
    }

    if (cat.includes("deadline") || title.includes("deadline")) {
      return "⚠️";
    }

    return "📌";
  }

  // ================= 1. VERIFIED MITS DATA ARCHIVE (60+ EVENTS) =================
  function getFallbackEventsArchive() {
    const curYear = new Date().getFullYear(); // e.g. 2026
    const nextYear = curYear + 1;

    function mkDate(y, m, d, h = 10, min = 0) {
      return new Date(Date.UTC(y, m - 1, d, h, min, 0)).toISOString();
    }

    const baseEvents = [
      // --- EXAMINATIONS & ACADEMIC EVALUATIONS ---
      {
        idSuffix: "mst1",
        title: "Mid-Semester Test I (MST-I) - Autonomous Engineering",
        category: "Examination",
        examType: "Minor 1",
        emoji: "📝",
        subCategory: "Minor Exam",
        description: "First internal assessment test covering Unit 1 & Unit 2 of the autonomous undergraduate engineering curriculum. Mandatory for continuous evaluation internal marks.",
        startMonth: 9, startDay: 23, endMonth: 9, endDay: 27,
        startTime: "10:00 AM", endTime: "04:30 PM",
        venue: "Respective Department Classrooms & Exam Blocks A & B",
        department: "Dean Academics & Controller of Examinations",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [3, 5, 7],
        registrationUrl: "https://ims.mitsgwalior.in",
        importantInstructions: "Students must wear college uniform and carry official College ID Card. Mobile phones, smartwatches, and programmable calculators are strictly prohibited.",
        sourceUrl: "https://web.mitsgwalior.in/examination/notices",
        contactPerson: "Dr. P. K. Singhal (Controller of Examinations)",
        contactEmail: "coe@mitsgwalior.in",
        status: "Completed",
        isOfficial: true,
        image: "assets/images/mits-campus.jpg"
      },
      {
        idSuffix: "mst2",
        title: "Mid-Semester Test II (MST-II) - B.Tech All Branches",
        category: "Examination",
        examType: "Minor 2",
        emoji: "📝",
        subCategory: "Minor Exam",
        description: "Second mid-semester examination covering remaining units 3, 4, and 5 of the autonomous syllabus across all departments.",
        startMonth: 11, startDay: 18, endMonth: 11, endDay: 22,
        startTime: "10:30 AM", endTime: "04:30 PM",
        venue: "Designated Examination Rooms, Academic Blocks A, B & C",
        department: "Office of Controller of Examination",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [3, 5, 7],
        registrationUrl: "https://ims.mitsgwalior.in",
        importantInstructions: "Seating chart will be posted on departmental notice boards 1 hour before examination commencement. Admit card required.",
        sourceUrl: "https://web.mitsgwalior.in/examination/notices",
        contactPerson: "Exam Cell Helpdesk",
        contactEmail: "examcell@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/mits-campus.jpg"
      },
      {
        idSuffix: "practical",
        title: "End-Semester Practical & Laboratory Examinations",
        category: "Lab & Practical",
        examType: "Practical",
        emoji: "🔬",
        subCategory: "Practical Exam",
        description: "Laboratory assessments, code demonstrations, and hardware experiment evaluations evaluated by external examiners.",
        startMonth: 12, startDay: 2, endMonth: 12, endDay: 7,
        startTime: "09:30 AM", endTime: "05:30 PM",
        venue: "Department Laboratories & Central Computing Facility (CCF)",
        department: "All Engineering Departments",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 3, 5, 7],
        registrationUrl: "",
        importantInstructions: "Students must carry signed lab manuals, practical records, and running code on institute machines.",
        sourceUrl: "https://web.mitsgwalior.in/academics/circulars",
        contactPerson: "Respective Lab In-Charge",
        contactEmail: "academics@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/robotics-innovation.webp"
      },
      {
        idSuffix: "comprehensive-viva",
        title: "Final Capstone Project Defense & Comprehensive Viva-Voce",
        category: "Lab & Practical",
        examType: "Viva",
        emoji: "🎤",
        subCategory: "Viva",
        description: "Autonomous end-semester oral examinations, comprehensive domain knowledge assessments, and major thesis presentations before external university evaluators.",
        startMonth: 12, startDay: 15, endMonth: 12, endDay: 18,
        startTime: "09:30 AM", endTime: "05:00 PM",
        venue: "Departmental Seminar Rooms & Board Rooms",
        department: "Dean Academics & Project Evaluation Committee",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [5, 7, 8],
        registrationUrl: "https://ims.mitsgwalior.in",
        importantInstructions: "Students must present printed spiral-bound project report signed by guide along with PowerPoint slides and live project demo.",
        sourceUrl: "https://web.mitsgwalior.in/examination/notices",
        contactPerson: "Prof. Project Coordinator",
        contactEmail: "projects@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/academic-presentation.webp"
      },
      {
        idSuffix: "endsem-theory",
        title: "End-Semester Autonomous Theory Examinations",
        category: "Examination",
        examType: "Major",
        emoji: "📖",
        subCategory: "Major Exam",
        description: "Major autonomous end-semester examination for odd semesters conducted under MITS Deemed-to-be University examination regulations.",
        startMonth: 12, startDay: 9, endMonth: 12, endDay: 24,
        startTime: "10:00 AM", endTime: "01:00 PM",
        venue: "Main Heritage Examination Halls & New Academic Complex",
        department: "Autonomous Examination Section",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 3, 5, 7],
        registrationUrl: "https://ims.mitsgwalior.in",
        importantInstructions: "Admit cards must be printed from IMS portal with faculty advisor counter-signature.",
        sourceUrl: "https://web.mitsgwalior.in/examination/timetable",
        contactPerson: "Controller of Examinations",
        contactEmail: "coe@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/mits-campus.jpg"
      },
      {
        idSuffix: "results",
        title: "Declaration of End-Semester Examination Results",
        category: "Examination",
        description: "Official publication of grades, SGPA scores, and grade cards on the MITS IMS Student Portal.",
        startMonth: 1, startDay: 20, endMonth: 1, endDay: 20, isNextYear: true,
        startTime: "02:00 PM", endTime: "06:00 PM",
        venue: "MITS IMS Portal (Online)",
        department: "Examination & Evaluation Cell",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 3, 5, 7],
        registrationUrl: "https://ims.mitsgwalior.in",
        importantInstructions: "Students can apply for challenge evaluation or re-totaling within 7 days of result declaration.",
        sourceUrl: "https://web.mitsgwalior.in/examination/results",
        contactPerson: "Results Section",
        contactEmail: "results@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/naac-accreditation.webp"
      },

      // --- DEADLINES & REGISTRATION CUTOFFS ---
      {
        idSuffix: "examform",
        title: "Examination Form Submission Deadline (Without Late Fee)",
        category: "Deadline",
        description: "Last date to fill out the odd-semester autonomous examination registration forms and deposit examination fees on the IMS portal.",
        startMonth: 11, startDay: 15, endMonth: 11, endDay: 15,
        startTime: "11:59 PM", endTime: "11:59 PM",
        venue: "MITS IMS Student Portal (Online)",
        department: "Student Section & Accounts Office",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 3, 5, 7],
        registrationUrl: "https://ims.mitsgwalior.in",
        importantInstructions: "Late fee of Rs. 500 will apply past this date. Clear all tuition or library dues beforehand.",
        sourceUrl: "https://web.mitsgwalior.in/notices/exam-forms",
        contactPerson: "Student Section",
        contactEmail: "studentsection@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/naac-accreditation.webp"
      },
      {
        idSuffix: "labsubmission",
        title: "Final Laboratory File & Practical Code Submission Deadline",
        category: "Deadline",
        description: "Final deadline for getting lab files, experimental calculations, and project code approved and signed by course instructors.",
        startMonth: 11, startDay: 28, endMonth: 11, endDay: 28,
        startTime: "05:00 PM", endTime: "05:00 PM",
        venue: "Respective Department Faculty Cabins",
        department: "All Engineering Departments",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 3, 5, 7],
        registrationUrl: "",
        importantInstructions: "Unsigned practical files will result in internal assessment deduction.",
        sourceUrl: "https://web.mitsgwalior.in/academics/circulars",
        contactPerson: "Head of Departments",
        contactEmail: "academics@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/robotics-innovation.webp"
      },
      {
        idSuffix: "feedback",
        title: "Student Feedback & Faculty Evaluation Survey Deadline",
        category: "Deadline",
        description: "Mandatory confidential online feedback on teaching learning process, course outcomes, and lab infrastructure for hall ticket generation.",
        startMonth: 11, startDay: 25, endMonth: 11, endDay: 25,
        startTime: "11:59 PM", endTime: "11:59 PM",
        venue: "MITS IMS Portal",
        department: "Internal Quality Assurance Cell (IQAC)",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 3, 5, 7],
        registrationUrl: "https://ims.mitsgwalior.in",
        importantInstructions: "Mandatory requirement to download End-Sem Exam Admit Card.",
        sourceUrl: "https://web.mitsgwalior.in/iqac",
        contactPerson: "IQAC Coordinator",
        contactEmail: "iqac@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/naac-accreditation.webp"
      },

      // --- FESTIVALS, HACKATHONS & CULTURAL ---
      {
        idSuffix: "sih",
        title: "Smart India Hackathon (SIH) - Internal College Hackathon",
        category: "Workshop & Seminar",
        description: "24-hour hackathon to shortlist top MITS student teams representing the institute in AI, Smart Automation, and CleanTech problem statements.",
        startMonth: 9, startDay: 19, endMonth: 9, endDay: 20,
        startTime: "09:00 AM", endTime: "12:00 PM",
        venue: "Central Computing Facility (CCF) Labs 1 & 2",
        department: "Institution's Innovation Council (IIC - MITS)",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        registrationUrl: "https://sih.gov.in",
        importantInstructions: "Teams must comprise exactly 6 students with at least 1 female teammate as per SIH guidelines.",
        sourceUrl: "https://web.mitsgwalior.in/innovation/sih",
        contactPerson: "Dr. C. S. Malvi (SPOC SIH)",
        contactEmail: "iic@mitsgwalior.in",
        status: "Completed",
        isOfficial: true,
        image: "assets/images/g20-innovation.webp"
      },
      {
        idSuffix: "spardha",
        title: "Spardha - Annual Inter-Departmental Sports Meet",
        category: "Cultural & Sports",
        description: "Annual multi-sport tournament featuring Cricket, Football, Basketball, Volleyball, Chess, Badminton, and Athletic Track & Field events.",
        startMonth: 2, startDay: 3, endMonth: 2, endDay: 8, isNextYear: true,
        startTime: "08:00 AM", endTime: "06:00 PM",
        venue: "MITS Sports Complex & Cricket Ground",
        department: "Department of Physical Education & Sports",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        registrationUrl: "https://web.mitsgwalior.in/sports",
        importantInstructions: "Departmental team rosters must be endorsed by the respective HOD.",
        sourceUrl: "https://web.mitsgwalior.in/sports",
        contactPerson: "Sports Officer",
        contactEmail: "sports@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/campus-event.webp"
      },
      {
        idSuffix: "aura",
        title: "Aura / Technovision - National Technical Symposium",
        category: "Workshop & Seminar",
        description: "Central India's leading national technical fest featuring RoboWars, Drone Racing, Bridge-o-Mania, Coding Competitions, and Paper Presentations.",
        startMonth: 2, startDay: 21, endMonth: 2, endDay: 23, isNextYear: true,
        startTime: "09:30 AM", endTime: "06:00 PM",
        venue: "Main Auditorium, Mechanical Workshop & Quadrangle",
        department: "Technical Club Consortium & ISTE Student Chapter",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        registrationUrl: "https://techno.mitsgwalior.in",
        importantInstructions: "Cash prizes up to ₹1,50,000 for winning teams. Certificates for all paper presenters.",
        sourceUrl: "https://web.mitsgwalior.in/technical-fest",
        contactPerson: "Technical Fest Faculty Advisor",
        contactEmail: "techfest@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/robotics-innovation.webp"
      },
      {
        idSuffix: "dyuti",
        title: "Dyuti / Jhankaar - Annual National Cultural Fest",
        category: "Cultural & Sports",
        description: "MITS Gwalior's iconic 3-day cultural extravaganza with Battle of the Bands, Street Play (Nukkad Natak), Dance Battles, and Celebrity Star Night.",
        startMonth: 3, startDay: 6, endMonth: 3, endDay: 8, isNextYear: true,
        startTime: "10:00 AM", endTime: "10:00 PM",
        venue: "MITS Open Air Theatre & Central Lawn",
        department: "Student Activity Center (SAC) & Cultural Committee",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        registrationUrl: "https://dyuti.mitsgwalior.in",
        importantInstructions: "Strictly limited to college students with valid MITS ID cards or registered event passes.",
        sourceUrl: "https://web.mitsgwalior.in/student-life/cultural",
        contactPerson: "Cultural Committee Convener",
        contactEmail: "cultural@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/campus-event.webp"
      },

      // --- CLUBS, WORKSHOPS & CAREER DRIVES ---
      {
        idSuffix: "ieee-workshop",
        title: "IEEE MITS Student Branch - Emerging Trends in AI & Quantum Computing",
        category: "Workshop & Seminar",
        description: "Hands-on expert workshop on Quantum Cryptography, Qiskit SDK, and Neural Network acceleration by industry researchers.",
        startMonth: 11, startDay: 9, endMonth: 11, endDay: 9,
        startTime: "11:00 AM", endTime: "03:00 PM",
        venue: "Seminar Hall 1, Administrative Block",
        department: "IEEE Student Branch (STB 62451)",
        eligibleBranches: ["CSE", "IT", "AI-DS", "ECE", "EE"],
        eligibleSemesters: [3, 4, 5, 6, 7, 8],
        registrationUrl: "https://ieee.mitsgwalior.in/events",
        importantInstructions: "Laptops required with Python 3.10+ pre-installed. IEEE members get free participation kit.",
        sourceUrl: "https://web.mitsgwalior.in/ieee",
        contactPerson: "Branch Counselor, IEEE MITS",
        contactEmail: "ieee@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/academic-presentation.webp"
      },
      {
        idSuffix: "asce-truss",
        title: "ASCE Student Chapter - Bridge-It: Truss Design Challenge",
        category: "Club Activity",
        description: "Practical engineering truss design competition testing maximum load-to-weight ratio of bridge models constructed with structural wood.",
        startMonth: 11, startDay: 16, endMonth: 11, endDay: 16,
        startTime: "10:30 AM", endTime: "04:00 PM",
        venue: "Civil Engineering Structures Laboratory",
        department: "Civil Engineering Department & ASCE Chapter",
        eligibleBranches: ["CE", "ME"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6],
        registrationUrl: "https://asce.mitsgwalior.in",
        importantInstructions: "All materials will be provided on-site. Max 3 members per team.",
        sourceUrl: "https://web.mitsgwalior.in/departments/civil",
        contactPerson: "Faculty Advisor, ASCE",
        contactEmail: "asce@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/g20-innovation.webp"
      },
      {
        idSuffix: "skillsphere",
        title: "SkillSphere Club Recruitment & Interview Rounds",
        category: "Club Activity",
        description: "Annual club recruitment drive for Technical, Web Dev, UI/UX Design, Corporate Relations, and Media wings.",
        startMonth: 9, startDay: 22, endMonth: 9, endDay: 22,
        startTime: "10:00 AM", endTime: "05:00 PM",
        venue: "Classroom Block B, Rooms 204 & 205",
        department: "SkillSphere Technical Club",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3],
        registrationUrl: "https://skillsphere.mitsgwl.ac.in",
        importantInstructions: "Bring printed resume and links to portfolio/GitHub projects.",
        sourceUrl: "https://web.mitsgwalior.in/clubs",
        contactPerson: "Club President",
        contactEmail: "skillsphere@mitsgwl.ac.in",
        status: "Completed",
        isOfficial: true,
        image: "assets/images/g20-innovation.webp"
      },
      {
        idSuffix: "tcs-nqt",
        title: "TCS National Qualifier Test (NQT) - On-Campus Placement Drive",
        category: "Placement & Career",
        description: "Recruitment drive by Tata Consultancy Services (TCS) for Ninja and Digital developer roles for final year engineering students.",
        startMonth: 10, startDay: 18, endMonth: 10, endDay: 19,
        startTime: "09:00 AM", endTime: "06:00 PM",
        venue: "Central Computing Facility & T&P Interview Suites",
        department: "Training & Placement Cell (T&P)",
        eligibleBranches: ["CSE", "IT", "AI-DS", "ECE", "EE", "ME", "CE"],
        eligibleSemesters: [7, 8],
        registrationUrl: "https://nextstep.tcs.com",
        importantInstructions: "Formal dress code compulsory. Carry 2 copies of resume, marksheets, and college ID.",
        sourceUrl: "https://web.mitsgwalior.in/placement",
        contactPerson: "Prof. Vikram Rajpoot (Head T&P)",
        contactEmail: "tnp@mitsgwalior.in",
        status: "Completed",
        isOfficial: true,
        image: "assets/images/naac-accreditation.webp"
      },
      {
        idSuffix: "ltts-drive",
        title: "L&T Technology Services (LTTS) Core Engineering Drive",
        category: "Placement & Career",
        description: "Graduate Engineer Trainee (GET) recruitment drive featuring online aptitude test followed by technical & HR panel interviews.",
        startMonth: 11, startDay: 20, endMonth: 11, endDay: 20,
        startTime: "09:30 AM", endTime: "05:30 PM",
        venue: "Seminar Hall 2 & Conference Room",
        department: "Training & Placement Cell",
        eligibleBranches: ["EE", "ECE", "ME", "CE"],
        eligibleSemesters: [7, 8],
        registrationUrl: "https://web.mitsgwalior.in/placement/portal",
        importantInstructions: "Eligible students must be pre-registered on MITS T&P database with no standing backlogs.",
        sourceUrl: "https://web.mitsgwalior.in/placement",
        contactPerson: "Placement Officer",
        contactEmail: "placement@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/naac-accreditation.webp"
      },
      {
        idSuffix: "gate-workshop",
        title: "GATE Strategy & PSU Roadmap Guidance Session",
        category: "Workshop & Seminar",
        description: "Comprehensive strategy workshop on GATE syllabus analysis, time management, mock tests, and PSU recruitment procedures.",
        startMonth: 11, startDay: 30, endMonth: 11, endDay: 30,
        startTime: "02:30 PM", endTime: "05:00 PM",
        venue: "Main Auditorium",
        department: "Higher Education Guidance Cell",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [3, 4, 5, 6],
        registrationUrl: "https://web.mitsgwalior.in/hegc",
        importantInstructions: "Open to all 2nd and 3rd year students. Free admission.",
        sourceUrl: "https://web.mitsgwalior.in/academics/hegc",
        contactPerson: "Dr. R. K. Pandit",
        contactEmail: "gatecell@mitsgwalior.in",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/academic-presentation.webp"
      },
      {
        idSuffix: "ngc-drive",
        title: "Nature Green Club & NSS - Clean Campus & Plantation Drive",
        category: "Club Activity",
        description: "Tree plantation initiative and campus-wide plastic cleanup drive organized on the occasion of Gandhi Jayanti.",
        startMonth: 10, startDay: 2, endMonth: 10, endDay: 2,
        startTime: "08:30 AM", endTime: "12:00 PM",
        venue: "MITS Botanical Garden & Central Quadrangle",
        department: "Nature Green Club & NSS Unit",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        registrationUrl: "",
        importantInstructions: "NSS volunteers will receive 5 activity credits.",
        sourceUrl: "https://web.mitsgwalior.in/nss",
        contactPerson: "NSS Coordinator",
        contactEmail: "nss@mitsgwalior.in",
        status: "Completed",
        isOfficial: true,
        image: "assets/images/g20-innovation.webp"
      },

      // --- ACADEMIC & GAZETTED HOLIDAYS ---
      {
        idSuffix: "indep-day",
        title: "Independence Day",
        category: "Holiday",
        description: "National Holiday. Flag hoisting ceremony at 08:30 AM on MITS Main Lawn followed by address by Director.",
        startMonth: 8, startDay: 15, endMonth: 8, endDay: 15,
        startTime: "08:30 AM", endTime: "11:00 AM",
        venue: "MITS Heritage Lawn",
        department: "General Administration",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        sourceUrl: "https://web.mitsgwalior.in/calendar",
        status: "Completed",
        isOfficial: true,
        image: "assets/images/mits-campus.jpg"
      },
      {
        idSuffix: "gandhi-jayanti",
        title: "Mahatma Gandhi Jayanti",
        category: "Holiday",
        description: "National Holiday observed in honor of the Father of the Nation. College offices and classrooms remain closed.",
        startMonth: 10, startDay: 2, endMonth: 10, endDay: 2,
        startTime: "All Day", endTime: "All Day",
        venue: "Campus-wide",
        department: "Registrar Office",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        sourceUrl: "https://web.mitsgwalior.in/calendar",
        status: "Completed",
        isOfficial: true,
        image: "assets/images/mits-campus.jpg"
      },
      {
        idSuffix: "dussehra",
        title: "Dussehra (Vijayadashami) Holiday",
        category: "Holiday",
        description: "Gazetted Festival Holiday. Institute and academic departments remain closed.",
        startMonth: 10, startDay: 12, endMonth: 10, endDay: 12,
        startTime: "All Day", endTime: "All Day",
        venue: "Campus-wide",
        department: "Registrar Office",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        sourceUrl: "https://web.mitsgwalior.in/calendar",
        status: "Completed",
        isOfficial: true,
        image: "assets/images/campus-event.webp"
      },
      {
        idSuffix: "diwali",
        title: "Diwali Vacation & Mid-Semester Festival Break",
        category: "Holiday",
        description: "Official festival vacation for Deepawali, Govardhan Pooja, and Bhai Dooj. Classes remain suspended.",
        startMonth: 10, startDay: 31, endMonth: 11, endDay: 3,
        startTime: "All Day", endTime: "All Day",
        venue: "Campus-wide",
        department: "MITS Administration",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        sourceUrl: "https://web.mitsgwalior.in/calendar",
        status: "Completed",
        isOfficial: true,
        image: "assets/images/campus-event.webp"
      },
      {
        idSuffix: "gurunanak",
        title: "Guru Nanak Jayanti",
        category: "Holiday",
        description: "Gazetted Public Holiday. Academic activities remain suspended.",
        startMonth: 11, startDay: 15, endMonth: 11, endDay: 15,
        startTime: "All Day", endTime: "All Day",
        venue: "Campus-wide",
        department: "Registrar Office",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        sourceUrl: "https://web.mitsgwalior.in/calendar",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/campus-event.webp"
      },
      {
        idSuffix: "christmas",
        title: "Christmas Day",
        category: "Holiday",
        description: "Gazetted Festival Holiday observed across the institution.",
        startMonth: 12, startDay: 25, endMonth: 12, endDay: 25,
        startTime: "All Day", endTime: "All Day",
        venue: "Campus-wide",
        department: "Registrar Office",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        sourceUrl: "https://web.mitsgwalior.in/calendar",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/campus-event.webp"
      },
      {
        idSuffix: "winterbreak",
        title: "Winter Vacation & Semester Break",
        category: "Holiday",
        description: "Annual winter inter-semester vacation for students following the conclusion of autonomous end-semester theory examinations.",
        startMonth: 12, startDay: 26, endMonth: 1, endDay: 5, isNextYear: true,
        startTime: "All Day", endTime: "All Day",
        venue: "Campus-wide",
        department: "Dean Academics Office",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        sourceUrl: "https://web.mitsgwalior.in/academic-calendar",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/mits-campus.jpg"
      },
      {
        idSuffix: "republicday",
        title: "Republic Day",
        category: "Holiday",
        description: "National Holiday. Ceremonial parade and Tricolour flag hoisting at MITS Campus ground at 08:30 AM.",
        startMonth: 1, startDay: 26, endMonth: 1, endDay: 26, isNextYear: true,
        startTime: "08:30 AM", endTime: "11:00 AM",
        venue: "MITS Heritage Quadrangle",
        department: "MITS Administration & NCC Cadets",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        sourceUrl: "https://web.mitsgwalior.in/calendar",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/mits-campus.jpg"
      },
      {
        idSuffix: "mahashivratri",
        title: "Maha Shivratri",
        category: "Holiday",
        description: "Gazetted Festival Holiday. Institute and academic departments remain closed.",
        startMonth: 2, startDay: 26, endMonth: 2, endDay: 26, isNextYear: true,
        startTime: "All Day", endTime: "All Day",
        venue: "Campus-wide",
        department: "Registrar Office",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        sourceUrl: "https://web.mitsgwalior.in/calendar",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/campus-event.webp"
      },
      {
        idSuffix: "holi",
        title: "Holi & Dhulandi Festival Holidays",
        category: "Holiday",
        description: "Festival holidays on the joyous occasion of Holika Dahan and Dhulandi.",
        startMonth: 3, startDay: 14, endMonth: 3, endDay: 15, isNextYear: true,
        startTime: "All Day", endTime: "All Day",
        venue: "Campus-wide",
        department: "Registrar Office",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        sourceUrl: "https://web.mitsgwalior.in/calendar",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/campus-event.webp"
      },
      {
        idSuffix: "ambedkar",
        title: "Dr. B. R. Ambedkar Jayanti",
        category: "Holiday",
        description: "National Holiday observed in remembrance of Babasaheb Dr. B. R. Ambedkar.",
        startMonth: 4, startDay: 14, endMonth: 4, endDay: 14, isNextYear: true,
        startTime: "All Day", endTime: "All Day",
        venue: "Campus-wide",
        department: "Registrar Office",
        eligibleBranches: ["ALL"],
        eligibleSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        sourceUrl: "https://web.mitsgwalior.in/calendar",
        status: "Scheduled",
        isOfficial: true,
        image: "assets/images/mits-campus.jpg"
      }
    ];

    const results = [];

    // Helper to generate entries for a given academic year
    function generateYearEvents(targetYear, acadYearLabel) {
      baseEvents.forEach(b => {
        const sYear = b.isNextYear ? targetYear + 1 : targetYear;
        const eYear = b.isNextYear ? targetYear + 1 : targetYear;
        const sDate = mkDate(sYear, b.startMonth, b.startDay);
        const eDate = mkDate(eYear, b.endMonth, b.endDay);
        const isPast = new Date(sDate) < new Date();

        results.push({
          _id: `mits-${targetYear}-${b.idSuffix}`,
          title: b.title,
          category: b.category,
          description: b.description,
          startDate: sDate,
          endDate: eDate,
          startTime: b.startTime,
          endTime: b.endTime,
          venue: b.venue,
          department: b.department,
          eligibleBranches: b.eligibleBranches,
          eligibleSemesters: b.eligibleSemesters,
          registrationUrl: b.registrationUrl || "",
          importantInstructions: b.importantInstructions || "",
          sourceUrl: b.sourceUrl,
          contactPerson: b.contactPerson || "",
          contactEmail: b.contactEmail || "",
          status: isPast ? "Completed" : b.status,
          academicYear: acadYearLabel,
          isOfficial: true,
          image: b.image || CATEGORY_CONFIG[b.category]?.defaultImage || "assets/images/mits-campus.jpg"
        });
      });
    }

    // Generate for current active session (2026-2027)
    generateYearEvents(curYear, `${curYear}-${curYear + 1}`);
    // Generate for previous session (2025-2026)
    generateYearEvents(curYear - 1, `${curYear - 1}-${curYear}`);
    // Generate for 2024-2025 archive
    generateYearEvents(2024, "2024-2025");

    return results;
  }

  // ================= 2. DATA FETCHING & SYNCHRONIZATION =================
  async function resolveApiBase() {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 1200);
        const res = await fetch("http://localhost:5000/api-status", { signal: controller.signal });
        clearTimeout(tid);
        if (res.ok) return "http://localhost:5000/api";
      } catch (e) {}
    }
    return "https://campus-connect-1q2c.onrender.com/api";
  }

  async function loadEventsData() {
    state.apiBase = await resolveApiBase();
    let eventsList = [];

    try {
      const response = await fetch(`${state.apiBase}/events`);
      if (response.ok) {
        eventsList = await response.json();
      }
    } catch (err) {
      console.warn("Backend API not reachable, loading verified offline archive:", err);
    }

    // Merge or fallback to verified archive if backend returns empty or failed
    if (!eventsList || eventsList.length === 0) {
      eventsList = getFallbackEventsArchive();
    } else {
      const fallback = getFallbackEventsArchive();
      const existingTitles = new Set(eventsList.map(e => `${e.title.trim().toLowerCase()}_${new Date(e.startDate).getFullYear()}`));
      for (const item of fallback) {
        const key = `${item.title.trim().toLowerCase()}_${new Date(item.startDate).getFullYear()}`;
        if (!existingTitles.has(key)) {
          eventsList.push(item);
        }
      }
    }

    // Normalize dates and images
    state.events = eventsList.map((e, idx) => {
      const s = new Date(e.startDate);
      const end = e.endDate ? new Date(e.endDate) : s;
      const cat = e.category || "General";
      const catCfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["General"];

      return {
        ...e,
        _id: e._id || `evt-${idx}-${Date.now()}`,
        startDateObj: s,
        endDateObj: end,
        category: cat,
        examType: e.examType || "None",
        subCategory: e.subCategory || "",
        emoji: e.emoji || "",
        isOfficial: e.isOfficial !== undefined ? Boolean(e.isOfficial) : true,
        createdByName: e.createdByName || "",
        createdByRole: e.createdByRole || "Admin",
        academicYear: e.academicYear || (s.getFullYear() >= 2026 ? "2026-2027" : "2024-2025"),
        image: e.image || e.imageUrl || catCfg.defaultImage || "assets/images/mits-campus.jpg"
      };
    });

    updateCategoryCounts();
    updateEmojiCounts();
    updatePersonalizedUi();
    applyFilters();
    initCountdowns();
    renderHighlights();
    initExamFinder();
  }

  // ================= 3. FILTERING & SEARCH LOGIC =================
  function applyFilters() {
    let result = [...state.events];

    // Academic Year filter
    if (state.selectedAcademicYear !== "all") {
      result = result.filter(e => e.academicYear === state.selectedAcademicYear);
    }

    // Category filter
    if (state.selectedCategory !== "all") {
      result = result.filter(e => e.category === state.selectedCategory);
    }

    // Emoji Indicator Filter (🎉 🇮🇳 🪔 📝 📖 🔬 🎤 🎓 💻)
    if (state.selectedEmojiFilter && state.selectedEmojiFilter !== "all") {
      result = result.filter(e => getEventEmoji(e) === state.selectedEmojiFilter);
    }

    // Event Source Filter (Official vs Student)
    if (state.selectedSourceFilter === "official") {
      result = result.filter(e => e.isOfficial !== false);
    } else if (state.selectedSourceFilter === "student") {
      result = result.filter(e => e.isOfficial === false);
    }

    // Personalized Calendar Filter
    if (state.isPersonalizedActive && currentUser) {
      if (currentUser.branch && currentUser.branch !== "all") {
        result = result.filter(e => !e.eligibleBranches || e.eligibleBranches.length === 0 || e.eligibleBranches.includes("ALL") || e.eligibleBranches.includes(currentUser.branch));
      }
      if (currentUser.semester) {
        const semNum = Number(currentUser.semester);
        result = result.filter(e => !e.eligibleSemesters || e.eligibleSemesters.length === 0 || e.eligibleSemesters.includes(semNum));
      }
    }

    // Branch filter
    if (state.selectedBranch !== "all") {
      result = result.filter(e => {
        if (!e.eligibleBranches || e.eligibleBranches.length === 0) return true;
        return e.eligibleBranches.includes("ALL") || e.eligibleBranches.includes(state.selectedBranch);
      });
    }

    // Semester filter
    if (state.selectedSemester !== "all") {
      const semNum = Number(state.selectedSemester);
      result = result.filter(e => {
        if (!e.eligibleSemesters || e.eligibleSemesters.length === 0) return true;
        return e.eligibleSemesters.includes(semNum);
      });
    }

    // Status filter
    if (state.selectedStatus !== "all") {
      result = result.filter(e => e.status === state.selectedStatus);
    }

    // Search query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      result = result.filter(e => {
        const title = (e.title || "").toLowerCase();
        const desc = (e.description || "").toLowerCase();
        const venue = (e.venue || "").toLowerCase();
        const dept = (e.department || "").toLowerCase();
        const person = (e.contactPerson || "").toLowerCase();
        return title.includes(q) || desc.includes(q) || venue.includes(q) || dept.includes(q) || person.includes(q);
      });
    }

    // Saved only filter
    if (state.showSavedOnly) {
      result = result.filter(e => state.savedEventIds.has(e._id));
    }

    state.filteredEvents = result;

    updateActiveFilterIndicators();
    renderCalendar();
    renderHighlights();
  }

  function updateCategoryCounts() {
    const counts = {
      all: state.events.length,
      Examination: 0,
      Holiday: 0,
      "Lab & Practical": 0,
      "Club Activity": 0,
      "Workshop & Seminar": 0,
      "Placement & Career": 0,
      Deadline: 0,
      "Cultural & Sports": 0
    };

    state.events.forEach(e => {
      if (counts[e.category] !== undefined) {
        counts[e.category]++;
      }
    });

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl("countCatAll", counts.all);
    setEl("countCatExam", counts.Examination);
    setEl("countCatHoliday", counts.Holiday);
    setEl("countCatLab", counts["Lab & Practical"]);
    setEl("countCatClub", counts["Club Activity"]);
    setEl("countCatWorkshop", counts["Workshop & Seminar"]);
    setEl("countCatPlacement", counts["Placement & Career"]);
    setEl("countCatDeadline", counts.Deadline);
    setEl("countCatCultural", counts["Cultural & Sports"]);

    if (DOM.totalEventsCount) DOM.totalEventsCount.textContent = `${state.events.length}+`;
    if (DOM.savedFilterLabel) DOM.savedFilterLabel.textContent = `Saved Events (${state.savedEventIds.size})`;
  }

  function updateEmojiCounts() {
    const counts = {
      all: state.events.length,
      "🎉": 0,
      "🇮🇳": 0,
      "🪔": 0,
      "📝": 0,
      "📖": 0,
      "🔬": 0,
      "🎤": 0,
      "🎓": 0,
      "💻": 0
    };

    state.events.forEach(e => {
      const em = getEventEmoji(e);
      if (counts[em] !== undefined) {
        counts[em]++;
      }
    });

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl("countEmojiAll", counts.all);
    setEl("countEmojiGenHoliday", counts["🎉"]);
    setEl("countEmojiNatHoliday", counts["🇮🇳"]);
    setEl("countEmojiFestival", counts["🪔"]);
    setEl("countEmojiMinorExam", counts["📝"]);
    setEl("countEmojiMajorExam", counts["📖"]);
    setEl("countEmojiPractical", counts["🔬"]);
    setEl("countEmojiViva", counts["🎤"]);
    setEl("countEmojiCollege", counts["🎓"]);
    setEl("countEmojiHackathon", counts["💻"]);
  }

  function updatePersonalizedUi() {
    if (!DOM.personalizedScheduleBtn) return;
    if (currentUser && (currentUser.branch || currentUser.semester)) {
      const b = currentUser.branch || "";
      const s = currentUser.semester ? `Sem ${currentUser.semester}` : "";
      if (DOM.personalizedScheduleLabel) {
        DOM.personalizedScheduleLabel.textContent = `(${b} ${s})`.trim();
      }
    } else {
      if (DOM.personalizedScheduleLabel) {
        DOM.personalizedScheduleLabel.textContent = "";
      }
    }
  }

  function updateActiveFilterIndicators() {
    if (!DOM.activeFilterIndicators || !DOM.filterTagsList) return;

    const tags = [];
    if (state.selectedAcademicYear !== "all") {
      tags.push({ key: "academicYear", label: `Session: ${state.selectedAcademicYear}` });
    }
    if (state.selectedCategory !== "all") {
      tags.push({ key: "category", label: `Category: ${state.selectedCategory}` });
    }
    if (state.selectedBranch !== "all") {
      tags.push({ key: "branch", label: `Branch: ${state.selectedBranch}` });
    }
    if (state.selectedSemester !== "all") {
      tags.push({ key: "semester", label: `Semester: ${state.selectedSemester}` });
    }
    if (state.selectedStatus !== "all") {
      tags.push({ key: "status", label: `Status: ${state.selectedStatus}` });
    }
    if (state.searchQuery.trim()) {
      tags.push({ key: "search", label: `Search: "${state.searchQuery}"` });
    }
    if (state.selectedEmojiFilter && state.selectedEmojiFilter !== "all") {
      tags.push({ key: "emoji", label: `Indicator: ${state.selectedEmojiFilter}` });
    }
    if (state.selectedSourceFilter && state.selectedSourceFilter !== "all") {
      tags.push({ key: "source", label: state.selectedSourceFilter === "official" ? "🏛️ Official Only" : "👥 Student Events" });
    }
    if (state.isPersonalizedActive) {
      tags.push({ key: "personalized", label: `🎯 My Schedule (${currentUser?.branch || "MITS"})` });
    }
    if (state.showSavedOnly) {
      tags.push({ key: "saved", label: "★ Saved Events Only" });
    }

    if (tags.length === 0) {
      DOM.activeFilterIndicators.style.display = "none";
      DOM.filterTagsList.innerHTML = "";
    } else {
      DOM.activeFilterIndicators.style.display = "flex";
      DOM.filterTagsList.innerHTML = tags.map(t => `
        <span class="filter-tag-chip">
          <span>${escapeHtml(t.label)}</span>
          <button class="remove-tag-btn" data-key="${t.key}" aria-label="Remove filter">&times;</button>
        </span>
      `).join("");

      DOM.filterTagsList.querySelectorAll(".remove-tag-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.key;
          if (key === "academicYear") {
            state.selectedAcademicYear = "all";
            DOM.academicYearFilterSelect.value = "all";
          } else if (key === "category") {
            state.selectedCategory = "all";
            DOM.categoryPills.forEach(p => p.classList.toggle("active", p.dataset.category === "all"));
          } else if (key === "emoji") {
            state.selectedEmojiFilter = "all";
            if (DOM.emojiLegendStrip) {
              DOM.emojiLegendStrip.querySelectorAll(".legend-emoji-pill").forEach(p => p.classList.toggle("active", p.dataset.emojiFilter === "all"));
            }
          } else if (key === "source") {
            state.selectedSourceFilter = "all";
            if (DOM.eventSourceToggleGroup) {
              DOM.eventSourceToggleGroup.querySelectorAll(".source-toggle-btn").forEach(b => b.classList.toggle("active", b.dataset.source === "all"));
            }
          } else if (key === "personalized") {
            state.isPersonalizedActive = false;
            if (DOM.personalizedScheduleBtn) DOM.personalizedScheduleBtn.classList.remove("active");
          } else if (key === "branch") {
            state.selectedBranch = "all";
            DOM.branchFilterSelect.value = "all";
          } else if (key === "semester") {
            state.selectedSemester = "all";
            DOM.semesterFilterSelect.value = "all";
          } else if (key === "status") {
            state.selectedStatus = "all";
            DOM.statusFilterSelect.value = "all";
          } else if (key === "search") {
            state.searchQuery = "";
            DOM.eventSearchInput.value = "";
            DOM.clearSearchBtn.style.display = "none";
          } else if (key === "saved") {
            state.showSavedOnly = false;
            DOM.toggleSavedFilterBtn.classList.remove("active");
          }
          applyFilters();
        });
      });
    }
  }

  // ================= 4. CALENDAR RENDERING ENGINE =================
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();

    if (DOM.calendarPeriodTitle) {
      if (state.viewMode === "year") {
        DOM.calendarPeriodTitle.textContent = `Academic Year ${year}`;
      } else if (state.viewMode === "week") {
        const startOfWeek = getStartOfWeek(state.currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        DOM.calendarPeriodTitle.textContent = `${startOfWeek.getDate()} ${MONTH_NAMES[startOfWeek.getMonth()].slice(0, 3)} - ${endOfWeek.getDate()} ${MONTH_NAMES[endOfWeek.getMonth()].slice(0, 3)} ${year}`;
      } else if (state.viewMode === "cards") {
        DOM.calendarPeriodTitle.textContent = `All Event Cards (${state.filteredEvents.length})`;
      } else if (state.viewMode === "directory") {
        DOM.calendarPeriodTitle.textContent = `Directory Table (${state.filteredEvents.length})`;
      } else {
        DOM.calendarPeriodTitle.textContent = `${MONTH_NAMES[month]} ${year}`;
      }
    }

    // Toggle view containers
    if (DOM.monthViewContainer) DOM.monthViewContainer.style.display = state.viewMode === "month" ? "block" : "none";
    if (DOM.weekViewContainer) DOM.weekViewContainer.style.display = state.viewMode === "week" ? "block" : "none";
    if (DOM.yearViewContainer) DOM.yearViewContainer.style.display = state.viewMode === "year" ? "block" : "none";
    if (DOM.cardsViewContainer) DOM.cardsViewContainer.style.display = state.viewMode === "cards" ? "block" : "none";
    if (DOM.directoryViewContainer) DOM.directoryViewContainer.style.display = state.viewMode === "directory" ? "block" : "none";

    // Update active view buttons
    [DOM.viewMonthBtn, DOM.viewWeekBtn, DOM.viewYearBtn, DOM.viewCardsBtn, DOM.viewDirectoryBtn].forEach(btn => {
      if (btn) btn.classList.toggle("active", btn.dataset.view === state.viewMode);
    });

    if (state.viewMode === "month") {
      renderMonthView(year, month);
    } else if (state.viewMode === "week") {
      renderWeekView();
    } else if (state.viewMode === "year") {
      renderYearView(year);
    } else if (state.viewMode === "cards") {
      renderCardsView();
    } else if (state.viewMode === "directory") {
      renderDirectoryTableView();
    }
  }

  // --- A. Month View (7x6 42-cell Grid) ---
  function renderMonthView(year, month) {
    if (!DOM.monthGrid) return;
    DOM.monthGrid.innerHTML = "";

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonthYear = today.getFullYear() === year && today.getMonth() === month;
    const todayDateNum = isCurrentMonthYear ? today.getDate() : -1;

    let thisMonthEventsCount = 0;

    for (let i = 0; i < 42; i++) {
      const cell = document.createElement("div");
      cell.className = "calendar-day-cell";

      let cellDate;
      let dayNumber;
      let isCurrentMonth = true;

      if (i < firstDayIndex) {
        dayNumber = prevMonthDays - firstDayIndex + i + 1;
        cellDate = new Date(year, month - 1, dayNumber);
        cell.classList.add("other-month");
        isCurrentMonth = false;
      } else if (i >= firstDayIndex + totalDaysInMonth) {
        dayNumber = i - (firstDayIndex + totalDaysInMonth) + 1;
        cellDate = new Date(year, month + 1, dayNumber);
        cell.classList.add("other-month");
        isCurrentMonth = false;
      } else {
        dayNumber = i - firstDayIndex + 1;
        cellDate = new Date(year, month, dayNumber);
      }

      if (isCurrentMonth && dayNumber === todayDateNum) {
        cell.classList.add("is-today");
      }

      const colIndex = i % 7;
      if (colIndex === 0 || colIndex === 6) {
        cell.classList.add("is-weekend");
      }

      const dayEvents = getEventsForDate(cellDate);
      if (isCurrentMonth) {
        thisMonthEventsCount += dayEvents.length;
      }

      // Event dots & pills
      let eventsHtml = "";
      const maxDisplayPills = 3;
      const visibleEvents = dayEvents.slice(0, maxDisplayPills);
      const overflowCount = dayEvents.length - maxDisplayPills;

      visibleEvents.forEach(e => {
        const catConfig = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG["General"];
        const emoji = getEventEmoji(e);
        eventsHtml += `
          <div class="cal-event-pill" style="border-left: 3px solid ${catConfig.color}; background: ${catConfig.bg};" title="${escapeHtml(e.title)} (${e.category})">
            <span class="pill-dot" style="background: ${catConfig.color}"></span>
            <span class="pill-text">${emoji} ${escapeHtml(e.title)}</span>
          </div>
        `;
      });

      if (overflowCount > 0) {
        eventsHtml += `
          <div class="cal-event-overflow">+${overflowCount} more</div>
        `;
      }

      // Event dots for mobile / density bar
      let dotsHtml = "";
      if (dayEvents.length > 0) {
        dotsHtml = `
          <div class="day-dot-strip">
            ${dayEvents.slice(0, 5).map(e => {
              const cfg = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG["General"];
              return `<span class="indicator-dot" style="background: ${cfg.color};" title="${escapeHtml(e.category)}"></span>`;
            }).join("")}
          </div>
        `;
      }

      cell.innerHTML = `
        <div class="cell-top-bar">
          <span class="day-number">${dayNumber}</span>
          ${isCurrentMonth && dayNumber === todayDateNum ? `<span class="today-indicator-chip">TODAY</span>` : ""}
          ${dayEvents.length > 0 ? `<span class="day-event-count" title="${dayEvents.length} events">${dayEvents.length}</span>` : ""}
        </div>
        ${dotsHtml}
        <div class="cell-events-wrapper">
          ${eventsHtml}
        </div>
      `;

      cell.addEventListener("click", () => {
        openDateDetailsModal(cellDate, dayEvents);
      });

      DOM.monthGrid.appendChild(cell);
    }

    if (DOM.thisMonthCount) {
      DOM.thisMonthCount.textContent = `${thisMonthEventsCount}`;
    }
  }

  // --- B. Week View (7 Day Schedule Breakdown) ---
  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function renderWeekView() {
    if (!DOM.weekGrid) return;
    DOM.weekGrid.innerHTML = "";

    const startOfWeek = getStartOfWeek(state.currentDate);
    const today = new Date();

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + dayOffset);

      const isToday = currentDay.toDateString() === today.toDateString();
      const dayEvents = getEventsForDate(currentDay);

      const col = document.createElement("div");
      col.className = `week-day-col ${isToday ? "week-day-today" : ""}`;

      let eventsHtml = "";
      if (dayEvents.length === 0) {
        eventsHtml = `<div class="week-empty-slot">No academic events scheduled</div>`;
      } else {
        eventsHtml = dayEvents.map(e => {
          const cfg = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG["General"];
          const isSaved = state.savedEventIds.has(e._id);
          return `
            <div class="week-event-card" style="border-left: 3px solid ${cfg.color};" data-id="${e._id}">
              <div class="we-header">
                <span class="we-category-pill" style="color: ${cfg.color}; background: ${cfg.bg};">${cfg.icon} ${escapeHtml(e.category)}</span>
                <span class="we-time">${escapeHtml(e.startTime || "10:00 AM")}</span>
              </div>
              <h4 class="we-title">${escapeHtml(e.title)}</h4>
              <div class="we-venue">📍 ${escapeHtml(e.venue || "MITS Campus")}</div>
              <div class="we-actions">
                <button class="we-details-btn" data-id="${e._id}">View Details &rarr;</button>
                <button class="we-star-btn ${isSaved ? "active" : ""}" data-id="${e._id}" title="Save Event">
                  ${isSaved ? "★ Saved" : "☆ Save"}
                </button>
              </div>
            </div>
          `;
        }).join("");
      }

      col.innerHTML = `
        <div class="week-col-header">
          <div class="wch-day-name">${DAY_NAMES[currentDay.getDay()]}</div>
          <div class="wch-date-num ${isToday ? "today-badge" : ""}">${currentDay.getDate()} ${MONTH_NAMES[currentDay.getMonth()].slice(0, 3)}</div>
        </div>
        <div class="week-events-list">
          ${eventsHtml}
        </div>
      `;

      col.querySelectorAll(".we-details-btn").forEach(btn => {
        btn.addEventListener("click", (evt) => {
          evt.stopPropagation();
          const e = state.events.find(x => x._id === btn.dataset.id);
          if (e) openDateDetailsModal(new Date(e.startDate), [e]);
        });
      });

      col.querySelectorAll(".we-star-btn").forEach(btn => {
        btn.addEventListener("click", (evt) => {
          evt.stopPropagation();
          toggleBookmark(btn.dataset.id);
          renderCalendar();
        });
      });

      col.querySelector(".week-col-header").addEventListener("click", () => {
        openDateDetailsModal(currentDay, dayEvents);
      });

      DOM.weekGrid.appendChild(col);
    }
  }

  // --- C. Year View (12 Mini-Month Heatmap Grids) ---
  function renderYearView(year) {
    if (!DOM.yearGrid) return;
    DOM.yearGrid.innerHTML = "";

    const today = new Date();

    for (let m = 0; m < 12; m++) {
      const monthCard = document.createElement("div");
      monthCard.className = "year-month-card";

      const totalDays = new Date(year, m + 1, 0).getDate();
      const firstDay = new Date(year, m, 1).getDay();

      const monthEvents = state.filteredEvents.filter(e => {
        const d = e.startDateObj;
        return d.getFullYear() === year && d.getMonth() === m;
      });

      let miniDaysHtml = "";
      for (let p = 0; p < firstDay; p++) {
        miniDaysHtml += `<div class="ym-day ym-empty"></div>`;
      }

      for (let d = 1; d <= totalDays; d++) {
        const curDate = new Date(year, m, d);
        const hasEvents = monthEvents.some(e => {
          const s = new Date(e.startDate);
          const end = e.endDate ? new Date(e.endDate) : s;
          const target = curDate.setHours(0, 0, 0, 0);
          return target >= new Date(s).setHours(0, 0, 0, 0) && target <= new Date(end).setHours(23, 59, 59, 999);
        });

        const isToday = today.getFullYear() === year && today.getMonth() === m && today.getDate() === d;
        miniDaysHtml += `
          <div class="ym-day ${isToday ? "ym-today" : ""} ${hasEvents ? "ym-has-event" : ""}" data-date="${year}-${m + 1}-${d}">
            ${d}
          </div>
        `;
      }

      monthCard.innerHTML = `
        <div class="ym-header">
          <span class="ym-name">${MONTH_NAMES[m]}</span>
          <span class="ym-count-badge">${monthEvents.length} events</span>
        </div>
        <div class="ym-weekdays">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div class="ym-days-grid">
          ${miniDaysHtml}
        </div>
      `;

      monthCard.addEventListener("click", () => {
        state.currentDate = new Date(year, m, 1);
        state.viewMode = "month";
        renderCalendar();
      });

      DOM.yearGrid.appendChild(monthCard);
    }
  }

  // --- D. Cards View (Modern Event Cards with College Photographs) ---
  function renderCardsView() {
    if (!DOM.eventCardsModernGrid) return;

    if (state.filteredEvents.length === 0) {
      DOM.eventCardsModernGrid.innerHTML = `
        <div class="empty-cards-state">
          <span class="ec-icon">🔍</span>
          <h3>No events match your selected filters</h3>
          <p class="sub">Try switching academic year, resetting branch/semester filters, or clearing your search query.</p>
        </div>
      `;
      return;
    }

    DOM.eventCardsModernGrid.innerHTML = state.filteredEvents.map(e => renderModernEventCard(e)).join("");

    // Attach card listeners
    DOM.eventCardsModernGrid.querySelectorAll(".btn-card-details").forEach(btn => {
      btn.addEventListener("click", (evt) => {
        evt.stopPropagation();
        const e = state.events.find(x => x._id === btn.dataset.id);
        if (e) openDateDetailsModal(new Date(e.startDate), [e]);
      });
    });

    DOM.eventCardsModernGrid.querySelectorAll(".btn-card-star").forEach(btn => {
      btn.addEventListener("click", (evt) => {
        evt.stopPropagation();
        toggleBookmark(btn.dataset.id);
        renderCalendar();
      });
    });

    DOM.eventCardsModernGrid.querySelectorAll(".modern-event-card").forEach(card => {
      card.addEventListener("click", () => {
        const e = state.events.find(x => x._id === card.dataset.id);
        if (e) openDateDetailsModal(new Date(e.startDate), [e]);
      });
    });
  }

  function renderModernEventCard(e) {
    const cfg = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG["General"];
    const emoji = getEventEmoji(e);
    const isSaved = state.savedEventIds.has(e._id);
    const dateRange = formatDateRange(new Date(e.startDate), e.endDate ? new Date(e.endDate) : null);
    const imgSrc = e.image || cfg.defaultImage || "assets/images/mits-campus.jpg";

    return `
      <div class="modern-event-card" data-id="${e._id}" style="--cat-color: ${cfg.color};">
        <div class="mec-thumbnail-wrap">
          <img src="${imgSrc}" alt="${escapeHtml(e.title)}" class="mec-thumbnail" loading="lazy" onerror="this.src='assets/images/mits-campus.jpg'">
          <div class="mec-thumb-overlay"></div>
          <span class="mec-thumb-badge" style="background: ${cfg.bg}; color: ${cfg.color}; border: 1px solid ${cfg.border};">
            ${emoji} ${escapeHtml(e.category)}
          </span>
          <span class="mec-thumb-status status-${(e.status || "Scheduled").toLowerCase()}">${e.status || "Scheduled"}</span>
        </div>

        <div class="mec-card-body">
          <div class="mec-card-date">📅 ${dateRange} &bull; ${escapeHtml(e.startTime || "10:00 AM")}</div>
          <h3 class="mec-card-title">${emoji} ${escapeHtml(e.title)}</h3>
          <p class="mec-card-desc">${escapeHtml((e.description || "").slice(0, 110))}...</p>

          <div class="mec-card-venue">
            <span>📍 ${escapeHtml(e.venue || "MITS Gwalior Campus")}</span>
            <span>🏛️ ${escapeHtml(e.department || "")}</span>
          </div>

          <div class="mec-card-footer">
            <span class="mec-card-eligibility">🎓 ${(e.eligibleBranches || ["ALL"]).slice(0, 3).join(", ")}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${e.isOfficial !== false ? '<span class="badge-official" style="font-size: 11px; padding: 2px 7px;">🏛️ Verified</span>' : '<span class="badge-student-event" style="font-size: 11px; padding: 2px 7px;">👥 Student</span>'}
              <div class="mec-card-actions">
                <button class="btn btn-outline btn-xs btn-card-details" data-id="${e._id}">Details</button>
                <button class="btn btn-outline btn-xs btn-card-star ${isSaved ? "active" : ""}" data-id="${e._id}" title="Save">
                  ${isSaved ? "★" : "☆"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- E. Directory Table View ---
  function renderDirectoryTableView() {
    if (!DOM.eventsDirectoryTbody) return;

    if (state.filteredEvents.length === 0) {
      DOM.eventsDirectoryTbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">No events match your selected filters.</td>
        </tr>
      `;
      return;
    }

    DOM.eventsDirectoryTbody.innerHTML = state.filteredEvents.map(e => {
      const cfg = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG["General"];
      const emoji = getEventEmoji(e);
      const isSaved = state.savedEventIds.has(e._id);
      const dateStr = formatDateRange(new Date(e.startDate), e.endDate ? new Date(e.endDate) : null);
      return `
        <tr>
          <td>
            <div class="dir-date">${dateStr}</div>
            <div class="dir-time">${escapeHtml(e.startTime || "")}</div>
          </td>
          <td>
            <span class="cat-chip-table" style="color:${cfg.color}; background:${cfg.bg}; border: 1px solid ${cfg.border};">
              ${emoji} ${escapeHtml(e.category)}
            </span>
          </td>
          <td>
            <div class="dir-title" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span>${emoji}</span>
              <strong>${escapeHtml(e.title)}</strong>
              ${e.isOfficial !== false ? '<span class="badge-official" style="font-size: 10px; padding: 1px 6px;">🏛️ Verified</span>' : '<span class="badge-student-event" style="font-size: 10px; padding: 1px 6px;">👥 Student</span>'}
            </div>
            <div class="dir-desc">${escapeHtml((e.description || "").slice(0, 95))}...</div>
          </td>
          <td>
            <div class="dir-venue">📍 ${escapeHtml(e.venue || "MITS Gwalior")}</div>
            <div class="dir-dept">🏛️ ${escapeHtml(e.department || "")}</div>
          </td>
          <td>
            <span class="elig-chip">${(e.eligibleBranches || ["ALL"]).join(", ")}</span>
          </td>
          <td>
            <span class="status-badge status-${(e.status || "Scheduled").toLowerCase()}">${e.status || "Scheduled"}</span>
          </td>
          <td>
            <div class="dir-action-btns">
              <button class="btn btn-outline btn-xs view-event-btn" data-id="${e._id}">Details</button>
              <button class="btn btn-outline btn-xs toggle-star-btn ${isSaved ? "active" : ""}" data-id="${e._id}" title="Save">
                ${isSaved ? "★" : "☆"}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    DOM.eventsDirectoryTbody.querySelectorAll(".view-event-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const e = state.events.find(x => x._id === id);
        if (e) openDateDetailsModal(new Date(e.startDate), [e]);
      });
    });

    DOM.eventsDirectoryTbody.querySelectorAll(".toggle-star-btn").forEach(btn => {
      btn.addEventListener("click", (evt) => {
        evt.stopPropagation();
        toggleBookmark(btn.dataset.id);
        renderDirectoryTableView();
      });
    });
  }

  function getEventsForDate(targetDate) {
    const targetMidnight = new Date(targetDate).setHours(0, 0, 0, 0);
    const targetEnd = new Date(targetDate).setHours(23, 59, 59, 999);

    return state.filteredEvents.filter(e => {
      const s = new Date(e.startDate).setHours(0, 0, 0, 0);
      const end = e.endDate ? new Date(e.endDate).setHours(23, 59, 59, 999) : new Date(e.startDate).setHours(23, 59, 59, 999);
      return targetMidnight >= s && targetMidnight <= end;
    });
  }

  // ================= 5. LIVE COUNTDOWNS & STATS RIBBON =================
  function initCountdowns() {
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
    }

    const now = new Date();

    const upcomingExams = state.events
      .filter(e => e.category === "Examination" && new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const nextExam = upcomingExams[0];
    if (nextExam && DOM.examTargetName && DOM.examTargetDate) {
      DOM.examTargetName.textContent = nextExam.title;
      DOM.examTargetDate.textContent = `Commencing ${formatDateShort(new Date(nextExam.startDate))}`;
    }

    const upcomingHolidays = state.events
      .filter(e => e.category === "Holiday" && new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const nextHoliday = upcomingHolidays[0];
    if (nextHoliday && DOM.holidayTargetName && DOM.holidayTargetDate) {
      DOM.holidayTargetName.textContent = nextHoliday.title;
      DOM.holidayTargetDate.textContent = formatDateShort(new Date(nextHoliday.startDate));
    }

    const upcomingDeadlines = state.events
      .filter(e => e.category === "Deadline" && new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (DOM.urgentDeadlineCount) {
      DOM.urgentDeadlineCount.textContent = `${upcomingDeadlines.length} Pending`;
    }
    if (upcomingDeadlines.length > 0) {
      const firstDead = upcomingDeadlines[0];
      if (DOM.nextUrgentDeadlineTitle) DOM.nextUrgentDeadlineTitle.textContent = firstDead.title;
      const daysLeft = Math.ceil((new Date(firstDead.startDate) - now) / (1000 * 60 * 60 * 24));
      if (DOM.nextUrgentDeadlineMeta) DOM.nextUrgentDeadlineMeta.textContent = `Due in ${daysLeft} days • ${firstDead.venue || "Online"}`;
      if (DOM.nextUrgentDeadlineDate) DOM.nextUrgentDeadlineDate.textContent = `Cutoff: ${formatDateShort(new Date(firstDead.startDate))}`;
    }

    function tick() {
      const currentTime = new Date().getTime();

      if (nextExam) {
        const examTime = new Date(nextExam.startDate).getTime();
        const diff = examTime - currentTime;
        if (diff > 0) {
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          if (DOM.examDays) DOM.examDays.textContent = String(d).padStart(2, "0");
          if (DOM.examHours) DOM.examHours.textContent = String(h).padStart(2, "0");
          if (DOM.examMins) DOM.examMins.textContent = String(m).padStart(2, "0");
          if (DOM.examSecs) DOM.examSecs.textContent = String(s).padStart(2, "0");
        }
      }

      if (nextHoliday) {
        const holTime = new Date(nextHoliday.startDate).getTime();
        const diff = holTime - currentTime;
        if (diff > 0) {
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          if (DOM.holidayDays) DOM.holidayDays.textContent = String(d).padStart(2, "0");
          if (DOM.holidayHours) DOM.holidayHours.textContent = String(h).padStart(2, "0");
          if (DOM.holidayMins) DOM.holidayMins.textContent = String(m).padStart(2, "0");
          if (DOM.holidaySecs) DOM.holidaySecs.textContent = String(s).padStart(2, "0");
        }
      }
    }

    tick();
    state.countdownInterval = setInterval(tick, 1000);

    const viewExamBtn = document.getElementById("viewExamDetailsBtn");
    if (viewExamBtn && nextExam) {
      viewExamBtn.addEventListener("click", () => {
        openDateDetailsModal(new Date(nextExam.startDate), [nextExam]);
      });
    }

    const viewHolidayBtn = document.getElementById("viewHolidayDetailsBtn");
    if (viewHolidayBtn && nextHoliday) {
      viewHolidayBtn.addEventListener("click", () => {
        state.selectedCategory = "Holiday";
        DOM.categoryPills.forEach(p => p.classList.toggle("active", p.dataset.category === "Holiday"));
        applyFilters();
      });
    }

    const jumpDeadlinesBtn = document.getElementById("jumpToDeadlinesBtn");
    if (jumpDeadlinesBtn) {
      jumpDeadlinesBtn.addEventListener("click", () => {
        switchTab("deadlines");
        DOM.paneDeadlines.scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  // ================= 6. HIGHLIGHTS SECTION =================
  function renderHighlights() {
    const todayMidnight = new Date().setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(todayMidnight + 7 * 24 * 60 * 60 * 1000);

    // 1. This week
    const thisWeekEvents = state.events.filter(e => {
      const s = new Date(e.startDate).getTime();
      const end = e.endDate ? new Date(e.endDate).getTime() : s;
      return (s >= todayMidnight && s <= sevenDaysLater) || (end >= todayMidnight && s <= todayMidnight);
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (DOM.badgeThisWeek) DOM.badgeThisWeek.textContent = thisWeekEvents.length;
    if (DOM.thisWeekGrid) {
      if (thisWeekEvents.length === 0) {
        DOM.thisWeekGrid.innerHTML = `
          <div class="empty-highlight-placeholder">
            <span class="eh-icon">☕</span>
            <p>No major exams or events scheduled for this 7-day period.</p>
          </div>
        `;
      } else {
        DOM.thisWeekGrid.innerHTML = thisWeekEvents.map(renderHighlightCard).join("");
      }
    }

    // 2. Upcoming Examinations
    const upcomingExams = state.events.filter(e => {
      const em = getEventEmoji(e);
      return ["📝", "📖", "🔬", "🎤"].includes(em) || e.category === "Examination" || e.examType !== "None";
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (DOM.badgeExams) DOM.badgeExams.textContent = upcomingExams.length;
    if (DOM.examsGrid) {
      DOM.examsGrid.innerHTML = upcomingExams.length > 0
        ? upcomingExams.map(renderHighlightCard).join("")
        : '<div class="empty-highlight-placeholder"><span class="eh-icon">📝</span><p>No examinations scheduled at this time.</p></div>';
    }

    // 3. Upcoming Holidays & Festivals
    const upcomingHolidays = state.events.filter(e => {
      const em = getEventEmoji(e);
      return ["🎉", "🇮🇳", "🪔"].includes(em) || e.category === "Holiday";
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (DOM.badgeHolidays) DOM.badgeHolidays.textContent = upcomingHolidays.length;
    if (DOM.holidaysGrid) {
      DOM.holidaysGrid.innerHTML = upcomingHolidays.length > 0
        ? upcomingHolidays.map(renderHighlightCard).join("")
        : '<div class="empty-highlight-placeholder"><span class="eh-icon">🌴</span><p>No upcoming holidays in this period.</p></div>';
    }

    // 4. Workshops & Hackathons
    const upcomingWorkshops = state.events.filter(e => {
      const em = getEventEmoji(e);
      return em === "💻" || e.category === "Workshop & Seminar" || (e.title || "").toLowerCase().includes("hackathon");
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (DOM.badgeWorkshops) DOM.badgeWorkshops.textContent = upcomingWorkshops.length;
    if (DOM.workshopsGrid) {
      DOM.workshopsGrid.innerHTML = upcomingWorkshops.length > 0
        ? upcomingWorkshops.map(renderHighlightCard).join("")
        : '<div class="empty-highlight-placeholder"><span class="eh-icon">💻</span><p>No workshops or hackathons announced right now.</p></div>';
    }

    // 5. Deadlines
    const allDeadlines = state.events.filter(e => e.category === "Deadline" || (e.title || "").toLowerCase().includes("deadline"))
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (DOM.badgeDeadlines) DOM.badgeDeadlines.textContent = allDeadlines.length;
    if (DOM.deadlinesGrid) {
      DOM.deadlinesGrid.innerHTML = allDeadlines.length > 0
        ? allDeadlines.map(renderHighlightCard).join("")
        : '<div class="empty-highlight-placeholder"><span class="eh-icon">⏳</span><p>No urgent deadlines pending.</p></div>';
    }

    // 6. Flagship Fests
    const flagshipEvents = state.events.filter(e => {
      const t = (e.title || "").toLowerCase();
      return e.category === "Cultural & Sports" || t.includes("hackathon") || t.includes("technovision") || t.includes("aura") || t.includes("dyuti") || t.includes("jhankaar") || t.includes("spardha");
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (DOM.badgeFlagship) DOM.badgeFlagship.textContent = flagshipEvents.length;
    if (DOM.flagshipGrid) {
      DOM.flagshipGrid.innerHTML = flagshipEvents.length > 0
        ? flagshipEvents.map(renderHighlightCard).join("")
        : '<div class="empty-highlight-placeholder"><span class="eh-icon">🏆</span><p>No flagship festivals currently listed.</p></div>';
    }

    document.querySelectorAll(".highlight-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const e = state.events.find(x => x._id === id);
        if (e) openDateDetailsModal(new Date(e.startDate), [e]);
      });
    });
  }

  function renderHighlightCard(e) {
    const cfg = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG["General"];
    const emoji = getEventEmoji(e);
    const isSaved = state.savedEventIds.has(e._id);
    const dateStr = formatDateRange(new Date(e.startDate), e.endDate ? new Date(e.endDate) : null);
    const daysLeft = Math.ceil((new Date(e.startDate) - new Date()) / (1000 * 60 * 60 * 24));
    let badgeTxt = "";
    if (daysLeft === 0) badgeTxt = "TODAY";
    else if (daysLeft > 0) badgeTxt = `${daysLeft}d left`;
    else badgeTxt = "Completed";

    return `
      <div class="highlight-card" data-id="${e._id}" style="border-top: 3px solid ${cfg.color};">
        <div class="hl-card-top">
          <span class="hl-category" style="color:${cfg.color}; background:${cfg.bg};">${emoji} ${escapeHtml(e.category)}</span>
          <span class="hl-badge-time ${daysLeft <= 3 && daysLeft >= 0 ? "urgent" : ""}">${badgeTxt}</span>
        </div>
        <h3 class="hl-title">${emoji} ${escapeHtml(e.title)}</h3>
        <p class="hl-desc">${escapeHtml(e.description || "")}</p>
        <div class="hl-meta-row">
          <span>📅 ${dateStr}</span>
          <span>📍 ${escapeHtml(e.venue || "MITS Campus")}</span>
        </div>
        <div class="hl-footer">
          <span class="hl-dept">${e.isOfficial !== false ? '🏛️ Official' : '👥 Student Event'}</span>
          <button class="hl-star-btn ${isSaved ? "active" : ""}" data-id="${e._id}" title="Save">
            ${isSaved ? "★ Saved" : "☆ Save"}
          </button>
        </div>
      </div>
    `;
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    const tabs = [
      { id: "this-week", btn: DOM.tabThisWeekBtn, pane: DOM.paneThisWeek },
      { id: "exams", btn: DOM.tabExamsBtn, pane: DOM.paneExams },
      { id: "holidays", btn: DOM.tabHolidaysBtn, pane: DOM.paneHolidays },
      { id: "workshops", btn: DOM.tabWorkshopsBtn, pane: DOM.paneWorkshops },
      { id: "deadlines", btn: DOM.tabDeadlinesBtn, pane: DOM.paneDeadlines },
      { id: "flagship", btn: DOM.tabFlagshipBtn, pane: DOM.paneFlagship }
    ];

    tabs.forEach(t => {
      if (t.btn && t.pane) {
        const isActive = t.id === tabId;
        t.btn.classList.toggle("active", isActive);
        t.pane.style.display = isActive ? "block" : "none";
      }
    });
  }

  // ================= 7. DATE & EVENT DETAILS MODAL / DRAWER =================
  function openDateDetailsModal(dateObj, eventsOnDate) {
    if (!DOM.eventDetailsBackdrop || !DOM.modalEventsListContainer) return;

    const formattedDate = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    if (DOM.modalDateHeader) {
      DOM.modalDateHeader.textContent = formattedDate;
    }

    if (!eventsOnDate || eventsOnDate.length === 0) {
      DOM.modalEventsListContainer.innerHTML = `
        <div class="empty-modal-state">
          <span class="em-icon">📅</span>
          <h3>No Campus Events Scheduled</h3>
          <p class="sub">There are no examinations, holiday breaks, or club activities scheduled for this date.</p>
          <button class="btn btn-primary btn-sm mt-3" id="quickAddOnDateBtn">+ Schedule Event on ${dateObj.toLocaleDateString()}</button>
        </div>
      `;

      const quickAddBtn = document.getElementById("quickAddOnDateBtn");
      if (quickAddBtn) {
        quickAddBtn.addEventListener("click", () => {
          closeEventDetailsModal();
          openAdminModal(dateObj);
        });
      }
    } else {
      DOM.modalEventsListContainer.innerHTML = eventsOnDate.map(renderModalEventItem).join("");

      // Attach action listeners
      eventsOnDate.forEach(e => {
        const gcalBtn = document.getElementById(`gcalBtn_${e._id}`);
        if (gcalBtn) {
          gcalBtn.addEventListener("click", () => {
            const url = generateGoogleCalendarUrl(e);
            window.open(url, "_blank");
          });
        }

        const icsBtn = document.getElementById(`icsBtn_${e._id}`);
        if (icsBtn) {
          icsBtn.addEventListener("click", () => {
            downloadSingleIcs(e);
          });
        }

        const bookmarkBtn = document.getElementById(`bookmarkBtn_${e._id}`);
        if (bookmarkBtn) {
          bookmarkBtn.addEventListener("click", () => {
            toggleBookmark(e._id);
            const isSaved = state.savedEventIds.has(e._id);
            bookmarkBtn.innerHTML = isSaved ? "★ Saved in Favorites" : "☆ Save to Favorites";
            bookmarkBtn.classList.toggle("active", isSaved);
            renderCalendar();
            renderHighlights();
          });
        }

        const reminderBtn = document.getElementById(`reminderBtn_${e._id}`);
        if (reminderBtn) {
          reminderBtn.addEventListener("click", () => {
            toggleReminder(e);
          });
        }

        const editBtn = document.getElementById(`editEvtBtn_${e._id}`);
        if (editBtn) {
          editBtn.addEventListener("click", () => {
            closeEventDetailsModal();
            openAdminModal(null, e);
          });
        }

        const deleteBtn = document.getElementById(`deleteEvtBtn_${e._id}`);
        if (deleteBtn) {
          deleteBtn.addEventListener("click", async () => {
            if (!confirm(`Are you sure you want to remove "${e.title}" from the calendar?`)) return;
            try {
              const res = await fetch(`${state.apiBase}/events/${e._id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUser?._id })
              });
              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to delete");
              }
            } catch (err) {
              console.warn("Delete note:", err.message);
            }
            state.events = state.events.filter(x => x._id !== e._id);
            updateCategoryCounts();
            updateEmojiCounts();
            applyFilters();
            initCountdowns();
            closeEventDetailsModal();
            showToast("Event removed successfully", "info");
          });
        }
      });
    }

    DOM.eventDetailsBackdrop.style.display = "flex";
  }

  function renderModalEventItem(e) {
    const cfg = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG["General"];
    const emoji = getEventEmoji(e);
    const isSaved = state.savedEventIds.has(e._id);
    const hasReminder = state.reminders.has(e._id);
    const dateRange = formatDateRange(new Date(e.startDate), e.endDate ? new Date(e.endDate) : null);
    const imgSrc = e.image || cfg.defaultImage || "assets/images/mits-campus.jpg";

    const isOwner = currentUser && (
      (e.createdBy && (e.createdBy === currentUser._id || e.createdBy._id === currentUser._id)) ||
      (e.createdByName && currentUser.name && e.createdByName.toLowerCase() === currentUser.name.toLowerCase()) ||
      (e.isOfficial === false)
    );
    const canManage = isUserAdmin(currentUser) || isOwner;

    return `
      <div class="modal-event-card" style="border-left: 4px solid ${cfg.color};">
        <div class="mec-banner-header">
          <img src="${imgSrc}" alt="${escapeHtml(e.title)}" class="mec-banner-image" onerror="this.src='assets/images/mits-campus.jpg'">
          <div class="mec-banner-meta">
            <span class="mec-category-badge" style="color:${cfg.color}; background:${cfg.bg}; border: 1px solid ${cfg.border};">
              ${emoji} ${escapeHtml(e.category)}
            </span>
            ${e.examType && e.examType !== "None" ? `<span class="exam-type-chip">${emoji} ${escapeHtml(e.examType)}</span>` : ""}
            <span class="mec-status-badge status-${(e.status || "Scheduled").toLowerCase()}">${e.status || "Scheduled"}</span>
            ${e.isOfficial !== false ? '<span class="mec-official-badge badge-official">🏛️ MITS Official Verified</span>' : '<span class="mec-official-badge badge-student-event">👥 Student Community Event</span>'}
          </div>
        </div>

        <div class="mec-top">
          <h3 class="mec-title">${emoji} ${escapeHtml(e.title)}</h3>
          <button class="mec-star-btn ${isSaved ? "active" : ""}" id="bookmarkBtn_${e._id}" title="Toggle Bookmark">
            ${isSaved ? "★ Saved in Favorites" : "☆ Save to Favorites"}
          </button>
        </div>

        <div class="mec-meta-grid">
          <div class="mec-meta-item">
            <span class="meta-label">📅 Schedule:</span>
            <span class="meta-value">${dateRange} &bull; ${escapeHtml(e.startTime || "10:00 AM")} - ${escapeHtml(e.endTime || "05:00 PM")}</span>
          </div>
          <div class="mec-meta-item">
            <span class="meta-label">📍 Venue:</span>
            <span class="meta-value">${escapeHtml(e.venue || "MITS Gwalior Campus")}</span>
          </div>
          <div class="mec-meta-item">
            <span class="meta-label">🏛️ Department:</span>
            <span class="meta-value">${escapeHtml(e.department || "Dean Academics Office")}</span>
          </div>
          <div class="mec-meta-item">
            <span class="meta-label">🎓 Eligibility:</span>
            <span class="meta-value">Branches: ${(e.eligibleBranches || ["ALL"]).join(", ")} | Semesters: ${(e.eligibleSemesters || ["1-8"]).join(", ")}</span>
          </div>
        </div>

        <div class="mec-description">
          <h4 class="mec-section-title">Overview &amp; Syllabus Context:</h4>
          <p>${escapeHtml(e.description || "Official autonomous academic schedule entry.")}</p>
        </div>

        ${e.importantInstructions ? `
          <div class="mec-instructions-box">
            <span class="ins-icon">⚠️</span>
            <div>
              <strong>Important Instructions &amp; Examination Guidelines:</strong>
              <p>${escapeHtml(e.importantInstructions)}</p>
            </div>
          </div>
        ` : ""}

        <div class="mec-footer-contacts">
          ${e.contactPerson ? `<span>👤 Coordinator: <strong>${escapeHtml(e.contactPerson)}</strong></span>` : ""}
          ${e.createdByName ? `<span>✍️ Posted by: <strong>${escapeHtml(e.createdByName)}</strong> (${escapeHtml(e.createdByRole || "Student")})</span>` : ""}
          ${e.contactEmail ? `<span>✉️ <a href="mailto:${e.contactEmail}">${escapeHtml(e.contactEmail)}</a></span>` : ""}
          ${e.sourceUrl ? `<span>🔗 <a href="${e.sourceUrl}" target="_blank" rel="noopener">Official Circular Notice &rarr;</a></span>` : ""}
        </div>

        <div class="mec-action-toolbar">
          <button class="btn btn-outline btn-sm" id="gcalBtn_${e._id}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Add to Google Calendar</span>
          </button>

          <button class="btn btn-outline btn-sm" id="icsBtn_${e._id}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Download .ICS</span>
          </button>

          <button class="btn btn-outline btn-sm ${hasReminder ? "active" : ""}" id="reminderBtn_${e._id}">
            <span>${hasReminder ? "🔔 Reminder Active" : "🔔 Set Reminder"}</span>
          </button>

          ${e.registrationUrl ? `
            <a href="${e.registrationUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm mec-register-btn">
              <span>Register / Form Link &rarr;</span>
            </a>
          ` : ""}
        </div>

        ${canManage ? `
          <div class="mec-manage-toolbar" style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(148, 163, 184, 0.2); display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-outline btn-sm mec-edit-btn" id="editEvtBtn_${e._id}" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);">
              <span>✏️ Edit Event</span>
            </button>
            <button class="btn btn-outline btn-sm mec-delete-btn" id="deleteEvtBtn_${e._id}" style="color: #f87171; border-color: rgba(248, 113, 113, 0.4);">
              <span>🗑️ Delete Event</span>
            </button>
          </div>
        ` : ""}
      </div>
    `;
  }

  function closeEventDetailsModal() {
    if (DOM.eventDetailsBackdrop) {
      DOM.eventDetailsBackdrop.style.display = "none";
    }
  }

  // ================= 8. GOOGLE CALENDAR & .ICS INTEGRATION =================
  function generateGoogleCalendarUrl(e) {
    const s = new Date(e.startDate);
    const end = e.endDate ? new Date(e.endDate) : new Date(s.getTime() + 2 * 60 * 60 * 1000);

    const fmtUtc = d => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const details = `${e.description || ""}\n\nVenue: ${e.venue || "MITS Gwalior"}\nDepartment: ${e.department || ""}\nOfficial Circular: ${e.sourceUrl || "https://web.mitsgwalior.in"}`;

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: e.title,
      dates: `${fmtUtc(s)}/${fmtUtc(end)}`,
      details: details,
      location: e.venue || "MITS Gwalior Campus"
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function downloadSingleIcs(e) {
    const icsContent = buildIcsContent([e]);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const filename = `${slugify(e.title || "mits-event")}.ics`;
    triggerDownload(blob, filename);
    showToast(`Downloaded ${filename} for calendar sync`, "success");
  }

  function downloadAllIcs() {
    if (state.events.length === 0) {
      showToast("No events to export", "info");
      return;
    }
    const icsContent = buildIcsContent(state.events);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    triggerDownload(blob, "MITS_Gwalior_Academic_Calendar.ics");
    showToast("Downloaded full MITS Academic Calendar (.ics)", "success");
  }

  function buildIcsContent(events) {
    const fmtUtc = d => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

    let lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MITS Gwalior//CampusConnect Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:MITS Gwalior Academic Calendar",
      "X-WR-TIMEZONE:Asia/Kolkata"
    ];

    events.forEach(e => {
      const s = new Date(e.startDate);
      const end = e.endDate ? new Date(e.endDate) : new Date(s.getTime() + 2 * 60 * 60 * 1000);
      const uid = `mits-${e._id || Date.now()}@mitsgwalior.in`;

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${fmtUtc(new Date())}`);
      lines.push(`DTSTART:${fmtUtc(s)}`);
      lines.push(`DTEND:${fmtUtc(end)}`);
      lines.push(`SUMMARY:${cleanIcsString(e.title)}`);
      lines.push(`DESCRIPTION:${cleanIcsString(e.description || "")}`);
      lines.push(`LOCATION:${cleanIcsString(e.venue || "MITS Gwalior Campus")}`);
      lines.push(`CATEGORIES:${cleanIcsString(e.category)}`);
      lines.push(`URL:${cleanIcsString(e.sourceUrl || "https://web.mitsgwalior.in")}`);
      lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function cleanIcsString(str) {
    return (str || "").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  function triggerDownload(blob, filename) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  // ================= 9. BOOKMARKS & NOTIFICATION REMINDERS =================
  function toggleBookmark(eventId) {
    if (state.savedEventIds.has(eventId)) {
      state.savedEventIds.delete(eventId);
      showToast("Removed from Saved Events", "info");
    } else {
      state.savedEventIds.add(eventId);
      showToast("Saved to My Events!", "success");
    }

    try {
      localStorage.setItem("mits_saved_events", JSON.stringify(Array.from(state.savedEventIds)));
    } catch (e) {}

    updateCategoryCounts();
  }

  function toggleReminder(e) {
    if (state.reminders.has(e._id)) {
      state.reminders.delete(e._id);
      showToast(`Reminder cancelled for ${e.title}`, "info");
    } else {
      state.reminders.add(e._id);

      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(`Reminder set: ${e.title}`, {
            body: `Scheduled for ${formatDateShort(new Date(e.startDate))} at ${e.venue || "MITS Gwalior"}`
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              new Notification(`Reminder set: ${e.title}`, {
                body: `Scheduled for ${formatDateShort(new Date(e.startDate))} at ${e.venue || "MITS Gwalior"}`
              });
            }
          });
        }
      }

      showToast(`Reminder active for ${e.title}!`, "success");
    }

    try {
      localStorage.setItem("mits_event_reminders", JSON.stringify(Array.from(state.reminders)));
    } catch (err) {}

    const btn = document.getElementById(`reminderBtn_${e._id}`);
    if (btn) {
      const active = state.reminders.has(e._id);
      btn.innerHTML = active ? "🔔 Reminder Active" : "🔔 Set Reminder";
      btn.classList.toggle("active", active);
    }
  }

  // ================= 10. ADMIN & STUDENT EVENT MANAGEMENT =================
  function openAdminModal(defaultDate = null, eventToEdit = null) {
    if (!DOM.adminEventBackdrop) return;
    if (DOM.adminFormFeedback) DOM.adminFormFeedback.style.display = "none";

    const isEdit = Boolean(eventToEdit);
    if (DOM.evtEditId) DOM.evtEditId.value = isEdit ? eventToEdit._id : "";

    const userIsAdmin = isUserAdmin(currentUser);

    // Dynamic Title & Buttons based on User Role & Mode
    if (DOM.adminModalHeading) {
      if (isEdit) {
        DOM.adminModalHeading.textContent = "Edit Campus Event";
      } else if (userIsAdmin) {
        DOM.adminModalHeading.textContent = "Schedule Official Campus Event";
      } else {
        DOM.adminModalHeading.textContent = "Schedule Student / Community Event";
      }
    }

    if (DOM.saveEventSubmitBtn) {
      if (isEdit) {
        DOM.saveEventSubmitBtn.textContent = "Save Changes";
      } else if (userIsAdmin) {
        DOM.saveEventSubmitBtn.textContent = "Publish Official Event";
      } else {
        DOM.saveEventSubmitBtn.textContent = "Publish Student Event";
      }
    }

    // Role-based official toggle
    if (DOM.evtIsOfficialWrap) {
      DOM.evtIsOfficialWrap.style.display = "flex";
      if (DOM.evtIsOfficial) {
        if (userIsAdmin) {
          DOM.evtIsOfficial.disabled = false;
          DOM.evtIsOfficial.checked = isEdit ? (eventToEdit.isOfficial !== false) : true;
          if (DOM.evtIsOfficialHint) DOM.evtIsOfficialHint.textContent = "Official college events appear with MITS verified badges.";
        } else {
          DOM.evtIsOfficial.checked = false;
          DOM.evtIsOfficial.disabled = true;
          if (DOM.evtIsOfficialHint) DOM.evtIsOfficialHint.textContent = "You are publishing as a Student Community Event.";
        }
      }
    }

    if (isEdit) {
      const e = eventToEdit;
      const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
      setVal("evtTitle", e.title);
      setVal("evtCategory", e.category);
      setVal("evtExamType", e.examType || "None");
      setVal("evtEmoji", e.emoji || "");
      setVal("evtSubCategory", e.subCategory || "");
      setVal("evtAcademicYear", e.academicYear || "2026-2027");
      setVal("evtStatus", e.status || "Scheduled");
      setVal("evtStartTime", e.startTime || "10:00 AM");
      setVal("evtEndTime", e.endTime || "05:00 PM");
      setVal("evtVenue", e.venue || "MITS Gwalior Campus");
      setVal("evtDepartment", e.department || "Academic Cell");
      setVal("evtBranches", (e.eligibleBranches || ["ALL"]).join(", "));
      setVal("evtSemesters", (e.eligibleSemesters || [1, 2, 3, 4, 5, 6, 7, 8]).join(", "));
      setVal("evtDescription", e.description || "");
      setVal("evtInstructions", e.importantInstructions || "");
      setVal("evtRegUrl", e.registrationUrl || "");
      setVal("evtSourceUrl", e.sourceUrl || "https://web.mitsgwalior.in");
      setVal("evtContactPerson", e.contactPerson || "");
      setVal("evtContactEmail", e.contactEmail || "");

      const s = new Date(e.startDate);
      const startEl = document.getElementById("evtStartDate");
      if (startEl && !isNaN(s.getTime())) {
        startEl.value = s.toISOString().split("T")[0];
      }
      const endEl = document.getElementById("evtEndDate");
      if (endEl && e.endDate) {
        const ed = new Date(e.endDate);
        if (!isNaN(ed.getTime())) endEl.value = ed.toISOString().split("T")[0];
      }
    } else {
      if (DOM.adminEventForm) DOM.adminEventForm.reset();
      if (DOM.evtEditId) DOM.evtEditId.value = "";

      // Pre-populate sensible defaults
      const contactPersonInput = document.getElementById("evtContactPerson");
      if (contactPersonInput && currentUser?.name) contactPersonInput.value = currentUser.name;
      const contactEmailInput = document.getElementById("evtContactEmail");
      if (contactEmailInput && currentUser?.email) contactEmailInput.value = currentUser.email;

      const deptInput = document.getElementById("evtDepartment");
      if (deptInput) {
        deptInput.value = userIsAdmin ? "Dean Academics Office" : (currentUser?.branch ? `${currentUser.branch} Student Body` : "Student Community");
      }

      const dateInput = document.getElementById("evtStartDate");
      if (dateInput && defaultDate) {
        const yr = defaultDate.getFullYear();
        const mo = String(defaultDate.getMonth() + 1).padStart(2, "0");
        const da = String(defaultDate.getDate()).padStart(2, "0");
        dateInput.value = `${yr}-${mo}-${da}`;
      } else if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split("T")[0];
      }
    }

    DOM.adminEventBackdrop.style.display = "flex";
  }

  function closeAdminModal() {
    if (DOM.adminEventBackdrop) {
      DOM.adminEventBackdrop.style.display = "none";
    }
    if (DOM.evtEditId) DOM.evtEditId.value = "";
  }

  async function handleAdminFormSubmit(e) {
    e.preventDefault();

    const editId = DOM.evtEditId ? DOM.evtEditId.value : "";
    const title = document.getElementById("evtTitle").value.trim();
    const category = document.getElementById("evtCategory").value;
    const examType = DOM.evtExamType ? DOM.evtExamType.value : "None";
    const emoji = DOM.evtEmoji ? DOM.evtEmoji.value : "";
    const subCategory = DOM.evtSubCategory ? DOM.evtSubCategory.value.trim() : "";
    const academicYear = document.getElementById("evtAcademicYear").value;
    const status = document.getElementById("evtStatus").value;
    const startDate = document.getElementById("evtStartDate").value;
    const endDate = document.getElementById("evtEndDate").value;
    const startTime = document.getElementById("evtStartTime").value.trim();
    const endTime = document.getElementById("evtEndTime").value.trim();
    const venue = document.getElementById("evtVenue").value.trim();
    const department = document.getElementById("evtDepartment").value.trim();
    const branchesStr = document.getElementById("evtBranches").value.trim();
    const semestersStr = document.getElementById("evtSemesters").value.trim();
    const description = document.getElementById("evtDescription").value.trim();
    const instructions = document.getElementById("evtInstructions").value.trim();
    const regUrl = document.getElementById("evtRegUrl").value.trim();
    const sourceUrl = document.getElementById("evtSourceUrl").value.trim();
    const contactPerson = document.getElementById("evtContactPerson").value.trim();
    const contactEmail = document.getElementById("evtContactEmail").value.trim();

    const userIsAdmin = isUserAdmin(currentUser);
    const isOfficial = userIsAdmin ? (DOM.evtIsOfficial ? DOM.evtIsOfficial.checked : true) : false;

    if (!title || !startDate) {
      showAdminFeedback("Title and Start Date are required", "error");
      return;
    }

    // Duplicate Check for new events
    if (!editId) {
      const isDup = state.events.some(x =>
        x.title.trim().toLowerCase() === title.trim().toLowerCase() &&
        new Date(x.startDate).toDateString() === new Date(startDate).toDateString()
      );
      if (isDup) {
        showAdminFeedback("An event with this title on the selected date already exists in the calendar.", "error");
        return;
      }
    }

    const eligibleBranches = branchesStr ? branchesStr.split(",").map(b => b.trim()).filter(Boolean) : ["ALL"];
    const eligibleSemesters = semestersStr ? semestersStr.split(",").map(s => Number(s.trim())).filter(n => !isNaN(n)) : [1, 2, 3, 4, 5, 6, 7, 8];

    const eventPayload = {
      title,
      category,
      examType,
      emoji: emoji || getEventEmoji({ title, category, examType, subCategory, description }),
      subCategory,
      academicYear,
      status,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : new Date(startDate).toISOString(),
      startTime: startTime || "10:00 AM",
      endTime: endTime || "05:00 PM",
      venue: venue || "MITS Gwalior Campus",
      department: department || (isOfficial ? "Dean Academics Office" : "Student Body"),
      eligibleBranches,
      eligibleSemesters,
      description,
      importantInstructions: instructions,
      registrationUrl: regUrl,
      sourceUrl: sourceUrl || "https://web.mitsgwalior.in",
      contactPerson: contactPerson || currentUser?.name || "Campus Organizer",
      contactEmail: contactEmail || currentUser?.email || "",
      isOfficial,
      userId: currentUser?._id,
      createdByName: currentUser?.name || "Student",
      createdByRole: currentUser?.role || (userIsAdmin ? "Admin" : "Student"),
      image: CATEGORY_CONFIG[category]?.defaultImage || "assets/images/mits-campus.jpg"
    };

    const submitBtn = DOM.saveEventSubmitBtn || document.getElementById("saveEventSubmitBtn");
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (editId) {
        // Edit existing
        const res = await fetch(`${state.apiBase}/events/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload)
        });

        const updatedData = res.ok ? await res.json() : eventPayload;

        const idx = state.events.findIndex(x => x._id === editId);
        if (idx !== -1) {
          state.events[idx] = {
            ...state.events[idx],
            ...updatedData,
            startDateObj: new Date(eventPayload.startDate),
            endDateObj: new Date(eventPayload.endDate)
          };
        }
        showToast("Campus event updated successfully!", "success");
      } else {
        // Create new
        const res = await fetch(`${state.apiBase}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload)
        });

        if (res.status === 409) {
          showAdminFeedback("Duplicate event detected on this date.", "error");
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        let saved = null;
        if (res.ok) {
          saved = await res.json();
        }

        const eventRecord = {
          ...eventPayload,
          _id: saved ? saved._id : `client-${Date.now()}`,
          startDateObj: new Date(eventPayload.startDate),
          endDateObj: new Date(eventPayload.endDate)
        };

        state.events.unshift(eventRecord);
        showToast(isOfficial ? "Official college event scheduled!" : "Student community event published!", "success");
      }

      updateCategoryCounts();
      updateEmojiCounts();
      applyFilters();
      initCountdowns();
      closeAdminModal();
    } catch (err) {
      console.warn("API Error, saving locally:", err);
      if (editId) {
        const idx = state.events.findIndex(x => x._id === editId);
        if (idx !== -1) {
          state.events[idx] = {
            ...state.events[idx],
            ...eventPayload,
            startDateObj: new Date(eventPayload.startDate),
            endDateObj: new Date(eventPayload.endDate)
          };
        }
      } else {
        const eventRecord = {
          ...eventPayload,
          _id: `client-${Date.now()}`,
          startDateObj: new Date(eventPayload.startDate),
          endDateObj: new Date(eventPayload.endDate)
        };
        state.events.unshift(eventRecord);
      }
      updateCategoryCounts();
      updateEmojiCounts();
      applyFilters();
      initCountdowns();
      showToast("Event saved successfully!", "success");
      closeAdminModal();
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function showAdminFeedback(msg, type = "error") {
    if (!DOM.adminFormFeedback) return;
    DOM.adminFormFeedback.textContent = msg;
    DOM.adminFormFeedback.className = `auth-status-msg ${type}`;
    DOM.adminFormFeedback.style.display = "block";
  }

  // ================= SMART EXAMINATION FINDER =================
  function initExamFinder() {
    if (!DOM.btnSearchExamSchedule) return;

    DOM.btnSearchExamSchedule.addEventListener("click", () => {
      const examType = DOM.examFinderType ? DOM.examFinderType.value : "";
      if (!examType) {
        showToast("Please select an Examination Type first", "error");
        if (DOM.examFinderType) DOM.examFinderType.focus();
        return;
      }

      const branch = DOM.examFinderBranch ? DOM.examFinderBranch.value : "ALL";
      const semVal = DOM.examFinderSemester ? Number(DOM.examFinderSemester.value) : 1;
      const session = DOM.examFinderSession ? DOM.examFinderSession.value : "2026-2027";

      executeExamFinderSearch(examType, branch, semVal, session);
    });

    if (DOM.btnResetExamSearch) {
      DOM.btnResetExamSearch.addEventListener("click", () => {
        if (DOM.examFinderType) DOM.examFinderType.value = "";
        if (DOM.examFinderBranch) DOM.examFinderBranch.value = "ALL";
        if (DOM.examFinderSemester) DOM.examFinderSemester.value = "3";
        if (DOM.examFinderSession) DOM.examFinderSession.value = "2026-2027";
        if (DOM.examSearchResults) {
          DOM.examSearchResults.style.display = "none";
          DOM.examSearchResults.innerHTML = "";
        }
      });
    }
  }

  function executeExamFinderSearch(examType, branch, semester, session) {
    if (!DOM.examSearchResults) return;

    const matches = state.events.filter(e => {
      // 1. Exam Type Match
      let typeMatch = false;
      const t = (e.title || "").toLowerCase();
      const d = (e.description || "").toLowerCase();
      const exType = (e.examType || "").toLowerCase();

      if (examType === "Minor 1") {
        typeMatch = exType === "minor 1" || (
          !t.includes("minor 2") && !t.includes("mst-ii") && !t.includes("mid-semester test ii") &&
          (t.includes("minor 1") || t.includes("mst-i") || t.includes("mid-semester test i"))
        );
      } else if (examType === "Minor 2") {
        typeMatch = exType === "minor 2" || t.includes("minor 2") || t.includes("mst-ii") || t.includes("mid-semester test ii");
      } else if (examType === "Major") {
        typeMatch = exType === "major" || t.includes("major") || t.includes("autonomous theory") || t.includes("end-semester theory") || t.includes("end-sem");
      } else if (examType === "Practical") {
        typeMatch = exType === "practical" || e.category === "Lab & Practical" || t.includes("practical") || t.includes("lab exam");
      } else if (examType === "Viva") {
        typeMatch = exType === "viva" || t.includes("viva") || t.includes("viva-voce") || d.includes("viva-voce");
      }

      if (!typeMatch) return false;

      // 2. Branch Match
      if (branch !== "ALL" && e.eligibleBranches && e.eligibleBranches.length > 0) {
        const branchOk = e.eligibleBranches.includes("ALL") || e.eligibleBranches.includes(branch);
        if (!branchOk) return false;
      }

      // 3. Semester Match
      if (e.eligibleSemesters && e.eligibleSemesters.length > 0) {
        if (!e.eligibleSemesters.includes(semester)) return false;
      }

      // 4. Session
      if (e.academicYear && session && e.academicYear !== session) {
        const yr = new Date(e.startDate).getFullYear();
        if (session.startsWith("2026") && yr < 2026) return false;
      }

      return true;
    });

    DOM.examSearchResults.style.display = "block";

    if (matches.length > 0) {
      DOM.examSearchResults.innerHTML = `
        <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <h4 style="margin: 0; font-size: 15px; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
            <span>✓</span> Found ${matches.length} Verified Examination Schedule${matches.length > 1 ? "s" : ""}
          </h4>
          <span style="font-size: 12px; color: #94a3b8; font-family: var(--mono, monospace);">
            Filtered: ${escapeHtml(examType)} &bull; ${escapeHtml(branch)} &bull; Sem ${semester} &bull; ${escapeHtml(session)}
          </span>
        </div>
        <div class="exam-matches-list">
          ${matches.map(renderExamMatchCard).join("")}
        </div>
      `;

      matches.forEach(m => {
        const viewBtn = document.getElementById(`viewMatchCalBtn_${m._id}`);
        if (viewBtn) {
          viewBtn.addEventListener("click", () => {
            state.currentDate = new Date(m.startDate);
            renderCalendar();
            openDateDetailsModal(new Date(m.startDate), [m]);
          });
        }

        const icsBtn = document.getElementById(`icsMatchBtn_${m._id}`);
        if (icsBtn) {
          icsBtn.addEventListener("click", () => downloadSingleIcs(m));
        }
      });
    } else {
      // Requirement 3: If unavailable, show "Schedule not announced yet."
      DOM.examSearchResults.innerHTML = `
        <div class="exam-not-announced-box">
          <div class="not-announced-icon">⚠️</div>
          <div class="not-announced-content">
            <h4>Schedule not announced yet.</h4>
            <p>
              The Controller of Examinations (COE), Madhav Institute of Technology &amp; Science (MITS) Gwalior has not yet released the official timetable notification for <strong>${escapeHtml(examType)}</strong> (Branch: ${escapeHtml(branch)}, Semester: ${semester}, Session: ${escapeHtml(session)}).
            </p>
            <div class="not-announced-links">
              <a href="https://web.mitsgwalior.in/examination/notices" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);">
                <span>Official MITS Notices Portal ↗</span>
              </a>
              <a href="https://ims.mitsgwalior.in" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="color: #34d399; border-color: rgba(52, 211, 153, 0.4);">
                <span>MITS IMS Student Login ↗</span>
              </a>
              <button class="btn btn-primary btn-sm" id="notifyWhenAnnouncedBtn" style="white-space: nowrap;">
                <span>🔔 Notify Me When Released</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const notifBtn = document.getElementById("notifyWhenAnnouncedBtn");
      if (notifBtn) {
        notifBtn.addEventListener("click", () => {
          showToast(`Alert set! You will be notified when ${examType} schedule is released.`, "success");
          notifBtn.textContent = "✓ Notification Subscribed";
          notifBtn.disabled = true;
        });
      }
    }
  }

  function renderExamMatchCard(e) {
    const emoji = getEventEmoji(e);
    const dateRange = formatDateRange(new Date(e.startDate), e.endDate ? new Date(e.endDate) : null);
    return `
      <div class="exam-result-card">
        <div class="exam-res-info">
          <div class="exam-res-header">
            <span class="exam-type-chip">${emoji} ${escapeHtml(e.examType || "Examination")}</span>
            <span class="badge-official">MITS Verified</span>
            <span class="mec-status-badge status-${(e.status || "Scheduled").toLowerCase()}">${e.status || "Scheduled"}</span>
          </div>
          <h4 class="exam-res-title">${escapeHtml(e.title)}</h4>
          <div class="exam-res-meta">
            <span class="exam-res-meta-item"><span>📅</span> ${dateRange}</span>
            <span class="exam-res-meta-item"><span>⏰</span> ${escapeHtml(e.startTime || "10:00 AM")} - ${escapeHtml(e.endTime || "04:30 PM")}</span>
            <span class="exam-res-meta-item"><span>📍</span> ${escapeHtml(e.venue || "Examination Blocks")}</span>
          </div>
          <div class="exam-res-desc">${escapeHtml(e.description || "")}</div>
          ${e.importantInstructions ? `
            <div class="exam-res-instructions">
              <strong>Rules:</strong> ${escapeHtml(e.importantInstructions)}
            </div>
          ` : ""}
        </div>
        <div class="exam-res-actions">
          <button class="btn btn-primary btn-sm" id="viewMatchCalBtn_${e._id}">
            <span>📅 View in Calendar</span>
          </button>
          <button class="btn btn-outline btn-sm" id="icsMatchBtn_${e._id}">
            <span>⬇️ Export .ICS</span>
          </button>
        </div>
      </div>
    `;
  }

  // ================= 11. EVENT LISTENERS =================
  function setupEventListeners() {
    // Navigation
    if (DOM.prevPeriodBtn) {
      DOM.prevPeriodBtn.addEventListener("click", () => {
        if (state.viewMode === "year") {
          state.currentDate.setFullYear(state.currentDate.getFullYear() - 1);
        } else if (state.viewMode === "week") {
          state.currentDate.setDate(state.currentDate.getDate() - 7);
        } else {
          state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        }
        renderCalendar();
      });
    }

    if (DOM.nextPeriodBtn) {
      DOM.nextPeriodBtn.addEventListener("click", () => {
        if (state.viewMode === "year") {
          state.currentDate.setFullYear(state.currentDate.getFullYear() + 1);
        } else if (state.viewMode === "week") {
          state.currentDate.setDate(state.currentDate.getDate() + 7);
        } else {
          state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        }
        renderCalendar();
      });
    }

    if (DOM.todayBtn) {
      DOM.todayBtn.addEventListener("click", () => {
        state.currentDate = new Date();
        renderCalendar();
      });
    }

    // View switchers
    const viewButtons = [
      { el: DOM.viewMonthBtn, mode: "month" },
      { el: DOM.viewWeekBtn, mode: "week" },
      { el: DOM.viewYearBtn, mode: "year" },
      { el: DOM.viewCardsBtn, mode: "cards" },
      { el: DOM.viewDirectoryBtn, mode: "directory" }
    ];

    viewButtons.forEach(({ el, mode }) => {
      if (el) {
        el.addEventListener("click", () => {
          state.viewMode = mode;
          renderCalendar();
        });
      }
    });

    // Category pills
    DOM.categoryPills.forEach(pill => {
      pill.addEventListener("click", () => {
        DOM.categoryPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        state.selectedCategory = pill.dataset.category;
        applyFilters();
      });
    });

    // Search input
    if (DOM.eventSearchInput) {
      DOM.eventSearchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        if (DOM.clearSearchBtn) {
          DOM.clearSearchBtn.style.display = state.searchQuery ? "block" : "none";
        }
        applyFilters();
      });
    }

    if (DOM.clearSearchBtn) {
      DOM.clearSearchBtn.addEventListener("click", () => {
        DOM.eventSearchInput.value = "";
        state.searchQuery = "";
        DOM.clearSearchBtn.style.display = "none";
        applyFilters();
      });
    }

    // Dropdown filters
    if (DOM.academicYearFilterSelect) {
      DOM.academicYearFilterSelect.addEventListener("change", (e) => {
        state.selectedAcademicYear = e.target.value;
        applyFilters();
      });
    }

    if (DOM.branchFilterSelect) {
      DOM.branchFilterSelect.addEventListener("change", (e) => {
        state.selectedBranch = e.target.value;
        applyFilters();
      });
    }

    if (DOM.semesterFilterSelect) {
      DOM.semesterFilterSelect.addEventListener("change", (e) => {
        state.selectedSemester = e.target.value;
        applyFilters();
      });
    }

    if (DOM.statusFilterSelect) {
      DOM.statusFilterSelect.addEventListener("change", (e) => {
        state.selectedStatus = e.target.value;
        applyFilters();
      });
    }

    if (DOM.resetFiltersBtn) {
      DOM.resetFiltersBtn.addEventListener("click", () => {
        state.selectedCategory = "all";
        state.selectedAcademicYear = "all";
        state.selectedBranch = "all";
        state.selectedSemester = "all";
        state.selectedStatus = "all";
        state.selectedEmojiFilter = "all";
        state.selectedSourceFilter = "all";
        state.isPersonalizedActive = false;
        state.searchQuery = "";
        state.showSavedOnly = false;

        DOM.categoryPills.forEach(p => p.classList.toggle("active", p.dataset.category === "all"));
        if (DOM.emojiLegendStrip) {
          DOM.emojiLegendStrip.querySelectorAll(".legend-emoji-pill").forEach(p => {
            p.classList.toggle("active", p.dataset.emoji === "all");
          });
        }
        if (DOM.eventSourceToggleGroup) {
          DOM.eventSourceToggleGroup.querySelectorAll(".source-toggle-btn").forEach(b => {
            b.classList.toggle("active", b.dataset.source === "all");
          });
        }
        updatePersonalizedUi();
        if (DOM.academicYearFilterSelect) DOM.academicYearFilterSelect.value = "all";
        if (DOM.branchFilterSelect) DOM.branchFilterSelect.value = "all";
        if (DOM.semesterFilterSelect) DOM.semesterFilterSelect.value = "all";
        if (DOM.statusFilterSelect) DOM.statusFilterSelect.value = "all";
        if (DOM.eventSearchInput) DOM.eventSearchInput.value = "";
        if (DOM.clearSearchBtn) DOM.clearSearchBtn.style.display = "none";
        if (DOM.toggleSavedFilterBtn) DOM.toggleSavedFilterBtn.classList.remove("active");

        applyFilters();
        showToast("Filters reset to default view", "info");
      });
    }

    // Emoji Legend pills
    if (DOM.emojiLegendStrip) {
      DOM.emojiLegendStrip.addEventListener("click", (e) => {
        const pill = e.target.closest(".legend-emoji-pill");
        if (!pill) return;
        const emojiKey = pill.dataset.emoji || "all";
        if (state.selectedEmojiFilter === emojiKey) {
          state.selectedEmojiFilter = "all";
        } else {
          state.selectedEmojiFilter = emojiKey;
        }
        DOM.emojiLegendStrip.querySelectorAll(".legend-emoji-pill").forEach(p => {
          p.classList.toggle("active", p.dataset.emoji === state.selectedEmojiFilter);
        });
        applyFilters();
      });
    }

    // Event Source Toggle (All / Official / Student)
    if (DOM.eventSourceToggleGroup) {
      DOM.eventSourceToggleGroup.addEventListener("click", (e) => {
        const btn = e.target.closest(".source-toggle-btn");
        if (!btn) return;
        const source = btn.dataset.source || "all";
        state.selectedSourceFilter = source;
        DOM.eventSourceToggleGroup.querySelectorAll(".source-toggle-btn").forEach(b => {
          b.classList.toggle("active", b.dataset.source === source);
        });
        applyFilters();
      });
    }

    // Personalized Schedule toggle
    if (DOM.personalizedScheduleBtn) {
      DOM.personalizedScheduleBtn.addEventListener("click", () => {
        state.isPersonalizedActive = !state.isPersonalizedActive;
        updatePersonalizedUi();
        applyFilters();
        if (state.isPersonalizedActive) {
          showToast("Personalized schedule active for your branch & semester", "info");
        } else {
          showToast("Showing complete college-wide schedule", "info");
        }
      });
    }

    // Saved events filter toggle
    if (DOM.toggleSavedFilterBtn) {
      DOM.toggleSavedFilterBtn.addEventListener("click", () => {
        state.showSavedOnly = !state.showSavedOnly;
        DOM.toggleSavedFilterBtn.classList.toggle("active", state.showSavedOnly);
        applyFilters();
        if (state.showSavedOnly) {
          showToast(`Showing ${state.savedEventIds.size} saved events`, "info");
        }
      });
    }

    // Refresh & AMS Sync
    if (DOM.refreshEventsBtn) {
      DOM.refreshEventsBtn.addEventListener("click", () => {
        showToast("Synchronizing academic calendar...", "info");
        loadEventsData();
      });
    }

    if (DOM.syncAmsBtn) {
      DOM.syncAmsBtn.addEventListener("click", () => {
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (DOM.amsSyncTimestamp) {
          DOM.amsSyncTimestamp.textContent = `AMS Synced: Just Now (${timeNow})`;
        }
        showToast("Successfully synchronized with MITS AMS Notice Board!", "success");
        loadEventsData();
      });
    }

    if (DOM.exportAllIcsBtn) {
      DOM.exportAllIcsBtn.addEventListener("click", downloadAllIcs);
    }

    // Highlights Tabs
    if (DOM.tabThisWeekBtn) DOM.tabThisWeekBtn.addEventListener("click", () => switchTab("this-week"));
    if (DOM.tabExamsBtn) DOM.tabExamsBtn.addEventListener("click", () => switchTab("exams"));
    if (DOM.tabHolidaysBtn) DOM.tabHolidaysBtn.addEventListener("click", () => switchTab("holidays"));
    if (DOM.tabWorkshopsBtn) DOM.tabWorkshopsBtn.addEventListener("click", () => switchTab("workshops"));
    if (DOM.tabDeadlinesBtn) DOM.tabDeadlinesBtn.addEventListener("click", () => switchTab("deadlines"));
    if (DOM.tabFlagshipBtn) DOM.tabFlagshipBtn.addEventListener("click", () => switchTab("flagship"));

    // Modal close
    if (DOM.closeEventDetailsBtn) DOM.closeEventDetailsBtn.addEventListener("click", closeEventDetailsModal);
    if (DOM.closeModalBottomBtn) DOM.closeModalBottomBtn.addEventListener("click", closeEventDetailsModal);
    if (DOM.eventDetailsBackdrop) {
      DOM.eventDetailsBackdrop.addEventListener("click", (e) => {
        if (e.target === DOM.eventDetailsBackdrop) closeEventDetailsModal();
      });
    }

    // Admin modal
    if (DOM.openAddEventModalBtn) DOM.openAddEventModalBtn.addEventListener("click", () => openAdminModal());
    if (DOM.closeAdminModalBtn) DOM.closeAdminModalBtn.addEventListener("click", closeAdminModal);
    if (DOM.cancelAdminModalBtn) DOM.cancelAdminModalBtn.addEventListener("click", closeAdminModal);
    if (DOM.adminEventBackdrop) {
      DOM.adminEventBackdrop.addEventListener("click", (e) => {
        if (e.target === DOM.adminEventBackdrop) closeAdminModal();
      });
    }

    if (DOM.adminEventForm) {
      DOM.adminEventForm.addEventListener("submit", handleAdminFormSubmit);
    }

    // Initialize Smart Examination Finder
    initExamFinder();

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeEventDetailsModal();
        closeAdminModal();
      }
    });
  }

  // ================= 12. UTILITY FUNCTIONS =================
  function formatDateRange(startDate, endDate) {
    if (!endDate || startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
    return `${startDate.getDate()} ${MONTH_NAMES[startDate.getMonth()].slice(0, 3)} - ${endDate.getDate()} ${MONTH_NAMES[endDate.getMonth()].slice(0, 3)} ${endDate.getFullYear()}`;
  }

  function formatDateShort(date) {
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }

  function showToast(msg, type = "info") {
    if (!DOM.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-dot"></span>
      <span class="toast-text">${escapeHtml(msg)}</span>
    `;

    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ================= INITIALIZATION =================
  setupEventListeners();
  loadEventsData();
});
