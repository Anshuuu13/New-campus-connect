// Each paper: subject, year it was set, which academic year/branch it's
// for, and who uploaded it. Later, this comes from real student uploads
// stored in a database instead of being hardcoded here.
const pyqs = [
  { subject: "Data Structures", year: "2025", branch: "2nd Year", examType: "Mid Sem", uploadedBy: "Anshika" },
  { subject: "Data Structures", year: "2024", branch: "2nd Year", examType: "End Sem", uploadedBy: "Rahul Sharma" },
  { subject: "Operating Systems", year: "2025", branch: "3rd Year", examType: "End Sem", uploadedBy: "Priya Verma" },
  { subject: "Digital Electronics", year: "2024", branch: "2nd Year", examType: "Mid Sem", uploadedBy: "Aditya Singh" },
  { subject: "Database Management", year: "2025", branch: "3rd Year", examType: "Mid Sem", uploadedBy: "Neha Kapoor" },
  { subject: "Computer Networks", year: "2024", branch: "3rd Year", examType: "End Sem", uploadedBy: "Anshika" },
  { subject: "Engineering Mathematics", year: "2025", branch: "1st Year", examType: "End Sem", uploadedBy: "Rahul Sharma" },
];

const yearSelect = document.getElementById("filterYear");
const subjectSelect = document.getElementById("filterSubject");
const pyqList = document.getElementById("pyqList");

// Build filter dropdown options from the data itself, so adding a new
// paper with a new subject/year automatically shows up as a filter.
const years = [...new Set(pyqs.map((p) => p.year))].sort().reverse();
const subjects = [...new Set(pyqs.map((p) => p.subject))].sort();

years.forEach((y) => {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  yearSelect.appendChild(opt);
});

subjects.forEach((s) => {
  const opt = document.createElement("option");
  opt.value = s;
  opt.textContent = s;
  subjectSelect.appendChild(opt);
});

function render() {
  const yearFilter = yearSelect.value;
  const subjectFilter = subjectSelect.value;

  const filtered = pyqs.filter((p) => {
    const yearMatch = yearFilter === "all" || p.year === yearFilter;
    const subjectMatch = subjectFilter === "all" || p.subject === subjectFilter;
    return yearMatch && subjectMatch;
  });

  pyqList.innerHTML = "";

  if (filtered.length === 0) {
    pyqList.innerHTML = `<p class="sub">No papers match those filters yet.</p>`;
    return;
  }

  filtered.forEach((p) => {
    const card = document.createElement("div");
    card.className = "post-card pyq-card";
    card.innerHTML = `
      <div class="pyq-row">
        <div>
          <h2 class="post-title pyq-title">${p.subject}</h2>
          <div class="post-meta">
            <span><strong>Branch:</strong> ${p.branch}</span>
            <span><strong>Year:</strong> ${p.year}</span>
            <span><strong>Type:</strong> ${p.examType}</span>
          </div>
          <span class="progress-label">Uploaded by ${p.uploadedBy}</span>
        </div>
        <button class="btn btn-secondary">Download</button>
      </div>
    `;
    pyqList.appendChild(card);
  });
}

yearSelect.addEventListener("change", render);
subjectSelect.addEventListener("change", render);

render();