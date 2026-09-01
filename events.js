document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("campusConnectUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const eventsList = document.getElementById("eventsList");
  const calendarGrid = document.getElementById("calendarGrid");
  const calendarMonthLabel = document.getElementById("calendarMonthLabel");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");

  const typeColors = {
    "Holiday": "#3ddc84",
    "Exam": "#ff5c5c",
    "College Event": "#4da6ff",
    "Deadline": "#ffa53d"
  };

  let allEvents = [];
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  async function loadEvents() {
    try {
      const response = await fetch("https://campus-connect-1q2c.onrender.com/api/events");
      allEvents = await response.json();

      renderList();
      renderCalendar();
    } catch (err) {
      console.error("LOAD EVENTS ERROR:", err);
      eventsList.innerHTML = "<p class='sub'>Failed to load events.</p>";
    }
  }

  function renderList() {
    eventsList.innerHTML = "";

    const upcoming = allEvents
      .filter(e => new Date(e.date) >= new Date().setHours(0, 0, 0, 0))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcoming.length === 0) {
      eventsList.innerHTML = "<p class='sub'>No upcoming events.</p>";
      return;
    }

    for (const e of upcoming) {
      const card = document.createElement("div");
      card.className = "post-card";
      const color = typeColors[e.type] || "#4da6ff";

      card.innerHTML = `
        <h3>${e.title} <span style="background:${color}; color:#000; padding:2px 8px; border-radius:6px; font-size:0.75em; margin-left:6px;">${e.type}</span></h3>
        ${e.description ? `<p>${e.description}</p>` : ""}
        <p class="sub">${new Date(e.date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}${e.endDate ? " – " + new Date(e.endDate).toLocaleDateString() : ""}</p>
      `;

      eventsList.appendChild(card);
    }
  }

  function renderCalendar() {
    calendarGrid.innerHTML = "";

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    calendarMonthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    const headerRow = document.createElement("tr");
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(d => {
      const th = document.createElement("th");
      th.textContent = d;
      th.style.padding = "6px";
      th.style.fontSize = "0.8em";
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    let row = document.createElement("tr");
    for (let i = 0; i < firstDay; i++) {
      row.appendChild(document.createElement("td"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(currentYear, currentMonth, day);
      const dayEvents = allEvents.filter(e => {
        const eDate = new Date(e.date);
        return eDate.getDate() === day && eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
      });

      const td = document.createElement("td");
      td.style.padding = "8px";
      td.style.textAlign = "center";
      td.style.border = "1px solid rgba(255,255,255,0.1)";
      td.style.verticalAlign = "top";

      let dotsHtml = "";
      dayEvents.forEach(e => {
        const color = typeColors[e.type] || "#4da6ff";
        dotsHtml += `<div title="${e.title}" style="width:6px; height:6px; border-radius:50%; background:${color}; margin:2px auto;"></div>`;
      });

      td.innerHTML = `<div>${day}</div>${dotsHtml}`;

      row.appendChild(td);

      if ((firstDay + day) % 7 === 0) {
        table.appendChild(row);
        row = document.createElement("tr");
      }
    }

    if (row.children.length > 0) {
      table.appendChild(row);
    }

    calendarGrid.appendChild(table);
  }

  prevMonthBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  loadEvents();
});