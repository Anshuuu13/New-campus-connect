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
  const obEnrollmentNumber = document.getElementById("obEnrollmentNumber");
  const obEnrollmentLabel = document.getElementById("obEnrollmentLabel");
  const obEnrollmentHelp = document.getElementById("obEnrollmentHelp");
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

  const autoEnrollment = user.enrollmentNumber || (function() {
    if (!userEmail) return "";
    const m = userEmail.split("@")[0].trim().match(/^([0-9]{4}[a-zA-Z]{2,4}[0-9]{4,8})/i);
    return m ? m[1].toUpperCase() : "";
  })();

  if (obEnrollmentNumber && autoEnrollment) {
    obEnrollmentNumber.value = autoEnrollment;
  }
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
      if (obEnrollmentLabel) obEnrollmentLabel.textContent = "Faculty / Employee ID (Optional)";
      if (obEnrollmentNumber) {
        obEnrollmentNumber.removeAttribute("required");
        obEnrollmentNumber.placeholder = "e.g. MITS-FAC-2024";
      }
      if (obEnrollmentHelp) {
        obEnrollmentHelp.textContent = "Official MITS faculty / staff identity code.";
      }
    } else if (verifiedRole === "Admin") {
      obRoleIcon.textContent = "🛡️";
      obRoleTitle.textContent = "Campus Administrator";
      obRoleDescription.textContent = "Verified Administrative Privileges";
      if (studentYearContainer) studentYearContainer.style.display = "none";
      if (obEnrollmentNumber) obEnrollmentNumber.removeAttribute("required");
    } else {
      obRoleIcon.textContent = "🎓";
      obRoleTitle.textContent = "Student";
      obRoleDescription.textContent = "Verified MITS Student Account (@mitsgwl.ac.in)";
      if (studentYearContainer) studentYearContainer.style.display = "block";
      if (obEnrollmentLabel) obEnrollmentLabel.textContent = "Enrollment Number *";
      if (obEnrollmentNumber) {
        obEnrollmentNumber.setAttribute("required", "required");
        obEnrollmentNumber.placeholder = "e.g. 0901CS211001";
      }
      if (obEnrollmentHelp) {
        obEnrollmentHelp.textContent = "Official MITS Institute Enrollment Number as per university records.";
      }
    }
  }

  // Pre-fill existing fields if available
  if (user.department && obDepartment) {
    obDepartment.value = user.department;
  } else if (autoEnrollment && obDepartment) {
    const en = autoEnrollment.toUpperCase();
    if (en.includes("CS") || en.includes("CSE")) obDepartment.value = "Computer Science & Engineering";
    else if (en.includes("IT")) obDepartment.value = "Information Technology";
    else if (en.includes("AIDS") || en.includes("AI")) obDepartment.value = "Artificial Intelligence & Data Science";
    else if (en.includes("AIML") || en.includes("AL")) obDepartment.value = "Artificial Intelligence & Machine Learning";
    else if (en.includes("CSD") || en.includes("CD")) obDepartment.value = "Computer Science & Design";
    else if (en.includes("EC") || en.includes("ET")) obDepartment.value = "Electronics & Telecommunication Engineering";
    else if (en.includes("EE")) obDepartment.value = "Electronics Engineering";
    else if (en.includes("EL")) obDepartment.value = "Electrical Engineering";
    else if (en.includes("ME")) obDepartment.value = "Mechanical Engineering";
    else if (en.includes("CE")) obDepartment.value = "Civil Engineering";
    else if (en.includes("CH")) obDepartment.value = "Chemical Engineering";
  }
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
    if (window.location.port === "5000" || window.location.hostname.includes("onrender.com")) {
      return "/api";
    }
    try {
      const probe = await fetch("http://localhost:5000/health", { method: "GET", signal: AbortSignal.timeout(800) });
      if (probe.ok) return "http://localhost:5000/api";
    } catch (e) {}

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

      const fullName = obName ? obName.value.trim() : userName;
      const enrollmentNumber = obEnrollmentNumber ? obEnrollmentNumber.value.trim().toUpperCase() : "";
      const department = obDepartment ? obDepartment.value : "";
      const isFacultyUser = verifiedRole === "Professor" || verifiedRole === "Faculty";
      const year = (!isFacultyUser && obYear) ? obYear.value : "Faculty Member";
      const bio = obBio ? obBio.value.trim() : "";
      const interests = Array.from(selectedSkills);

      if (!fullName) {
        showStatus("Please enter your full name.", "error");
        if (obName) obName.focus();
        return;
      }

      if (!isFacultyUser && !enrollmentNumber) {
        showStatus("Please enter your required MITS Enrollment Number (e.g. 0901CS211001).", "error");
        if (obEnrollmentNumber) obEnrollmentNumber.focus();
        return;
      }

      if (!department) {
        showStatus("Please select your department.", "error");
        if (obDepartment) obDepartment.focus();
        return;
      }

      showStatus("Saving your profile...", "loading");

      const userId = user.id || user._id;

      // Update local user state immediately
      user.name = fullName;
      user.enrollmentNumber = enrollmentNumber;
      user.role = verifiedRole;
      user.department = department;
      user.branch = department;
      user.year = year;
      user.bio = bio;
      user.interests = interests;
      user.profileCompleted = true;
      localStorage.setItem("user.name", fullName || enrollmentNumber || "");
      localStorage.setItem("userName", fullName || enrollmentNumber || "");
      if (enrollmentNumber) {
        localStorage.setItem("user.enrollmentNumber", enrollmentNumber);
      }
      localStorage.setItem("campusConnectUser", JSON.stringify(user));

      try {
        const apiBase = await getApiBase();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const patchRes = await fetch(`${apiBase}/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName,
            enrollmentNumber,
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

        if (patchRes.ok) {
          const savedData = await patchRes.json();
          if (savedData && (savedData._id || savedData.name)) {
            user = { ...user, ...savedData };
            localStorage.setItem("campusConnectUser", JSON.stringify(user));
          }
        }
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
