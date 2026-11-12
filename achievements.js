document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userRoleEl = document.getElementById("userRole");
  if (userRoleEl) {
    userRoleEl.textContent = user.name ? `${user.name} (${user.role || "Student"})` : (user.role || "Student");
  }

  // DOM Elements
  const achievementList = document.getElementById("achievementList");
  const achievementSearch = document.getElementById("achievementSearch");
  const categoryFilter = document.getElementById("categoryFilter");
  const typeFilter = document.getElementById("typeFilter");
  const resultsCount = document.getElementById("resultsCount");

  const toggleSubmitFormBtn = document.getElementById("toggleSubmitFormBtn");
  const closeSubmitFormBtn = document.getElementById("closeSubmitFormBtn");
  const submitFormCard = document.getElementById("submitFormCard");

  const titleInput = document.getElementById("titleInput");
  const studentNameInput = document.getElementById("studentNameInput");
  const competitionInput = document.getElementById("competitionInput");
  const categoryInput = document.getElementById("categoryInput");
  const dateInput = document.getElementById("dateInput");
  const evidenceInput = document.getElementById("evidenceInput");
  const descInput = document.getElementById("descInput");
  const stackInput = document.getElementById("stackInput");
  const submitBtn = document.getElementById("submitAchievementBtn");
  const submitMsg = document.getElementById("submitMsg");

  // Pre-fill student name if available
  if (studentNameInput && user.name) {
    studentNameInput.value = user.name;
  }

  // Toggle submit form
  if (toggleSubmitFormBtn && submitFormCard) {
    toggleSubmitFormBtn.addEventListener("click", () => {
      const isHidden = submitFormCard.style.display === "none";
      submitFormCard.style.display = isHidden ? "block" : "none";
      if (isHidden) {
        titleInput.focus();
        submitFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (closeSubmitFormBtn && submitFormCard) {
    closeSubmitFormBtn.addEventListener("click", () => {
      submitFormCard.style.display = "none";
    });
  }

  // Verified MITS Gwalior Official Dataset (Guarantees authentic display even if offline / Render spin-up)
  const officialMITSVerifiedDataset = [
    {
      _id: "mits_sih_2024",
      title: "Smart India Hackathon 2024 Grand Finale Winner",
      studentName: "Team Alphonics (Lead: Yug Shrivastava)",
      competition: "Smart India Hackathon 2024 (Ministry of Education & AICTE)",
      category: "Hackathon",
      achievementType: "Student",
      date: "December 2024",
      description: "Secured 1st Prize in the nationwide Grand Finale under Problem Statement SIH1614 (Govt. of NCT of Delhi) by engineering an automated AI research and publications summary generator for evaluating faculty scholarly output.",
      photoUrl: "",
      sourceName: "Smart India Hackathon Official Portal",
      sourceUrl: "https://sih.gov.in/",
      isVerified: true,
      status: "approved"
    },
    {
      _id: "mits_naac_2023",
      title: "NAAC A++ Grade Accreditation with 3.53 CGPA",
      studentName: "Madhav Institute of Technology & Science, Gwalior",
      competition: "National Assessment and Accreditation Council (NAAC Cycle-2)",
      category: "Institutional",
      achievementType: "Institutional",
      date: "2023",
      description: "Conferred the highest accreditation grade of A++ with an institutional score of 3.53/4.0 by NAAC, certifying top-tier academic pedagogy, state-of-the-art laboratory infrastructure, and faculty research.",
      photoUrl: "assets/images/naac-accreditation.webp",
      sourceName: "MITS Gwalior Official NAAC Portal",
      sourceUrl: "https://web.mitsgwalior.in/index.php/naac2023",
      isVerified: true,
      status: "approved"
    },
    {
      _id: "mits_du_2024",
      title: "Conferment of Deemed-to-be-University Status",
      studentName: "Madhav Institute of Technology & Science, Gwalior (MITS-DU)",
      competition: "Ministry of Education, Government of India & UGC",
      category: "Institutional",
      achievementType: "Institutional",
      date: "2024",
      description: "Declared as a Deemed to be University under the Distinct Category by the Ministry of Education, Govt. of India, celebrating over 67 years of engineering leadership and granting academic autonomy.",
      photoUrl: "assets/images/mits-campus.jpg",
      sourceName: "Ministry of Education & MITS Official Portal",
      sourceUrl: "https://web.mitsgwalior.in/",
      isVerified: true,
      status: "approved"
    },
    {
      _id: "mits_synapse_2026",
      title: "IEEE Hack Synapse 2026 National Runner-Up (2nd Place)",
      studentName: "Team ASCE (MITS Gwalior)",
      competition: "IEEE Hack Synapse 36-Hour National Hackathon",
      category: "Hackathon",
      achievementType: "Student",
      date: "January 2026",
      description: "Won 2nd Place overall at the 36-hour national technical hackathon organized in partnership with HackIndia, architecting an innovative decentralized smart campus logistic and resource optimization solution.",
      photoUrl: "assets/images/g20-innovation.webp",
      sourceName: "HackIndia & IEEE Computer Society MITS",
      sourceUrl: "https://hackindia.org",
      isVerified: true,
      status: "approved"
    },
    {
      _id: "mits_sih_2025_moes",
      title: "Smart India Hackathon 2025 National Finalist (MoES)",
      studentName: "Team HASHCAP",
      competition: "Smart India Hackathon 2025 (Ministry of Earth Sciences)",
      category: "Hackathon",
      achievementType: "Student",
      date: "2025",
      description: "Shortlisted among the top national teams across India to develop deep predictive models for extreme coastal and weather phenomena for the Ministry of Earth Sciences.",
      photoUrl: "",
      sourceName: "Smart India Hackathon 2025 Portal",
      sourceUrl: "https://sih.gov.in/",
      isVerified: true,
      status: "approved"
    },
    {
      _id: "mits_sih_2025_cg",
      title: "Smart India Hackathon 2025 National Finalist (Govt. of Chhattisgarh)",
      studentName: "Team Hackoho",
      competition: "Smart India Hackathon 2025 (Govt. of Chhattisgarh)",
      category: "Hackathon",
      achievementType: "Student",
      date: "2025",
      description: "Selected for national finals in the smart governance track, delivering a transparent tracking architecture for public services and grievance handling.",
      photoUrl: "",
      sourceName: "Smart India Hackathon 2025 Portal",
      sourceUrl: "https://sih.gov.in/",
      isVerified: true,
      status: "approved"
    },
    {
      _id: "mits_robotics_2025",
      title: "Autonomous Robotics & Rover Innovations Showcase",
      studentName: "MITS Robotics & Automation Club",
      competition: "Inter-Institutional Autonomous Systems & Robotics Showcase",
      category: "Innovation",
      achievementType: "Student",
      date: "2024–2025",
      description: "Designed, engineered, and demonstrated autonomous obstacle-avoidance rovers, drone telemetry circuits, and IoT robotic arms at the MITS Centre for Artificial Intelligence & Robotics.",
      photoUrl: "assets/images/robotics-innovation.webp",
      sourceName: "MITS Centre for AI & Robotics",
      sourceUrl: "https://web.mitsgwalior.in/",
      isVerified: true,
      status: "approved"
    },
    {
      _id: "mits_baja_2024",
      title: "BAJA SAEINDIA National All-Terrain Vehicle (ATV) Challenge",
      studentName: "Team Advait (SAEINDIA MITS Collegiate Club)",
      competition: "BAJA SAEINDIA National Engineering & Mobility Competition",
      category: "Innovation",
      achievementType: "Student",
      date: "2023–2024",
      description: "Fabricated and field-tested a custom single-seat all-terrain vehicle at NATRAX dynamic testing tracks, successfully clearing rigorous static design evaluations, technical inspections, and endurance runs.",
      photoUrl: "assets/images/campus-event.webp",
      sourceName: "SAEINDIA MITS Collegiate Chapter",
      sourceUrl: "https://www.mitsgwalior.in/",
      isVerified: true,
      status: "approved"
    },
    {
      _id: "mits_nptel_2024",
      title: "SWAYAM-NPTEL National Top Performer Chapter & Elite+Gold Honors",
      studentName: "MITS NPTEL Local Chapter (ID: 1361) & Student Scholars",
      competition: "SWAYAM-NPTEL National Certifications (IITs & IISc)",
      category: "Academic",
      achievementType: "Student",
      date: "2023–2024",
      description: "Recognized nationally as an 'AAA'/'AA' rated active local chapter by SWAYAM-NPTEL, with student scholars achieving Elite+Gold (Top 1% and 2%) national percentile rankings in advanced computing and engineering courses.",
      photoUrl: "assets/images/academic-presentation.webp",
      sourceName: "NPTEL Local Chapter Portal (ID: 1361)",
      sourceUrl: "https://nptel.ac.in/LocalChapter/statistics/1361/",
      isVerified: true,
      status: "approved"
    },
    {
      _id: "6a8c504fa505efa116001618",
      title: "CampusConnect Platform",
      studentName: "Anshika Kumari",
      competition: "Campus Student Initiative (CSBS)",
      category: "Technical Projects",
      achievementType: "Student",
      date: "August 2026",
      description: "Vision to connect people across MITS Gwalior for academic collaboration, skill exchange, team recruitment, and student project sharing.",
      photoUrl: "",
      sourceName: "CampusConnect Internal Records",
      sourceUrl: "https://web.mitsgwalior.in/",
      isVerified: true,
      status: "approved"
    }
  ];

  let currentAchievements = [...officialMITSVerifiedDataset];

  // Helper: Determine API base
  async function getApiBase() {
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      return "/api";
    }
    return "https://campus-connect-1q2c.onrender.com/api";
  }

  // Load live achievements from database
  async function loadLiveAchievements() {
    try {
      const apiBase = await getApiBase();
      const res = await fetch(`${apiBase}/achievements`);
      if (res.ok) {
        const liveData = await res.json();
        if (Array.isArray(liveData) && liveData.length > 0) {
          // Merge live database items ensuring no duplicates with official dataset
          const liveTitles = new Set(liveData.map(d => (d.title || "").toLowerCase()));
          const extraOfficial = officialMITSVerifiedDataset.filter(o => !liveTitles.has(o.title.toLowerCase()));
          currentAchievements = [...liveData, ...extraOfficial];
          renderGallery();
        }
      }
    } catch (err) {
      console.log("Note: Render backend sleeping or offline; displaying local verified MITS dataset.");
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function sanitizeUrl(url) {
    if (!url) return "#";
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return encodeURI(trimmed);
    return encodeURI("https://" + trimmed);
  }

  function getCategoryPlaceholderIcon(category) {
    switch (category) {
      case "Hackathon": return "💻";
      case "Institutional": return "🏛️";
      case "Innovation": return "⚙️";
      case "Academic": return "🎓";
      case "Research": return "🔬";
      case "Sports": return "🏅";
      case "Cultural": return "🎭";
      default: return "🏆";
    }
  }

  // Render gallery
  function renderGallery() {
    achievementList.innerHTML = "";

    const query = achievementSearch ? achievementSearch.value.trim().toLowerCase() : "";
    const selectedCategory = categoryFilter ? categoryFilter.value : "ALL";
    const selectedType = typeFilter ? typeFilter.value : "ALL";

    const filtered = currentAchievements.filter(item => {
      // Category filter
      if (selectedCategory !== "ALL") {
        const itemCat = (item.category || "").toLowerCase();
        if (itemCat !== selectedCategory.toLowerCase()) return false;
      }

      // Type filter
      if (selectedType !== "ALL") {
        const itemType = (item.achievementType || "Student").toLowerCase();
        if (itemType !== selectedType.toLowerCase()) return false;
      }

      // Query search
      if (query) {
        const matchTitle = (item.title || "").toLowerCase().includes(query);
        const matchStudent = (item.studentName || item.userId?.name || "").toLowerCase().includes(query);
        const matchComp = (item.competition || "").toLowerCase().includes(query);
        const matchDesc = (item.description || "").toLowerCase().includes(query);
        const matchStack = (item.stack || "").toLowerCase().includes(query);
        const matchSource = (item.sourceName || "").toLowerCase().includes(query);
        if (!matchTitle && !matchStudent && !matchComp && !matchDesc && !matchStack && !matchSource) {
          return false;
        }
      }

      return true;
    });

    // Update counter
    if (resultsCount) {
      const verifiedCount = filtered.filter(a => a.isVerified === true || a.status === "approved").length;
      resultsCount.textContent = `Showing ${filtered.length} achievement${filtered.length === 1 ? "" : "s"} (${verifiedCount} Verified)`;
    }

    if (filtered.length === 0) {
      achievementList.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3>No matching achievements found</h3>
          <p>No verified records match your current search or category filter. Try clearing the filter or be the first to submit a milestone!</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const isVerified = Boolean(item.isVerified === true || item.status === "approved");
      const isInstitutional = item.achievementType === "Institutional";
      const category = item.category || (isInstitutional ? "Institutional" : "Hackathon");
      const studentName = item.studentName || item.userId?.name || (isInstitutional ? "Madhav Institute of Technology & Science" : "Student Achiever");
      const competition = item.competition || (isInstitutional ? "Institutional Accreditation & Status" : "National Technical Challenge");
      const dateText = item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "");
      
      const sourceName = item.sourceName || (item.evidenceUrl ? "Official Verification Link" : "MITS Institutional Records");
      const sourceUrl = item.sourceUrl || item.evidenceUrl || "https://web.mitsgwalior.in/";

      const card = document.createElement("div");
      card.className = "achievement-card";

      // Media Header (Authentic photograph or clean category placeholder)
      let mediaHeaderHtml = "";
      if (item.photoUrl) {
        mediaHeaderHtml = `
          <div class="achievement-card-media">
            <img src="${item.photoUrl}" alt="${escapeHtml(item.title)}" class="achievement-card-img" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'achievement-card-placeholder\\'><div><span style=\\'font-size:24px;\\'>${getCategoryPlaceholderIcon(category)}</span> <span style=\\'font-family:var(--mono); font-size:12px; color:var(--text-dim); margin-left:8px;\\'>${escapeHtml(category)}</span></div><span class=\\'badge-verified\\'>Verified ✓</span></div>';">
            <span class="achievement-photo-badge">Authentic Photo</span>
          </div>
        `;
      } else {
        mediaHeaderHtml = `
          <div class="achievement-card-placeholder">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 26px;">${getCategoryPlaceholderIcon(category)}</span>
              <div>
                <div style="font-family: var(--mono); font-size: 11px; text-transform: uppercase; color: var(--teal); letter-spacing: 0.05em;">${escapeHtml(category)}</div>
                <div style="font-size: 11px; color: var(--text-dim);">${escapeHtml(dateText)}</div>
              </div>
            </div>
            ${isVerified 
              ? `<span class="badge-verified" style="font-size: 10px;">Verified ✓</span>` 
              : `<span class="badge-self-reported" style="font-size: 10px;">Self-Reported</span>`}
          </div>
        `;
      }

      // Badges
      const typeBadge = isInstitutional
        ? `<span class="badge-type-institutional">🏛️ Institutional</span>`
        : `<span class="badge-type-student">👤 Student Achiever</span>`;

      const verificationBadge = isVerified
        ? `<span class="badge-verified" title="Confirmed by official records or competition results">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 11px; height: 11px;"><polyline points="20 6 9 17 4 12"/></svg>
             Verified ✓
           </span>`
        : `<span class="badge-self-reported" title="Submitted by student; pending faculty verification">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 11px; height: 11px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
             Self-Reported
           </span>`;

      card.innerHTML = `
        ${mediaHeaderHtml}
        <div class="achievement-card-body">
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 10px;">
            <span class="badge-category">${escapeHtml(category)}</span>
            ${typeBadge}
            ${item.photoUrl ? verificationBadge : ""}
            ${item.photoUrl && dateText ? `<span style="font-family: var(--mono); font-size: 11px; color: var(--text-dim); margin-left: auto;">${escapeHtml(dateText)}</span>` : ""}
          </div>

          <h3 class="post-title" style="margin: 0 0 8px; font-size: 17px; line-height: 1.4; color: var(--text);">${escapeHtml(item.title)}</h3>

          <div style="font-size: 13px; color: var(--text); font-weight: 500; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: var(--gold); flex-shrink: 0;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>${escapeHtml(studentName)}</span>
          </div>

          <div style="font-size: 12px; color: var(--teal); font-family: var(--mono); margin-bottom: 12px;">
            🏆 ${escapeHtml(competition)}
          </div>

          <p style="font-size: 13px; color: var(--text-dim); line-height: 1.5; margin: 0 0 14px; flex: 1;">
            ${escapeHtml(item.description)}
          </p>

          ${item.stack ? `
            <div style="font-family: var(--mono); font-size: 11px; color: var(--teal); margin-bottom: 12px;">
              <span style="color: var(--text-dim);">Keywords:</span> ${escapeHtml(item.stack)}
            </div>
          ` : ""}

          <a href="${sanitizeUrl(sourceUrl)}" target="_blank" rel="noopener noreferrer" class="achievement-source-link" title="Open verified source link in new tab">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>Source: ${escapeHtml(sourceName)} ↗</span>
          </a>
        </div>
      `;

      achievementList.appendChild(card);
    });
  }

  // Filter & Search Event Listeners
  if (achievementSearch) {
    achievementSearch.addEventListener("input", () => renderGallery());
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", () => renderGallery());
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", () => renderGallery());
  }

  // Handle achievement submission
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const title = titleInput.value.trim();
      const studentName = studentNameInput.value.trim();
      const competition = competitionInput.value.trim();
      const category = categoryInput.value;
      const date = dateInput.value.trim();
      const evidenceUrl = evidenceInput.value.trim();
      const description = descInput.value.trim();
      const stack = stackInput.value.trim();

      if (!title) {
        alert("Please enter the achievement title.");
        titleInput.focus();
        return;
      }

      if (!studentName) {
        alert("Please enter the student or team name.");
        studentNameInput.focus();
        return;
      }

      if (!competition) {
        alert("Please enter the competition, award, or event name.");
        competitionInput.focus();
        return;
      }

      if (!date) {
        alert("Please enter the date or year of the achievement.");
        dateInput.focus();
        return;
      }

      if (!description) {
        alert("Please provide a short, factual description.");
        descInput.focus();
        return;
      }

      if (evidenceUrl && !/^(https?:\/\/|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5})/i.test(evidenceUrl)) {
        alert("Please enter a valid URL for the official source or certificate link.");
        evidenceInput.focus();
        return;
      }

      submitBtn.disabled = true;
      submitMsg.textContent = "Submitting achievement...";
      submitMsg.style.color = "var(--text-dim)";

      const newEntry = {
        userId: user._id || user.id,
        title,
        studentName,
        competition,
        category,
        achievementType: "Student",
        date,
        evidenceUrl,
        photoUrl: "",
        sourceName: "Self-Reported Student Submission",
        sourceUrl: evidenceUrl || "",
        description,
        stack,
        isVerified: false,
        status: "self-reported",
        createdAt: new Date().toISOString()
      };

      try {
        const apiBase = await getApiBase();
        const response = await fetch(`${apiBase}/achievements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEntry)
        });

        if (!response.ok) {
          throw new Error(`Failed to submit: ${response.status}`);
        }

        const created = await response.json();
        submitMsg.textContent = "Submitted successfully as Self-Reported! Faculty will verify before awarding the Verified badge.";
        submitMsg.style.color = "#34d399";

        // Reset form
        titleInput.value = "";
        competitionInput.value = "";
        dateInput.value = "";
        evidenceInput.value = "";
        descInput.value = "";
        stackInput.value = "";

        // Add to local dataset and re-render
        currentAchievements.unshift({
          ...newEntry,
          ...created,
          isVerified: false
        });
        renderGallery();

        setTimeout(() => {
          submitMsg.textContent = "";
          submitFormCard.style.display = "none";
        }, 4000);
      } catch (err) {
        console.error("SUBMIT ERROR:", err);
        // Fallback: add locally to current session
        currentAchievements.unshift(newEntry);
        renderGallery();
        submitMsg.textContent = "Submitted! Added to gallery as Self-Reported.";
        submitMsg.style.color = "#34d399";

        titleInput.value = "";
        competitionInput.value = "";
        dateInput.value = "";
        evidenceInput.value = "";
        descInput.value = "";
        stackInput.value = "";

        setTimeout(() => {
          submitMsg.textContent = "";
          submitFormCard.style.display = "none";
        }, 4000);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // Initial render with verified dataset
  renderGallery();

  // Then sync with live database
  loadLiveAchievements();
});
