document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const teamList = document.getElementById("teamList");
  const myRequests = document.getElementById("myRequests");
  const teamTitleInput = document.getElementById("teamTitleInput");
  const teamDescInput = document.getElementById("teamDescInput");
  const teamRolesInput = document.getElementById("teamRolesInput");
  const teamStatusInput = document.getElementById("teamStatusInput");
  const postTeamBtn = document.getElementById("postTeamBtn");

  async function loadTeamPosts() {
    try {
      const response = await fetch("https://campus-connect-1q2c.onrender.com00/api/team");
      const posts = await response.json();

      teamList.innerHTML = "";

      if (posts.length === 0) {
        teamList.innerHTML = "<p class='sub'>No projects posted yet.</p>";
        return;
      }

      for (const post of posts) {
        const card = document.createElement("div");
        card.className = "post-card";

        const isOwner = post.userId?._id === user._id;

        card.innerHTML = `
          <div class="post-title">${post.title}</div>
          <p class="post-meta">${post.description}</p>
          <p class="post-meta">Needs: ${post.rolesNeeded}</p>
          <p class="post-meta">Status: ${post.status}</p>
          <p class="post-meta">Posted by <a href="profile.html?userId=${post.userId?._id}">${post.userId?.name || "Unknown"}</a> — ${post.userId?.department || ""}</p>
          <div class="request-area" data-post-id="${post._id}"></div>
          ${isOwner ? `<button class="btn btn-secondary delete-btn" data-id="${post._id}" style="margin-top: 8px;">Delete</button>` : ""}
        `;
        teamList.appendChild(card);

        const requestArea = card.querySelector(".request-area");

        if (isOwner) {
          const reqResponse = await fetch(`https://campus-connect-1q2c.onrender.com00/api/join-requests/post/${post._id}`);
          const requests = await reqResponse.json();

          if (requests.length === 0) {
            requestArea.innerHTML = "<p class='sub'>No requests yet.</p>";
          } else {
            requestArea.innerHTML = requests.map((r) => `
              <div class="notif-item">
                <span>${r.requesterId?.name || "Unknown"} (${r.requesterId?.department || ""}) — ${r.status}</span>
                ${r.status === "pending" ? `
                  <button class="btn btn-primary accept-btn" data-id="${r._id}">Accept</button>
                  <button class="btn btn-secondary reject-btn" data-id="${r._id}">Reject</button>
                ` : ""}
              </div>
            `).join("");
          }
        } else {
          requestArea.innerHTML = `<button class="btn btn-primary request-btn" data-post-id="${post._id}">Request to Join</button>`;
        }
      }

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          const confirmed = confirm("Delete this post?");
          if (!confirmed) return;

          try {
            await fetch(`https://campus-connect-1q2c.onrender.com00/api/team/${id}`, { method: "DELETE" });
            loadTeamPosts();
          } catch (err) {
            console.error("DELETE TEAM POST ERROR:", err);
            alert("Something went wrong deleting the post.");
          }
        });
      });

      document.querySelectorAll(".request-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const teamPostId = e.target.dataset.postId;

          try {
            const response = await fetch("https://campus-connect-1q2c.onrender.com00/api/join-requests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ teamPostId, requesterId: user._id })
            });

            const data = await response.json();

            if (!response.ok) {
              alert(data.error || "Something went wrong.");
              return;
            }

            alert("Request sent!");
            loadTeamPosts();
            loadMyRequests();
          } catch (err) {
            console.error("REQUEST JOIN ERROR:", err);
            alert("Something went wrong sending the request.");
          }
        });
      });

      document.querySelectorAll(".accept-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          try {
            await fetch(`https://campus-connect-1q2c.onrender.com00/api/join-requests/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "accepted" })
            });
            loadTeamPosts();
          } catch (err) {
            console.error("ACCEPT REQUEST ERROR:", err);
          }
        });
      });

      document.querySelectorAll(".reject-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          try {
            await fetch(`https://campus-connect-1q2c.onrender.com00/api/join-requests/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "rejected" })
            });
            loadTeamPosts();
          } catch (err) {
            console.error("REJECT REQUEST ERROR:", err);
          }
        });
      });
    } catch (err) {
      console.error("LOAD TEAM POSTS ERROR:", err);
      teamList.innerHTML = "<p class='sub'>Something went wrong loading posts.</p>";
    }
  }

  async function loadMyRequests() {
    try {
      const response = await fetch(`https://campus-connect-1q2c.onrender.com00/api/join-requests/user/${user._id}`);
      const requests = await response.json();

      if (requests.length === 0) {
        myRequests.innerHTML = "";
        return;
      }

      myRequests.innerHTML = `
        <h3>My Requests</h3>
        ${requests.map((r) => `
          <div class="notif-item">
            <span>${r.teamPostId?.title || "Unknown project"} — ${r.status}</span>
          </div>
        `).join("")}
      `;
    } catch (err) {
      console.error("LOAD MY REQUESTS ERROR:", err);
    }
  }

  postTeamBtn.addEventListener("click", async () => {
    const title = teamTitleInput.value.trim();
    const description = teamDescInput.value.trim();
    const rolesNeeded = teamRolesInput.value.trim();
    const status = teamStatusInput.value;

    if (!title) {
      alert("Please enter a project title.");
      return;
    }

    try {
      const response = await fetch("https://campus-connect-1q2c.onrender.com00/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, title, description, rolesNeeded, status })
      });

      if (!response.ok) {
        throw new Error("Failed to post project");
      }

      teamTitleInput.value = "";
      teamDescInput.value = "";
      teamRolesInput.value = "";
      teamStatusInput.value = "Not started yet";
      loadTeamPosts();
    } catch (err) {
      console.error("POST TEAM ERROR:", err);
      alert("Something went wrong posting the project.");
    }
  });

  loadTeamPosts();
  loadMyRequests();
});