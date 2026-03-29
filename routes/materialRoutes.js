const express = require("express");
const router = express.Router();

const {
  addMaterialController,
  getMaterialsByProjectController
} = require("../controllers/materialController");

const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");

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