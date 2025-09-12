// controllers/user.admin.controller.js
const User = require("../models/User");
const { ROLES } = require("../config/constants");

const listUsers = async (req, res) => {
  try {
    const { q, role, active, page = 1, limit = 20, includeAdmins } = req.query;
    const where = {};

    if (q) {
      const rx = new RegExp(q, "i");
      where.$or = [{ name: rx }, { email: rx }];
    }
    if (role) where.role = role;
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;

    // ⬇️ NEW: hide ADMINs by default unless explicitly requested
    const allowAdmins =
      includeAdmins === "1" || includeAdmins === "true" || role === "ADMIN";
    if (!allowAdmins && !where.role) {
      where.role = { $ne: "ADMIN" };
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

    const [items, total] = await Promise.all([
      User.find(where)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .select("name email role isActive createdAt"),
      User.countDocuments(where),
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / perPage) });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
// ensure at least one active ADMIN remains
const ensureAnotherAdminExists = async (exceptId = null) => {
  const filter = { role: "ADMIN", isActive: true };
  if (exceptId) filter._id = { $ne: exceptId };
  const count = await User.countDocuments(filter);
  return count > 0;
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["ADMIN", "DEVELOPER", "TESTER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // If demoting an admin, make sure another admin remains active
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "ADMIN" && role !== "ADMIN") {
      const ok = await ensureAnotherAdminExists(id);
      if (!ok) return res.status(400).json({ message: "Cannot remove the last active admin" });
    }

    user.role = role;
    await user.save();

    res.json({ id: user._id, role: user.role });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const setActiveState = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent deactivating the last active admin
    if (user.role === "ADMIN" && isActive === false) {
      const ok = await ensureAnotherAdminExists(id);
      if (!ok) return res.status(400).json({ message: "Cannot deactivate the last active admin" });
    }

    user.isActive = isActive;
    await user.save();

    res.json({ id: user._id, isActive: user.isActive });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = { listUsers, updateRole, setActiveState };
