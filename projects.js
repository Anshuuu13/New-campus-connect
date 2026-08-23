// Each active project: title, teammates, status, and how far along
// it is. Later, this will come from the projects the logged-in user
// has actually joined or created.
const activeProjects = [
  {
    title: "Smart Irrigation System",
    role: "Team Leader",
    team: ["Anshika", "Mechanical Student", "Electronics Student"],
    status: "In Progress",
    progress: 65,
  },
  {
    title: "AI Based Healthcare Research",
    role: "Contributor",
    team: ["Dr. XYZ", "Anshika", "UI Designer"],
    status: "In Progress",
    progress: 30,
  },
  {
    title: "Campus Lost & Found App",
    role: "Contributor",
    team: ["Rahul Sharma", "Anshika"],
    status: "Completed",
    progress: 100,
  },
];

const projectList = document.getElementById("projectList");

activeProjects.forEach((proj) => {
  const card = document.createElement("div");
  card.className = "post-card";
  card.innerHTML = `
    <h2 class="post-title">${proj.title}</h2>
    <div class="post-meta">
      <span><strong>Your Role:</strong> ${proj.role}</span>
      <span><strong>Status:</strong> ${proj.status}</span>
    </div>
    <div class="post-looking">
      <h3>Team</h3>
      <ul class="chip-list">
        ${proj.team.map((member) => `<li>${member}</li>`).join("")}
      </ul>
    </div>
    <div class="progress-track">
      <div class="progress-fill" style="width: ${proj.progress}%"></div>
    </div>
    <span class="progress-label">${proj.progress}% complete</span>
  `;
  projectList.appendChild(card);
});