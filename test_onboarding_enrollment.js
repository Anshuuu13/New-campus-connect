const assert = require("assert");

async function runTests() {
  const baseUrl = "http://localhost:5000";
  console.log("=== RUNNING ONBOARDING & ENROLLMENT VERIFICATION TESTS ===");

  // 1. Test Google Auth with Student (@mitsgwl.ac.in)
  console.log("\n[TEST 1] Google Auth with Student email and Google-verified name");
  const testStudentEmail = `verify_student_${Date.now()}@mitsgwl.ac.in`;
  const googleVerifiedName = "Anshu Student Sharma";
  const authRes = await fetch(`${baseUrl}/api/users/google-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testStudentEmail,
      name: googleVerifiedName,
      googleId: `gid_${Date.now()}`
    })
  });
  assert.strictEqual(authRes.status, 200, `Expected 200 from google-auth, got ${authRes.status}`);
  const authData = await authRes.json();
  assert.strictEqual(authData.name, googleVerifiedName, "User name must match Google-verified name");
  assert.strictEqual(authData.role, "Student", "Role must be Student");
  assert.strictEqual(authData.profileCompleted, false, "Initial profileCompleted must be false");
  console.log(`✓ Student created via Google Auth: ID=${authData._id}, Name=${authData.name}, Role=${authData.role}`);

  // 2. Test Onboarding Profile Completion (Saving Name and Required Enrollment Number)
  console.log("\n[TEST 2] PATCH user with Name and Enrollment Number");
  const testEnrollmentNo = "0901CS221088";
  const patchRes = await fetch(`${baseUrl}/api/users/${authData._id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: googleVerifiedName,
      enrollmentNumber: testEnrollmentNo,
      department: "Computer Science & Engineering",
      branch: "Computer Science & Engineering",
      year: "3rd Year",
      bio: "MITS CSE student passionate about Web and Cloud.",
      interests: ["Web Development", "Cloud Computing"],
      profileCompleted: true
    })
  });
  assert.strictEqual(patchRes.status, 200, `Expected 200 from PATCH user, got ${patchRes.status}`);
  const patchedData = await patchRes.json();
  assert.strictEqual(patchedData.name, googleVerifiedName, "Name must be saved correctly");
  assert.strictEqual(patchedData.enrollmentNumber, testEnrollmentNo, "Enrollment Number must be saved in database");
  assert.strictEqual(patchedData.profileCompleted, true, "ProfileCompleted must be true");
  console.log(`✓ Profile patched: Name="${patchedData.name}", EnrollmentNumber="${patchedData.enrollmentNumber}", Completed=${patchedData.profileCompleted}`);

  // 3. Test GET user profile includes Enrollment Number
  console.log("\n[TEST 3] GET /api/users/:id includes enrollmentNumber");
  const getRes = await fetch(`${baseUrl}/api/users/${authData._id}`);
  assert.strictEqual(getRes.status, 200, `Expected 200 from GET user, got ${getRes.status}`);
  const fetchedUser = await getRes.json();
  assert.strictEqual(fetchedUser.name, googleVerifiedName, "Fetched name must match");
  assert.strictEqual(fetchedUser.enrollmentNumber, testEnrollmentNo, "Fetched enrollmentNumber must match");
  console.log(`✓ GET /api/users/:id verified: EnrollmentNumber="${fetchedUser.enrollmentNumber}"`);

  // 4. Test HTML integrity: login.html must be Google-only
  console.log("\n[TEST 4] Verify login.html is Google-only");
  const loginRes = await fetch(`${baseUrl}/login.html`);
  assert.strictEqual(loginRes.status, 200);
  const loginHtml = await loginRes.text();
  assert(loginHtml.includes("accounts.google.com/gsi/client"), "Must load Google GIS SDK");
  assert(loginHtml.includes("Continue with Google"), "Must have Continue with Google button");
  assert(!loginHtml.includes("mitsEmailInput"), "Must NOT have manual email input (Google-only)");
  assert(!loginHtml.includes("submitMitsEmailBtn"), "Must NOT have manual email submit button (Google-only)");
  console.log("✓ login.html verified as Google-only");

  // 5. Test HTML integrity: onboarding.html has visible Google Name and required Enrollment Number
  console.log("\n[TEST 5] Verify onboarding.html has visible Name and required Enrollment Number");
  const obRes = await fetch(`${baseUrl}/onboarding.html`);
  assert.strictEqual(obRes.status, 200);
  const obHtml = await obRes.text();
  assert(obHtml.includes('id="obName"'), "Must have visible obName input");
  assert(obHtml.includes('id="obEnrollmentNumber"'), "Must have obEnrollmentNumber input");
  assert(obHtml.includes("required"), "Must have required attribute");
  console.log("✓ onboarding.html verified with Google Name and Enrollment Number");

  // 6. Test HTML integrity: profile.html has Enrollment Number badge and edit modal inputs
  console.log("\n[TEST 6] Verify profile.html displays Enrollment Number");
  const profRes = await fetch(`${baseUrl}/profile.html`);
  assert.strictEqual(profRes.status, 200);
  const profHtml = await profRes.text();
  assert(profHtml.includes("profileEnrollmentBadge"), "Must have profileEnrollmentBadge");
  assert(profHtml.includes("profileEnrollmentText"), "Must have profileEnrollmentText");
  assert(profHtml.includes("enrollmentInput"), "Must have enrollmentInput in edit modal");
  console.log("✓ profile.html verified with Enrollment Number badge and modal");

  console.log("\n=== ALL 6 TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
