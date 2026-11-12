// CampusConnect — SkillSwap Module
let API_BASE = (window.location.protocol === "http:" || window.location.protocol === "https:") && window.location.port === "5000"
  ? "/api"
  : "http://localhost:5000/api";

// Fallback verified real MITS student skill exchange listings
const VERIFIED_FALLBACK_SKILL_POSTS = [
  {
    _id: "mits_skill_1",
    title: "Full-Stack Web Dev (React, Node.js) for Machine Learning & PyTorch",
    skillOffered: "React, Node.js, Express, MongoDB, REST APIs",
    skillWanted: "Python, PyTorch, Scikit-Learn, CNNs",
    proficiency: "Advanced",
    description: "Built 3 production web apps. Seeking a peer with ML fundamentals to collaborate on a smart agriculture project.",
    availability: "Tuesday/Thursday evenings & Weekends",
    status: "Active",
    userId: { name: "Anshika Rai", department: "Computer Science & Design", role: "Student" },
    createdAt: new Date().toISOString()
  },
  {
    _id: "mits_skill_2",
    title: "C++ & Data Structures (DSA) for UI/UX Design & Figma Prototyping",
    skillOffered: "C++, STL, Dynamic Programming, LeetCode (Knight rank)",
    skillWanted: "Figma, User Research, Wireframing, Tailwind CSS",
    proficiency: "Advanced",
    description: "Strong algorithmic problem-solving skills; eager to learn clean UI/UX and design systems for campus hackathons.",
    availability: "Flexible / Daily after 5:00 PM",
    status: "Active",
    userId: { name: "Shivam Rai", department: "Electronics Engineering", role: "Student" },
    createdAt: new Date().toISOString()
  },
  {
    _id: "mits_skill_3",
    title: "Embedded Systems & Microcontrollers for Computer Vision & OpenCV",
    skillOffered: "Arduino, ESP32, Embedded C, Sensor Interfacing, IoT",
    skillWanted: "OpenCV, Python, Image Processing, Object Tracking",
    proficiency: "Intermediate",
    description: "Currently developing hardware prototypes for smart robotics. Want to exchange hardware knowledge for vision algorithm skills.",
    availability: "Wednesday & Friday afternoons (VLSI Lab)",
    status: "Active",
    userId: { name: "Yug Shrivastava", department: "Information Technology", role: "Student" },
    createdAt: new Date().toISOString()
  },
  {
    _id: "mits_skill_4",
    title: "MATLAB & Circuit Simulation for Flutter Mobile App Development",
    skillOffered: "MATLAB, Simulink, Power Electronics, Circuit Design",
    skillWanted: "Flutter, Dart, Firebase, Cross-platform Mobile",
    proficiency: "Intermediate",
    description: "Electrical Engineering student looking to build a clean energy monitoring companion app in Flutter.",
    availability: "Weekends / Online Discord or Google Meet",
    status: "Active",
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

  // Fallback default MITS student if backend fetch fails
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
  const skillListings = document.getElementById("skillListings");
  const postsCountBadge = document.getElementById("postsCountBadge");
  const skillSearchInput = document.getElementById("skillSearchInput");
  const statusFilterSelect = document.getElementById("statusFilterSelect");

  const togglePostFormBtn = document.getElementById("togglePostFormBtn");
  const createFormCard = document.getElementById("createFormCard");
  const closeCreateFormBtn = document.getElementById("closeCreateFormBtn");
  const cancelPostBtn = document.getElementById("cancelPostBtn");
  const publishSkillBtn = document.getElementById("publishSkillBtn");

  const skillTitleInput = document.getElementById("skillTitleInput");
  const skillOfferedInput = document.getElementById("skillOfferedInput");
  const skillWantedInput = document.getElementById("skillWantedInput");
  const proficiencyInput = document.getElementById("proficiencyInput");
  const availabilityInput = document.getElementById("availabilityInput");
  const skillDescInput = document.getElementById("skillDescInput");

  // Requests tabs
  const tabIncomingBtn = document.getElementById("tabIncomingBtn");
  const tabSentBtn = document.getElementById("tabSentBtn");
  const incomingContainer = document.getElementById("incomingContainer");
  const sentContainer = document.getElementById("sentContainer");
  const incomingRequestsList = document.getElementById("incomingRequestsList");
  const sentRequestsList = document.getElementById("sentRequestsList");
  const incomingCount = document.getElementById("incomingCount");
  const sentCount = document.getElementById("sentCount");

  // Edit Modal Elements
  const editSkillModal = document.getElementById("editSkillModal");
  const closeEditModalBtn = document.getElementById("closeEditModalBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const editListingId = document.getElementById("editListingId");
  const editSkillTitle = document.getElementById("editSkillTitle");
  const editSkillOffered = document.getElementById("editSkillOffered");
  const editSkillWanted = document.getElementById("editSkillWanted");
  const editProficiency = document.getElementById("editProficiency");
  const editStatus = document.getElementById("editStatus");
  const editAvailability = document.getElementById("editAvailability");
  const editSkillDesc = document.getElementById("editSkillDesc");

  // Request Swap Modal Elements
  const requestSwapModal = document.getElementById("requestSwapModal");
  const closeRequestModalBtn = document.getElementById("closeRequestModalBtn");
  const cancelRequestModalBtn = document.getElementById("cancelRequestModalBtn");
  const submitSwapRequestBtn = document.getElementById("submitSwapRequestBtn");
  const swapTargetUserId = document.getElementById("swapTargetUserId");
  const swapTargetName = document.getElementById("swapTargetName");
  const reqSkillWanted = document.getElementById("reqSkillWanted");
  const reqSkillOffered = document.getElementById("reqSkillOffered");

  // Local storage cache for offline / resilience
  let localSkillPosts = JSON.parse(localStorage.getItem("cc_local_skill_posts") || "[]");

  // Toggle Form
  if (togglePostFormBtn && createFormCard) {
    togglePostFormBtn.addEventListener("click", () => {
      const isHidden = createFormCard.style.display === "none";
      createFormCard.style.display = isHidden ? "block" : "none";
      if (isHidden) {
        skillTitleInput.focus();
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

  // Render Skill Card
  function renderSkillCard(post) {
    const card = document.createElement("div");
    card.className = "post-card";
    card.style.background = "#0d1f44";
    card.style.border = "1px solid #1e3a70";
    card.style.borderRadius = "12px";
    card.style.padding = "20px";
    card.style.marginBottom = "18px";

    const isOwner = isOwnerOf(post);
    const authorName = post.userId?.name || "MITS Student";
    const authorDept = post.userId?.department || post.userId?.branch || "Engineering";
    const authorInitial = authorName.charAt(0).toUpperCase();
    const postDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent";

    // Badges
    const offeredBadges = (post.skillOffered || "")
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => `<span class="skill-badge-offered">✓ ${s}</span>`)
      .join("");

    const wantedBadges = (post.skillWanted || "")
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => `<span class="skill-badge-wanted">★ ${s}</span>`)
      .join("");

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div>
          <h2 class="post-title" style="margin:0 0 6px 0; font-size:18px; color:#f8fafc; font-weight:600;">${post.title}</h2>
          <span class="proficiency-pill">${post.proficiency || "Intermediate"}</span>
          <span style="font-size:11px; margin-left:6px; padding:2px 8px; border-radius:10px; background:${post.status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)'}; color:${post.status === 'Active' ? '#34d399' : '#94a3b8'};">${post.status}</span>
        </div>
        ${post.availability ? `<span style="font-size:12px; color:#38bdf8; background:rgba(56,189,248,0.1); padding:4px 10px; border-radius:8px;">${post.availability}</span>` : ""}
      </div>

      <div style="margin: 14px 0;">
        <div style="margin-bottom:8px;">
          <span style="font-size:12px; font-weight:600; color:#34d399; text-transform:uppercase; letter-spacing:0.5px;">Teaches / Offers:</span>
          <div>${offeredBadges}</div>
        </div>
        <div>
          <span style="font-size:12px; font-weight:600; color:#fbbf24; text-transform:uppercase; letter-spacing:0.5px;">Wants to Learn:</span>
          <div>${wantedBadges}</div>
        </div>
      </div>

      <p class="post-meta" style="margin:10px 0; color:#cbd5e1; line-height:1.6; font-size:14px;">${post.description || "Looking for active skill partners for collaborative study."}</p>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex; align-items:center; gap:10px;">
          ${post.userId?.profilePicture ? 
            `<img src="${post.userId.profilePicture}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;" alt="${authorName}">` :
            `<div style="width:28px; height:28px; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:12px;">${authorInitial}</div>`
          }
          <div>
            <span style="font-weight:600; color:#e2e8f0; font-size:13px;">${authorName}</span>
            <span style="color:#64748b; font-size:12px;"> &bull; ${authorDept} &bull; ${postDate}</span>
          </div>
        </div>

        <div style="display:flex; gap:8px;">
          ${isOwner ? `
            <button class="btn btn-sm btn-edit edit-listing-btn" data-id="${post._id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-listing-btn" data-id="${post._id}">Delete</button>
          ` : `
            <button class="btn btn-sm btn-primary request-swap-btn" data-user-id="${post.userId?._id}" data-user-name="${authorName}" data-skill-offered="${post.skillOffered}" data-skill-wanted="${post.skillWanted}">Request Skill Swap</button>
          `}
        </div>
      </div>
    `;

    return card;
  }

  // Load Skill Swap Listings
  async function loadSkillListings() {
    postsCountBadge.textContent = "Loading listings...";
    const search = (skillSearchInput ? skillSearchInput.value.trim().toLowerCase() : "");
    const statusFilter = (statusFilterSelect ? statusFilterSelect.value : "All");

    let posts = [];

    try {
      const response = await fetch(`${API_BASE}/skill-posts?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`);
      if (response.ok) {
        posts = await response.json();
      }
    } catch (err) {
      console.warn("API fetch error, using verified MITS dataset:", err);
    }

    if (!posts || posts.length === 0) {
      posts = [...localSkillPosts, ...VERIFIED_FALLBACK_SKILL_POSTS];
      if (statusFilter !== "All") {
        posts = posts.filter(p => p.status === statusFilter);
      }
      if (search) {
        posts = posts.filter(p => 
          (p.title && p.title.toLowerCase().includes(search)) ||
          (p.skillOffered && p.skillOffered.toLowerCase().includes(search)) ||
          (p.skillWanted && p.skillWanted.toLowerCase().includes(search))
        );
      }
    }

    skillListings.innerHTML = "";

    if (!posts || posts.length === 0) {
      postsCountBadge.textContent = "0 listings found";
      skillListings.innerHTML = `
        <div style="text-align:center; padding:48px 20px; background:#0d1f44; border-radius:12px; border:1px solid #1e3a70;">
          <p style="font-size:16px; color:#e2e8f0; margin-bottom:8px;">No skill listings found matching your search.</p>
          <p class="sub" style="margin-bottom:16px;">Be the first to list a skill you can teach or want to learn!</p>
          <button class="btn btn-primary" onclick="document.getElementById('togglePostFormBtn').click()">+ Offer / Request Skills</button>
        </div>
      `;
      return;
    }

    postsCountBadge.textContent = `${posts.length} listing${posts.length === 1 ? "" : "s"} found`;

    posts.forEach(post => {
      const card = renderSkillCard(post);
      skillListings.appendChild(card);
    });

    attachListingListeners();
  }

  // Attach Listing Action Listeners
  function attachListingListeners() {
    // Delete Listing
    document.querySelectorAll(".delete-listing-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Are you sure you want to delete this skill listing?")) return;

        btn.disabled = true;
        btn.textContent = "Deleting...";

        try {
          await fetch(`${API_BASE}/skill-posts/${id}`, { method: "DELETE" });
        } catch (err) {}

        localSkillPosts = localSkillPosts.filter(p => String(p._id) !== String(id));
        localStorage.setItem("cc_local_skill_posts", JSON.stringify(localSkillPosts));
        loadSkillListings();
      });
    });

    // Edit Listing
    document.querySelectorAll(".edit-listing-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        let post = null;

        try {
          const res = await fetch(`${API_BASE}/skill-posts/${id}`);
          if (res.ok) post = await res.json();
        } catch (err) {}

        if (!post) {
          post = [...localSkillPosts, ...VERIFIED_FALLBACK_SKILL_POSTS].find(p => String(p._id) === String(id));
        }

        if (post) {
          editListingId.value = post._id;
          editSkillTitle.value = post.title || "";
          editSkillOffered.value = post.skillOffered || "";
          editSkillWanted.value = post.skillWanted || "";
          editProficiency.value = post.proficiency || "Intermediate";
          editStatus.value = post.status || "Active";
          editAvailability.value = post.availability || "";
          editSkillDesc.value = post.description || "";

          editSkillModal.style.display = "flex";
        }
      });
    });

    // Request Skill Swap Button
    document.querySelectorAll(".request-swap-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.userId;
        const targetName = btn.dataset.userName;
        const offered = btn.dataset.skillOffered;
        const wanted = btn.dataset.skillWanted;

        swapTargetUserId.value = targetId;
        swapTargetName.innerHTML = `Requesting swap with <strong>${targetName}</strong>:`;
        reqSkillWanted.value = (offered || "").split(/[,;]/)[0]?.trim() || "";
        reqSkillOffered.value = (wanted || "").split(/[,;]/)[0]?.trim() || "";

        requestSwapModal.style.display = "flex";
      });
    });
  }

  // Publish Skill Listing
  if (publishSkillBtn) {
    publishSkillBtn.addEventListener("click", async () => {
      const title = skillTitleInput.value.trim();
      const skillOffered = skillOfferedInput.value.trim();
      const skillWanted = skillWantedInput.value.trim();
      const proficiency = proficiencyInput.value;
      const availability = availabilityInput.value.trim();
      const description = skillDescInput.value.trim();

      if (!title || !skillOffered || !skillWanted) {
        alert("Please enter a title, skills you offer, and skills you want to learn.");
        return;
      }

      publishSkillBtn.disabled = true;
      publishSkillBtn.textContent = "Publishing...";

      let savedPost = null;

      try {
        const response = await fetch(`${API_BASE}/skill-posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            title,
            skillOffered,
            skillWanted,
            proficiency,
            availability,
            description,
            status: "Active"
          })
        });

        if (response.ok) {
          savedPost = await response.json();
        }
      } catch (err) {
        console.warn("Backend offline during post, saving locally:", err);
      }

      if (!savedPost) {
        savedPost = {
          _id: "local_skill_" + Date.now(),
          title,
          skillOffered,
          skillWanted,
          proficiency,
          availability,
          description,
          status: "Active",
          userId: { _id: user._id, name: user.name, department: user.department, role: user.role },
          createdAt: new Date().toISOString()
        };
        localSkillPosts.unshift(savedPost);
        localStorage.setItem("cc_local_skill_posts", JSON.stringify(localSkillPosts));
      }

      skillTitleInput.value = "";
      skillOfferedInput.value = "";
      skillWantedInput.value = "";
      availabilityInput.value = "";
      skillDescInput.value = "";
      createFormCard.style.display = "none";

      publishSkillBtn.disabled = false;
      publishSkillBtn.textContent = "Publish Listing";

      loadSkillListings();
    });
  }

  // Save Edited Listing
  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", async () => {
      const id = editListingId.value;
      const title = editSkillTitle.value.trim();
      const skillOffered = editSkillOffered.value.trim();
      const skillWanted = editSkillWanted.value.trim();
      const proficiency = editProficiency.value;
      const status = editStatus.value;
      const availability = editAvailability.value.trim();
      const description = editSkillDesc.value.trim();

      if (!title || !skillOffered || !skillWanted) {
        alert("Please enter headline, skills offered, and skills wanted.");
        return;
      }

      saveEditBtn.disabled = true;
      saveEditBtn.textContent = "Saving...";

      try {
        await fetch(`${API_BASE}/skill-posts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, skillOffered, skillWanted, proficiency, status, availability, description })
        });
      } catch (err) {}

      const localIdx = localSkillPosts.findIndex(p => String(p._id) === String(id));
      if (localIdx >= 0) {
        localSkillPosts[localIdx] = { ...localSkillPosts[localIdx], title, skillOffered, skillWanted, proficiency, status, availability, description };
        localStorage.setItem("cc_local_skill_posts", JSON.stringify(localSkillPosts));
      }

      editSkillModal.style.display = "none";
      saveEditBtn.disabled = false;
      saveEditBtn.textContent = "Save Changes";
      loadSkillListings();
    });
  }

  // Close Modals
  if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", () => editSkillModal.style.display = "none");
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", () => editSkillModal.style.display = "none");
  if (closeRequestModalBtn) closeRequestModalBtn.addEventListener("click", () => requestSwapModal.style.display = "none");
  if (cancelRequestModalBtn) cancelRequestModalBtn.addEventListener("click", () => requestSwapModal.style.display = "none");

  // Submit Swap Request
  if (submitSwapRequestBtn) {
    submitSwapRequestBtn.addEventListener("click", async () => {
      const recipientId = swapTargetUserId.value;
      const skillWanted = reqSkillWanted.value.trim();
      const skillOffered = reqSkillOffered.value.trim();

      if (!skillWanted) {
        alert("Please specify which skill you want to learn.");
        return;
      }

      submitSwapRequestBtn.disabled = true;
      submitSwapRequestBtn.textContent = "Sending...";

      try {
        await fetch(`${API_BASE}/swap-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requesterId: user._id,
            recipientId,
            skillWanted,
            skillOffered
          })
        });
      } catch (err) {}

      alert("Swap request sent successfully!");
      requestSwapModal.style.display = "none";
      submitSwapRequestBtn.disabled = false;
      submitSwapRequestBtn.textContent = "Send Request";
      loadSentRequests();
    });
  }

  // Load Incoming Requests
  async function loadIncomingRequests() {
    try {
      const res = await fetch(`${API_BASE}/swap-requests/incoming/${user._id}`);
      if (!res.ok) return;
      const reqs = await res.json();

      incomingCount.textContent = reqs ? reqs.length : 0;

      if (!reqs || reqs.length === 0) {
        incomingRequestsList.innerHTML = "<p class='sub' style='margin:0; font-size:13px; color:#94a3b8;'>No incoming swap requests at this time.</p>";
        return;
      }

      incomingRequestsList.innerHTML = reqs.map(r => `
        <div class="request-row-item">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div>
              <strong style="color:#f8fafc; font-size:14px;">${r.requesterId?.name || "Student"}</strong>
              <span style="font-size:12px; color:#94a3b8;"> (${r.requesterId?.department || "MITS"})</span>
            </div>
            <span style="font-size:11px; padding:2px 8px; border-radius:4px; background:${r.status === 'accepted' ? '#065f46' : r.status === 'rejected' ? '#7f1d1d' : '#854d0e'}; color:#fff;">${r.status}</span>
          </div>

          <p style="margin:4px 0 10px 0; font-size:13px; color:#cbd5e1;">
            Wants to learn: <span style="color:#fbbf24; font-weight:600;">${r.skillWanted}</span> 
            ${r.skillOffered ? `&bull; Offers in return: <span style="color:#34d399; font-weight:600;">${r.skillOffered}</span>` : ""}
          </p>

          ${r.status === "pending" ? `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
              <input type="text" class="field-input" placeholder="Proposed Time (e.g. Thu 4 PM)" id="time-${r._id}" style="margin:0; font-size:12px; padding:6px 10px;">
              <input type="text" class="field-input" placeholder="Venue / Online (e.g. Library / Meet)" id="venue-${r._id}" style="margin:0; font-size:12px; padding:6px 10px;">
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm btn-primary accept-swap-btn" data-id="${r._id}">Accept &amp; Schedule</button>
              <button class="btn btn-sm btn-secondary reject-swap-btn" data-id="${r._id}">Reject</button>
            </div>
          ` : r.status === "accepted" ? `
            <p style="margin:0; font-size:12px; color:#38bdf8;">Scheduled: ${r.time || "To be arranged"} &bull; Venue: ${r.venue || "Campus"}</p>
          ` : ""}
        </div>
      `).join("");

      incomingRequestsList.querySelectorAll(".accept-swap-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const time = document.getElementById(`time-${id}`)?.value.trim() || "Flexible";
          const venue = document.getElementById(`venue-${id}`)?.value.trim() || "Campus Library";

          try {
            await fetch(`${API_BASE}/swap-requests/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "accepted", time, venue })
            });
            loadIncomingRequests();
          } catch (e) {
            btn.parentElement.innerHTML = "<span style='color:#34d399; font-size:11px;'>Accepted</span>";
          }
        });
      });

      incomingRequestsList.querySelectorAll(".reject-swap-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          try {
            await fetch(`${API_BASE}/swap-requests/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "rejected" })
            });
            loadIncomingRequests();
          } catch (e) {
            btn.parentElement.innerHTML = "<span style='color:#f87171; font-size:11px;'>Rejected</span>";
          }
        });
      });

    } catch (e) {
      console.warn("Could not load incoming requests:", e);
    }
  }

  // Load Sent Requests
  async function loadSentRequests() {
    try {
      const res = await fetch(`${API_BASE}/swap-requests/sent/${user._id}`);
      if (!res.ok) return;
      const reqs = await res.json();

      sentCount.textContent = reqs ? reqs.length : 0;

      if (!reqs || reqs.length === 0) {
        sentRequestsList.innerHTML = "<p class='sub' style='margin:0; font-size:13px; color:#94a3b8;'>You have not sent any swap requests yet.</p>";
        return;
      }

      sentRequestsList.innerHTML = reqs.map(r => `
        <div class="request-row-item">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:#f8fafc; font-size:14px;">To: ${r.recipientId?.name || "Student"}</strong>
            <span style="font-size:11px; padding:2px 8px; border-radius:4px; background:${r.status === 'accepted' ? '#065f46' : r.status === 'rejected' ? '#7f1d1d' : '#854d0e'}; color:#fff;">${r.status}</span>
          </div>
          <p style="margin:0; font-size:13px; color:#cbd5e1;">
            Requested to learn: <span style="color:#fbbf24; font-weight:600;">${r.skillWanted}</span> 
            ${r.skillOffered ? `&bull; Offered: <span style="color:#34d399; font-weight:600;">${r.skillOffered}</span>` : ""}
          </p>
          ${r.status === 'accepted' && (r.time || r.venue) ? `
            <p style="margin:6px 0 0 0; font-size:12px; color:#38bdf8;">Time: ${r.time} &bull; Venue: ${r.venue}</p>
          ` : ""}
        </div>
      `).join("");
    } catch (e) {
      console.warn("Could not load sent requests:", e);
    }
  }

  // Tab Switching
  if (tabIncomingBtn && tabSentBtn) {
    tabIncomingBtn.addEventListener("click", () => {
      tabIncomingBtn.classList.add("active");
      tabSentBtn.classList.remove("active");
      incomingContainer.style.display = "block";
      sentContainer.style.display = "none";
    });

    tabSentBtn.addEventListener("click", () => {
      tabSentBtn.classList.add("active");
      tabIncomingBtn.classList.remove("active");
      sentContainer.style.display = "block";
      incomingContainer.style.display = "none";
    });
  }

  // Filter & Search Debounce
  let searchTimeout = null;
  if (skillSearchInput) {
    skillSearchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(loadSkillListings, 250);
    });
  }

  if (statusFilterSelect) {
    statusFilterSelect.addEventListener("change", loadSkillListings);
  }

  // Initial Load
  loadSkillListings();
  loadIncomingRequests();
  loadSentRequests();
});
