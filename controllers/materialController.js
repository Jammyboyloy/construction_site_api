const db = require("../config/db");

// 🔥 GET TOTAL MATERIAL USED (per project)
const getTotalMaterialUsageController = async (req, res) => {
  try {
    const projectId = req.params.project_id;

    const [data] = await db.query(`
      SELECT 
        m.name,
        SUM(dm.used_quantity) as total_used
      FROM daily_materials dm
      JOIN materials m ON dm.material_id = m.id
      JOIN daily_reports dr ON dm.daily_report_id = dr.id
      WHERE dr.project_id = ?
      GROUP BY m.id
    `, [projectId]);

    res.json({
      message: "Total material usage",
      data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching material usage"
    });
  }
};

const addMaterialController = async (req, res) => {
  try {
    const { project_id, name, quantity, supplier, cost_per_unit } = req.body;

    await db.query(
      `INSERT INTO materials
      (project_id, name, quantity, supplier, cost_per_unit)
      VALUES (?, ?, ?, ?, ?)`,
      [project_id, name, quantity, supplier, cost_per_unit]
    );

    res.json({
      message: "Material added successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error adding material"
    });
  }
};

const getMaterialsByProjectController = async (req, res) => {
  try {
    const projectId = req.params.project_id;

    const [materials] = await db.query(
      `SELECT id, name, quantity, cost_per_unit, supplier
       FROM materials
       WHERE project_id = ?`,
      [projectId]
    );

    res.json({
      message: "Materials fetched",
      data: materials
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching materials"
    });
  }
};

module.exports = {
  getTotalMaterialUsageController,
  addMaterialController,
  getMaterialsByProjectController
};