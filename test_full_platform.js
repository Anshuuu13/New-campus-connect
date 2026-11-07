const http = require("http");

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(typeof data === "string" ? data : JSON.stringify(data));
    req.end();
  });
}

function createMockGoogleToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${header}.${body}.mockSignature`;
}

async function runTests() {
  console.log("=== CAMPUS CONNECT COMPREHENSIVE PLATFORM INTEGRATION TEST ===");
  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request({ hostname: "localhost", port: 5000, path: "/health", method: "GET" });
    assert("Server health check returns ok", health.status === 200 && health.data.status === "ok");

    // 2. Google Auth Domain Restriction: Reject @gmail.com
    const rejectGmail = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users/google-auth",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      credential: createMockGoogleToken({
        sub: "google-fake-12345",
        name: "Outsider User",
        email: "randomuser@gmail.com",
        email_verified: true
      })
    });
    assert("Reject non-institutional Google accounts (@gmail.com) with 403", rejectGmail.status === 403);

    // 3. Google Auth Student Domain: Allow @mitsgwl.ac.in and assign Student
    const studentAuth = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users/google-auth",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      credential: createMockGoogleToken({
        sub: "google-student-test-999",
        name: "Anshika Student",
        email: "anshika.test@mitsgwl.ac.in",
        email_verified: true
      })
    });
    assert("Accept @mitsgwl.ac.in as Student role", studentAuth.status === 200 && studentAuth.data.role === "Student");
    const testStudentId = studentAuth.data._id;

    // 4. Google Auth Faculty Domain: Allow @mitsgwalior.in and assign Professor
    const facultyAuth = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users/google-auth",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      credential: createMockGoogleToken({
        sub: "google-faculty-test-888",
        name: "Dr. Sharma Faculty",
        email: "rksharma.test@mitsgwalior.in",
        email_verified: true
      })
    });
    assert("Accept @mitsgwalior.in as Professor role", facultyAuth.status === 200 && facultyAuth.data.role === "Professor");

    // 5. Profile Update & MongoDB Atlas Persistence
    const updateProfile = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/users/${testStudentId}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    }, {
      name: "Anshika Rai",
      bio: "2nd Year CSE student working on Smart Campus Connect.",
      department: "Computer Science & Engineering",
      branch: "Computer Science & Engineering",
      year: "2nd Year",
      linkedin: "https://linkedin.com/in/anshika-rai",
      github: "https://github.com/Anshuuu13",
      profilePicture: "https://ui-avatars.com/api/?name=Anshika+Rai&background=0b132b&color=38bdf8",
      profileCompleted: true
    });
    assert("Update user profile in MongoDB (name, bio, department, social links)", updateProfile.status === 200 && updateProfile.data.name === "Anshika Rai" && updateProfile.data.department === "Computer Science & Engineering");

    // Verify GET /api/users/:id reflects the updated details
    const fetchProfile = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/users/${testStudentId}`,
      method: "GET"
    });
    assert("GET /api/users/:id reflects updated MongoDB data", fetchProfile.status === 200 && fetchProfile.data.bio.includes("Smart Campus Connect"));

    // 6. Security Check: Block unauthorized privilege escalation to Admin
    const hackRole = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/users/${testStudentId}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    }, {
      role: "Admin"
    });
    assert("Block student self-elevation to Admin role", hackRole.status === 200 && hackRole.data.role === "Student");

    // 7. Skills API Test (POST, GET, DELETE)
    const addSkill = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/skills",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      userId: testStudentId,
      name: "Machine Learning with Python",
      proficiency: "Advanced",
      category: "AI & Machine Learning"
    });
    assert("Add skill via POST /api/skills", addSkill.status === 201 && addSkill.data.name === "Machine Learning with Python");
    const skillId = addSkill.data._id;

    const getSkills = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/skills/${testStudentId}`,
      method: "GET"
    });
    assert("Fetch user skills via GET /api/skills/:userId", getSkills.status === 200 && Array.isArray(getSkills.data) && getSkills.data.length > 0);

    const deleteSkill = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/skills/${skillId}`,
      method: "DELETE"
    });
    assert("Delete skill via DELETE /api/skills/:id", deleteSkill.status === 200);

    // 8. Achievements API Test (POST, GET)
    const addAch = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/achievements",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      userId: testStudentId,
      studentName: "Anshika Rai",
      title: "1st Runner Up — Smart India Hackathon 2026",
      category: "Hackathon",
      competition: "AICTE & MITS Gwalior",
      date: "Oct 2026",
      description: "Developed AI agricultural advisory system.",
      evidenceUrl: "https://mitsgwalior.in/achievements/sih-2026"
    });
    assert("Submit achievement via POST /api/achievements", addAch.status === 201 && addAch.data.title.includes("Smart India Hackathon"));

    const getAch = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/achievements/user/${testStudentId}`,
      method: "GET"
    });
    assert("Fetch user achievements via GET /api/achievements/user/:userId", getAch.status === 200 && Array.isArray(getAch.data) && getAch.data.length > 0);

    // 9. Projects API Test (POST, GET)
    const addProj = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/projects",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      userId: testStudentId,
      title: "CampusConnect MITS Portal",
      description: "Full-stack academic platform for MITS Gwalior.",
      technologies: "Node.js, Express, MongoDB, Vanilla JS",
      progress: 95,
      status: "In Progress",
      githubUrl: "https://github.com/Anshuuu13/New-campus-connect",
      liveUrl: "https://campus-connect-1q2c.onrender.com"
    });
    assert("Add project via POST /api/projects", addProj.status === 201 && addProj.data.title.includes("CampusConnect"));
    const projId = addProj.data._id;

    const getProj = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/projects/${testStudentId}`,
      method: "GET"
    });
    assert("Fetch user projects via GET /api/projects/:userId", getProj.status === 200 && Array.isArray(getProj.data) && getProj.data.length > 0);

    // 10. Dashboard Summary API Test
    const dashSummary = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/dashboard/summary?userId=${testStudentId}&branch=Computer+Science+%26+Engineering`,
      method: "GET"
    });
    assert("Dashboard summary endpoint returns aggregated metrics", dashSummary.status === 200 && dashSummary.data.unreadAnnouncements !== undefined && dashSummary.data.activeComplaints !== undefined);

    console.log(`\n=== ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED ===`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runTests();
