const QRCode = require("qrcode");
const db = require("../config/db");

const generateQRController = async (req, res) => {
  try {
    const { project_id } = req.body;

    // 🔥 create random token
    const token = Math.random().toString(36).substring(2);

    // 🔥 save token (expire in 10 min)
    await db.query(
      `INSERT INTO qr_tokens (project_id, token, expire_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [project_id, token]
    );

    // 🔥 data inside QR
    const qrData = JSON.stringify({
      project_id,
      token
    });

    // 🔥 generate QR image (base64)
    const qrImage = await QRCode.toDataURL(qrData);

    res.json({
      message: "QR generated",
      qr_data: { project_id, token }, // for testing
      qr_image: qrImage               // for frontend
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error generating QR"
    });
  }
};

const scanQRCheckInController = async (req, res) => {
  try {
    const { project_id, token } = req.body;
    const userId = req.user.id;

    const { io, users } = require("../server");

    // ✅ 1. get worker
    const [w] = await db.query(
      "SELECT id FROM workers WHERE user_id = ?",
      [userId]
    );

    if (w.length === 0) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const workerId = w[0].id;

    // ✅ 2. check today attendance
    const [exist] = await db.query(
      `SELECT * FROM attendance 
       WHERE worker_id = ? 
       AND project_id = ? 
       AND date = CURDATE()`,
      [workerId, project_id]
    );

    // =========================
    // 🟢 CHECK-IN (FIRST SCAN)
    // =========================
    if (exist.length === 0) {
      // 🔥 validate QR ONLY for check-in
      const [qr] = await db.query(
        `SELECT * FROM qr_tokens 
         WHERE token = ? 
         AND project_id = ? 
         AND expire_at > NOW()`,
        [token, project_id]
      );

      if (qr.length === 0) {
        return res.status(400).json({ message: "Invalid or expired QR" });
      }

      // insert attendance
      await db.query(
        `INSERT INTO attendance
        (worker_id, project_id, date, working_hours, status, created_at)
        VALUES (?, ?, CURDATE(), 0, 'present', NOW())`,
        [workerId, project_id]
      );

      // notification
      const message = `Checked in successfully (Project ${project_id})`;

      await db.query(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        [userId, message]
      );

      // realtime
      io.emit("attendance_update", {
        type: "checkin",
        worker_id: workerId,
        project_id
      });

      return res.json({ message: "Check-in success" });
    }

    // =========================
    // 🔴 CHECK-OUT (SECOND SCAN)
    // =========================
    const record = exist[0];

    // prevent double checkout
    if (record.working_hours > 0) {
      return res.status(400).json({ message: "Already checked out" });
    }

    // update working hours
    await db.query(
      `UPDATE attendance
       SET working_hours = TIMESTAMPDIFF(HOUR, created_at, NOW())
       WHERE id = ?`,
      [record.id]
    );

    // notification
    const message = `Checked out successfully (Project ${project_id})`;

    await db.query(
      "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
      [userId, message]
    );

    // realtime
    io.emit("attendance_update", {
      type: "checkout",
      worker_id: workerId,
      project_id
    });

    return res.json({ message: "Check-out success" });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error scanning QR"
    });
  }
};

const getTodayAttendanceController = async (req, res) => {
  try {
    const projectId = req.params.project_id;

    const [data] = await db.query(`
      SELECT 
        u.name,
        a.date,
        a.status,
        a.created_at
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE a.project_id = ?
      AND DATE(a.date) = CURDATE()
      ORDER BY a.created_at DESC
    `, [projectId]);

    res.json({
      message: "Today attendance",
      total: data.length,
      data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching attendance"
    });
  }
};

const getAttendanceHistoryController = async (req, res) => {
  try {
    const projectId = req.params.project_id;

    // ✅ 1. daily records
    const [data] = await db.query(`
      SELECT
        u.name,
        a.date,
        a.created_at AS check_in,
        a.working_hours,
        a.status
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE a.project_id = ?
      ORDER BY a.date DESC, a.created_at DESC
    `, [projectId]);

    // ✅ 2. total hours per worker
    const [totals] = await db.query(`
      SELECT 
        u.name,
        SUM(a.working_hours) AS total_hours
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE a.project_id = ?
      AND a.working_hours > 0
      GROUP BY a.worker_id
    `, [projectId]);

    res.json({
      message: "Attendance history",
      total_records: data.length,
      data,
      total_hours: totals
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching history"
    });
  }
};

module.exports = {
  generateQRController,
  scanQRCheckInController,
  getTodayAttendanceController,
  getAttendanceHistoryController
};