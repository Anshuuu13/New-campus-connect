document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const postFormSection = document.getElementById("postFormSection");
  const clubFieldsSection = document.getElementById("clubFieldsSection");
  const titleInput = document.getElementById("titleInput");
  const messageInput = document.getElementById("messageInput");
  const typeInput = document.getElementById("typeInput");
  const clubNameInput = document.getElementById("clubNameInput");
  const posterImageInput = document.getElementById("posterImageInput");
  const formLinkInput = document.getElementById("formLinkInput");
  const postAnnouncementBtn = document.getElementById("postAnnouncementBtn");
  const announcementsList = document.getElementById("announcementsList");

  const allowedRoles = ["Professor", "Admin", "ClubCoordinator"];
  if (allowedRoles.includes(user.role)) {
    postFormSection.style.display = "block";
  }

  typeInput.addEventListener("change", () => {
    clubFieldsSection.style.display = typeInput.value === "Club Recruitment" ? "block" : "none";
  });

  async function loadAnnouncements() {
    try {
      const response = await fetch("https://campus-connect-1q2c.onrender.com/api/announcements");
      const announcements = await response.json();

      announcementsList.innerHTML = "";

      if (announcements.length === 0) {
        announcementsList.innerHTML = "<p class='sub'>No announcements yet.</p>";
        return;
      }

      for (const a of announcements) {
        const card = document.createElement("div");
        card.className = "post-card";

        const isRecruitment = a.type === "Club Recruitment";

        card.innerHTML = `
          <h3>${a.title} ${isRecruitment ? "<span class='badge'>Recruitment</span>" : ""}</h3>
          <p>${a.message}</p>
          ${isRecruitment && a.clubName ? `<p><strong>Club:</strong> ${a.clubName}</p>` : ""}
          ${isRecruitment && a.posterImage ? `<img src="${a.posterImage}" alt="Poster" style="max-width:100%; margin-top:8px;" />` : ""}
          ${isRecruitment && a.formLink ? `<p><a href="${a.formLink}" target="_blank">Apply Here</a></p>` : ""}
          <p class="sub">Posted by ${a.postedByName} — ${new Date(a.createdAt).toLocaleDateString()}</p>
        `;

        announcementsList.appendChild(card);
      }
    } catch (err) {
      console.error("LOAD ANNOUNCEMENTS ERROR:", err);
      announcementsList.innerHTML = "<p class='sub'>Failed to load announcements.</p>";
    }
  }

  if (postAnnouncementBtn) {
    postAnnouncementBtn.addEventListener("click", async () => {
      const title = titleInput.value.trim();
      const message = messageInput.value.trim();
      const type = typeInput.value;
      const clubName = clubNameInput.value.trim();
      const posterImage = posterImageInput.value.trim();
      const formLink = formLinkInput.value.trim();

      if (!title || !message) {
        alert("Please enter both title and message.");
        return;
      }

      postAnnouncementBtn.disabled = true;
      postAnnouncementBtn.textContent = "Posting...";

      try {
        const response = await fetch("https://campus-connect-1q2c.onrender.com/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            title,
            message,
            type,
            clubName,
            posterImage,
            formLink
          })
        });

        if (!response.ok) {
          throw new Error("Failed to post announcement");
        }

        titleInput.value = "";
        messageInput.value = "";
        typeInput.value = "General";
        clubNameInput.value = "";
        posterImageInput.value = "";
        formLinkInput.value = "";
        clubFieldsSection.style.display = "none";

        loadAnnouncements();
      } catch (err) {
        console.error("POST ANNOUNCEMENT ERROR:", err);
        alert("Something went wrong posting the announcement.");
      } finally {
        postAnnouncementBtn.disabled = false;
        postAnnouncementBtn.textContent = "Post Announcement";
      }
    });
  }

  loadAnnouncements();
});