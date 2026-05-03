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

const submitTaskReportController = async (req, res) => {
  try {
    const { task_id, note } = req.body;
    const userId = req.user.id;

    // ✅ get worker
    const [[worker]] = await db.query(
      "SELECT id FROM workers WHERE user_id = ?",
      [userId]
    );

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const workerId = worker.id;

    // ✅ check task + project + assignment
    const [[taskCheck]] = await db.query(
      `
      SELECT 
        t.id AS task_id,
        t.project_id
      FROM tasks t
      JOIN task_workers tw ON tw.task_id = t.id
      WHERE t.id = ? AND tw.worker_id = ?
      `,
      [task_id, workerId]
    );

    if (!taskCheck) {
      return res.status(400).json({
        message: "Task not found or you are not assigned to this task",
      });
    }

    // ✅ prevent duplicate pending (PER WORKER)
    const [existing] = await db.query(
      `
      SELECT * 
      FROM task_reports 
      WHERE task_id = ? AND worker_id = ? AND status = 'pending'
      `,
      [task_id, workerId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Your previous report is still pending",
      });
    }

    const image = req.file ? req.file.filename : null;

    // ✅ insert
    const [result] = await db.query(
      `
      INSERT INTO task_reports (task_id, worker_id, image, note)
      VALUES (?, ?, ?, ?)
      `,
      [task_id, workerId, image, note]
    );

    // 🔥 notify supervisor (ONLY project related)
    const [supers] = await db.query(
      `
      SELECT u.id
      FROM project_supervisors ps
      JOIN supervisors s ON ps.supervisor_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE ps.project_id = ?
      `,
      [taskCheck.project_id] // ✅ correct project
    );

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
      message: "Report submitted successfully",
      report_id: result.insertId,
      project_id: taskCheck.project_id, // ✅ now clear
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error submitting report" });
  }
};

module.exports = {
  getMyTasksController,
  submitTaskReportController,
};
