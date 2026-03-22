const db = require("../config/db");

// ✅ CREATE PROJECT (TEXT ONLY)
const createProject = async (
  name,
  location,
  client_id,
  created_by,
  start_date,
  end_date,
  estimated_budget
) => {
  const [result] = await db.query(
    `INSERT INTO projects 
    (name, location, client_id, created_by, start_date, end_date, estimated_budget, thumbnail, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'default-project.png', 'planning')`,
    [name, location, client_id, created_by, start_date, end_date, estimated_budget]
  );

  return result.insertId;
};

const getAllProjects = async () => {
  const [rows] = await db.query(`
    SELECT
      p.id AS project_id,
      p.name,
      p.location,
      p.status,
      p.start_date,
      p.end_date,
      p.estimated_budget,
      p.thumbnail,
      p.created_at,

      c.company_name,
      u.name AS created_by_name,

      MAX(su.name) AS supervisor_name,
      MAX(su.email) AS supervisor_email,
      MAX(ps.assigned_at) AS supervisor_assigned_at

    FROM projects p

    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN users u ON p.created_by = u.id

    LEFT JOIN project_supervisors ps ON p.id = ps.project_id
    LEFT JOIN supervisors s ON ps.supervisor_id = s.id
    LEFT JOIN users su ON s.user_id = su.id

    GROUP BY p.id
  `);

  return rows;
};

const updateProject = async (
  id,
  name,
  location,
  client_id,
  start_date,
  end_date,
  estimated_budget,
  status
) => {
  await db.query(
    `UPDATE projects SET
      name = ?,
      location = ?,
      client_id = ?,
      start_date = ?,
      end_date = ?,
      estimated_budget = ?,
      status = ?
    WHERE id = ?`,
    [name, location, client_id, start_date, end_date, estimated_budget, status, id]
  );
};

module.exports = { createProject, getAllProjects, updateProject };
