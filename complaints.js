// CampusConnect — Smart Grievance & Complaint Redressal System (MITS Gwalior)
// =========================================================================

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initial State
  const state = {
    apiBase: "/api",
    activeRole: "Student",
    activeTab: "tab-my-complaints",
    currentUser: null,
    myComplaints: [],
    facultyComplaints: [],
    adminComplaints: [],
    routingRules: [],
    facultyList: [],
    selectedComplaint: null,
    adminFilterEscalatedOnly: false
  };

  // Resolve API Base URL
  async function resolveApiBase() {
    if (typeof getApiBase === "function") {
      state.apiBase = await getApiBase();
    } else {
      state.apiBase = window.location.protocol.startsWith("http") ? "/api" : "http://localhost:5000/api";
    }
  }
  await resolveApiBase();

  // Read Logged-in User
  const savedUserJson = localStorage.getItem("campusConnectUser");
  if (savedUserJson) {
    try {
      state.currentUser = JSON.parse(savedUserJson);
    } catch (e) {
      console.warn("Invalid user session json");
    }
  }

  // Fallback guest student session if unauthenticated in preview
  if (!state.currentUser) {
    state.currentUser = {
      _id: "guest_student_mits",
      id: "guest_student_mits",
      name: "MITS Student",
      email: "student@mitsgwl.ac.in",
      role: "Student",
      department: "Computer Science & Engineering",
      branch: "Computer Science & Design"
    };
  }

  // Determine initial role
  const rawRole = (state.currentUser.role || "Student").trim().toLowerCase();
  if (["admin"].includes(rawRole)) {
    state.activeRole = "Admin";
  } else if (["faculty", "professor"].includes(rawRole)) {
    state.activeRole = "Faculty";
  } else {
    state.activeRole = "Student";
  }

  // DOM Elements Cache
  const DOM = {
    // Stats Ribbon
    statTotal: document.getElementById("statTotal"),
    statReview: document.getElementById("statReview"),
    statProgress: document.getElementById("statProgress"),
    statResolved: document.getElementById("statResolved"),
    statEscalated: document.getElementById("statEscalated"),
    statRate: document.getElementById("statRate"),

    // Identity Bar
    activeUserName: document.getElementById("activeUserName"),
    activeUserRoleBadge: document.getElementById("activeUserRoleBadge"),
    activeUserDept: document.getElementById("activeUserDept"),
    switchStudentBtn: document.getElementById("switchStudentBtn"),
    switchFacultyBtn: document.getElementById("switchFacultyBtn"),
    switchAdminBtn: document.getElementById("switchAdminBtn"),

    // Navigation Tabs
    btnTabMyComplaints: document.getElementById("btnTabMyComplaints"),
    btnTabSubmit: document.getElementById("btnTabSubmit"),
    btnTabFacultyAssigned: document.getElementById("btnTabFacultyAssigned"),
    btnTabAdminAll: document.getElementById("btnTabAdminAll"),
    btnTabAdminRouting: document.getElementById("btnTabAdminRouting"),
    btnTabTrack: document.getElementById("btnTabTrack"),
    btnTabHelpline: document.getElementById("btnTabHelpline"),

    // Badges
    badgeMyCount: document.getElementById("badgeMyCount"),
    badgeFacultyCount: document.getElementById("badgeFacultyCount"),
    badgeAdminCount: document.getElementById("badgeAdminCount"),

    // Tab Panes
    paneMyComplaints: document.getElementById("paneMyComplaints"),
    paneSubmit: document.getElementById("paneSubmit"),
    paneFacultyAssigned: document.getElementById("paneFacultyAssigned"),
    paneAdminAll: document.getElementById("paneAdminAll"),
    paneAdminRouting: document.getElementById("paneAdminRouting"),
    paneTrack: document.getElementById("paneTrack"),
    paneHelpline: document.getElementById("paneHelpline"),

    // Lists
    myComplaintsList: document.getElementById("myComplaintsList"),
    facultyComplaintsList: document.getElementById("facultyComplaintsList"),
    adminComplaintsList: document.getElementById("adminComplaintsList"),
    routingRulesTableBody: document.getElementById("routingRulesTableBody"),

    // Filters
    mySearchInput: document.getElementById("mySearchInput"),
    myStatusFilter: document.getElementById("myStatusFilter"),
    myCategoryFilter: document.getElementById("myCategoryFilter"),
    facultySearchInput: document.getElementById("facultySearchInput"),
    facultyStatusFilter: document.getElementById("facultyStatusFilter"),
    facultyPriorityFilter: document.getElementById("facultyPriorityFilter"),
    adminSearchInput: document.getElementById("adminSearchInput"),
    adminDeptFilter: document.getElementById("adminDeptFilter"),
    adminStatusFilter: document.getElementById("adminStatusFilter"),
    adminFilterEscalatedBtn: document.getElementById("adminFilterEscalatedBtn"),

    // Form
    newComplaintForm: document.getElementById("newComplaintForm"),
    formAutoDeptName: document.getElementById("formAutoDeptName"),
    formAutoStudentName: document.getElementById("formAutoStudentName"),
    formCategory: document.getElementById("formCategory"),
    formDepartment: document.getElementById("formDepartment"),
    formTitle: document.getElementById("formTitle"),
    formLocation: document.getElementById("formLocation"),
    formDescription: document.getElementById("formDescription"),
    formPriority: document.getElementById("formPriority"),
    formEvidenceUrl: document.getElementById("formEvidenceUrl"),
    formEvidenceFile: document.getElementById("formEvidenceFile"),
    formIsAnonymous: document.getElementById("formIsAnonymous"),
    formIsConfidential: document.getElementById("formIsConfidential"),
    evidenceUploadStatus: document.getElementById("evidenceUploadStatus"),
    quickNewGrievanceBtn: document.getElementById("quickNewGrievanceBtn"),

    // Track
    trackInput: document.getElementById("trackInput"),
    btnExecuteTrack: document.getElementById("btnExecuteTrack"),
    trackResultContainer: document.getElementById("trackResultContainer"),

    // Modals
    complaintDetailsModal: document.getElementById("complaintDetailsModal"),
    closeComplaintDetailsBtn: document.getElementById("closeComplaintDetailsBtn"),
    modalComplaintId: document.getElementById("modalComplaintId"),
    modalStatusBadge: document.getElementById("modalStatusBadge"),
    modalPriorityBadge: document.getElementById("modalPriorityBadge"),
    modalEscalatedBadge: document.getElementById("modalEscalatedBadge"),
    modalConfidentialBadge: document.getElementById("modalConfidentialBadge"),
    modalTitle: document.getElementById("modalTitle"),
    modalDepartment: document.getElementById("modalDepartment"),
    modalCategory: document.getElementById("modalCategory"),
    modalStudentName: document.getElementById("modalStudentName"),
    modalStudentDept: document.getElementById("modalStudentDept"),
    modalAssignedTo: document.getElementById("modalAssignedTo"),
    modalLocation: document.getElementById("modalLocation"),
    modalSubmittedDate: document.getElementById("modalSubmittedDate"),
    modalStepTracker: document.getElementById("modalStepTracker"),
    modalDescription: document.getElementById("modalDescription"),
    modalEvidenceWrap: document.getElementById("modalEvidenceWrap"),
    modalEvidenceContent: document.getElementById("modalEvidenceContent"),
    modalFacultyRemarksList: document.getElementById("modalFacultyRemarksList"),
    modalActionTimeline: document.getElementById("modalActionTimeline"),
    btnModalAddRemark: document.getElementById("btnModalAddRemark"),
    btnModalUpdateStatus: document.getElementById("btnModalUpdateStatus"),
    btnModalAssignFaculty: document.getElementById("btnModalAssignFaculty"),
    btnModalEscalate: document.getElementById("btnModalEscalate"),

    // Update Status Modal
    updateStatusModal: document.getElementById("updateStatusModal"),
    closeUpdateStatusBtn: document.getElementById("closeUpdateStatusBtn"),
    cancelUpdateStatusBtn: document.getElementById("cancelUpdateStatusBtn"),
    updateStatusForm: document.getElementById("updateStatusForm"),
    statusComplaintId: document.getElementById("statusComplaintId"),
    newStatusSelect: document.getElementById("newStatusSelect"),
    statusRemarksText: document.getElementById("statusRemarksText"),

    // Assign Faculty Modal
    assignFacultyModal: document.getElementById("assignFacultyModal"),
    closeAssignModalBtn: document.getElementById("closeAssignModalBtn"),
    cancelAssignBtn: document.getElementById("cancelAssignBtn"),
    assignFacultyForm: document.getElementById("assignFacultyForm"),
    assignComplaintId: document.getElementById("assignComplaintId"),
    assignFacultySelect: document.getElementById("assignFacultySelect"),
    assignInstructionsText: document.getElementById("assignInstructionsText"),

    // Routing Rule Modal
    routingRuleModal: document.getElementById("routingRuleModal"),
    closeRoutingModalBtn: document.getElementById("closeRoutingModalBtn"),
    cancelRoutingModalBtn: document.getElementById("cancelRoutingModalBtn"),
    btnOpenNewRoutingRuleModal: document.getElementById("btnOpenNewRoutingRuleModal"),
    routingRuleForm: document.getElementById("routingRuleForm"),
    routingRuleEditId: document.getElementById("routingRuleEditId"),
    routingDeptSelect: document.getElementById("routingDeptSelect"),
    routingCategorySelect: document.getElementById("routingCategorySelect"),
    routingFacultySelect: document.getElementById("routingFacultySelect"),
    routingDesignationInput: document.getElementById("routingDesignationInput"),
    routingIsGrievanceOfficer: document.getElementById("routingIsGrievanceOfficer"),

    // Toast Container
    toastContainer: document.getElementById("toastContainer")
  };

  // =========================================================================
  // 2. Initial Setup & Identity Management
  // =========================================================================
  function updateIdentityBar() {
    if (!state.currentUser) return;
    
    // Auto-detect student department from user profile
    const studentDept = state.currentUser.department && state.currentUser.department !== "Not specified"
      ? state.currentUser.department
      : (state.currentUser.branch || "Computer Science & Engineering");

    if (DOM.activeUserName) DOM.activeUserName.textContent = state.currentUser.name || "MITS Member";
    if (DOM.activeUserDept) DOM.activeUserDept.textContent = `Department: ${studentDept}`;

    if (DOM.formAutoStudentName) DOM.formAutoStudentName.textContent = state.currentUser.name || "Student";
    if (DOM.formAutoDeptName) DOM.formAutoDeptName.textContent = studentDept;

    // Preselect in submit form department
    if (DOM.formDepartment && studentDept) {
      for (let i = 0; i < DOM.formDepartment.options.length; i++) {
        if (DOM.formDepartment.options[i].value.toLowerCase().includes(studentDept.toLowerCase()) ||
            studentDept.toLowerCase().includes(DOM.formDepartment.options[i].value.toLowerCase())) {
          DOM.formDepartment.selectedIndex = i;
          break;
        }
      }
    }

    // Role badge
    if (DOM.activeUserRoleBadge) {
      DOM.activeUserRoleBadge.className = "role-badge-pill";
      if (state.activeRole === "Admin") {
        DOM.activeUserRoleBadge.classList.add("role-pill-admin");
        DOM.activeUserRoleBadge.textContent = "ADMINISTRATOR";
      } else if (state.activeRole === "Faculty") {
        DOM.activeUserRoleBadge.classList.add("role-pill-faculty");
        DOM.activeUserRoleBadge.textContent = "FACULTY / PROFESSOR";
      } else {
        DOM.activeUserRoleBadge.classList.add("role-pill-student");
        DOM.activeUserRoleBadge.textContent = "STUDENT";
      }
    }

    // Role switcher active classes
    if (DOM.switchStudentBtn) DOM.switchStudentBtn.classList.toggle("active", state.activeRole === "Student");
    if (DOM.switchFacultyBtn) DOM.switchFacultyBtn.classList.toggle("active", state.activeRole === "Faculty");
    if (DOM.switchAdminBtn) DOM.switchAdminBtn.classList.toggle("active", state.activeRole === "Admin");

    // Show/hide relevant tabs
    if (DOM.btnTabFacultyAssigned) {
      DOM.btnTabFacultyAssigned.style.display = (state.activeRole === "Faculty" || state.activeRole === "Admin") ? "inline-flex" : "none";
    }
    if (DOM.btnTabAdminAll) {
      DOM.btnTabAdminAll.style.display = state.activeRole === "Admin" ? "inline-flex" : "none";
    }
    if (DOM.btnTabAdminRouting) {
      DOM.btnTabAdminRouting.style.display = state.activeRole === "Admin" ? "inline-flex" : "none";
    }

    // Adjust default tab per role
    if (state.activeRole === "Faculty") {
      switchTab("tab-faculty-assigned");
    } else if (state.activeRole === "Admin") {
      switchTab("tab-admin-all");
    } else {
      switchTab("tab-my-complaints");
    }
  }

  // =========================================================================
  // 3. Tab Navigation
  // =========================================================================
  function switchTab(tabId) {
    state.activeTab = tabId;

    const tabs = [
      { id: "tab-my-complaints", btn: DOM.btnTabMyComplaints, pane: DOM.paneMyComplaints },
      { id: "tab-submit", btn: DOM.btnTabSubmit, pane: DOM.paneSubmit },
      { id: "tab-faculty-assigned", btn: DOM.btnTabFacultyAssigned, pane: DOM.paneFacultyAssigned },
      { id: "tab-admin-all", btn: DOM.btnTabAdminAll, pane: DOM.paneAdminAll },
      { id: "tab-admin-routing", btn: DOM.btnTabAdminRouting, pane: DOM.paneAdminRouting },
      { id: "tab-track", btn: DOM.btnTabTrack, pane: DOM.paneTrack },
      { id: "tab-helpline", btn: DOM.btnTabHelpline, pane: DOM.paneHelpline }
    ];

    tabs.forEach(t => {
      const isActive = t.id === tabId;
      if (t.btn) t.btn.classList.toggle("active", isActive);
      if (t.pane) t.pane.style.display = isActive ? "block" : "none";
    });

    // Refresh content for active tab
    if (tabId === "tab-my-complaints") loadMyComplaints();
    if (tabId === "tab-faculty-assigned") loadFacultyComplaints();
    if (tabId === "tab-admin-all") loadAdminComplaints();
    if (tabId === "tab-admin-routing") loadRoutingRules();
  }

  // =========================================================================
  // 4. Data Loading & API Calls
  // =========================================================================

  // A. Load Statistics Ribbon
  async function loadStats() {
    try {
      const res = await fetch(`${state.apiBase}/complaints/meta/stats?userId=${state.currentUser._id}`);
      if (!res.ok) return;
      const data = await res.json();

      if (DOM.statTotal) DOM.statTotal.textContent = data.total ?? 0;
      if (DOM.statReview) DOM.statReview.textContent = data.underReview ?? 0;
      if (DOM.statProgress) DOM.statProgress.textContent = data.inProgress ?? 0;
      if (DOM.statResolved) DOM.statResolved.textContent = data.resolved ?? 0;
      if (DOM.statEscalated) DOM.statEscalated.textContent = data.escalated ?? 0;
      if (DOM.statRate) DOM.statRate.textContent = data.resolutionRate || "96%";
    } catch (err) {
      console.warn("Could not load stats:", err.message);
    }
  }

  // B. Load Faculty List (for Admin Assignment & Routing forms)
  async function loadFacultyList() {
    try {
      const res = await fetch(`${state.apiBase}/complaints/meta/faculty-list`);
      if (!res.ok) return;
      state.facultyList = await res.json();

      // Populate assignment modal select
      if (DOM.assignFacultySelect) {
        DOM.assignFacultySelect.innerHTML = '<option value="">Select Faculty Coordinator...</option>' +
          state.facultyList.map(f => `<option value="${f._id}">Prof. ${escapeHtml(f.name)} (${escapeHtml(f.department || f.role)})</option>`).join("");
      }

      // Populate routing modal select
      if (DOM.routingFacultySelect) {
        DOM.routingFacultySelect.innerHTML = '<option value="">Select Responsible Faculty...</option>' +
          state.facultyList.map(f => `<option value="${f._id}">Prof. ${escapeHtml(f.name)} (${escapeHtml(f.department || f.role)})</option>`).join("");
      }
    } catch (err) {
      console.warn("Could not load faculty list:", err.message);
    }
  }

  // C. Load My Complaints (Student)
  async function loadMyComplaints() {
    if (!DOM.myComplaintsList) return;
    DOM.myComplaintsList.innerHTML = '<div class="empty-highlight-placeholder"><span class="eh-icon">⏳</span><p>Loading your grievances...</p></div>';

    try {
      const status = DOM.myStatusFilter ? DOM.myStatusFilter.value : "all";
      const category = DOM.myCategoryFilter ? DOM.myCategoryFilter.value : "all";
      const search = DOM.mySearchInput ? DOM.mySearchInput.value : "";

      let url = `${state.apiBase}/complaints?userId=${state.currentUser._id}`;
      if (status !== "all") url += `&status=${encodeURIComponent(status)}`;
      if (category !== "all") url += `&category=${encodeURIComponent(category)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch complaints");
      state.myComplaints = await res.json();

      if (DOM.badgeMyCount) DOM.badgeMyCount.textContent = state.myComplaints.length;

      if (state.myComplaints.length === 0) {
        DOM.myComplaintsList.innerHTML = `
          <div class="empty-highlight-placeholder">
            <span class="eh-icon">🛡️</span>
            <h4>No grievances submitted yet</h4>
            <p>You have not registered any grievances under this account. If you encounter any academic, hostel, or campus infrastructure issues, click below to submit a formal report.</p>
            <button class="btn btn-primary btn-sm mt-3" id="emptySubmitBtn">+ Submit a Grievance</button>
          </div>
        `;
        const eBtn = document.getElementById("emptySubmitBtn");
        if (eBtn) eBtn.addEventListener("click", () => switchTab("tab-submit"));
        return;
      }

      DOM.myComplaintsList.innerHTML = state.myComplaints.map(c => renderComplaintCard(c, "student")).join("");
      attachCardEventListeners(DOM.myComplaintsList);
    } catch (err) {
      DOM.myComplaintsList.innerHTML = `<div class="empty-highlight-placeholder"><span class="eh-icon">⚠️</span><p>Could not load grievances: ${escapeHtml(err.message)}</p></div>`;
    }
  }

  // D. Load Faculty Assigned Complaints
  async function loadFacultyComplaints() {
    if (!DOM.facultyComplaintsList) return;
    DOM.facultyComplaintsList.innerHTML = '<div class="empty-highlight-placeholder"><span class="eh-icon">⏳</span><p>Loading assigned grievances...</p></div>';

    try {
      const status = DOM.facultyStatusFilter ? DOM.facultyStatusFilter.value : "all";
      const priority = DOM.facultyPriorityFilter ? DOM.facultyPriorityFilter.value : "all";
      const search = DOM.facultySearchInput ? DOM.facultySearchInput.value : "";

      // For faculty perspective: find a faculty ID if current user is not marked as professor
      let facUserId = state.currentUser._id;
      if (state.activeRole === "Faculty" && rawRole !== "professor" && rawRole !== "faculty") {
        const testFac = state.facultyList.find(f => f.name.includes("Sharma") || f.role === "Professor");
        if (testFac) facUserId = testFac._id;
      }

      let url = `${state.apiBase}/complaints?userId=${facUserId}`;
      if (status !== "all") url += `&status=${encodeURIComponent(status)}`;
      if (priority !== "all") url += `&priority=${encodeURIComponent(priority)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch assigned complaints");
      state.facultyComplaints = await res.json();

      if (DOM.badgeFacultyCount) DOM.badgeFacultyCount.textContent = state.facultyComplaints.length;

      if (state.facultyComplaints.length === 0) {
        DOM.facultyComplaintsList.innerHTML = `
          <div class="empty-highlight-placeholder">
            <span class="eh-icon">☕</span>
            <h4>No active grievances assigned to you</h4>
            <p>All student grievances in your departmental portfolio have either been addressed or no open reports are pending review.</p>
          </div>
        `;
        return;
      }

      DOM.facultyComplaintsList.innerHTML = state.facultyComplaints.map(c => renderComplaintCard(c, "faculty")).join("");
      attachCardEventListeners(DOM.facultyComplaintsList);
    } catch (err) {
      DOM.facultyComplaintsList.innerHTML = `<div class="empty-highlight-placeholder"><span class="eh-icon">⚠️</span><p>Could not load assigned grievances: ${escapeHtml(err.message)}</p></div>`;
    }
  }

  // E. Load Admin All Complaints
  async function loadAdminComplaints() {
    if (!DOM.adminComplaintsList) return;
    DOM.adminComplaintsList.innerHTML = '<div class="empty-highlight-placeholder"><span class="eh-icon">⏳</span><p>Loading college registry...</p></div>';

    try {
      // For Admin perspective: pass admin user ID or find admin user
      let adminUserId = state.currentUser._id;
      if (state.activeRole === "Admin" && rawRole !== "admin") {
        const testAdmin = state.facultyList.find(f => f.role === "Admin") || state.facultyList[0];
        if (testAdmin) adminUserId = testAdmin._id;
      }

      const status = DOM.adminStatusFilter ? DOM.adminStatusFilter.value : "all";
      const dept = DOM.adminDeptFilter ? DOM.adminDeptFilter.value : "all";
      const search = DOM.adminSearchInput ? DOM.adminSearchInput.value : "";

      let url = `${state.apiBase}/complaints?userId=${adminUserId}`;
      if (status !== "all") url += `&status=${encodeURIComponent(status)}`;
      if (dept !== "all") url += `&department=${encodeURIComponent(dept)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (state.adminFilterEscalatedOnly) url += `&isEscalated=true`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch registry");
      state.adminComplaints = await res.json();

      if (DOM.badgeAdminCount) DOM.badgeAdminCount.textContent = state.adminComplaints.length;

      if (state.adminComplaints.length === 0) {
        DOM.adminComplaintsList.innerHTML = `
          <div class="empty-highlight-placeholder">
            <span class="eh-icon">📋</span>
            <h4>No complaints match the selected filter</h4>
            <p>Try resetting department or status filters to view full campus records.</p>
          </div>
        `;
        return;
      }

      DOM.adminComplaintsList.innerHTML = state.adminComplaints.map(c => renderComplaintCard(c, "admin")).join("");
      attachCardEventListeners(DOM.adminComplaintsList);
    } catch (err) {
      DOM.adminComplaintsList.innerHTML = `<div class="empty-highlight-placeholder"><span class="eh-icon">⚠️</span><p>Could not load registry: ${escapeHtml(err.message)}</p></div>`;
    }
  }

  // F. Load Faculty Routing Rules (Admin)
  async function loadRoutingRules() {
    if (!DOM.routingRulesTableBody) return;
    DOM.routingRulesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading policies...</td></tr>';

    try {
      let adminUserId = state.currentUser._id;
      const testAdmin = state.facultyList.find(f => f.role === "Admin") || state.facultyList[0];
      if (testAdmin) adminUserId = testAdmin._id;

      const res = await fetch(`${state.apiBase}/complaints/routing/rules?userId=${adminUserId}`);
      if (!res.ok) throw new Error("Failed to fetch routing rules");
      state.routingRules = await res.json();

      if (state.routingRules.length === 0) {
        DOM.routingRulesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px;">No routing rules configured. Click "+ Add Routing Rule" to map faculty responsibilities.</td></tr>';
        return;
      }

      DOM.routingRulesTableBody.innerHTML = state.routingRules.map(r => `
        <tr>
          <td><strong>${escapeHtml(r.department)}</strong></td>
          <td><span class="complaint-id-chip" style="font-size:11px;">${escapeHtml(r.category)}</span></td>
          <td>
            <div style="font-weight: 600; color: #f1f5f9;">Prof. ${escapeHtml(r.assignedFacultyName)}</div>
            <div style="font-size: 11px; color: #94a3b8;">${escapeHtml(r.assignedFacultyEmail || "")}</div>
          </td>
          <td>${escapeHtml(r.designation || "Grievance Coordinator")}</td>
          <td>
            ${r.isGrievanceOfficer
              ? '<span class="complaint-confidential-badge" style="font-size: 10px;">🔒 Grievance Officer</span>'
              : '<span style="color: #64748b; font-size: 11px;">Standard Portfolio</span>'}
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-outline btn-xs btn-delete-rule" data-id="${r._id}" style="color: #f87171; border-color: rgba(248, 113, 113, 0.4);" title="Delete Rule">Delete</button>
            </div>
          </td>
        </tr>
      `).join("");

      // Attach delete rule listeners
      DOM.routingRulesTableBody.querySelectorAll(".btn-delete-rule").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (!confirm("Are you sure you want to remove this faculty routing policy?")) return;
          try {
            const delRes = await fetch(`${state.apiBase}/complaints/routing/rules/${btn.dataset.id}?userId=${adminUserId}`, {
              method: "DELETE"
            });
            if (!delRes.ok) throw new Error("Failed to delete rule");
            showToast("Routing rule deleted successfully", "info");
            loadRoutingRules();
          } catch (e) {
            showToast(e.message, "error");
          }
        });
      });
    } catch (err) {
      DOM.routingRulesTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #f87171; padding: 20px;">Error loading rules: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // =========================================================================
  // 5. Renderers: Complaint Card & Step Progress
  // =========================================================================
  function renderComplaintCard(c, viewContext = "student") {
    const isEsc = Boolean(c.isEscalated);
    const isConf = Boolean(c.isConfidential);
    const isAnon = Boolean(c.isAnonymous);
    const dateFormatted = new Date(c.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    const statusClass = `status-${slugify(c.status || "submitted")}`;
    const priorityClass = `priority-${slugify(c.priority || "medium")}`;

    const isAssigned = c.assignedTo && c.assignedToName && !c.assignedToName.includes("Unassigned");

    return `
      <div class="complaint-card ${isEsc ? "escalated" : ""}" data-id="${c._id}">
        <div class="complaint-card-header">
          <div class="complaint-meta-badges">
            <span class="complaint-id-chip">${escapeHtml(c.complaintId)}</span>
            <span class="status-badge ${statusClass}">
              <span>●</span> ${escapeHtml(c.status)}
            </span>
            <span class="priority-pill ${priorityClass}">
              ${escapeHtml(c.priority || "Medium")}
            </span>
            ${isEsc ? '<span class="complaint-escalated-badge">🚨 Escalated</span>' : ''}
            ${isConf ? '<span class="complaint-confidential-badge">🔒 Confidential</span>' : ''}
            ${isAnon ? '<span class="complaint-anon-badge">🎭 Anonymous</span>' : ''}
          </div>
          <span style="font-size: 11px; color: var(--text-dim); font-family: var(--mono);">${dateFormatted}</span>
        </div>

        <h3 class="complaint-title">${escapeHtml(c.title)}</h3>
        <p class="complaint-desc">${escapeHtml(c.description)}</p>

        <!-- Status Step Tracker Progress Bar -->
        ${renderStepTracker(c.status)}

        <div class="complaint-meta-grid">
          <div><strong>Department:</strong> ${escapeHtml(c.department || "General")}</div>
          <div><strong>Category:</strong> ${escapeHtml(c.category || "General")}</div>
          <div>
            <strong>Assigned Officer:</strong> 
            ${isAssigned ? `<span style="color:#38bdf8;">Prof. ${escapeHtml(c.assignedToName)}</span>` : '<span style="color:#fbbf24;">Pending Allocation</span>'}
          </div>
          <div>
            <strong>Complainant:</strong> 
            ${isAnon && viewContext !== "student" ? '<span style="color:#94a3b8; font-style:italic;">Anonymous Student</span>' : escapeHtml(c.studentName)}
          </div>
        </div>

        <div class="complaint-card-footer">
          <div style="font-size: 11px; color: var(--text-dim); font-family: var(--mono);">
            ${c.actionHistory ? `${c.actionHistory.length} lifecycle action${c.actionHistory.length !== 1 ? 's' : ''} logged` : ''}
          </div>
          <div class="complaint-card-actions">
            <button class="btn btn-outline btn-xs btn-view-details" data-id="${c._id}">
              <span>🔍 View History &amp; Details</span>
            </button>
            ${(viewContext === "faculty" || viewContext === "admin") ? `
              <button class="btn btn-outline btn-xs btn-quick-status" data-id="${c._id}" style="color: #fbbf24; border-color: rgba(251, 191, 36, 0.4);">
                <span>✍️ Update Status</span>
              </button>
            ` : ""}
            ${viewContext === "admin" ? `
              <button class="btn btn-outline btn-xs btn-quick-assign" data-id="${c._id}" style="color: #c084fc; border-color: rgba(168, 85, 247, 0.4);">
                <span>👤 Assign</span>
              </button>
            ` : ""}
            ${!isEsc ? `
              <button class="btn btn-outline btn-xs btn-quick-escalate" data-id="${c._id}" style="color: #f87171; border-color: rgba(248, 113, 113, 0.4);">
                <span>🚨 Escalate</span>
              </button>
            ` : ""}
          </div>
        </div>
      </div>
    `;
  }

  // Real-time Status Step Tracker Progress Bar Renderer
  function renderStepTracker(currentStatus) {
    const steps = [
      { key: "Submitted", label: "1. Submitted" },
      { key: "Under Review", label: "2. Under Review" },
      { key: "In Progress", label: "3. In Progress" },
      { key: "Resolved", label: "4. Resolved" }
    ];

    if (currentStatus === "Rejected") {
      return `
        <div class="status-step-tracker">
          <div class="step-item completed">
            <div class="step-circle">✓</div>
            <div class="step-label">Submitted</div>
          </div>
          <div class="step-item rejected">
            <div class="step-circle">✕</div>
            <div class="step-label">Rejected</div>
          </div>
        </div>
      `;
    }

    const statusWeights = {
      "Submitted": 1,
      "Under Review": 2,
      "In Progress": 3,
      "Resolved": 4
    };

    const currentWeight = statusWeights[currentStatus] || 1;

    return `
      <div class="status-step-tracker">
        ${steps.map((st, idx) => {
          const stepWeight = idx + 1;
          let cls = "";
          let icon = String(stepWeight);
          if (stepWeight < currentWeight) {
            cls = "completed";
            icon = "✓";
          } else if (stepWeight === currentWeight) {
            cls = "current";
          }
          return `
            <div class="step-item ${cls}">
              <div class="step-circle">${icon}</div>
              <div class="step-label">${st.label}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  // Attach click listeners to cards inside container
  function attachCardEventListeners(container) {
    if (!container) return;

    container.querySelectorAll(".btn-view-details").forEach(btn => {
      btn.addEventListener("click", () => openComplaintDetailsModal(btn.dataset.id));
    });

    container.querySelectorAll(".btn-quick-status").forEach(btn => {
      btn.addEventListener("click", () => openUpdateStatusModal(btn.dataset.id));
    });

    container.querySelectorAll(".btn-quick-assign").forEach(btn => {
      btn.addEventListener("click", () => openAssignFacultyModal(btn.dataset.id));
    });

    container.querySelectorAll(".btn-quick-escalate").forEach(btn => {
      btn.addEventListener("click", () => triggerEscalation(btn.dataset.id));
    });
  }

  // =========================================================================
  // 6. Complaint Details Modal
  // =========================================================================
  async function openComplaintDetailsModal(complaintId) {
    try {
      const res = await fetch(`${state.apiBase}/complaints/${complaintId}?userId=${state.currentUser._id}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Could not retrieve details");
      }
      const c = await res.json();
      state.selectedComplaint = c;

      // Populate Modal Fields
      DOM.modalComplaintId.textContent = `ID: ${c.complaintId}`;
      DOM.modalStatusBadge.textContent = c.status;
      DOM.modalStatusBadge.className = `status-badge status-${slugify(c.status)}`;
      DOM.modalPriorityBadge.textContent = c.priority || "Medium";
      DOM.modalPriorityBadge.className = `priority-pill priority-${slugify(c.priority || "medium")}`;

      DOM.modalEscalatedBadge.style.display = c.isEscalated ? "inline-flex" : "none";
      DOM.modalConfidentialBadge.style.display = c.isConfidential ? "inline-flex" : "none";

      DOM.modalTitle.textContent = c.title;
      DOM.modalDepartment.textContent = c.department;
      DOM.modalCategory.textContent = c.category;
      DOM.modalStudentName.textContent = c.isAnonymous ? "Anonymous Student" : c.studentName;
      DOM.modalStudentDept.textContent = c.studentDepartment || "Student";
      DOM.modalAssignedTo.textContent = c.assignedToName ? `Prof. ${c.assignedToName} (${c.assignedBy || "Auto-routed"})` : "Pending Allocation";
      DOM.modalLocation.textContent = c.location || "MITS Campus";
      DOM.modalSubmittedDate.textContent = new Date(c.createdAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      });

      // Step Tracker
      DOM.modalStepTracker.innerHTML = renderStepTracker(c.status);

      // Description
      DOM.modalDescription.textContent = c.description;

      // Evidence
      if (c.evidenceUrl) {
        DOM.modalEvidenceWrap.style.display = "block";
        const isImg = c.evidenceUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || c.evidenceUrl.startsWith("data:image");
        if (isImg) {
          DOM.modalEvidenceContent.innerHTML = `
            <div style="margin-top: 8px;">
              <img src="${c.evidenceUrl}" alt="Evidence" style="max-height: 220px; border-radius: 8px; border: 1px solid var(--line); display: block;" onerror="this.style.display='none';">
              <a href="${c.evidenceUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-xs mt-2" style="display:inline-flex; align-items:center; gap:6px;">
                <span>View Full Resolution Attachment ↗</span>
              </a>
            </div>
          `;
        } else {
          DOM.modalEvidenceContent.innerHTML = `
            <a href="${c.evidenceUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="display:inline-flex; align-items:center; gap:6px;">
              <span>📄 Open Attached Evidence File ↗</span>
            </a>
          `;
        }
      } else {
        DOM.modalEvidenceWrap.style.display = "none";
      }

      // Faculty Remarks
      if (c.facultyRemarks && c.facultyRemarks.length > 0) {
        DOM.modalFacultyRemarksList.innerHTML = c.facultyRemarks.map(r => `
          <div style="background: rgba(168, 85, 247, 0.1); border-left: 3px solid #a855f7; padding: 10px 14px; border-radius: 4px 8px 8px 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="color: #c084fc; font-size: 12px;">Prof. ${escapeHtml(r.facultyName)} (${escapeHtml(r.facultyRole || "Faculty")})</strong>
              <span style="font-size: 11px; color: #94a3b8; font-family: var(--mono);">${new Date(r.createdAt).toLocaleString()}</span>
            </div>
            <div style="font-size: 13px; color: #f1f5f9;">${escapeHtml(r.remark)}</div>
            ${r.statusAtRemark ? `<span style="font-size: 10px; color: #fbbf24; font-family: var(--mono); margin-top: 4px; display: block;">Status at time: ${escapeHtml(r.statusAtRemark)}</span>` : ""}
          </div>
        `).join("");
        DOM.modalFacultyRemarksSection.style.display = "block";
      } else {
        DOM.modalFacultyRemarksList.innerHTML = '<div style="font-size: 12px; color: #64748b; font-style: italic;">No faculty remarks have been posted yet.</div>';
      }

      // Action History Timeline
      if (c.actionHistory && c.actionHistory.length > 0) {
        DOM.modalActionTimeline.innerHTML = c.actionHistory.map(a => `
          <div class="timeline-entry">
            <div class="timeline-dot"></div>
            <div class="timeline-card">
              <div class="timeline-header">
                <span class="timeline-action-title">${escapeHtml(a.action)}</span>
                <span class="timeline-timestamp">${new Date(a.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div class="timeline-performer">By: <strong>${escapeHtml(a.performedByName)}</strong> (${escapeHtml(a.performedByRole || "System")})</div>
              ${a.remarks ? `<div class="timeline-remarks">"${escapeHtml(a.remarks)}"</div>` : ""}
            </div>
          </div>
        `).join("");
      } else {
        DOM.modalActionTimeline.innerHTML = '<div style="font-size: 12px; color: #64748b;">No action logs recorded.</div>';
      }

      // Modal bottom action buttons based on active role
      DOM.btnModalUpdateStatus.style.display = (state.activeRole === "Faculty" || state.activeRole === "Admin") ? "inline-flex" : "none";
      DOM.btnModalAssignFaculty.style.display = state.activeRole === "Admin" ? "inline-flex" : "none";
      DOM.btnModalEscalate.style.display = !c.isEscalated ? "inline-flex" : "none";

      DOM.complaintDetailsModal.style.display = "flex";
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function closeComplaintDetailsModal() {
    if (DOM.complaintDetailsModal) {
      DOM.complaintDetailsModal.style.display = "none";
    }
  }

  // =========================================================================
  // 7. Status Update Modal (Faculty / Admin)
  // =========================================================================
  function openUpdateStatusModal(complaintId) {
    if (!complaintId) return;
    DOM.statusComplaintId.value = complaintId;
    DOM.statusRemarksText.value = "";
    if (DOM.updateStatusModal) {
      DOM.updateStatusModal.style.display = "flex";
    }
  }

  function closeUpdateStatusModal() {
    if (DOM.updateStatusModal) {
      DOM.updateStatusModal.style.display = "none";
    }
  }

  async function handleStatusFormSubmit(e) {
    e.preventDefault();
    const id = DOM.statusComplaintId.value;
    const newStatus = DOM.newStatusSelect.value;
    const remarks = DOM.statusRemarksText.value.trim();

    if (!remarks) {
      showToast("Please provide official remarks for the status update.", "error");
      DOM.statusRemarksText.focus();
      return;
    }

    try {
      const res = await fetch(`${state.apiBase}/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          remarks: remarks,
          userId: state.currentUser._id
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update status");
      }

      showToast(`Grievance status updated to "${newStatus}"!`, "success");
      closeUpdateStatusModal();
      closeComplaintDetailsModal();

      loadStats();
      if (state.activeTab === "tab-my-complaints") loadMyComplaints();
      if (state.activeTab === "tab-faculty-assigned") loadFacultyComplaints();
      if (state.activeTab === "tab-admin-all") loadAdminComplaints();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // =========================================================================
  // 8. Assign Faculty Modal (Admin Only)
  // =========================================================================
  function openAssignFacultyModal(complaintId) {
    if (!complaintId) return;
    DOM.assignComplaintId.value = complaintId;
    DOM.assignInstructionsText.value = "";
    if (DOM.assignFacultyModal) {
      DOM.assignFacultyModal.style.display = "flex";
    }
  }

  function closeAssignFacultyModal() {
    if (DOM.assignFacultyModal) {
      DOM.assignFacultyModal.style.display = "none";
    }
  }

  async function handleAssignFormSubmit(e) {
    e.preventDefault();
    const id = DOM.assignComplaintId.value;
    const facultyId = DOM.assignFacultySelect.value;
    const instructions = DOM.assignInstructionsText.value.trim();

    if (!facultyId) {
      showToast("Please select a faculty member from the directory.", "error");
      return;
    }

    try {
      const res = await fetch(`${state.apiBase}/complaints/${id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: facultyId,
          remarks: instructions,
          userId: state.currentUser._id
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to assign faculty member");
      }

      showToast("Faculty assigned successfully. In-app notice dispatched.", "success");
      closeAssignFacultyModal();
      closeComplaintDetailsModal();

      loadStats();
      loadAdminComplaints();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // =========================================================================
  // 9. Escalation Trigger
  // =========================================================================
  async function triggerEscalation(complaintId) {
    const reason = prompt("Enter specific reason for escalating this grievance (e.g. Resolution window exceeded / Urgent safety issue):");
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch(`${state.apiBase}/complaints/${complaintId}/escalate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          userId: state.currentUser._id
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Could not escalate");
      }

      showToast("🚨 Grievance escalated to Urgent! Alert sent to Dean Student Welfare.", "success");
      closeComplaintDetailsModal();
      loadStats();
      if (state.activeTab === "tab-my-complaints") loadMyComplaints();
      if (state.activeTab === "tab-faculty-assigned") loadFacultyComplaints();
      if (state.activeTab === "tab-admin-all") loadAdminComplaints();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // =========================================================================
  // 10. Add Remark (Student / Faculty / Admin)
  // =========================================================================
  async function handleAddRemark() {
    if (!state.selectedComplaint) return;
    const remark = prompt("Add your remark, progress note, or clarification:");
    if (!remark || !remark.trim()) return;

    try {
      const res = await fetch(`${state.apiBase}/complaints/${state.selectedComplaint._id}/remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remark: remark.trim(),
          userId: state.currentUser._id
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add remark");
      }

      showToast("Remark added successfully to grievance record.", "success");
      openComplaintDetailsModal(state.selectedComplaint._id);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // =========================================================================
  // 11. Submit New Complaint Form
  // =========================================================================
  async function handleNewComplaintSubmit(e) {
    e.preventDefault();

    const title = DOM.formTitle ? DOM.formTitle.value.trim() : "";
    const category = DOM.formCategory ? DOM.formCategory.value : "";
    const department = DOM.formDepartment ? DOM.formDepartment.value : "";
    const description = DOM.formDescription ? DOM.formDescription.value.trim() : "";
    const location = DOM.formLocation ? DOM.formLocation.value.trim() : "";
    const priority = DOM.formPriority ? DOM.formPriority.value : "Medium";
    const isAnonymous = DOM.formIsAnonymous ? DOM.formIsAnonymous.checked : false;
    const isConfidential = DOM.formIsConfidential ? DOM.formIsConfidential.checked : false;

    if (!title || !category || !description) {
      showToast("Please complete all required fields (Category, Subject, and Description).", "error");
      return;
    }

    let evidenceUrl = DOM.formEvidenceUrl ? DOM.formEvidenceUrl.value.trim() : "";
    let evidenceName = "";

    // Handle evidence file if attached
    if (DOM.formEvidenceFile && DOM.formEvidenceFile.files && DOM.formEvidenceFile.files[0]) {
      const file = DOM.formEvidenceFile.files[0];
      evidenceName = file.name;
      if (DOM.evidenceUploadStatus) DOM.evidenceUploadStatus.textContent = "Processing attachment...";
      try {
        evidenceUrl = await readFileAsBase64(file);
      } catch (err) {
        console.warn("Could not read attachment file:", err);
      }
    }

    const payload = {
      title,
      category,
      department,
      description,
      location,
      priority,
      evidenceUrl,
      evidenceName,
      isAnonymous,
      isConfidential,
      userId: state.currentUser._id
    };

    try {
      const res = await fetch(`${state.apiBase}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit complaint");
      }

      const created = await res.json();

      showToast(`✓ Grievance registered successfully! Reference ID: ${created.complaintId}`, "success");
      DOM.newComplaintForm.reset();
      if (DOM.evidenceUploadStatus) DOM.evidenceUploadStatus.textContent = "";

      loadStats();
      switchTab("tab-my-complaints");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // =========================================================================
  // 12. Track by ID
  // =========================================================================
  async function executeTrackSearch() {
    const rawId = DOM.trackInput ? DOM.trackInput.value.trim() : "";
    if (!rawId) {
      showToast("Please enter a valid Reference ID.", "error");
      if (DOM.trackInput) DOM.trackInput.focus();
      return;
    }

    DOM.trackResultContainer.style.display = "block";
    DOM.trackResultContainer.innerHTML = '<div class="empty-highlight-placeholder"><span class="eh-icon">⏳</span><p>Querying grievance registry...</p></div>';

    try {
      const res = await fetch(`${state.apiBase}/complaints/track/${encodeURIComponent(rawId)}?userId=${state.currentUser._id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `No record found for Reference ID "${rawId}"`);
      }

      const c = await res.json();

      DOM.trackResultContainer.innerHTML = `
        <div style="margin-top: 14px;">
          <h4 style="margin: 0 0 10px 0; color: #38bdf8; font-size: 14px;">✓ Verified Record Found:</h4>
          ${renderComplaintCard(c, "track")}
        </div>
      `;
      attachCardEventListeners(DOM.trackResultContainer);
    } catch (err) {
      DOM.trackResultContainer.innerHTML = `
        <div class="empty-highlight-placeholder" style="border-color: rgba(248, 113, 113, 0.4);">
          <span class="eh-icon">⚠️</span>
          <h4 style="color: #f87171;">Grievance Not Found</h4>
          <p>${escapeHtml(err.message)}</p>
          <p style="font-size: 11px; color: var(--text-dim);">Verify that the Reference ID format is correct (e.g. <code>MITS-GRV-2026-0001</code>).</p>
        </div>
      `;
    }
  }

  // =========================================================================
  // 13. Routing Policy Modal (Admin Only)
  // =========================================================================
  function openNewRoutingRuleModal() {
    if (DOM.routingRuleForm) DOM.routingRuleForm.reset();
    if (DOM.routingRuleEditId) DOM.routingRuleEditId.value = "";
    if (DOM.routingRuleModal) DOM.routingRuleModal.style.display = "flex";
  }

  function closeRoutingRuleModal() {
    if (DOM.routingRuleModal) DOM.routingRuleModal.style.display = "none";
  }

  async function handleRoutingRuleSubmit(e) {
    e.preventDefault();

    const department = DOM.routingDeptSelect.value;
    const category = DOM.routingCategorySelect.value;
    const assignedFacultyId = DOM.routingFacultySelect.value;
    const designation = DOM.routingDesignationInput.value.trim();
    const isGrievanceOfficer = DOM.routingIsGrievanceOfficer.checked;

    if (!department || !category || !assignedFacultyId) {
      showToast("Please fill in Department, Category, and Assigned Faculty.", "error");
      return;
    }

    try {
      const res = await fetch(`${state.apiBase}/complaints/routing/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department,
          category,
          assignedFacultyId,
          designation,
          isGrievanceOfficer,
          userId: state.currentUser._id
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save routing policy");
      }

      showToast("Faculty routing policy saved successfully!", "success");
      closeRoutingRuleModal();
      loadRoutingRules();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // =========================================================================
  // 14. Event Listeners Setup
  // =========================================================================
  function setupEventListeners() {
    // Role switcher
    if (DOM.switchStudentBtn) {
      DOM.switchStudentBtn.addEventListener("click", () => {
        state.activeRole = "Student";
        updateIdentityBar();
        showToast("Switched perspective to Student view", "info");
      });
    }
    if (DOM.switchFacultyBtn) {
      DOM.switchFacultyBtn.addEventListener("click", () => {
        state.activeRole = "Faculty";
        updateIdentityBar();
        showToast("Switched perspective to Faculty / Coordinator view", "info");
      });
    }
    if (DOM.switchAdminBtn) {
      DOM.switchAdminBtn.addEventListener("click", () => {
        state.activeRole = "Admin";
        updateIdentityBar();
        showToast("Switched perspective to Central Administrator view", "info");
      });
    }

    // Tabs
    if (DOM.btnTabMyComplaints) DOM.btnTabMyComplaints.addEventListener("click", () => switchTab("tab-my-complaints"));
    if (DOM.btnTabSubmit) DOM.btnTabSubmit.addEventListener("click", () => switchTab("tab-submit"));
    if (DOM.btnTabFacultyAssigned) DOM.btnTabFacultyAssigned.addEventListener("click", () => switchTab("tab-faculty-assigned"));
    if (DOM.btnTabAdminAll) DOM.btnTabAdminAll.addEventListener("click", () => switchTab("tab-admin-all"));
    if (DOM.btnTabAdminRouting) DOM.btnTabAdminRouting.addEventListener("click", () => switchTab("tab-admin-routing"));
    if (DOM.btnTabTrack) DOM.btnTabTrack.addEventListener("click", () => switchTab("tab-track"));
    if (DOM.btnTabHelpline) DOM.btnTabHelpline.addEventListener("click", () => switchTab("tab-helpline"));

    if (DOM.quickNewGrievanceBtn) {
      DOM.quickNewGrievanceBtn.addEventListener("click", () => switchTab("tab-submit"));
    }

    // Filters
    if (DOM.myStatusFilter) DOM.myStatusFilter.addEventListener("change", loadMyComplaints);
    if (DOM.myCategoryFilter) DOM.myCategoryFilter.addEventListener("change", loadMyComplaints);
    if (DOM.mySearchInput) {
      DOM.mySearchInput.addEventListener("input", debounce(loadMyComplaints, 300));
    }

    if (DOM.facultyStatusFilter) DOM.facultyStatusFilter.addEventListener("change", loadFacultyComplaints);
    if (DOM.facultyPriorityFilter) DOM.facultyPriorityFilter.addEventListener("change", loadFacultyComplaints);
    if (DOM.facultySearchInput) {
      DOM.facultySearchInput.addEventListener("input", debounce(loadFacultyComplaints, 300));
    }

    if (DOM.adminDeptFilter) DOM.adminDeptFilter.addEventListener("change", loadAdminComplaints);
    if (DOM.adminStatusFilter) DOM.adminStatusFilter.addEventListener("change", loadAdminComplaints);
    if (DOM.adminSearchInput) {
      DOM.adminSearchInput.addEventListener("input", debounce(loadAdminComplaints, 300));
    }

    if (DOM.adminFilterEscalatedBtn) {
      DOM.adminFilterEscalatedBtn.addEventListener("click", () => {
        state.adminFilterEscalatedOnly = !state.adminFilterEscalatedOnly;
        DOM.adminFilterEscalatedBtn.classList.toggle("active", state.adminFilterEscalatedOnly);
        loadAdminComplaints();
      });
    }

    // Submit Grievance Form
    if (DOM.newComplaintForm) {
      DOM.newComplaintForm.addEventListener("submit", handleNewComplaintSubmit);
    }

    // Track
    if (DOM.btnExecuteTrack) DOM.btnExecuteTrack.addEventListener("click", executeTrackSearch);
    if (DOM.trackInput) {
      DOM.trackInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") executeTrackSearch();
      });
    }

    // Modals Close
    if (DOM.closeComplaintDetailsBtn) DOM.closeComplaintDetailsBtn.addEventListener("click", closeComplaintDetailsModal);
    if (DOM.complaintDetailsModal) {
      DOM.complaintDetailsModal.addEventListener("click", (e) => {
        if (e.target === DOM.complaintDetailsModal) closeComplaintDetailsModal();
      });
    }

    if (DOM.closeUpdateStatusBtn) DOM.closeUpdateStatusBtn.addEventListener("click", closeUpdateStatusModal);
    if (DOM.cancelUpdateStatusBtn) DOM.cancelUpdateStatusBtn.addEventListener("click", closeUpdateStatusModal);
    if (DOM.updateStatusModal) {
      DOM.updateStatusModal.addEventListener("click", (e) => {
        if (e.target === DOM.updateStatusModal) closeUpdateStatusModal();
      });
    }
    if (DOM.updateStatusForm) {
      DOM.updateStatusForm.addEventListener("submit", handleStatusFormSubmit);
    }

    if (DOM.closeAssignModalBtn) DOM.closeAssignModalBtn.addEventListener("click", closeAssignFacultyModal);
    if (DOM.cancelAssignBtn) DOM.cancelAssignBtn.addEventListener("click", closeAssignFacultyModal);
    if (DOM.assignFacultyModal) {
      DOM.assignFacultyModal.addEventListener("click", (e) => {
        if (e.target === DOM.assignFacultyModal) closeAssignFacultyModal();
      });
    }
    if (DOM.assignFacultyForm) {
      DOM.assignFacultyForm.addEventListener("submit", handleAssignFormSubmit);
    }

    if (DOM.btnOpenNewRoutingRuleModal) {
      DOM.btnOpenNewRoutingRuleModal.addEventListener("click", openNewRoutingRuleModal);
    }
    if (DOM.closeRoutingModalBtn) DOM.closeRoutingModalBtn.addEventListener("click", closeRoutingRuleModal);
    if (DOM.cancelRoutingModalBtn) DOM.cancelRoutingModalBtn.addEventListener("click", closeRoutingRuleModal);
    if (DOM.routingRuleModal) {
      DOM.routingRuleModal.addEventListener("click", (e) => {
        if (e.target === DOM.routingRuleModal) closeRoutingRuleModal();
      });
    }
    if (DOM.routingRuleForm) {
      DOM.routingRuleForm.addEventListener("submit", handleRoutingRuleSubmit);
    }

    // Details Modal Actions
    if (DOM.btnModalAddRemark) DOM.btnModalAddRemark.addEventListener("click", handleAddRemark);
    if (DOM.btnModalUpdateStatus) {
      DOM.btnModalUpdateStatus.addEventListener("click", () => {
        if (state.selectedComplaint) openUpdateStatusModal(state.selectedComplaint._id);
      });
    }
    if (DOM.btnModalAssignFaculty) {
      DOM.btnModalAssignFaculty.addEventListener("click", () => {
        if (state.selectedComplaint) openAssignFacultyModal(state.selectedComplaint._id);
      });
    }
    if (DOM.btnModalEscalate) {
      DOM.btnModalEscalate.addEventListener("click", () => {
        if (state.selectedComplaint) triggerEscalation(state.selectedComplaint._id);
      });
    }

    // Keyboard Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeComplaintDetailsModal();
        closeUpdateStatusModal();
        closeAssignFacultyModal();
        closeRoutingRuleModal();
      }
    });

    // Check query params on page load (e.g. ?track=MITS-GRV-2026-0001 or ?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const trackParam = urlParams.get("track");
    const idParam = urlParams.get("id");
    if (trackParam) {
      switchTab("tab-track");
      if (DOM.trackInput) DOM.trackInput.value = trackParam;
      executeTrackSearch();
    } else if (idParam) {
      openComplaintDetailsModal(idParam);
    }
  }

  // =========================================================================
  // 15. Helper Utilities
  // =========================================================================
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
    return String(text || "").toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  }

  function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
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
    }, 3500);
  }

  // =========================================================================
  // 16. Initialization
  // =========================================================================
  updateIdentityBar();
  setupEventListeners();
  loadStats();
  loadFacultyList();
  loadMyComplaints();
});
