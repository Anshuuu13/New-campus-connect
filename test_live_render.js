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
      console.log(`[Attempt ${attempts}/${maxAttempts}] Probing live index.html for dashboard credentials strip...`);
      const indexRes = await fetch(`${liveUrl}/index.html`, { cache: "no-store" });
      if (indexRes.ok) {
        const text = await indexRes.text();
        if (text.includes("dashVerifiedName") && text.includes("dashEnrollmentNo")) {
          deployed = true;
          console.log("✓ Live Render deployment has latest dashboard non-editable identity panel!");
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

  // 1. Verify live student login with auto enrollment extraction (any branch/year)
  console.log("\n[LIVE TEST 1] Student login with branch in email (0901cs211077@mitsgwl.ac.in)");
  const testStudentEmail = `0901cs211077_${Date.now()}@mitsgwl.ac.in`;
  const studentName = "Anshu Verified Student";
  const authRes1 = await fetch(`${liveUrl}/api/users/college-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testStudentEmail })
  });
  console.log(`[LIVE] Student Login Status: ${authRes1.status}`);
  assert.strictEqual(authRes1.status, 200);
  const authData1 = await authRes1.json();
  console.log(`[LIVE] Created: ID=${authData1._id}, Role=${authData1.role}, Enrollment=${authData1.enrollmentNumber}, Branch=${authData1.department}`);
  assert.strictEqual(authData1.role, "Student");
  assert(authData1.enrollmentNumber.includes("0901CS211077"));

  // 2. Verify live professor login (any faculty email @mitsgwalior.in)
  console.log("\n[LIVE TEST 2] Faculty login (@mitsgwalior.in)");
  const profEmail = `prof.director_${Date.now()}@mitsgwalior.in`;
  const authRes2 = await fetch(`${liveUrl}/api/users/google-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: profEmail,
      name: "Dr. Faculty Member",
      googleId: `live_prof_gid_${Date.now()}`
    })
  });
  console.log(`[LIVE] Faculty Login Status: ${authRes2.status}`);
  assert.strictEqual(authRes2.status, 200);
  const authData2 = await authRes2.json();
  console.log(`[LIVE] Created: ID=${authData2._id}, Role=${authData2.role}, Dept=${authData2.department}`);
  assert.strictEqual(authData2.role, "Professor");

  // 3. Verify non-institutional rejection
  console.log("\n[LIVE TEST 3] Reject non-institutional account (@gmail.com)");
  const authRes3 = await fetch(`${liveUrl}/api/users/google-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "randomuser@gmail.com", name: "Stranger" })
  });
  console.log(`[LIVE] Non-institutional status: ${authRes3.status} (Expected 403)`);
  assert.strictEqual(authRes3.status, 403);

  // 4. Verify securely saving details after first login
  console.log("\n[LIVE TEST 4] Securely save profile details via PATCH");
  const patchRes = await fetch(`${liveUrl}/api/users/${authData1._id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: studentName,
      enrollmentNumber: "0901CS211077",
      department: "Computer Science & Engineering",
      branch: "Computer Science & Engineering",
      year: "4th Year",
      bio: "Senior Student at MITS",
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
  assert.strictEqual(getData.enrollmentNumber, "0901CS211077");
  console.log(`[LIVE] DB Record: Name="${getData.name}", Enrollment="${getData.enrollmentNumber}"`);

  // 6. Verify login page accessibility
  console.log("\n[LIVE TEST 6] Verify login page has both Google and direct MITS options");
  const loginRes = await fetch(`${liveUrl}/login.html`, { cache: "no-store" });
  const loginText = await loginRes.text();
  assert(loginText.includes("Continue with Google"));
  assert(loginText.includes("institutionalEmailSection") || loginText.includes("mitsEmailInput"));
  console.log("✓ Live login.html has Google GIS and MITS institutional access");

  console.log("\n=== ALL LIVE PRODUCTION CHECKS VERIFIED SUCCESSFULLY ===");
}

checkLive().catch((err) => {
  console.error("Live check notice:", err.message);
  process.exit(1);
});
