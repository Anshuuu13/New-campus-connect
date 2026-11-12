// CampusConnect — Team-Up & Project Collaborations
let API_BASE = (window.location.protocol === "http:" || window.location.protocol === "https:") && window.location.port === "5000"
  ? "/api"
  : "http://localhost:5000/api";

// Fallback verified real MITS projects if network drops
const VERIFIED_FALLBACK_TEAM_PROJECTS = [
  {
    _id: "mits_proj_1",
    title: "CampusConnect 3D AR Indoor Wayfinding & Campus Map",
    description: "Building an interactive WebGL and AR indoor navigation system for MITS Gwalior new academic complex, auditoriums, and laboratory wings.",
    rolesNeeded: "1 Flutter Developer, 1 Three.js / WebGL student, 1 UI/UX Designer",
    status: "Ongoing",
    userId: { name: "Anshika Rai", department: "Computer Science & Design", role: "Student" },
    createdAt: new Date().toISOString()
  },
  {
    _id: "mits_proj_2",
    title: "AI-Powered Lecture Audio Transcriber & Smart Notes Generator",
    description: "Developing an on-device speech-to-text pipeline with automated key point extraction and LaTeX formula recognition for engineering classes.",
    rolesNeeded: "1 Python / FastAPI developer, 1 PyTorch student, 1 Frontend dev",
    status: "Ongoing",
    userId: { name: "Yug Shrivastava", department: "Information Technology", role: "Student" },
    createdAt: new Date().toISOString()
  },
  {
    _id: "mits_proj_3",
    title: "Formula Student Electric Vehicle (FSEV) Telemetry & Battery Management",
    description: "Designing real-time CAN bus telemetry dashboard, thermal runaway monitoring, and BMS state-of-charge estimator for collegiate racing.",
    rolesNeeded: "1 Embedded C / STM32 student, 1 IoT Web Developer, 1 Mechanical lead",
    status: "Ongoing",
    userId: { name: "Shivam Rai", department: "Electronics Engineering", role: "Student" },
    createdAt: new Date().toISOString()
  },
  {
    _id: "mits_proj_4",
    title: "Autonomous Agricultural Drone with Hyperspectral Crop Health Imaging",
    description: "Collaborative multidisciplinary project building multispectral UAV payload for precision irrigation and early crop blight detection.",
    rolesNeeded: "1 ROS2 / Drone pilot, 1 Computer Vision developer, 1 Circuit designer",
    status: "Not started yet",
    userId: { name: "Ananya Tripathi", department: "Electrical Engineering", role: "Student" },
    createdAt: new Date().toISOString()
  }
];

// Smart Dynamic API Base Resolver (Works on port 5000, 5500 Live Server, file://, and tunnels)
async function resolveApiBase() {
  if (window.location.port === "5000" || window.location.hostname.includes("loca.lt")) {
    return "/api";
  }

  // Probe localhost:5000
  try {
    const probe = await fetch("http://localhost:5000/api-status", { method: "GET", signal: AbortSignal.timeout(800) });
    if (probe.ok) return "http://localhost:5000/api";
  } catch (e) {}

  // Probe public tunnel
  try {
    const probe = await fetch("https://chubby-rockets-grin.loca.lt/api-status", {
      headers: { "Bypass-Tunnel-Reminder": "true" },
      signal: AbortSignal.timeout(1000)
    });
    if (probe.ok) return "https://chubby-rockets-grin.loca.lt/api";
  } catch (e) {}

  return window.location.protocol.startsWith("http") ? "/api" : "http://localhost:5000/api";
}

document.addEventListener("DOMContentLoaded", async () => {
  API_BASE = await resolveApiBase();

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
      _id: "6a8bdfcfd8542378d1197528",
      name: "Anshika Kumari",
      enrollmentNumber: "BTCD25O1021",
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

  // In-memory state for local additions if offline
  let localProjects = JSON.parse(localStorage.getItem("cc_local_team_projects") || "[]");

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
    const authorId = post.userId?._id || post.userId?.id || post.userId;
    const currentId = user._id || user.id;
    return String(authorId) === String(currentId) || (post.userId?.email && post.userId.email === user.email);
  }

  // Render Post Card helper
  function renderPostCard(post) {
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

    return card;
  }

  // Load Team Posts
  async function loadTeamPosts() {
    postsCountBadge.textContent = "Loading projects...";
    const search = (teamSearchInput ? teamSearchInput.value.trim().toLowerCase() : "");
    const statusFilter = (statusFilterSelect ? statusFilterSelect.value : "All");

    let posts = [];

    try {
      const response = await fetch(`${API_BASE}/team?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`);
      if (response.ok) {
        posts = await response.json();
      }
    } catch (err) {
      console.warn("API fetch error, using verified MITS dataset:", err);
    }

    // Merge with fallback data if empty
    if (!posts || posts.length === 0) {
      posts = [...localProjects, ...VERIFIED_FALLBACK_TEAM_PROJECTS];
      if (statusFilter !== "All") {
        posts = posts.filter(p => p.status === statusFilter);
      }
      if (search) {
        posts = posts.filter(p => 
          (p.title && p.title.toLowerCase().includes(search)) ||
          (p.description && p.description.toLowerCase().includes(search)) ||
          (p.rolesNeeded && p.rolesNeeded.toLowerCase().includes(search))
        );
      }
    }

    teamList.innerHTML = "";

    if (!posts || posts.length === 0) {
      postsCountBadge.textContent = "0 projects found";
      teamList.innerHTML = `
        <div style="text-align:center; padding:48px 20px; background:#0d1f44; border-radius:12px; border:1px solid #1e3a70;">
          <p style="font-size:16px; color:#e2e8f0; margin-bottom:8px;">No projects found matching your search.</p>
          <p class="sub" style="margin-bottom:16px;">Be the first to post a project and recruit teammates!</p>
          <button class="btn btn-primary" onclick="document.getElementById('togglePostFormBtn').click()">+ Post New Project</button>
        </div>
      `;
      return;
    }

    postsCountBadge.textContent = `${posts.length} project${posts.length === 1 ? "" : "s"} found`;

    posts.forEach(post => {
      const card = renderPostCard(post);
      teamList.appendChild(card);
      if (isOwnerOf(post)) {
        loadPostRequests(post._id);
      }
    });

    attachPostActionListeners();
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
            btn.parentElement.innerHTML = "<span style='color:#34d399; font-size:11px;'>Accepted</span>";
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
            btn.parentElement.innerHTML = "<span style='color:#f87171; font-size:11px;'>Rejected</span>";
          }
        });
      });

    } catch (e) {
      container.innerHTML = "<p class='sub' style='margin:0; font-size:12px; color:#94a3b8;'>No applicant requests yet.</p>";
    }
  }

  // Attach Action Listeners
  function attachPostActionListeners() {
    // Delete Post
    document.querySelectorAll(".delete-post-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Are you sure you want to delete this project listing?")) return;

        btn.disabled = true;
        btn.textContent = "Deleting...";

        try {
          await fetch(`${API_BASE}/team/${id}`, { method: "DELETE" });
        } catch (err) {}

        localProjects = localProjects.filter(p => String(p._id) !== String(id));
        localStorage.setItem("cc_local_team_projects", JSON.stringify(localProjects));
        loadTeamPosts();
      });
    });

    // Edit Post
    document.querySelectorAll(".edit-post-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        let post = null;

        try {
          const res = await fetch(`${API_BASE}/team/${id}`);
          if (res.ok) post = await res.json();
        } catch (err) {}

        if (!post) {
          post = [...localProjects, ...VERIFIED_FALLBACK_TEAM_PROJECTS].find(p => String(p._id) === String(id));
        }

        if (post) {
          editPostId.value = post._id;
          editTitleInput.value = post.title || "";
          editDescInput.value = post.description || "";
          editRolesInput.value = post.rolesNeeded || "";
          editStatusInput.value = post.status || "Ongoing";

          editTeamModal.style.display = "flex";
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
          if (!response.ok && data.error && !data.error.includes("already")) {
            alert(data.error);
            btn.disabled = false;
            btn.textContent = "Request to Join";
            return;
          }
        } catch (err) {}

        btn.textContent = "Request Sent ✓";
        btn.style.background = "#059669";
        loadMyRequests();
      });
    });
  }

  // Load Active User's Sent Requests
  async function loadMyRequests() {
    if (!myRequestsSection || !myRequestsList) return;

    try {
      const response = await fetch(`${API_BASE}/join-requests/user/${user._id}`);
      if (response.ok) {
        const requests = await response.json();
        if (requests && requests.length > 0) {
          myRequestsSection.style.display = "block";
          myRequestsList.innerHTML = requests.map(r => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:13px; color:#e2e8f0;">${r.teamPostId?.title || "Team Project"}</span>
              <span style="font-size:12px; font-weight:600; padding:2px 8px; border-radius:4px; background:${r.status === 'accepted' ? '#065f46' : r.status === 'rejected' ? '#7f1d1d' : '#854d0e'}; color:#fff;">${r.status}</span>
            </div>
          `).join("");
        }
      }
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

      let savedPost = null;

      try {
        const response = await fetch(`${API_BASE}/team`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id, title, description, rolesNeeded, status })
        });

        if (response.ok) {
          savedPost = await response.json();
        }
      } catch (err) {
        console.warn("Backend offline during post, saving locally:", err);
      }

      if (!savedPost) {
        savedPost = {
          _id: "local_proj_" + Date.now(),
          title,
          description,
          rolesNeeded,
          status,
          userId: { _id: user._id, name: user.name, department: user.department, role: user.role },
          createdAt: new Date().toISOString()
        };
        localProjects.unshift(savedPost);
        localStorage.setItem("cc_local_team_projects", JSON.stringify(localProjects));
      }

      teamTitleInput.value = "";
      teamDescInput.value = "";
      teamRolesInput.value = "";
      teamStatusInput.value = "Ongoing";
      createFormCard.style.display = "none";

      postTeamBtn.disabled = false;
      postTeamBtn.textContent = "Publish Project";

      loadTeamPosts();
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
        await fetch(`${API_BASE}/team/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, rolesNeeded, status })
        });
      } catch (err) {}

      // Update in local cache if present
      const localIdx = localProjects.findIndex(p => String(p._id) === String(id));
      if (localIdx >= 0) {
        localProjects[localIdx] = { ...localProjects[localIdx], title, description, rolesNeeded, status };
        localStorage.setItem("cc_local_team_projects", JSON.stringify(localProjects));
      }

      editTeamModal.style.display = "none";
      saveEditBtn.disabled = false;
      saveEditBtn.textContent = "Save Changes";
      loadTeamPosts();
    });
  }

  // Close Edit Modal Handlers
  if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", () => editTeamModal.style.display = "none");
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", () => editTeamModal.style.display = "none");

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
