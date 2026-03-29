const db = require("../config/db");

const addMaterialController = async (req, res) => {
  try {
    const { project_id, name, quantity, supplier, cost_per_unit } = req.body;

    // Set initial_quantity same as quantity
    const initial_quantity = quantity;

    await db.query(
      `INSERT INTO materials
       (project_id, name, quantity, initial_quantity, supplier, cost_per_unit)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [project_id, name, quantity, initial_quantity, supplier, cost_per_unit]
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
      `SELECT 
        id,
        name,
        supplier,
        cost_per_unit,
        initial_quantity,
        quantity AS remaining_quantity,
        (initial_quantity - quantity) AS used_quantity
       FROM materials
       WHERE project_id = ?`,
      [projectId]
    );

    res.json({
      message: "Materials fetched with tracking",
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
  addMaterialController,
  getMaterialsByProjectController
};