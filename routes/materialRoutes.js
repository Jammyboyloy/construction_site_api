const express = require("express");
const router = express.Router();

const {
  addMaterialController,
  getMaterialsByProjectController,
  updateMaterialImageController,
  resetMaterialImageController
} = require("../controllers/materialController");

const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");

router.post(
  "/materials",
  verifyToken,
  checkRole("admin"),
  upload.single("image"),
  addMaterialController,
);

router.get(
  "/materials/project/:project_id",
  verifyToken,
  getMaterialsByProjectController,
);

router.put(
  "/materials/:id/image",
  upload.single("image"),
  updateMaterialImageController,
);

router.put("/materials/:id/reset-image", resetMaterialImageController);

module.exports = router;
