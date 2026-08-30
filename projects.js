document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const projectList = document.getElementById("projectList");
  const projectTitleInput = document.getElementById("projectTitleInput");
  const addProjectBtn = document.getElementById("addProjectBtn");

  async function loadProjects() {
    try {
      const response = await fetch(`https://campus-connect-1q2c.onrender.com/api/projects/${user._id}`);
      const projects = await response.json();

      projectList.innerHTML = "";

      if (projects.length === 0) {
        projectList.innerHTML = "<p class='sub'>No active projects yet.</p>";
        return;
      }

      projects.forEach((project) => {
  const card = document.createElement("div");
  card.className = "post-card";
  card.innerHTML = `
    <div class="post-title">${project.title}</div>
    <div class="progress-track">
      <div class="progress-fill" style="width: ${project.progress}%;"></div>
    </div>
    <p class="post-meta">${project.progress}% complete</p>
    <input type="range" min="0" max="100" value="${project.progress}" data-id="${project._id}" class="progress-slider">
    <label class="post-meta" style="display: block; margin-top: 8px;">
      <input type="checkbox" class="public-toggle" data-id="${project._id}" ${project.isPublic ? "checked" : ""}>
      Show on my public profile
    </label>
  `;
  projectList.appendChild(card);
});

document.querySelectorAll(".public-toggle").forEach((checkbox) => {
  checkbox.addEventListener("change", async (e) => {
    const id = e.target.dataset.id;
    const isPublic = e.target.checked;

    try {
      await fetch(`https://campus-connect-1q2c.onrender.com/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic })
      });
    } catch (err) {
      console.error("TOGGLE PUBLIC ERROR:", err);
    }
  });
});
      document.querySelectorAll(".progress-slider").forEach((slider) => {
        slider.addEventListener("change", async (e) => {
          const id = e.target.dataset.id;
          const progress = e.target.value;

          try {
            await fetch(`https://campus-connect-1q2c.onrender.com/api/projects/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ progress })
            });
            loadProjects();
          } catch (err) {
            console.error("UPDATE PROGRESS ERROR:", err);
          }
        });
      });
    } catch (err) {
      console.error("LOAD PROJECTS ERROR:", err);
      projectList.innerHTML = "<p class='sub'>Something went wrong loading projects.</p>";
    }
  }

  addProjectBtn.addEventListener("click", async () => {
    const title = projectTitleInput.value.trim();

    if (!title) {
      alert("Please enter a project title.");
      return;
    }

    try {
      const response = await fetch("https://campus-connect-1q2c.onrender.com/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, title, progress: 0 })
      });

      if (!response.ok) {
        throw new Error("Failed to add project");
      }

      projectTitleInput.value = "";
      loadProjects();
    } catch (err) {
      console.error("ADD PROJECT ERROR:", err);
      alert("Something went wrong adding the project.");
    }
  });

  loadProjects();
});