// controllers/user.controller.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const sign = (u) =>
  jwt.sign(
    { id: u._id, role: u.role, name: u.name, email: u.email },
    process.env.JWT_SECRET || "change_me",
    { expiresIn: "7d" }
  );

// GET /api/me  → fresh data from DB
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ message: "Not found" });
  delete user.password;
  res.json(user);
};

// PATCH /api/me  { name?, email? }
const updateMe = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.user.id } }).lean();
      if (exists) return res.status(400).json({ message: "Email already in use" });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { ...(name && { name }), ...(email && { email }) },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });

    const token = sign(updated); // refresh claims in token (name/email)
    const user = updated.toObject();
    delete user.password;

    res.json({ user, token });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }

  const user = await User.findById(req.user.id).select("+password");
  if (!user) return res.status(404).json({ message: "Not found" });

  const ok = await user.comparePassword(currentPassword);
  if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

  user.password = newPassword; 
  await user.save();

  res.json({ message: "Password updated" });
};

module.exports = { getMe, updateMe, changePassword };
