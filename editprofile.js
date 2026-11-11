document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!currentUser) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  const form = document.getElementById("editProfileForm");
  const picInput = document.getElementById("picInput");
  const picPreview = document.getElementById("picPreview");
  const nameInput = document.getElementById("nameInput");
  const enrollmentInput = document.getElementById("enrollmentInput");
  const bioInput = document.getElementById("bioInput");
  const branchInput = document.getElementById("branchInput");
  const yearInput = document.getElementById("yearInput");
  const linkedinInput = document.getElementById("linkedinInput");
  const githubInput = document.getElementById("githubInput");
  const contactEmailInput = document.getElementById("contactEmailInput");

  let base64Picture = "";

  const apiBase = (window.location.protocol === "http:" || window.location.protocol === "https:") && window.location.host
    ? "/api"
    : "https://campus-connect-1q2c.onrender.com/api";

  const userId = currentUser._id || currentUser.id;

  // Load existing profile data
  try {
    const res = await fetch(`${apiBase}/users/${userId}`);
    if (res.ok) {
      const user = await res.json();
      if (nameInput) nameInput.value = user.name || currentUser.name || "";
      if (enrollmentInput) enrollmentInput.value = user.enrollmentNumber || currentUser.enrollmentNumber || "";
      if (bioInput) bioInput.value = user.bio || "";
      if (branchInput) branchInput.value = user.branch || user.department || "";
      if (yearInput) yearInput.value = user.year || "";
      if (linkedinInput) linkedinInput.value = user.linkedin || "";
      if (githubInput) githubInput.value = user.github || "";
      if (contactEmailInput) contactEmailInput.value = user.contactEmail || user.email || "";

      if (user.profilePicture) {
        base64Picture = user.profilePicture;
        if (picPreview) {
          picPreview.src = user.profilePicture;
          picPreview.style.display = "block";
        }
      }
    }
  } catch (err) {
    console.error("Failed to load profile:", err);
    if (nameInput) nameInput.value = currentUser.name || "";
    if (enrollmentInput) enrollmentInput.value = currentUser.enrollmentNumber || "";
  }

  // Handle new picture selection
  if (picInput) {
    picInput.addEventListener("change", () => {
      const file = picInput.files[0];
      if (!file) return;

      if (file.size > 500000) {
        alert("Please choose an image smaller than 500KB.");
        picInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        base64Picture = reader.result;
        if (picPreview) {
          picPreview.src = base64Picture;
          picPreview.style.display = "block";
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Save on submit
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const updatedProfile = {
        name: nameInput ? nameInput.value.trim() : currentUser.name,
        enrollmentNumber: enrollmentInput ? enrollmentInput.value.trim().toUpperCase() : (currentUser.enrollmentNumber || ""),
        profilePicture: base64Picture || currentUser.profilePicture || "",
        bio: bioInput ? bioInput.value.trim() : "",
        branch: branchInput ? branchInput.value.trim() : "",
        year: yearInput ? yearInput.value.trim() : "",
        linkedin: linkedinInput ? linkedinInput.value.trim() : "",
        github: githubInput ? githubInput.value.trim() : "",
        contactEmail: contactEmailInput ? contactEmailInput.value.trim() : "",
        profileCompleted: true
      };

      try {
        const res = await fetch(`${apiBase}/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProfile)
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Something went wrong saving your profile.");
          return;
        }

        // Update local session
        const updatedLocal = { ...currentUser, ...data };
        localStorage.setItem("campusConnectUser", JSON.stringify(updatedLocal));

        alert("Profile updated!");
        window.location.href = `profile.html?userId=${userId}`;
      } catch (err) {
        console.error("Save profile error:", err);
        alert("Something went wrong. Please try again.");
      }
    });
  }
});
