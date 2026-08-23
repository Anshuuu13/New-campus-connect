// Each team post: a student-led project looking for teammates.
// Later, this will come from a database of posts students create
// through their own "Post a Project" form.
const teamPosts = [
  {
    title: "Smart Irrigation System",
    leader: "Anshika",
    need: ["1 Mechanical Student", "1 Electronics Student", "1 Flutter Developer"],
  },
  {
    title: "Campus Lost & Found App",
    leader: "Rahul Sharma",
    need: ["1 Backend Developer", "1 UI/UX Designer"],
  },
  {
    title: "AI Attendance System",
    leader: "Priya Verma",
    need: ["1 Computer Vision Student", "1 Mobile Developer"],
  },
];

const teamList = document.getElementById("teamList");

teamPosts.forEach((post) => {
  const card = document.createElement("div");
  card.className = "post-card";
  card.innerHTML = `
    <h2 class="post-title">${post.title}</h2>
    <div class="post-meta">
      <span><strong>Team Leader:</strong> ${post.leader}</span>
    </div>
    <div class="post-looking">
      <h3>Need</h3>
      <ul class="chip-list">
        ${post.need.map((role) => `<li>${role}</li>`).join("")}
      </ul>
    </div>
    <button class="btn btn-primary post-join">Join Team</button>
  `;
  card.querySelector(".post-join").addEventListener("click", () => {
    alert(`Request sent to join "${post.title}".`);
  });
  teamList.appendChild(card);
});