/**
 * CampusConnect - Announcements & Circulars Module
 * Madhav Institute of Technology & Science (MITS), Gwalior
 * 
 * Supports real-time Firebase Firestore synchronization, MITS AMS dual REST API,
 * dynamic filtering by category/branch/semester/search, and admin publish modal.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const savedUser = localStorage.getItem("campusConnectUser");
  if (!savedUser) {
    window.location.href = "login.html";
    return;
  }

  const currentUser = JSON.parse(savedUser);
  const isAdminOrFaculty = ["Admin", "Professor", "ClubCoordinator"].includes(currentUser.role);

  // DOM Elements
  const announcementsFeedContainer = document.getElementById("announcementsFeedContainer");
  const searchInput = document.getElementById("announcementSearchInput");
  const branchFilter = document.getElementById("branchSelectFilter");
  const semesterFilter = document.getElementById("semesterSelectFilter");
  const categoryFilterTabs = document.getElementById("categoryFilterTabs");
  const openAdminPublishModalBtn = document.getElementById("openAdminPublishModalBtn");
  const adminPublishModal = document.getElementById("adminPublishModal");
  const closeAdminPublishModalBtn = document.getElementById("closeAdminPublishModalBtn");
  const cancelPublishModalBtn = document.getElementById("cancelPublishModalBtn");
  const adminPublishForm = document.getElementById("adminPublishForm");
  const publishFeedbackMsg = document.getElementById("publishFeedbackMsg");
  const submitPublishBtn = document.getElementById("submitPublishBtn");
  const firestoreLiveIndicator = document.getElementById("firestoreLiveIndicator");
  const liveSyncStatusText = document.getElementById("liveSyncStatusText");

  // Metric Stat counters
  const statTotalNotices = document.getElementById("statTotalNotices");
  const statUrgentNotices = document.getElementById("statUrgentNotices");
  const statExamNotices = document.getElementById("statExamNotices");
  const statTnpNotices = document.getElementById("statTnpNotices");

  // State
  let allAnnouncements = [];
  let currentCategory = "ALL";
  let searchQuery = "";
  let currentBranch = currentUser.department || "ALL";
  let currentSemester = currentUser.semester || "all";

  // Pre-fill student branch filter if found
  if (branchFilter && currentUser.department) {
    const matchingOption = Array.from(branchFilter.options).find(opt => opt.value === currentUser.department);
    if (matchingOption) {
      branchFilter.value = currentUser.department;
      currentBranch = currentUser.department;
    }
  }

  // Pre-fill semester filter if found
  if (semesterFilter && currentUser.semester) {
    semesterFilter.value = String(currentUser.semester);
    currentSemester = String(currentUser.semester);
  }

  // Determine API Base
  async function getApiBase() {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      try {
        const res = await fetch("http://localhost:5000/api-status");
        if (res.ok) return "http://localhost:5000/api";
      } catch (e) {}
    }
    return "/api";
  }

  // Toast Notification Helper
  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `custom-toast toast-${type}`;
    toast.style.cssText = `
      background: ${type === "success" ? "#064e3b" : type === "error" ? "#7f1d1d" : "#0d1f44"};
      color: #f8fafc;
      border: 1px solid ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#38bdf8"};
      padding: 12px 18px;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: fadeIn 0.2s ease;
    `;
    const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Update Top Metric Counters
  function updateStats(items) {
    if (statTotalNotices) statTotalNotices.textContent = items.length;
    if (statUrgentNotices) {
      const urgentCount = items.filter(a => (a.priority || "").toLowerCase() === "urgent").length;
      statUrgentNotices.textContent = urgentCount;
    }
    if (statExamNotices) {
      const examCount = items.filter(a => (a.category || "").toLowerCase() === "examinations").length;
      statExamNotices.textContent = examCount;
    }
    if (statTnpNotices) {
      const tnpCount = items.filter(a => (a.category || "").toLowerCase() === "placements").length;
      statTnpNotices.textContent = tnpCount;
    }
  }

  // Filter and Render Cards
  function renderAnnouncements() {
    if (!announcementsFeedContainer) return;

    let filtered = allAnnouncements.filter(item => {
      // Category Filter
      if (currentCategory !== "ALL" && item.category !== currentCategory) {
        return false;
      }

      // Branch Filter
      if (currentBranch !== "ALL") {
        const branches = item.targetBranches || ["ALL"];
        if (!branches.includes("ALL") && !branches.includes(currentBranch)) {
          return false;
        }
      }

      // Semester Filter
      if (currentSemester !== "all") {
        const semesters = item.targetSemesters || [];
        if (semesters.length > 0 && !semesters.includes(Number(currentSemester))) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || "").toLowerCase().includes(q);
        const descMatch = (item.message || "").toLowerCase().includes(q);
        const circMatch = (item.circularNumber || "").toLowerCase().includes(q);
        const issuerMatch = (item.postedByName || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !circMatch && !issuerMatch) {
          return false;
        }
      }

      return true;
    });

    updateStats(allAnnouncements);

    if (filtered.length === 0) {
      announcementsFeedContainer.innerHTML = `
        <div style="background: var(--ams-navy-card, #0d1f44); border: 1px dashed var(--line); border-radius: 14px; text-align: center; padding: 60px 20px; color: var(--text-dim);">
          <div style="font-size: 3rem; margin-bottom: 12px;">📋</div>
          <h3 style="margin: 0 0 8px; color: #f8fafc; font-size: 18px;">No Notices Match Current Filters</h3>
          <p style="margin: 0; font-size: 13px;">Try switching categories or clearing search keywords to view other verified MITS circulars.</p>
        </div>
      `;
      return;
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityWeights = { Urgent: 3, High: 2, Normal: 1 };
      const weightA = priorityWeights[a.priority] || 1;
      const weightB = priorityWeights[b.priority] || 1;
      if (weightB !== weightA) return weightB - weightA;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    announcementsFeedContainer.innerHTML = filtered.map(item => {
      const priority = item.priority || "Normal";
      const priorityClass = priority.toLowerCase();
      const circularNum = item.circularNumber || "MITS/Official/Circular";
      const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }) : "Academic Session 2026";

      const isUrgent = priority === "Urgent";
      const branchesBadge = (item.targetBranches && item.targetBranches.length > 0 && !item.targetBranches.includes("ALL"))
        ? `<span class="category-tag">Branches: ${item.targetBranches.join(", ")}</span>`
        : `<span class="category-tag">All Engineering Branches</span>`;

      const semestersBadge = (item.targetSemesters && item.targetSemesters.length > 0 && item.targetSemesters.length < 8)
        ? `<span class="category-tag">Sem: ${item.targetSemesters.join(", ")}</span>`
        : "";

      return `
        <article class="announcement-card priority-${priorityClass}" data-id="${item._id || item.id}">
          <div class="announcement-header">
            <div class="announcement-title-wrap">
              <div class="announcement-meta-top">
                <span class="circular-stamp">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  ${circularNum}
                </span>
                <span class="priority-pill ${priorityClass}">${priority}</span>
                <span class="category-tag">${item.category || "General"}</span>
                ${branchesBadge}
                ${semestersBadge}
              </div>
              <h2 class="announcement-title">${item.title}</h2>
            </div>
            ${isAdminOrFaculty ? `
              <button class="delete-announcement-btn" data-id="${item._id || item.id}" title="Delete notice" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; border-radius: 6px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            ` : ""}
          </div>

          <div class="announcement-body">
            ${item.message}
          </div>

          ${item.posterImage ? `
            <div style="margin: 14px 0; max-height: 280px; border-radius: 8px; overflow: hidden; border: 1px solid var(--line);">
              <img src="${item.posterImage}" alt="Notice Poster" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
          ` : ""}

          <div class="announcement-attachments">
            ${item.documentUrl ? `
              <a href="${item.documentUrl}" target="_blank" rel="noopener" class="attachment-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <span>View Official Circular PDF</span>
              </a>
            ` : ""}

            ${item.formLink ? `
              <a href="${item.formLink}" target="_blank" rel="noopener" class="attachment-pill" style="border-color: rgba(245, 158, 11, 0.4); color: #fbbf24; background: rgba(245, 158, 11, 0.12);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span>Online Application / Registration Portal</span>
              </a>
            ` : ""}
          </div>

          <div class="announcement-footer">
            <div class="announcement-author">
              <span class="verified-badge">🏛️ ${item.postedByName || "Dean Academics Office"}</span>
              <span>•</span>
              <span>MITS Gwalior</span>
            </div>
            <div>
              <span>Published on: ${formattedDate}</span>
            </div>
          </div>
        </article>
      `;
    }).join("");

    // Attach delete listeners
    document.querySelectorAll(".delete-announcement-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        if (!confirm("Are you sure you want to delete this official circular?")) return;

        try {
          const apiBase = await getApiBase();
          await fetch(`${apiBase}/announcements/${id}`, { method: "DELETE" });
          
          if (window.CampusConnectFirebase) {
            await window.CampusConnectFirebase.deleteAnnouncement(id);
          }

          allAnnouncements = allAnnouncements.filter(a => (a._id || a.id) !== id);
          renderAnnouncements();
          showToast("Circular deleted successfully", "success");
        } catch (err) {
          console.error("Delete error:", err);
          showToast("Failed to delete circular", "error");
        }
      });
    });
  }

  // Load announcements from backend
  async function loadAnnouncementsFromBackend() {
    try {
      const apiBase = await getApiBase();
      const res = await fetch(`${apiBase}/announcements`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          allAnnouncements = data;
          renderAnnouncements();
        }
      }
    } catch (err) {
      console.warn("Backend fetch note:", err.message);
    }
  }

  // Set up Real-time Firebase Firestore Subscription
  function setupRealtimeFirestore() {
    if (window.CampusConnectFirebase && typeof window.CampusConnectFirebase.subscribeAnnouncements === "function") {
      window.CampusConnectFirebase.subscribeAnnouncements(
        (firestoreNotices) => {
          if (firestoreNotices && firestoreNotices.length > 0) {
            // Merge firestore notices with existing
            const map = new Map();
            allAnnouncements.forEach(a => map.set(a.title, a));
            firestoreNotices.forEach(a => map.set(a.title, { ...map.get(a.title), ...a }));
            allAnnouncements = Array.from(map.values());
            renderAnnouncements();
            if (liveSyncStatusText) liveSyncStatusText.textContent = "Firestore: Live (Real-Time)";
          }
        },
        (err) => {
          if (liveSyncStatusText) liveSyncStatusText.textContent = "MITS AMS: Local Sync";
        }
      );
    }
  }

  // Event Listeners for Filters
  if (categoryFilterTabs) {
    categoryFilterTabs.addEventListener("click", (e) => {
      const tab = e.target.closest(".notif-tab");
      if (!tab) return;
      categoryFilterTabs.querySelectorAll(".notif-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentCategory = tab.getAttribute("data-category") || "ALL";
      renderAnnouncements();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderAnnouncements();
    });
  }

  if (branchFilter) {
    branchFilter.addEventListener("change", (e) => {
      currentBranch = e.target.value;
      renderAnnouncements();
    });
  }

  if (semesterFilter) {
    semesterFilter.addEventListener("change", (e) => {
      currentSemester = e.target.value;
      renderAnnouncements();
    });
  }

  // Admin Modal Controls
  if (openAdminPublishModalBtn) {
    if (!isAdminOrFaculty) {
      openAdminPublishModalBtn.textContent = "Submit Notice Request";
    }
    openAdminPublishModalBtn.addEventListener("click", () => {
      if (adminPublishModal) {
        adminPublishModal.classList.add("open");
        // Generate automatic circular number if empty
        const pubCircularNumber = document.getElementById("pubCircularNumber");
        if (pubCircularNumber && !pubCircularNumber.value) {
          const year = new Date().getFullYear();
          const randomNum = Math.floor(100 + Math.random() * 900);
          pubCircularNumber.value = `MITS/Notice/${year}/${randomNum}`;
        }
      }
    });
  }

  function closeAdminModal() {
    if (adminPublishModal) adminPublishModal.classList.remove("open");
    if (publishFeedbackMsg) {
      publishFeedbackMsg.style.display = "none";
      publishFeedbackMsg.textContent = "";
    }
  }

  if (closeAdminPublishModalBtn) closeAdminPublishModalBtn.addEventListener("click", closeAdminModal);
  if (cancelPublishModalBtn) cancelPublishModalBtn.addEventListener("click", closeAdminModal);
  if (adminPublishModal) {
    adminPublishModal.addEventListener("click", (e) => {
      if (e.target === adminPublishModal) closeAdminModal();
    });
  }

  // Admin Publish Form Submit Handler
  if (adminPublishForm) {
    adminPublishForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      submitPublishBtn.disabled = true;
      submitPublishBtn.textContent = "Broadcasting Circular...";

      const title = document.getElementById("pubTitle").value.trim();
      const message = document.getElementById("pubMessage").value.trim();
      const category = document.getElementById("pubCategory").value;
      const priority = document.getElementById("pubPriority").value;
      const circularNumber = document.getElementById("pubCircularNumber").value.trim();
      const postedByName = document.getElementById("pubIssuedBy").value.trim();
      const documentUrl = document.getElementById("pubDocumentUrl").value.trim();
      const formLink = document.getElementById("pubFormLink").value.trim();
      const posterImage = document.getElementById("pubPosterImage").value.trim();

      const newNoticePayload = {
        title,
        message,
        category,
        priority,
        circularNumber: circularNumber || `MITS/Circular/${Date.now()}`,
        postedByName: postedByName || currentUser.name || "Dean Academics Office",
        postedByRole: currentUser.role || "Admin",
        userId: currentUser._id || currentUser.id,
        documentUrl,
        formLink,
        posterImage,
        targetBranches: ["ALL"],
        targetSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
        academicYear: "2026-2027",
        isVerified: true,
        createdAt: new Date().toISOString()
      };

      try {
        const apiBase = await getApiBase();
        const res = await fetch(`${apiBase}/announcements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newNoticePayload)
        });

        let savedDoc = newNoticePayload;
        if (res.ok) {
          savedDoc = await res.json();
        }

        // Dual publish to Firestore
        if (window.CampusConnectFirebase && typeof window.CampusConnectFirebase.publishAnnouncement === "function") {
          await window.CampusConnectFirebase.publishAnnouncement(newNoticePayload);
        }

        // Add to local state & re-render
        allAnnouncements.unshift(savedDoc);
        renderAnnouncements();

        showToast("Official circular broadcasted successfully!", "success");
        adminPublishForm.reset();
        closeAdminModal();
      } catch (err) {
        console.error("Publish error:", err);
        showToast("Error broadcasting notice: " + err.message, "error");
      } finally {
        submitPublishBtn.disabled = false;
        submitPublishBtn.textContent = "🚀 Broadcast Circular & Send FCM Notification";
      }
    });
  }

  // Initial Boot
  await loadAnnouncementsFromBackend();
  setupRealtimeFirestore();
});
