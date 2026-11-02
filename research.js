// CampusConnect — Research Collaboration & Lab Openings
const API_BASE = (window.location.protocol === "http:" || window.location.protocol === "https:") && window.location.host
  ? "/api"
  : "https://campus-connect-1q2c.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  // Session resolution
  let user = JSON.parse(localStorage.getItem("campusConnectUser") || "null");

  // Fallback to active demo/primary user if not authenticated
  if (!user || (!user._id && !user.id)) {
    try {
      const usersRes = await fetch(`${API_BASE}/users`);
      if (usersRes.ok) {
        const users = await usersRes.json();
        if (users && users.length > 0) {
          user = users.find(u => u.role === "Professor" || u.role === "Faculty") || users[0];
          localStorage.setItem("campusConnectUser", JSON.stringify(user));
        }
      }
    } catch (e) {
      console.warn("Could not retrieve active session from backend:", e);
    }
  }

  // Fallback default MITS faculty/student user if backend fetch fails
  if (!user) {
    user = {
      _id: "mits_research_lead",
      name: "Dr. R. K. Pandit",
      department: "Electronics & Communication",
      role: "Professor",
      email: "rkpandit@mitsgwalior.in",
      profileCompleted: true
    };
    localStorage.setItem("campusConnectUser", JSON.stringify(user));
  }

  // Topbar user info & logout
  const userRoleEl = document.getElementById("userRole");
  if (userRoleEl) {
    userRoleEl.textContent = user.name ? `${user.name} (${user.role || "Member"})` : (user.role || "Member");
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

  // Pre-fill email with logged in user email if available
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

  // Toggle Create Form Card
  if (togglePostFormBtn && createFormCard) {
    togglePostFormBtn.addEventListener("click", () => {
      const isHidden = createFormCard.style.display === "none";
      createFormCard.style.display = isHidden ? "block" : "none";
      if (isHidden) {
        postTitleInput.focus();
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
    return String(authorId) === String(currentId) || (post.contactEmail && post.contactEmail.toLowerCase() === (user.email || "").toLowerCase());
  }

  // Load Research Opportunities from Backend
  async function loadPosts() {
    try {
      postsCountBadge.textContent = "Loading opportunities...";
      const search = encodeURIComponent(researchSearchInput ? researchSearchInput.value.trim() : "");
      const category = encodeURIComponent(categoryFilterSelect ? categoryFilterSelect.value : "All");

      const response = await fetch(`${API_BASE}/faculty-posts?category=${category}&search=${search}`);
      if (!response.ok) throw new Error("Failed to fetch research posts");

      const posts = await response.json();
      postList.innerHTML = "";

      if (!posts || posts.length === 0) {
        postsCountBadge.textContent = "0 opportunities found";
        postList.innerHTML = `
          <div style="text-align:center; padding:48px 20px; background:#0d1f44; border-radius:12px; border:1px solid #1e3a70;">
            <p style="font-size:16px; color:#e2e8f0; margin-bottom:8px;">No research opportunities found matching your filters.</p>
            <p class="sub" style="margin-bottom:16px;">Be the first to post a research project or lab opening!</p>
            <button class="btn btn-primary" onclick="document.getElementById('togglePostFormBtn').click()">+ Post Research Opportunity</button>
          </div>
        `;
        return;
      }

      postsCountBadge.textContent = `${posts.length} opportunit${posts.length === 1 ? "y" : "ies"} found`;

      posts.forEach(post => {
        const card = document.createElement("div");
        card.className = "post-card";
        card.style.background = "#0d1f44";
        card.style.border = "1px solid #1e3a70";
        card.style.borderRadius = "12px";
        card.style.padding = "20px";
        card.style.marginBottom = "18px";

        const isOwner = isOwnerOf(post);
        const alreadyApplied = post.applicants?.some(a => String(a._id || a) === String(user._id || user.id));
        const authorName = post.userId?.name || "MITS Faculty";
        const authorDept = post.userId?.department || "Department Research Group";
        const authorInitial = authorName.charAt(0).toUpperCase();
        const postDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent";
        const applicantCount = post.applicants?.length || 0;

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
              ${isOwner ? `
                <button class="btn btn-sm btn-edit edit-post-btn" data-id="${post._id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-post-btn" data-id="${post._id}">Delete</button>
              ` : alreadyApplied ? `
                <span style="font-size:13px; color:#34d399; font-weight:600; padding:6px 12px; background:rgba(16,185,129,0.15); border-radius:6px;">Applied ✓</span>
              ` : `
                <button class="btn btn-sm btn-primary apply-btn" data-id="${post._id}">Apply for Position</button>
              `}
            </div>
          </div>

          ${isOwner && applicantCount > 0 ? `
            <div class="applicants-drawer">
              <strong style="font-size:12px; color:#38bdf8; display:block; margin-bottom:6px;">Interested Student Applicants (${applicantCount}):</strong>
              <div style="font-size:12px; color:#cbd5e1; line-height:1.5;">
                ${post.applicants.map(a => `<span style="display:inline-block; margin-right:12px; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px;">${a.name || "Student"} (${a.department || a.branch || "MITS"}) &bull; ${a.email || a.contactEmail || "No email"}</span>`).join("")}
              </div>
            </div>
          ` : ""}
        `;

        postList.appendChild(card);
      });

      attachPostListeners();

    } catch (err) {
      console.error("LOAD RESEARCH POSTS ERROR:", err);
      postList.innerHTML = "<p class='sub' style='color:#f87171;'>Something went wrong loading research opportunities.</p>";
      postsCountBadge.textContent = "Error loading";
    }
  }

  // Attach Post Action Listeners
  function attachPostListeners() {
    // Delete Post
    document.querySelectorAll(".delete-post-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Are you sure you want to delete this research posting?")) return;

        btn.disabled = true;
        btn.textContent = "Deleting...";

        try {
          const res = await fetch(`${API_BASE}/faculty-posts/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Delete failed");
          loadPosts();
        } catch (err) {
          alert("Something went wrong deleting the research posting.");
          btn.disabled = false;
          btn.textContent = "Delete";
        }
      });
    });

    // Edit Post
    document.querySelectorAll(".edit-post-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        try {
          const res = await fetch(`${API_BASE}/faculty-posts/${id}`);
          if (!res.ok) throw new Error("Fetch failed");
          const post = await res.json();

          editPostId.value = post._id;
          editCategoryInput.value = post.category || "Research";
          editTitleInput.value = post.title || "";
          editDescInput.value = post.description || "";
          editSkillsInput.value = post.skillsNeeded || "";
          editTimeInput.value = post.discussionTime || "";
          editEmailInput.value = post.contactEmail || "";

          editResearchModal.style.display = "flex";
        } catch (err) {
          alert("Could not load research opportunity for editing.");
        }
      });
    });

    // Apply for Position
    document.querySelectorAll(".apply-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        btn.disabled = true;
        btn.textContent = "Submitting...";

        try {
          const response = await fetch(`${API_BASE}/faculty-posts/${id}/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id })
          });

          const data = await response.json();
          if (!response.ok) {
            alert(data.error || "Could not apply.");
            btn.disabled = false;
            btn.textContent = "Apply for Position";
            return;
          }

          alert(`Application submitted successfully! You may also reach out to: ${data.contactEmail}`);
          loadPosts();
        } catch (err) {
          alert("Something went wrong submitting your application.");
          btn.disabled = false;
          btn.textContent = "Apply for Position";
        }
      });
    });
  }

  // Create Research Post
  if (submitPostBtn) {
    submitPostBtn.addEventListener("click", async () => {
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

      try {
        const response = await fetch(`${API_BASE}/faculty-posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            category,
            title,
            description,
            skillsNeeded,
            discussionTime,
            contactEmail,
            status: "approved"
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to publish research opportunity");
        }

        postTitleInput.value = "";
        postDescInput.value = "";
        postSkillsInput.value = "";
        postTimeInput.value = "";
        createFormCard.style.display = "none";

        loadPosts();
      } catch (err) {
        alert(err.message || "Something went wrong posting research opportunity.");
      } finally {
        submitPostBtn.disabled = false;
        submitPostBtn.textContent = "Publish Opportunity";
      }
    });
  }

  // Save Edited Research Post
  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", async () => {
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
        const res = await fetch(`${API_BASE}/faculty-posts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, title, description, skillsNeeded, discussionTime, contactEmail })
        });

        if (!res.ok) throw new Error("Update failed");

        editResearchModal.style.display = "none";
        loadPosts();
      } catch (err) {
        alert("Could not update research posting.");
      } finally {
        saveEditBtn.disabled = false;
        saveEditBtn.textContent = "Save Changes";
      }
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
