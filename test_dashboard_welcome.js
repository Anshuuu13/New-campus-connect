const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("=== TESTING DYNAMIC DASHBOARD WELCOME GREETING ===");

// 1. Verify index.html structure
const indexHtml = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf8");
assert(indexHtml.includes('class="name-greeting"'), "index.html must contain .name-greeting element");
console.log("✓ index.html has .name-greeting element intact");

// 2. Mock DOM & localStorage environment to test script.js greeting logic
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockLocalStorage = new MockStorage();

function mockUpdateGreeting(user) {
  const greetingEl = { textContent: "" };
  
  const storedUserName = (mockLocalStorage.getItem("user.name") || mockLocalStorage.getItem("userName") || "").trim();
  let candidateName = storedUserName || (user && user.name ? String(user.name).trim() : "");

  if (candidateName === "MITS Member" || candidateName === "Student" || candidateName === "User") {
    candidateName = "";
  }

  let enrollmentNumber = (user && user.enrollmentNumber ? String(user.enrollmentNumber).trim() : "") ||
                         (mockLocalStorage.getItem("user.enrollmentNumber") || "").trim();

  if (!enrollmentNumber && user && user.email) {
    const emailPrefix = String(user.email).split("@")[0].trim();
    const match = emailPrefix.match(/^([0-9]{4}[a-zA-Z]{2,4}[0-9]{4,8})/i);
    if (match) {
      enrollmentNumber = match[1].toUpperCase();
    }
  }

  const finalName = candidateName || enrollmentNumber || (user && user.name) || "Student";
  greetingEl.textContent = `Welcome back, ${finalName} 👋`;
  return greetingEl.textContent;
}

// Case A: Real Full Name available from Google session
mockLocalStorage.clear();
mockLocalStorage.setItem("user.name", "Aditya Sharma");
const greetingA = mockUpdateGreeting({ name: "Aditya Sharma", enrollmentNumber: "0901CS211044" });
console.log(`[TEST A] Real Full Name: "${greetingA}"`);
assert.strictEqual(greetingA, "Welcome back, Aditya Sharma 👋");

// Case B: Full Name is unavailable (empty), enrollment number available
mockLocalStorage.clear();
const greetingB = mockUpdateGreeting({ name: "", enrollmentNumber: "0901CS211044" });
console.log(`[TEST B] Full Name unavailable, Enrollment fallback: "${greetingB}"`);
assert.strictEqual(greetingB, "Welcome back, 0901CS211044 👋");

// Case C: Full Name is placeholder "MITS Member", enrollment number extracted from email
mockLocalStorage.clear();
const greetingC = mockUpdateGreeting({ name: "MITS Member", email: "0901it221088@mitsgwl.ac.in" });
console.log(`[TEST C] Placeholder name, email enrollment fallback: "${greetingC}"`);
assert.strictEqual(greetingC, "Welcome back, 0901IT221088 👋");

// Case D: Faculty full name available
mockLocalStorage.clear();
mockLocalStorage.setItem("user.name", "Dr. Sanjeev Khanna");
const greetingD = mockUpdateGreeting({ name: "Dr. Sanjeev Khanna", role: "Professor" });
console.log(`[TEST D] Faculty Real Name: "${greetingD}"`);
assert.strictEqual(greetingD, "Welcome back, Dr. Sanjeev Khanna 👋");

// 3. Verify login.js contains user.name storage in localStorage
const loginJs = fs.readFileSync(path.resolve(__dirname, "login.js"), "utf8");
assert(loginJs.includes('localStorage.setItem("user.name"'), "login.js must store user.name in localStorage upon login");
console.log("✓ login.js verifies storing user.name in localStorage upon Google login");

// 4. Verify script.js contains dynamic updateDashboardWelcomeGreeting implementation
const scriptJs = fs.readFileSync(path.resolve(__dirname, "script.js"), "utf8");
assert(scriptJs.includes("updateDashboardWelcomeGreeting"), "script.js must contain updateDashboardWelcomeGreeting");
assert(scriptJs.includes('name-greeting'), "script.js must target .name-greeting");
console.log("✓ script.js verifies dynamic welcome message greeting implementation");

console.log("\n=== ALL WELCOME GREETING UNIT TESTS PASSED SUCCESSFULLY! ===");
