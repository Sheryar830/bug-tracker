const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ROLES } = require("../config/constants");

const sign = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET || "change_me",
    { expiresIn: "7d" }
  );

// ✅ REGISTER
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: ["ADMIN", "DEVELOPER", "TESTER"].includes(role) ? role : "TESTER",
    });

    return res.status(201).json({
      token: sign(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ LOGIN
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    return res.json({
      token: sign(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
