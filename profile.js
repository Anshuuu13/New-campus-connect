const API_BASE = (window.location.protocol === "http:" || window.location.protocol === "https:") && window.location.host ? "/api" : "https://campus-connect-1q2c.onrender.com/api";
document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const profileUserId = params.get("userId") || currentUser._id;

  const profileName = document.getElementById("profileName");
  const profileMeta = document.getElementById("profileMeta");
  const profileSkills = document.getElementById("profileSkills");
  const profileAchievements = document.getElementById("profileAchievements");
  const profileProjects = document.getElementById("profileProjects");

  // Load skills (also gives us the user's name/department via the first skill's owner info if needed later)
  try {
    const skillsResponse = await fetch(`${API_BASE}/skills/${profileUserId}`);
    const skills = await skillsResponse.json();

    if (skills.length === 0) {
      profileSkills.innerHTML = "<p class='sub'>No skills listed.</p>";
    } else {
      profileSkills.innerHTML = skills.map((s) => `
        <div class="skill-row">
          <span>${s.name}</span>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${s.level}%;"></div>
          </div>
        </div>
      `).join("");
    }
  } catch (err) {
    console.error("LOAD PROFILE SKILLS ERROR:", err);
    profileSkills.innerHTML = "<p class='sub'>Something went wrong loading skills.</p>";
  }

  // Load achievements
  try {
    const achResponse = await fetch(`${API_BASE}/achievements/user/${profileUserId}`);
    const achievements = await achResponse.json();

    if (achievements.length === 0) {
      profileAchievements.innerHTML = "<p class='sub'>No achievements recorded yet.</p>";
    } else {
      profileAchievements.innerHTML = achievements.map((a) => {
        const isVerified = Boolean(a.isVerified === true || a.status === 'approved');
        const categoryTag = a.category ? `<span class="badge-category" style="margin-bottom: 8px;">${a.category}</span>` : '';
        const badge = isVerified 
          ? '<span class="badge-verified" style="margin-bottom: 8px;">Verified ✓</span>' 
          : '<span class="badge-self-reported" style="margin-bottom: 8px;">Self-Reported</span>';
        const evidence = a.evidenceUrl ? `<a href="${a.evidenceUrl}" target="_blank" rel="noopener noreferrer" class="evidence-btn" style="margin-top: 8px;">View Certificate / Evidence ↗</a>` : '';
        return `
          <div class="post-card" style="margin-bottom: 14px;">
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px;">
              ${categoryTag}
              ${badge}
              ${a.date ? `<span style="font-family: var(--mono); font-size: 11px; color: var(--text-dim); margin-left: auto;">${a.date}</span>` : ''}
            </div>
            <div class="post-title">${a.title}</div>
            ${a.description ? `<p class="post-meta" style="margin-bottom: 8px;">${a.description}</p>` : ''}
            ${a.stack ? `<p class="post-meta" style="margin-bottom: 8px;">Stack: ${a.stack}</p>` : ''}
            ${evidence}
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error("LOAD PROFILE ACHIEVEMENTS ERROR:", err);
    profileAchievements.innerHTML = "<p class='sub'>Something went wrong loading achievements.</p>";
  }

  // Load public projects
  try {
    const projResponse = await fetch(`${API_BASE}/projects/public/${profileUserId}`);
    const projects = await projResponse.json();

    if (projects.length === 0) {
      profileProjects.innerHTML = "<p class='sub'>No public projects.</p>";
    } else {
      profileProjects.innerHTML = projects.map((p) => `
        <div class="post-card">
          <div class="post-title">${p.title}</div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${p.progress}%;"></div>
          </div>
          <p class="post-meta">${p.progress}% complete</p>
        </div>
      `).join("");
    }
  } catch (err) {
    console.error("LOAD PROFILE PROJECTS ERROR:", err);
    profileProjects.innerHTML = "<p class='sub'>Something went wrong loading projects.</p>";
  }

  try {
    const userResponse = await fetch(`${API_BASE}/users/${profileUserId}`);
    const profileUser = await userResponse.json();

    profileName.textContent = `${profileUser.name}'s Profile`;
    profileMeta.textContent = `${profileUser.department} — ${profileUser.role}`;
    const clubBadge = document.getElementById("clubBadge");
if (profileUser.clubRole) {
  clubBadge.textContent = "🏅 " + profileUser.clubRole;
  clubBadge.style.display = "inline-block";
}
  } catch (err) {
    console.error("LOAD PROFILE USER ERROR:", err);
    profileName.textContent = "Profile";
  }
});
// ---- Edit Profile Modal Logic ----
document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = JSON.parse(localStorage.getItem("campusConnectUser"));
  if (!currentUser) return;

  const editBtn = document.getElementById("editProfileBtn");
  const modal = document.getElementById("editProfileModal");
  const cancelBtn = document.getElementById("cancelEditBtn");
  const form = document.getElementById("editProfileForm");
  const picInput = document.getElementById("picInput");
  const picPreview = document.getElementById("picPreview");
  // Club head request submission
const submitClubRequestBtn = document.getElementById("submitClubRequestBtn");
const clubRequestStatus = document.getElementById("clubRequestStatus");

submitClubRequestBtn.addEventListener("click", async () => {
  const club = document.getElementById("clubNameInput").value.trim();
  const role = document.getElementById("clubRoleTitleInput").value.trim();

  if (!club || !role) {
    clubRequestStatus.textContent = "Please fill in both club name and role.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/clubhead/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser._id, club, role })
    });
    if (!res.ok) throw new Error("Request failed");
    clubRequestStatus.textContent = "Request submitted! Waiting for admin approval.";
    document.getElementById("clubNameInput").value = "";
    document.getElementById("clubRoleTitleInput").value = "";
  } catch (err) {
    console.error("Club request error:", err);
    clubRequestStatus.textContent = "Something went wrong. Please try again.";
  }
});
  let base64Picture = "";

  // Load current profile picture/details into the page + modal
  try {
    const res = await fetch(`${API_BASE}/users/${currentUser._id}`);
    const user = await res.json();

    document.getElementById("profilePic").src = user.profilePicture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name || "User");
    document.getElementById("profileBio").textContent = user.bio || "";
    document.getElementById("profileBranchYear").textContent = [user.branch, user.year].filter(Boolean).join(" • ");

    const links = document.getElementById("profileSocialLinks");
    links.innerHTML = "";
    if (user.linkedin) links.innerHTML += `<a href="${user.linkedin}" target="_blank">LinkedIn</a>`;
    if (user.github) links.innerHTML += `<a href="${user.github}" target="_blank">GitHub</a>`;

    base64Picture = user.profilePicture || "";

    document.getElementById("bioInput").value = user.bio || "";
    document.getElementById("branchInput").value = user.branch || "";
    document.getElementById("yearInput").value = user.year || "";
    document.getElementById("linkedinInput").value = user.linkedin || "";
    document.getElementById("githubInput").value = user.github || "";
    document.getElementById("contactEmailInput").value = user.contactEmail || "";
  } catch (err) {
    console.error("Failed to load profile header:", err);
  }

  // Only show Edit button on your own profile
  const params = new URLSearchParams(window.location.search);
  const viewedId = params.get("userId") || currentUser._id;
  if (viewedId !== currentUser._id) {
    editBtn.style.display = "none";
  }

  // Open modal
  editBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // Close modal
  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Picture preview
  picInput.addEventListener("change", () => {
    const file = picInput.files[0];
    if (!file) return;
    if (file.size > 500000) {
      alert("Please choose an image smaller than 500KB.");
      picInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      base64Picture = reader.result;
      picPreview.src = base64Picture;
      picPreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  // Save
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const updatedProfile = {
      profilePicture: base64Picture,
      bio: document.getElementById("bioInput").value.trim(),
      branch: document.getElementById("branchInput").value.trim(),
      year: document.getElementById("yearInput").value.trim(),
      linkedin: document.getElementById("linkedinInput").value.trim(),
      github: document.getElementById("githubInput").value.trim(),
      contactEmail: document.getElementById("contactEmailInput").value.trim()
    };

    try {
      const res = await fetch(`${API_BASE}/users/${currentUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile)
      });
      if (!res.ok) throw new Error("Save failed");
      alert("Profile updated!");
      window.location.reload();
    } catch (err) {
      console.error("Save profile error:", err);
      alert("Something went wrong. Please try again.");
    }
  });
});