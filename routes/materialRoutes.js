const express = require("express");
const router = express.Router();

const {
  getTotalMaterialUsageController,
  addMaterialController,
  getMaterialsByProjectController
} = require("../controllers/materialController");

const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");

// 🔥 total material used
router.get(
  "/total/:project_id",
  verifyToken,
  getTotalMaterialUsageController
);

router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  addMaterialController
);

router.get(
  "/project/:project_id",
  verifyToken,
  getMaterialsByProjectController
);

module.exports = router;