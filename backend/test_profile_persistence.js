// Automated Test for Profile Persistence and Edit Fields
const BASE_URL = "http://localhost:5000/api";

async function testProfile() {
  console.log("=== STARTING PROFILE PAGE FUNCTIONALITY & PERSISTENCE TESTS ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. Fetch users and find our test user
    const usersRes = await fetch(`${BASE_URL}/users`);
    const users = await usersRes.json();
    assert(Array.isArray(users) && users.length > 0, `Users endpoint returned ${users.length} users`);

    const testUser = users[0];
    const userId = testUser._id;
    console.log(`Testing with user: ${testUser.name} (ID: ${userId})`);

    // 2. GET initial profile details
    const getRes = await fetch(`${BASE_URL}/users/${userId}`);
    const initialProfile = await getRes.json();
    assert(getRes.status === 200 && initialProfile._id, `GET /api/users/${userId} fetched profile`);

    // 3. PATCH profile with updated details across all edit fields
    console.log("\n--- Testing Profile Update & Persistence ---");
    const testBio = "Full-Stack Developer | Competitive Programmer | Building CampusConnect for MITS " + Date.now();
    const testBranch = "Computer Science & Design";
    const testYear = "3rd Year";
    const testLinkedin = "https://linkedin.com/in/test-mits-achiever";
    const testGithub = "https://github.com/mits-achiever";
    const testEmail = "achiever@mitsgwl.ac.in";
    const testPic = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const patchRes = await fetch(`${BASE_URL}/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio: testBio,
        branch: testBranch,
        year: testYear,
        linkedin: testLinkedin,
        github: testGithub,
        contactEmail: testEmail,
        profilePicture: testPic,
        profileCompleted: true
      })
    });

    const patchData = await patchRes.json();
    assert(patchRes.status === 200, `PATCH /api/users/${userId} responded with HTTP 200`);
    assert(patchData.bio === testBio, `Bio persisted: "${patchData.bio}"`);
    assert(patchData.branch === testBranch, `Branch persisted: "${patchData.branch}"`);
    assert(patchData.year === testYear, `Year persisted: "${patchData.year}"`);
    assert(patchData.linkedin === testLinkedin, `LinkedIn URL persisted: "${patchData.linkedin}"`);
    assert(patchData.github === testGithub, `GitHub URL persisted: "${patchData.github}"`);
    assert(patchData.contactEmail === testEmail, `Contact Email persisted: "${patchData.contactEmail}"`);
    assert(patchData.profilePicture === testPic, `Profile Picture persisted`);

    // 4. GET again from database to verify persistence is permanent
    console.log("\n--- Verifying Database Fetch of Updated Profile ---");
    const verifyRes = await fetch(`${BASE_URL}/users/${userId}`);
    const verifyData = await verifyRes.json();
    assert(verifyData.bio === testBio, "Re-fetched profile contains updated bio");
    assert(verifyData.branch === testBranch, "Re-fetched profile contains updated branch");
    assert(verifyData.year === testYear, "Re-fetched profile contains updated year");
    assert(verifyData.linkedin === testLinkedin, "Re-fetched profile contains updated LinkedIn");
    assert(verifyData.github === testGithub, "Re-fetched profile contains updated GitHub");
    assert(verifyData.contactEmail === testEmail, "Re-fetched profile contains updated contact email");

    // 5. Club head request persistence
    console.log("\n--- Testing Club Head Request ---");
    const clubRes = await fetch(`${BASE_URL}/clubhead/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId,
        club: "Coding Club",
        role: "President"
      })
    });
    const clubData = await clubRes.json();
    assert(clubRes.status === 200 && clubData._id, `Club head request created and persisted (ID: ${clubData._id})`);

    console.log("\n=========================================");
    console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`);
    console.log("=========================================");

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

testProfile();
