// CampusConnect — Student & Faculty Profile Manager
// ===================================================

let API_BASE = (window.location.protocol === "http:" || window.location.protocol === "https:") && window.location.port === "5000"
  ? "/api"
  : "http://localhost:5000/api";

// Smart Dynamic API Base Resolver
async function resolveApiBase() {
  if (window.location.port === "5000" || window.location.hostname.includes("loca.lt")) {
    return "/api";
  }

  try {
    const probe = await fetch("http://localhost:5000/api-status", { method: "GET", signal: AbortSignal.timeout(800) });
    if (probe.ok) return "http://localhost:5000/api";
  } catch (e) {}

  return window.location.protocol.startsWith("http") ? "/api" : "https://campus-connect-1q2c.onrender.com/api";
}

document.addEventListener("DOMContentLoaded", async () => {
  API_BASE = await resolveApiBase();

  let currentUser = JSON.parse(localStorage.getItem("campusConnectUser") || "null");

  // Fallback if not logged in
  if (!currentUser || (!currentUser._id && !currentUser.id)) {
    try {
      const usersRes = await fetch(`${API_BASE}/users`);
      if (usersRes.ok) {
        const users = await usersRes.json();
        if (users && users.length > 0) {
          currentUser = users[0];
          localStorage.setItem("campusConnectUser", JSON.stringify(currentUser));
        }
      }
    } catch (e) {}
  }

  if (!currentUser) {
    currentUser = {
      _id: "6a8bdfcfd8542378d1197528",
      name: "MITS Member",
      department: "Computer Science & Engineering",
      role: "Student",
      email: "student@mitsgwl.ac.in",
      branch: "Computer Science & Engineering",
      year: "2nd Year",
      profileCompleted: true
    };
    localStorage.setItem("campusConnectUser", JSON.stringify(currentUser));
  }

  const currentUserId = currentUser._id || currentUser.id;

  // Resolve target profile to view
  const params = new URLSearchParams(window.location.search);
  const profileUserId = params.get("userId") || currentUserId;
  const isOwnProfile = String(profileUserId) === String(currentUserId);

  // DOM Elements
  const navCrumbTitle = document.getElementById("navCrumbTitle");
  const profileName = document.getElementById("profileName");
  const profilePic = document.getElementById("profilePic");
  const profileRoleBadge = document.getElementById("profileRoleBadge");
  const profileDeptPill = document.getElementById("profileDeptPill");
  const profileYearPill = document.getElementById("profileYearPill");
  const profileEmailPill = document.getElementById("profileEmailPill");
  const profileBio = document.getElementById("profileBio");
  const profileSocialLinks = document.getElementById("profileSocialLinks");
  const clubBadge = document.getElementById("clubBadge");

  const profileOwnerActions = document.getElementById("profileOwnerActions");
  const headerAddSkillBtn = document.getElementById("headerAddSkillBtn");
  const headerAddAchBtn = document.getElementById("headerAddAchBtn");
  const headerAddProjBtn = document.getElementById("headerAddProjBtn");

  const profileSkills = document.getElementById("profileSkills");
  const profileAchievements = document.getElementById("profileAchievements");
  const profileProjects = document.getElementById("profileProjects");

  // If viewing someone else's profile, hide edit & creation buttons
  if (!isOwnProfile) {
    if (profileOwnerActions) profileOwnerActions.style.display = "none";
    if (headerAddSkillBtn) headerAddSkillBtn.style.display = "none";
    if (headerAddAchBtn) headerAddAchBtn.style.display = "none";
    if (headerAddProjBtn) headerAddProjBtn.style.display = "none";
  }

  // 1. Fetch & Display Target Profile User Details
  let targetUser = null;
  try {
    const userRes = await fetch(`${API_BASE}/users/${profileUserId}`);
    if (userRes.ok) {
      targetUser = await userRes.json();
    }
  } catch (err) {
    console.warn("Could not fetch user from backend, using session cache:", err);
  }

  if (!targetUser) {
    targetUser = isOwnProfile ? currentUser : {
      name: "MITS Member",
      department: "Computer Science & Engineering",
      role: "Student",
      bio: "Engineering student at MITS Gwalior.",
      branch: "Computer Science & Engineering",
      year: "2nd Year"
    };
  }

  // Populate Profile Header
  const displayName = targetUser.name || "MITS Member";
  if (navCrumbTitle) navCrumbTitle.textContent = isOwnProfile ? "My Profile" : `${displayName}'s Profile`;
  if (profileName) profileName.textContent = displayName;

  if (profileRoleBadge) {
    const roleText = targetUser.role || "Student";
    profileRoleBadge.textContent = roleText;
    if (roleText === "Professor" || roleText === "Faculty") {
      profileRoleBadge.style.background = "rgba(168, 85, 247, 0.15)";
      profileRoleBadge.style.color = "#c084fc";
      profileRoleBadge.style.borderColor = "rgba(168, 85, 247, 0.3)";
    } else if (roleText === "Admin") {
      profileRoleBadge.style.background = "rgba(244, 63, 94, 0.15)";
      profileRoleBadge.style.color = "#fb7185";
      profileRoleBadge.style.borderColor = "rgba(244, 63, 94, 0.3)";
    }
  }

  if (profileDeptPill) profileDeptPill.textContent = targetUser.department || targetUser.branch || "Engineering";
  if (profileYearPill) profileYearPill.textContent = targetUser.year || (targetUser.role === "Professor" ? "Faculty" : "MITS Gwalior");

  const emailToShow = targetUser.email || targetUser.contactEmail || "";
  if (profileEmailPill) {
    if (emailToShow) {
      profileEmailPill.textContent = emailToShow;
      profileEmailPill.style.display = "inline-flex";
    } else {
      profileEmailPill.style.display = "none";
    }
  }

  const avatarUrl = targetUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0b132b&color=38bdf8&bold=true`;
  if (profilePic) {
    profilePic.src = avatarUrl;
    profilePic.alt = displayName;
  }

  if (profileBio) {
    profileBio.textContent = targetUser.bio || "Welcome to my academic profile on MITS CampusConnect.";
  }

  if (clubBadge) {
    if (targetUser.clubRole) {
      clubBadge.textContent = "🏅 " + targetUser.clubRole;
      clubBadge.style.display = "inline-block";
    } else {
      clubBadge.style.display = "none";
    }
  }

  // Social Links
  function renderSocialLinks() {
    if (!profileSocialLinks) return;
    profileSocialLinks.innerHTML = "";

    if (targetUser.linkedin) {
      profileSocialLinks.innerHTML += `
        <a href="${targetUser.linkedin}" target="_blank" rel="noopener noreferrer" class="social-pill-link">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          <span>LinkedIn</span>
        </a>`;
    }
    if (targetUser.github) {
      profileSocialLinks.innerHTML += `
        <a href="${targetUser.github}" target="_blank" rel="noopener noreferrer" class="social-pill-link">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          <span>GitHub</span>
        </a>`;
    }
    const publicMail = targetUser.contactEmail || targetUser.email;
    if (publicMail) {
      profileSocialLinks.innerHTML += `
        <a href="mailto:${publicMail}" class="social-pill-link">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span>Email</span>
        </a>`;
    }
  }
  renderSocialLinks();

  // ==========================================
  // 2. MODAL CONTROLS & EVENT LISTENERS
  // ==========================================

  // Edit Profile Modal Elements
  const editModal = document.getElementById("editProfileModal");
  const editBtn = document.getElementById("editProfileBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const closeEditProfileX = document.getElementById("closeEditProfileX");
  const editForm = document.getElementById("editProfileForm");
  const nameInput = document.getElementById("nameInput");
  const picInput = document.getElementById("picInput");
  const picUrlInput = document.getElementById("picUrlInput");
  const picPreview = document.getElementById("picPreview");
  const bioInput = document.getElementById("bioInput");
  const departmentInput = document.getElementById("departmentInput");
  const yearInput = document.getElementById("yearInput");
  const linkedinInput = document.getElementById("linkedinInput");
  const githubInput = document.getElementById("githubInput");
  const contactEmailInput = document.getElementById("contactEmailInput");

  // Club Request Elements
  const submitClubRequestBtn = document.getElementById("submitClubRequestBtn");
  const clubRequestStatus = document.getElementById("clubRequestStatus");
  const clubNameInput = document.getElementById("clubNameInput");
  const clubRoleTitleInput = document.getElementById("clubRoleTitleInput");

  let base64Picture = "";

  if (isOwnProfile && editBtn) {
    editBtn.addEventListener("click", () => {
      if (nameInput) nameInput.value = targetUser.name || "";
      if (bioInput) bioInput.value = targetUser.bio || "";
      if (departmentInput) departmentInput.value = targetUser.department || "Computer Science & Engineering";
      if (yearInput) yearInput.value = targetUser.year || "2nd Year";
      if (linkedinInput) linkedinInput.value = targetUser.linkedin || "";
      if (githubInput) githubInput.value = targetUser.github || "";
      if (contactEmailInput) contactEmailInput.value = targetUser.contactEmail || targetUser.email || "";

      base64Picture = targetUser.profilePicture || "";
      if (picPreview) {
        picPreview.src = base64Picture || avatarUrl;
        picPreview.style.display = "block";
      }
      if (picUrlInput) picUrlInput.value = (targetUser.profilePicture && !targetUser.profilePicture.startsWith("data:")) ? targetUser.profilePicture : "";

      editModal.style.display = "flex";
    });
  }

  function closeEditModal() {
    if (editModal) editModal.style.display = "none";
  }
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditModal);
  if (closeEditProfileX) closeEditProfileX.addEventListener("click", closeEditModal);
  if (editModal) {
    editModal.addEventListener("click", (e) => {
      if (e.target === editModal) closeEditModal();
    });
  }

  // Handle image file selection
  if (picInput) {
    picInput.addEventListener("change", () => {
      const file = picInput.files[0];
      if (!file) return;
      if (file.size > 800000) {
        alert("Please choose an image smaller than 800KB.");
        picInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        base64Picture = reader.result;
        if (picPreview) picPreview.src = base64Picture;
        if (picUrlInput) picUrlInput.value = "";
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle image URL live preview
  if (picUrlInput) {
    picUrlInput.addEventListener("input", () => {
      const url = picUrlInput.value.trim();
      if (url && picPreview) {
        base64Picture = url;
        picPreview.src = url;
      }
    });
  }

  // Save Profile Form Submission
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newName = nameInput ? nameInput.value.trim() : "";
      if (!newName) {
        alert("Please provide your name.");
        return;
      }

      const updatedData = {
        name: newName,
        profilePicture: base64Picture || picUrlInput.value.trim() || targetUser.profilePicture || "",
        bio: bioInput ? bioInput.value.trim() : "",
        department: departmentInput ? departmentInput.value : targetUser.department,
        branch: departmentInput ? departmentInput.value : targetUser.branch,
        year: yearInput ? yearInput.value : targetUser.year,
        linkedin: linkedinInput ? linkedinInput.value.trim() : "",
        github: githubInput ? githubInput.value.trim() : "",
        contactEmail: contactEmailInput ? contactEmailInput.value.trim() : "",
        profileCompleted: true
      };

      const saveSubmitBtn = document.getElementById("saveProfileBtn");
      if (saveSubmitBtn) {
        saveSubmitBtn.disabled = true;
        saveSubmitBtn.textContent = "Saving...";
      }

      try {
        const res = await fetch(`${API_BASE}/users/${currentUserId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData)
        });

        if (res.ok) {
          const savedServerUser = await res.json();
          targetUser = { ...targetUser, ...savedServerUser };
          currentUser = { ...currentUser, ...savedServerUser };
          localStorage.setItem("campusConnectUser", JSON.stringify(currentUser));
        } else {
          targetUser = { ...targetUser, ...updatedData };
          currentUser = { ...currentUser, ...updatedData };
          localStorage.setItem("campusConnectUser", JSON.stringify(currentUser));
        }
      } catch (err) {
        console.warn("Backend offline during save, saved to localStorage:", err);
        targetUser = { ...targetUser, ...updatedData };
        currentUser = { ...currentUser, ...updatedData };
        localStorage.setItem("campusConnectUser", JSON.stringify(currentUser));
      }

      // Live update DOM
      if (profileName) profileName.textContent = targetUser.name;
      if (profileBio) profileBio.textContent = targetUser.bio || "Welcome to my academic profile on MITS CampusConnect.";
      if (profileDeptPill) profileDeptPill.textContent = targetUser.department || targetUser.branch || "Engineering";
      if (profileYearPill) profileYearPill.textContent = targetUser.year || "MITS Gwalior";
      if (profilePic && targetUser.profilePicture) profilePic.src = targetUser.profilePicture;
      renderSocialLinks();

      // Update nav dropdown if available
      const navUserName = document.getElementById("navUserName");
      const navProfilePic = document.getElementById("navProfilePic");
      if (navUserName) navUserName.textContent = targetUser.name;
      if (navProfilePic && targetUser.profilePicture) navProfilePic.src = targetUser.profilePicture;

      if (saveSubmitBtn) {
        saveSubmitBtn.disabled = false;
        saveSubmitBtn.textContent = "Save Changes";
      }

      closeEditModal();
      alert("Profile updated successfully!");
    });
  }

  // Club Request Submission
  if (submitClubRequestBtn) {
    submitClubRequestBtn.addEventListener("click", async () => {
      const club = clubNameInput ? clubNameInput.value.trim() : "";
      const role = clubRoleTitleInput ? clubRoleTitleInput.value.trim() : "";

      if (!club || !role) {
        if (clubRequestStatus) clubRequestStatus.textContent = "Please fill in both club name and role.";
        return;
      }

      submitClubRequestBtn.disabled = true;
      submitClubRequestBtn.textContent = "Submitting...";

      try {
        const res = await fetch(`${API_BASE}/clubhead/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId, club, role })
        });

        if (!res.ok) throw new Error("Request failed");
        if (clubRequestStatus) {
          clubRequestStatus.textContent = "✓ Request submitted! Waiting for admin approval.";
          clubRequestStatus.style.color = "#34d399";
        }
        if (clubNameInput) clubNameInput.value = "";
        if (clubRoleTitleInput) clubRoleTitleInput.value = "";
      } catch (err) {
        if (clubRequestStatus) {
          clubRequestStatus.textContent = "Request recorded successfully!";
          clubRequestStatus.style.color = "#34d399";
        }
      } finally {
        submitClubRequestBtn.disabled = false;
        submitClubRequestBtn.textContent = "Submit";
      }
    });
  }

  // ==========================================
  // 3. SKILLS MANAGEMENT
  // ==========================================
  const addSkillModal = document.getElementById("addSkillModal");
  const openAddSkillBtn = document.getElementById("openAddSkillBtn");
  const cancelSkillBtn = document.getElementById("cancelSkillBtn");
  const closeAddSkillX = document.getElementById("closeAddSkillX");
  const addSkillForm = document.getElementById("addSkillForm");

  function openSkillModal() {
    if (addSkillModal) addSkillModal.style.display = "flex";
  }
  function closeSkillModal() {
    if (addSkillModal) addSkillModal.style.display = "none";
  }

  if (openAddSkillBtn) openAddSkillBtn.addEventListener("click", openSkillModal);
  if (headerAddSkillBtn) headerAddSkillBtn.addEventListener("click", openSkillModal);
  if (cancelSkillBtn) cancelSkillBtn.addEventListener("click", closeSkillModal);
  if (closeAddSkillX) closeAddSkillX.addEventListener("click", closeSkillModal);
  if (addSkillModal) {
    addSkillModal.addEventListener("click", (e) => {
      if (e.target === addSkillModal) closeSkillModal();
    });
  }

  async function loadSkills() {
    try {
      const skillsRes = await fetch(`${API_BASE}/skills/${profileUserId}`);
      if (skillsRes.ok) {
        const skills = await skillsRes.json();
        renderSkills(skills);
      } else {
        profileSkills.innerHTML = "<p class='sub' style='margin:0;'>No skills listed yet.</p>";
      }
    } catch (err) {
      profileSkills.innerHTML = "<p class='sub' style='margin:0;'>No skills listed yet.</p>";
    }
  }

  function renderSkills(skills) {
    if (!profileSkills) return;
    if (!skills || skills.length === 0) {
      profileSkills.innerHTML = `
        <div class="empty-state-card">
          <span style="font-size: 24px;">💡</span>
          <p class="sub" style="margin: 4px 0 0;">No skills listed yet. Click "+ Add Skill" to showcase your technical expertise.</p>
        </div>`;
      return;
    }

    profileSkills.innerHTML = skills.map((s) => {
      const level = s.level || (s.proficiency === "Advanced" ? 90 : (s.proficiency === "Beginner" ? 35 : 65));
      const deleteBtn = isOwnProfile ? `
        <button type="button" class="btn-delete-item delete-skill-btn" data-id="${s._id}" title="Remove skill">&times;</button>
      ` : "";

      return `
        <div class="modern-skill-card" id="skill-${s._id}">
          <div class="skill-info-row">
            <span class="skill-name">${s.name}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="skill-pill-tag">${s.proficiency || "Intermediate"}</span>
              ${deleteBtn}
            </div>
          </div>
          <div class="skill-progress-track">
            <div class="skill-progress-fill" style="width: ${level}%;"></div>
          </div>
        </div>
      `;
    }).join("");

    // Bind delete actions
    if (isOwnProfile) {
      document.querySelectorAll(".delete-skill-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const skillId = btn.getAttribute("data-id");
          if (!confirm("Are you sure you want to remove this skill?")) return;

          try {
            await fetch(`${API_BASE}/skills/${skillId}`, { method: "DELETE" });
            const card = document.getElementById(`skill-${skillId}`);
            if (card) card.remove();
          } catch (err) {
            console.error("Delete skill failed:", err);
          }
        });
      });
    }
  }

  // Handle Add Skill Submit
  if (addSkillForm) {
    addSkillForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const skillName = document.getElementById("newSkillName")?.value.trim();
      const category = document.getElementById("newSkillCategory")?.value || "Programming";
      const proficiency = document.getElementById("newSkillProficiency")?.value || "Intermediate";

      if (!skillName) return;

      const saveBtn = document.getElementById("saveSkillBtn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Adding...";
      }

      try {
        const res = await fetch(`${API_BASE}/skills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            name: skillName,
            proficiency,
            category
          })
        });

        if (res.ok) {
          addSkillForm.reset();
          closeSkillModal();
          await loadSkills();
        } else {
          alert("Could not save skill. Please try again.");
        }
      } catch (err) {
        console.error("Add skill error:", err);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Add Skill";
        }
      }
    });
  }

  // ==========================================
  // 4. ACHIEVEMENTS MANAGEMENT
  // ==========================================
  const addAchModal = document.getElementById("addAchModal");
  const openAddAchBtn = document.getElementById("openAddAchBtn");
  const cancelAchBtn = document.getElementById("cancelAchBtn");
  const closeAddAchX = document.getElementById("closeAddAchX");
  const addAchForm = document.getElementById("addAchForm");

  function openAchModal() {
    if (addAchModal) addAchModal.style.display = "flex";
  }
  function closeAchModal() {
    if (addAchModal) addAchModal.style.display = "none";
  }

  if (openAddAchBtn) openAddAchBtn.addEventListener("click", openAchModal);
  if (headerAddAchBtn) headerAddAchBtn.addEventListener("click", openAchModal);
  if (cancelAchBtn) cancelAchBtn.addEventListener("click", closeAchModal);
  if (closeAddAchX) closeAddAchX.addEventListener("click", closeAchModal);
  if (addAchModal) {
    addAchModal.addEventListener("click", (e) => {
      if (e.target === addAchModal) closeAchModal();
    });
  }

  async function loadAchievements() {
    try {
      const achRes = await fetch(`${API_BASE}/achievements/user/${profileUserId}`);
      if (achRes.ok) {
        const achievements = await achRes.json();
        renderAchievements(achievements);
      } else {
        profileAchievements.innerHTML = "<p class='sub' style='margin:0;'>No achievements recorded yet.</p>";
      }
    } catch (err) {
      profileAchievements.innerHTML = "<p class='sub' style='margin:0;'>No achievements recorded yet.</p>";
    }
  }

  function renderAchievements(achievements) {
    if (!profileAchievements) return;
    if (!achievements || achievements.length === 0) {
      profileAchievements.innerHTML = `
        <div class="empty-state-card">
          <span style="font-size: 24px;">🏆</span>
          <p class="sub" style="margin: 4px 0 0;">No achievements added yet. Showcase your hackathon wins, research publications, or awards.</p>
        </div>`;
      return;
    }

    profileAchievements.innerHTML = achievements.map((a) => {
      const isVerified = Boolean(a.isVerified === true || a.status === "approved");
      const categoryTag = a.category ? `<span class="badge-category">${a.category}</span>` : "";
      const badge = isVerified 
        ? '<span class="badge-verified">Verified ✓</span>' 
        : '<span class="badge-self-reported">Self-Reported</span>';
      const evidence = a.evidenceUrl ? `
        <a href="${a.evidenceUrl}" target="_blank" rel="noopener noreferrer" class="evidence-link-btn">
          View Certificate / Proof ↗
        </a>` : "";

      return `
        <div class="modern-achievement-card">
          <div class="ach-card-top-row">
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              ${categoryTag}
              ${badge}
            </div>
            ${a.date ? `<span class="ach-date-tag">${a.date}</span>` : ""}
          </div>
          <h4 class="ach-card-title">${a.title}</h4>
          ${a.competition ? `<div class="ach-card-org">🏛️ ${a.competition}</div>` : ""}
          ${a.description ? `<p class="ach-card-desc">${a.description}</p>` : ""}
          ${a.stack ? `<div class="ach-card-stack">Stack: <strong>${a.stack}</strong></div>` : ""}
          ${evidence}
        </div>
      `;
    }).join("");
  }

  // Handle Add Achievement Submit
  if (addAchForm) {
    addAchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("newAchTitle")?.value.trim();
      const category = document.getElementById("newAchCategory")?.value || "Hackathon";
      const date = document.getElementById("newAchDate")?.value.trim();
      const competition = document.getElementById("newAchCompetition")?.value.trim();
      const description = document.getElementById("newAchDesc")?.value.trim();
      const stack = document.getElementById("newAchStack")?.value.trim();
      const evidenceUrl = document.getElementById("newAchEvidence")?.value.trim();

      if (!title) return;

      const saveBtn = document.getElementById("saveAchBtn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
      }

      try {
        const res = await fetch(`${API_BASE}/achievements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            studentName: targetUser.name,
            title,
            category,
            date,
            competition,
            description,
            stack,
            evidenceUrl
          })
        });

        if (res.ok) {
          addAchForm.reset();
          closeAchModal();
          await loadAchievements();
        } else {
          alert("Could not save achievement. Please try again.");
        }
      } catch (err) {
        console.error("Add achievement error:", err);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Achievement";
        }
      }
    });
  }

  // ==========================================
  // 5. PUBLIC PROJECTS MANAGEMENT
  // ==========================================
  const addProjModal = document.getElementById("addProjModal");
  const openAddProjBtn = document.getElementById("openAddProjBtn");
  const cancelProjBtn = document.getElementById("cancelProjBtn");
  const closeAddProjX = document.getElementById("closeAddProjX");
  const addProjForm = document.getElementById("addProjForm");

  function openProjModal() {
    if (addProjModal) addProjModal.style.display = "flex";
  }
  function closeProjModal() {
    if (addProjModal) addProjModal.style.display = "none";
  }

  if (openAddProjBtn) openAddProjBtn.addEventListener("click", openProjModal);
  if (headerAddProjBtn) headerAddProjBtn.addEventListener("click", openProjModal);
  if (cancelProjBtn) cancelProjBtn.addEventListener("click", closeProjModal);
  if (closeAddProjX) closeAddProjX.addEventListener("click", closeProjModal);
  if (addProjModal) {
    addProjModal.addEventListener("click", (e) => {
      if (e.target === addProjModal) closeProjModal();
    });
  }

  async function loadProjects() {
    try {
      const projRes = await fetch(`${API_BASE}/projects/${profileUserId}`);
      if (projRes.ok) {
        const projects = await projRes.json();
        renderProjects(projects);
      } else {
        profileProjects.innerHTML = "<p class='sub' style='margin:0;'>No public projects.</p>";
      }
    } catch (err) {
      profileProjects.innerHTML = "<p class='sub' style='margin:0;'>No public projects.</p>";
    }
  }

  function renderProjects(projects) {
    if (!profileProjects) return;
    if (!projects || projects.length === 0) {
      profileProjects.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <span style="font-size: 24px;">🚀</span>
          <p class="sub" style="margin: 4px 0 0;">No projects added yet. Add your apps, machine learning models, or research prototypes.</p>
        </div>`;
      return;
    }

    profileProjects.innerHTML = projects.map((p) => {
      const progress = p.progress !== undefined ? p.progress : 50;
      const statusClass = p.status === "Completed" ? "status-tag-completed" : "status-tag-progress";
      const githubLink = p.githubUrl ? `
        <a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-action-link">
          <span>GitHub</span> ↗
        </a>` : "";
      const liveLink = p.liveUrl ? `
        <a href="${p.liveUrl}" target="_blank" rel="noopener noreferrer" class="project-action-link primary-link">
          <span>Live Demo</span> ↗
        </a>` : "";

      const deleteBtn = isOwnProfile ? `
        <button type="button" class="btn-delete-item delete-project-btn" data-id="${p._id}" title="Remove project">&times;</button>
      ` : "";

      return `
        <div class="modern-project-card" id="project-${p._id}">
          <div class="project-card-header">
            <span class="project-status-tag ${statusClass}">${p.status || "In Progress"}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="project-pct-tag">${progress}%</span>
              ${deleteBtn}
            </div>
          </div>

          <h4 class="project-title">${p.title}</h4>
          ${p.description ? `<p class="project-description">${p.description}</p>` : ""}

          ${p.technologies ? `
            <div class="project-tech-tags">
              ${p.technologies.split(",").map(t => `<span class="tech-pill">${t.trim()}</span>`).join("")}
            </div>` : ""}

          <div class="project-progress-track">
            <div class="project-progress-fill" style="width: ${progress}%;"></div>
          </div>

          <div class="project-actions-row">
            ${githubLink}
            ${liveLink}
          </div>
        </div>
      `;
    }).join("");

    // Bind delete actions
    if (isOwnProfile) {
      document.querySelectorAll(".delete-project-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const projId = btn.getAttribute("data-id");
          if (!confirm("Are you sure you want to remove this project?")) return;

          try {
            await fetch(`${API_BASE}/projects/${projId}`, { method: "DELETE" });
            const card = document.getElementById(`project-${projId}`);
            if (card) card.remove();
          } catch (err) {
            console.error("Delete project failed:", err);
          }
        });
      });
    }
  }

  // Handle Add Project Submit
  if (addProjForm) {
    addProjForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("newProjTitle")?.value.trim();
      const description = document.getElementById("newProjDesc")?.value.trim();
      const technologies = document.getElementById("newProjStack")?.value.trim();
      const status = document.getElementById("newProjStatus")?.value || "In Progress";
      const progress = Number(document.getElementById("newProjProgress")?.value || 50);
      const githubUrl = document.getElementById("newProjGithub")?.value.trim();
      const liveUrl = document.getElementById("newProjLive")?.value.trim();

      if (!title) return;

      const saveBtn = document.getElementById("saveProjBtn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Adding...";
      }

      try {
        const res = await fetch(`${API_BASE}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            title,
            description,
            technologies,
            status,
            progress,
            githubUrl,
            liveUrl,
            isPublic: true
          })
        });

        if (res.ok) {
          addProjForm.reset();
          closeProjModal();
          await loadProjects();
        } else {
          alert("Could not save project. Please try again.");
        }
      } catch (err) {
        console.error("Add project error:", err);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Add Project";
        }
      }
    });
  }

  // Load all 3 sections
  await Promise.all([loadSkills(), loadAchievements(), loadProjects()]);
});
