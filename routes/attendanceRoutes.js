const express = require("express");
const router = express.Router();

const {
  generateQRController,
  scanQRCheckInController,
  getTodayAttendanceController,
  getAttendanceHistoryController
} = require("../controllers/attendanceController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");

// 🔥 supervisor generate QR
router.post(
  "/generate-qr",
  verifyToken,
  checkRole("supervisor"),
  generateQRController,
);

// 🔥 2. Worker scan QR (check-in)
router.post("/scan", verifyToken, checkRole("worker"), scanQRCheckInController);

// 🔥 3. Get today attendance (supervisor/admin)
router.get("/today/:project_id", verifyToken, getTodayAttendanceController);

router.get(
  "/history/:project_id",
  verifyToken,
  getAttendanceHistoryController
);

module.exports = router;
