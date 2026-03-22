const db = require("../config/db");

// 🔥 GET BUDGET STATUS
const getBudgetStatusController = async (req, res) => {
  try {
    const projectId = req.params.id;

    // ✅ get project budget
    const [[project]] = await db.query(
      "SELECT estimated_budget FROM projects WHERE id = ?",
      [projectId]
    );

    // ✅ calculate total cost
    const [[cost]] = await db.query(`
      SELECT 
        SUM(dm.used_quantity * m.cost_per_unit) AS total_cost
      FROM daily_materials dm
      JOIN materials m ON dm.material_id = m.id
      JOIN daily_reports dr ON dm.daily_report_id = dr.id
      WHERE dr.project_id = ?
    `, [projectId]);

    const used = cost.total_cost || 0;
    const budget = project.estimated_budget || 0;

    res.json({
      budget,
      used,
      remaining: budget - used
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching budget status"
    });
  }
};

module.exports = {
  getBudgetStatusController
};