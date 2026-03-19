const bcrypt = require("bcryptjs");
const db = require("../config/db");
const {
  createUser,
  createSupervisor,
  checkEmail,
  createWorker,
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
      avatar: `http://localhost:3000/uploads/avatars/default-avatar.png`,
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
        u.avatar,
        u.created_at,
        s.department,
        s.hired_date
      FROM supervisors s
      JOIN users u ON s.user_id = u.id
    `);

    res.json({
      message: "Supervisors fetched successfully",
      data: rows.map((user) => ({
        ...user,
        avatar: `http://localhost:3000/uploads/avatars/${user.avatar}`,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching supervisors",
    });
  }
};

const createWorkerAccount = async (req, res) => {
  try {
    const { name, email, password, phone, skill_type, hired_date } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // check email
    const exists = await checkEmail(email);
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // create user
    const userId = await createUser(
      name,
      email,
      hashedPassword,
      phone || null,
      "worker",
    );

    // create worker profile
    await createWorker(userId, skill_type, hired_date);

    res.json({
      message: "Worker created successfully",
      user_id: userId,
      avatar: `http://localhost:3000/uploads/avatars/default-avatar.png`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating worker" });
  }
};

const getAllWorkers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        w.id AS worker_id,
        u.id AS user_id,
        u.name,
        u.email,
        u.phone,
        u.status,
        u.avatar,
        u.created_at,
        w.skill_type,
        w.hired_date
      FROM workers w
      JOIN users u ON w.user_id = u.id
    `);

    res.json({
      message: "Workers fetched successfully",
      data: rows.map((user) => ({
        ...user,
        avatar: `http://localhost:3000/uploads/avatars/${user.avatar}`,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching workers",
    });
  }
};

module.exports = {
  createSupervisorAccount,
  getAllSupervisors,
  createWorkerAccount,
  getAllWorkers,
};
