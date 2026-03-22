const db = require("../config/db");

const getMyTasksController = async (req, res) => {
  try {
    const userId = req.user.id;

    const [tasks] = await db.query(
      `
      SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.progress_percentage,
        t.deadline,
        t.created_at,
        p.name AS project_name
      FROM task_workers tw
      JOIN workers w ON tw.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      JOIN tasks t ON tw.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE u.id = ?
      ORDER BY t.created_at DESC
    `,
      [userId],
    );

    res.json({
      message: "My tasks fetched",
      data: tasks,
    });
  } catch (err) {
    console.error("GET MY TASKS ERROR:", err);
    res.status(500).json({
      message: "Error fetching tasks",
    });
  }
};

const getMyProjectsController = async (req, res) => {
  try {
    const userId = req.user.id;

    const [projects] = await db.query(
      `
      SELECT
        p.id,
        p.name,
        p.location,
        p.status,
        p.start_date,
        p.end_date
      FROM project_workers pw
      JOIN workers w ON pw.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      JOIN projects p ON pw.project_id = p.id
      WHERE u.id = ?
    `,
      [userId],
    );

    res.json({
      message: "My projects fetched",
      data: projects,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching projects",
    });
  }
};

const submitTaskReportController = async (req, res) => {
  try {
    const { task_id, note } = req.body;
    const userId = req.user.id;

    // ❌ block if still pending
    const [existing] = await db.query(
      "SELECT * FROM task_reports WHERE task_id = ? AND status = 'pending'",
      [task_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Previous report still pending approval",
      });
    }

    // ✅ get worker
    const [w] = await db.query(
      "SELECT id FROM workers WHERE user_id = ?",
      [userId]
    );

    if (w.length === 0) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const workerId = w[0].id;
    const image = req.file ? req.file.filename : null;

    // ✅ insert report
    const [result] = await db.query(
      `INSERT INTO task_reports (task_id, worker_id, image, note)
       VALUES (?, ?, ?, ?)`,
      [task_id, workerId, image, note]
    );

    // 🔥 notify supervisor
    const [supers] = await db.query(`
      SELECT u.id
      FROM project_supervisors ps
      JOIN supervisors s ON ps.supervisor_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN tasks t ON t.project_id = ps.project_id
      WHERE t.id = ?
    `, [task_id]);

    const { io, users } = require("../server");
    const message = "New task report submitted";

    for (let s of supers) {
      await db.query(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        [s.id, message]
      );

      if (users[s.id]) {
        io.to(users[s.id]).emit("notification", { message });
      }
    }

    res.json({
      message: "Report submitted",
      report_id: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error submitting report" });
  }
};

module.exports = {
  getMyTasksController,
  getMyProjectsController,
  submitTaskReportController,
};
