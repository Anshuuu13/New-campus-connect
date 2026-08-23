// Each achievement: a standout project, who led it, what it won,
// and its tech stack. Later, this will come from a database of
// projects that have been marked as "featured" or "winning" entries.
const achievements = [
  {
    title: "CampusConnect",
    badge: "Best Senior Project",
    leader: "Rahul Sharma",
    batch: "2024-25",
    won: "SIH College Round",
    stack: "Flutter · Node.js · MongoDB",
    rating: "4.9/5",
  },
  {
    title: "AgriSense",
    badge: "Best Innovation Award",
    leader: "Neha Kapoor",
    batch: "2023-24",
    won: "Smart India Hackathon Finalist",
    stack: "React · Firebase · TensorFlow",
    rating: "4.7/5",
  },
  {
    title: "EduTrack",
    badge: "People's Choice",
    leader: "Aditya Singh",
    batch: "2024-25",
    won: "Inter-College Hackathon Winner",
    stack: "Vue · Express · PostgreSQL",
    rating: "4.6/5",
  },
];

const list = document.getElementById("achievementList");

achievements.forEach((item) => {
  const card = document.createElement("div");
  card.className = "post-card";
  card.innerHTML = `
    <div class="achievement-badge">🏆 ${item.badge}</div>
    <h2 class="post-title">${item.title}</h2>
    <div class="post-meta">
      <span><strong>Team Leader:</strong> ${item.leader}</span>
      <span><strong>Batch:</strong> ${item.batch}</span>
    </div>
    <div class="post-meta">
      <span><strong>Winner:</strong> ${item.won}</span>
      <span><strong>Rating:</strong> ${item.rating}</span>
    </div>
    <div class="post-looking">
      <h3>Tech Stack</h3>
      <p class="stack-line">${item.stack}</p>
    </div>
    <div class="actions">
      <button class="btn btn-secondary">View Project</button>
      <button class="btn btn-secondary">Demo</button>
      <button class="btn btn-secondary">Source Code</button>
    </div>
  `;
  list.appendChild(card);
});