// Each research post: what a professor is looking for.
// Later, this will come from a database of posts professors create
// through their own "New Post" form.
const researchPosts = [
  {
    title: "AI Based Healthcare Research",
    professor: "Dr. XYZ",
    department: "CSE",
    looking: ["1 AI Student", "1 Electronics Student", "1 UI Designer"],
    duration: "3 Months",
  },
  {
    title: "Computer Vision for Traffic Safety",
    professor: "Dr. Mehta",
    department: "ECE",
    looking: ["2 AI/ML Students", "1 Embedded Systems Student"],
    duration: "6 Months",
  },
  {
    title: "Sustainable Materials Study",
    professor: "Dr. Rao",
    department: "Civil Engineering",
    looking: ["1 Materials Science Student", "1 Data Analyst"],
    duration: "4 Months",
  },
];

const postList = document.getElementById("postList");

researchPosts.forEach((post) => {
  const card = document.createElement("div");
  card.className = "post-card";
  card.innerHTML = `
    <h2 class="post-title">${post.title}</h2>
    <div class="post-meta">
      <span><strong>Professor:</strong> ${post.professor}</span>
      <span><strong>Department:</strong> ${post.department}</span>
      <span><strong>Duration:</strong> ${post.duration}</span>
    </div>
    <div class="post-looking">
      <h3>Looking For</h3>
      <ul class="chip-list">
        ${post.looking.map((role) => `<li>${role}</li>`).join("")}
      </ul>
    </div>
    <button class="btn btn-primary post-join">Request to Join</button>
  `;
  card.querySelector(".post-join").addEventListener("click", () => {
    alert(`Request sent to ${post.professor} for "${post.title}".`);
  });
  postList.appendChild(card);
});