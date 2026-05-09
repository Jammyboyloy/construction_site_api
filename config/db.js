const mysql = require("mysql2");
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
  queueLimit: 0,
  // ssl: {
  //   ca: fs.readFileSync(caPath),
  //   rejectUnauthorized: true,
  // },
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to MySQL database successfully!");
    connection.release(); 
  }
});

module.exports = pool.promise();