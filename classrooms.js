// Each room: where it is and how to get there. Later, this would come
// from the college's real room database, possibly with an actual map.
const classrooms = [
  {
    room: "CS-204",
    building: "Computer Science Block",
    floor: "2nd Floor",
    landmark: "Opposite the CS staff room",
    directions: "Take the main stairs up, turn right, it's the 4th door on the left.",
    usedFor: "Data Structures, Operating Systems",
  },
  {
    room: "ECE-101",
    building: "Electronics Block",
    floor: "Ground Floor",
    landmark: "Right next to the main entrance",
    directions: "Enter the Electronics Block, it's the first room on your right.",
    usedFor: "Digital Electronics",
  },
  {
    room: "MECH-Lab-3",
    building: "Mechanical Block",
    floor: "1st Floor",
    landmark: "Behind the workshop area",
    directions: "Go up one floor from the workshop entrance, follow signs to Lab 3.",
    usedFor: "Manufacturing Practices",
  },
  {
    room: "AUD-01",
    building: "Main Building",
    floor: "Ground Floor",
    landmark: "Big auditorium near the admin office",
    directions: "Straight ahead from the main gate, past the reception.",
    usedFor: "Guest Lectures, Seminars",
  },
  {
    room: "CS-310",
    building: "Computer Science Block",
    floor: "3rd Floor",
    landmark: "Next to the AI/ML Lab",
    directions: "Take the lift to the 3rd floor, it's at the far end of the corridor.",
    usedFor: "Database Management, Computer Networks",
  },
];

const roomList = document.getElementById("roomList");
const searchInput = document.getElementById("roomSearch");

function render(filterText = "") {
  const q = filterText.trim().toLowerCase();

  const filtered = classrooms.filter((c) => {
    return (
      c.room.toLowerCase().includes(q) ||
      c.building.toLowerCase().includes(q) ||
      c.usedFor.toLowerCase().includes(q)
    );
  });

  roomList.innerHTML = "";

  if (filtered.length === 0) {
    roomList.innerHTML = `<p class="sub">No rooms match "${filterText}".</p>`;
    return;
  }

  filtered.forEach((c) => {
    const card = document.createElement("div");
    card.className = "post-card";
    card.innerHTML = `
      <h2 class="post-title">📍 ${c.room}</h2>
      <div class="post-meta">
        <span><strong>Building:</strong> ${c.building}</span>
        <span><strong>Floor:</strong> ${c.floor}</span>
      </div>
      <p class="mentor-line">${c.landmark}</p>
      <div class="post-looking">
        <h3>How to Get There</h3>
        <p class="mentor-line">${c.directions}</p>
      </div>
      <div class="post-looking">
        <h3>Used For</h3>
        <p class="mentor-line">${c.usedFor}</p>
      </div>
    `;
    roomList.appendChild(card);
  });
}

searchInput.addEventListener("input", (e) => render(e.target.value));

render();