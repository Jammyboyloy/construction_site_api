const bcrypt = require("bcryptjs");
const db = require("../config/db");
const {
  createUser,
  createSupervisor,
  checkEmail,
} = require("../models/adminModel");

const createSupervisorAccount = async (req, res) => {
  try {
    const { name, email, password, phone, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔥 CHECK EMAIL FIRST
    const exists = await checkEmail(email);
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const userId = await createUser(
      name,
      email,
      hashedPassword,
      phone || null,
      "supervisor",
    );

    await createSupervisor(userId, department);

    res.json({
      message: "Supervisor created successfully",
      user_id: userId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating supervisor" });
  }
};

const getAllSupervisors = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.id AS supervisor_id,
        u.id AS user_id,
        u.name,
        u.email,
        u.phone,
        u.status,
        s.department,
        s.hired_date
      FROM supervisors s
      JOIN users u ON s.user_id = u.id
    `);

    res.json({
      message: "Supervisors fetched successfully",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching supervisors",
    });
  }
};

module.exports = { createSupervisorAccount, getAllSupervisors };
