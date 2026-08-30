document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const achievementList = document.getElementById("achievementList");
  const titleInput = document.getElementById("titleInput");
  const descInput = document.getElementById("descInput");
  const stackInput = document.getElementById("stackInput");
  const submitBtn = document.getElementById("submitAchievementBtn");
  const submitMsg = document.getElementById("submitMsg");

  async function loadAchievements() {
    try {
      const response = await fetch("https://campus-connect-1q2c.onrender.com00/api/achievements");
      const achievements = await response.json();

      achievementList.innerHTML = "";

      if (achievements.length === 0) {
        achievementList.innerHTML = "<p class='sub'>No approved projects yet.</p>";
        return;
      }

      achievements.forEach((item) => {
        const card = document.createElement("div");
        card.className = "post-card";
        card.innerHTML = `
          <div class="post-title">${item.title}</div>
          <p class="post-meta">${item.description}</p>
          <p class="post-meta">Stack: ${item.stack}</p>
          <p class="post-meta">By ${item.userId?.name || "Unknown"} — ${item.userId?.department || ""}</p>
        `;
        achievementList.appendChild(card);
      });
    } catch (err) {
      console.error("LOAD ACHIEVEMENTS ERROR:", err);
      achievementList.innerHTML = "<p class='sub'>Something went wrong loading projects.</p>";
    }
  }

  submitBtn.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const stack = stackInput.value.trim();

    if (!title) {
      alert("Please enter a project title.");
      return;
    }

    try {
      const response = await fetch("https://campus-connect-1q2c.onrender.com00/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, title, description, stack })
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      titleInput.value = "";
      descInput.value = "";
      stackInput.value = "";
      submitMsg.textContent = "Submitted! Your project will appear here once approved.";
    } catch (err) {
      console.error("SUBMIT ACHIEVEMENT ERROR:", err);
      alert("Something went wrong submitting the project.");
    }
  });

  loadAchievements();
});