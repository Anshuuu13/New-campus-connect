// CampusConnect — Student & Faculty Profile Onboarding
// ====================================================

document.addEventListener("DOMContentLoaded", async () => {
  const rawUser = localStorage.getItem("campusConnectUser");

  // If not logged in, redirect to login page
  if (!rawUser) {
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(rawUser);

  // If user already completed their profile, go straight to campus feed
  const urlParams = new URLSearchParams(window.location.search);
  const isEditing = urlParams.get("edit") === "true";
  if (user.profileCompleted && !isEditing) {
    window.location.href = "index.html";
    return;
  }

  // Auto-populate Google Profile details
  const obAvatar = document.getElementById("obAvatar");
  const obDisplayName = document.getElementById("obDisplayName");
  const obDisplayEmail = document.getElementById("obDisplayEmail");
  const obName = document.getElementById("obName");
  const obEmail = document.getElementById("obEmail");
  const obDepartment = document.getElementById("obDepartment");
  const obYear = document.getElementById("obYear");
  const obBio = document.getElementById("obBio");
  const statusEl = document.getElementById("onboardingStatus");
  const form = document.getElementById("onboardingForm");
  const studentYearContainer = document.getElementById("studentYearContainer");

  const userName = user.name || "MITS Member";
  const userEmail = user.email || user.contactEmail || "";
  const userPic = user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0b132b&color=38bdf8&bold=true`;

  if (obAvatar) obAvatar.src = userPic;
  if (obDisplayName) obDisplayName.textContent = userName;
  if (obDisplayEmail) obDisplayEmail.textContent = userEmail;
  if (obName) obName.value = userName;
  if (obEmail) obEmail.value = userEmail;

  // Render Google-verified role badge
  const isFaculty = user.role === "Professor" || user.role === "Faculty" || userEmail.endsWith("@mitsgwalior.in");
  const verifiedRole = isFaculty ? "Professor" : (user.role === "Admin" ? "Admin" : "Student");
  
  const obRoleIcon = document.getElementById("obRoleIcon");
  const obRoleTitle = document.getElementById("obRoleTitle");
  const obRoleDescription = document.getElementById("obRoleDescription");

  if (obRoleIcon && obRoleTitle && obRoleDescription) {
    if (verifiedRole === "Professor") {
      obRoleIcon.textContent = "🏛️";
      obRoleTitle.textContent = "Faculty / Professor";
      obRoleDescription.textContent = "Verified MITS Academic Faculty Account (@mitsgwalior.in)";
      if (studentYearContainer) studentYearContainer.style.display = "none";
    } else if (verifiedRole === "Admin") {
      obRoleIcon.textContent = "🛡️";
      obRoleTitle.textContent = "Campus Administrator";
      obRoleDescription.textContent = "Verified Administrative Privileges";
      if (studentYearContainer) studentYearContainer.style.display = "none";
    } else {
      obRoleIcon.textContent = "🎓";
      obRoleTitle.textContent = "Student";
      obRoleDescription.textContent = "Verified MITS Student Account (@mitsgwl.ac.in)";
      if (studentYearContainer) studentYearContainer.style.display = "block";
    }
  }

  // Pre-fill existing fields if available
  if (user.department && obDepartment) obDepartment.value = user.department;
  if (user.year && obYear) obYear.value = user.year;
  if (user.bio && obBio) obBio.value = user.bio;

  // Track selected skills
  const selectedSkills = new Set(Array.isArray(user.interests) ? user.interests : []);
  const chipsDisplay = document.getElementById("selectedSkillsChips");
  const chipsContainer = document.getElementById("selectedSkillsContainer");
  const customSkillsInput = document.getElementById("customSkillsInput");

  function renderSelectedSkills() {
    if (!chipsDisplay) return;
    chipsDisplay.innerHTML = "";

    if (selectedSkills.size === 0) {
      if (chipsContainer) chipsContainer.style.display = "none";
    } else {
      if (chipsContainer) chipsContainer.style.display = "block";
      selectedSkills.forEach((skill) => {
        const chip = document.createElement("span");
        chip.className = "selected-chip";
        chip.innerHTML = `${skill} <button type="button" class="remove-chip-btn" data-skill="${skill}">&times;</button>`;
        chipsDisplay.appendChild(chip);
      });
    }

    // Update active highlight on suggestion buttons
    document.querySelectorAll(".tag-chip").forEach((btn) => {
      const skill = btn.getAttribute("data-skill");
      if (selectedSkills.has(skill)) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // Quick suggestion chips
  document.querySelectorAll(".tag-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const skill = btn.getAttribute("data-skill");
      if (selectedSkills.has(skill)) {
        selectedSkills.delete(skill);
      } else {
        selectedSkills.add(skill);
      }
      renderSelectedSkills();
    });
  });

  // Remove individual skill chip
  if (chipsDisplay) {
    chipsDisplay.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-chip-btn")) {
        const skill = e.target.getAttribute("data-skill");
        selectedSkills.delete(skill);
        renderSelectedSkills();
      }
    });
  }

  // Custom skills typing
  function addCustomSkills() {
    if (!customSkillsInput) return;
    const val = customSkillsInput.value.trim();
    if (!val) return;

    val.split(",").forEach((item) => {
      const s = item.trim();
      if (s) selectedSkills.add(s);
    });
    customSkillsInput.value = "";
    renderSelectedSkills();
  }

  if (customSkillsInput) {
    customSkillsInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addCustomSkills();
      }
    });
    customSkillsInput.addEventListener("blur", addCustomSkills);
  }

  renderSelectedSkills();

  // Resolve API Base
  async function getApiBase() {
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      return "/api";
    }
    return "https://campus-connect-1q2c.onrender.com/api";
  }

  function showStatus(message, type = "info") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `auth-status-msg auth-status-${type}`;
    statusEl.style.display = "block";
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const department = obDepartment ? obDepartment.value : "";
      const isFacultyUser = verifiedRole === "Professor" || verifiedRole === "Faculty";
      const year = (!isFacultyUser && obYear) ? obYear.value : "Faculty Member";
      const bio = obBio ? obBio.value.trim() : "";
      const interests = Array.from(selectedSkills);

      if (!department) {
        showStatus("Please select your department.", "error");
        return;
      }

      showStatus("Saving your profile...", "loading");

      const userId = user.id || user._id;

      // Update local user state immediately
      user.role = verifiedRole;
      user.department = department;
      user.branch = department;
      user.year = year;
      user.bio = bio;
      user.interests = interests;
      user.profileCompleted = true;
      localStorage.setItem("campusConnectUser", JSON.stringify(user));

      try {
        const apiBase = await getApiBase();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        await fetch(`${apiBase}/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            department,
            branch: department,
            year,
            bio,
            interests,
            profileCompleted: true
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (err) {
        console.warn("Could not sync profile to backend right now:", err.message);
      }

      showStatus("Profile setup complete! Welcome to CampusConnect 🎉", "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 600);
    });
  }
});
