const db = require("../config/db");
const bcrypt = require("bcryptjs");
const {
  changePasswordSchema,
  resetPasswordSchema,
} = require("../validators/authValidate");
const { sendOtpEmail } = require("../services/mailService");

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

    await db.query("UPDATE users SET avatar = ? WHERE id = ?", [
      avatar,
      userId,
    ]);

    return res.json({
      message: "Avatar updated",
      avatar: `https://construction-site-api-3uii.onrender.com/uploads/avatars/${avatar}`,
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

    const [rows] = await db.query("SELECT avatar FROM users WHERE id = ?", [
      userId,
    ]);

    const currentAvatar = rows[0].avatar;

    if (currentAvatar === "default-avatar.png") {
      return res.status(400).json({
        message: "Avatar already default",
      });
    }

    await db.query("UPDATE users SET avatar = ? WHERE id = ?", [
      "default-avatar.png",
      userId,
    ]);

    return res.json({
      message: "Avatar reset to default",
      avatar: `https://construction-site-api-3uii.onrender.com/uploads/avatars/default-avatar.png`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Error resetting avatar",
    });
  }
};

const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT id, message, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      limit 5
    `,
      [userId],
    );

    res.json({
      message: "Notifications fetched",
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching notifications",
    });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
      [userId],
    );

    res.json({
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating notifications",
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId],
    );

    res.json({
      message: "Unread count fetched",
      data: {
        unread: rows[0].unread,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching unread count",
    });
  }
};

const getMyProjectsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    let projectQuery = "";
    let params = [];

    // 🔥 CLIENT
    if (role === "client") {
      const [[client]] = await db.query(
        "SELECT id FROM clients WHERE user_id = ?",
        [userId],
      );

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      projectQuery = `WHERE p.client_id = ?`;
      params = [client.id];
    }

    // 🔥 SUPERVISOR
    else if (role === "supervisor") {
      const [[sup]] = await db.query(
        "SELECT id FROM supervisors WHERE user_id = ?",
        [userId],
      );

      if (!sup) {
        return res.status(404).json({ message: "Supervisor not found" });
      }

      projectQuery = `
        JOIN project_supervisors ps2 ON ps2.project_id = p.id
        WHERE ps2.supervisor_id = ?
      `;
      params = [sup.id];
    }

    // 🔥 WORKER
    else if (role === "worker") {
      const [[worker]] = await db.query(
        "SELECT id FROM workers WHERE user_id = ?",
        [userId],
      );

      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }

      projectQuery = `
        JOIN project_workers pw2 ON pw2.project_id = p.id
        WHERE pw2.worker_id = ?
      `;
      params = [worker.id];
    }

    // 🔥 QUERY
    const [projects] = await db.query(
      `
      SELECT
        p.*,
        cu.name AS created_by_name,
        c.id AS client_id,
        cu2.name AS client_name,
        su.name AS supervisor_name,
        su.email AS supervisor_email,
        ps.assigned_at AS supervisor_assigned_at

      FROM projects p

      LEFT JOIN users cu ON p.created_by = cu.id
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users cu2 ON c.user_id = cu2.id

      LEFT JOIN project_supervisors ps ON ps.project_id = p.id
      LEFT JOIN supervisors s ON ps.supervisor_id = s.id
      LEFT JOIN users su ON s.user_id = su.id

      ${projectQuery}
      `,
      params,
    );

    const finalData = [];

    for (let p of projects) {
      // creator
      p.created_by = p.created_by
        ? { id: p.created_by, name: p.created_by_name }
        : null;
      delete p.created_by_name;

      // client
      p.client = p.client_id ? { id: p.client_id, name: p.client_name } : null;
      delete p.client_id;
      delete p.client_name;

      // supervisor
      p.supervisor = p.supervisor_name
        ? {
            name: p.supervisor_name,
            email: p.supervisor_email,
            assigned_at: p.supervisor_assigned_at,
          }
        : null;
      delete p.supervisor_name;
      delete p.supervisor_email;
      delete p.supervisor_assigned_at;

      // workers
      const [workers] = await db.query(
        `
        SELECT w.id, u.name, u.email, u.status, pw.assigned_at
        FROM project_workers pw
        JOIN workers w ON pw.worker_id = w.id
        JOIN users u ON w.user_id = u.id
        WHERE pw.project_id = ?
        `,
        [p.id],
      );

      p.workers = workers;
      p.worker_count = workers.length;

      // thumbnail
      p.thumbnail = `${baseUrl}/uploads/projects/${p.thumbnail}`;

      finalData.push(p);
    }

    res.json({
      message: "My projects fetched successfully",
      data: finalData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching projects",
    });
  }
};

const changePasswordController = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ validate first
    const { error, value } = changePasswordSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const { current_password, new_password } = value;

    // ✅ get current password from DB
    const [[user]] = await db.query("SELECT password FROM users WHERE id = ?", [
      userId,
    ]);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ✅ check current password
    const isMatch = bcrypt.compareSync(current_password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    // ✅ hash new password
    const hashedPassword = bcrypt.hashSync(new_password, 10);

    // ✅ update
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error changing password",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [user] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    // 🔒 don't reveal email exist or not
    if (user.length === 0) {
      return res.json({ message: "If email exists, OTP sent" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expire = new Date(Date.now() + 10 * 60 * 1000);

    // remove old
    await db.query("DELETE FROM password_resets WHERE email = ?", [email]);

    // insert new
    await db.query(
      "INSERT INTO password_resets (email, otp, expire_at) VALUES (?, ?, ?)",
      [email, otp, expire],
    );

    // 🔥 use service here
    await sendOtpEmail(email, otp);

    res.json({ message: "If email exists, OTP sent" });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({
      message: "Error sending OTP",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM password_resets WHERE email = ? AND otp = ?",
      [email, otp],
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const record = rows[0];

    // ✅ check expire first
    if (new Date() > new Date(record.expire_at)) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // ✅ mark verified
    await db.query(
      "UPDATE password_resets SET verified = TRUE WHERE email = ?",
      [email],
    );

    // 🔥 OPTIONAL (better UX for frontend)
    res.json({
      message: "OTP verified",
      email: email, // frontend can reuse
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({
      message: "Error verifying OTP",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { new_password, confirm_password } = req.body;

    // ✅ get email from previous step (middleware / token / session)
    const email = req.user?.email || req.body.email; // adjust if you use token

    // ✅ Joi validate
    const { error } = resetPasswordSchema.validate({
      new_password,
      confirm_password,
    });

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    // ✅ check OTP verified
    const [rows] = await db.query(
      "SELECT * FROM password_resets WHERE email = ? AND verified = TRUE",
      [email],
    );

    if (rows.length === 0) {
      return res.status(400).json({
        message: "OTP not verified",
      });
    }

    // ✅ hash password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // ✅ update password
    await db.query("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    // ✅ cleanup
    await db.query("DELETE FROM password_resets WHERE email = ?", [email]);

    res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({
      message: "Error resetting password",
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const [user] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    // 🔒 don't reveal
    if (user.length === 0) {
      return res.json({ message: "If email exists, OTP sent" });
    }

    // 🔥 generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expire = new Date(Date.now() + 10 * 60 * 1000);

    // delete old
    await db.query(
      "DELETE FROM password_resets WHERE email = ?",
      [email]
    );

    // insert new
    await db.query(
      "INSERT INTO password_resets (email, otp, expire_at, verified) VALUES (?, ?, ?, FALSE)",
      [email, otp, expire]
    );

    // send email
    await sendOtpEmail(email, otp);

    res.json({
      message: "OTP resent successfully",
    });

  } catch (err) {
    console.error("RESEND OTP ERROR:", err);
    res.status(500).json({
      message: "Error resending OTP",
    });
  }
};


module.exports = {
  updateAvatar,
  resetAvatar,
  getMyNotifications,
  markAllNotificationsRead,
  getUnreadCount,
  getMyProjectsController,
  changePasswordController,
  forgotPassword,
  verifyOtp,
  resetPassword,
  resendOtp
};
