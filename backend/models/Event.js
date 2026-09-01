const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  endDate: { type: Date },
  type: { type: String, enum: ["Holiday", "Exam", "College Event", "Deadline"], default: "College Event" }
});

module.exports = mongoose.model("Event", eventSchema);