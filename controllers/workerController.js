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
        p.*,

        -- 👤 creator
        MAX(cu.name) AS created_by_name,

        -- 🏢 client
        MAX(c.id) AS client_id,
        MAX(cu2.name) AS client_name,

        -- 👷 supervisor
        MAX(su.name) AS supervisor_name,
        MAX(su.email) AS supervisor_email,
        MAX(ps.assigned_at) AS supervisor_assigned_at

      FROM project_workers pw
      JOIN workers w ON pw.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      JOIN projects p ON pw.project_id = p.id

      LEFT JOIN users cu ON p.created_by = cu.id

      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users cu2 ON c.user_id = cu2.id

      LEFT JOIN project_supervisors ps ON ps.project_id = p.id
      LEFT JOIN supervisors s ON ps.supervisor_id = s.id
      LEFT JOIN users su ON s.user_id = su.id

      WHERE u.id = ?
      GROUP BY p.id
      `,
      [userId]
    );

    const result = projects.map(p => {
      // ✅ creator
      const created_by = p.created_by
        ? { id: p.created_by, name: p.created_by_name }
        : null;

      // ✅ client
      const client = p.client_id
        ? { id: p.client_id, name: p.client_name }
        : null;

      // ✅ supervisor
      const supervisor = p.supervisor_name
        ? {
            name: p.supervisor_name,
            email: p.supervisor_email,
            assigned_at: p.supervisor_assigned_at,
          }
        : null;

      return {
        id: p.id,
        name: p.name,
        location: p.location,
        status: p.status,
        start_date: p.start_date,
        end_date: p.end_date,
        estimated_budget: p.estimated_budget,

        created_by,
        client,
        supervisor,

        thumbnail: `https://construction-site-api-3uii.onrender.com/uploads/projects/${p.thumbnail}`,
        created_at: p.created_at
      };
    });

    res.json({
      message: "My projects fetched",
      data: result,
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
