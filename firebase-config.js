/**
 * CampusConnect - Firebase Firestore & FCM Configuration
 * Madhav Institute of Technology & Science (MITS), Gwalior
 * 
 * Provides real-time synchronization for announcements, smart notifications,
 * browser push notifications via Firebase Cloud Messaging (FCM), and service worker management.
 */

(function (window) {
  // Default MITS CampusConnect Firebase Configuration
  // Students and admins can also override this in Settings / LocalStorage
  const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyB_MITS_Gwalior_CampusConnect_2026",
    authDomain: "campusconnect-mits.firebaseapp.com",
    projectId: "campusconnect-mits",
    storageBucket: "campusconnect-mits.appspot.com",
    messagingSenderId: "987654321012",
    appId: "1:987654321012:web:mitsgwlcampusconnect2026",
    measurementId: "G-MITSGWL2026",
    vapidKey: "BEl_MITS_Gwalior_VAPID_Key_For_CampusConnect_FCM_Push_Notifications_2026"
  };

  function getStoredFirebaseConfig() {
    try {
      const stored = localStorage.getItem("campusConnectFirebaseConfig");
      if (stored) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn("Could not parse stored Firebase config:", e);
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  function saveFirebaseConfig(customConfig) {
    try {
      localStorage.setItem("campusConnectFirebaseConfig", JSON.stringify(customConfig));
      return true;
    } catch (e) {
      console.error("Could not save Firebase config:", e);
      return false;
    }
  }

  let firebaseApp = null;
  let firestoreDb = null;
  let firebaseMessaging = null;
  let isInitializing = false;
  let initCallbacks = [];

  // Helper to dynamically load Firebase compat SDK scripts if not already on page
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true") return resolve();
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", reject);
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => {
        s.dataset.loaded = "true";
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function ensureFirebaseScripts() {
    if (window.firebase && window.firebase.firestore) return;
    try {
      await loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
    } catch (err) {
      console.warn("Could not load external Firebase CDN scripts (offline or network restriction). Running in simulated Firestore mode.", err);
    }
  }

  async function initFirebase() {
    if (firebaseApp && firestoreDb) return { app: firebaseApp, db: firestoreDb, messaging: firebaseMessaging };
    if (isInitializing) {
      return new Promise(resolve => initCallbacks.push(resolve));
    }

    isInitializing = true;
    await ensureFirebaseScripts();

    const config = getStoredFirebaseConfig();

    if (window.firebase) {
      try {
        if (!window.firebase.apps || window.firebase.apps.length === 0) {
          firebaseApp = window.firebase.initializeApp(config);
        } else {
          firebaseApp = window.firebase.app();
        }

        firestoreDb = window.firebase.firestore();

        // Enable offline persistence if available
        try {
          firestoreDb.enablePersistence({ synchronizeTabs: true }).catch(() => {});
        } catch (e) {}

        if (window.firebase.messaging && window.firebase.messaging.isSupported()) {
          try {
            firebaseMessaging = window.firebase.messaging();
          } catch (mErr) {
            console.warn("FCM messaging not supported or service worker pending:", mErr.message);
          }
        }
        console.log("[FIREBASE] MITS CampusConnect Firebase initialized successfully.");
      } catch (fbErr) {
        console.warn("[FIREBASE] Firebase initialization note:", fbErr.message);
      }
    }

    const result = { app: firebaseApp, db: firestoreDb, messaging: firebaseMessaging };
    isInitializing = false;
    initCallbacks.forEach(cb => cb(result));
    initCallbacks = [];
    return result;
  }

  // ================= SERVICE WORKER & FCM PUSH NOTIFICATIONS =================
  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Workers not supported in this browser.");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/"
      });
      console.log("[SW] Firebase Messaging Service Worker registered with scope:", registration.scope);
      return registration;
    } catch (err) {
      console.warn("[SW] Service Worker registration note:", err.message);
      return null;
    }
  }

  async function requestPushNotificationPermission() {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop push notifications.");
      return { granted: false, token: null };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[NOTIFICATION] Permission not granted:", permission);
      return { granted: false, token: null };
    }

    console.log("[NOTIFICATION] Notification permission granted!");
    const swReg = await registerServiceWorker();

    let token = null;
    try {
      const { messaging } = await initFirebase();
      if (messaging && swReg) {
        const config = getStoredFirebaseConfig();
        token = await messaging.getToken({
          serviceWorkerRegistration: swReg,
          vapidKey: config.vapidKey
        });
        if (token) {
          console.log("[FCM] Device Push Token generated:", token.slice(0, 20) + "...");
          localStorage.setItem("mits_fcm_token", token);
        }
      }
    } catch (e) {
      console.warn("[FCM] FCM Token retrieval note:", e.message);
    }

    if (!token) {
      token = localStorage.getItem("mits_fcm_token") || `simulated-fcm-token-${Date.now()}`;
      localStorage.setItem("mits_fcm_token", token);
    }

    return { granted: true, token };
  }

  // ================= REAL-TIME ANNOUNCEMENTS FIRESTORE SYNC =================
  function subscribeToRealtimeAnnouncements(onUpdate, onError) {
    let unsubscribe = () => {};

    initFirebase().then(({ db }) => {
      if (db) {
        try {
          unsubscribe = db.collection("announcements")
            .orderBy("createdAt", "desc")
            .onSnapshot(snapshot => {
              const items = [];
              snapshot.forEach(doc => {
                items.push({ _id: doc.id, id: doc.id, ...doc.data() });
              });
              onUpdate(items);
            }, err => {
              console.warn("Firestore announcements sync error, falling back to REST/local:", err);
              if (onError) onError(err);
            });
        } catch (e) {
          if (onError) onError(e);
        }
      } else {
        if (onError) onError(new Error("Firestore DB not ready"));
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }

  async function publishAnnouncementToFirestore(announcementData) {
    const { db } = await initFirebase();
    if (db) {
      try {
        const docRef = await db.collection("announcements").add({
          ...announcementData,
          createdAt: new Date().toISOString(),
          timestamp: window.firebase ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
        });
        return { success: true, id: docRef.id };
      } catch (err) {
        console.warn("Firestore add failed, proceeding with backend REST:", err);
      }
    }
    return { success: false };
  }

  async function deleteAnnouncementFromFirestore(announcementId) {
    const { db } = await initFirebase();
    if (db && announcementId) {
      try {
        await db.collection("announcements").doc(announcementId).delete();
        return true;
      } catch (err) {
        console.warn("Firestore delete failed:", err);
      }
    }
    return false;
  }

  // ================= SMART NOTIFICATIONS SYNC =================
  function subscribeToRealtimeNotifications(user, onUpdate) {
    let unsubscribe = () => {};

    initFirebase().then(({ db }) => {
      if (db && user) {
        try {
          const userBranch = user.department || user.branch || "ALL";
          const userSem = user.semester ? Number(user.semester) : null;

          unsubscribe = db.collection("notifications")
            .orderBy("createdAt", "desc")
            .limit(50)
            .onSnapshot(snapshot => {
              const allNotifs = [];
              snapshot.forEach(doc => {
                const data = doc.data();
                // Filter by student profile (targetBranch & targetSemester)
                const branchMatch = !data.targetBranches || data.targetBranches.includes("ALL") || data.targetBranches.includes(userBranch);
                const semMatch = !data.targetSemesters || (userSem && data.targetSemesters.includes(userSem));

                if (branchMatch && semMatch) {
                  allNotifs.push({ _id: doc.id, id: doc.id, ...data });
                }
              });
              onUpdate(allNotifs);
            }, err => {
              console.warn("Firestore notifications sync note:", err);
            });
        } catch (e) {
          console.warn("Firestore notification subscription error:", e);
        }
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }

  // Export to global scope
  window.CampusConnectFirebase = {
    DEFAULT_CONFIG: DEFAULT_FIREBASE_CONFIG,
    getConfig: getStoredFirebaseConfig,
    saveConfig: saveFirebaseConfig,
    init: initFirebase,
    registerServiceWorker,
    requestPushPermission: requestPushNotificationPermission,
    subscribeAnnouncements: subscribeToRealtimeAnnouncements,
    publishAnnouncement: publishAnnouncementToFirestore,
    deleteAnnouncement: deleteAnnouncementFromFirestore,
    subscribeNotifications: subscribeToRealtimeNotifications
  };

  // Initialize service worker on load if supported
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      registerServiceWorker();
    });
  } else {
    registerServiceWorker();
  }
})(window);
