const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// middleware
app.use(express.json());
app.use(cors());

// routes
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/admin", adminRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/user", userRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(3000, () => {
  console.log("Server Running on port 3000");
});

// start server
// const PORT = process.env.PORT || 3000;

// app.listen(PORT, async () => {
//   console.log(`Server running on port ${PORT}`);

//   try {
//     const [rows] = await pool.query("SELECT 1");
//     console.log("Database connected successfully!");
//     console.log("Test result:", rows);
//   } catch (error) {
//     console.log("Database connection failed!");
//     console.log(error);
//   }
// });
