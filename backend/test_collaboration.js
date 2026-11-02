// Automated test script for Team-Up, SkillSwap, and Research Collaboration modules
const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("=== STARTING COLLABORATION MODULES TEST SUITE ===");
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
    // 1. Get an existing user for testing
    const usersRes = await fetch(`${BASE_URL}/users`);
    const users = await usersRes.json();
    assert(Array.isArray(users) && users.length > 0, `Users endpoint returned ${users.length} users`);
    const testUser = users[0];
    const peerUser = users[1] || users[0];

    // ==========================================
    // MODULE 1: TEAM-UP (TeamPost & JoinRequest)
    // ==========================================
    console.log("\n--- Testing Team-Up ---");

    // A. Read team posts
    const teamRes = await fetch(`${BASE_URL}/team`);
    const initialTeamPosts = await teamRes.json();
    assert(Array.isArray(initialTeamPosts) && initialTeamPosts.length > 0, `GET /api/team returned ${initialTeamPosts.length} posts`);

    // B. Create team post
    const createTeamRes = await fetch(`${BASE_URL}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: testUser._id,
        title: "Test Autonomous Rover Project " + Date.now(),
        description: "Testing end-to-end team post creation",
        rolesNeeded: "1 ROS2 Lead, 1 Python Dev",
        status: "Ongoing"
      })
    });
    const createdTeamPost = await createTeamRes.json();
    assert(createTeamRes.status === 201 && createdTeamPost._id, `POST /api/team created post (ID: ${createdTeamPost._id})`);

    // C. Update team post
    const updateTeamRes = await fetch(`${BASE_URL}/team/${createdTeamPost._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Updated Autonomous Rover Project",
        status: "Not started yet"
      })
    });
    const updatedTeamPost = await updateTeamRes.json();
    assert(updateTeamRes.status === 200 && updatedTeamPost.title === "Updated Autonomous Rover Project", `PUT /api/team/${createdTeamPost._id} updated title`);

    // D. Create join request
    const joinRes = await fetch(`${BASE_URL}/join-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamPostId: createdTeamPost._id,
        requesterId: peerUser._id
      })
    });
    const joinReq = await joinRes.json();
    assert(joinRes.status === 201 && joinReq._id, `POST /api/join-requests submitted request (ID: ${joinReq._id})`);

    // E. Accept join request
    const patchJoinRes = await fetch(`${BASE_URL}/join-requests/${joinReq._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" })
    });
    const patchedJoinReq = await patchJoinRes.json();
    assert(patchJoinRes.status === 200 && patchedJoinReq.status === "accepted", `PATCH /api/join-requests/${joinReq._id} accepted request`);

    // F. Delete team post
    const deleteTeamRes = await fetch(`${BASE_URL}/team/${createdTeamPost._id}`, { method: "DELETE" });
    assert(deleteTeamRes.status === 200, `DELETE /api/team/${createdTeamPost._id} deleted post`);

    // ==========================================
    // MODULE 2: SKILLSWAP (SkillSwapPost & SwapRequest)
    // ==========================================
    console.log("\n--- Testing SkillSwap ---");

    // A. Read skill posts
    const skillPostsRes = await fetch(`${BASE_URL}/skill-posts`);
    const initialSkillPosts = await skillPostsRes.json();
    assert(Array.isArray(initialSkillPosts) && initialSkillPosts.length > 0, `GET /api/skill-posts returned ${initialSkillPosts.length} listings`);

    // B. Create skill post
    const createSkillRes = await fetch(`${BASE_URL}/skill-posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: testUser._id,
        title: "C++ & DSA for React Frontend " + Date.now(),
        skillOffered: "C++, STL, Dynamic Programming",
        skillWanted: "React, Tailwind, Next.js",
        proficiency: "Advanced",
        availability: "Weekends & Evenings",
        description: "Hands-on coding partner search"
      })
    });
    const createdSkillPost = await createSkillRes.json();
    assert(createSkillRes.status === 201 && createdSkillPost._id, `POST /api/skill-posts created listing (ID: ${createdSkillPost._id})`);

    // C. Update skill post
    const updateSkillRes = await fetch(`${BASE_URL}/skill-posts/${createdSkillPost._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Updated C++ & DSA for React Frontend",
        status: "Active"
      })
    });
    const updatedSkillPost = await updateSkillRes.json();
    assert(updateSkillRes.status === 200 && updatedSkillPost.title === "Updated C++ & DSA for React Frontend", `PUT /api/skill-posts/${createdSkillPost._id} updated listing`);

    // D. Create swap request
    const swapReqRes = await fetch(`${BASE_URL}/swap-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterId: peerUser._id,
        recipientId: testUser._id,
        skillWanted: "C++",
        skillOffered: "React"
      })
    });
    const swapReq = await swapReqRes.json();
    assert(swapReqRes.status === 201 && swapReq._id, `POST /api/swap-requests created swap request (ID: ${swapReq._id})`);

    // E. Accept swap request with schedule
    const patchSwapRes = await fetch(`${BASE_URL}/swap-requests/${swapReq._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "accepted",
        time: "Friday 4 PM",
        venue: "Central Library 2nd Floor",
        notes: "Bring laptop with VS Code"
      })
    });
    const patchedSwap = await patchSwapRes.json();
    assert(patchSwapRes.status === 200 && patchedSwap.status === "accepted" && patchedSwap.venue === "Central Library 2nd Floor", `PATCH /api/swap-requests accepted and scheduled`);

    // F. Delete skill post
    const deleteSkillRes = await fetch(`${BASE_URL}/skill-posts/${createdSkillPost._id}`, { method: "DELETE" });
    assert(deleteSkillRes.status === 200, `DELETE /api/skill-posts/${createdSkillPost._id} deleted listing`);

    // ==========================================
    // MODULE 3: RESEARCH COLLABORATION (FacultyPost)
    // ==========================================
    console.log("\n--- Testing Research Collaboration ---");

    // A. Read research posts
    const researchRes = await fetch(`${BASE_URL}/faculty-posts`);
    const initialResearchPosts = await researchRes.json();
    assert(Array.isArray(initialResearchPosts) && initialResearchPosts.length > 0, `GET /api/faculty-posts returned ${initialResearchPosts.length} research opportunities`);

    // B. Create research post (by Professor)
    const profUser = users.find(u => u.role === "Professor" || u.role === "Faculty") || testUser;
    const createResearchRes = await fetch(`${BASE_URL}/faculty-posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: profUser._id,
        category: "Research",
        title: "Test Quantum Machine Learning on NISQ Devices " + Date.now(),
        description: "Evaluating parameterized quantum circuits for classification benchmarks.",
        skillsNeeded: "Python, Qiskit, Linear Algebra",
        discussionTime: "Thursdays 4 PM, Quantum Lab",
        contactEmail: "quantum@mitsgwalior.in",
        status: "approved"
      })
    });
    const createdResearchPost = await createResearchRes.json();
    assert(createResearchRes.status === 201 && createdResearchPost._id, `POST /api/faculty-posts created opportunity (ID: ${createdResearchPost._id})`);

    // C. Update research post (by Professor)
    const updateResearchRes = await fetch(`${BASE_URL}/faculty-posts/${createdResearchPost._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: profUser._id,
        title: "Updated Quantum Machine Learning on NISQ Devices",
        category: "Technical Work"
      })
    });
    const updatedResearchPost = await updateResearchRes.json();
    assert(updateResearchRes.status === 200 && updatedResearchPost.category === "Technical Work", `PUT /api/faculty-posts/${createdResearchPost._id} updated category`);

    // D. Apply to research post
    const applyRes = await fetch(`${BASE_URL}/faculty-posts/${createdResearchPost._id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: peerUser._id })
    });
    const appliedData = await applyRes.json();
    assert(applyRes.status === 200 && appliedData.applicantCount >= 1, `POST /api/faculty-posts/${createdResearchPost._id}/apply registered student application`);

    // E. Delete research post (by Professor)
    const deleteResearchRes = await fetch(`${BASE_URL}/faculty-posts/${createdResearchPost._id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profUser._id })
    });
    assert(deleteResearchRes.status === 200, `DELETE /api/faculty-posts/${createdResearchPost._id} deleted opportunity`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log(`\n=========================================`);
    console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`);
    console.log(`=========================================`);

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

runTests();
