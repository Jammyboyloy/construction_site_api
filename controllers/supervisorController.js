const db = require("../config/db");

const { getAllWithPagination } = require("../utils/pagination");

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

      FROM project_supervisors ps
      JOIN supervisors s ON ps.supervisor_id = s.id
      JOIN projects p ON ps.project_id = p.id

      LEFT JOIN users cu ON p.created_by = cu.id

      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users cu2 ON c.user_id = cu2.id

      LEFT JOIN project_supervisors ps2 ON ps2.project_id = p.id
      LEFT JOIN supervisors s2 ON ps2.supervisor_id = s2.id
      LEFT JOIN users su ON s2.user_id = su.id

      WHERE s.user_id = ?
      GROUP BY p.id
      `,
      [userId]
    );

    const result = projects.map(p => ({
      id: p.id,
      name: p.name,
      location: p.location,
      status: p.status,
      start_date: p.start_date,
      end_date: p.end_date,
      estimated_budget: p.estimated_budget,

      created_by: p.created_by
        ? { id: p.created_by, name: p.created_by_name }
        : null,

      client: p.client_id
        ? { id: p.client_id, name: p.client_name }
        : null,

      supervisor: p.supervisor_name
        ? {
            name: p.supervisor_name,
            email: p.supervisor_email,
            assigned_at: p.supervisor_assigned_at,
          }
        : null,

      thumbnail: `https://construction-site-api-3uii.onrender.com/uploads/projects/${p.thumbnail}`,
      created_at: p.created_at
    }));

    res.json({
      message: "My projects fetched successfully",
      data: result,
    });

  } catch (err) {
    console.error("GET MY PROJECTS ERROR:", err);
    res.status(500).json({
      message: "Error fetching projects",
    });
  }
};

const createTasksController = async (req, res) => {
  try {
    const { project_id, tasks } = req.body;
    const supervisorUserId = req.user.id;

    if (!project_id || !tasks || tasks.length === 0) {
      return res.status(400).json({
        message: "Project ID and tasks are required",
      });
    }

    const createdTasks = [];

    // ✅ CREATE TASKS
    for (let t of tasks) {
      const [result] = await db.query(
        `INSERT INTO tasks (project_id, title, description, deadline, assigned_by, status, progress_percentage)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          project_id,
          t.title,
          t.description || null,
          t.deadline || null,
          supervisorUserId,
          "pending",
          0,
        ],
      );

      createdTasks.push({
        id: result.insertId,
        title: t.title,
      });
    }

    // 🔥 MESSAGE
    const message = `New tasks created for Project ID ${project_id}`;

    // =========================
    // 🔥 NOTIFY WORKERS (PROJECT)
    // =========================
    const [workers] = await db.query(
      `
      SELECT u.id
      FROM project_workers pw
      JOIN workers w ON pw.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE pw.project_id = ?
    `,
      [project_id],
    );

    const { io, users } = require("../server");

    for (let w of workers) {
      // save DB
      await db.query(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        [w.id, message],
      );

      // realtime
      if (users[w.id]) {
        io.to(users[w.id]).emit("notification", { message });
      }
    }

    // =========================
    // 🔥 NOTIFY CLIENT
    // =========================
    const [client] = await db.query(
      `
      SELECT u.id
      FROM projects p
      JOIN clients c ON p.client_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE p.id = ?
    `,
      [project_id],
    );

    if (client.length > 0) {
      const clientId = client[0].id;

      await db.query(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        [clientId, message],
      );

      if (users[clientId]) {
        io.to(users[clientId]).emit("notification", { message });
      }
    }

    // =========================
    // 🔥 NOTIFY ADMINS
    // =========================
    const [admins] = await db.query(
      "SELECT id FROM users WHERE role = 'admin'",
    );

    for (let a of admins) {
      await db.query(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        [a.id, message],
      );

      if (users[a.id]) {
        io.to(users[a.id]).emit("notification", { message });
      }
    }

    // =========================
    // ✅ RESPONSE
    // =========================
    res.json({
      message: "Tasks created successfully",
      data: createdTasks,
    });
  } catch (err) {
    console.error("CREATE TASKS ERROR:", err);
    res.status(500).json({
      message: "Error creating tasks",
    });
  }
};

const assignWorkersToTaskController = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { worker_ids } = req.body;

    if (!worker_ids || worker_ids.length === 0) {
      return res.status(400).json({
        message: "Worker IDs required",
      });
    }

    // ✅ check task exist
    const [task] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);

    if (task.length === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // 🔥 IMPORTANT: check workers belong to project
    const [validWorkers] = await db.query(
      `SELECT pw.worker_id
       FROM project_workers pw
       WHERE pw.project_id = ?
       AND pw.worker_id IN (?)`,
      [task[0].project_id, worker_ids],
    );

    const validIds = validWorkers.map((w) => w.worker_id);

    if (validIds.length !== worker_ids.length) {
      return res.status(400).json({
        message: "Some workers are not in this project",
        invalid_workers: worker_ids.filter((id) => !validIds.includes(id)),
      });
    }

    const message = `You are assigned to task: ${task[0].title}`;

    const { io, users } = require("../server");

    for (let worker_id of worker_ids) {
      // ✅ prevent duplicate
      const [exists] = await db.query(
        "SELECT * FROM task_workers WHERE task_id = ? AND worker_id = ?",
        [taskId, worker_id],
      );

      if (exists.length > 0) continue;

      // ✅ assign
      await db.query(
        "INSERT INTO task_workers (task_id, worker_id) VALUES (?, ?)",
        [taskId, worker_id],
      );

      // ✅ get user_id
      const [w] = await db.query("SELECT user_id FROM workers WHERE id = ?", [
        worker_id,
      ]);

      if (w.length > 0) {
        const userId = w[0].user_id;

        // save notification
        await db.query(
          "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
          [userId, message],
        );

        // realtime
        if (users && users[userId]) {
          io.to(users[userId]).emit("notification", { message });
        }
      }
    }

    res.json({
      message: "Workers assigned successfully",
    });
  } catch (err) {
    console.error("ASSIGN WORKERS ERROR:", err);
    res.status(500).json({
      message: "Error assigning workers",
    });
  }
};

const removeWorkerFromTaskController = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { worker_id } = req.body;

    // check task
    const [task] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);

    if (task.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    // check exist
    const [exists] = await db.query(
      "SELECT * FROM task_workers WHERE task_id = ? AND worker_id = ?",
      [taskId, worker_id],
    );

    if (exists.length === 0) {
      return res.status(404).json({
        message: "Worker not assigned to this task",
      });
    }

    // ✅ remove
    await db.query(
      "DELETE FROM task_workers WHERE task_id = ? AND worker_id = ?",
      [taskId, worker_id],
    );

    // get user_id
    const [w] = await db.query("SELECT user_id FROM workers WHERE id = ?", [
      worker_id,
    ]);

    if (w.length > 0) {
      const userId = w[0].user_id;

      const message = `You were removed from task: ${task[0].title}`;

      // save notification
      await db.query(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        [userId, message],
      );

      // realtime
      try {
        const { io, users } = require("../server");
        if (users && users[userId]) {
          io.to(users[userId]).emit("notification", { message });
        }
      } catch (e) {}
    }

    res.json({
      message: "Worker removed from task",
    });
  } catch (err) {
    console.error("REMOVE WORKER ERROR:", err);
    res.status(500).json({
      message: "Error removing worker",
    });
  }
};

const getTasksByProjectController = async (req, res) => {
  try {
    const projectId = req.params.project_id;

    // ✅ summary
    const [[{ total_tasks }]] = await db.query(
      "SELECT COUNT(*) as total_tasks FROM tasks WHERE project_id = ?",
      [projectId],
    );

    const [[{ project_progress }]] = await db.query(
      "SELECT AVG(progress_percentage) as project_progress FROM tasks WHERE project_id = ?",
      [projectId],
    );

    const [tasks] = await db.query(
      `
      SELECT *
      FROM tasks
      WHERE project_id = ?
      ORDER BY created_at DESC
    `,
      [projectId],
    );

    const result = [];

    for (let t of tasks) {
      const [workers] = await db.query(
        `
        SELECT 
          w.id,
          u.name,
          u.email
        FROM task_workers tw
        JOIN workers w ON tw.worker_id = w.id
        JOIN users u ON w.user_id = u.id
        WHERE tw.task_id = ?
      `,
        [t.id],
      );

      result.push({
        task_id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        progress: t.progress_percentage,
        deadline: t.deadline,
        total_workers: workers.length,
        workers: workers,
      });
    }

    res.json({
      message: "Project tasks detail",
      summary: {
        total_tasks,
        project_progress: Math.round(project_progress || 0),
      },
      tasks: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching tasks",
    });
  }
};

const getUnassignedTasks = async (req, res) => {
  try {
    const projectId = req.params.project_id;

    const [tasks] = await db.query(
      `
      SELECT *
      FROM tasks t
      WHERE t.project_id = ?
      AND NOT EXISTS (
        SELECT 1 FROM task_workers tw WHERE tw.task_id = t.id
      )
      ORDER BY t.created_at DESC
    `,
      [projectId],
    );

    res.json({
      message: "Unassigned tasks",
      data: tasks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching unassigned tasks",
    });
  }
};

const getAssignedTasks = async (req, res) => {
  try {
    const projectId = req.params.project_id;

    const [tasks] = await db.query(
      `
      SELECT DISTINCT t.*
      FROM tasks t
      JOIN task_workers tw ON tw.task_id = t.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
      `,
      [projectId]
    );

    const result = [];

    for (let t of tasks) {
      const [workers] = await db.query(
        `
        SELECT
          w.id,
          u.name,
          u.email
        FROM task_workers tw
        JOIN workers w ON tw.worker_id = w.id
        JOIN users u ON w.user_id = u.id
        WHERE tw.task_id = ?
        `,
        [t.id]
      );

      result.push({
        task_id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        progress: t.progress_percentage,
        deadline: t.deadline,
        total_workers: workers.length,
        workers
      });
    }

    res.json({
      message: "Assigned tasks",
      data: result,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching assigned tasks",
    });
  }
};

const getTaskReportsController = async (req, res) => {
  try {
    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    const [reports] = await db.query(`
      SELECT tr.*, t.title
      FROM task_reports tr
      JOIN tasks t ON tr.task_id = t.id
      ORDER BY tr.created_at DESC
    `);

    const result = [];

    for (let r of reports) {
      const [workers] = await db.query(
        `
        SELECT u.name
        FROM task_workers tw
        JOIN workers w ON tw.worker_id = w.id
        JOIN users u ON w.user_id = u.id
        WHERE tw.task_id = ?
      `,
        [r.task_id],
      );

      result.push({
        id: r.id,
        task_id: r.task_id,
        task_title: r.title,
        team: workers.map((w) => w.name),
        image: r.image ? `${baseUrl}/uploads/reports/${r.image}` : null,
        note: r.note,
        status: r.status,
        created_at: r.created_at,
      });
    }

    res.json({
      message: "Reports fetched",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching reports" });
  }
};

const reviewTaskReportController = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { status, progress } = req.body;

    // update report
    await db.query("UPDATE task_reports SET status = ? WHERE id = ?", [
      status,
      reportId,
    ]);

    // get task
    const [[report]] = await db.query(
      "SELECT task_id FROM task_reports WHERE id = ?",
      [reportId],
    );

    const taskId = report.task_id;

    // update task
    let taskStatus = "pending";

    if (progress > 0 && progress < 100) taskStatus = "in_progress";
    if (progress === 100) taskStatus = "completed";

    await db.query(
      "UPDATE tasks SET progress_percentage = ?, status = ? WHERE id = ?",
      [progress, taskStatus, taskId],
    );

    // 🔥 notify ALL workers
    const [workers] = await db.query(
      `
      SELECT u.id
      FROM task_workers tw
      JOIN workers w ON tw.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE tw.task_id = ?
    `,
      [taskId],
    );

    const { io, users } = require("../server");

    const message =
      status === "approved"
        ? `Report approved (${progress}%)`
        : "Report rejected";

    for (let w of workers) {
      await db.query(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        [w.id, message],
      );

      if (users[w.id]) {
        io.to(users[w.id]).emit("notification", { message });
      }
    }

    res.json({
      message: "Report reviewed",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error reviewing report" });
  }
};

const createDailyReportController = async (req, res) => {
  try {
    const { project_id, summary, materials, expenses } = req.body; // ✅ add expenses
    const userId = req.user.id;

    const { io, users } = require("../server");

    // ✅ get supervisor
    const [s] = await db.query("SELECT id FROM supervisors WHERE user_id = ?", [
      userId,
    ]);

    if (s.length === 0) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    const supervisorId = s[0].id;

    // =========================
    // 🔥 VALIDATE MATERIALS
    // =========================
    if (materials && materials.length > 0) {
      for (let m of materials) {
        const [mat] = await db.query(
          "SELECT * FROM materials WHERE id = ? AND project_id = ?",
          [m.material_id, project_id],
        );

        if (mat.length === 0) {
          return res.status(400).json({
            message: `Material ID ${m.material_id} not found`,
          });
        }

        if (mat[0].quantity < m.used_quantity) {
          return res.status(400).json({
            message: `Not enough stock for ${mat[0].name}`,
          });
        }
      }
    }

    // =========================
    // 🔥 AUTO PROGRESS
    // =========================
    const [[{ project_progress }]] = await db.query(
      "SELECT AVG(progress_percentage) as project_progress FROM tasks WHERE project_id = ?",
      [project_id],
    );

    const finalProgress = Math.round(project_progress || 0);

    // =========================
    // ✅ INSERT REPORT
    // =========================
    const [result] = await db.query(
      `INSERT INTO daily_reports
      (project_id, supervisor_id, report_date, summary, progress)
      VALUES (?, ?, CURDATE(), ?, ?)`,
      [project_id, supervisorId, summary, finalProgress],
    );

    const daily_report_id = result.insertId;

    // =========================
    // 🔥 MATERIALS + STOCK
    // =========================
    if (materials && materials.length > 0) {
      for (let m of materials) {
        await db.query(
          `INSERT INTO daily_materials
          (daily_report_id, material_id, used_quantity, note)
          VALUES (?, ?, ?, ?)`,
          [daily_report_id, m.material_id, m.used_quantity, m.note || null],
        );

        await db.query(
          `UPDATE materials
           SET quantity = quantity - ?
           WHERE id = ?`,
          [m.used_quantity, m.material_id],
        );
      }
    }

    // =========================
    // 🔥 NEW: EXPENSES INSERT
    // =========================
    if (expenses && expenses.length > 0) {
      for (let e of expenses) {
        await db.query(
          `INSERT INTO expenses
          (project_id, daily_report_id, created_by, type, amount, expense_date, description)
          VALUES (?, ?, ?, ?, ?, CURDATE(), ?)`,
          [
            project_id,
            daily_report_id,
            userId,
            e.type,
            e.amount,
            e.description || null,
          ],
        );
      }
    }

    // =========================
    // 🔔 NOTIFY ADMIN
    // =========================
    const [admins] = await db.query(`
      SELECT u.id AS user_id
      FROM admins a
      JOIN users u ON a.user_id = u.id
    `);

    for (let a of admins) {
      const message = `📊 New daily report created for project ${project_id}`;

      await db.query(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        [a.user_id, message],
      );

      if (users[a.user_id]) {
        io.to(users[a.user_id]).emit("notification", { message });
      }
    }

    // =========================
    // 🔔 NOTIFY CLIENT
    // =========================
    const [[project]] = await db.query(
      "SELECT client_id FROM projects WHERE id = ?",
      [project_id],
    );

    if (project && project.client_id) {
      const [[clientUser]] = await db.query(
        `SELECT u.id AS user_id
         FROM clients c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [project.client_id],
      );

      if (clientUser) {
        const message = `📈 Project update: new daily report submitted`;

        await db.query(
          "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
          [clientUser.user_id, message],
        );

        if (users[clientUser.user_id]) {
          io.to(users[clientUser.user_id]).emit("notification", { message });
        }
      }
    }

    // =========================
    // ✅ RESPONSE
    // =========================
    res.json({
      message: "Report created + materials + expenses saved",
      daily_report_id,
      progress: finalProgress,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error creating report",
    });
  }
};

const getDailyReportsController = async (req, res) => {
  try {
    const projectId = req.params.project_id;
    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    const resultData = await getAllWithPagination({
      baseQuery: `
        SELECT 
          dr.*, 
          u.name AS supervisor_name
        FROM daily_reports dr
        JOIN supervisors s ON dr.supervisor_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE dr.project_id = ${projectId}
      `,

      countQuery: `
        SELECT COUNT(*) as total
        FROM daily_reports dr
        WHERE dr.project_id = ${projectId}
      `,

      searchFields: ["u.name", "dr.summary"],

      sortMap: {
        id: "dr.id",
        report_date: "dr.report_date",
        progress: "dr.progress",
        created_at: "dr.created_at",
      },

      req,
    });

    const reports = resultData.data;
    const finalResult = [];

    for (let r of reports) {
      // ✅ images
      const [images] = await db.query(
        `
        SELECT tr.image
        FROM task_reports tr
        JOIN tasks t ON tr.task_id = t.id
        WHERE t.project_id = ?
        AND DATE(tr.created_at) = ?
        AND tr.status = 'approved'
        `,
        [projectId, r.report_date],
      );

      // ✅ materials
      const [materials] = await db.query(
        `
        SELECT
          m.name,
          dm.used_quantity,
          dm.note
        FROM daily_materials dm
        JOIN materials m ON dm.material_id = m.id
        WHERE dm.daily_report_id = ?
        `,
        [r.id],
      );

      // ✅ expenses
      const [expenses] = await db.query(
        `
        SELECT
          type,
          amount,
          description
        FROM expenses
        WHERE daily_report_id = ?
        `,
        [r.id],
      );

      finalResult.push({
        id: r.id,
        project_id: r.project_id,
        supervisor_name: r.supervisor_name,
        report_date: r.report_date,
        summary: r.summary,
        progress: r.progress,

        images: images.map((img) =>
          img.image ? `${baseUrl}/uploads/reports/${img.image}` : null,
        ),

        materials,
        expenses,

        created_at: r.created_at,
      });
    }

    res.json({
      result: true,
      message: "Daily reports fetched",
      data: finalResult,
      pagination: resultData.pagination,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      result: false,
      message: "Error fetching reports",
    });
  }
};

const getProjectWorkersController = async (req, res) => {
  try {
    const projectId = req.params.id;

    const result = await getAllWithPagination({
      baseQuery: `
        SELECT
          w.id AS worker_id,
          u.name,
          u.email,
          u.avatar,
          w.skill_type,
          w.rate_per_hour
        FROM project_workers pw
        JOIN workers w ON pw.worker_id = w.id
        JOIN users u ON w.user_id = u.id
        WHERE pw.project_id = ${projectId}
      `,

      countQuery: `
        SELECT COUNT(*) as total
        FROM project_workers pw
        JOIN workers w ON pw.worker_id = w.id
        WHERE pw.project_id = ${projectId}
      `,

      searchFields: ["u.name", "u.email", "w.skill_type"],

      sortMap: {
        id: "w.id",
        name: "u.name",
        email: "u.email",
        skill_type: "w.skill_type",
        rate_per_hour: "w.rate_per_hour"
      },

      req
    });

    res.json({
      result: true,
      message: "Project workers",
      total: result.data.length,
      data: result.data.map(u => ({
        ...u,
        avatar: `https://construction-site-api-3uii.onrender.com/uploads/avatars/${u.avatar}`
      })),
      pagination: result.pagination
    });

  } catch (err) {
    console.error("GET PROJECT WORKERS ERROR:", err);
    res.status(500).json({
      result: false,
      message: "Error fetching workers",
    });
  }
};

module.exports = {
  getMyProjectsController,
  createTasksController,
  assignWorkersToTaskController,
  getTasksByProjectController,
  getTaskReportsController,
  reviewTaskReportController,
  createDailyReportController,
  getDailyReportsController,
  removeWorkerFromTaskController,
  getProjectWorkersController,
  getUnassignedTasks,
  getAssignedTasks,
};
