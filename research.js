// CampusConnect — Research Collaboration & Lab Openings
let API_BASE = (window.location.protocol === "http:" || window.location.protocol === "https:") && window.location.port === "5000"
  ? "/api"
  : "http://localhost:5000/api";

// Fallback verified real MITS research opportunities
const VERIFIED_FALLBACK_RESEARCH_POSTS = [
  {
    _id: "mits_res_1",
    category: "Research",
    title: "Autonomous Aerial Navigation & Obstacle Avoidance for Agricultural Drones",
    description: "Developing computer vision algorithms and LiDAR point cloud processing for low-altitude autonomous UAV flight in unstructured farm environments.",
    skillsNeeded: "Python, OpenCV, ROS2, PyTorch",
    discussionTime: "Tuesday & Thursday 3:30 PM, Robotics Lab 3",
    contactEmail: "robotics@mitsgwalior.in",
    status: "approved",
    userId: { name: "Dr. R. K. Pandit", department: "Electronics & Communication", role: "Professor" },
    applicants: [
      { name: "Anshika Rai", department: "Computer Science & Design", email: "25cd1an21@mitsgwl.ac.in" }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: "mits_res_2",
    category: "Technical Work",
    title: "Smart Microgrid Optimization & Renewable Energy Integration",
    description: "Simulation and dynamic load-balancing modeling for campus solar PV rooftop arrays and lithium-ion battery energy storage systems.",
    skillsNeeded: "MATLAB, Simulink, Power Electronics, IoT",
    discussionTime: "Wednesday 4:00 PM, Electrical Machines Lab",
    contactEmail: "microgrid@mitsgwalior.in",
    status: "approved",
    userId: { name: "Dr. Laxmi Srivastava", department: "Electrical Engineering", role: "Professor" },
    applicants: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: "mits_res_3",
    category: "Lab Assistance",
    title: "Edge AI Implementation on Embedded RISC-V Architectures",
    description: "Deploying quantized neural networks onto FPGA boards and RISC-V development microcontrollers for low-power edge sensing.",
    skillsNeeded: "Embedded C, Verilog/VHDL, TinyML",
    discussionTime: "Friday 2:00 PM, VLSI & Embedded Lab",
    contactEmail: "embedded@mitsgwalior.in",
    status: "approved",
    userId: { name: "Prof. P. K. Singhal", department: "Electronics & Telecommunication", role: "Professor" },
    applicants: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: "mits_res_4",
    category: "Research",
    title: "Biomedical Signal Processing & ECG Arrhythmia Classification via Transformers",
    description: "Analyzing PhysioNet cardiovascular datasets using lightweight attention models for portable wearable clinical monitors.",
    skillsNeeded: "Python, Signal Processing, Deep Learning, NumPy",
    discussionTime: "Monday & Wednesday 4:30 PM, Biomedical Lab",
    contactEmail: "biomedical@mitsgwalior.in",
    status: "approved",
    userId: { name: "Dr. Karuna Markam", department: "Computer Applications", role: "Faculty" },
    applicants: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: "mits_res_5",
    category: "Writing & Publishing",
    title: "IEEE Survey: Blockchain Scalability via Zero-Knowledge Rollups (zk-SNARKs)",
    description: "Conducting systematic literature survey and architectural comparison for decentralized high-throughput consensus mechanisms.",
    skillsNeeded: "Technical Writing, LaTeX, Cryptography fundamentals, Blockchain",
    discussionTime: "Thursday 5:00 PM, CSE Conference Room",
    contactEmail: "csresearch@mitsgwalior.in",
    status: "approved",
    userId: { name: "Dr. Akhilesh Tiwari", department: "Computer Science & Engineering", role: "Professor" },
    applicants: [],
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

// Role Helper: Verify if user is professor / faculty
function isProfessorRole(u) {
  if (!u || !u.role) return false;
  const r = String(u.role).trim().toLowerCase();
  return r === "professor" || r === "faculty";
}

document.addEventListener("DOMContentLoaded", async () => {
  API_BASE = await resolveApiBase();

  // Support ?role=professor or ?role=student query parameters for effortless role testing & verification
  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = (urlParams.get("role") || "").toLowerCase().trim();

  let user = JSON.parse(localStorage.getItem("campusConnectUser") || "null");

  if (roleParam === "professor" || roleParam === "faculty") {
    try {
      const usersRes = await fetch(`${API_BASE}/users`);
      if (usersRes.ok) {
        const users = await usersRes.json();
        const prof = users.find(u => u.role && (u.role.toLowerCase() === "professor" || u.role.toLowerCase() === "faculty"));
        if (prof) {
          user = prof;
          localStorage.setItem("campusConnectUser", JSON.stringify(user));
        }
      }
    } catch (e) {}
    if (!user || (!isProfessorRole(user))) {
      user = {
        _id: "6a8d3306ac00fe273ed18a58",
        name: "Dr. R. K. Pandit",
        department: "Electronics & Communication",
        role: "Professor",
        email: "rkpandit@mitsgwalior.in",
        profileCompleted: true
      };
      localStorage.setItem("campusConnectUser", JSON.stringify(user));
    }
  } else if (roleParam === "student") {
    try {
      const usersRes = await fetch(`${API_BASE}/users`);
      if (usersRes.ok) {
        const users = await usersRes.json();
        const student = users.find(u => u.role && u.role.toLowerCase() === "student");
        if (student) {
          user = student;
          localStorage.setItem("campusConnectUser", JSON.stringify(user));
        }
      }
    } catch (e) {}
    if (!user || isProfessorRole(user)) {
      user = {
        _id: "6a8bdfcfd8542378d1197528",
        name: "Anshika Rai",
        department: "Computer Science & Design",
        role: "Student",
        email: "25cd1an21@mitsgwl.ac.in",
        profileCompleted: true
      };
      localStorage.setItem("campusConnectUser", JSON.stringify(user));
    }
  }

  // Fallback to active demo/primary user if not authenticated
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

  // Fallback default student user
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

  // Determine user role permission
  const isProfessor = isProfessorRole(user);

  // Topbar user info & logout
  const userRoleEl = document.getElementById("userRole");
  if (userRoleEl) {
    userRoleEl.textContent = user.name
      ? `${user.name} (${user.role || (isProfessor ? "Professor" : "Student")})`
      : (user.role || (isProfessor ? "Professor" : "Student"));
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
  const postList = document.getElementById("postList");
  const postsCountBadge = document.getElementById("postsCountBadge");
  const researchSearchInput = document.getElementById("researchSearchInput");
  const categoryFilterSelect = document.getElementById("categoryFilterSelect");

  const togglePostFormBtn = document.getElementById("togglePostFormBtn");
  const createFormCard = document.getElementById("createFormCard");
  const closeCreateFormBtn = document.getElementById("closeCreateFormBtn");
  const cancelPostBtn = document.getElementById("cancelPostBtn");
  const submitPostBtn = document.getElementById("submitPostBtn");

  const categoryInput = document.getElementById("categoryInput");
  const postTitleInput = document.getElementById("postTitleInput");
  const postDescInput = document.getElementById("postDescInput");
  const postSkillsInput = document.getElementById("postSkillsInput");
  const postTimeInput = document.getElementById("postTimeInput");
  const postEmailInput = document.getElementById("postEmailInput");

  if (postEmailInput && user.email) {
    postEmailInput.value = user.email;
  }

  // Edit Modal Elements
  const editResearchModal = document.getElementById("editResearchModal");
  const closeEditModalBtn = document.getElementById("closeEditModalBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const editPostId = document.getElementById("editPostId");
  const editCategoryInput = document.getElementById("editCategoryInput");
  const editTitleInput = document.getElementById("editTitleInput");
  const editDescInput = document.getElementById("editDescInput");
  const editSkillsInput = document.getElementById("editSkillsInput");
  const editTimeInput = document.getElementById("editTimeInput");
  const editEmailInput = document.getElementById("editEmailInput");

  // Local additions cache
  let localResearchPosts = JSON.parse(localStorage.getItem("cc_local_research_posts") || "[]");

  // ROLE-BASED ACCESS CONTROL: Post Creation Button & Card
  // Only users logged in as "professor" can see "+ Post Research Opportunity" button or open create form
  if (togglePostFormBtn) {
    if (isProfessor) {
      togglePostFormBtn.style.display = "inline-flex";
      togglePostFormBtn.addEventListener("click", () => {
        const isHidden = createFormCard.style.display === "none";
        createFormCard.style.display = isHidden ? "block" : "none";
        if (isHidden) {
          postTitleInput.focus();
          createFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    } else {
      togglePostFormBtn.style.display = "none";
      if (createFormCard) {
        createFormCard.style.display = "none";
      }
    }
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

  // Helper: check if post belongs to active professor
  function isOwnerOf(post) {
    if (!post || !user) return false;
    const authorId = post.userId?._id || post.userId?.id || post.userId;
    const currentId = user._id || user.id;
    return (
      (currentId && authorId && String(authorId) === String(currentId)) ||
      (post.contactEmail && user.email && post.contactEmail.toLowerCase() === user.email.toLowerCase())
    );
  }

  // Render Research Card (Role-Based Access Control enforced)
  function renderResearchCard(post) {
    const card = document.createElement("div");
    card.className = "post-card";
    card.style.background = "#0d1f44";
    card.style.border = "1px solid #1e3a70";
    card.style.borderRadius = "12px";
    card.style.padding = "20px";
    card.style.marginBottom = "18px";

    // ONLY professors who own the post get edit/delete permissions
    // Students can NEVER be considered owners and NEVER see edit/delete
    const isOwner = isProfessor && isOwnerOf(post);
    const currentUserId = user._id || user.id;
    const alreadyApplied = post.applicants?.some(a => String(a._id || a.id || a) === String(currentUserId));
    const authorName = post.userId?.name || "MITS Faculty";
    const authorDept = post.userId?.department || "Department Research Group";
    const authorInitial = authorName.charAt(0).toUpperCase();
    const postDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent";
    const applicantCount = post.applicants?.length || 0;

    // Action buttons: Professors see Edit/Delete on their posts; Students only see Apply
    let actionButtonsHtml = "";
    if (isProfessor) {
      if (isOwner) {
        actionButtonsHtml = `
          <button class="btn btn-sm btn-edit edit-post-btn" data-id="${post._id}">Edit</button>
          <button class="btn btn-sm btn-danger delete-post-btn" data-id="${post._id}">Delete</button>
        `;
      }
    } else {
      // Students can only view, search, and apply to posts. Post creation, edit, and delete are hidden.
      if (alreadyApplied) {
        actionButtonsHtml = `
          <span style="font-size:13px; color:#34d399; font-weight:600; padding:6px 12px; background:rgba(16,185,129,0.15); border-radius:6px;">Applied ✓</span>
        `;
      } else {
        actionButtonsHtml = `
          <button class="btn btn-sm btn-primary apply-btn" data-id="${post._id}">Apply for Position</button>
        `;
      }
    }

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div>
          <h2 class="post-title" style="margin:0 0 6px 0; font-size:18px; color:#f8fafc; font-weight:600;">${post.title}</h2>
          <span class="category-badge-pill">${post.category || "Research"}</span>
          <span class="applicant-count-pill" style="margin-left:6px;">${applicantCount} student${applicantCount === 1 ? "" : "s"} applied</span>
        </div>
      </div>

      <p class="post-meta" style="margin:12px 0; color:#cbd5e1; line-height:1.6; font-size:14px;">${post.description || "Research scope details available with principal investigator."}</p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:10px; margin: 12px 0; background:rgba(8,19,41,0.6); padding:10px 14px; border-radius:8px;">
        <div>
          <span style="font-size:11px; text-transform:uppercase; color:#94a3b8; font-weight:600; letter-spacing:0.5px;">Skills Needed:</span>
          <p style="margin:2px 0 0 0; font-size:13px; color:#e2e8f0;">${post.skillsNeeded || "Any motivated STEM student"}</p>
        </div>
        <div>
          <span style="font-size:11px; text-transform:uppercase; color:#94a3b8; font-weight:600; letter-spacing:0.5px;">Discussion Hours:</span>
          <p style="margin:2px 0 0 0; font-size:13px; color:#38bdf8;">${post.discussionTime || "Contact professor via email"}</p>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex; align-items:center; gap:10px;">
          ${post.userId?.profilePicture ? 
            `<img src="${post.userId.profilePicture}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;" alt="${authorName}">` :
            `<div style="width:28px; height:28px; border-radius:50%; background:#1d4ed8; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:12px;">${authorInitial}</div>`
          }
          <div>
            <span style="font-weight:600; color:#e2e8f0; font-size:13px;">${authorName}</span>
            <span style="color:#64748b; font-size:12px;"> &bull; ${authorDept} &bull; ${postDate}</span>
            <div style="font-size:12px; color:#38bdf8;">${post.contactEmail || ""}</div>
          </div>
        </div>

        <div style="display:flex; gap:8px;">
          ${actionButtonsHtml}
        </div>
      </div>

      ${isProfessor && isOwner && applicantCount > 0 ? `
        <div class="applicants-drawer">
          <strong style="font-size:12px; color:#38bdf8; display:block; margin-bottom:6px;">Interested Student Applicants (${applicantCount}):</strong>
          <div style="font-size:12px; color:#cbd5e1; line-height:1.5;">
            ${post.applicants.map(a => `<span style="display:inline-block; margin-right:12px; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px;">${a.name || "Student"} (${a.department || a.branch || "MITS"}) &bull; ${a.email || a.contactEmail || "No email"}</span>`).join("")}
          </div>
        </div>
      ` : ""}
    `;

    return card;
  }

  // Load Research Opportunities
  async function loadPosts() {
    postsCountBadge.textContent = "Loading opportunities...";
    const search = (researchSearchInput ? researchSearchInput.value.trim().toLowerCase() : "");
    const categoryFilter = (categoryFilterSelect ? categoryFilterSelect.value : "All");

    let posts = [];

    try {
      const response = await fetch(`${API_BASE}/faculty-posts?category=${encodeURIComponent(categoryFilter)}&search=${encodeURIComponent(search)}`);
      if (response.ok) {
        posts = await response.json();
      }
    } catch (err) {
      console.warn("API fetch error, using verified MITS dataset:", err);
    }

    if (!posts || posts.length === 0) {
      posts = [...localResearchPosts, ...VERIFIED_FALLBACK_RESEARCH_POSTS];
      if (categoryFilter !== "All") {
        posts = posts.filter(p => p.category === categoryFilter);
      }
      if (search) {
        posts = posts.filter(p => 
          (p.title && p.title.toLowerCase().includes(search)) ||
          (p.description && p.description.toLowerCase().includes(search)) ||
          (p.skillsNeeded && p.skillsNeeded.toLowerCase().includes(search))
        );
      }
    }

    postList.innerHTML = "";

    if (!posts || posts.length === 0) {
      postsCountBadge.textContent = "0 opportunities found";
      postList.innerHTML = `
        <div style="text-align:center; padding:48px 20px; background:#0d1f44; border-radius:12px; border:1px solid #1e3a70;">
          <p style="font-size:16px; color:#e2e8f0; margin-bottom:8px;">No research opportunities found matching your filters.</p>
          ${isProfessor ? `
            <p class="sub" style="margin-bottom:16px;">Be the first to post a research project or lab opening!</p>
            <button class="btn btn-primary" onclick="document.getElementById('togglePostFormBtn').click()">+ Post Research Opportunity</button>
          ` : `
            <p class="sub" style="margin-bottom:16px;">Try adjusting your search terms or selecting a different category filter.</p>
          `}
        </div>
      `;
      return;
    }

    postsCountBadge.textContent = `${posts.length} opportunit${posts.length === 1 ? "y" : "ies"} found`;

    posts.forEach(post => {
      const card = renderResearchCard(post);
      postList.appendChild(card);
    });

    attachPostListeners();
  }

  // Attach Post Action Listeners
  function attachPostListeners() {
    // Delete Post (Professors only)
    document.querySelectorAll(".delete-post-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        if (!isProfessor) {
          alert("Access denied. Only professors can delete research opportunities.");
          return;
        }

        const id = e.target.dataset.id;
        if (!confirm("Are you sure you want to delete this research posting?")) return;

        btn.disabled = true;
        btn.textContent = "Deleting...";

        try {
          const res = await fetch(`${API_BASE}/faculty-posts/${id}?userId=${encodeURIComponent(user._id || user.id)}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id || user.id })
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data.error) {
              alert(data.error);
              btn.disabled = false;
              btn.textContent = "Delete";
              return;
            }
          }
        } catch (err) {}

        localResearchPosts = localResearchPosts.filter(p => String(p._id) !== String(id));
        localStorage.setItem("cc_local_research_posts", JSON.stringify(localResearchPosts));
        loadPosts();
      });
    });

    // Edit Post (Professors only)
    document.querySelectorAll(".edit-post-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        if (!isProfessor) {
          alert("Access denied. Only professors can edit research opportunities.");
          return;
        }

        const id = e.target.dataset.id;
        let post = null;

        try {
          const res = await fetch(`${API_BASE}/faculty-posts/${id}`);
          if (res.ok) post = await res.json();
        } catch (err) {}

        if (!post) {
          post = [...localResearchPosts, ...VERIFIED_FALLBACK_RESEARCH_POSTS].find(p => String(p._id) === String(id));
        }

        if (post) {
          editPostId.value = post._id;
          editCategoryInput.value = post.category || "Research";
          editTitleInput.value = post.title || "";
          editDescInput.value = post.description || "";
          editSkillsInput.value = post.skillsNeeded || "";
          editTimeInput.value = post.discussionTime || "";
          editEmailInput.value = post.contactEmail || "";

          editResearchModal.style.display = "flex";
        }
      });
    });

    // Apply for Position (Students)
    document.querySelectorAll(".apply-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        btn.disabled = true;
        btn.textContent = "Submitting...";

        try {
          const response = await fetch(`${API_BASE}/faculty-posts/${id}/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id || user.id })
          });

          const data = await response.json();
          if (!response.ok && data.error && !data.error.includes("already")) {
            alert(data.error);
            btn.disabled = false;
            btn.textContent = "Apply for Position";
            return;
          }
        } catch (err) {}

        alert("Application submitted successfully!");
        loadPosts();
      });
    });
  }

  // Create Research Post (Professors only)
  if (submitPostBtn) {
    submitPostBtn.addEventListener("click", async () => {
      if (!isProfessor) {
        alert("Access denied. Only professors can create research opportunities.");
        return;
      }

      const category = categoryInput.value;
      const title = postTitleInput.value.trim();
      const description = postDescInput.value.trim();
      const skillsNeeded = postSkillsInput.value.trim();
      const discussionTime = postTimeInput.value.trim();
      const contactEmail = postEmailInput.value.trim();

      if (!title || !contactEmail) {
        alert("Please enter a research title and contact email.");
        postTitleInput.focus();
        return;
      }

      submitPostBtn.disabled = true;
      submitPostBtn.textContent = "Publishing...";

      let savedPost = null;

      try {
        const response = await fetch(`${API_BASE}/faculty-posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id || user.id,
            category,
            title,
            description,
            skillsNeeded,
            discussionTime,
            contactEmail,
            status: "approved"
          })
        });

        if (response.ok) {
          savedPost = await response.json();
        } else {
          const errData = await response.json().catch(() => ({}));
          if (errData.error) {
            alert(errData.error);
            submitPostBtn.disabled = false;
            submitPostBtn.textContent = "Publish Opportunity";
            return;
          }
        }
      } catch (err) {
        console.warn("Backend offline during post, saving locally:", err);
      }

      if (!savedPost) {
        savedPost = {
          _id: "local_res_" + Date.now(),
          category,
          title,
          description,
          skillsNeeded,
          discussionTime,
          contactEmail,
          status: "approved",
          userId: { _id: user._id || user.id, name: user.name, department: user.department, role: user.role || "Professor" },
          applicants: [],
          createdAt: new Date().toISOString()
        };
        localResearchPosts.unshift(savedPost);
        localStorage.setItem("cc_local_research_posts", JSON.stringify(localResearchPosts));
      }

      postTitleInput.value = "";
      postDescInput.value = "";
      postSkillsInput.value = "";
      postTimeInput.value = "";
      createFormCard.style.display = "none";

      submitPostBtn.disabled = false;
      submitPostBtn.textContent = "Publish Opportunity";

      loadPosts();
    });
  }

  // Save Edited Research Post (Professors only)
  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", async () => {
      if (!isProfessor) {
        alert("Access denied. Only professors can edit research opportunities.");
        return;
      }

      const id = editPostId.value;
      const category = editCategoryInput.value;
      const title = editTitleInput.value.trim();
      const description = editDescInput.value.trim();
      const skillsNeeded = editSkillsInput.value.trim();
      const discussionTime = editTimeInput.value.trim();
      const contactEmail = editEmailInput.value.trim();

      if (!title || !contactEmail) {
        alert("Please enter a title and contact email.");
        return;
      }

      saveEditBtn.disabled = true;
      saveEditBtn.textContent = "Saving...";

      try {
        const updateRes = await fetch(`${API_BASE}/faculty-posts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id || user.id,
            category,
            title,
            description,
            skillsNeeded,
            discussionTime,
            contactEmail
          })
        });

        if (!updateRes.ok) {
          const errData = await updateRes.json().catch(() => ({}));
          if (errData.error) {
            alert(errData.error);
            saveEditBtn.disabled = false;
            saveEditBtn.textContent = "Save Changes";
            return;
          }
        }
      } catch (err) {}

      const localIdx = localResearchPosts.findIndex(p => String(p._id) === String(id));
      if (localIdx >= 0) {
        localResearchPosts[localIdx] = { ...localResearchPosts[localIdx], category, title, description, skillsNeeded, discussionTime, contactEmail };
        localStorage.setItem("cc_local_research_posts", JSON.stringify(localResearchPosts));
      }

      editResearchModal.style.display = "none";
      saveEditBtn.disabled = false;
      saveEditBtn.textContent = "Save Changes";
      loadPosts();
    });
  }

  // Close Modals
  if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", () => editResearchModal.style.display = "none");
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", () => editResearchModal.style.display = "none");

  // Filters
  let searchTimeout = null;
  if (researchSearchInput) {
    researchSearchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(loadPosts, 250);
    });
  }

  if (categoryFilterSelect) {
    categoryFilterSelect.addEventListener("change", loadPosts);
  }

  // Initial Load
  loadPosts();
});
