// CampusConnect — MITS Gwalior Google Authentication
// ===================================================

const GOOGLE_CLIENT_ID = window.CAMPUS_CONNECT_GOOGLE_CLIENT_ID || "1045933126405-v406lvthncnld96fpcm1l38pndlr5adi.apps.googleusercontent.com";

// Resolve API base URL: tests localhost:5000 first, falls back to deployed Render API
async function getApiBase() {
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return "/api";
  }
  return "https://campus-connect-1q2c.onrender.com/api";
}

// Show feedback message in auth card
function showStatus(message, type = "info") {
  const msgEl = document.getElementById("authStatusMsg");
  if (!msgEl) return;
  msgEl.textContent = message;
  msgEl.className = `auth-status-msg auth-status-${type}`;
  msgEl.style.display = "block";
}

// Safely decode Google ID Token (JWT) on the client side
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("JWT Decode Error:", err);
    return null;
  }
}

// Handle Google ID Token response from GIS SDK
async function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) {
    showStatus("Google authentication failed: no credential received.", "error");
    return;
  }

  showStatus("Verifying college credentials...", "loading");

  // 1. Decode Google ID Token immediately on the client
  const payload = parseJwt(response.credential);
  if (!payload) {
    showStatus("Could not decode Google account profile. Please try again.", "error");
    return;
  }

  const googleId = payload.sub || payload.id || `google_${Date.now()}`;
  const email = (payload.email || "").toLowerCase().trim();
  const name = payload.name || payload.given_name || "MITS Member";
  const picture = payload.picture || "";

  // ==============================================================
  // MITS College Email Restriction (@mitsgwl.ac.in for students, @mitsgwalior.in for faculty/staff)
  // ==============================================================
  const isAllowedEmail = email.endsWith("@mitsgwl.ac.in") || email.endsWith("@mitsgwalior.in");
  if (!isAllowedEmail) {
    // Remove any previously stored session
    localStorage.removeItem("campusConnectUser");
    showStatus("Access restricted. Please sign in using your official college email ID (@mitsgwl.ac.in or @mitsgwalior.in).", "error");
    return;
  }

  // Prepared student session object for valid @mitsgwalior.in user
  let userSession = {
    _id: googleId,
    id: googleId,
    name: name,
    email: email,
    contactEmail: email,
    department: "",
    role: "Student",
    profilePicture: picture,
    profileCompleted: false,
    authProvider: "google"
  };

  // 2. Attempt to synchronize with backend (local or cloud)
  try {
    const apiBase = await getApiBase();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${apiBase}/users/google-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && (data._id || data.id)) {
        userSession = {
          ...userSession,
          ...data,
          _id: data._id || data.id || userSession._id,
          id: data._id || data.id || userSession.id,
          profileCompleted: Boolean(data.profileCompleted)
        };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        showStatus(errData.error, "error");
        return;
      }
    }
  } catch (syncErr) {
    console.log("Backend offline or sync skipped. Running in client-first mode.");
  }

  // Check if profile was previously marked completed in local storage for this same email
  const existingLocal = JSON.parse(localStorage.getItem("campusConnectUser") || "{}");
  if (existingLocal.email === email && existingLocal.profileCompleted) {
    userSession.profileCompleted = true;
    userSession.department = userSession.department || existingLocal.department;
    userSession.role = userSession.role || existingLocal.role;
    userSession.branch = userSession.branch || existingLocal.branch;
    userSession.year = userSession.year || existingLocal.year;
    userSession.interests = userSession.interests || existingLocal.interests;
  }

  // Save student session in localStorage
  localStorage.setItem("campusConnectUser", JSON.stringify(userSession));

  // ==============================================================
  // REQUIREMENT 3: Profile Onboarding vs Returning User Redirect
  // ==============================================================
  if (!userSession.profileCompleted) {
    showStatus(`Welcome, ${userSession.name}! Let's complete your profile...`, "success");
    setTimeout(() => {
      window.location.href = "onboarding.html";
    }, 500);
  } else {
    showStatus(`Welcome back, ${userSession.name}! Loading campus feed...`, "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 400);
  }
}

// Initialize Google Identity Services (GIS)
function initGoogleAuth() {
  const container = document.getElementById("googleBtnContainer");
  if (!container) return;

  // Check if Google GIS script has loaded
  if (typeof google === "undefined" || !google.accounts || !google.accounts.id) {
    setTimeout(initGoogleAuth, 200);
    return;
  }

  try {
    container.innerHTML = "";

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });

    google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: Math.min(328, container.clientWidth || 328)
    });
  } catch (err) {
    console.error("GIS render error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initGoogleAuth();
});
