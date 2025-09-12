// models/project.model.js
const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key:  { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. "APP"
    description: { type: String, default: "" },
    url: { type: String, default: "", trim: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Project || mongoose.model("Project", ProjectSchema);
