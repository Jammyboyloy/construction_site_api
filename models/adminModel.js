const db = require("../config/db");

// 🔹 Check email exists
const checkEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );
  return rows.length > 0;
};

// 🔹 Create user
const createUser = async (name, email, password, phone, role) => {
  const [result] = await db.query(
    `INSERT INTO users (name, email, password, phone, role)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, password, phone, role]
  );

  return result.insertId;
};

// 🔹 Create supervisor
const createSupervisor = async (userId, department) => {
  await db.query(
    `INSERT INTO supervisors (user_id, department)
     VALUES (?, ?)`,
    [userId, department]
  );
};

module.exports = {
  checkEmail,
  createUser,
  createSupervisor
};