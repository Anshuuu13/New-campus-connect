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

  let base64Picture = "";

  // Load existing profile data
  try {
    const res = await fetch(`https://campus-connect-1q2c.onrender.com/api/users/${currentUser._id}`);
    const user = await res.json();

    document.getElementById("bioInput").value = user.bio || "";
    document.getElementById("branchInput").value = user.branch || "";
    document.getElementById("yearInput").value = user.year || "";
    document.getElementById("linkedinInput").value = user.linkedin || "";
    document.getElementById("githubInput").value = user.github || "";
    document.getElementById("contactEmailInput").value = user.contactEmail || "";

    if (user.profilePicture) {
      base64Picture = user.profilePicture;
      picPreview.src = user.profilePicture;
      picPreview.style.display = "block";
    }
  } catch (err) {
    console.error("Failed to load profile:", err);
  }

  // Handle new picture selection
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
      picPreview.src = base64Picture;
      picPreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  // Save on submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const updatedProfile = {
      profilePicture: base64Picture,
      bio: document.getElementById("bioInput").value.trim(),
      branch: document.getElementById("branchInput").value.trim(),
      year: document.getElementById("yearInput").value.trim(),
      linkedin: document.getElementById("linkedinInput").value.trim(),
      github: document.getElementById("githubInput").value.trim(),
      contactEmail: document.getElementById("contactEmailInput").value.trim()
    };

    try {
      const res = await fetch(`https://campus-connect-1q2c.onrender.com/api/users/${currentUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong saving your profile.");
        return;
      }

      alert("Profile updated!");
      window.location.href = `profile.html?userId=${currentUser._id}`;
    } catch (err) {
      console.error("Save profile error:", err);
      alert("Something went wrong. Please try again.");
    }
  });
});