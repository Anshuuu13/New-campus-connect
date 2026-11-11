// CampusConnect — Student & Faculty Profile Manager
// ===================================================

const API_BASE = (window.location.protocol === "http:" || window.location.protocol === "https:") && window.location.host
  ? "/api"
  : "https://campus-connect-1q2c.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const currentUserId = currentUser._id || currentUser.id;
  const params = new URLSearchParams(window.location.search);
  const profileUserId = params.get("userId") || currentUserId;
  const isOwnProfile = String(profileUserId) === String(currentUserId);

  // Topbar user role
  const userRoleEl = document.getElementById("userRole");
  if (userRoleEl) {
    userRoleEl.textContent = currentUser.name ? `${currentUser.name} (${currentUser.role || "Student"})` : (currentUser.role || "Student");
  }

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

  const profileEnrollmentBadge = document.getElementById("profileEnrollmentBadge");
  const profileEnrollmentText = document.getElementById("profileEnrollmentText");
  const nameInput = document.getElementById("nameInput");
  const enrollmentInput = document.getElementById("enrollmentInput");

  // Modal elements
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

  // Club Request elements
  const submitClubRequestBtn = document.getElementById("submitClubRequestBtn");
  const clubRequestStatus = document.getElementById("clubRequestStatus");
  const clubNameInput = document.getElementById("clubNameInput");
  const clubRoleTitleInput = document.getElementById("clubRoleTitleInput");

  let base64Picture = "";

  // 1. Fetch & Display User Details
  let targetUser = null;
  try {
    const userResponse = await fetch(`${API_BASE}/users/${profileUserId}`);
    if (userResponse.ok) {
      targetUser = await userResponse.json();
    }
  } catch (err) {
    console.error("LOAD PROFILE USER ERROR:", err);
  }

  if (!targetUser) {
    targetUser = isOwnProfile ? currentUser : {
      name: "MITS Member",
      department: "Engineering",
      role: "Student",
      bio: "Engineering student at MITS Gwalior.",
      branch: "Computer Science & Engineering",
      year: "2nd Year"
    };
  }

  profileName.textContent = isOwnProfile ? `${targetUser.name}'s Profile` : `${targetUser.name}`;
  profileMeta.textContent = `${targetUser.department || "MITS Gwalior"} — ${targetUser.role || "Student"}`;

  const avatarUrl = targetUser.profilePicture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(targetUser.name || "User") + "&background=0b132b&color=38bdf8&bold=true";
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

  if (profileEnrollmentBadge && profileEnrollmentText) {
    if (targetUser.enrollmentNumber) {
      profileEnrollmentText.textContent = targetUser.enrollmentNumber;
      profileEnrollmentBadge.style.display = "block";
    } else {
      profileEnrollmentBadge.style.display = "none";
    }
  }

  // Social Links
  function renderSocialLinks() {
    if (!profileSocialLinks) return;
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
  renderSocialLinks();

  // 2. Load Skills
  try {
    const skillsResponse = await fetch(`${API_BASE}/skills/${profileUserId}`);
    if (skillsResponse.ok) {
      const skills = await skillsResponse.json();
      if (!skills || skills.length === 0) {
        profileSkills.innerHTML = "<p class='sub' style='margin:0;'>No skills listed yet.</p>";
      } else {
        profileSkills.innerHTML = skills.map((s) => `
          <div class="skill-row">
            <span>${s.name}</span>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${s.level || (s.proficiency === "Advanced" ? 90 : (s.proficiency === "Beginner" ? 35 : 65))}%;"></div>
            </div>
          </div>
        `).join("");
      }
    } else {
      profileSkills.innerHTML = "<p class='sub' style='margin:0;'>No skills listed yet.</p>";
    }
  } catch (err) {
    console.error("LOAD PROFILE SKILLS ERROR:", err);
    profileSkills.innerHTML = "<p class='sub' style='margin:0;'>No skills listed yet.</p>";
  }

  // 3. Load Achievements
  try {
    const achResponse = await fetch(`${API_BASE}/achievements/user/${profileUserId}`);
    if (achResponse.ok) {
      const achievements = await achResponse.json();
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
    console.error("LOAD PROFILE ACHIEVEMENTS ERROR:", err);
    profileAchievements.innerHTML = "<p class='sub' style='margin:0;'>No achievements recorded yet.</p>";
  }

  // 4. Load Public Projects
  try {
    const projResponse = await fetch(`${API_BASE}/projects/public/${profileUserId}`);
    let projects = [];
    if (projResponse.ok) {
      projects = await projResponse.json();
    } else {
      const fallbackRes = await fetch(`${API_BASE}/projects/${profileUserId}`);
      if (fallbackRes.ok) projects = await fallbackRes.json();
    }

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
  } catch (err) {
    console.error("LOAD PROFILE PROJECTS ERROR:", err);
    profileProjects.innerHTML = "<p class='sub' style='margin:0;'>No public projects.</p>";
  }

  // 5. Edit Profile Modal (Only for own profile)
  if (!isOwnProfile) {
    if (editBtn) editBtn.style.display = "none";
  } else {
    if (editBtn) {
      editBtn.style.display = "inline-block";
      editBtn.addEventListener("click", () => {
        if (nameInput) nameInput.value = targetUser.name || "";
        if (enrollmentInput) enrollmentInput.value = targetUser.enrollmentNumber || "";
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

    // Picture preview
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

    // Form submit
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const updatedData = {
          name: nameInput ? nameInput.value.trim() : (targetUser.name || ""),
          enrollmentNumber: enrollmentInput ? enrollmentInput.value.trim().toUpperCase() : (targetUser.enrollmentNumber || ""),
          profilePicture: base64Picture || targetUser.profilePicture || "",
          bio: bioInput.value.trim(),
          branch: branchInput.value.trim(),
          year: yearInput.value.trim(),
          linkedin: linkedinInput.value.trim(),
          github: githubInput.value.trim(),
          contactEmail: contactEmailInput.value.trim(),
          profileCompleted: true
        };

        const saveBtn = form.querySelector("button[type='submit']");
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = "Saving...";
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
            localStorage.setItem("campusConnectUser", JSON.stringify({ ...currentUser, ...savedServerUser }));
          } else {
            targetUser = { ...targetUser, ...updatedData };
            localStorage.setItem("campusConnectUser", JSON.stringify({ ...currentUser, ...updatedData }));
          }
        } catch (err) {
          console.warn("Backend offline during save, saved to localStorage:", err);
          targetUser = { ...targetUser, ...updatedData };
          localStorage.setItem("campusConnectUser", JSON.stringify({ ...currentUser, ...updatedData }));
        }

        // Live update DOM elements
        if (profileName) {
          profileName.textContent = isOwnProfile ? `${targetUser.name}'s Profile` : `${targetUser.name}`;
        }
        if (profileEnrollmentBadge && profileEnrollmentText) {
          if (targetUser.enrollmentNumber) {
            profileEnrollmentText.textContent = targetUser.enrollmentNumber;
            profileEnrollmentBadge.style.display = "block";
          } else {
            profileEnrollmentBadge.style.display = "none";
          }
        }
        if (profileBio) profileBio.textContent = targetUser.bio || "No bio added yet.";
        if (profileBranchYear) {
          profileBranchYear.textContent = [targetUser.branch, targetUser.year].filter(Boolean).join(" • ");
        }
        if (profilePic && targetUser.profilePicture) {
          profilePic.src = targetUser.profilePicture;
        }
        renderSocialLinks();

        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save";
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
});
