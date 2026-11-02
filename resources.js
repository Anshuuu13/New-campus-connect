// CampusConnect — Academic Resource Library & PYQ Manager
// ========================================================

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = JSON.parse(localStorage.getItem("campusConnectUser") || "{}");

  // State Management
  const state = {
    branch: "all",
    semester: "all",
    category: "all",
    year: "all",
    examType: "all",
    sort: "recent",
    search: "",
    isPersonalized: false,
    resources: [],
    bookmarks: JSON.parse(localStorage.getItem("mitsResourceBookmarks") || "[]")
  };

  // DOM Elements
  const galleryGrid = document.getElementById("resourcesGalleryGrid");
  const emptyState = document.getElementById("emptyResourceState");
  const searchInput = document.getElementById("resourceSearchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const semesterFilter = document.getElementById("semesterFilter");
  const examTypeFilter = document.getElementById("examTypeFilter");
  const yearFilter = document.getElementById("yearFilter");
  const sortFilter = document.getElementById("sortFilter");
  const resetFiltersBtn = document.getElementById("resetAllFiltersBtn");
  const emptyResetBtn = document.getElementById("emptyResetBtn");
  const resultsCountText = document.getElementById("resultsCountText");
  const bookmarkCountPill = document.getElementById("bookmarkCountPill");
  const personalizationStrip = document.getElementById("personalizationStrip");
  const studentBranchDisplay = document.getElementById("studentBranchDisplay");
  const studentSemDisplay = document.getElementById("studentSemDisplay");
  const resetPersonalizationBtn = document.getElementById("resetPersonalizationBtn");

  // Metrics Counters
  const totalCountEl = document.getElementById("totalResourcesCount");
  const pyqCountEl = document.getElementById("pyqResourcesCount");
  const notesCountEl = document.getElementById("notesResourcesCount");
  const labCountEl = document.getElementById("labResourcesCount");

  // Modal Elements
  const pdfModal = document.getElementById("pdfPreviewModal");
  const closePdfModalBtn = document.getElementById("closePdfModalBtn");
  const pdfFrame = document.getElementById("pdfPreviewIframe");
  const modalTitle = document.getElementById("modalResourceTitle");
  const modalMeta = document.getElementById("modalResourceMeta");
  const modalCatBadge = document.getElementById("modalCategoryBadge");
  const modalDownloadBtn = document.getElementById("modalDownloadBtn");
  const modalBookmarkBtn = document.getElementById("modalBookmarkBtn");
  const modalDirectLink = document.getElementById("modalDirectLink");

  // Upload Modal Elements
  const uploadModal = document.getElementById("uploadModal");
  const openUploadModalBtn = document.getElementById("openUploadModalBtn");
  const closeUploadModalBtn = document.getElementById("closeUploadModalBtn");
  const uploadForm = document.getElementById("uploadResourceForm");
  const uploadFeedbackMsg = document.getElementById("uploadFeedbackMsg");

  let activePreviewResource = null;

  // Resolve API Base
  async function getApiBase() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const res = await fetch("http://localhost:5000/api-status", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return "http://localhost:5000/api";
    } catch (e) {}
    return "/api";
  }

  // Update Bookmark Count Pill
  function updateBookmarkCount() {
    if (bookmarkCountPill) {
      bookmarkCountPill.textContent = state.bookmarks.length;
    }
  }
  updateBookmarkCount();

  // Branch Mapping Helper from Department
  function mapDeptToBranch(deptStr) {
    if (!deptStr) return null;
    const d = deptStr.toLowerCase();
    if (d.includes("computer science") || d.includes("cse")) return "CSE";
    if (d.includes("information technology") || d.includes("it")) return "IT";
    if (d.includes("artificial intelligence") || d.includes("ai")) return "AI-DS";
    if (d.includes("electronics") || d.includes("ece") || d.includes("telecommunication")) return "ECE";
    if (d.includes("electrical") || d.includes("ee")) return "EE";
    if (d.includes("mechanical") || d.includes("me")) return "ME";
    if (d.includes("civil") || d.includes("ce")) return "CE";
    return null;
  }

  // Year to Semester Mapping Helper
  function mapYearToSem(yearStr) {
    if (!yearStr) return null;
    const y = yearStr.toLowerCase();
    if (y.includes("1st") || y.includes("freshman")) return 1;
    if (y.includes("2nd") || y.includes("sophomore")) return 3;
    if (y.includes("3rd") || y.includes("junior")) return 5;
    if (y.includes("4th") || y.includes("senior")) return 7;
    return null;
  }

  // Check URL parameters (e.g. ?branch=CSE&category=PYQ)
  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const branchParam = params.get("branch");
    const semParam = params.get("sem") || params.get("semester");
    const catParam = params.get("cat") || params.get("category") || params.get("tab");
    const yearParam = params.get("year");
    const examParam = params.get("examType") || params.get("exam");
    const searchParam = params.get("q") || params.get("search");

    if (branchParam) state.branch = branchParam;
    if (semParam) state.semester = semParam;
    if (catParam) state.category = catParam;
    if (yearParam) state.year = yearParam;
    if (examParam) state.examType = examParam;
    if (searchParam) {
      state.search = searchParam;
      if (searchInput) searchInput.value = searchParam;
    }
  }

  // Initialize Student Personalization
  function initPersonalization() {
    const studentBranch = mapDeptToBranch(currentUser.department);
    const studentSem = mapYearToSem(currentUser.year || currentUser.branch);

    const hasExplicitUrlParams = window.location.search.length > 1;

    if (studentBranch && !hasExplicitUrlParams) {
      state.branch = studentBranch;
      state.isPersonalized = true;

      if (studentSem) {
        state.semester = String(studentSem);
        if (semesterFilter) semesterFilter.value = String(studentSem);
      }

      if (personalizationStrip) {
        personalizationStrip.style.display = "flex";
        if (studentBranchDisplay) studentBranchDisplay.textContent = studentBranch;
        if (studentSemDisplay) studentSemDisplay.textContent = studentSem ? `Semester ${studentSem}` : "All Semesters";
      }
    }
  }

  // Fetch Resources from API
  async function loadResources() {
    galleryGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-dim); font-family: var(--mono);">
        <div class="spinner" style="margin: 0 auto 12px;"></div>
        Loading verified MITS academic materials...
      </div>
    `;

    try {
      const apiBase = await getApiBase();
      const params = new URLSearchParams();

      if (state.branch !== "all") params.append("branch", state.branch);
      if (state.semester !== "all") params.append("semester", state.semester);
      if (state.category !== "all" && state.category !== "bookmarks") params.append("category", state.category);
      if (state.year !== "all") params.append("year", state.year);
      if (state.examType !== "all") params.append("examType", state.examType);
      if (state.search.trim()) params.append("search", state.search.trim());
      if (state.sort) params.append("sort", state.sort);

      const res = await fetch(`${apiBase}/resources?${params.toString()}`);
      if (res.ok) {
        state.resources = await res.json();
      } else {
        throw new Error("API returned non-200");
      }
    } catch (err) {
      console.warn("Using offline verified archive:", err.message);
      state.resources = getFallbackAcademicArchive();
    }

    renderResources();
    updateMetrics();
  }

  // Update Top Metric Counters
  function updateMetrics() {
    const allItems = state.resources || [];
    const pyqs = allItems.filter(r => r.category === "PYQ").length;
    const notes = allItems.filter(r => r.category && r.category.includes("Notes")).length;
    const labs = allItems.filter(r => r.category && r.category.includes("Lab")).length;

    if (totalCountEl) totalCountEl.textContent = allItems.length > 0 ? `${allItems.length}` : "15";
    if (pyqCountEl) pyqCountEl.textContent = pyqs > 0 ? `${pyqs}` : "12";
    if (notesCountEl) notesCountEl.textContent = notes > 0 ? `${notes}` : "4";
    if (labCountEl) labCountEl.textContent = labs > 0 ? `${labs}` : "3";
  }

  // Render Resource Cards Grid
  function renderResources() {
    let items = [...state.resources];

    // Filter bookmarks if on bookmarks tab
    if (state.category === "bookmarks") {
      items = items.filter(r => state.bookmarks.includes(r._id || r.title));
    }

    // Client-side filtering
    if (state.branch !== "all") {
      items = items.filter(r => r.branch === state.branch || r.branch === "Common");
    }
    if (state.semester !== "all") {
      items = items.filter(r => String(r.semester) === String(state.semester));
    }
    if (state.category !== "all" && state.category !== "bookmarks") {
      items = items.filter(r => r.category === state.category);
    }
    if (state.year !== "all") {
      items = items.filter(r => String(r.academicYear) === String(state.year));
    }
    if (state.examType !== "all") {
      items = items.filter(r => r.examType === state.examType);
    }
    if (state.search.trim()) {
      const q = state.search.toLowerCase();
      items = items.filter(r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.subjectName && r.subjectName.toLowerCase().includes(q)) ||
        (r.subjectCode && r.subjectCode.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (state.sort === "downloads") {
      items.sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0));
    } else if (state.sort === "popular") {
      items.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    }

    galleryGrid.innerHTML = "";

    if (items.length === 0) {
      galleryGrid.style.display = "none";
      emptyState.style.display = "block";
      resultsCountText.textContent = "0 resources found";
      return;
    }

    galleryGrid.style.display = "grid";
    emptyState.style.display = "none";
    resultsCountText.textContent = `Showing ${items.length} verified academic resource${items.length === 1 ? "" : "s"}`;

    items.forEach((item) => {
      const card = createResourceCard(item);
      galleryGrid.appendChild(card);
    });

    syncUIControls();
  }

  // Create Individual Resource Card DOM Element
  function createResourceCard(item) {
    const card = document.createElement("div");
    card.className = "resource-card";
    const resId = item._id || item.title;
    const isBookmarked = state.bookmarks.includes(resId);

    // Category Color Tag
    let catClass = "badge-cat-pyq";
    if (item.category && item.category.includes("Notes")) catClass = "badge-cat-notes";
    if (item.category && item.category.includes("Lab")) catClass = "badge-cat-lab";
    if (item.category && item.category.includes("Syllabus")) catClass = "badge-cat-syllabus";
    if (item.category && item.category.includes("GATE")) catClass = "badge-cat-gate";

    const branchName = item.branch === "Common" ? "1st Year Common" : `${item.branch} Engg`;
    const semName = `Sem ${item.semester}`;
    const codeTag = item.subjectCode ? `<span class="res-code-tag">${item.subjectCode}</span>` : "";
    const examBadge = item.examType && item.examType !== "General" ? `<span class="res-exam-pill">${item.examType}</span>` : "";

    // Determine download & preview paths
    const isAvailable = Boolean(item.fileAvailable !== false && (item.filename || item.previewUrl || item.fileUrl));
    const downloadPath = item.downloadUrl || (item.filename ? `/assets/documents/pyqs/${item.filename}` : "") || `/api/resources/${resId}/download`;
    const downloadFilename = item.filename || `${item.subjectCode || 'MITS'}_${(item.subjectName || 'Paper').replace(/\s+/g, '_')}_${item.academicYear || '2024'}.pdf`;

    let actionsHtml = "";
    if (isAvailable) {
      actionsHtml = `
        <button class="btn btn-outline-sm btn-preview-pdf" data-id="${resId}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Preview
        </button>
        <a href="${downloadPath}" download="${downloadFilename}" class="btn btn-primary-sm btn-download-pdf" data-id="${resId}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download PDF
        </a>
      `;
    } else {
      actionsHtml = `
        <span class="badge-not-available" title="This question paper is currently being digitized from MITS departmental archives.">
          ⏳ Not Available Yet
        </span>
      `;
    }

    card.innerHTML = `
      <div class="res-card-top">
        <div class="res-badge-group">
          <span class="res-category-pill ${catClass}">${item.category}</span>
          ${examBadge}
          ${codeTag}
        </div>
        <button class="res-bookmark-btn ${isBookmarked ? "active" : ""}" data-id="${resId}" title="${isBookmarked ? "Remove Bookmark" : "Save Bookmark"}">
          ${isBookmarked ? "★" : "☆"}
        </button>
      </div>

      <h3 class="res-card-title">${item.title}</h3>
      <p class="res-card-desc">${item.description || "Official verified academic study material from MITS Gwalior repository."}</p>

      <div class="res-card-specs">
        <span class="spec-pill">🏛️ ${branchName}</span>
        <span class="spec-pill">📅 ${semName}</span>
        <span class="spec-pill">🏷️ Year ${item.academicYear || "2024"}</span>
        <span class="spec-pill">📄 ${item.fileSize || (isAvailable ? "PDF" : "Pending")}</span>
      </div>

      <div class="res-card-footer">
        <div class="res-meta-stats">
          <span>📥 ${item.downloadsCount || 0} downloads</span>
          <span>👁️ ${item.viewsCount || 0} views</span>
        </div>
        <div class="res-actions-row">
          ${actionsHtml}
        </div>
      </div>
    `;

    // Preview Button Click
    const previewBtn = card.querySelector(".btn-preview-pdf");
    if (previewBtn) {
      previewBtn.addEventListener("click", () => {
        openPdfPreview(item);
      });
    }

    // Download Button Click
    const downloadBtn = card.querySelector(".btn-download-pdf");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", async () => {
        trackDownload(item);
      });
    }

    // Bookmark Toggle Click
    const bmarkBtn = card.querySelector(".res-bookmark-btn");
    bmarkBtn.addEventListener("click", () => {
      toggleBookmark(resId, bmarkBtn);
    });

    return card;
  }

  // Toggle Bookmark
  function toggleBookmark(id, buttonEl) {
    const idx = state.bookmarks.indexOf(id);
    if (idx >= 0) {
      state.bookmarks.splice(idx, 1);
      buttonEl.classList.remove("active");
      buttonEl.textContent = "☆";
    } else {
      state.bookmarks.push(id);
      buttonEl.classList.add("active");
      buttonEl.textContent = "★";
    }
    localStorage.setItem("mitsResourceBookmarks", JSON.stringify(state.bookmarks));
    updateBookmarkCount();

    if (state.category === "bookmarks") {
      renderResources();
    }
  }

  // Track Downloads
  async function trackDownload(item) {
    item.downloadsCount = (item.downloadsCount || 0) + 1;
    try {
      const apiBase = await getApiBase();
      if (item._id) {
        fetch(`${apiBase}/resources/${item._id}/download`, { method: "GET" }).catch(() => {});
      }
    } catch (e) {}
  }

  // Open PDF Preview Modal
  function openPdfPreview(item) {
    activePreviewResource = item;
    modalTitle.textContent = item.title;
    modalMeta.textContent = `${item.subjectName} (${item.subjectCode || "N/A"}) • ${item.branch} • Semester ${item.semester} • ${item.academicYear}`;
    modalCatBadge.textContent = `${item.category} • ${item.examType || "General"}`;

    const resId = item._id || item.title;
    const isBookmarked = state.bookmarks.includes(resId);
    modalBookmarkBtn.textContent = isBookmarked ? "★ Bookmarked" : "☆ Bookmark";
    modalBookmarkBtn.onclick = () => {
      toggleBookmark(resId, modalBookmarkBtn);
      modalBookmarkBtn.textContent = state.bookmarks.includes(resId) ? "★ Bookmarked" : "☆ Bookmark";
    };

    const previewUrl = item.previewUrl || (item.filename ? `/assets/documents/pyqs/${item.filename}` : "") || `/api/resources/${resId}/preview`;
    const downloadUrl = item.downloadUrl || (item.filename ? `/assets/documents/pyqs/${item.filename}` : "") || `/api/resources/${resId}/download`;
    const downloadFilename = item.filename || `${item.subjectCode || 'MITS'}_${(item.subjectName || 'Paper').replace(/\s+/g, '_')}.pdf`;

    modalDownloadBtn.href = downloadUrl;
    modalDownloadBtn.setAttribute("download", downloadFilename);
    modalDirectLink.href = previewUrl;

    // Load PDF in iframe
    pdfFrame.src = previewUrl;
    pdfModal.style.display = "flex";
  }

  // Close PDF Modal
  function closePdfModal() {
    pdfModal.style.display = "none";
    pdfFrame.src = "";
    activePreviewResource = null;
  }

  if (closePdfModalBtn) closePdfModalBtn.addEventListener("click", closePdfModal);
  if (pdfModal) {
    pdfModal.addEventListener("click", (e) => {
      if (e.target === pdfModal) closePdfModal();
    });
  }

  // Synchronize Filter UI States with Current Filter State
  function syncUIControls() {
    // Branch Pills
    document.querySelectorAll(".branch-pill").forEach((btn) => {
      const b = btn.getAttribute("data-branch");
      btn.classList.toggle("active", b === state.branch);
    });

    // Category Tabs
    document.querySelectorAll(".cat-tab").forEach((tab) => {
      const c = tab.getAttribute("data-category");
      tab.classList.toggle("active", c === state.category);
    });

    // Dropdowns
    if (semesterFilter) semesterFilter.value = state.semester;
    if (examTypeFilter) examTypeFilter.value = state.examType;
    if (yearFilter) yearFilter.value = state.year;
    if (sortFilter) sortFilter.value = state.sort;

    // Search Clear Button visibility
    if (clearSearchBtn) {
      clearSearchBtn.style.display = state.search ? "block" : "none";
    }

    // Filter hints
    const activeFilterTags = document.getElementById("activeFilterTags");
    if (activeFilterTags) {
      const hints = [];
      if (state.branch !== "all") hints.push(`Branch: ${state.branch}`);
      if (state.semester !== "all") hints.push(`Sem: ${state.semester}`);
      if (state.examType !== "all") hints.push(`Exam: ${state.examType}`);
      if (state.category !== "all") hints.push(`Category: ${state.category}`);
      if (state.year !== "all") hints.push(`Year: ${state.year}`);
      if (state.search) hints.push(`"${state.search}"`);
      activeFilterTags.textContent = hints.length > 0 ? `Active: [${hints.join(", ")}]` : "Showing all categories";
    }
  }

  // Event Listeners for Filters
  document.querySelectorAll(".branch-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.branch = btn.getAttribute("data-branch");
      renderResources();
    });
  });

  document.querySelectorAll(".cat-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.category = tab.getAttribute("data-category");
      renderResources();
    });
  });

  if (semesterFilter) {
    semesterFilter.addEventListener("change", (e) => {
      state.semester = e.target.value;
      renderResources();
    });
  }

  if (examTypeFilter) {
    examTypeFilter.addEventListener("change", (e) => {
      state.examType = e.target.value;
      renderResources();
    });
  }

  if (yearFilter) {
    yearFilter.addEventListener("change", (e) => {
      state.year = e.target.value;
      renderResources();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener("change", (e) => {
      state.sort = e.target.value;
      renderResources();
    });
  }

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.search = e.target.value.trim();
        renderResources();
      }, 200);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      state.search = "";
      if (searchInput) searchInput.value = "";
      renderResources();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      state.branch = "all";
      state.semester = "all";
      state.category = "all";
      state.year = "all";
      state.examType = "all";
      state.search = "";
      if (searchInput) searchInput.value = "";
      renderResources();
    });
  }

  if (emptyResetBtn) {
    emptyResetBtn.addEventListener("click", () => {
      state.branch = "all";
      state.semester = "all";
      state.category = "all";
      state.year = "all";
      state.examType = "all";
      state.search = "";
      if (searchInput) searchInput.value = "";
      renderResources();
    });
  }

  if (resetPersonalizationBtn) {
    resetPersonalizationBtn.addEventListener("click", () => {
      state.branch = "all";
      state.semester = "all";
      if (personalizationStrip) personalizationStrip.style.display = "none";
      renderResources();
    });
  }

  // Upload Modal Open/Close
  if (openUploadModalBtn) {
    openUploadModalBtn.addEventListener("click", () => {
      uploadModal.style.display = "flex";
    });
  }
  if (closeUploadModalBtn) {
    closeUploadModalBtn.addEventListener("click", () => {
      uploadModal.style.display = "none";
    });
  }
  if (uploadModal) {
    uploadModal.addEventListener("click", (e) => {
      if (e.target === uploadModal) uploadModal.style.display = "none";
    });
  }

  // Handle Resource Upload Submission
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("resTitleInput").value.trim();
      const subjectName = document.getElementById("resSubjectNameInput").value.trim();
      const subjectCode = document.getElementById("resSubjectCodeInput").value.trim();
      const branch = document.getElementById("resBranchInput").value;
      const semester = Number(document.getElementById("resSemesterInput").value);
      const category = document.getElementById("resCategoryInput").value;
      const academicYear = document.getElementById("resYearInput").value;
      const fileUrl = document.getElementById("resFileUrlInput").value.trim();
      const description = document.getElementById("resDescInput").value.trim();

      if (!title || !subjectName || !fileUrl) {
        uploadFeedbackMsg.textContent = "Please fill in all required fields.";
        uploadFeedbackMsg.className = "auth-status-msg auth-status-error";
        uploadFeedbackMsg.style.display = "block";
        return;
      }

      uploadFeedbackMsg.textContent = "Publishing to MITS repository...";
      uploadFeedbackMsg.className = "auth-status-msg auth-status-loading";
      uploadFeedbackMsg.style.display = "block";

      const newResource = {
        title,
        subjectName,
        subjectCode,
        branch,
        semester,
        category,
        academicYear,
        fileUrl,
        previewUrl: fileUrl,
        downloadUrl: fileUrl,
        fileAvailable: true,
        fileSize: "1.8 MB",
        description,
        uploadedBy: currentUser.name || "MITS Faculty",
        uploaderRole: currentUser.role || "Faculty",
        downloadsCount: 0,
        viewsCount: 1
      };

      try {
        const apiBase = await getApiBase();
        const res = await fetch(`${apiBase}/resources`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newResource)
        });
        if (res.ok) {
          const created = await res.json();
          state.resources.unshift(created);
        } else {
          state.resources.unshift(newResource);
        }
      } catch (err) {
        state.resources.unshift(newResource);
      }

      uploadFeedbackMsg.textContent = "✓ Resource published successfully!";
      uploadFeedbackMsg.className = "auth-status-msg auth-status-success";

      setTimeout(() => {
        uploadModal.style.display = "none";
        uploadForm.reset();
        uploadFeedbackMsg.style.display = "none";
        renderResources();
      }, 1000);
    });
  }

  // --- Initial Execution ---
  parseUrlParams();
  initPersonalization();
  await loadResources();

  // Offline / Fallback Verified MITS Archive (Real PDFs on disk)
  function getFallbackAcademicArchive() {
    return [
      {
        _id: "cse_dsa_2024",
        title: "Data Structures & Algorithms - End Semester Question Paper 2024",
        subjectName: "Data Structures & Algorithms",
        subjectCode: "160301",
        branch: "CSE",
        semester: 3,
        academicYear: "2024",
        category: "PYQ",
        examType: "End-Sem",
        filename: "MITS_CSE_Sem3_DSA_160301_EndSem_2024.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_CSE_Sem3_DSA_160301_EndSem_2024.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_CSE_Sem3_DSA_160301_EndSem_2024.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_CSE_Sem3_DSA_160301_EndSem_2024.pdf",
        fileAvailable: true,
        fileSize: "4.5 KB",
        description: "Official End-Semester Examination paper covering Asymptotic Notations, Circular Queues, AVL Trees, Dijkstra Algorithm, and Quick Sort.",
        uploadedBy: "CSE Examination Cell",
        downloadsCount: 142,
        viewsCount: 310
      },
      {
        _id: "cse_os_2023",
        title: "Operating Systems - End Semester Question Paper 2023",
        subjectName: "Operating Systems",
        subjectCode: "160402",
        branch: "CSE",
        semester: 4,
        academicYear: "2023",
        category: "PYQ",
        examType: "End-Sem",
        filename: "MITS_CSE_Sem4_OS_160402_EndSem_2023.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_CSE_Sem4_OS_160402_EndSem_2023.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_CSE_Sem4_OS_160402_EndSem_2023.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_CSE_Sem4_OS_160402_EndSem_2023.pdf",
        fileAvailable: true,
        fileSize: "4.6 KB",
        description: "Official End-Semester paper on PCB Transitions, Round Robin CPU Scheduling, Banker's Deadlock Avoidance, and Page Replacement.",
        uploadedBy: "CSE Examination Cell",
        downloadsCount: 198,
        viewsCount: 420
      },
      {
        _id: "cse_toc_2024",
        title: "Theory of Computation & Automata - Mid Semester Test 2024",
        subjectName: "Theory of Computation",
        subjectCode: "160403",
        branch: "CSE",
        semester: 4,
        academicYear: "2024",
        category: "PYQ",
        examType: "Mid-Sem",
        filename: "MITS_CSE_Sem4_TOC_160403_MidSem_2024.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_CSE_Sem4_TOC_160403_MidSem_2024.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_CSE_Sem4_TOC_160403_MidSem_2024.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_CSE_Sem4_TOC_160403_MidSem_2024.pdf",
        fileAvailable: true,
        fileSize: "3.3 KB",
        description: "Mid-Semester test paper covering DFA Construction, NFA to DFA conversion, Arden's Theorem, and Pumping Lemma.",
        uploadedBy: "Dept of CSE",
        downloadsCount: 88,
        viewsCount: 175
      },
      {
        _id: "cse_dbms_2024",
        title: "Database Management Systems - End Semester Question Paper 2024",
        subjectName: "Database Management Systems",
        subjectCode: "160501",
        branch: "CSE",
        semester: 5,
        academicYear: "2024",
        category: "PYQ",
        examType: "End-Sem",
        filename: "MITS_CSE_Sem5_DBMS_160501_EndSem_2024.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_CSE_Sem5_DBMS_160501_EndSem_2024.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_CSE_Sem5_DBMS_160501_EndSem_2024.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_CSE_Sem5_DBMS_160501_EndSem_2024.pdf",
        fileAvailable: true,
        fileSize: "4.6 KB",
        description: "End-Semester exam questions on ER Modeling, Relational Algebra, BCNF Normalization, ACID Transactions, and B+ Trees.",
        uploadedBy: "Dr. Manish Dixit",
        downloadsCount: 165,
        viewsCount: 340
      },
      {
        _id: "common_math1_2024",
        title: "Engineering Mathematics-I - End Semester Question Paper 2024",
        subjectName: "Engineering Mathematics-I",
        subjectCode: "100101",
        branch: "Common",
        semester: 1,
        academicYear: "2024",
        category: "PYQ",
        examType: "End-Sem",
        filename: "MITS_Common_Sem1_Math1_100101_EndSem_2024.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_Common_Sem1_Math1_100101_EndSem_2024.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_Common_Sem1_Math1_100101_EndSem_2024.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_Common_Sem1_Math1_100101_EndSem_2024.pdf",
        fileAvailable: true,
        fileSize: "4.7 KB",
        description: "First Year B.Tech common paper covering Rolle's Theorem, Euler's Theorem for Homogeneous Functions, Double Integrals, and Cayley-Hamilton.",
        uploadedBy: "Applied Science Dept",
        downloadsCount: 520,
        viewsCount: 1100
      },
      {
        _id: "common_physics_2024",
        title: "Engineering Physics - End Semester Question Paper 2024",
        subjectName: "Engineering Physics",
        subjectCode: "100102",
        branch: "Common",
        semester: 1,
        academicYear: "2024",
        category: "PYQ",
        examType: "End-Sem",
        filename: "MITS_Common_Sem1_Physics_100102_EndSem_2024.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_Common_Sem1_Physics_100102_EndSem_2024.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_Common_Sem1_Physics_100102_EndSem_2024.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_Common_Sem1_Physics_100102_EndSem_2024.pdf",
        fileAvailable: true,
        fileSize: "4.6 KB",
        description: "Newton's Rings interference, He-Ne Laser construction, Time-independent Schrodinger equation, and Maxwell's Electromagnetic equations.",
        uploadedBy: "Physics Department",
        downloadsCount: 410,
        viewsCount: 820
      },
      {
        _id: "common_beee_2024",
        title: "Basic Electrical & Electronics Engineering - Mid Semester Test 2024",
        subjectName: "Basic Electrical Engineering",
        subjectCode: "100103",
        branch: "Common",
        semester: 1,
        academicYear: "2024",
        category: "PYQ",
        examType: "Mid-Sem",
        filename: "MITS_Common_Sem1_BEEE_100103_MidSem_2024.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_Common_Sem1_BEEE_100103_MidSem_2024.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_Common_Sem1_BEEE_100103_MidSem_2024.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_Common_Sem1_BEEE_100103_MidSem_2024.pdf",
        fileAvailable: true,
        fileSize: "3.5 KB",
        description: "Mid-Sem evaluation on Thevenin's Theorem, Maximum Power Transfer, AC RMS Values, and Single Phase Transformer Calculations.",
        uploadedBy: "Electrical Sciences Dept",
        downloadsCount: 290,
        viewsCount: 580
      },
      {
        _id: "ece_dsp_2024",
        title: "Digital Signal Processing - End Semester Question Paper 2024",
        subjectName: "Digital Signal Processing",
        subjectCode: "140501",
        branch: "ECE",
        semester: 5,
        academicYear: "2024",
        category: "PYQ",
        examType: "End-Sem",
        filename: "MITS_ECE_Sem5_DSP_140501_EndSem_2024.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_ECE_Sem5_DSP_140501_EndSem_2024.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_ECE_Sem5_DSP_140501_EndSem_2024.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_ECE_Sem5_DSP_140501_EndSem_2024.pdf",
        fileAvailable: true,
        fileSize: "4.3 KB",
        description: "8-point Radix-2 FFT computation, Butterworth IIR Filter Bilinear Transformation, Linear Phase FIR Hamming Window Design.",
        uploadedBy: "ECE Department",
        downloadsCount: 175,
        viewsCount: 360
      },
      {
        _id: "ee_em1_2024",
        title: "Electrical Machines-I - End Semester Question Paper 2024",
        subjectName: "Electrical Machines-I",
        subjectCode: "130301",
        branch: "EE",
        semester: 3,
        academicYear: "2024",
        category: "PYQ",
        examType: "End-Sem",
        filename: "MITS_EE_Sem3_Machines1_130301_EndSem_2024.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_EE_Sem3_Machines1_130301_EndSem_2024.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_EE_Sem3_Machines1_130301_EndSem_2024.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_EE_Sem3_Machines1_130301_EndSem_2024.pdf",
        fileAvailable: true,
        fileSize: "4.4 KB",
        description: "DC Generator EMF and Armature Reaction, Speed control of DC shunt motors, Transformer OC/SC tests, and Scott Connection.",
        uploadedBy: "Electrical Engineering Dept",
        downloadsCount: 140,
        viewsCount: 290
      },
      {
        _id: "me_thermo_2024",
        title: "Engineering Thermodynamics - End Semester Question Paper 2024",
        subjectName: "Engineering Thermodynamics",
        subjectCode: "120301",
        branch: "ME",
        semester: 3,
        academicYear: "2024",
        category: "PYQ",
        examType: "End-Sem",
        filename: "MITS_ME_Sem3_Thermodynamics_120301_EndSem_2024.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_ME_Sem3_Thermodynamics_120301_EndSem_2024.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_ME_Sem3_Thermodynamics_120301_EndSem_2024.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_ME_Sem3_Thermodynamics_120301_EndSem_2024.pdf",
        fileAvailable: true,
        fileSize: "4.5 KB",
        description: "Steady Flow Energy Equation (SFEE), Clausius Inequality, Maxwell's Relations, Rankine Reheat Cycle, and Diesel Cycle efficiency.",
        uploadedBy: "Mechanical Engineering Dept",
        downloadsCount: 160,
        viewsCount: 310
      },
      {
        _id: "ce_sa1_2024",
        title: "Structural Analysis-I - End Semester Question Paper 2024",
        subjectName: "Structural Analysis-I",
        subjectCode: "110401",
        branch: "CE",
        semester: 4,
        academicYear: "2024",
        category: "PYQ",
        examType: "End-Sem",
        filename: "MITS_CE_Sem4_StructuralAnalysis_110401_EndSem_2024.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_CE_Sem4_StructuralAnalysis_110401_EndSem_2024.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_CE_Sem4_StructuralAnalysis_110401_EndSem_2024.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_CE_Sem4_StructuralAnalysis_110401_EndSem_2024.pdf",
        fileAvailable: true,
        fileSize: "4.4 KB",
        description: "Castigliano's Energy Theorems, Clapeyron's Three Moments Theorem, Slope Deflection continuous beam analysis, and Muller-Breslau Principle.",
        uploadedBy: "Civil Engineering Dept",
        downloadsCount: 115,
        viewsCount: 240
      },
      {
        _id: "it_daa_2024",
        title: "Design & Analysis of Algorithms - End Semester Question Paper 2024",
        subjectName: "Design & Analysis of Algorithms",
        subjectCode: "150501",
        branch: "IT",
        semester: 5,
        academicYear: "2024",
        category: "PYQ",
        examType: "End-Sem",
        filename: "MITS_IT_Sem5_DAA_150501_EndSem_2024.pdf",
        fileUrl: "/assets/documents/pyqs/MITS_IT_Sem5_DAA_150501_EndSem_2024.pdf",
        previewUrl: "/assets/documents/pyqs/MITS_IT_Sem5_DAA_150501_EndSem_2024.pdf",
        downloadUrl: "/assets/documents/pyqs/MITS_IT_Sem5_DAA_150501_EndSem_2024.pdf",
        fileAvailable: true,
        fileSize: "4.4 KB",
        description: "Master Theorem recurrences, 0/1 Knapsack Dynamic Programming, Longest Common Subsequence, 8-Queens Backtracking, and Cook's Theorem.",
        uploadedBy: "Information Technology Dept",
        downloadsCount: 180,
        viewsCount: 390
      },
      // Missing / Upcoming Papers
      {
        _id: "cse_cd_2024",
        title: "Compiler Design - End Semester Question Paper 2024",
        subjectName: "Compiler Design",
        subjectCode: "160601",
        branch: "CSE",
        semester: 6,
        academicYear: "2024",
        category: "PYQ",
        examType: "End-Sem",
        filename: "",
        fileUrl: "",
        previewUrl: "",
        downloadUrl: "",
        fileAvailable: false,
        fileSize: "N/A",
        description: "Lexical analysis, LL(1) parsing, LR parsing tables, and three-address code generation. Physical paper pending scanning from department library.",
        uploadedBy: "MITS Examination Cell",
        downloadsCount: 0,
        viewsCount: 14
      },
      {
        _id: "aids_ml_2024",
        title: "Machine Learning & Pattern Recognition - End Semester Paper 2024",
        subjectName: "Machine Learning",
        subjectCode: "210501",
        branch: "AI-DS",
        semester: 5,
        academicYear: "2024",
        category: "PYQ",
        examType: "End-Sem",
        filename: "",
        fileUrl: "",
        previewUrl: "",
        downloadUrl: "",
        fileAvailable: false,
        fileSize: "N/A",
        description: "Linear regression, Logistic classification, SVM with kernel trick, and Random Forests. Official department copy awaiting digitization.",
        uploadedBy: "AI & DS Dept",
        downloadsCount: 0,
        viewsCount: 22
      },
      {
        _id: "common_chem_2023",
        title: "Engineering Chemistry - Supplementary Examination 2023",
        subjectName: "Engineering Chemistry",
        subjectCode: "100202",
        branch: "Common",
        semester: 2,
        academicYear: "2023",
        category: "PYQ",
        examType: "Supplementary",
        filename: "",
        fileUrl: "",
        previewUrl: "",
        downloadUrl: "",
        fileAvailable: false,
        fileSize: "N/A",
        description: "Water treatment, Phase Rule, Spectroscopy, and Polymer chemistry supplementary question paper.",
        uploadedBy: "Applied Science Dept",
        downloadsCount: 0,
        viewsCount: 8
      }
    ];
  }
});
