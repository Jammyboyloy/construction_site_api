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

    const { io } = require("../server");

    // ✅ get worker
    const [w] = await db.query(
      "SELECT id FROM workers WHERE user_id = ?",
      [userId]
    );

    if (w.length === 0) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const workerId = w[0].id;

    // ✅ check today
    const [exist] = await db.query(
      `SELECT * FROM attendance
       WHERE worker_id = ?
       AND project_id = ?
       AND date = CURDATE()`,
      [workerId, project_id]
    );

    // =========================
    // 🟢 CHECK-IN
    // =========================
    if (exist.length === 0) {
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

      await db.query(
        `INSERT INTO attendance
        (worker_id, project_id, date, working_hours, status, check_in)
        VALUES (?, ?, CURDATE(), 0, 'present', NOW())`,
        [workerId, project_id]
      );

      io.emit("attendance_update", {
        type: "checkin",
        worker_id: workerId,
        project_id
      });

      return res.json({ message: "Check-in success" });
    }

    // =========================
    // 🔴 CHECK-OUT
    // =========================
    const record = exist[0];

    if (record.working_hours > 0) {
      return res.status(400).json({ message: "Already checked out" });
    }

    // ✅ FIXED HERE 🔥
    await db.query(
      `UPDATE attendance
       SET 
         working_hours = TIMESTAMPDIFF(MINUTE, check_in, NOW()) / 60,
         check_out = NOW()
       WHERE id = ?`,
      [record.id]
    );

    io.emit("attendance_update", {
      type: "checkout",
      worker_id: workerId,
      project_id
    });

    return res.json({ message: "Check-out success" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error scanning QR" });
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
        a.check_in,
        a.check_out
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE a.project_id = ?
      AND DATE(a.date) = CURDATE()
      ORDER BY a.check_in DESC
    `, [projectId]);

    res.json({
      message: "Today attendance",
      total: data.length,
      data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

const getAttendanceHistoryController = async (req, res) => {
  try {
    const projectId = req.params.project_id;

    const [data] = await db.query(`
      SELECT
        u.name,
        a.date,
        a.check_in,
        a.check_out,
        a.working_hours,
        a.status
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE a.project_id = ?
      ORDER BY a.date DESC, a.check_in DESC
    `, [projectId]);

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
    res.status(500).json({ message: "Error fetching history" });
  }
};

module.exports = {
  generateQRController,
  scanQRCheckInController,
  getTodayAttendanceController,
  getAttendanceHistoryController
};