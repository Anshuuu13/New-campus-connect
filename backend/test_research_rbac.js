// Automated Test Suite for Research Collaboration Role-Based Access Control (RBAC)
const BASE_URL = "http://localhost:5000/api";

async function testResearchRBAC() {
  console.log("=== STARTING RESEARCH COLLABORATION RBAC TEST SUITE ===\n");
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
    // 1. Fetch users and find a Student and a Professor
    const usersRes = await fetch(`${BASE_URL}/users`);
    const users = await usersRes.json();
    assert(Array.isArray(users) && users.length > 0, `Users endpoint returned ${users.length} users`);

    const studentUser = users.find(u => u.role && u.role.toLowerCase() === "student");
    const profUser = users.find(u => u.role && (u.role.toLowerCase() === "professor" || u.role.toLowerCase() === "faculty"));

    assert(studentUser && studentUser._id, `Identified student user: ${studentUser?.name} (${studentUser?.role})`);
    assert(profUser && profUser._id, `Identified professor user: ${profUser?.name} (${profUser?.role})`);

    // 2. GET all research posts - Students and professors can both view
    const getRes = await fetch(`${BASE_URL}/faculty-posts`);
    const posts = await getRes.json();
    assert(getRes.status === 200 && Array.isArray(posts) && posts.length > 0, `GET /api/faculty-posts returned ${posts.length} research opportunities`);

    // 3. RBAC TEST 1: Student tries to create research opportunity -> MUST FAIL WITH 403
    console.log("\n--- Testing Creation RBAC ---");
    const studentCreateRes = await fetch(`${BASE_URL}/faculty-posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: studentUser._id,
        category: "Research",
        title: "Unauthorized Student Post Attempt " + Date.now(),
        description: "A student attempting to create a research opportunity.",
        skillsNeeded: "Testing",
        contactEmail: "student@mitsgwl.ac.in"
      })
    });
    const studentCreateData = await studentCreateRes.json();
    assert(
      studentCreateRes.status === 403 && studentCreateData.error.includes("Only professors"),
      `POST /api/faculty-posts by Student correctly rejected with 403 Forbidden: "${studentCreateData.error}"`
    );

    // 4. RBAC TEST 2: Professor creates research opportunity -> MUST SUCCEED WITH 201
    const profCreateRes = await fetch(`${BASE_URL}/faculty-posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: profUser._id,
        category: "Research",
        title: "Autonomous Drone Swarm Navigation " + Date.now(),
        description: "Official MITS research project on distributed drone communication.",
        skillsNeeded: "Python, ROS2, Linux",
        discussionTime: "Wednesdays 3 PM, Robotics Lab",
        contactEmail: profUser.email || "professor@mitsgwalior.in"
      })
    });
    const createdPost = await profCreateRes.json();
    assert(
      profCreateRes.status === 201 && createdPost._id,
      `POST /api/faculty-posts by Professor succeeded with 201 Created (ID: ${createdPost._id})`
    );

    // 5. RBAC TEST 3: Student tries to edit research opportunity -> MUST FAIL WITH 403
    console.log("\n--- Testing Edit RBAC ---");
    const studentEditRes = await fetch(`${BASE_URL}/faculty-posts/${createdPost._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: studentUser._id,
        title: "Malicious Student Title Modification"
      })
    });
    const studentEditData = await studentEditRes.json();
    assert(
      studentEditRes.status === 403 && studentEditData.error.includes("Only professors"),
      `PUT /api/faculty-posts/${createdPost._id} by Student correctly rejected with 403 Forbidden: "${studentEditData.error}"`
    );

    // 6. RBAC TEST 4: Professor edits research opportunity -> MUST SUCCEED WITH 200
    const profEditRes = await fetch(`${BASE_URL}/faculty-posts/${createdPost._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: profUser._id,
        title: "Updated Autonomous Drone Swarm Navigation (Approved)",
        category: "Technical Work"
      })
    });
    const updatedPost = await profEditRes.json();
    assert(
      profEditRes.status === 200 && updatedPost.title === "Updated Autonomous Drone Swarm Navigation (Approved)",
      `PUT /api/faculty-posts/${createdPost._id} by Professor succeeded with 200 OK`
    );

    // 7. RBAC TEST 5: Student applies to research post -> MUST SUCCEED WITH 200
    console.log("\n--- Testing Apply Permissions ---");
    const studentApplyRes = await fetch(`${BASE_URL}/faculty-posts/${createdPost._id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: studentUser._id })
    });
    const applyData = await studentApplyRes.json();
    assert(
      studentApplyRes.status === 200 && applyData.applicantCount >= 1,
      `POST /api/faculty-posts/${createdPost._id}/apply by Student registered application successfully (Applicant count: ${applyData.applicantCount})`
    );

    // 8. RBAC TEST 6: Student tries to delete research post -> MUST FAIL WITH 403
    console.log("\n--- Testing Delete RBAC ---");
    const studentDeleteRes = await fetch(`${BASE_URL}/faculty-posts/${createdPost._id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: studentUser._id })
    });
    const studentDeleteData = await studentDeleteRes.json();
    assert(
      studentDeleteRes.status === 403 && studentDeleteData.error.includes("Only professors"),
      `DELETE /api/faculty-posts/${createdPost._id} by Student correctly rejected with 403 Forbidden: "${studentDeleteData.error}"`
    );

    // 9. RBAC TEST 7: Professor deletes research post -> MUST SUCCEED WITH 200
    const profDeleteRes = await fetch(`${BASE_URL}/faculty-posts/${createdPost._id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profUser._id })
    });
    const deleteData = await profDeleteRes.json();
    assert(
      profDeleteRes.status === 200 && deleteData.message.includes("deleted"),
      `DELETE /api/faculty-posts/${createdPost._id} by Professor succeeded with 200 OK: "${deleteData.message}"`
    );

    console.log("\n=========================================");
    console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`);
    console.log("=========================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

testResearchRBAC();
