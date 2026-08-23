// Each skill: name and proficiency (0-100). Later, this will come
// from the user's real profile instead of being hardcoded here.
const mySkills = [
  { name: "Python", level: 85 },
  { name: "React", level: 70 },
  { name: "AutoCAD", level: 60 },
  { name: "HTML / CSS", level: 90 },
];

const interests = ["AI/ML", "UI/UX Design", "Flutter"];

const skillBars = document.getElementById("skillBars");

mySkills.forEach((skill) => {
  const row = document.createElement("div");
  row.className = "skill-row";
  row.innerHTML = `
    <div class="skill-row-head">
      <span>${skill.name}</span>
      <span class="skill-percent">${skill.level}%</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" style="width: ${skill.level}%"></div>
    </div>
  `;
  skillBars.appendChild(row);
});

const interestsList = document.getElementById("skillInterests");
interestsList.innerHTML = interests.map((s) => `<li>${s}</li>`).join("");