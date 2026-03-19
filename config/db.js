const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// This looks for ca.pem in the root of your project
const caPath = path.join(process.cwd(), "ca.pem");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  // queueLimit: 0,
  // ssl: {
  //   ca: fs.readFileSync(caPath),
  //   rejectUnauthorized: true,
  // },
});

module.exports = pool;