// Each mentor: a senior offering guidance in a specific area.
// Later, this will come from seniors who've opted in to mentor
// through their own profile settings.
const mentors = [
  {
    name: "Rahul Sharma",
    icon: "🎓",
    batch: "2024-25",
    expertise: "Landed a Microsoft internship, full-stack dev",
    canHelp: ["Internship Prep", "Resume Review", "Flutter"],
  },
  {
    name: "Neha Kapoor",
    icon: "🎓",
    batch: "2023-24",
    expertise: "SIH finalist, machine learning research",
    canHelp: ["AI/ML Projects", "Research Papers", "Hackathons"],
  },
  {
    name: "Aditya Singh",
    icon: "🎓",
    batch: "2024-25",
    expertise: "Competitive programmer, backend engineer",
    canHelp: ["DSA", "System Design", "Interview Prep"],
  },
];

const mentorList = document.getElementById("mentorList");

mentors.forEach((mentor) => {
  const card = document.createElement("div");
  card.className = "post-card";
  card.innerHTML = `
    <h2 class="post-title">${mentor.icon} ${mentor.name}</h2>
    <div class="post-meta">
      <span><strong>Batch:</strong> ${mentor.batch}</span>
    </div>
    <p class="mentor-line">${mentor.expertise}</p>
    <div class="post-looking">
      <h3>Can Help With</h3>
      <ul class="chip-list">
        ${mentor.canHelp.map((topic) => `<li>${topic}</li>`).join("")}
      </ul>
    </div>
    <button class="btn btn-primary mentor-request">Request Mentorship</button>
  `;
  card.querySelector(".mentor-request").addEventListener("click", () => {
    alert(`Mentorship request sent to ${mentor.name}.`);
  });
  mentorList.appendChild(card);
});