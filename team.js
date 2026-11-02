// CampusConnect — Team-Up & Project Collaborations
const API_BASE = (window.location.protocol === "http:" || window.location.protocol === "https:") && window.location.host
  ? "/api"
  : "https://campus-connect-1q2c.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  // Session resolution
  let user = JSON.parse(localStorage.getItem("campusConnectUser") || "null");

  // Fallback to active demo/primary student user if not authenticated
  if (!user || (!user._id && !user.id)) {
    try {
      const usersRes = await fetch(`${API_BASE}/users`);
      if (usersRes.ok) {
        const users = await usersRes.json();
        if (users && users.length > 0) {
          user = users.find(u => u.role === "Student") || users[0];
          localStorage.setItem("campusConnectUser", JSON.stringify(user));
        }
      }
    } catch (e) {
      console.warn("Could not retrieve active session from backend:", e);
    }
  }

  // If still completely null, construct default MITS student session
  if (!user) {
    user = {
      _id: "mits_student_guest",
      name: "Anshika Rai",
      department: "Computer Science & Design",
      role: "Student",
      email: "25cd1an21@mitsgwl.ac.in",
      profileCompleted: true
    };
    localStorage.setItem("campusConnectUser", JSON.stringify(user));
  }

  // Topbar user info & logout
  const userRoleEl = document.getElementById("userRole");
  if (userRoleEl) {
    userRoleEl.textContent = user.name ? `${user.name} (${user.role || "Student"})` : (user.role || "Student");
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.style.display = "inline-block";
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("campusConnectUser");
      window.location.href = "login.html";
    });
  }

  // DOM Elements
  const teamList = document.getElementById("teamList");
  const postsCountBadge = document.getElementById("postsCountBadge");
  const teamSearchInput = document.getElementById("teamSearchInput");
  const statusFilterSelect = document.getElementById("statusFilterSelect");
  
  const togglePostFormBtn = document.getElementById("togglePostFormBtn");
  const createFormCard = document.getElementById("createFormCard");
  const closeCreateFormBtn = document.getElementById("closeCreateFormBtn");
  const cancelPostBtn = document.getElementById("cancelPostBtn");
  const postTeamBtn = document.getElementById("postTeamBtn");

  const teamTitleInput = document.getElementById("teamTitleInput");
  const teamDescInput = document.getElementById("teamDescInput");
  const teamRolesInput = document.getElementById("teamRolesInput");
  const teamStatusInput = document.getElementById("teamStatusInput");

  const myRequestsSection = document.getElementById("myRequestsSection");
  const myRequestsList = document.getElementById("myRequestsList");

  // Edit Modal Elements
  const editTeamModal = document.getElementById("editTeamModal");
  const closeEditModalBtn = document.getElementById("closeEditModalBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const editPostId = document.getElementById("editPostId");
  const editTitleInput = document.getElementById("editTitleInput");
  const editDescInput = document.getElementById("editDescInput");
  const editRolesInput = document.getElementById("editRolesInput");
  const editStatusInput = document.getElementById("editStatusInput");

  // Toggle Create Form Card
  if (togglePostFormBtn && createFormCard) {
    togglePostFormBtn.addEventListener("click", () => {
      const isHidden = createFormCard.style.display === "none";
      createFormCard.style.display = isHidden ? "block" : "none";
      if (isHidden) {
        teamTitleInput.focus();
        createFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (closeCreateFormBtn && createFormCard) {
    closeCreateFormBtn.addEventListener("click", () => {
      createFormCard.style.display = "none";
    });
  }

  if (cancelPostBtn && createFormCard) {
    cancelPostBtn.addEventListener("click", () => {
      createFormCard.style.display = "none";
    });
  }

  // Helper: check if post belongs to active user
  function isOwnerOf(post) {
    if (!post || !user) return false;
    const authorId = post.userId?._id || post.userId;
    const currentId = user._id || user.id;
    return String(authorId) === String(currentId) || (post.userId?.email && post.userId.email === user.email);
  }

  // Load Team Posts from Backend
  async function loadTeamPosts() {
    try {
      postsCountBadge.textContent = "Loading projects...";
      const search = encodeURIComponent(teamSearchInput ? teamSearchInput.value.trim() : "");
      const status = encodeURIComponent(statusFilterSelect ? statusFilterSelect.value : "All");

      const response = await fetch(`${API_BASE}/team?search=${search}&status=${status}`);
      if (!response.ok) throw new Error("Failed to fetch team posts");

      const posts = await response.json();
      teamList.innerHTML = "";

      if (!posts || posts.length === 0) {
        postsCountBadge.textContent = "0 projects found";
        teamList.innerHTML = `
          <div style="text-align:center; padding:48px 20px; background:#0d1f44; border-radius:12px; border:1px solid #1e3a70;">
            <p style="font-size:16px; color:#e2e8f0; margin-bottom:8px;">No projects found matching your criteria.</p>
            <p class="sub" style="margin-bottom:16px;">Be the first to post a project and recruit teammates!</p>
            <button class="btn btn-primary" onclick="document.getElementById('togglePostFormBtn').click()">+ Post New Project</button>
          </div>
        `;
        return;
      }

      postsCountBadge.textContent = `${posts.length} project${posts.length === 1 ? "" : "s"} found`;

      for (const post of posts) {
        const card = document.createElement("div");
        card.className = "post-card";
        card.style.background = "#0d1f44";
        card.style.border = "1px solid #1e3a70";
        card.style.borderRadius = "12px";
        card.style.padding = "20px";
        card.style.marginBottom = "18px";
        card.style.transition = "transform 0.2s, border-color 0.2s";

        const isOwner = isOwnerOf(post);
        const statusClass = post.status === "Ongoing" ? "status-badge-ongoing" : "status-badge-pending";

        // Parse role tags
        const roleChips = (post.rolesNeeded || "")
          .split(/[,;]/)
          .map(r => r.trim())
          .filter(Boolean)
          .map(r => `<span class="role-tag-pill">${r}</span>`)
          .join("");

        const authorName = post.userId?.name || "MITS Student";
        const authorDept = post.userId?.department || post.userId?.branch || "Engineering";
        const authorInitial = authorName.charAt(0).toUpperCase();
        const postDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent";

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
            <h2 class="post-title" style="margin:0; font-size:18px; color:#f8fafc; font-weight:600;">${post.title}</h2>
            <span class="${statusClass}">${post.status}</span>
          </div>

          <p class="post-meta" style="margin:12px 0; color:#cbd5e1; line-height:1.6; font-size:14px;">${post.description || "No description provided."}</p>

          <div style="margin-bottom:10px;">
            <span style="font-size:12px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Teammates Needed:</span>
            <div class="roles-tags-list">${roleChips || "<span class='sub'>Any motivated students</span>"}</div>
          </div>

          <div class="card-author-meta">
            ${post.userId?.profilePicture ? 
              `<img src="${post.userId.profilePicture}" class="author-avatar-sm" alt="${authorName}">` :
              `<div class="author-avatar-sm">${authorInitial}</div>`
            }
            <div>
              <span style="font-weight:600; color:#e2e8f0;">${authorName}</span>
              <span style="color:#64748b;"> &bull; ${authorDept} &bull; ${postDate}</span>
            </div>
          </div>

          <div class="card-actions-toolbar">
            ${isOwner ? `
              <button class="btn btn-sm btn-edit edit-post-btn" data-id="${post._id}">Edit Project</button>
              <button class="btn btn-sm btn-danger delete-post-btn" data-id="${post._id}">Delete</button>
            ` : `
              <button class="btn btn-sm btn-primary request-join-btn" data-post-id="${post._id}">Request to Join</button>
            `}
          </div>

          ${isOwner ? `<div class="requests-drawer" id="requests-for-${post._id}">Loading applicant requests...</div>` : ""}
        `;

        teamList.appendChild(card);

        // If post owner, fetch and render incoming join requests
        if (isOwner) {
          loadPostRequests(post._id);
        }
      }

      // Attach event listeners for post actions
      attachPostActionListeners();

    } catch (err) {
      console.error("LOAD TEAM POSTS ERROR:", err);
      teamList.innerHTML = "<p class='sub' style='color:#f87171;'>Something went wrong loading team projects. Please refresh.</p>";
      postsCountBadge.textContent = "Error loading";
    }
  }

  // Fetch requests for a specific post
  async function loadPostRequests(postId) {
    const container = document.getElementById(`requests-for-${postId}`);
    if (!container) return;

    try {
      const response = await fetch(`${API_BASE}/join-requests/post/${postId}`);
      if (!response.ok) throw new Error("Failed to fetch requests");
      const requests = await response.json();

      if (!requests || requests.length === 0) {
        container.innerHTML = "<p class='sub' style='margin:0; font-size:12px; color:#94a3b8;'>No student join requests received yet.</p>";
        return;
      }

      container.innerHTML = `
        <div style="font-size:12px; font-weight:600; color:#38bdf8; margin-bottom:6px;">Applicant Requests (${requests.length})</div>
        ${requests.map(r => `
          <div class="request-item-row">
            <div>
              <span style="font-weight:600; color:#f8fafc; font-size:13px;">${r.requesterId?.name || "Student"}</span>
              <span style="font-size:12px; color:#94a3b8;"> (${r.requesterId?.department || r.requesterId?.branch || "Engineering"})</span>
              <span style="font-size:11px; padding:2px 6px; border-radius:4px; margin-left:6px; background:${r.status === 'accepted' ? '#065f46' : r.status === 'rejected' ? '#7f1d1d' : '#854d0e'}; color:#fff;">${r.status}</span>
            </div>
            ${r.status === "pending" ? `
              <div style="display:flex; gap:6px;">
                <button class="btn btn-sm btn-primary accept-req-btn" data-req-id="${r._id}" style="padding:3px 10px; font-size:11px;">Accept</button>
                <button class="btn btn-sm btn-secondary reject-req-btn" data-req-id="${r._id}" style="padding:3px 10px; font-size:11px;">Reject</button>
              </div>
            ` : ""}
          </div>
        `).join("")}
      `;

      // Accept / Reject listeners
      container.querySelectorAll(".accept-req-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const reqId = btn.dataset.reqId;
          try {
            await fetch(`${API_BASE}/join-requests/${reqId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "accepted" })
            });
            loadPostRequests(postId);
          } catch (e) {
            alert("Could not update request status.");
          }
        });
      });

      container.querySelectorAll(".reject-req-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const reqId = btn.dataset.reqId;
          try {
            await fetch(`${API_BASE}/join-requests/${reqId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "rejected" })
            });
            loadPostRequests(postId);
          } catch (e) {
            alert("Could not update request status.");
          }
        });
      });

    } catch (e) {
      container.innerHTML = "<p class='sub' style='margin:0; font-size:12px;'>Could not load requests.</p>";
    }
  }

  // Attach Post Action Listeners
  function attachPostActionListeners() {
    // Delete Post
    document.querySelectorAll(".delete-post-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Are you sure you want to delete this project listing?")) return;

        btn.disabled = true;
        btn.textContent = "Deleting...";

        try {
          const res = await fetch(`${API_BASE}/team/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Delete failed");
          loadTeamPosts();
        } catch (err) {
          alert("Something went wrong deleting the project.");
          btn.disabled = false;
          btn.textContent = "Delete";
        }
      });
    });

    // Edit Post (Opens prefilled modal)
    document.querySelectorAll(".edit-post-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        try {
          const res = await fetch(`${API_BASE}/team/${id}`);
          if (!res.ok) throw new Error("Fetch failed");
          const post = await res.json();

          editPostId.value = post._id;
          editTitleInput.value = post.title || "";
          editDescInput.value = post.description || "";
          editRolesInput.value = post.rolesNeeded || "";
          editStatusInput.value = post.status || "Ongoing";

          editTeamModal.style.display = "flex";
        } catch (err) {
          alert("Could not open project for editing.");
        }
      });
    });

    // Request to Join
    document.querySelectorAll(".request-join-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const teamPostId = e.target.dataset.postId;
        btn.disabled = true;
        btn.textContent = "Sending...";

        try {
          const response = await fetch(`${API_BASE}/join-requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamPostId, requesterId: user._id })
          });

          const data = await response.json();
          if (!response.ok) {
            alert(data.error || "Failed to send join request.");
            btn.disabled = false;
            btn.textContent = "Request to Join";
            return;
          }

          btn.textContent = "Request Sent ✓";
          btn.style.background = "#059669";
          loadMyRequests();
        } catch (err) {
          alert("Something went wrong sending the join request.");
          btn.disabled = false;
          btn.textContent = "Request to Join";
        }
      });
    });
  }

  // Load Active User's Sent Requests
  async function loadMyRequests() {
    if (!myRequestsSection || !myRequestsList) return;

    try {
      const response = await fetch(`${API_BASE}/join-requests/user/${user._id}`);
      if (!response.ok) return;

      const requests = await response.json();
      if (!requests || requests.length === 0) {
        myRequestsSection.style.display = "none";
        return;
      }

      myRequestsSection.style.display = "block";
      myRequestsList.innerHTML = requests.map(r => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:13px; color:#e2e8f0;">${r.teamPostId?.title || "Project"}</span>
          <span style="font-size:12px; font-weight:600; padding:2px 8px; border-radius:4px; background:${r.status === 'accepted' ? '#065f46' : r.status === 'rejected' ? '#7f1d1d' : '#854d0e'}; color:#fff;">${r.status}</span>
        </div>
      `).join("");
    } catch (e) {
      console.warn("Could not load user requests:", e);
    }
  }

  // Create Project Submit Handler
  if (postTeamBtn) {
    postTeamBtn.addEventListener("click", async () => {
      const title = teamTitleInput.value.trim();
      const description = teamDescInput.value.trim();
      const rolesNeeded = teamRolesInput.value.trim();
      const status = teamStatusInput.value;

      if (!title) {
        alert("Please enter a project title.");
        teamTitleInput.focus();
        return;
      }

      postTeamBtn.disabled = true;
      postTeamBtn.textContent = "Publishing...";

      try {
        const response = await fetch(`${API_BASE}/team`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id, title, description, rolesNeeded, status })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to create team project");
        }

        teamTitleInput.value = "";
        teamDescInput.value = "";
        teamRolesInput.value = "";
        teamStatusInput.value = "Ongoing";
        createFormCard.style.display = "none";

        loadTeamPosts();
      } catch (err) {
        alert(err.message || "Something went wrong publishing your project.");
      } finally {
        postTeamBtn.disabled = false;
        postTeamBtn.textContent = "Publish Project";
      }
    });
  }

  // Save Edited Project Handler
  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", async () => {
      const id = editPostId.value;
      const title = editTitleInput.value.trim();
      const description = editDescInput.value.trim();
      const rolesNeeded = editRolesInput.value.trim();
      const status = editStatusInput.value;

      if (!title) {
        alert("Please enter a project title.");
        return;
      }

      saveEditBtn.disabled = true;
      saveEditBtn.textContent = "Saving...";

      try {
        const response = await fetch(`${API_BASE}/team/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, rolesNeeded, status })
        });

        if (!response.ok) {
          throw new Error("Update failed");
        }

        editTeamModal.style.display = "none";
        loadTeamPosts();
      } catch (err) {
        alert("Could not update the project details.");
      } finally {
        saveEditBtn.disabled = false;
        saveEditBtn.textContent = "Save Changes";
      }
    });
  }

  // Close Edit Modal Handlers
  if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener("click", () => {
      editTeamModal.style.display = "none";
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
      editTeamModal.style.display = "none";
    });
  }

  // Filter & Search Handlers (with debounce for search)
  let searchTimeout = null;
  if (teamSearchInput) {
    teamSearchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(loadTeamPosts, 250);
    });
  }

  if (statusFilterSelect) {
    statusFilterSelect.addEventListener("change", loadTeamPosts);
  }

  // Initial Load
  loadTeamPosts();
  loadMyRequests();
});
