document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const postList = document.getElementById("postList");
  const postFormArea = document.getElementById("postFormArea");
  const categoryInput = document.getElementById("categoryInput");
  const postTitleInput = document.getElementById("postTitleInput");
  const postDescInput = document.getElementById("postDescInput");
  const postSkillsInput = document.getElementById("postSkillsInput");
  const postTimeInput = document.getElementById("postTimeInput");
  const postEmailInput = document.getElementById("postEmailInput");
  const submitPostBtn = document.getElementById("submitPostBtn");
  const postMsg = document.getElementById("postMsg");

  if (user.role === "Professor") {
    postFormArea.style.display = "block";
  }

  async function loadPosts() {
    try {
      const response = await fetch("http://localhost:5000/api/faculty-posts");
      const posts = await response.json();

      postList.innerHTML = "";

      if (posts.length === 0) {
        postList.innerHTML = "<p class='sub'>No approved postings yet.</p>";
        return;
      }

      posts.forEach((post) => {
        const card = document.createElement("div");
        card.className = "post-card";

        const isOwner = post.userId?._id === user._id;
        const alreadyApplied = post.applicants?.some((a) => a._id === user._id);

        let actionHtml = "";
        if (isOwner) {
          const names = post.applicants?.length
            ? post.applicants.map((a) => `${a.name} (${a.department || ""})`).join(", ")
            : "No one yet.";
          actionHtml = `<p class="post-meta"><strong>Interested:</strong> ${names}</p>`;
        } else if (alreadyApplied) {
          actionHtml = `<p class="post-meta">You've applied.</p>`;
        } else {
          actionHtml = `<button class="btn btn-primary apply-btn" data-id="${post._id}">Apply</button>`;
        }

        card.innerHTML = `
          <div class="post-title">${post.title}</div>
          <p class="post-meta">Category: ${post.category}</p>
          <p class="post-meta">${post.description}</p>
          <p class="post-meta">Needs: ${post.skillsNeeded}</p>
          <p class="post-meta">Discussion: ${post.discussionTime}</p>
          <p class="post-meta">Posted by ${post.userId?.name || "Unknown"} — ${post.userId?.department || ""}</p>
          <p class="post-meta"><strong>${post.applicants?.length || 0} student${post.applicants?.length === 1 ? "" : "s"} applied</strong></p>
          ${actionHtml}
        `;
        postList.appendChild(card);
      });

      document.querySelectorAll(".apply-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;

          try {
            const response = await fetch(`http://localhost:5000/api/faculty-posts/${id}/apply`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user._id })
            });

            const data = await response.json();

            if (!response.ok) {
              alert(data.error || "Something went wrong.");
              return;
            }

            alert(`Applied! Contact: ${data.contactEmail}`);
            loadPosts();
          } catch (err) {
            console.error("APPLY ERROR:", err);
            alert("Something went wrong applying.");
          }
        });
      });
    } catch (err) {
      console.error("LOAD POSTS ERROR:", err);
      postList.innerHTML = "<p class='sub'>Something went wrong loading postings.</p>";
    }
  }

  if (submitPostBtn) {
    submitPostBtn.addEventListener("click", async () => {
      const category = categoryInput.value;
      const title = postTitleInput.value.trim();
      const description = postDescInput.value.trim();
      const skillsNeeded = postSkillsInput.value.trim();
      const discussionTime = postTimeInput.value.trim();
      const contactEmail = postEmailInput.value.trim();

      if (!title || !contactEmail) {
        alert("Please enter a title and contact email.");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/faculty-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id, category, title, description, skillsNeeded, discussionTime, contactEmail })
        });

        if (!response.ok) {
          throw new Error("Failed to post");
        }

        postTitleInput.value = "";
        postDescInput.value = "";
        postSkillsInput.value = "";
        postTimeInput.value = "";
        postEmailInput.value = "";
        postMsg.textContent = "Submitted! Your posting will appear here once approved.";
      } catch (err) {
        console.error("SUBMIT POST ERROR:", err);
        alert("Something went wrong posting.");
      }
    });
  }

  loadPosts();
});