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

// 🔹 Create worker
const createWorker = async (userId, skill_type, hired_date) => {
  await db.query(
    `INSERT INTO workers (user_id, skill_type, hired_date)
     VALUES (?, ?, ?)`,
    [userId, skill_type, hired_date]
  );
};

const createClient = async (userId, company_name, contact_person, address) => {
  const [result] = await db.query(
    `INSERT INTO clients (user_id, company_name, contact_person, address)
     VALUES (?, ?, ?, ?)`,
    [userId, company_name, contact_person, address]
  );

  return result.insertId;
};

module.exports = {
  checkEmail,
  createUser,
  createSupervisor,
  createWorker,
  createClient
};