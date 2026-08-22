// This will eventually come from login/signup data.
// role can be "Student", "Senior", or "Professor" — later you can
// use this to show different cards to different roles.
const currentUser = {
  name: "Anshika",
  role: "Student",
};

document.querySelector(".name-greeting").textContent = `Welcome, ${currentUser.name}.`;
document.getElementById("userRole").textContent = currentUser.role;

// Each dashboard item: icon, label, and a short tag describing its category.
// This array is the "data" for the dashboard. Later, this can come from
// a real backend/database instead of being hardcoded here.
const dashboardItems = [
  { icon: "🔔", label: "Latest Announcements", tag: "Updates" },
  { icon: "📅", label: "Upcoming Events", tag: "Calendar" },
  { icon: "🔬", label: "Research Opportunities", tag: "Faculty" },
  { icon: "🤝", label: "Team Requests", tag: "Projects" },
  { icon: "🧠", label: "SkillSwap Requests", tag: "Learning" },
  { icon: "🎯", label: "Internship & Hackathon Updates", tag: "Careers" },
  { icon: "🧑‍🏫", label: "Mentorship Requests", tag: "Guidance" },
  { icon: "📊", label: "My Active Projects", tag: "Workspace" },
  { icon: "⭐", label: "My Skills", tag: "Profile" },
  { icon: "🏆", label: "Achievements", tag: "Profile" },
  { icon: "📩", label: "Notifications", tag: "Inbox" },
];

const grid = document.getElementById("cardGrid");

dashboardItems.forEach((item) => {
  const card = document.createElement("button");
  card.className = "card";
  card.innerHTML = `
    <span class="icon">${item.icon}</span>
    <span class="label">${item.label}</span>
    <span class="tag">${item.tag}</span>
  `;
  card.addEventListener("click", () => {
    // Placeholder for now — this is where you'll later navigate
    // to each feature's own page (e.g. research.html, skillswap.html).
    alert(`Next step: build the "${item.label}" page.`);
  });
  grid.appendChild(card);
});