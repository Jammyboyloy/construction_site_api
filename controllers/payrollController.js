const db = require("../config/db");

// ✅ GENERATE PAYROLL
const generatePayrollController = async (req, res) => {
  try {
    const { project_id, month } = req.body;

    const [rows] = await db.query(`
      SELECT
        w.id AS worker_id,
        u.name,
        SUM(a.working_hours) AS total_hours,
        w.rate_per_hour
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE a.project_id = ?
      AND DATE_FORMAT(a.date, '%Y-%m') = ?
      AND a.working_hours > 0
      GROUP BY w.id
    `, [project_id, month]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No attendance" });
    }

    const results = [];

    for (let r of rows) {
      const salary = r.total_hours * r.rate_per_hour;

      const [exist] = await db.query(`
        SELECT id FROM payrolls
        WHERE worker_id = ? AND project_id = ? AND month = ?
      `, [r.worker_id, project_id, month]);

      if (exist.length === 0) {
        await db.query(`
          INSERT INTO payrolls
          (worker_id, project_id, month, total_hours, net_salary, rate_per_hour, status)
          VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `, [
          r.worker_id,
          project_id,
          month,
          r.total_hours,
          salary,
          r.rate_per_hour
        ]);
      }

      results.push({
        name: r.name,
        total_hours: r.total_hours,
        rate_per_hour: r.rate_per_hour,
        salary
      });
    }

    res.json({
      message: "Payroll generated",
      data: results
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating payroll" });
  }
};

// ✅ MARK AS PAID
const markPayrollPaidController = async (req, res) => {
  try {
    const { payroll_id } = req.body;

    await db.query(`
      UPDATE payrolls
      SET status = 'paid', paid_at = NOW()
      WHERE id = ?
    `, [payroll_id]);

    res.json({ message: "Marked as paid" });

  } catch (err) {
    res.status(500).json({ message: "Error updating payroll" });
  }
};

// ✅ GET ALL PAYROLL (ADMIN/SUPERVISOR)
const getPayrollController = async (req, res) => {
  try {
    const { project_id, month } = req.query;

    const [rows] = await db.query(`
      SELECT 
        p.id,
        u.name,
        p.total_hours,
        p.net_salary,
        p.rate_per_hour,
        p.status,
        p.paid_at,
        p.month
      FROM payrolls p
      JOIN workers w ON p.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE p.project_id = ?
      AND p.month = ?
    `, [project_id, month]);

    res.json({ data: rows });

  } catch (err) {
    res.status(500).json({ message: "Error fetching payroll" });
  }
};

// ✅ WORKER VIEW OWN PAYROLL
const getMyPayrollController = async (req, res) => {
  try {
    const userId = req.user.id;

    const [worker] = await db.query(
      "SELECT id FROM workers WHERE user_id = ?",
      [userId]
    );

    if (worker.length === 0) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const workerId = worker[0].id;

    const [rows] = await db.query(`
      SELECT
        month,
        total_hours,
        net_salary,
        rate_per_hour,
        status,
        paid_at
      FROM payrolls
      WHERE worker_id = ?
      ORDER BY month DESC
    `, [workerId]);

    res.json({
      message: "My payroll",
      total: rows.length,
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching payroll" });
  }
};

const updateWorkerRateController = async (req, res) => {
  try {
    const { worker_id, rate_per_hour } = req.body;

    if (!worker_id || !rate_per_hour) {
      return res.status(400).json({ message: "Missing data" });
    }

    await db.query(`
      UPDATE workers
      SET rate_per_hour = ?
      WHERE id = ?
    `, [rate_per_hour, worker_id]);

    res.json({
      message: "Rate updated",
      worker_id,
      new_rate: rate_per_hour
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating rate" });
  }
};

module.exports = {
  generatePayrollController,
  markPayrollPaidController,
  getPayrollController,
  getMyPayrollController,
  updateWorkerRateController
};