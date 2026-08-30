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
    const skillsResponse = await fetch(`https://campus-connect-1q2c.onrender.com00/api/skills/${profileUserId}`);
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
    const achResponse = await fetch(`https://campus-connect-1q2c.onrender.com00/api/achievements/user/${profileUserId}`);
    const achievements = await achResponse.json();

    if (achievements.length === 0) {
      profileAchievements.innerHTML = "<p class='sub'>No approved projects yet.</p>";
    } else {
      profileAchievements.innerHTML = achievements.map((a) => `
        <div class="post-card">
          <div class="post-title">${a.title}</div>
          <p class="post-meta">${a.description}</p>
          <p class="post-meta">Stack: ${a.stack}</p>
        </div>
      `).join("");
    }
  } catch (err) {
    console.error("LOAD PROFILE ACHIEVEMENTS ERROR:", err);
    profileAchievements.innerHTML = "<p class='sub'>Something went wrong loading achievements.</p>";
  }

  // Load public projects
  try {
    const projResponse = await fetch(`https://campus-connect-1q2c.onrender.com00/api/projects/public/${profileUserId}`);
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
    const userResponse = await fetch(`https://campus-connect-1q2c.onrender.com00/api/users/${profileUserId}`);
    const profileUser = await userResponse.json();

    profileName.textContent = `${profileUser.name}'s Profile`;
    profileMeta.textContent = `${profileUser.department} — ${profileUser.role}`;
  } catch (err) {
    console.error("LOAD PROFILE USER ERROR:", err);
    profileName.textContent = "Profile";
  }
});