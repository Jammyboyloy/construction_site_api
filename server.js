const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const pool = require("./config/db");
const { Server } = require("socket.io");

const app = express();

// static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// middleware
app.use(express.json());
app.use(cors());
const startCronJobs = require("./utils/cron");

// 🔥 SOCKET.IO SETUP
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// store online users
const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Automatically register if userId is sent via auth or query
  const userId = socket.handshake.auth.userId || socket.handshake.query.userId;
  if (userId) {
    users[userId] = socket.id;
    console.log(`User ${userId} registered automatically`);
  }

  socket.on("register", (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} registered via event`);
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
// 🔥 IMPORTANT: Export this BEFORE requiring routes that use 'io'
module.exports = { io, users };

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

startCronJobs();

// ❗ CHANGE THIS (IMPORTANT)
server.listen(3000, () => {
  console.log("Server Running on port 3000");
});

// start server
// const PORT = process.env.PORT || 3000;

// server.listen(PORT, async () => {
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
