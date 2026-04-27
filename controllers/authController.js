const db = require("../config/db");
const { secret } = require("../config/jwt");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? AND status = 'active'",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 🚫 worker check
    if (user.role === "worker") {
      const [[worker]] = await db.query(
        "SELECT id FROM workers WHERE user_id = ?",
        [user.id]
      );

      if (worker) {
        const [attendance] = await db.query(
          `SELECT * FROM attendance
           WHERE worker_id = ?
           AND date = CURDATE()
           AND working_hours = 0`,
          [worker.id]
        );

        if (attendance.length > 0) {
          return res.status(403).json({
            message: "You must check-out before logging in again",
          });
        }
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn: "1d" }
    );

    // ✅ base URL
    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    return res.json({
      message: "Login success",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: `${baseUrl}/uploads/avatars/${user.avatar}`, // 🔥 ADD THIS
      },
      token,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Login error",
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    const userId = req.user.id;
    const role = req.user.role;

    if (!token) {
      return res.status(400).json({
        message: "No token provided",
      });
    }

    // ✅ ONLY apply for worker
    if (role === "worker") {
      const [[worker]] = await db.query(
        "SELECT id FROM workers WHERE user_id = ?",
        [userId]
      );

      if (worker) {
        const [attendance] = await db.query(
          `SELECT * FROM attendance
           WHERE worker_id = ?
           AND date = CURDATE()
           AND working_hours = 0`, // means not checked out yet
          [worker.id]
        );

        if (attendance.length > 0) {
          return res.status(400).json({
            message: "You must check-out before logout",
          });
        }
      }
    }

    // ✅ allow logout
    await db.query("INSERT INTO token_blacklist (token) VALUES (?)", [token]);

    res.json({
      message: "Logout success",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Logout error",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.avatar,
        u.created_at,

        a.admin_level,

        s.department,
        s.hired_date AS supervisor_hired_date,

        w.skill_type,
        w.hired_date AS worker_hired_date,

        c.company_name

      FROM users u
      LEFT JOIN admins a ON u.id = a.user_id
      LEFT JOIN supervisors s ON u.id = s.user_id
      LEFT JOIN workers w ON u.id = w.user_id
      LEFT JOIN clients c ON u.id = c.user_id
      WHERE u.id = ?
      `,
      [userId]
    );

    const user = rows[0];

    const baseUrl =
      "https://construction-site-api-3uii.onrender.com/uploads/avatars";

    return res.json({
      message: "User profile fetched",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: `${baseUrl}/${user.avatar}`,
        created_at: user.created_at,

        // role-specific
        admin_level: user.admin_level || null,
        department: user.department || null,
        skill_type: user.skill_type || null,
        company_name: user.company_name || null,

        // ✅ unified hired_date
        hired_date:
          user.role === "supervisor"
            ? user.supervisor_hired_date
            : user.role === "worker"
            ? user.worker_hired_date
            : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching profile" });
  }
};
