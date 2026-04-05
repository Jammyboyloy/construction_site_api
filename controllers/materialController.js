const db = require("../config/db");

const { getAllWithPagination } = require("../utils/pagination");
const { validateMaterial } = require("../utils/validator");

const fs = require("fs");
const path = require("path");

const updateMaterialImageController = async (req, res) => {
  try {
    const materialId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    const [[material]] = await db.query(
      "SELECT image FROM materials WHERE id = ?",
      [materialId],
    );

    if (!material) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    const newImage = req.file.filename;

    if (material.image && material.image !== "default-material.png") {
      const oldPath = path.join("uploads/materials", material.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await db.query("UPDATE materials SET image = ? WHERE id = ?", [
      newImage,
      materialId,
    ]);

    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    res.json({
      message: "Material image updated",
      image: `${baseUrl}/uploads/materials/${newImage}`, // ✅ FULL URL
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating image",
    });
  }
};

const resetMaterialImageController = async (req, res) => {
  try {
    const materialId = req.params.id;

    const [[material]] = await db.query(
      "SELECT image FROM materials WHERE id = ?",
      [materialId],
    );

    if (!material) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    if (material.image && material.image !== "default-material.png") {
      const oldPath = path.join("uploads/materials", material.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await db.query("UPDATE materials SET image = ? WHERE id = ?", [
      "default-material.png",
      materialId,
    ]);

    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    res.json({
      message: "Material image reset to default",
      image: `${baseUrl}/uploads/materials/default-material.png`, // ✅ FULL URL
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error resetting image",
    });
  }
};

const addMaterialController = async (req, res) => {
  try {
    const { project_id, name, quantity, supplier, cost_per_unit } = req.body;

    const errors = validateMaterial({
      project_id,
      name,
      quantity,
      supplier,
      cost_per_unit,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: errors,
      });
    }

    const initial_quantity = quantity;

    const image = req.file ? req.file.filename : "default-material.png";

    const [result] = await db.query(
      `INSERT INTO materials
       (project_id, name, quantity, initial_quantity, supplier, cost_per_unit, image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        project_id,
        name,
        quantity,
        initial_quantity,
        supplier,
        cost_per_unit,
        image,
      ],
    );

    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    res.json({
      message: "Material added successfully",
      data: {
        id: result.insertId,
        project_id,
        name,
        quantity,
        supplier,
        cost_per_unit,
        image: `${baseUrl}/uploads/materials/${image}`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: ["Error adding material"],
    });
  }
};

const getMaterialsByProjectController = async (req, res) => {
  try {
    const projectId = req.params.project_id;
    const baseUrl = "https://construction-site-api-3uii.onrender.com";

    const result = await getAllWithPagination({
      baseQuery: `
        SELECT
          id,
          name,
          supplier,
          cost_per_unit,
          initial_quantity,
          quantity AS remaining_quantity,
          (initial_quantity - quantity) AS used_quantity,
          image   -- ✅ ADD THIS
        FROM materials
        WHERE project_id = ${projectId}
      `,

      countQuery: `
        SELECT COUNT(*) as total
        FROM materials
        WHERE project_id = ${projectId}
      `,

      searchFields: ["name", "supplier"],

      sortMap: {
        id: "id",
        name: "name",
        supplier: "supplier",
        cost_per_unit: "cost_per_unit",
        remaining_quantity: "quantity",
      },

      req,
    });

    res.json({
      result: true,
      message: "Materials fetched with tracking",
      data: result.data.map((m) => ({
        ...m,
        image: `${baseUrl}/uploads/materials/${m.image}`, // ✅ FULL URL
      })),
      pagination: result.pagination,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      result: false,
      message: "Error fetching materials",
    });
  }
};

module.exports = {
  addMaterialController,
  getMaterialsByProjectController,
  updateMaterialImageController,
  resetMaterialImageController,
};
