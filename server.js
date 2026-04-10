const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const pool = require("./config/db");
const { server } = require("socket.io");

const app = express();

// static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// middleware
app.use(express.json());
app.use(cors());
const startCronJobs = require("./utils/cron");

// routes
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/admin", adminRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/user", userRoutes);

const supervisorRoutes = require("./routes/supervisorRoutes");
app.use("/supervisor", supervisorRoutes);

const workerRoutes = require("./routes/workerRoutes");
app.use("/worker", workerRoutes);

const materialRoutes = require("./routes/materialRoutes");
app.use("/api", materialRoutes);

const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

const attendanceRoutes = require("./routes/attendanceRoutes");
app.use("/api/attendance", attendanceRoutes);

const payrollRoutes = require("./routes/payrollRoutes");
app.use("/api/payroll", payrollRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// 🔥 SOCKET.IO SETUP
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// store online users
const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    users[userId] = socket.id;
  });

  socket.on("disconnect", () => {
    for (let id in users) {
      if (users[id] === socket.id) {
        delete users[id];
      }
    }
    console.log("User disconnected");
  });
});

// export for controller use
module.exports = { io, users };

startCronJobs();

// ❗ CHANGE THIS (IMPORTANT)
// server.listen(3000, () => {
//   console.log("Server Running on port 3000");
// });

// start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
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
