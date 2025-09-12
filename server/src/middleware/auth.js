// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "change_me");
    const user = await User.findById(payload.id).select("name email role isActive");
    if (!user) return res.status(401).json({ message: "User not found" });

    // ⬇️ NEW: reject deactivated users
    if (!user.isActive) {
      return res.status(403).json({ message: "Account deactivated. Please contact the administrator." });
    }

    req.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { auth };
