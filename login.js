// CampusConnect — MITS Gwalior Google Authentication
// ===================================================

const OFFICIAL_MITS_GOOGLE_CLIENT_ID = "1045933126405-v406lvthncnld96fpcm1l38pndlr5adi.apps.googleusercontent.com";
let activeClientId = window.CAMPUS_CONNECT_GOOGLE_CLIENT_ID || OFFICIAL_MITS_GOOGLE_CLIENT_ID;

let tokenClient = null;

// Resolve API base URL: tests localhost:5000 first, falls back to deployed Render API
async function getApiBase() {
  if (window.location.port === "5000" || window.location.hostname.includes("onrender.com")) {
    return "/api";
  }
  try {
    const probe = await fetch("http://localhost:5000/health", { method: "GET", signal: AbortSignal.timeout(800) });
    if (probe.ok) return "http://localhost:5000/api";
  } catch (e) {}

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

// Helpers: Allow ALL accounts ending in @mitsgwl.ac.in (students) and @mitsgwalior.in (professors)
function isStudentEmail(email) {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return e.endsWith("@mitsgwl.ac.in") || /@([a-zA-Z0-9-]+\.)*mitsgwl\.ac\.in$/.test(e);
}

function isFacultyEmail(email) {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return e.endsWith("@mitsgwalior.in") || /@([a-zA-Z0-9-]+\.)*mitsgwalior\.in$/.test(e);
}

// Process authenticated Google profile and enforce institutional domain restrictions
async function processGoogleUser(profile, credential = null, accessToken = null) {
  const email = (profile.email || "").toLowerCase().trim();
  const name = profile.name || profile.given_name || "MITS Member";
  const picture = profile.picture || "";
  const googleId = profile.sub || profile.id || `google_${Date.now()}`;

  // ==============================================================
  // MITS Institutional Domain Check: Allow ALL @mitsgwl.ac.in and @mitsgwalior.in
  // ==============================================================
  const isStudent = isStudentEmail(email);
  const isFaculty = isFacultyEmail(email);

  if (!isStudent && !isFaculty) {
    localStorage.removeItem("campusConnectUser");
    showStatus("Access restricted. Please sign in using your official institutional Google account ending in @mitsgwl.ac.in (students) or @mitsgwalior.in (faculty).", "error");
    return;
  }

  showStatus("Verifying MITS institutional account...", "loading");

  let userSession = {
    _id: googleId,
    id: googleId,
    name: name,
    email: email,
    contactEmail: email,
    department: isFaculty ? "Academic Faculty" : "Engineering",
    role: isFaculty ? "Professor" : "Student",
    profilePicture: picture,
    profileCompleted: false,
    authProvider: "google"
  };

  // Sync with backend API
  try {
    const apiBase = await getApiBase();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const bodyPayload = {
      credential,
      accessToken,
      email,
      name,
      picture,
      googleId
    };

    const res = await fetch(`${apiBase}/users/google-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
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
    console.warn("Backend sync notice:", syncErr.message);
  }

  // Check if profile was previously marked completed in local storage
  const existingLocal = JSON.parse(localStorage.getItem("campusConnectUser") || "{}");
  if (existingLocal.email === email && existingLocal.profileCompleted) {
    userSession.profileCompleted = true;
    userSession.department = userSession.department || existingLocal.department;
    userSession.role = userSession.role || existingLocal.role;
    userSession.branch = userSession.branch || existingLocal.branch;
    userSession.year = userSession.year || existingLocal.year;
    userSession.interests = userSession.interests || existingLocal.interests;
  }

  // Save session to localStorage
  localStorage.setItem("campusConnectUser", JSON.stringify(userSession));

  // Redirect based on onboarding status
  if (!userSession.profileCompleted) {
    showStatus(`Welcome, ${userSession.name}! Redirecting to profile setup...`, "success");
    setTimeout(() => {
      window.location.href = "onboarding.html";
    }, 350);
  } else {
    showStatus(`Welcome back, ${userSession.name}! Loading campus portal...`, "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 350);
  }
}

// Global callback for GIS Credential Response (ID Token)
async function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) {
    showStatus("Google authentication failed: no credential received.", "error");
    return;
  }

  const payload = parseJwt(response.credential);
  if (!payload) {
    showStatus("Could not decode Google account profile. Please try again.", "error");
    return;
  }

  await processGoogleUser(payload, response.credential, null);
}

// Global assignment so GIS HTML declarative attributes can invoke it
window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;

// Handle OAuth2 Token Response (Access Token popup flow)
async function handleGoogleAccessToken(accessToken) {
  showStatus("Fetching Google account profile...", "loading");
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error("Failed to fetch userinfo");
    const profile = await res.json();
    await processGoogleUser(profile, null, accessToken);
  } catch (err) {
    console.error("Token userinfo error:", err);
    showStatus("Could not verify Google account. Please try again.", "error");
  }
}

// Direct MITS College Email Verification Login
async function loginWithMitsEmail(rawEmail) {
  const email = (rawEmail || "").toLowerCase().trim();
  const isStudent = isStudentEmail(email);
  const isFaculty = isFacultyEmail(email);

  if (!isStudent && !isFaculty) {
    showStatus("Access restricted. Please enter a valid official institutional email ending in @mitsgwl.ac.in (students) or @mitsgwalior.in (faculty).", "error");
    return;
  }

  showStatus("Verifying MITS institutional account...", "loading");

  try {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/users/college-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showStatus(err.error || "Authentication failed. Please try again.", "error");
      return;
    }

    const userData = await res.json();
    localStorage.setItem("campusConnectUser", JSON.stringify(userData));

    if (!userData.profileCompleted) {
      showStatus(`Welcome, ${userData.name}! Redirecting to profile setup...`, "success");
      setTimeout(() => { window.location.href = "onboarding.html"; }, 350);
    } else {
      showStatus(`Welcome back, ${userData.name}! Loading campus portal...`, "success");
      setTimeout(() => { window.location.href = "index.html"; }, 350);
    }
  } catch (err) {
    console.error("Institutional login error:", err);
    showStatus("Unable to reach authentication server. Please check your network connection.", "error");
  }
}

// Helper to reveal direct MITS email login form
function revealDirectEmailForm(message = "") {
  const directEmailForm = document.getElementById("directEmailForm");
  if (directEmailForm) {
    directEmailForm.style.display = "block";
    const input = document.getElementById("mitsEmailInput");
    if (input) input.focus();
  }
  if (message) {
    showStatus(message, "info");
  }
}

// Initialize Google Identity Services (GIS)
async function initGoogleAuth() {
  const container = document.getElementById("googleBtnContainer");
  const fallbackBtn = document.getElementById("continueWithGoogleBtn");
  const toggleBtn = document.getElementById("toggleEmailLoginBtn");
  const submitEmailBtn = document.getElementById("submitMitsEmailBtn");
  const mitsEmailInput = document.getElementById("mitsEmailInput");

  // Bind direct email toggle button
  if (toggleBtn && !toggleBtn.dataset.bound) {
    toggleBtn.dataset.bound = "true";
    toggleBtn.addEventListener("click", () => {
      const form = document.getElementById("directEmailForm");
      if (form) {
        const isHidden = form.style.display === "none" || !form.style.display;
        form.style.display = isHidden ? "block" : "none";
        if (isHidden && mitsEmailInput) mitsEmailInput.focus();
      }
    });
  }

  // Bind direct email submit button
  if (submitEmailBtn && !submitEmailBtn.dataset.bound) {
    submitEmailBtn.dataset.bound = "true";
    submitEmailBtn.addEventListener("click", () => {
      if (mitsEmailInput) loginWithMitsEmail(mitsEmailInput.value);
    });
  }

  // Allow pressing Enter on email input
  if (mitsEmailInput && !mitsEmailInput.dataset.bound) {
    mitsEmailInput.dataset.bound = "true";
    mitsEmailInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        loginWithMitsEmail(mitsEmailInput.value);
      }
    });
  }

  // Attempt to fetch dynamically configured Client ID from backend
  try {
    const apiBase = await getApiBase();
    const idRes = await fetch(`${apiBase}/users/google-client-id`);
    if (idRes.ok) {
      const idData = await idRes.json();
      if (idData.clientId) {
        activeClientId = idData.clientId;
      }
    }
  } catch (e) {
    // Keep default activeClientId
  }

  // Setup click handler for visible "Continue with Google" button once
  if (fallbackBtn && !fallbackBtn.dataset.bound) {
    fallbackBtn.dataset.bound = "true";
    fallbackBtn.addEventListener("click", () => {
      if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: "select_account" });
      } else if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
        google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn("GIS prompt skipped or not displayed:", notification.getNotDisplayedReason());
            if (tokenClient) {
              tokenClient.requestAccessToken({ prompt: "select_account" });
            } else {
              showStatus("Please click 'Continue with Google' to sign in with your official MITS account.", "info");
            }
          }
        });
      } else {
        showStatus("Connecting to Google Sign-In...", "loading");
        setTimeout(() => {
          if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: "select_account" });
          } else {
            showStatus("Google Sign-In is initializing. Please click 'Continue with Google'.", "info");
          }
        }, 1200);
      }
    });
  }

  // Wait for Google GIS library to be available
  if (typeof google === "undefined" || !google.accounts) {
    setTimeout(initGoogleAuth, 250);
    return;
  }

  try {
    // 1. Initialize Google ID Token Client
    if (google.accounts.id) {
      google.accounts.id.initialize({
        client_id: activeClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
        error_callback: (err) => {
          console.warn("GIS Notification:", err);
          if (err && (err.type === "origin_mismatch" || err.type === "idpiframe_initialization_failed")) {
            revealDirectEmailForm(
              "Sign in below using your official MITS College ID (@mitsgwl.ac.in or @mitsgwalior.in):"
            );
          }
        }
      });

      // Render Google's official branded button inside container
      if (container) {
        let renderTarget = document.getElementById("g_rendered_btn");
        if (!renderTarget) {
          renderTarget = document.createElement("div");
          renderTarget.id = "g_rendered_btn";
          renderTarget.style.display = "flex";
          renderTarget.style.justifyContent = "center";
          renderTarget.style.width = "100%";
          container.appendChild(renderTarget);
        }

        const targetWidth = Math.min(320, Math.max(220, (container.clientWidth || window.innerWidth - 64)));
        google.accounts.id.renderButton(renderTarget, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: targetWidth
        });

        // Hide fallback button only when Google's iframe has successfully loaded
        setTimeout(() => {
          if (renderTarget && renderTarget.querySelector("iframe")) {
            if (fallbackBtn) fallbackBtn.style.display = "none";
          }
        }, 350);
      }
    }

    // 2. Initialize OAuth2 Token Client as popup fallback
    if (google.accounts.oauth2) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: "email profile openid",
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            await handleGoogleAccessToken(tokenResponse.access_token);
          } else if (tokenResponse && tokenResponse.error) {
            console.warn("OAuth2 token response error:", tokenResponse);
            if (tokenResponse.error === "origin_mismatch" || tokenResponse.error === "redirect_uri_mismatch") {
              revealDirectEmailForm("Sign in with your official MITS institutional account below:");
            }
          }
        }
      });
    }
  } catch (err) {
    console.error("GIS render error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initGoogleAuth();
});
