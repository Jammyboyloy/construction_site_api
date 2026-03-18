const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const app = express();

// middleware
app.use(express.json());
app.use(cors());

// routes
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    const [rows] = await pool.query("SELECT 1");
    console.log("Database connected successfully!");
    console.log("Test result:", rows);
  } catch (error) {
    console.log("Database connection failed!");
    console.log(error);
  }
});