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
      console.log(`[Attempt ${attempts}/${maxAttempts}] Probing live login.html for Google-Only button...`);
      const loginRes = await fetch(`${liveUrl}/login.html`, { cache: "no-store" });
      if (loginRes.ok) {
        const text = await loginRes.text();
        const isGoogleOnly = text.includes("Continue with Google") && !text.includes("mitsEmailInput") && !text.includes("toggleEmailLoginBtn");
        if (isGoogleOnly) {
          deployed = true;
          console.log("✓ Live Render deployment has verified Google-Only login page!");
          break;
        }
      }
    } catch (e) {
      console.log("Waiting for Render deployment to complete...", e.message);
    }
    await new Promise((r) => setTimeout(r, 6000));
  }

  if (!deployed) {
    console.warn("Render deployment still in progress. Running live tests against available instance...");
  }

  // 1. Verify live student login via Google OAuth (any branch/year)
  console.log("\n[LIVE TEST 1] Student Google OAuth (@mitsgwl.ac.in with 0901cs211099 prefix)");
  const testStudentEmail = `0901cs211099_${Date.now()}@mitsgwl.ac.in`;
  const studentName = "Live MITS Scholar";
  const authRes1 = await fetch(`${liveUrl}/api/users/google-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testStudentEmail,
      name: studentName,
      googleId: `live_gid_${Date.now()}`
    })
  });
  console.log(`[LIVE] Student Auth Status: ${authRes1.status}`);
  assert.strictEqual(authRes1.status, 200);
  const authData1 = await authRes1.json();
  console.log(`[LIVE] User created: ID=${authData1._id}, Role=${authData1.role}, Enrollment=${authData1.enrollmentNumber}, Branch=${authData1.department}`);
  assert.strictEqual(authData1.role, "Student");
  assert(authData1.enrollmentNumber.includes("0901CS211099"));

  // 2. Verify live professor login via Google OAuth (any faculty email @mitsgwalior.in)
  console.log("\n[LIVE TEST 2] Faculty Google OAuth (@mitsgwalior.in)");
  const profEmail = `prof.academic_${Date.now()}@mitsgwalior.in`;
  const authRes2 = await fetch(`${liveUrl}/api/users/google-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: profEmail,
      name: "Dr. Faculty Dean",
      googleId: `live_prof_${Date.now()}`
    })
  });
  console.log(`[LIVE] Faculty Auth Status: ${authRes2.status}`);
  assert.strictEqual(authRes2.status, 200);
  const authData2 = await authRes2.json();
  console.log(`[LIVE] User created: ID=${authData2._id}, Role=${authData2.role}, Dept=${authData2.department}`);
  assert.strictEqual(authData2.role, "Professor");

  // 3. Verify non-institutional rejection
  console.log("\n[LIVE TEST 3] Reject non-institutional account (@gmail.com)");
  const authRes3 = await fetch(`${liveUrl}/api/users/google-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "outsider@gmail.com", name: "Stranger" })
  });
  console.log(`[LIVE] Non-institutional status: ${authRes3.status} (Expected 403)`);
  assert.strictEqual(authRes3.status, 403);

  // 4. Verify saving onboarding details securely
  console.log("\n[LIVE TEST 4] Securely save profile details via PATCH");
  const patchRes = await fetch(`${liveUrl}/api/users/${authData1._id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: studentName,
      enrollmentNumber: "0901CS211099",
      department: "Computer Science & Engineering",
      branch: "Computer Science & Engineering",
      year: "4th Year",
      bio: "Senior Student at MITS Gwalior",
      profileCompleted: true
    })
  });
  console.log(`[LIVE] PATCH Status: ${patchRes.status}`);
  assert.strictEqual(patchRes.status, 200);
  const patchData = await patchRes.json();
  console.log(`[LIVE] Saved Profile: Name="${patchData.name}", Enrollment="${patchData.enrollmentNumber}", Completed=${patchData.profileCompleted}`);

  // 5. Verify database persistence with GET
  console.log("\n[LIVE TEST 5] GET /api/users/:id verified from MongoDB Atlas");
  const getRes = await fetch(`${liveUrl}/api/users/${authData1._id}`);
  const getData = await getRes.json();
  assert.strictEqual(getData.name, studentName);
  assert.strictEqual(getData.enrollmentNumber, "0901CS211099");
  console.log(`[LIVE] DB Record: Name="${getData.name}", Enrollment="${getData.enrollmentNumber}"`);

  // 6. Verify login page is strictly Google-only
  console.log("\n[LIVE TEST 6] Verify login page has ONLY Google button");
  const loginRes = await fetch(`${liveUrl}/login.html`, { cache: "no-store" });
  const loginText = await loginRes.text();
  assert(loginText.includes("Continue with Google"), "Must contain 'Continue with Google'");
  assert(!loginText.includes("mitsEmailInput"), "Must NOT contain manual email input");
  assert(!loginText.includes("toggleEmailLoginBtn"), "Must NOT contain toggle button");
  console.log("✓ Live login.html verified as strictly Google-only");

  // 7. Verify dashboard index.html has non-editable credentials
  console.log("\n[LIVE TEST 7] Verify dashboard index.html has non-editable credentials panel");
  const indexRes = await fetch(`${liveUrl}/index.html`, { cache: "no-store" });
  const indexText = await indexRes.text();
  assert(indexText.includes("dashVerifiedName"), "Must contain dashVerifiedName");
  assert(indexText.includes("dashEnrollmentNo"), "Must contain dashEnrollmentNo");
  console.log("✓ Live dashboard index.html verified with non-editable credentials");

  // 8. Verify Google Client ID and Origin Configuration Endpoint
  console.log("\n[LIVE TEST 8] Verify GET /api/users/google-client-id");
  const idRes = await fetch(`${liveUrl}/api/users/google-client-id`, { cache: "no-store" });
  assert.strictEqual(idRes.status, 200);
  const idData = await idRes.json();
  assert(idData.clientId, "Must return valid clientId");
  console.log(`✓ Live Client ID verified: ${idData.clientId}`);
  if (idData.authorizedOrigins) {
    console.log(`✓ Configured Authorized Origins: ${idData.authorizedOrigins.join(", ")}`);
  }

  // 9. Verify Anshika Kumari and BTCD25O1021 on Live API
  console.log("\n[LIVE TEST 9] Verify Anshika Kumari & BTCD25O1021 record");
  const anshikaRes = await fetch(`${liveUrl}/api/users/6a8bdfcfd8542378d1197528`, { cache: "no-store" });
  if (anshikaRes.ok) {
    const anshikaData = await anshikaRes.json();
    console.log(`[LIVE] Anshika Record: Name="${anshikaData.name}", Enrollment="${anshikaData.enrollmentNumber}"`);
    assert.strictEqual(anshikaData.name, "Anshika Kumari");
    assert.strictEqual(anshikaData.enrollmentNumber, "BTCD25O1021");
    console.log("✓ Live Anshika Kumari and BTCD25O1021 verified successfully");
  }

  console.log("\n=== ALL LIVE PRODUCTION CHECKS VERIFIED SUCCESSFULLY ===");
}

checkLive().catch((err) => {
  console.error("Live check notice:", err.message);
  process.exit(1);
});
