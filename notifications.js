/**
 * CampusConnect - Smart Notifications & Alerts Module
 * Madhav Institute of Technology & Science (MITS), Gwalior
 * 
 * Supports browser push notifications via FCM, real-time Firestore synchronization,
 * unread counter updates, branch & semester filtering, and preference management.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const savedUser = localStorage.getItem("campusConnectUser");
  if (!savedUser) {
    window.location.href = "login.html";
    return;
  }

  const currentUser = JSON.parse(savedUser);
  const userId = currentUser._id || currentUser.id || "guest";
  const userBranch = currentUser.department || currentUser.branch || "ALL";
  const userSemester = currentUser.semester ? Number(currentUser.semester) : null;

  // DOM Elements
  const notifListContainer = document.getElementById("notificationsListContainer");
  const notifFilterTabs = document.getElementById("notifFilterTabs");
  const markAllReadBtn = document.getElementById("markAllReadBtn");
  const openPreferencesBtn = document.getElementById("openPreferencesBtn");
  const notifPreferencesModal = document.getElementById("notifPreferencesModal");
  const closePreferencesModalBtn = document.getElementById("closePreferencesModalBtn");
  const savePreferencesBtn = document.getElementById("savePreferencesBtn");
  const enablePushBtn = document.getElementById("enablePushBtn");
  const testPushBtn = document.getElementById("testPushBtn");
  const pushBannerDescription = document.getElementById("pushBannerDescription");
  const fcmStatusBadge = document.getElementById("fcmStatusBadge");
  const fcmStatusLabel = document.getElementById("fcmStatusLabel");
  const navNotifBadgeCounter = document.getElementById("navNotifBadgeCounter");

  // State
  let notificationsList = [];
  let currentFilter = "ALL";

  // API Base Resolution
  async function getApiBase() {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      try {
        const res = await fetch("http://localhost:5000/api-status");
        if (res.ok) return "http://localhost:5000/api";
      } catch (e) {}
    }
    return "/api";
  }

  // Toast Notification
  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `custom-toast toast-${type}`;
    toast.style.cssText = `
      background: ${type === "success" ? "#064e3b" : type === "error" ? "#7f1d1d" : "#0d1f44"};
      color: #f8fafc;
      border: 1px solid ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#38bdf8"};
      padding: 12px 18px;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Update Global Unread Counter Badge
  function updateUnreadCounterBadge() {
    const unreadCount = notificationsList.filter(n => !n.isRead).length;
    
    // Update badge on this page
    if (navNotifBadgeCounter) {
      if (unreadCount > 0) {
        navNotifBadgeCounter.textContent = unreadCount > 99 ? "99+" : unreadCount;
        navNotifBadgeCounter.style.display = "inline-flex";
      } else {
        navNotifBadgeCounter.style.display = "none";
      }
    }

    // Broadcast or update localStorage for other open tabs
    try {
      localStorage.setItem("campusConnectUnreadNotifCount", String(unreadCount));
    } catch (e) {}
  }

  // Relative Time Formatter
  function formatRelativeTime(dateInput) {
    if (!dateInput) return "Recently";
    const date = new Date(dateInput);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  // Render Notification List
  function renderNotifications() {
    if (!notifListContainer) return;

    let filtered = notificationsList.filter(item => {
      if (currentFilter === "ALL") return true;
      if (currentFilter === "unread") return !item.isRead;
      return item.category === currentFilter;
    });

    updateUnreadCounterBadge();

    if (filtered.length === 0) {
      notifListContainer.innerHTML = `
        <div style="background: var(--ams-navy-card, #0d1f44); border: 1px dashed var(--line); border-radius: 14px; text-align: center; padding: 60px 20px; color: var(--text-dim);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🎉</div>
          <h3 style="margin: 0 0 8px; color: #f8fafc; font-size: 18px;">All Caught Up!</h3>
          <p style="margin: 0; font-size: 13px;">No ${currentFilter === "unread" ? "unread" : ""} alerts for your department at this time.</p>
        </div>
      `;
      return;
    }

    notifListContainer.innerHTML = filtered.map(item => {
      const isUnread = !item.isRead;
      const priority = item.priority || "Normal";
      const priorityClass = priority.toLowerCase();
      const notifId = item._id || item.id;
      const timeStr = formatRelativeTime(item.createdAt);

      return `
        <div class="notif-item ${isUnread ? "notif-unread" : ""}" data-id="${notifId}">
          <div class="notif-icon-box">
            <span>${item.icon || "🔔"}</span>
          </div>

          <div class="notif-content">
            <div class="notif-title-row">
              <h4 class="notif-item-title">${item.title}</h4>
              <span class="notif-item-time">${timeStr}</span>
            </div>

            <p class="notif-item-desc">${item.message}</p>

            <div class="notif-meta-pills">
              <span class="priority-pill ${priorityClass}">${priority}</span>
              <span class="category-tag">${item.category || "General"}</span>
              ${item.circularNumber ? `<span class="circular-stamp">${item.circularNumber}</span>` : ""}
              ${item.actionUrl ? `
                <a href="${item.actionUrl}" class="attachment-pill" style="padding: 2px 8px; font-size: 11px; margin-left: auto;" target="${item.actionUrl.startsWith('http') ? '_blank' : '_self'}" rel="noopener">
                  <span>View Details →</span>
                </a>
              ` : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Clicking notification marks as read
    document.querySelectorAll(".notif-item").forEach(el => {
      el.addEventListener("click", async (e) => {
        // If clicking directly on action link, let link navigate
        if (e.target.closest("a")) return;

        const id = el.getAttribute("data-id");
        const found = notificationsList.find(n => (n._id || n.id) === id);
        if (found && !found.isRead) {
          found.isRead = true;
          el.classList.remove("notif-unread");
          updateUnreadCounterBadge();

          try {
            const apiBase = await getApiBase();
            await fetch(`${apiBase}/notifications/${id}/read`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId })
            });
          } catch (err) {
            console.warn("Could not sync read status with backend:", err);
          }
        }
      });
    });
  }

  // Load Notifications from Backend
  async function loadNotifications() {
    try {
      const apiBase = await getApiBase();
      const queryParams = new URLSearchParams({
        userId,
        branch: userBranch,
        ...(userSemester ? { semester: userSemester } : {})
      });

      const res = await fetch(`${apiBase}/notifications?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          notificationsList = data;
          renderNotifications();
        }
      }
    } catch (err) {
      console.warn("Notification backend fetch error:", err.message);
    }
  }

  // Real-Time Firestore Subscription
  function setupFirestoreNotifications() {
    if (window.CampusConnectFirebase && typeof window.CampusConnectFirebase.subscribeNotifications === "function") {
      window.CampusConnectFirebase.subscribeNotifications(currentUser, (firestoreNotifs) => {
        if (firestoreNotifs && firestoreNotifs.length > 0) {
          const map = new Map();
          notificationsList.forEach(n => map.set(n.title, n));
          firestoreNotifs.forEach(n => {
            const existing = map.get(n.title);
            map.set(n.title, { ...existing, ...n, isRead: existing ? existing.isRead : false });
          });
          notificationsList = Array.from(map.values());
          renderNotifications();
        }
      });
    }
  }

  // Check & Update Push Notification Status
  function updatePushNotificationStatus() {
    if (!("Notification" in window)) {
      if (enablePushBtn) {
        enablePushBtn.disabled = true;
        enablePushBtn.textContent = "Push Not Supported";
      }
      if (fcmStatusLabel) fcmStatusLabel.textContent = "Push: Unsupported";
      return;
    }

    if (Notification.permission === "granted") {
      if (enablePushBtn) {
        enablePushBtn.innerHTML = "✓ Push Active";
        enablePushBtn.style.background = "#064e3b";
        enablePushBtn.style.borderColor = "#10b981";
      }
      if (testPushBtn) testPushBtn.style.display = "inline-flex";
      if (fcmStatusLabel) fcmStatusLabel.textContent = "FCM: Active";
      if (pushBannerDescription) pushBannerDescription.textContent = "Push notifications are active for your profile (Department: " + userBranch + ").";
    } else if (Notification.permission === "denied") {
      if (enablePushBtn) {
        enablePushBtn.textContent = "Push Blocked in Browser";
        enablePushBtn.disabled = true;
      }
      if (fcmStatusLabel) fcmStatusLabel.textContent = "FCM: Blocked";
    } else {
      if (enablePushBtn) {
        enablePushBtn.textContent = "🔔 Enable Push Notifications";
      }
      if (fcmStatusLabel) fcmStatusLabel.textContent = "FCM: Ready";
    }
  }

  // Push Permission Handler
  if (enablePushBtn) {
    enablePushBtn.addEventListener("click", async () => {
      if (window.CampusConnectFirebase && typeof window.CampusConnectFirebase.requestPushPermission === "function") {
        enablePushBtn.disabled = true;
        enablePushBtn.textContent = "Requesting Permission...";

        const result = await window.CampusConnectFirebase.requestPushPermission(currentUser);
        enablePushBtn.disabled = false;

        if (result.success) {
          showToast("Push notifications successfully enabled!", "success");
          updatePushNotificationStatus();
        } else {
          showToast(result.error || "Permission was not granted.", "error");
          updatePushNotificationStatus();
        }
      } else {
        const perm = await Notification.requestPermission();
        updatePushNotificationStatus();
        if (perm === "granted") {
          showToast("Push notifications allowed!", "success");
        }
      }
    });
  }

  // Test Push Notification Button
  if (testPushBtn) {
    testPushBtn.addEventListener("click", () => {
      if (Notification.permission === "granted") {
        try {
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification("MITS Autonomous Exam Alert", {
                body: "Examination form submission deadline is 15 November 2026. Deposit Rs. 0 fee before late penalty.",
                icon: "assets/images/mits-campus.jpg",
                badge: "assets/images/mits-campus.jpg",
                data: { url: "/events.html" }
              });
            });
          } else {
            new Notification("MITS Autonomous Exam Alert", {
              body: "Examination form submission deadline is 15 November 2026. Deposit Rs. 0 fee before late penalty.",
              icon: "assets/images/mits-campus.jpg"
            });
          }
          showToast("Test notification dispatched!", "success");
        } catch (e) {
          showToast("Notice triggered: " + e.message, "info");
        }
      }
    });
  }

  // Filter Tabs Event
  if (notifFilterTabs) {
    notifFilterTabs.addEventListener("click", (e) => {
      const tab = e.target.closest(".notif-tab");
      if (!tab) return;
      notifFilterTabs.querySelectorAll(".notif-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.getAttribute("data-category") || "ALL";
      renderNotifications();
    });
  }

  // Mark All As Read
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", async () => {
      notificationsList.forEach(n => n.isRead = true);
      renderNotifications();
      showToast("All notifications marked as read.", "success");

      try {
        const apiBase = await getApiBase();
        await fetch(`${apiBase}/notifications/mark-all-read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        });
      } catch (err) {
        console.warn("Mark all read sync error:", err);
      }
    });
  }

  // Preferences Modal Controls
  if (openPreferencesBtn) {
    openPreferencesBtn.addEventListener("click", () => {
      if (notifPreferencesModal) {
        // Load stored preferences
        try {
          const stored = JSON.parse(localStorage.getItem("campusConnectNotifPreferences") || "{}");
          if (stored.pushEnabled !== undefined) document.getElementById("prefPushEnabled").checked = stored.pushEnabled;
          if (stored.examAlerts !== undefined) document.getElementById("prefExamAlerts").checked = stored.examAlerts;
          if (stored.deadlineAlerts !== undefined) document.getElementById("prefDeadlineAlerts").checked = stored.deadlineAlerts;
          if (stored.placementAlerts !== undefined) document.getElementById("prefPlacementAlerts").checked = stored.placementAlerts;
          if (stored.soundAlerts !== undefined) document.getElementById("prefSoundAlerts").checked = stored.soundAlerts;
        } catch (e) {}
        notifPreferencesModal.classList.add("open");
      }
    });
  }

  function closePreferencesModal() {
    if (notifPreferencesModal) notifPreferencesModal.classList.remove("open");
  }

  if (closePreferencesModalBtn) closePreferencesModalBtn.addEventListener("click", closePreferencesModal);
  if (notifPreferencesModal) {
    notifPreferencesModal.addEventListener("click", (e) => {
      if (e.target === notifPreferencesModal) closePreferencesModal();
    });
  }

  if (savePreferencesBtn) {
    savePreferencesBtn.addEventListener("click", () => {
      const prefs = {
        pushEnabled: document.getElementById("prefPushEnabled").checked,
        examAlerts: document.getElementById("prefExamAlerts").checked,
        deadlineAlerts: document.getElementById("prefDeadlineAlerts").checked,
        placementAlerts: document.getElementById("prefPlacementAlerts").checked,
        soundAlerts: document.getElementById("prefSoundAlerts").checked
      };

      localStorage.setItem("campusConnectNotifPreferences", JSON.stringify(prefs));
      showToast("Notification preferences updated!", "success");
      closePreferencesModal();
    });
  }

  // Initial Load
  updatePushNotificationStatus();
  await loadNotifications();
  setupFirestoreNotifications();
});
