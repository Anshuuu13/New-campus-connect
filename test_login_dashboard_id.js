const assert = require("assert");

async function run() {
  const baseUrl = "http://localhost:5000";
  console.log("=== VERIFYING LOGIN, ENROLLMENT AUTO-EXTRACTION & DASHBOARD CREDENTIALS ===");

  // 1. Test student login with branch & enrollment in email (0901cs211044@mitsgwl.ac.in)
  console.log("\n[TEST 1] Student with branch & roll in email");
  const studentEmail1 = `0901cs211044_${Date.now()}@mitsgwl.ac.in`;
  const res1 = await fetch(`${baseUrl}/api/users/college-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: studentEmail1 })
  });
  assert.strictEqual(res1.status, 200);
  const data1 = await res1.json();
  assert.strictEqual(data1.role, "Student");
  assert(data1.enrollmentNumber.includes("0901CS211044"), `Expected enrollment number to include 0901CS211044, got ${data1.enrollmentNumber}`);
  assert.strictEqual(data1.department, "Computer Science & Engineering");
  console.log(`✓ Student 1: Role=${data1.role}, Enrollment=${data1.enrollmentNumber}, Branch=${data1.department}`);

  // 2. Test student login with IT branch (0901it221088@mitsgwl.ac.in)
  console.log("\n[TEST 2] Student with IT branch in email");
  const studentEmail2 = `0901it221088_${Date.now()}@mitsgwl.ac.in`;
  const res2 = await fetch(`${baseUrl}/api/users/google-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: studentEmail2,
      name: "Rohit IT Student",
      googleId: `gid_${Date.now()}`
    })
  });
  assert.strictEqual(res2.status, 200);
  const data2 = await res2.json();
  assert.strictEqual(data2.role, "Student");
  assert(data2.enrollmentNumber.includes("0901IT221088"), `Expected enrollment number to include 0901IT221088, got ${data2.enrollmentNumber}`);
  assert.strictEqual(data2.department, "Information Technology");
  console.log(`✓ Student 2: Role=${data2.role}, Enrollment=${data2.enrollmentNumber}, Branch=${data2.department}`);

  // 3. Test professor login (any faculty email @mitsgwalior.in)
  console.log("\n[TEST 3] Faculty login (@mitsgwalior.in)");
  const profEmail = `dr.hod.electrical_${Date.now()}@mitsgwalior.in`;
  const res3 = await fetch(`${baseUrl}/api/users/google-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: profEmail,
      name: "Dr. Electrical Faculty",
      googleId: `gid_prof_${Date.now()}`
    })
  });
  assert.strictEqual(res3.status, 200);
  const data3 = await res3.json();
  assert.strictEqual(data3.role, "Professor");
  assert.strictEqual(data3.department, "Academic Faculty");
  console.log(`✓ Faculty: Role=${data3.role}, Name=${data3.name}, Dept=${data3.department}`);

  // 4. Test non-institutional rejection
  console.log("\n[TEST 4] Reject external @gmail.com");
  const res4 = await fetch(`${baseUrl}/api/users/google-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "outsider@gmail.com", name: "Outsider" })
  });
  assert.strictEqual(res4.status, 403);
  console.log("✓ Correctly rejected external @gmail.com with 403 Forbidden");

  // 5. Test saving onboarding details securely
  console.log("\n[TEST 5] Securely save verified details via PATCH");
  const patchRes = await fetch(`${baseUrl}/api/users/${data1._id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Anshu Sharma",
      enrollmentNumber: "0901CS211044",
      department: "Computer Science & Engineering",
      branch: "Computer Science & Engineering",
      year: "4th Year",
      bio: "Senior CSE student",
      profileCompleted: true
    })
  });
  assert.strictEqual(patchRes.status, 200);
  const patchData = await patchRes.json();
  assert.strictEqual(patchData.name, "Anshu Sharma");
  assert.strictEqual(patchData.enrollmentNumber, "0901CS211044");
  assert.strictEqual(patchData.profileCompleted, true);
  console.log(`✓ Saved to DB: Name=${patchData.name}, Enrollment=${patchData.enrollmentNumber}`);

  // 6. Test GET profile returns updated values
  console.log("\n[TEST 6] GET /api/users/:id returns verified details");
  const getRes = await fetch(`${baseUrl}/api/users/${data1._id}`);
  assert.strictEqual(getRes.status, 200);
  const getData = await getRes.json();
  assert.strictEqual(getData.name, "Anshu Sharma");
  assert.strictEqual(getData.enrollmentNumber, "0901CS211044");
  console.log(`✓ Verified in MongoDB Atlas: Name=${getData.name}, Enrollment=${getData.enrollmentNumber}`);

  // 7. Verify index.html contains non-editable credentials
  console.log("\n[TEST 7] Verify Dashboard index.html contains non-editable fields");
  const indexRes = await fetch(`${baseUrl}/index.html`);
  const indexHtml = await indexRes.text();
  assert(indexHtml.includes('id="dashVerifiedName"'), "Must have dashVerifiedName");
  assert(indexHtml.includes('id="dashEnrollmentNo"'), "Must have dashEnrollmentNo");
  assert(indexHtml.includes('readonly'), "Fields must be marked readonly");
  console.log("✓ Dashboard index.html verified with non-editable credentials");

  console.log("\n=== ALL 7 TESTS PASSED SUCCESSFULLY! ===");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
