// models/tag.model.js
const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    color: { type: String, default: "#6c757d" }, // bootstrap gray
  },
  { timestamps: true }
);

TagSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.models.Tag || mongoose.model("Tag", TagSchema);
