document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const toggleLink = document.getElementById("toggleLink");
  const toggleText = document.getElementById("toggleText");
  const extraFields = document.getElementById("extraFields");

  let mode = "signup"; // or "login"

  toggleLink.addEventListener("click", (e) => {
    e.preventDefault();

    if (mode === "signup") {
      mode = "login";
      toggleText.textContent = "New here?";
      toggleLink.textContent = "Sign Up";
      extraFields.style.display = "none";
    } else {
      mode = "signup";
      toggleText.textContent = "Already have an account?";
      toggleLink.textContent = "Log In";
      extraFields.style.display = "block";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("nameInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    const department = document.getElementById("deptInput").value.trim();
    const role = document.getElementById("roleInput").value;

    if (!name || !password) {
      alert("Please enter your name and password.");
      return;
    }

    const url = mode === "signup"
      ? "http://localhost:5000/api/users"
      : "http://localhost:5000/api/users/login";

    const body = mode === "signup"
      ? { name, department, role, password }
      : { name, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Something went wrong.");
        return;
      }

      localStorage.setItem("campusConnectUser", JSON.stringify(data));
      window.location.href = "index.html";
    } catch (err) {
      console.error("Auth error:", err);
      alert("Something went wrong. Please try again.");
    }
  });
});