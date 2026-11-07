const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const usersRouter = require("./routes/users");
const skillsRouter = require("./routes/skills");
const achievementsRouter = require("./routes/achievements");
const projectsRouter = require("./routes/projects");
const certificationsRouter = require("./routes/certifications");
const teamRouter = require("./routes/team");
const joinRequestsRouter = require("./routes/joinRequests");
const facultyPostsRouter = require("./routes/facultyposts");
const clubheadRouter = require("./routes/clubhead");
const swapRequestsRouter = require("./routes/swapRequests");
const skillpostsRouter = require("./routes/skillposts");
const announcementsRouter = require("./routes/announcements");
const notificationsRouter = require("./routes/notifications");
const eventsRouter = require("./routes/events");
const resourcesRouter = require("./routes/resources");
const complaintsRouter = require("./routes/complaints");
const dashboardRouter = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 5000;

// Universal CORS & Preflight Handler (Supports file://, localhost:5500, localhost:5000, and cloud tunnels)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Bypass-Tunnel-Reminder");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Connect to MongoDB
let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
if (typeof mongoUri === "string") {
  mongoUri = mongoUri.trim();
  if (mongoUri.startsWith('"') && mongoUri.endsWith('"')) {
    mongoUri = mongoUri.slice(1, -1).trim();
  }
  if (mongoUri.startsWith("'") && mongoUri.endsWith("'")) {
    mongoUri = mongoUri.slice(1, -1).trim();
  }
}
if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error("MongoDB connection error:", err));
} else {
  console.warn("Warning: Neither MONGODB_URI nor MONGO_URI configured in environment");
}

const path = require("path");
const fs = require("fs");

// Main entry point: Serve Sign-In page as the first screen for public visitors
app.get("/", (req, res) => {
  const rootLogin = path.resolve(__dirname, "..", "login.html");
  if (fs.existsSync(rootLogin)) {
    return res.sendFile(rootLogin);
  }
  const rootIndex = path.resolve(__dirname, "..", "index.html");
  if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }
  res.send("CampusConnect backend is running.");
});

// Explicit route for Sign-In
app.get("/login", (req, res) => {
  const rootLogin = path.resolve(__dirname, "..", "login.html");
  if (fs.existsSync(rootLogin)) {
    return res.sendFile(rootLogin);
  }
  res.redirect("/");
});

// Explicit route for Dashboard
app.get("/dashboard", (req, res) => {
  const rootIndex = path.resolve(__dirname, "..", "index.html");
  if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }
  res.redirect("/");
});

app.get("/api-status", (req, res) => {
  res.send("CampusConnect backend is running.");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "connecting/disconnected",
    timestamp: new Date().toISOString()
  });
});

// Serve static frontend files with index: false so GET / is never intercepted by index.html
app.use(express.static(path.resolve(__dirname, ".."), { index: false }));
app.use(express.static(__dirname, { index: false }));

// Route registration
app.use("/api/users", usersRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/achievements", achievementsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/certifications", certificationsRouter);
app.use("/api/team", teamRouter);
app.use("/api/join-requests", joinRequestsRouter);
app.use("/api/swap-requests", swapRequestsRouter);
app.use("/api/skill-posts", skillpostsRouter);
app.use("/api/skillposts", skillpostsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/complaints", complaintsRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api/faculty-posts", facultyPostsRouter);
app.use("/api/facultyposts", facultyPostsRouter);
app.use("/api/clubhead", clubheadRouter);
app.use("/api/dashboard", dashboardRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
