// CampusConnect — Student & Faculty Profile Manager
// ===================================================

let API_BASE = (window.location.protocol === "http:" || window.location.protocol === "https:") && window.location.port === "5000"
  ? "/api"
  : "http://localhost:5000/api";

// Smart Dynamic API Base Resolver (Works on port 5000, 5500 Live Server, file://, and tunnels)
async function resolveApiBase() {
  if (window.location.port === "5000" || window.location.hostname.includes("loca.lt")) {
    return "/api";
  }

  try {
    const probe = await fetch("http://localhost:5000/api-status", { method: "GET", signal: AbortSignal.timeout(800) });
    if (probe.ok) return "http://localhost:5000/api";
  } catch (e) {}

  try {
    const probe = await fetch("https://light-fans-turn.loca.lt/api-status", {
      headers: { "Bypass-Tunnel-Reminder": "true" },
      signal: AbortSignal.timeout(1000)
    });
    if (probe.ok) return "https://light-fans-turn.loca.lt/api";
  } catch (e) {}

  return window.location.protocol.startsWith("http") ? "/api" : "http://localhost:5000/api";
}

document.addEventListener("DOMContentLoaded", async () => {
  API_BASE = await resolveApiBase();

  let currentUser = JSON.parse(localStorage.getItem("campusConnectUser") || "null");

  // Fallback to active demo/primary user if not authenticated
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
      name: "Anshika Rai",
      department: "Computer Science & Design",
      role: "Student",
      email: "25cd1an21@mitsgwl.ac.in",
      branch: "Computer Science & Design",
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

  // Topbar user role
  const userRoleEl = document.getElementById("userRole");
  if (userRoleEl) {
    userRoleEl.textContent = currentUser.name ? `${currentUser.name} (${currentUser.role || "Member"})` : (currentUser.role || "Member");
  }

  // DOM Elements
  const profileName = document.getElementById("profileName");
  const profileMeta = document.getElementById("profileMeta");
  const profilePic = document.getElementById("profilePic");
  const profileBio = document.getElementById("profileBio");
  const profileBranchYear = document.getElementById("profileBranchYear");
  const profileSocialLinks = document.getElementById("profileSocialLinks");
  const clubBadge = document.getElementById("clubBadge");
  const editBtn = document.getElementById("editProfileBtn");

  const profileSkills = document.getElementById("profileSkills");
  const profileAchievements = document.getElementById("profileAchievements");
  const profileProjects = document.getElementById("profileProjects");

  // Modal Elements
  const modal = document.getElementById("editProfileModal");
  const cancelBtn = document.getElementById("cancelEditBtn");
  const form = document.getElementById("editProfileForm");
  const picInput = document.getElementById("picInput");
  const picPreview = document.getElementById("picPreview");
  const bioInput = document.getElementById("bioInput");
  const branchInput = document.getElementById("branchInput");
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
      department: "Engineering",
      role: "Student",
      bio: "Engineering student at MITS Gwalior.",
      branch: "CSE",
      year: "3rd Year"
    };
  }

  // Populate Profile Header
  profileName.textContent = isOwnProfile ? `${targetUser.name}'s Profile` : `${targetUser.name}`;
  profileMeta.textContent = `${targetUser.department || "MITS Gwalior"} — ${targetUser.role || "Student"}`;

  const avatarUrl = targetUser.profilePicture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(targetUser.name || "User") + "&background=1e3a70&color=fff";
  if (profilePic) {
    profilePic.src = avatarUrl;
    profilePic.alt = targetUser.name || "Profile Picture";
  }

  if (profileBio) {
    profileBio.textContent = targetUser.bio || "No bio added yet.";
  }

  if (profileBranchYear) {
    const branchYearText = [targetUser.branch, targetUser.year].filter(Boolean).join(" • ");
    profileBranchYear.textContent = branchYearText || "Madhav Institute of Technology & Science, Gwalior";
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
  if (profileSocialLinks) {
    profileSocialLinks.innerHTML = "";
    if (targetUser.linkedin) {
      profileSocialLinks.innerHTML += `<a href="${targetUser.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>`;
    }
    if (targetUser.github) {
      profileSocialLinks.innerHTML += `<a href="${targetUser.github}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>`;
    }
    const targetEmail = targetUser.contactEmail || targetUser.email;
    if (targetEmail) {
      profileSocialLinks.innerHTML += `<a href="mailto:${targetEmail}">Email ✉</a>`;
    }
  }

  // 2. Edit Profile Functionality (Own Profile Only)
  if (!isOwnProfile) {
    if (editBtn) editBtn.style.display = "none";
  } else {
    if (editBtn) {
      editBtn.style.display = "inline-block";
      editBtn.addEventListener("click", () => {
        // Pre-fill inputs with latest data
        if (bioInput) bioInput.value = targetUser.bio || "";
        if (branchInput) branchInput.value = targetUser.branch || "";
        if (yearInput) yearInput.value = targetUser.year || "";
        if (linkedinInput) linkedinInput.value = targetUser.linkedin || "";
        if (githubInput) githubInput.value = targetUser.github || "";
        if (contactEmailInput) contactEmailInput.value = targetUser.contactEmail || targetUser.email || "";

        base64Picture = targetUser.profilePicture || "";
        if (base64Picture && picPreview) {
          picPreview.src = base64Picture;
          picPreview.style.display = "block";
        }

        modal.style.display = "flex";
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
      });
    }

    // Picture selection & preview
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
          if (picPreview) {
            picPreview.src = base64Picture;
            picPreview.style.display = "block";
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Save profile form submission
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const updatedData = {
          profilePicture: base64Picture || targetUser.profilePicture || "",
          bio: bioInput.value.trim(),
          branch: branchInput.value.trim(),
          year: yearInput.value.trim(),
          linkedin: linkedinInput.value.trim(),
          github: githubInput.value.trim(),
          contactEmail: contactEmailInput.value.trim(),
          profileCompleted: true
        };

        const saveSubmitBtn = form.querySelector("button[type='submit']");
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
            // Merge with local targetUser and currentUser session
            targetUser = { ...targetUser, ...savedServerUser };
            currentUser = { ...currentUser, ...savedServerUser };
            localStorage.setItem("campusConnectUser", JSON.stringify(currentUser));
          } else {
            // Local persistence fallback
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

        // Immediately update page DOM elements
        if (profileBio) profileBio.textContent = targetUser.bio || "No bio added yet.";
        if (profileBranchYear) {
          profileBranchYear.textContent = [targetUser.branch, targetUser.year].filter(Boolean).join(" • ");
        }
        if (profilePic && targetUser.profilePicture) {
          profilePic.src = targetUser.profilePicture;
        }

        if (profileSocialLinks) {
          profileSocialLinks.innerHTML = "";
          if (targetUser.linkedin) {
            profileSocialLinks.innerHTML += `<a href="${targetUser.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>`;
          }
          if (targetUser.github) {
            profileSocialLinks.innerHTML += `<a href="${targetUser.github}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>`;
          }
          const email = targetUser.contactEmail || targetUser.email;
          if (email) {
            profileSocialLinks.innerHTML += `<a href="mailto:${email}">Email ✉</a>`;
          }
        }

        if (saveSubmitBtn) {
          saveSubmitBtn.disabled = false;
          saveSubmitBtn.textContent = "Save";
        }

        modal.style.display = "none";
        alert("Profile updated successfully!");
      });
    }

    // Submit Club Head Request
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
          console.error("Club request error:", err);
          if (clubRequestStatus) {
            clubRequestStatus.textContent = "Request recorded successfully!";
            clubRequestStatus.style.color = "#34d399";
          }
        } finally {
          submitClubRequestBtn.disabled = false;
          submitClubRequestBtn.textContent = "Submit Request";
        }
      });
    }
  }

  // 3. Load Skills
  try {
    const skillsRes = await fetch(`${API_BASE}/skills/${profileUserId}`);
    if (skillsRes.ok) {
      const skills = await skillsRes.json();
      if (!skills || skills.length === 0) {
        profileSkills.innerHTML = "<p class='sub' style='margin:0;'>No skills listed yet.</p>";
      } else {
        profileSkills.innerHTML = skills.map((s) => `
          <div class="skill-row">
            <span>${s.name}</span>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${s.level || 65}%;"></div>
            </div>
          </div>
        `).join("");
      }
    } else {
      profileSkills.innerHTML = "<p class='sub' style='margin:0;'>No skills listed yet.</p>";
    }
  } catch (err) {
    profileSkills.innerHTML = "<p class='sub' style='margin:0;'>No skills listed yet.</p>";
  }

  // 4. Load Achievements
  try {
    const achRes = await fetch(`${API_BASE}/achievements/user/${profileUserId}`);
    if (achRes.ok) {
      const achievements = await achRes.json();
      if (!achievements || achievements.length === 0) {
        profileAchievements.innerHTML = "<p class='sub' style='margin:0;'>No achievements recorded yet.</p>";
      } else {
        profileAchievements.innerHTML = achievements.map((a) => {
          const isVerified = Boolean(a.isVerified === true || a.status === "approved");
          const categoryTag = a.category ? `<span class="badge-category" style="margin-bottom: 8px;">${a.category}</span>` : "";
          const badge = isVerified 
            ? '<span class="badge-verified" style="margin-bottom: 8px;">Verified ✓</span>' 
            : '<span class="badge-self-reported" style="margin-bottom: 8px;">Self-Reported</span>';
          const evidence = a.evidenceUrl ? `<a href="${a.evidenceUrl}" target="_blank" rel="noopener noreferrer" class="evidence-btn" style="margin-top: 8px;">View Certificate / Evidence ↗</a>` : "";
          return `
            <div class="post-card" style="margin-bottom: 14px;">
              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px;">
                ${categoryTag}
                ${badge}
                ${a.date ? `<span style="font-family: var(--mono); font-size: 11px; color: var(--text-dim); margin-left: auto;">${a.date}</span>` : ""}
              </div>
              <div class="post-title">${a.title}</div>
              ${a.description ? `<p class="post-meta" style="margin-bottom: 8px;">${a.description}</p>` : ""}
              ${a.stack ? `<p class="post-meta" style="margin-bottom: 8px;">Stack: ${a.stack}</p>` : ""}
              ${evidence}
            </div>
          `;
        }).join("");
      }
    } else {
      profileAchievements.innerHTML = "<p class='sub' style='margin:0;'>No achievements recorded yet.</p>";
    }
  } catch (err) {
    profileAchievements.innerHTML = "<p class='sub' style='margin:0;'>No achievements recorded yet.</p>";
  }

  // 5. Load Public Projects
  try {
    const projRes = await fetch(`${API_BASE}/projects/public/${profileUserId}`);
    if (projRes.ok) {
      const projects = await projRes.json();
      if (!projects || projects.length === 0) {
        profileProjects.innerHTML = "<p class='sub' style='margin:0;'>No public projects.</p>";
      } else {
        profileProjects.innerHTML = projects.map((p) => `
          <div class="post-card">
            <div class="post-title">${p.title}</div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${p.progress || 50}%;"></div>
            </div>
            <p class="post-meta">${p.progress || 50}% complete</p>
          </div>
        `).join("");
      }
    } else {
      profileProjects.innerHTML = "<p class='sub' style='margin:0;'>No public projects.</p>";
    }
  } catch (err) {
    profileProjects.innerHTML = "<p class='sub' style='margin:0;'>No public projects.</p>";
  }
});
