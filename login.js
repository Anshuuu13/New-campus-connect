// CampusConnect — MITS Gwalior Google Authentication
// ===================================================

const GOOGLE_CLIENT_ID = window.CAMPUS_CONNECT_GOOGLE_CLIENT_ID || "1045933126405-v406lvthncnld96fpcm1l38pndlr5adi.apps.googleusercontent.com";

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
    department: isFaculty ? "Academic Faculty" : "",
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

    const bodyPayload = credential ? { credential } : { accessToken };

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
    }, 400);
  } else {
    showStatus(`Welcome back, ${userSession.name}! Loading campus portal...`, "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 400);
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

// Initialize Google Identity Services (GIS)
async function initGoogleAuth() {
  const container = document.getElementById("googleBtnContainer");
  const fallbackBtn = document.getElementById("continueWithGoogleBtn");

  // Attempt to fetch dynamically configured Client ID from backend
  let activeClientId = GOOGLE_CLIENT_ID;
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

  // Setup click handler for visible "Continue with Google" button
  if (fallbackBtn) {
    fallbackBtn.addEventListener("click", () => {
      if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: "select_account" });
      } else if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
        google.accounts.id.prompt();
      } else {
        showStatus("Connecting to Google Sign-In...", "loading");
        setTimeout(() => {
          if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: "select_account" });
          } else if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
            google.accounts.id.prompt();
          } else {
            showStatus("Google services could not be reached. Please check your network or adblocker.", "error");
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
          if (err && err.type === "origin_mismatch") {
            showStatus(
              "Google OAuth origin mismatch: Please authorize current origin in Google Cloud Console Credentials.",
              "info"
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

        google.accounts.id.renderButton(renderTarget, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 320
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
