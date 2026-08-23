// Read whoever signed in on login.html. If nobody has signed in yet,
// send them to the login page instead of showing a blank dashboard.
const savedUser = localStorage.getItem("campusConnectUser");

if (!savedUser) {
  window.location.href = "login.html";
}

const currentUser = JSON.parse(savedUser);

document.querySelector(".name-greeting").textContent = `Welcome, ${currentUser.name}.`;
document.getElementById("userRole").textContent = currentUser.role;

// Each dashboard item: icon, label, and a short tag describing its category.
// This array is the "data" for the dashboard. Later, this can come from
// a real backend/database instead of being hardcoded here.
const dashboardItems = [
  { icon: "🔔", label: "Latest Announcements", tag: "Updates" },
  { icon: "📅", label: "Upcoming Events", tag: "Calendar" },
  { icon: "🔬", label: "Research Opportunities", tag: "Faculty", link: "research.html" },
 { icon: "🤝", label: "Team Requests", tag: "Projects", link: "team.html" },
  { icon: "🧠", label: "SkillSwap Requests", tag: "Learning", link: "skillswap.html" },
  { icon: "🎯", label: "Internship & Hackathon Updates", tag: "Careers" },
  { icon: "🧑‍🏫", label: "Mentorship Requests", tag: "Guidance" },
  { icon: "📊", label: "My Active Projects", tag: "Workspace" },
  { icon: "⭐", label: "My Skills", tag: "Profile" },
  { icon: "🏆", label: "Achievements", tag: "Profile", link: "achievements.html" },
  { icon: "📩", label: "Notifications", tag: "Inbox", link: "notifications.html" },
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
    if (item.link) {
      window.location.href = item.link;
    } else {
      // Placeholder for now — this is where you'll later navigate
      // to each feature's own page (e.g. research.html, mentorship.html).
      alert(`Next step: build the "${item.label}" page.`);
    }
  });
  grid.appendChild(card);
});