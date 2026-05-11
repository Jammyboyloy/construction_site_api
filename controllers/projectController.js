const db = require("../config/db");

// 🔥 GET BUDGET STATUS
const getBudgetStatusController = async (req, res) => {
  try {
    const projectId = req.params.id;

    // ✅ get project budget
    const [[project]] = await db.query(
      "SELECT estimated_budget FROM projects WHERE id = ?",
      [projectId],
    );

    // ✅ calculate total used cost
    const [[cost]] = await db.query(
      `
      SELECT 
        SUM(dm.used_quantity * m.cost_per_unit) AS total_cost
      FROM daily_materials dm
      JOIN materials m ON dm.material_id = m.id
      JOIN daily_reports dr ON dm.daily_report_id = dr.id
      WHERE dr.project_id = ?
      `,
      [projectId],
    );

    // ✅ safe values
    const used = Number(cost.total_cost || 0);
    const budget = Number(project?.estimated_budget || 0);
    const remaining = budget - used;

    // 🔥 progress = spent % of budget
    const progress = budget > 0 ? (used / budget) * 100 : 0;

    res.json({
      budget: budget.toFixed(2),
      used: used.toFixed(2),
      remaining: remaining.toFixed(2),
      progress: Number(progress.toFixed(2)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching budget status",
    });
  }
};

module.exports = {
  getBudgetStatusController,
};
