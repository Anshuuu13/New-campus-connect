document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (!user.profileCompleted) {
    window.location.href = "onboarding.html";
    return;
  }

  const userId = user._id || user.id;

  // Header Elements
  const userRoleEl = document.getElementById("userRole");
  if (userRoleEl) {
    userRoleEl.textContent = user.name ? `${user.name} (${user.role || "Student"})` : (user.role || "Student");
  }

  const portfolioUserName = document.getElementById("portfolioUserName");
  const portfolioUserMeta = document.getElementById("portfolioUserMeta");
  const portfolioAvatar = document.getElementById("portfolioAvatar");
  const metricSkillsCount = document.getElementById("metricSkillsCount");
  const metricProjectsCount = document.getElementById("metricProjectsCount");
  const metricCertsCount = document.getElementById("metricCertsCount");
  const portfolioFeedback = document.getElementById("portfolioFeedback");

  if (portfolioUserName) portfolioUserName.textContent = user.name || "Student Achiever";
  if (portfolioUserMeta) {
    const dept = user.department ? user.department.toUpperCase() : "ENGINEERING";
    const role = user.role || "Student";
    portfolioUserMeta.textContent = `MITS Gwalior • ${dept} • ${role}`;
  }
  if (portfolioAvatar && user.name) {
    portfolioAvatar.src = user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0b132b&color=38bdf8&bold=true`;
  }

  // Determine active API base
  async function getApiBase() {
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      return "/api";
    }
    return "https://campus-connect-1q2c.onrender.com/api";
  }

  // Show Feedback Notification
  function showFeedback(msg, isError = false) {
    if (!portfolioFeedback) return;
    portfolioFeedback.textContent = msg;
    portfolioFeedback.style.display = "block";
    portfolioFeedback.style.background = isError ? "rgba(248, 113, 113, 0.15)" : "rgba(52, 211, 153, 0.15)";
    portfolioFeedback.style.border = isError ? "1px solid rgba(248, 113, 113, 0.3)" : "1px solid rgba(52, 211, 153, 0.3)";
    portfolioFeedback.style.color = isError ? "#f87171" : "#34d399";
    setTimeout(() => {
      portfolioFeedback.style.display = "none";
    }, 4500);
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

  function sanitizeUrl(url) {
    if (!url) return "";
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return encodeURI(trimmed);
    return encodeURI("https://" + trimmed);
  }

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  const tabButtons = document.querySelectorAll(".nav-tabs button.tab-link");
  const tabContents = {
    skills: document.getElementById("tabContentSkills"),
    projects: document.getElementById("tabContentProjects"),
    certifications: document.getElementById("tabContentCertifications")
  };

  function switchTab(tabKey) {
    tabButtons.forEach(btn => {
      if (btn.dataset.tab === tabKey) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    Object.keys(tabContents).forEach(key => {
      if (tabContents[key]) {
        tabContents[key].style.display = (key === tabKey) ? "block" : "none";
      }
    });

    window.location.hash = tabKey;
  }

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab) switchTab(btn.dataset.tab);
    });
  });

  // Check URL hash on load
  const currentHash = window.location.hash.replace("#", "");
  if (currentHash && tabContents[currentHash]) {
    switchTab(currentHash);
  }

  // ==========================================
  // MODAL CONTROLS
  // ==========================================
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  }

  document.querySelectorAll(".close-modal-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const modalId = e.target.dataset.modal || e.target.closest(".close-modal-btn").dataset.modal;
      if (modalId) closeModal(modalId);
    });
  });

  document.querySelectorAll(".portfolio-modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
      }
    });
  });

  // ==========================================
  // 1. FEATURE 1: MY SKILLS & TECHNICAL INTERESTS
  // ==========================================
  let userSkills = [];
  let userInterests = [];

  const skillsGrid = document.getElementById("skillsGrid");
  const openAddSkillModalBtn = document.getElementById("openAddSkillModalBtn");
  const skillModalTitle = document.getElementById("skillModalTitle");
  const editSkillId = document.getElementById("editSkillId");
  const skillNameInput = document.getElementById("skillNameInput");
  const skillCategoryInput = document.getElementById("skillCategoryInput");
  const skillProficiencyInput = document.getElementById("skillProficiencyInput");
  const saveSkillBtn = document.getElementById("saveSkillBtn");

  const newInterestInput = document.getElementById("newInterestInput");
  const addInterestBtn = document.getElementById("addInterestBtn");
  const interestsContainer = document.getElementById("interestsContainer");
  const skillsCategoryFilter = document.getElementById("skillsCategoryFilter");

  let activeSkillCategory = "ALL";

  function getProficiencyClass(prof) {
    if (prof === "Beginner") return "prof-beginner";
    if (prof === "Advanced") return "prof-advanced";
    return "prof-intermediate";
  }

  function getSkillLevelPercentage(prof, level) {
    if (level && level > 0 && level <= 100) return level;
    if (prof === "Beginner") return 40;
    if (prof === "Advanced") return 90;
    return 65;
  }

  async function loadSkills() {
    try {
      skillsGrid.innerHTML = "<p class='sub' style='margin: 12px 0;'>Loading your skills...</p>";
      const apiBase = await getApiBase();
      const res = await fetch(`${apiBase}/skills/${userId}`);
      if (res.ok) {
        userSkills = await res.json();
        localStorage.setItem(`cc_skills_${userId}`, JSON.stringify(userSkills));
      } else {
        const cached = localStorage.getItem(`cc_skills_${userId}`);
        if (cached) userSkills = JSON.parse(cached);
      }
    } catch (err) {
      const cached = localStorage.getItem(`cc_skills_${userId}`);
      userSkills = cached ? JSON.parse(cached) : [];
    }

    // Default starter skills if brand new account with 0 skills
    if (!userSkills || userSkills.length === 0) {
      const cached = localStorage.getItem(`cc_skills_${userId}`);
      if (cached) {
        userSkills = JSON.parse(cached);
      }
    }

    renderSkills();
    updateMetrics();
  }

  function renderSkills() {
    skillsGrid.innerHTML = "";

    const filtered = activeSkillCategory === "ALL"
      ? userSkills
      : userSkills.filter(s => (s.category || "Programming") === activeSkillCategory);

    if (filtered.length === 0) {
      skillsGrid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🛠️</div>
          <h3>${userSkills.length === 0 ? "No skills added yet" : "No skills in this category"}</h3>
          <p>${userSkills.length === 0 
            ? "Highlight your technical strengths, frameworks, and programming proficiencies to build your verified student portfolio." 
            : "Try selecting another category or click '+ Add Skill' to expand your skillset."}
          </p>
        </div>
      `;
      return;
    }

    filtered.forEach(skill => {
      const proficiency = skill.proficiency || "Intermediate";
      const category = skill.category || "Programming";
      const percent = getSkillLevelPercentage(proficiency, skill.level);
      const profClass = getProficiencyClass(proficiency);

      const card = document.createElement("div");
      card.className = "skill-card-item";
      card.innerHTML = `
        <div class="skill-card-top">
          <div>
            <span class="badge-category" style="font-size: 10px; padding: 2px 8px; margin-bottom: 6px;">${escapeHtml(category)}</span>
            <h4 class="skill-name-heading">${escapeHtml(skill.name)}</h4>
          </div>
          <div class="card-actions-row">
            <button class="btn-icon-action edit-skill-btn" data-id="${skill._id}" title="Edit Skill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon-action btn-icon-delete delete-skill-btn" data-id="${skill._id}" title="Delete Skill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-top: 4px;">
          <span class="prof-badge ${profClass}">${escapeHtml(proficiency)}</span>
          <span style="font-family: var(--mono); color: var(--text-dim); font-size: 11px;">${percent}% Mastery</span>
        </div>

        <div class="progress-track" style="margin-top: 6px;">
          <div class="progress-fill" style="width: ${percent}%;"></div>
        </div>
      `;

      skillsGrid.appendChild(card);
    });

    // Attach edit and delete handlers
    document.querySelectorAll(".edit-skill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const skill = userSkills.find(s => s._id === id);
        if (!skill) return;

        skillModalTitle.textContent = "Edit Skill";
        editSkillId.value = skill._id;
        skillNameInput.value = skill.name;
        skillCategoryInput.value = skill.category || "Programming";
        skillProficiencyInput.value = skill.proficiency || "Intermediate";
        openModal("skillModal");
      });
    });

    document.querySelectorAll(".delete-skill-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const skill = userSkills.find(s => s._id === id);
        if (!confirm(`Are you sure you want to delete "${skill ? skill.name : "this skill"}"?`)) return;

        try {
          const apiBase = await getApiBase();
          await fetch(`${apiBase}/skills/${id}`, { method: "DELETE" });
          userSkills = userSkills.filter(s => s._id !== id);
          localStorage.setItem(`cc_skills_${userId}`, JSON.stringify(userSkills));
          renderSkills();
          updateMetrics();
          showFeedback("Skill deleted.");
        } catch (err) {
          userSkills = userSkills.filter(s => s._id !== id);
          localStorage.setItem(`cc_skills_${userId}`, JSON.stringify(userSkills));
          renderSkills();
          updateMetrics();
          showFeedback("Skill deleted locally.");
        }
      });
    });
  }

  // Category filter clicks
  if (skillsCategoryFilter) {
    skillsCategoryFilter.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        skillsCategoryFilter.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeSkillCategory = btn.dataset.cat || "ALL";
        renderSkills();
      });
    });
  }

  // Open Add Skill Modal
  if (openAddSkillModalBtn) {
    openAddSkillModalBtn.addEventListener("click", () => {
      skillModalTitle.textContent = "Add New Skill";
      editSkillId.value = "";
      skillNameInput.value = "";
      skillCategoryInput.value = "Programming";
      skillProficiencyInput.value = "Intermediate";
      openModal("skillModal");
      skillNameInput.focus();
    });
  }

  // Save Skill Handler
  if (saveSkillBtn) {
    saveSkillBtn.addEventListener("click", async () => {
      const name = skillNameInput.value.trim();
      const category = skillCategoryInput.value;
      const proficiency = skillProficiencyInput.value;
      const isEdit = Boolean(editSkillId.value);

      if (!name) {
        alert("Please enter a skill name.");
        skillNameInput.focus();
        return;
      }

      saveSkillBtn.disabled = true;

      const payload = {
        userId,
        name,
        category,
        proficiency
      };

      try {
        const apiBase = await getApiBase();
        if (isEdit) {
          const res = await fetch(`${apiBase}/skills/${editSkillId.value}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const updated = res.ok ? await res.json() : { _id: editSkillId.value, ...payload };
          userSkills = userSkills.map(s => s._id === editSkillId.value ? { ...s, ...updated } : s);
          showFeedback("Skill updated successfully!");
        } else {
          const res = await fetch(`${apiBase}/skills`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const created = res.ok ? await res.json() : { _id: "local_" + Date.now(), ...payload };
          userSkills.unshift(created);
          showFeedback("Skill added successfully!");
        }

        localStorage.setItem(`cc_skills_${userId}`, JSON.stringify(userSkills));
        closeModal("skillModal");
        renderSkills();
        updateMetrics();
      } catch (err) {
        console.error("SAVE SKILL ERROR:", err);
        const fallbackObj = {
          _id: isEdit ? editSkillId.value : "local_" + Date.now(),
          ...payload
        };
        if (isEdit) {
          userSkills = userSkills.map(s => s._id === editSkillId.value ? fallbackObj : s);
        } else {
          userSkills.unshift(fallbackObj);
        }
        localStorage.setItem(`cc_skills_${userId}`, JSON.stringify(userSkills));
        closeModal("skillModal");
        renderSkills();
        updateMetrics();
        showFeedback("Saved skill to your portfolio.");
      } finally {
        saveSkillBtn.disabled = false;
      }
    });
  }

  // --- Technical Interests ---
  async function loadInterests() {
    try {
      const apiBase = await getApiBase();
      const res = await fetch(`${apiBase}/users/${userId}`);
      if (res.ok) {
        const userData = await res.json();
        if (Array.isArray(userData.interests)) {
          userInterests = userData.interests;
        }
      }
    } catch (e) {
      // Use cached
    }

    if (!userInterests || userInterests.length === 0) {
      const cached = localStorage.getItem(`cc_interests_${userId}`);
      userInterests = cached ? JSON.parse(cached) : ["AI/ML Systems", "Full Stack Development", "Cloud Architecture"];
    }

    renderInterests();
  }

  function renderInterests() {
    if (!interestsContainer) return;
    interestsContainer.innerHTML = "";

    if (userInterests.length === 0) {
      interestsContainer.innerHTML = "<p class='sub' style='margin: 6px 0; font-size: 13px;'>No technical interests listed yet. Add domains you want to explore above!</p>";
      return;
    }

    userInterests.forEach((interest, idx) => {
      const chip = document.createElement("span");
      chip.className = "interest-tag-chip";
      chip.innerHTML = `
        <span>${escapeHtml(interest)}</span>
        <span class="interest-tag-remove" data-idx="${idx}" title="Remove Interest">×</span>
      `;
      interestsContainer.appendChild(chip);
    });

    document.querySelectorAll(".interest-tag-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        userInterests.splice(idx, 1);
        persistInterests();
      });
    });
  }

  async function persistInterests() {
    localStorage.setItem(`cc_interests_${userId}`, JSON.stringify(userInterests));
    renderInterests();

    try {
      const apiBase = await getApiBase();
      await fetch(`${apiBase}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: userInterests })
      });
      showFeedback("Technical interests updated.");
    } catch (err) {
      // Cached locally
    }
  }

  if (addInterestBtn && newInterestInput) {
    function handleAddInterest() {
      const val = newInterestInput.value.trim();
      if (!val) return;
      if (!userInterests.includes(val)) {
        userInterests.push(val);
        persistInterests();
      }
      newInterestInput.value = "";
    }

    addInterestBtn.addEventListener("click", handleAddInterest);
    newInterestInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddInterest();
      }
    });
  }

  // ==========================================
  // 2. FEATURE 2: MY PROJECTS
  // ==========================================
  let userProjects = [];

  const projectsGrid = document.getElementById("projectsGrid");
  const openAddProjectModalBtn = document.getElementById("openAddProjectModalBtn");
  const projectModalTitle = document.getElementById("projectModalTitle");
  const editProjectId = document.getElementById("editProjectId");
  const projectTitleField = document.getElementById("projectTitleField");
  const projectDescField = document.getElementById("projectDescField");
  const projectTechField = document.getElementById("projectTechField");
  const projectGithubField = document.getElementById("projectGithubField");
  const projectLiveField = document.getElementById("projectLiveField");
  const projectStatusField = document.getElementById("projectStatusField");
  const projectImgField = document.getElementById("projectImgField");
  const saveProjectBtn = document.getElementById("saveProjectBtn");

  async function loadProjects() {
    try {
      projectsGrid.innerHTML = "<p class='sub' style='margin: 12px 0;'>Loading your projects...</p>";
      const apiBase = await getApiBase();
      const res = await fetch(`${apiBase}/projects/${userId}`);
      if (res.ok) {
        userProjects = await res.json();
        localStorage.setItem(`cc_projects_${userId}`, JSON.stringify(userProjects));
      } else {
        const cached = localStorage.getItem(`cc_projects_${userId}`);
        if (cached) userProjects = JSON.parse(cached);
      }
    } catch (err) {
      const cached = localStorage.getItem(`cc_projects_${userId}`);
      userProjects = cached ? JSON.parse(cached) : [];
    }

    renderProjects();
    updateMetrics();
  }

  function renderProjects() {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = "";

    if (userProjects.length === 0) {
      projectsGrid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🚀</div>
          <h3>No projects added yet</h3>
          <p>Add technical projects, hackathon solutions, or personal software builds to showcase in your portfolio with GitHub and Live Demo links.</p>
        </div>
      `;
      return;
    }

    userProjects.forEach(proj => {
      const isCompleted = proj.status === "Completed";
      const statusClass = isCompleted ? "status-completed" : "status-in-progress";
      const statusText = proj.status || "In Progress";
      const techList = (proj.technologies || "").split(",").map(t => t.trim()).filter(Boolean);

      const card = document.createElement("div");
      card.className = "project-card-item";

      const imageBoxHtml = proj.imageUrl ? `
        <div class="project-img-box">
          <img src="${sanitizeUrl(proj.imageUrl)}" alt="${escapeHtml(proj.title)}" class="project-cover-img" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'project-img-fallback\\'>💻</div><span class=\\'project-status-pill ${statusClass}\\'>${statusText}</span>';">
          <span class="project-status-pill ${statusClass}">${statusText}</span>
        </div>
      ` : `
        <div class="project-img-box">
          <div class="project-img-fallback">💻</div>
          <span class="project-status-pill ${statusClass}">${statusText}</span>
        </div>
      `;

      const githubBtn = proj.githubUrl ? `
        <a href="${sanitizeUrl(proj.githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn-project-link btn-github-link" title="Open GitHub Repository">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 13px; height: 13px;"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
          GitHub ↗
        </a>
      ` : "";

      const liveBtn = proj.liveUrl ? `
        <a href="${sanitizeUrl(proj.liveUrl)}" target="_blank" rel="noopener noreferrer" class="btn-project-link btn-demo-link" title="Open Live Web Application">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 13px; height: 13px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Live Demo ↗
        </a>
      ` : "";

      const techBadges = techList.length > 0 ? `
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;">
          ${techList.map(t => `<span class="badge-category" style="font-size: 10px; padding: 2px 8px;">${escapeHtml(t)}</span>`).join("")}
        </div>
      ` : "";

      card.innerHTML = `
        ${imageBoxHtml}
        <div class="project-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
            <h3 style="margin: 0; font-family: var(--display); font-size: 18px; color: var(--text);">${escapeHtml(proj.title)}</h3>
            <div class="card-actions-row">
              <button class="btn-icon-action edit-proj-btn" data-id="${proj._id}" title="Edit Project">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-icon-action btn-icon-delete delete-proj-btn" data-id="${proj._id}" title="Delete Project">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>

          <p style="font-size: 13px; color: var(--text-dim); line-height: 1.5; margin: 0 0 12px; flex: 1;">
            ${escapeHtml(proj.description || "No project description provided yet.")}
          </p>

          ${techBadges}

          <div class="project-buttons-row">
            ${githubBtn}
            ${liveBtn}
            ${!githubBtn && !liveBtn ? `<span style="font-size: 11px; font-family: var(--mono); color: var(--text-dim);">No external URLs added</span>` : ""}
          </div>
        </div>
      `;

      projectsGrid.appendChild(card);
    });

    // Attach edit and delete handlers
    document.querySelectorAll(".edit-proj-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const proj = userProjects.find(p => p._id === id);
        if (!proj) return;

        projectModalTitle.textContent = "Edit Project";
        editProjectId.value = proj._id;
        projectTitleField.value = proj.title || "";
        projectDescField.value = proj.description || "";
        projectTechField.value = proj.technologies || "";
        projectGithubField.value = proj.githubUrl || "";
        projectLiveField.value = proj.liveUrl || "";
        projectStatusField.value = proj.status || "In Progress";
        projectImgField.value = proj.imageUrl || "";

        openModal("projectModal");
      });
    });

    document.querySelectorAll(".delete-proj-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const proj = userProjects.find(p => p._id === id);
        if (!confirm(`Are you sure you want to delete "${proj ? proj.title : "this project"}"?`)) return;

        try {
          const apiBase = await getApiBase();
          await fetch(`${apiBase}/projects/${id}`, { method: "DELETE" });
          userProjects = userProjects.filter(p => p._id !== id);
          localStorage.setItem(`cc_projects_${userId}`, JSON.stringify(userProjects));
          renderProjects();
          updateMetrics();
          showFeedback("Project deleted.");
        } catch (err) {
          userProjects = userProjects.filter(p => p._id !== id);
          localStorage.setItem(`cc_projects_${userId}`, JSON.stringify(userProjects));
          renderProjects();
          updateMetrics();
          showFeedback("Project deleted locally.");
        }
      });
    });
  }

  // Open Add Project Modal
  if (openAddProjectModalBtn) {
    openAddProjectModalBtn.addEventListener("click", () => {
      projectModalTitle.textContent = "Add New Project";
      editProjectId.value = "";
      projectTitleField.value = "";
      projectDescField.value = "";
      projectTechField.value = "";
      projectGithubField.value = "";
      projectLiveField.value = "";
      projectStatusField.value = "In Progress";
      projectImgField.value = "";
      openModal("projectModal");
      projectTitleField.focus();
    });
  }

  // Save Project Handler
  if (saveProjectBtn) {
    saveProjectBtn.addEventListener("click", async () => {
      const title = projectTitleField.value.trim();
      const description = projectDescField.value.trim();
      const technologies = projectTechField.value.trim();
      const githubUrl = projectGithubField.value.trim();
      const liveUrl = projectLiveField.value.trim();
      const status = projectStatusField.value;
      const imageUrl = projectImgField.value.trim();
      const isEdit = Boolean(editProjectId.value);

      if (!title) {
        alert("Please enter a project title.");
        projectTitleField.focus();
        return;
      }

      if (!description) {
        alert("Please provide a short description for the project.");
        projectDescField.focus();
        return;
      }

      if (githubUrl && !/^(https?:\/\/|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5})/i.test(githubUrl)) {
        alert("Please enter a valid URL for GitHub repository.");
        projectGithubField.focus();
        return;
      }

      if (liveUrl && !/^(https?:\/\/|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5})/i.test(liveUrl)) {
        alert("Please enter a valid URL for the live demo.");
        projectLiveField.focus();
        return;
      }

      saveProjectBtn.disabled = true;

      const payload = {
        userId,
        title,
        description,
        technologies,
        githubUrl,
        liveUrl,
        status,
        imageUrl,
        progress: status === "Completed" ? 100 : 50,
        isPublic: true
      };

      try {
        const apiBase = await getApiBase();
        if (isEdit) {
          const res = await fetch(`${apiBase}/projects/${editProjectId.value}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const updated = res.ok ? await res.json() : { _id: editProjectId.value, ...payload };
          userProjects = userProjects.map(p => p._id === editProjectId.value ? { ...p, ...updated } : p);
          showFeedback("Project updated successfully!");
        } else {
          const res = await fetch(`${apiBase}/projects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const created = res.ok ? await res.json() : { _id: "local_" + Date.now(), ...payload };
          userProjects.unshift(created);
          showFeedback("Project added to portfolio!");
        }

        localStorage.setItem(`cc_projects_${userId}`, JSON.stringify(userProjects));
        closeModal("projectModal");
        renderProjects();
        updateMetrics();
      } catch (err) {
        console.error("SAVE PROJECT ERROR:", err);
        const fallbackObj = {
          _id: isEdit ? editProjectId.value : "local_" + Date.now(),
          ...payload
        };
        if (isEdit) {
          userProjects = userProjects.map(p => p._id === editProjectId.value ? fallbackObj : p);
        } else {
          userProjects.unshift(fallbackObj);
        }
        localStorage.setItem(`cc_projects_${userId}`, JSON.stringify(userProjects));
        closeModal("projectModal");
        renderProjects();
        updateMetrics();
        showFeedback("Saved project to your portfolio.");
      } finally {
        saveProjectBtn.disabled = false;
      }
    });
  }

  // ==========================================
  // 3. FEATURE 3: MY CERTIFICATIONS
  // ==========================================
  let userCertifications = [];

  const certificationsGrid = document.getElementById("certificationsGrid");
  const openAddCertModalBtn = document.getElementById("openAddCertModalBtn");
  const certModalTitle = document.getElementById("certModalTitle");
  const editCertId = document.getElementById("editCertId");
  const certNameField = document.getElementById("certNameField");
  const certIssuerField = document.getElementById("certIssuerField");
  const certDateField = document.getElementById("certDateField");
  const certUrlField = document.getElementById("certUrlField");
  const certImgField = document.getElementById("certImgField");
  const saveCertBtn = document.getElementById("saveCertBtn");

  async function loadCertifications() {
    try {
      certificationsGrid.innerHTML = "<p class='sub' style='margin: 12px 0;'>Loading your certifications...</p>";
      const apiBase = await getApiBase();
      const res = await fetch(`${apiBase}/certifications/${userId}`);
      if (res.ok) {
        userCertifications = await res.json();
        localStorage.setItem(`cc_certs_${userId}`, JSON.stringify(userCertifications));
      } else {
        const cached = localStorage.getItem(`cc_certs_${userId}`);
        if (cached) userCertifications = JSON.parse(cached);
      }
    } catch (err) {
      const cached = localStorage.getItem(`cc_certs_${userId}`);
      userCertifications = cached ? JSON.parse(cached) : [];
    }

    renderCertifications();
    updateMetrics();
  }

  function renderCertifications() {
    if (!certificationsGrid) return;
    certificationsGrid.innerHTML = "";

    if (userCertifications.length === 0) {
      certificationsGrid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📜</div>
          <h3>No certifications added yet</h3>
          <p>Add your NPTEL certificates, cloud credentials, hackathon completion certificates, or industry badges with verification links.</p>
        </div>
      `;
      return;
    }

    userCertifications.forEach(cert => {
      const card = document.createElement("div");
      card.className = "cert-card-item";

      const verifyLinkHtml = cert.credentialUrl ? `
        <a href="${sanitizeUrl(cert.credentialUrl)}" target="_blank" rel="noopener noreferrer" class="evidence-btn" style="margin-top: 8px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Verify Credential ↗
        </a>
      ` : "";

      card.innerHTML = `
        <div class="cert-top-row">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(59, 130, 246, 0.12); display: flex; align-items: center; justify-content: center; font-size: 20px;">
              🏅
            </div>
            <div>
              <h4 style="margin: 0 0 3px; font-size: 16px; font-family: var(--display); color: var(--text);">${escapeHtml(cert.name)}</h4>
              <p style="margin: 0; font-size: 13px; color: var(--teal); font-family: var(--mono);">${escapeHtml(cert.issuingOrganization)}</p>
            </div>
          </div>
          <div class="card-actions-row">
            <button class="btn-icon-action edit-cert-btn" data-id="${cert._id}" title="Edit Certification">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon-action btn-icon-delete delete-cert-btn" data-id="${cert._id}" title="Delete Certification">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        ${cert.issueDate ? `
          <div style="font-family: var(--mono); font-size: 11px; color: var(--text-dim); margin-top: 4px;">
            Issued: ${escapeHtml(cert.issueDate)}
          </div>
        ` : ""}

        <div style="margin-top: 6px;">
          ${verifyLinkHtml}
        </div>
      `;

      certificationsGrid.appendChild(card);
    });

    // Attach edit and delete handlers
    document.querySelectorAll(".edit-cert-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const cert = userCertifications.find(c => c._id === id);
        if (!cert) return;

        certModalTitle.textContent = "Edit Certification";
        editCertId.value = cert._id;
        certNameField.value = cert.name || "";
        certIssuerField.value = cert.issuingOrganization || "";
        certDateField.value = cert.issueDate || "";
        certUrlField.value = cert.credentialUrl || "";
        certImgField.value = cert.imageUrl || "";

        openModal("certModal");
      });
    });

    document.querySelectorAll(".delete-cert-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const cert = userCertifications.find(c => c._id === id);
        if (!confirm(`Are you sure you want to delete "${cert ? cert.name : "this certification"}"?`)) return;

        try {
          const apiBase = await getApiBase();
          await fetch(`${apiBase}/certifications/${id}`, { method: "DELETE" });
          userCertifications = userCertifications.filter(c => c._id !== id);
          localStorage.setItem(`cc_certs_${userId}`, JSON.stringify(userCertifications));
          renderCertifications();
          updateMetrics();
          showFeedback("Certification deleted.");
        } catch (err) {
          userCertifications = userCertifications.filter(c => c._id !== id);
          localStorage.setItem(`cc_certs_${userId}`, JSON.stringify(userCertifications));
          renderCertifications();
          updateMetrics();
          showFeedback("Certification deleted locally.");
        }
      });
    });
  }

  // Open Add Certification Modal
  if (openAddCertModalBtn) {
    openAddCertModalBtn.addEventListener("click", () => {
      certModalTitle.textContent = "Add New Certification";
      editCertId.value = "";
      certNameField.value = "";
      certIssuerField.value = "";
      certDateField.value = "";
      certUrlField.value = "";
      certImgField.value = "";
      openModal("certModal");
      certNameField.focus();
    });
  }

  // Save Certification Handler
  if (saveCertBtn) {
    saveCertBtn.addEventListener("click", async () => {
      const name = certNameField.value.trim();
      const issuingOrganization = certIssuerField.value.trim();
      const issueDate = certDateField.value.trim();
      const credentialUrl = certUrlField.value.trim();
      const imageUrl = certImgField.value.trim();
      const isEdit = Boolean(editCertId.value);

      if (!name) {
        alert("Please enter the certification name.");
        certNameField.focus();
        return;
      }

      if (!issuingOrganization) {
        alert("Please enter the issuing organization (e.g. AWS, NPTEL, Coursera).");
        certIssuerField.focus();
        return;
      }

      if (credentialUrl && !/^(https?:\/\/|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5})/i.test(credentialUrl)) {
        alert("Please enter a valid credential verification URL.");
        certUrlField.focus();
        return;
      }

      saveCertBtn.disabled = true;

      const payload = {
        userId,
        name,
        issuingOrganization,
        issueDate,
        credentialUrl,
        imageUrl
      };

      try {
        const apiBase = await getApiBase();
        if (isEdit) {
          const res = await fetch(`${apiBase}/certifications/${editCertId.value}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const updated = res.ok ? await res.json() : { _id: editCertId.value, ...payload };
          userCertifications = userCertifications.map(c => c._id === editCertId.value ? { ...c, ...updated } : c);
          showFeedback("Certification updated successfully!");
        } else {
          const res = await fetch(`${apiBase}/certifications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const created = res.ok ? await res.json() : { _id: "local_" + Date.now(), ...payload };
          userCertifications.unshift(created);
          showFeedback("Certification added to portfolio!");
        }

        localStorage.setItem(`cc_certs_${userId}`, JSON.stringify(userCertifications));
        closeModal("certModal");
        renderCertifications();
        updateMetrics();
      } catch (err) {
        console.error("SAVE CERTIFICATION ERROR:", err);
        const fallbackObj = {
          _id: isEdit ? editCertId.value : "local_" + Date.now(),
          ...payload
        };
        if (isEdit) {
          userCertifications = userCertifications.map(c => c._id === editCertId.value ? fallbackObj : c);
        } else {
          userCertifications.unshift(fallbackObj);
        }
        localStorage.setItem(`cc_certs_${userId}`, JSON.stringify(userCertifications));
        closeModal("certModal");
        renderCertifications();
        updateMetrics();
        showFeedback("Saved certification to your portfolio.");
      } finally {
        saveCertBtn.disabled = false;
      }
    });
  }

  // --- Metrics Counter ---
  function updateMetrics() {
    if (metricSkillsCount) metricSkillsCount.textContent = userSkills.length;
    if (metricProjectsCount) metricProjectsCount.textContent = userProjects.length;
    if (metricCertsCount) metricCertsCount.textContent = userCertifications.length;
  }

  // Initialize Portfolio Data
  await Promise.all([
    loadSkills(),
    loadInterests(),
    loadProjects(),
    loadCertifications()
  ]);
});
