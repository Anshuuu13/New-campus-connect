document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const directoryList = document.getElementById("directoryList");
  const incomingRequests = document.getElementById("incomingRequests");
  const sentRequests = document.getElementById("sentRequests");

  async function loadDirectory() {
    try {
      const response = await fetch("https://campus-connect-1q2c.onrender.com/api/users");
      const users = await response.json();

      const others = users.filter((u) => u._id !== user._id);

      if (others.length === 0) {
        directoryList.innerHTML = "<p class='sub'>No other students yet.</p>";
        return;
      }

      directoryList.innerHTML = "";

      for (const person of others) {
        const skillsResponse = await fetch(`https://campus-connect-1q2c.onrender.com/api/skills/${person._id}`);
        const skills = await skillsResponse.json();

        const card = document.createElement("div");
        card.className = "post-card";
        card.innerHTML = `
          <div class="post-title"><a href="profile.html?userId=${person._id}">${person.name}</a></div>
          <p class="post-meta">${person.department} — ${person.role}</p>
          <p class="post-meta">Skills: ${skills.length ? skills.map(s => s.name).join(", ") : "None listed"}</p>
          <input class="field-input" type="text" placeholder="Skill you want to learn from them" id="skillInput-${person._id}">
<input class="field-input" type="text" placeholder="Skill you can teach in return" id="offerInput-${person._id}" style="margin-top: 6px;">
<button class="btn btn-primary request-swap-btn" data-id="${person._id}" style="margin-top: 8px;">Request Swap</button>
        `;
        directoryList.appendChild(card);
      }

      document.querySelectorAll(".request-swap-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    const recipientId = e.target.dataset.id;
    const skillInput = document.getElementById(`skillInput-${recipientId}`);
    const offerInput = document.getElementById(`offerInput-${recipientId}`);
    const skillWanted = skillInput.value.trim();
    const skillOffered = offerInput.value.trim();

    if (!skillWanted) {
      alert("Please enter which skill you want to learn.");
      return;
    }
    btn.disabled = true;
const originalText = btn.textContent;
btn.textContent = "Sending...";


    try {
      const response = await fetch("https://campus-connect-1q2c.onrender.com/api/swap-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user._id, recipientId, skillWanted, skillOffered })
      });
            const data = await response.json();

            if (!response.ok) {
              alert(data.error || "Something went wrong.");
              return;
            }

            alert("Request sent!");
            skillInput.value = "";
            loadSentRequests();
          } catch (err) {
  console.error("Send Swap Request error:", err);
  alert("Something went wrong.");
} finally {
  btn.disabled = false;
  btn.textContent = originalText;
}
});
      });
    } catch (err) {
      console.error("LOAD DIRECTORY ERROR:", err);
      directoryList.innerHTML = "<p class='sub'>Something went wrong loading students.</p>";
    }
  }

  async function loadIncomingRequests() {
    try {
      const response = await fetch(`https://campus-connect-1q2c.onrender.com/api/swap-requests/incoming/${user._id}`);
      const requests = await response.json();

      if (requests.length === 0) {
        incomingRequests.innerHTML = "<p class='sub'>No requests received yet.</p>";
        return;
      }

      incomingRequests.innerHTML = requests.map((r) => `
        <div class="notif-item" style="display: block; margin-bottom: 12px;">
          <p><strong>${r.requesterId?.name || "Unknown"}</strong> wants to learn <strong>${r.skillWanted}</strong>${r.skillOffered ? ` and offers to teach <strong>${r.skillOffered}</strong>` : ""} — ${r.status}</p>
          ${r.status === "pending" ? `
            <input class="field-input" type="text" placeholder="Time (e.g. Fri 4 PM)" id="time-${r._id}">
            <input class="field-input" type="text" placeholder="Venue (e.g. Library, Room 2)" id="venue-${r._id}" style="margin-top: 6px;">
            <input class="field-input" type="text" placeholder="Notes (optional)" id="notes-${r._id}" style="margin-top: 6px;">
            <button class="btn btn-primary accept-swap-btn" data-id="${r._id}" style="margin-top: 6px;">Accept</button>
            <button class="btn btn-secondary reject-swap-btn" data-id="${r._id}" style="margin-top: 6px;">Reject</button>
          ` : r.status === "accepted" ? `
            <p class="post-meta">Time: ${r.time} | Venue: ${r.venue} | Notes: ${r.notes || "—"}</p>
          ` : ""}
        </div>
      `).join("");

      document.querySelectorAll(".accept-swap-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          const time = document.getElementById(`time-${id}`).value.trim();
          const venue = document.getElementById(`venue-${id}`).value.trim();
          const notes = document.getElementById(`notes-${id}`).value.trim();

          if (!time || !venue) {
            alert("Please enter at least a time and venue.");
            return;
          }

          try {
            await fetch(`https://campus-connect-1q2c.onrender.com/api/swap-requests/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "accepted", time, venue, notes })
            });
            loadIncomingRequests();
          } catch (err) {
            console.error("ACCEPT SWAP ERROR:", err);
          }
        });
      });

      document.querySelectorAll(".reject-swap-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          try {
            await fetch(`https://campus-connect-1q2c.onrender.com/api/swap-requests/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "rejected" })
            });
            loadIncomingRequests();
          } catch (err) {
            console.error("REJECT SWAP ERROR:", err);
          }
        });
      });
    } catch (err) {
      console.error("LOAD INCOMING ERROR:", err);
      incomingRequests.innerHTML = "<p class='sub'>Something went wrong loading requests.</p>";
    }
  }

  async function loadSentRequests() {
    try {
      const response = await fetch(`https://campus-connect-1q2c.onrender.com/api/swap-requests/sent/${user._id}`);
      const requests = await response.json();

      if (requests.length === 0) {
        sentRequests.innerHTML = "<p class='sub'>No requests sent yet.</p>";
        return;
      }

      sentRequests.innerHTML = requests.map((r) => `
        <div class="notif-item" style="display: block; margin-bottom: 12px;">
          <p>You asked <strong>${r.recipientId?.name || "Unknown"}</strong> to teach <strong>${r.skillWanted}</strong>${r.skillOffered ? `, offering to teach <strong>${r.skillOffered}</strong> in return` : ""} — ${r.status}</p>
          ${r.status === "accepted" ? `<p class="post-meta">Time: ${r.time} | Venue: ${r.venue} | Notes: ${r.notes || "—"}</p>` : ""}
        </div>
      `).join("");
    } catch (err) {
      console.error("LOAD SENT ERROR:", err);
      sentRequests.innerHTML = "<p class='sub'>Something went wrong loading requests.</p>";
    }
  }

  loadDirectory();
  loadIncomingRequests();
  loadSentRequests();
});