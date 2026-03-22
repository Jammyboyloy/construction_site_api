const db = require("../config/db");
const { secret } = require("../config/jwt");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔥 VALIDATE EMPTY
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 🔥 VALIDATE EMAIL FORMAT
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // check user
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    // 🔥 DON'T reveal which is wrong (security)
    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = rows[0];

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // create token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      secret,
      { expiresIn: "1d" },
    );

    return res.json({
      message: "Login success",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error" });
  }
};

exports.getMe = async (req, res) => {
  // console.log("USER:", req.user);
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
        w.skill_type,
        c.company_name

      FROM users u
      LEFT JOIN admins a ON u.id = a.user_id
      LEFT JOIN supervisors s ON u.id = s.user_id
      LEFT JOIN workers w ON u.id = w.user_id
      LEFT JOIN clients c ON u.id = c.user_id
      WHERE u.id = ?
    `,
      [userId],
    );

    const user = rows[0];

    return res.json({
      message: "User profile fetched",
      data: {
        ...user,
        avatar: `http://localhost:3000/uploads/avatars/${user.avatar}`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching profile" });
  }
};
