document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const skillBars = document.getElementById("skillBars");
  const newSkillName = document.getElementById("newSkillName");
  const addSkillBtn = document.getElementById("addSkillBtn");

  async function loadSkills() {
    try {
      const response = await fetch(`https://campus-connect-1q2c.onrender.com00/api/skills/${user._id}`);
      const skills = await response.json();

      skillBars.innerHTML = "";

      if (skills.length === 0) {
        skillBars.innerHTML = "<p class='sub'>No skills added yet.</p>";
        return;
      }

      skills.forEach((skill) => {
        const row = document.createElement("div");
        row.className = "skill-row";
        row.innerHTML = `
          <span>${skill.name}</span>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${skill.level}%;"></div>
          </div>
        `;
        skillBars.appendChild(row);
      });
    } catch (err) {
      console.error("LOAD SKILLS ERROR:", err);
      skillBars.innerHTML = "<p class='sub'>Something went wrong loading skills.</p>";
    }
  }

  addSkillBtn.addEventListener("click", async () => {
    const name = newSkillName.value.trim();

    if (!name) {
      alert("Please enter a skill name.");
      return;
    }

    try {
      const response = await fetch("https://campus-connect-1q2c.onrender.com00/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, name, level: 50 })
      });

      if (!response.ok) {
        throw new Error("Failed to add skill");
      }

      newSkillName.value = "";
      loadSkills();
    } catch (err) {
      console.error("ADD SKILL ERROR:", err);
      alert("Something went wrong adding the skill.");
    }
  });

  loadSkills();
});