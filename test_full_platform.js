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

    // 2. Google Auth Domain Restriction: Reject @gmail.com, @yahoo.com, @rgtu.ac.in
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

    const rejectYahoo = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users/google-auth",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      credential: createMockGoogleToken({
        sub: "google-fake-67890",
        name: "Yahoo User",
        email: "someuser@yahoo.com",
        email_verified: true
      })
    });
    assert("Reject other external domains (@yahoo.com) with 403", rejectYahoo.status === 403);

    const rejectOtherUniv = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users/google-auth",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      credential: createMockGoogleToken({
        sub: "google-fake-33333",
        name: "Other Univ User",
        email: "student@othercollege.ac.in",
        email_verified: true
      })
    });
    assert("Reject non-MITS university domains (@othercollege.ac.in) with 403", rejectOtherUniv.status === 403);

    // 2b. Reject invalid accessToken
    const rejectInvalidToken = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users/google-auth",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      accessToken: "invalid_fake_token_456"
    });
    assert("Reject invalid Google access token with 401", rejectInvalidToken.status === 401);

    // 3. Google Auth Student Domain: Allow ALL @mitsgwl.ac.in and assign Student (No email whitelist restriction)
    const student1Email = `student_${Date.now()}@mitsgwl.ac.in`;
    const studentAuth = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users/google-auth",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      credential: createMockGoogleToken({
        sub: `google-student-${Date.now()}`,
        name: "Anshika Student",
        email: student1Email,
        email_verified: true
      })
    });
    assert("Allow arbitrary student Google account (@mitsgwl.ac.in) with role Student", studentAuth.status === 200 && studentAuth.data.role === "Student");
    const testStudentId = studentAuth.data._id;

    // Test a second arbitrary student account
    const student2Auth = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users/google-auth",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      credential: createMockGoogleToken({
        sub: `google-student-2-${Date.now()}`,
        name: "Rahul Verma",
        email: `2024cse${Math.floor(100 + Math.random() * 900)}@mitsgwl.ac.in`,
        email_verified: true
      })
    });
    assert("Allow second distinct student account with automatic registration", student2Auth.status === 200 && student2Auth.data.role === "Student" && Boolean(student2Auth.data._id));

    // 4. Google Auth Faculty Domain: Allow ALL @mitsgwalior.in and assign Professor (No email whitelist restriction)
    const faculty1Email = `faculty_${Date.now()}@mitsgwalior.in`;
    const facultyAuth = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users/google-auth",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      credential: createMockGoogleToken({
        sub: `google-faculty-${Date.now()}`,
        name: "Dr. Sharma Faculty",
        email: faculty1Email,
        email_verified: true
      })
    });
    assert("Allow arbitrary faculty Google account (@mitsgwalior.in) with role Professor", facultyAuth.status === 200 && facultyAuth.data.role === "Professor");

    // Test a second arbitrary professor account
    const faculty2Auth = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users/google-auth",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      credential: createMockGoogleToken({
        sub: `google-faculty-2-${Date.now()}`,
        name: "Prof. Manish Dixit",
        email: `manish.dixit.${Math.floor(100 + Math.random() * 900)}@mitsgwalior.in`,
        email_verified: true
      })
    });
    assert("Allow second distinct faculty account with automatic registration", faculty2Auth.status === 200 && faculty2Auth.data.role === "Professor" && Boolean(faculty2Auth.data._id));

    // Test re-login of an existing user (must return same _id and not duplicate)
    const reloginStudent = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users/google-auth",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      credential: createMockGoogleToken({
        sub: `google-student-${Date.now()}`,
        name: "Anshika Student",
        email: student1Email,
        email_verified: true
      })
    });
    assert("Re-login of registered student account resolves to existing MongoDB document", reloginStudent.status === 200 && String(reloginStudent.data._id) === String(testStudentId));

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

    // 11. Resources & PYQs API Test
    const allResources = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/resources",
      method: "GET"
    });
    assert("Fetch verified academic resources (at least 39 papers)", allResources.status === 200 && Array.isArray(allResources.data) && allResources.data.length >= 39);

    const firstPaper = allResources.data[0];
    assert("Resource doc includes authentic source attribution", Boolean(firstPaper && (firstPaper.source || firstPaper.uploadedBy)));
    assert("Resource doc includes working previewUrl and downloadUrl", Boolean(firstPaper && firstPaper.previewUrl && firstPaper.downloadUrl));

    // Branch filter test
    const cseResources = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/resources?branch=CSE",
      method: "GET"
    });
    assert("Filter resources by branch (CSE)", cseResources.status === 200 && Array.isArray(cseResources.data) && cseResources.data.length > 0 && cseResources.data.every(r => r.branch === "CSE" || r.branch === "Common"));

    // Semester filter test
    const sem3Resources = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/resources?semester=3",
      method: "GET"
    });
    assert("Filter resources by semester (Sem 3)", sem3Resources.status === 200 && Array.isArray(sem3Resources.data) && sem3Resources.data.length > 0 && sem3Resources.data.every(r => r.semester === 3));

    // 12. PDF Preview & Download Streaming Test
    const testPdfId = firstPaper._id;
    const previewRes = await new Promise((resolve, reject) => {
      http.get(`http://localhost:5000/api/resources/${testPdfId}/preview`, (res) => {
        resolve({ status: res.statusCode, contentType: res.headers["content-type"] });
      }).on("error", reject);
    });
    assert("GET /api/resources/:id/preview streams valid application/pdf", previewRes.status === 200 && previewRes.contentType.includes("application/pdf"));

    const downloadRes = await new Promise((resolve, reject) => {
      http.get(`http://localhost:5000/api/resources/${testPdfId}/download`, (res) => {
        resolve({ status: res.statusCode, contentDisposition: res.headers["content-disposition"] });
      }).on("error", reject);
    });
    assert("GET /api/resources/:id/download serves file attachment", downloadRes.status === 200 && Boolean(downloadRes.contentDisposition));

    // 13. Smart Complaints Management System Test
    const newComplaint = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/complaints",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      title: "Lab 3 Internet Connectivity Issue",
      description: "Internet dropouts during practical lab session in Block B.",
      category: "Campus Wi-Fi & IT",
      department: "IT & Network Infrastructure",
      studentId: testStudentId,
      studentName: "Anshika Rai",
      studentEmail: "anshika.test@mitsgwl.ac.in",
      priority: "Medium"
    });
    assert("Submit complaint via POST /api/complaints with unique ID", newComplaint.status === 201 && (newComplaint.data.complaintId || newComplaint.data._id));
    const createdComplaintId = newComplaint.data._id;

    const listComplaints = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/complaints?studentId=${testStudentId}`,
      method: "GET"
    });
    assert("Fetch user complaints via GET /api/complaints", listComplaints.status === 200 && Array.isArray(listComplaints.data) && listComplaints.data.length > 0);

    // 14. Academic Calendar Events Test
    const eventsRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/events",
      method: "GET"
    });
    assert("Fetch academic calendar events via GET /api/events", eventsRes.status === 200 && Array.isArray(eventsRes.data));

    console.log(`\n=== ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED ===`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runTests();
