// When the form is submitted, save what the person typed into the
// browser's localStorage (data that persists even after closing the tab),
// then send them to the dashboard.
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("nameInput").value.trim();
  const department = document.getElementById("deptInput").value.trim() || "Not specified";
  const role = document.getElementById("roleInput").value;

  if (!name) return;

  const user = { name, department, role };
  localStorage.setItem("campusConnectUser", JSON.stringify(user));

  window.location.href = "index.html";
});