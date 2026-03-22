const bcrypt = require("bcryptjs");
const db = require("../config/db");
const {
  createUser,
  createSupervisor,
  checkEmail,
  createWorker,
  createClient
} = require("../models/adminModel");

const createSupervisorAccount = async (req, res) => {
  try {
    const { name, email, password, phone, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔥 CHECK EMAIL FIRST
    const exists = await checkEmail(email);
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const userId = await createUser(
      name,
      email,
      hashedPassword,
      phone || null,
      "supervisor",
    );

    await createSupervisor(userId, department);

    res.json({
      message: "Supervisor created successfully",
      data: {
        user_id: userId,
        name: name,
        avatar: `http://localhost:3000/uploads/avatars/default-avatar.png`,
        email: email,
        phone: phone,
        department: department,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating supervisor" });
  }
};


const getAllSupervisors = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.id AS supervisor_id,
        u.id AS user_id,
        u.name,
        u.email,
        u.phone,
        u.status,
        u.avatar,
        u.created_at,
        s.department,
        s.hired_date
      FROM supervisors s
      JOIN users u ON s.user_id = u.id
    `);

    res.json({
      message: "Supervisors fetched successfully",
      data: rows.map((user) => ({
        ...user,
        avatar: `http://localhost:3000/uploads/avatars/${user.avatar}`,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching supervisors",
    });
  }
};

const createWorkerAccount = async (req, res) => {
  try {
    const { name, email, password, phone, skill_type, hired_date } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // check email
    const exists = await checkEmail(email);
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // create user
    const userId = await createUser(
      name,
      email,
      hashedPassword,
      phone || null,
      "worker",
    );

    // create worker profile
    await createWorker(userId, skill_type, hired_date);

    res.json({
      message: "Worker created successfully",
      data: {
        user_id: userId,
        name: name,
        email: email,
        avatar: `http://localhost:3000/uploads/avatars/default-avatar.png`,
        phone: phone,
        skill_type: skill_type,
        hired_date: hired_date
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating worker" });
  }
};

const getAllWorkers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        w.id AS worker_id,
        u.id AS user_id,
        u.name,
        u.email,
        u.phone,
        u.status,
        u.avatar,
        u.created_at,
        w.skill_type,
        w.hired_date
      FROM workers w
      JOIN users u ON w.user_id = u.id
    `);

    res.json({
      message: "Workers fetched successfully",
      data: rows.map((user) => ({
        ...user,
        avatar: `http://localhost:3000/uploads/avatars/${user.avatar}`,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching workers",
    });
  }
};

const createClientAccount = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      company_name,
      contact_person,
      address
    } = req.body;

    if (!name || !email || !password || !company_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = await checkEmail(email);
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const userId = await createUser(
      name,
      email,
      hashedPassword,
      phone || null,
      "client"
    );

    await createClient(
      userId,
      company_name,
      contact_person || name,
      address || null
    );

    return res.json({
      message: "Client created successfully",
      data: {
        user_id: userId,
        name,
        email,
        avatar: `http://localhost:3000/uploads/avatars/default-avatar.png`,
        phone,
        company_name,
        contact_person: contact_person || name,
        address,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating client" });
  }
};

const getAllClients = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        c.id AS client_id,
        u.id AS user_id,
        u.name,
        u.email,
        u.phone,
        u.status,
        u.avatar,
        u.created_at,
        c.company_name,
        c.contact_person,
        c.address
      FROM clients c
      JOIN users u ON c.user_id = u.id
    `);

    return res.json({
      message: "Clients fetched successfully",
      data: rows.map((user) => ({
        ...user,
        avatar: `http://localhost:3000/uploads/avatars/${user.avatar}`,
      })),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching clients",
    });
  }
};

const { createProject, getAllProjects, updateProject } = require("../models/projectModel");

const createProjectController = async (req, res) => {
  try {
    const {
      name,
      location,
      client_id,
      start_date,
      end_date,
      estimated_budget
    } = req.body;

    if (!name || !client_id) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    const created_by = req.user.id;

    const projectId = await createProject(
      name,
      location,
      client_id,
      created_by,
      start_date || null,
      end_date || null,
      estimated_budget || 0
    );

    return res.json({
      message: "Project created successfully",
      data: {
        project_id: projectId,
        name,
        location,
        client_id,
        status: "planning",
        thumbnail: `http://localhost:3000/uploads/projects/default-project.png`
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error creating project"
    });
  }
};

const updateProjectThumbnail = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    const filename = req.file.filename;

    await db.query(
      "UPDATE projects SET thumbnail = ? WHERE id = ?",
      [filename, projectId]
    );

    return res.json({
      message: "Thumbnail updated successfully",
      data: {
        project_id: projectId,
        thumbnail: `http://localhost:3000/uploads/projects/${filename}`
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating thumbnail"
    });
  }
};

const resetProjectThumbnail = async (req, res) => {
  try {
    const projectId = req.params.id;

    // optional: get old thumbnail (to delete later if you want)
    const [rows] = await db.query(
      "SELECT thumbnail FROM projects WHERE id = ?",
      [projectId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    // set back to default
    await db.query(
      "UPDATE projects SET thumbnail = 'default-project.png' WHERE id = ?",
      [projectId]
    );

    return res.json({
      message: "Thumbnail reset to default",
      data: {
        project_id: projectId,
        thumbnail: `http://localhost:3000/uploads/projects/default-project.png`
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error resetting thumbnail"
    });
  }
};

const getAllProjectsController = async (req, res) => {
  try {
    const projects = await getAllProjects();

    for (let p of projects) {
      // supervisor object
      p.supervisor = p.supervisor_name
        ? {
            name: p.supervisor_name,
            email: p.supervisor_email,
            assigned_at: p.supervisor_assigned_at
          }
        : null;

      delete p.supervisor_name;
      delete p.supervisor_email;
      delete p.supervisor_assigned_at;

      // get workers
      const [workers] = await db.query(`
        SELECT 
          w.id,
          u.name,
          u.email,
          pw.assigned_at
        FROM project_workers pw
        JOIN workers w ON pw.worker_id = w.id
        JOIN users u ON w.user_id = u.id
        WHERE pw.project_id = ?
      `, [p.project_id]);

      p.workers = workers;
      p.worker_count = workers.length

      p.thumbnail = `http://localhost:3000/uploads/projects/${p.thumbnail}`;
    }

    res.json({
      message: "Projects fetched successfully",
      data: projects
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching projects"
    });
  }
};

const updateProjectController = async (req, res) => {
  try {
    const projectId = req.params.id;

    const {
      name,
      location,
      client_id,
      start_date,
      end_date,
      estimated_budget,
      status
    } = req.body;

    await updateProject(
      projectId,
      name,
      location,
      client_id,
      start_date,
      end_date,
      estimated_budget,
      status
    );

    return res.json({
      message: "Project updated successfully",
      data: {
        project_id: projectId,
        name,
        location,
        client_id,
        status
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating project"
    });
  }
};

const getAvailableSupervisors = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, u.name
      FROM supervisors s
      JOIN users u ON s.user_id = u.id
      WHERE s.id NOT IN (
        SELECT ps.supervisor_id
        FROM project_supervisors ps
        JOIN projects p ON ps.project_id = p.id
        WHERE p.status != 'completed'
      )
    `);

    res.json({
      message: "Available supervisors",
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching supervisors" });
  }
};

const assignSupervisorController = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { supervisor_id } = req.body;

    if (!supervisor_id) {
      return res.status(400).json({
        message: "Supervisor ID is required"
      });
    }

    // ✅ check supervisor exists
    const [sup] = await db.query(
      "SELECT user_id FROM supervisors WHERE id = ?",
      [supervisor_id]
    );

    if (sup.length === 0) {
      return res.status(404).json({
        message: "Supervisor not found"
      });
    }

    const userId = sup[0].user_id;

    // ✅ check busy (UPDATED)
    const [busy] = await db.query(`
      SELECT ps.id
      FROM project_supervisors ps
      JOIN projects p ON ps.project_id = p.id
      WHERE ps.supervisor_id = ?
      AND p.status != 'completed'
    `, [supervisor_id]);

    if (busy.length > 0) {
      return res.status(400).json({
        message: "Supervisor already has active project"
      });
    }

    // ✅ check already assigned to this project
    const [exist] = await db.query(
      "SELECT * FROM project_supervisors WHERE project_id = ?",
      [projectId]
    );

    if (exist.length > 0) {
      // 🔥 UPDATE (change supervisor)
      await db.query(
        "UPDATE project_supervisors SET supervisor_id = ? WHERE project_id = ?",
        [supervisor_id, projectId]
      );
    } else {
      // 🔥 INSERT (first assign)
      await db.query(
        "INSERT INTO project_supervisors (project_id, supervisor_id) VALUES (?, ?)",
        [projectId, supervisor_id]
      );
    }

    const message = `You are assigned to project ID ${projectId}`;

    // ✅ save notification
    await db.query(
      "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
      [userId, message]
    );

    // ✅ socket safe
    try {
      const { io, users } = require("../server");

      if (users && users[userId]) {
        io.to(users[userId]).emit("notification", { message });
      }
    } catch (e) {}

    res.json({
      message: "Supervisor assigned successfully"
    });

  } catch (err) {
    console.error("ASSIGN ERROR:", err);
    res.status(500).json({
      message: "Error assigning supervisor"
    });
  }
};

const getAvailableWorkers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT w.id, u.name, u.email
      FROM workers w
      JOIN users u ON w.user_id = u.id
      WHERE w.id NOT IN (
        SELECT pw.worker_id
        FROM project_workers pw
        JOIN projects p ON pw.project_id = p.id
        WHERE p.status != 'completed'
      )
    `);

    res.json({
      message: "Available workers",
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching workers"
    });
  }
};

const assignWorkersController = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { worker_ids } = req.body;

    if (!worker_ids || worker_ids.length === 0) {
      return res.status(400).json({
        message: "Worker IDs required"
      });
    }

    // 🔥 CHECK FIRST (IMPORTANT)
    const [existing] = await db.query(
      `SELECT worker_id FROM project_workers 
       WHERE project_id = ? 
       AND worker_id IN (?)`,
      [projectId, worker_ids]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Some workers already assigned",
        duplicate_workers: existing.map(e => e.worker_id)
      });
    }

    // ✅ INSERT if all clean
    for (let worker_id of worker_ids) {
      await db.query(
        "INSERT INTO project_workers (project_id, worker_id) VALUES (?, ?)",
        [projectId, worker_id]
      );

      const [w] = await db.query(
        "SELECT user_id FROM workers WHERE id = ?",
        [worker_id]
      );

      if (w.length > 0) {
        const userId = w[0].user_id;
        const message = `You are assigned to project ID ${projectId}`;

        await db.query(
          "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
          [userId, message]
        );
      }
    }

    res.json({
      message: "Workers assigned successfully"
    });

  } catch (err) {
    console.error("ASSIGN WORKERS ERROR:", err);
    res.status(500).json({
      message: "Error assigning workers"
    });
  }
};

const removeWorkerFromProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { worker_id } = req.body;

    if (!worker_id) {
      return res.status(400).json({
        message: "Worker ID is required"
      });
    }

    // 🔥 check if exists
    const [exist] = await db.query(
      "SELECT * FROM project_workers WHERE project_id = ? AND worker_id = ?",
      [projectId, worker_id]
    );

    if (exist.length === 0) {
      return res.status(404).json({
        message: "Worker not assigned to this project"
      });
    }

    // ✅ remove
    await db.query(
      "DELETE FROM project_workers WHERE project_id = ? AND worker_id = ?",
      [projectId, worker_id]
    );

    res.json({
      message: "Worker removed from project successfully"
    });

  } catch (err) {
    console.error("REMOVE WORKER ERROR:", err);
    res.status(500).json({
      message: "Error removing worker"
    });
  }
};

const updateUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password is required"
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    await db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );

    res.json({
      message: "Password updated successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating password"
    });
  }
};

const updateUserController = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, phone, department } = req.body;

    // 🔥 check user exists
    const [user] = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // ✅ update users table
    await db.query(
      "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?",
      [name, email, phone, userId]
    );

    // 🔥 if supervisor → update department
    if (user[0].role === "supervisor") {
      await db.query(
        "UPDATE supervisors SET department = ? WHERE user_id = ?",
        [department, userId]
      );
    }

    res.json({
      message: "User updated successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating user"
    });
  }
};

const deleteUserController = async (req, res) => {
  try {
    const userId = req.params.id;

    // 🔥 check user
    const [user] = await db.query(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // ❌ block admin delete
    if (user[0].role === "admin") {
      return res.status(403).json({
        message: "Cannot delete admin"
      });
    }

    // ✅ delete related tables first
    if (user[0].role === "supervisor") {
      await db.query("DELETE FROM supervisors WHERE user_id = ?", [userId]);
    }

    if (user[0].role === "worker") {
      await db.query("DELETE FROM workers WHERE user_id = ?", [userId]);
    }

    if (user[0].role === "client") {
      await db.query("DELETE FROM clients WHERE user_id = ?", [userId]);
    }

    // ✅ delete user
    await db.query("DELETE FROM users WHERE id = ?", [userId]);

    res.json({
      message: "User deleted successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error deleting user"
    });
  }
};

module.exports = {
  createSupervisorAccount,
  getAllSupervisors,
  createWorkerAccount,
  getAllWorkers,
  createClientAccount,
  getAllClients,
  createProjectController,
  updateProjectThumbnail, 
  resetProjectThumbnail,
  getAllProjectsController,
  updateProjectController,
  getAvailableSupervisors,
  assignSupervisorController,
  getAvailableWorkers,
  assignWorkersController,
  removeWorkerFromProject,
  updateUserPassword,
  updateUserController,
  deleteUserController
};
