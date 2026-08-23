// Each club: what it needs, recruitment deadline, and its track record.
// Later, this will come from clubs' own recruitment posts instead of
// being hardcoded here.
const clubs = [
  {
    name: "Robotics Club",
    icon: "🤖",
    need: ["Embedded Systems", "CAD Designer", "C++ Programmer"],
    lastDate: "20 Aug 2026",
    members: 48,
    projectsCompleted: 12,
  },
  {
    name: "Coding Club",
    icon: "💻",
    need: ["Web Developer", "Competitive Programmer", "Content Writer"],
    lastDate: "25 Aug 2026",
    members: 76,
    projectsCompleted: 20,
  },
  {
    name: "Design Club",
    icon: "🎨",
    need: ["UI/UX Designer", "Motion Graphics", "Illustrator"],
    lastDate: "30 Aug 2026",
    members: 34,
    projectsCompleted: 9,
  },
];

const clubList = document.getElementById("clubList");

clubs.forEach((club) => {
  const card = document.createElement("div");
  card.className = "post-card";
  card.innerHTML = `
    <h2 class="post-title">${club.icon} ${club.name}</h2>
    <div class="recruitment-open">📣 Recruitment Open</div>
    <div class="post-looking">
      <h3>Need</h3>
      <ul class="chip-list">
        ${club.need.map((role) => `<li>${role}</li>`).join("")}
      </ul>
    </div>
    <div class="post-meta">
      <span><strong>Last Date:</strong> ${club.lastDate}</span>
      <span><strong>Members:</strong> ${club.members}</span>
      <span><strong>Projects Completed:</strong> ${club.projectsCompleted}</span>
    </div>
    <div class="actions">
      <button class="btn btn-secondary">View Club</button>
      <button class="btn btn-primary club-apply">Apply</button>
    </div>
  `;
  card.querySelector(".club-apply").addEventListener("click", () => {
    alert(`Application sent to ${club.name}.`);
  });
  clubList.appendChild(card);
});