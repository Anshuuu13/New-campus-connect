// Same idea as currentUser in script.js — later this profile data
// will come from the logged-in user's saved profile in a database.
const skillProfile = {
  name: "Anshika",
  department: "Computer Science",
  year: "3rd Year",
  have: ["Python", "React", "AutoCAD"],
  teach: ["HTML", "CSS", "C++", "Basic Python"],
  learn: ["AI/ML", "UI/UX Design", "Flutter"],
};

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function renderChips(listId, items) {
  const el = document.getElementById(listId);
  el.innerHTML = items.map((skill) => `<li>${skill}</li>`).join("");
}

document.getElementById("avatarInitials").textContent = initials(skillProfile.name);
document.getElementById("profileName").textContent = skillProfile.name;
document.getElementById("profileMeta").textContent = `${skillProfile.department} · ${skillProfile.year}`;

renderChips("skillsHave", skillProfile.have);
renderChips("skillsTeach", skillProfile.teach);
renderChips("skillsLearn", skillProfile.learn);

document.getElementById("btnCollab").addEventListener("click", () => {
  alert(`Collaboration request sent to ${skillProfile.name}.`);
});

document.getElementById("btnSession").addEventListener("click", () => {
  alert(`Skill session request sent to ${skillProfile.name}.`);
});