const db = require("../config/db");

// ✅ Upload / Update avatar
const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const avatar = req.file.filename;

    await db.query(
      "UPDATE users SET avatar = ? WHERE id = ?",
      [avatar, userId]
    );

    return res.json({
      message: "Avatar updated",
      avatar: `http://localhost:3000/uploads/avatars/${avatar}`,
    });

  } catch (err) {
    console.error(err);

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large (max 1MB)",
      });
    }

    return res.status(500).json({
      message: "Error updating avatar",
    });
  }
};

// ✅ Reset avatar to default
const resetAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT avatar FROM users WHERE id = ?",
      [userId]
    );

    const currentAvatar = rows[0].avatar;

    if (currentAvatar === "default-avatar.png") {
      return res.status(400).json({
        message: "Avatar already default",
      });
    }

    await db.query(
      "UPDATE users SET avatar = ? WHERE id = ?",
      ["default-avatar.png", userId]
    );

    return res.json({
      message: "Avatar reset to default",
      avatar: `http://localhost:3000/uploads/avatars/default-avatar.png`,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Error resetting avatar",
    });
  }
};

module.exports = { updateAvatar, resetAvatar };