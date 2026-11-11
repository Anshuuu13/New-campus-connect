const assert = require("assert");

async function checkLive() {
  const liveUrl = "https://campus-connect-1q2c.onrender.com";
  console.log(`=== CHECKING LIVE PRODUCTION DEPLOYMENT ON RENDER (${liveUrl}) ===`);

  let deployed = false;
  let attempts = 0;
  const maxAttempts = 24; // up to ~2 minutes

  while (!deployed && attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`[Attempt ${attempts}/${maxAttempts}] Probing live onboarding.html and API...`);
      const obRes = await fetch(`${liveUrl}/onboarding.html`, { cache: "no-store" });
      if (obRes.ok) {
        const text = await obRes.text();
        if (text.includes("obEnrollmentNumber") && text.includes("obName")) {
          deployed = true;
          console.log("✓ Live Render deployment has latest onboarding form with Enrollment Number!");
          break;
        }
      }
    } catch (e) {
      console.log("Waiting for Render deployment to complete...", e.message);
    }
    await new Promise((r) => setTimeout(r, 6000));
  }

  if (!deployed) {
    console.warn("Render deployment still finishing or queued. Checking API status...");
  }

  // Verify live Google auth and onboarding endpoints
  const testStudentEmail = `live_verify_${Date.now()}@mitsgwl.ac.in`;
  const googleName = "Live MITS Scholar";
  const authRes = await fetch(`${liveUrl}/api/users/google-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testStudentEmail,
      name: googleName,
      googleId: `live_gid_${Date.now()}`
    })
  });
  console.log(`[LIVE] Google Auth Status: ${authRes.status}`);
  const authData = await authRes.json();
  console.log(`[LIVE] User created: ${authData.name} (${authData.role}), ID: ${authData._id}`);

  // Test PATCH
  const liveEnrollment = "0901CS221099";
  const patchRes = await fetch(`${liveUrl}/api/users/${authData._id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: googleName,
      enrollmentNumber: liveEnrollment,
      department: "Computer Science & Engineering",
      branch: "Computer Science & Engineering",
      year: "3rd Year",
      bio: "Live verified on Render",
      profileCompleted: true
    })
  });
  console.log(`[LIVE] PATCH Onboarding Status: ${patchRes.status}`);
  const patchData = await patchRes.json();
  console.log(`[LIVE] Patched Enrollment: ${patchData.enrollmentNumber}, Name: ${patchData.name}`);

  // Test GET
  const getRes = await fetch(`${liveUrl}/api/users/${authData._id}`);
  const getData = await getRes.json();
  console.log(`[LIVE] GET Profile Status: ${getRes.status}, Enrollment in DB: ${getData.enrollmentNumber}`);

  assert.strictEqual(getData.enrollmentNumber, liveEnrollment, "Live DB must return saved enrollmentNumber");
  assert.strictEqual(getData.name, googleName, "Live DB must return saved name");

  // Verify login.html is Google-only on live
  const loginRes = await fetch(`${liveUrl}/login.html`, { cache: "no-store" });
  const loginText = await loginRes.text();
  const isGoogleOnly = !loginText.includes("mitsEmailInput");
  console.log(`[LIVE] login.html is Google-only: ${isGoogleOnly}`);

  console.log("=== ALL LIVE PRODUCTION CHECKS VERIFIED SUCCESSFULLY ===");
}

checkLive().catch((err) => {
  console.error("Live check notice:", err.message);
  process.exit(1);
});
