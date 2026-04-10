const bcrypt = require("bcryptjs");
const db = require("../config/db");
const {
  createUser,
  createSupervisor,
  checkEmail,
  createWorker,
  createClient,
} = require("../models/adminModel");

const { validateSupervisor, validateWorker, validateClient } = require("../utils/validator");

const {
  createProject,
  getAllProjects,
  updateProject,
} = require("../models/projectModel");

const { getAllWithPagination } = require("../utils/pagination");
const { buildSearchWhere } = require("../utils/search");

const createSupervisorAccount = async (req, res) => {
  try {
    const { name, email, password, phone, department } = req.body;

    const errors = validateSupervisor({
      name,
      email,
      password,
      phone,
      department,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: errors,
      });
    }

    // check email
    const exists = await checkEmail(email);
    if (exists) {
      return res.status(400).json({
        message: ["Email already exists"],
      });
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

    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    res.json({
      message: "Supervisor created successfully",
      data: {
        user_id: userId,
        name,
        email,
        phone,
        department,
        avatar: `${baseUrl}/uploads/avatars/default-avatar.png`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: ["Error creating supervisor"],
    });
  }
};

const getAllSupervisors = async (req, res) => {
  try {
    const result = await getAllWithPagination({
      baseQuery: `
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
      `,
      countQuery: `
        SELECT COUNT(*) as total
        FROM supervisors s
        JOIN users u ON s.user_id = u.id
      `,
      searchFields: ["u.name", "u.email"],

      // 🔥 FIX ambiguous column here
      sortMap: {
        id: "u.id",
        name: "u.name",
        email: "u.email",
        created_at: "u.created_at",
        department: "s.department",
        hired_date: "s.hired_date",
      },

      req,
    });

    res.json({
      result: true,
      message: "Get All Supervisors Successfully",
      data: result.data.map((u) => ({
        ...u,
        avatar: `https://construction-site-api-3uii.onrender.com/uploads/avatars/${u.avatar}`,
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      message: "Error fetching supervisors",
    });
  }
};

const getSupervisorById = async (req, res) => {
  try {
    const supervisorId = req.params.id;

    const [[supervisor]] = await db.query(
      `
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
      WHERE s.id = ?
      `,
      [supervisorId]
    );

    if (!supervisor) {
      return res.status(404).json({
        message: "Supervisor not found",
      });
    }

    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    res.json({
      message: "Get Supervisor Successfully",
      data: {
        ...supervisor,
        avatar: `${baseUrl}/uploads/avatars/${supervisor.avatar}`,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching supervisor",
    });
  }
};

const createWorkerAccount = async (req, res) => {
  try {
    const { name, email, password, phone, skill_type } = req.body;

    const errors = validateWorker({
      name,
      email,
      password,
      phone,
      skill_type,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: errors,
      });
    }

    const exists = await checkEmail(email);
    if (exists) {
      return res.status(400).json({
        message: ["Email already exists"],
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const userId = await createUser(
      name,
      email,
      hashedPassword,
      phone || null,
      "worker",
    );

    // 🔥 no hired_date now
    await createWorker(userId, skill_type, null);

    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    res.json({
      message: "Worker created successfully",
      data: {
        user_id: userId,
        name,
        email,
        phone,
        skill_type,
        avatar: `${baseUrl}/uploads/avatars/default-avatar.png`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: ["Error creating worker"],
    });
  }
};

const getAllWorkers = async (req, res) => {
  try {
    const result = await getAllWithPagination({
      baseQuery: `
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
      `,
      countQuery: `
        SELECT COUNT(*) as total
        FROM workers w
        JOIN users u ON w.user_id = u.id
      `,
      searchFields: ["u.name", "u.email", "w.skill_type"],

      sortMap: {
        id: "u.id",
        name: "u.name",
        email: "u.email",
        created_at: "u.created_at",
        skill_type: "w.skill_type",
        hired_date: "w.hired_date",
      },

      req,
    });

    res.json({
      result: true,
      message: "Get All Workers Successfully",
      data: result.data.map((u) => ({
        ...u,
        avatar: `https://construction-site-api-3uii.onrender.com/uploads/avatars/${u.avatar}`,
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      message: "Error fetching workers",
    });
  }
};

const getWorkerById = async (req, res) => {
  try {
    const workerId = req.params.id;

    const [[worker]] = await db.query(
      `
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
      WHERE w.id = ?
      `,
      [workerId]
    );

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found",
      });
    }

    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    res.json({
      message: "Get Worker Successfully",
      data: {
        ...worker,
        avatar: `${baseUrl}/uploads/avatars/${worker.avatar}`,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching worker",
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
      address,
    } = req.body;

    // ✅ VALIDATE
    const errors = validateClient({
      name,
      email,
      password,
      phone,
      company_name,
      contact_person,
      address,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: errors,
      });
    }

    // ✅ CHECK EMAIL
    const exists = await checkEmail(email);
    if (exists) {
      return res.status(400).json({
        message: ["Email already exists"],
      });
    }

    // ✅ HASH
    const hashedPassword = bcrypt.hashSync(password, 10);

    // ✅ CREATE USER
    const userId = await createUser(
      name,
      email,
      hashedPassword,
      phone || null,
      "client"
    );

    // ✅ CREATE CLIENT
    await createClient(
      userId,
      company_name,
      contact_person,
      address
    );

    // ✅ BASE URL
    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    // ✅ RESPONSE
    return res.json({
      message: "Client created successfully",
      data: {
        user_id: userId,
        name,
        email,
        avatar: `${baseUrl}/uploads/avatars/default-avatar.png`,
        phone,
        company_name,
        contact_person,
        address,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: ["Error creating client"],
    });
  }
};

const getAllClients = async (req, res) => {
  try {
    const result = await getAllWithPagination({
      baseQuery: `
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
      `,
      countQuery: `
        SELECT COUNT(*) as total
        FROM clients c
        JOIN users u ON c.user_id = u.id
      `,
      searchFields: ["u.name", "u.email", "c.company_name", "c.contact_person"],

      sortMap: {
        id: "u.id",
        name: "u.name",
        email: "u.email",
        created_at: "u.created_at",
        company_name: "c.company_name",
        contact_person: "c.contact_person",
      },

      req,
    });

    res.json({
      result: true,
      message: "Get All Clients Successfully",
      data: result.data.map((u) => ({
        ...u,
        avatar: `https://construction-site-api-3uii.onrender.com/uploads/avatars/${u.avatar}`,
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      message: "Error fetching clients",
    });
  }
};

const getClientById = async (req, res) => {
  try {
    const clientId = req.params.id;

    const [[client]] = await db.query(
      `
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
      WHERE c.id = ?
      `,
      [clientId]
    );

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    res.json({
      message: "Get Client Successfully",
      data: {
        ...client,
        avatar: `${baseUrl}/uploads/avatars/${client.avatar}`,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching client",
    });
  }
};

const createProjectController = async (req, res) => {
  try {
    const {
      name,
      location,
      client_id,
      start_date,
      end_date,
      estimated_budget,
    } = req.body;

    if (!name || !client_id) {
      return res.status(400).json({
        message: "Missing required fields",
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
      estimated_budget || 0,
    );

    return res.json({
      message: "Project created successfully",
      data: {
        project_id: projectId,
        name,
        location,
        client_id,
        status: "planning",
        thumbnail: `https://construction-site-api-3uii.onrender.com/uploads/projects/default-project.png`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error creating project",
    });
  }
};

const updateProjectThumbnail = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const filename = req.file.filename;

    await db.query("UPDATE projects SET thumbnail = ? WHERE id = ?", [
      filename,
      projectId,
    ]);

    return res.json({
      message: "Thumbnail updated successfully",
      data: {
        project_id: projectId,
        thumbnail: `https://construction-site-api-3uii.onrender.com/uploads/projects/${filename}`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating thumbnail",
    });
  }
};

const resetProjectThumbnail = async (req, res) => {
  try {
    const projectId = req.params.id;

    // optional: get old thumbnail (to delete later if you want)
    const [rows] = await db.query(
      "SELECT thumbnail FROM projects WHERE id = ?",
      [projectId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // set back to default
    await db.query(
      "UPDATE projects SET thumbnail = 'default-project.png' WHERE id = ?",
      [projectId],
    );

    return res.json({
      message: "Thumbnail reset to default",
      data: {
        project_id: projectId,
        thumbnail: `https://construction-site-api-3uii.onrender.com/uploads/projects/default-project.png`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error resetting thumbnail",
    });
  }
};

const getAllProjectsController = async (req, res) => {
  try {
    const result = await getAllWithPagination({
      baseQuery: `
        SELECT
          p.*,

          -- 👤 creator
          cu.name AS created_by_name,

          -- 🏢 client
          c.id AS client_id,
          cu2.name AS client_name,

          -- 👷 supervisor
          su.name AS supervisor_name,
          su.email AS supervisor_email,
          ps.assigned_at AS supervisor_assigned_at

        FROM projects p

        LEFT JOIN users cu ON p.created_by = cu.id

        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN users cu2 ON c.user_id = cu2.id

        LEFT JOIN project_supervisors ps ON ps.project_id = p.id
        LEFT JOIN supervisors s ON ps.supervisor_id = s.id
        LEFT JOIN users su ON s.user_id = su.id
      `,

      countQuery: `
        SELECT COUNT(*) as total
        FROM projects p
      `,

      searchFields: ["p.name"],

      sortMap: {
        id: "p.id",
        name: "p.name",
        created_at: "p.created_at",
        status: "p.status",
      },

      req,
    });

    const projects = result.data;

    for (let p of projects) {
      // ✅ creator
      p.created_by = p.created_by
        ? { id: p.created_by, name: p.created_by_name }
        : null;

      delete p.created_by_name;

      // ✅ client
      p.client = p.client_id ? { id: p.client_id, name: p.client_name } : null;

      // ❌ REMOVE from root (THIS is what you want)
      delete p.client_id;
      delete p.client_name;

      // ✅ supervisor
      p.supervisor = p.supervisor_name
        ? {
            name: p.supervisor_name,
            email: p.supervisor_email,
            assigned_at: p.supervisor_assigned_at,
          }
        : null;

      delete p.supervisor_name;
      delete p.supervisor_email;
      delete p.supervisor_assigned_at;

      // ✅ workers
      const [workers] = await db.query(
        `
        SELECT
          w.id,
          u.name,
          u.email,
          u.status,
          pw.assigned_at
        FROM project_workers pw
        JOIN workers w ON pw.worker_id = w.id
        JOIN users u ON w.user_id = u.id
        WHERE pw.project_id = ?
        `,
        [p.id],
      );

      p.workers = workers;
      p.worker_count = workers.length;

      // ✅ thumbnail
      p.thumbnail = `https://construction-site-api-3uii.onrender.com/uploads/projects/${p.thumbnail}`;
    }

    res.json({
      result: true,
      message: "Projects fetched successfully",
      data: projects,
      pagination: result.pagination,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      result: false,
      message: "Error fetching projects",
    });
  }
};

const getProjectByIdController = async (req, res) => {
  try {
    const projectId = req.params.id;

    const [[p]] = await db.query(
      `
      SELECT
        p.*,

        cu.name AS created_by_name,

        c.id AS client_id,
        cu2.name AS client_name,

        su.name AS supervisor_name,
        su.email AS supervisor_email,
        ps.assigned_at AS supervisor_assigned_at

      FROM projects p

      LEFT JOIN users cu ON p.created_by = cu.id

      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users cu2 ON c.user_id = cu2.id

      LEFT JOIN project_supervisors ps ON ps.project_id = p.id
      LEFT JOIN supervisors s ON ps.supervisor_id = s.id
      LEFT JOIN users su ON s.user_id = su.id

      WHERE p.id = ?
      `,
      [projectId]
    );

    if (!p) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // ✅ creator
    p.created_by = p.created_by
      ? { id: p.created_by, name: p.created_by_name }
      : null;

    delete p.created_by_name;

    // ✅ client
    p.client = p.client_id
      ? { id: p.client_id, name: p.client_name }
      : null;

    delete p.client_id;
    delete p.client_name;

    // ✅ supervisor
    p.supervisor = p.supervisor_name
      ? {
          name: p.supervisor_name,
          email: p.supervisor_email,
          assigned_at: p.supervisor_assigned_at,
        }
      : null;

    delete p.supervisor_name;
    delete p.supervisor_email;
    delete p.supervisor_assigned_at;

    // ✅ workers
    const [workers] = await db.query(
      `
      SELECT
        w.id,
        u.name,
        u.email,
        u.status,
        pw.assigned_at
      FROM project_workers pw
      JOIN workers w ON pw.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE pw.project_id = ?
      `,
      [p.id]
    );

    p.workers = workers;
    p.worker_count = workers.length;

    // ✅ thumbnail
    const baseUrl = "https://construction-site-api-3uii.onrender.com";
    p.thumbnail = `${baseUrl}/uploads/projects/${p.thumbnail}`;

    res.json({
      message: "Project fetched successfully",
      data: p,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching project",
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
      status,
    } = req.body;

    await updateProject(
      projectId,
      name,
      location,
      client_id,
      start_date,
      end_date,
      estimated_budget,
      status,
    );

    return res.json({
      message: "Project updated successfully",
      data: {
        project_id: projectId,
        name,
        location,
        client_id,
        status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating project",
    });
  }
};

const getAvailableSupervisors = async (req, res) => {
  try {
    const { search } = req.query;

    // ✅ use your util
    const { where, params } = buildSearchWhere(search, ["u.name", "u.email"]);

    const [rows] = await db.query(
      `
      SELECT 
        s.id,
        u.name,
        u.email,
        u.avatar
      FROM supervisors s
      JOIN users u ON s.user_id = u.id
      WHERE s.id NOT IN (
        SELECT ps.supervisor_id
        FROM project_supervisors ps
        JOIN projects p ON ps.project_id = p.id
        WHERE p.status != 'completed'
      )
      ${where ? `AND (${where.replace("WHERE", "")})` : ""}
      `,
      params,
    );

    res.json({
      message: "Available supervisors",
      data: rows.map((u) => ({
        ...u,
        avatar: `https://construction-site-api-3uii.onrender.com/uploads/avatars/${u.avatar}`,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching supervisors",
    });
  }
};

const assignSupervisorController = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { supervisor_id } = req.body;

    if (!supervisor_id) {
      return res.status(400).json({
        message: "Supervisor ID is required",
      });
    }

    // ✅ check supervisor exists
    const [sup] = await db.query(
      "SELECT user_id FROM supervisors WHERE id = ?",
      [supervisor_id],
    );

    if (sup.length === 0) {
      return res.status(404).json({
        message: "Supervisor not found",
      });
    }

    const userId = sup[0].user_id;

    // ✅ check busy (UPDATED)
    const [busy] = await db.query(
      `
      SELECT ps.id
      FROM project_supervisors ps
      JOIN projects p ON ps.project_id = p.id
      WHERE ps.supervisor_id = ?
      AND p.status != 'completed'
    `,
      [supervisor_id],
    );

    if (busy.length > 0) {
      return res.status(400).json({
        message: "Supervisor already has active project",
      });
    }

    // ✅ check already assigned to this project
    const [exist] = await db.query(
      "SELECT * FROM project_supervisors WHERE project_id = ?",
      [projectId],
    );

    if (exist.length > 0) {
      // 🔥 UPDATE (change supervisor)
      await db.query(
        "UPDATE project_supervisors SET supervisor_id = ? WHERE project_id = ?",
        [supervisor_id, projectId],
      );
    } else {
      // 🔥 INSERT (first assign)
      await db.query(
        "INSERT INTO project_supervisors (project_id, supervisor_id) VALUES (?, ?)",
        [projectId, supervisor_id],
      );
    }

    const message = `You are assigned to project ID ${projectId}`;

    // ✅ save notification
    await db.query(
      "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
      [userId, message],
    );

    // ✅ socket safe
    try {
      const { io, users } = require("../server");

      if (users && users[userId]) {
        io.to(users[userId]).emit("notification", { message });
      }
    } catch (e) {}

    res.json({
      message: "Supervisor assigned successfully",
    });
  } catch (err) {
    console.error("ASSIGN ERROR:", err);
    res.status(500).json({
      message: "Error assigning supervisor",
    });
  }
};

const getAvailableWorkers = async (req, res) => {
  try {
    const { search } = req.query;

    // ✅ use your util
    const { where, params } = buildSearchWhere(search, [
      "u.name",
      "u.email",
      "w.skill_type",
    ]);

    const [rows] = await db.query(
      `
      SELECT
        w.id,
        u.name,
        u.email,
        u.avatar,
        w.skill_type
      FROM workers w
      JOIN users u ON w.user_id = u.id
      WHERE w.id NOT IN (
        SELECT pw.worker_id
        FROM project_workers pw
        JOIN projects p ON pw.project_id = p.id
        WHERE p.status != 'completed'
      )
      ${where ? `AND (${where.replace("WHERE", "")})` : ""}
      `,
      params,
    );

    res.json({
      message: "Available workers",
      data: rows.map((u) => ({
        ...u,
        avatar: `https://construction-site-api-3uii.onrender.com/uploads/avatars/${u.avatar}`,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching workers",
    });
  }
};

const assignWorkersController = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { worker_ids } = req.body;

    if (!worker_ids || worker_ids.length === 0) {
      return res.status(400).json({
        message: "Worker IDs required",
      });
    }

    // 🔥 CHECK FIRST (IMPORTANT)
    const [existing] = await db.query(
      `SELECT worker_id FROM project_workers 
       WHERE project_id = ? 
       AND worker_id IN (?)`,
      [projectId, worker_ids],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Some workers already assigned",
        duplicate_workers: existing.map((e) => e.worker_id),
      });
    }

    // ✅ INSERT if all clean
    for (let worker_id of worker_ids) {
      await db.query(
        "INSERT INTO project_workers (project_id, worker_id) VALUES (?, ?)",
        [projectId, worker_id],
      );

      const [w] = await db.query("SELECT user_id FROM workers WHERE id = ?", [
        worker_id,
      ]);

      if (w.length > 0) {
        const userId = w[0].user_id;
        const message = `You are assigned to project ID ${projectId}`;

        await db.query(
          "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
          [userId, message],
        );
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

const removeWorkerFromProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { worker_id } = req.body;

    if (!worker_id) {
      return res.status(400).json({
        message: "Worker ID is required",
      });
    }

    // 🔥 check if exists
    const [exist] = await db.query(
      "SELECT * FROM project_workers WHERE project_id = ? AND worker_id = ?",
      [projectId, worker_id],
    );

    if (exist.length === 0) {
      return res.status(404).json({
        message: "Worker not assigned to this project",
      });
    }

    // ✅ remove
    await db.query(
      "DELETE FROM project_workers WHERE project_id = ? AND worker_id = ?",
      [projectId, worker_id],
    );

    res.json({
      message: "Worker removed from project successfully",
    });
  } catch (err) {
    console.error("REMOVE WORKER ERROR:", err);
    res.status(500).json({
      message: "Error removing worker",
    });
  }
};

const updateUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating password",
    });
  }
};

const updateUserController = async (req, res) => {
  try {
    const userId = req.params.id;

    const {
      name,
      phone,
      department,
      skill_type,
      company_name,
      contact_person,
      address,
      hired_date,
    } = req.body;

    // 🔥 check user
    const [user] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user[0].role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot update admin",
      });
    }

    const role = user[0].role;

    // ✅ update ONLY allowed fields (NO email, NO password)
    await db.query("UPDATE users SET name = ?, phone = ? WHERE id = ?", [
      name,
      phone,
      userId,
    ]);

    // 🔥 supervisor
    if (role === "supervisor") {
      await db.query(
        `UPDATE supervisors 
         SET department = ?, hired_date = ?
         WHERE user_id = ?`,
        [department || null, hired_date || null, userId],
      );
    }

    // 🔥 worker
    if (role === "worker") {
      await db.query(
        `UPDATE workers 
         SET skill_type = ?, hired_date = ?
         WHERE user_id = ?`,
        [skill_type || null, hired_date || null, userId],
      );
    }

    // 🔥 client
    if (role === "client") {
      await db.query(
        `UPDATE clients 
         SET company_name = ?, contact_person = ?, address = ?
         WHERE user_id = ?`,
        [company_name || null, contact_person || null, address || null, userId],
      );
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: {
        id: userId,
        role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
};

const updateUserStatusController = async (req, res) => {
  try {
    const userId = req.params.id;

    const [user] = await db.query(
      "SELECT id, name, email, role, status FROM users WHERE id = ?",
      [userId],
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user[0].role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot change admin status",
      });
    }

    // 🔥 TOGGLE STATUS
    const newStatus = user[0].status === "active" ? "inactive" : "active";

    await db.query("UPDATE users SET status = ? WHERE id = ?", [
      newStatus,
      userId,
    ]);

    res.json({
      success: true,
      message: `User ${newStatus === "active" ? "activated" : "deactivated"}`,
      data: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        role: user[0].role,
        status: newStatus,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating user status",
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
  updateUserStatusController,
  getSupervisorById,
  getWorkerById,
  getClientById,
  getProjectByIdController
};
