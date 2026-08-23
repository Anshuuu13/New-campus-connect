// Each notification: what happened, when, and whether it's been read.
// Later, this will come from a real-time feed on the backend instead
// of being hardcoded here.
const notifications = [
  {
    icon: "🤝",
    text: 'Rahul Sharma accepted your request to join "Smart Irrigation System".',
    time: "2 hours ago",
    unread: true,
  },
  {
    icon: "🔬",
    text: "Dr. XYZ reviewed your request for the AI Based Healthcare Research post.",
    time: "5 hours ago",
    unread: true,
  },
  {
    icon: "🧠",
    text: "You have a new SkillSwap request for a Flutter session.",
    time: "1 day ago",
    unread: true,
  },
  {
    icon: "🏆",
    text: 'Your project "CampusConnect" was featured in Achievements.',
    time: "2 days ago",
    unread: false,
  },
  {
    icon: "📅",
    text: "Robotics Club recruitment closes on 20 Aug 2026.",
    time: "3 days ago",
    unread: false,
  },
];

const notifList = document.getElementById("notifList");

function render() {
  notifList.innerHTML = "";
  notifications.forEach((n, i) => {
    const item = document.createElement("div");
    item.className = "notif-item" + (n.unread ? " notif-unread" : "");
    item.innerHTML = `
      <span class="notif-icon">${n.icon}</span>
      <div class="notif-body">
        <p class="notif-text">${n.text}</p>
        <span class="notif-time">${n.time}</span>
      </div>
      ${n.unread ? '<span class="notif-dot"></span>' : ""}
    `;
    // Clicking a notification marks it as read.
    item.addEventListener("click", () => {
      notifications[i].unread = false;
      render();
    });
    notifList.appendChild(item);
  });
}

render();