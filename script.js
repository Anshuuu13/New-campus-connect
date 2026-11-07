// Read whoever signed in on login.html. If nobody has signed in yet,
// send them to the login page instead of showing a blank dashboard.
const savedUser = localStorage.getItem("campusConnectUser");

if (!savedUser) {
  window.location.href = "login.html";
}

const currentUser = JSON.parse(savedUser || "{}");

// If student hasn't finished onboarding, send to profile setup
if (currentUser && !currentUser.profileCompleted) {
  window.location.href = "onboarding.html";
}

if (document.querySelector(".name-greeting") && currentUser.name) {
  document.querySelector(".name-greeting").textContent = `Welcome back, ${currentUser.name} 👋`;
}

// Dynamic API resolution (Supports port 5000, 5500 Live Server, file://, and tunnels)
async function getApiBase() {
  if (window.location.port === "5000" || window.location.hostname.includes("loca.lt")) {
    return "/api";
  }
  try {
    const probe = await fetch("http://localhost:5000/api-status", { method: "GET", signal: AbortSignal.timeout(800) });
    if (probe.ok) return "http://localhost:5000/api";
  } catch (e) {}
  try {
    const probe = await fetch("https://chubby-rockets-grin.loca.lt/api-status", {
      headers: { "Bypass-Tunnel-Reminder": "true" },
      signal: AbortSignal.timeout(1000)
    });
    if (probe.ok) return "https://chubby-rockets-grin.loca.lt/api";
  } catch (e) {}
  return window.location.protocol.startsWith("http") ? "/api" : "http://localhost:5000/api";
}

const sidebarItems = [
  { icon: "home", label: "Home", link: "index.html" },
  { icon: "star", label: "Skills & Achievements", link: "skills.html" },
  { icon: "users", label: "Team Finder", link: "team.html" },
  { icon: "swap", label: "Skill Exchange", link: "skillswap.html" },
  { icon: "flask", label: "Research & Internships", link: "research.html" },
  { icon: "bell", label: "Announcements", link: "announcements.html" },
  { icon: "flag", label: "Campus Complaints", link: "complaints.html" },
  { icon: "calendar", label: "Events", link: "events.html" },
  { icon: "folder", label: "Resources", link: "resources.html" },
  { icon: "userCheck", label: "Profile", link: "profile.html" },
  { icon: "settings", label: "Settings", link: "settings.html" },
];

// Line-icon set
const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  flask: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V2"/><line x1="9" y1="2" x2="15" y2="2"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  swap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  userCheck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`,
  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="3"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
};

const nav = document.getElementById("sidebarNav");
if (nav) {
  nav.innerHTML = "";
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  sidebarItems.forEach((item) => {
    const link = document.createElement("a");
    link.className = "sidebar-link";
    link.href = item.link || "#";
    link.innerHTML = `
      <span class="icon">${ICONS[item.icon] || ""}</span>
      <span>${item.label}</span>
    `;

    if (item.link) {
      if (
        currentPath === item.link ||
        (currentPath === "" && item.link === "index.html") ||
        (currentPath === "index.html" && item.link === "index.html")
      ) {
        link.classList.add("active");
      }
    }

    nav.appendChild(link);
  });
}

// Mobile sidebar toggle
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebarEl = document.getElementById("sidebar") || document.querySelector(".sidebar");
if (mobileMenuBtn && sidebarEl) {
  mobileMenuBtn.addEventListener("click", () => {
    sidebarEl.classList.toggle("open");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("campusConnectUser") || "{}");
  if (!user || (!user._id && !user.id)) return;

  const userId = user.id || user._id;

  // Immediately render cached profile info to prevent UI flickering
  const navUserName = document.getElementById("navUserName");
  const navProfilePic = document.getElementById("navProfilePic");
  const profileMenuLink = document.getElementById("profileMenuLink");

  if (navUserName) navUserName.textContent = user.name || "Student";
  if (profileMenuLink) profileMenuLink.href = `profile.html?userId=${userId}`;

  if (navProfilePic) {
    if (user.profilePicture) {
      navProfilePic.src = user.profilePicture;
    } else {
      navProfilePic.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name || "User");
    }
  }

  // Refresh latest user record from backend
  try {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/users/${userId}`);
    if (res.ok) {
      const liveUser = await res.json();
      if (navProfilePic && liveUser.profilePicture) {
        navProfilePic.src = liveUser.profilePicture;
      }
    }
  } catch (err) {
    console.warn("Could not refresh live nav profile picture:", err);
  }

  // Update Global Notification Bell Badge Counter
  async function updateGlobalNotifBellBadge() {
    const bellLinks = document.querySelectorAll('a[href*="notifications"]');
    if (bellLinks.length === 0) return;

    try {
      const apiBase = await getApiBase();
      const branch = user.department || user.branch || "ALL";
      const sem = user.semester ? `&semester=${user.semester}` : "";
      const res = await fetch(`${apiBase}/notifications?userId=${userId}&branch=${branch}${sem}&unreadOnly=true`);
      if (res.ok) {
        const unreadItems = await res.json();
        const count = Array.isArray(unreadItems) ? unreadItems.length : 0;

        bellLinks.forEach(bell => {
          let counter = bell.querySelector(".notif-badge-counter");
          let dot = bell.querySelector(".notif-dot");
          if (dot) dot.remove();

          if (count > 0) {
            if (!counter) {
              counter = document.createElement("span");
              counter.className = "notif-badge-counter";
              bell.appendChild(counter);
            }
            counter.textContent = count > 99 ? "99+" : String(count);
            counter.style.display = "inline-flex";
          } else if (counter) {
            counter.style.display = "none";
          }
        });
      }
    } catch (err) {
      // Non-blocking
    }
  }

  updateGlobalNotifBellBadge();

  // Load Live Dashboard Statistics & Feeds from Database
  async function loadLiveDashboardData() {
    const statActiveRequests = document.getElementById("statActiveRequests");
    if (!statActiveRequests) return; // Not on dashboard page

    const statResearchOpps = document.getElementById("statResearchOpps");
    const statUnreadAnnouncements = document.getElementById("statUnreadAnnouncements");
    const statUpcomingEvents = document.getElementById("statUpcomingEvents");
    const statActiveComplaints = document.getElementById("statActiveComplaints");

    const upcomingEventsContainer = document.getElementById("dashboardUpcomingEvents");
    const latestAnnouncementsContainer = document.getElementById("dashboardLatestAnnouncements");

    try {
      const apiBase = await getApiBase();
      const res = await fetch(`${apiBase}/dashboard/summary?userId=${userId}&branch=${user.department || user.branch || "ALL"}`);
      if (res.ok) {
        const data = await res.json();

        // 1. Live Stats Counters
        if (statActiveRequests) statActiveRequests.textContent = data.activeRequests || "12";
        if (statResearchOpps) statResearchOpps.textContent = data.researchOpportunities || "5";
        if (statUnreadAnnouncements) statUnreadAnnouncements.textContent = data.unreadAnnouncements || "5";
        if (statUpcomingEvents) statUpcomingEvents.textContent = (Array.isArray(data.upcomingEvents) ? data.upcomingEvents.length : "3");
        if (statActiveComplaints) statActiveComplaints.textContent = data.activeComplaints !== undefined ? data.activeComplaints : "2";

        // 2. Upcoming Academic Calendar Events
        if (upcomingEventsContainer && Array.isArray(data.upcomingEvents) && data.upcomingEvents.length > 0) {
          upcomingEventsContainer.innerHTML = data.upcomingEvents.slice(0, 4).map(evt => {
            const dateObj = evt.startDate ? new Date(evt.startDate) : new Date();
            const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
            const dayStr = dateObj.getDate();
            const timeStr = evt.startTime || "";
            const venueStr = evt.venue || "MITS Campus";
            const categoryEmoji = evt.category === "Examination" ? "📝" : (evt.category === "Holiday" ? "🎉" : "🎓");

            return `
              <div class="event-entry">
                <div class="event-date-box">
                  <span class="event-month">${monthStr}</span>
                  <span class="event-day">${dayStr}</span>
                </div>
                <div class="event-details">
                  <div class="event-category-badge">${categoryEmoji} ${evt.category || "Academic Milestone"}</div>
                  <h4 class="event-name">${evt.title}</h4>
                  <div class="event-sub-info">${timeStr ? `${timeStr} • ` : ""}${venueStr}</div>
                </div>
              </div>
            `;
          }).join("");
        }

        // 3. Latest Verified Announcements
        if (latestAnnouncementsContainer && Array.isArray(data.latestAnnouncements) && data.latestAnnouncements.length > 0) {
          latestAnnouncementsContainer.innerHTML = data.latestAnnouncements.slice(0, 4).map(ann => {
            const dateStr = ann.createdAt ? new Date(ann.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recent";
            const circ = ann.circularNumber || "MITS/Autonomous/2026";
            const category = ann.category || "Official Circular";
            const author = ann.author || "MITS Administrative Office";

            return `
              <div class="notice-item">
                <div class="notice-meta-tag">
                  <span class="pill-category">${category}</span>
                  <span class="pill-circ">${circ}</span>
                </div>
                <h4 class="notice-title">${ann.title}</h4>
                <div class="notice-footer">${author} • ${dateStr}</div>
              </div>
            `;
          }).join("");
        }
      }
    } catch (err) {
      console.warn("Could not load dynamic dashboard summary:", err.message);
    }
  }
  }

  loadLiveDashboardData();

  // Register FCM Service Worker if supported
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/firebase-messaging-sw.js")
      .then(reg => {
        // SW active
      })
      .catch(err => {
        // SW note
      });
  }
});

// Profile dropdown toggle
const profileTrigger = document.getElementById("profileTrigger");
const profileDropdown = document.getElementById("profileDropdown");

if (profileTrigger && profileDropdown) {
  profileTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    const menu = document.getElementById("profileMenu");
    if (menu && !menu.contains(e.target)) {
      profileDropdown.classList.remove("open");
    }
  });
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("campusConnectUser");
    window.location.href = "login.html";
  });
}
