const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const usersRouter = require("./routes/users");
const skillsRouter = require("./routes/skills");
const achievementsRouter = require("./routes/achievements");
const projectsRouter = require("./routes/projects");
const teamRouter = require("./routes/team");
const joinRequestsRouter = require("./routes/joinRequests");
const facultyPostsRouter = require("./routes/facultyposts");
const swapRequestsRouter = require("./routes/swapRequests");
const announcementsRouter = require("./routes/announcements");
const eventsRouter = require("./routes/events");
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("CampusConnect backend is running.");
});

// Any request to /api/users goes to routes/users.js
app.use("/api/users", usersRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/achievements", achievementsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/team", teamRouter);
app.use("/api/join-requests", joinRequestsRouter);
app.use("/api/faculty-posts", facultyPostsRouter);
app.use("/api/swap-requests", swapRequestsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/announcements", announcementsRouter);app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});