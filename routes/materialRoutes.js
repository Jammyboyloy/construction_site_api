const express = require("express");
const router = express.Router();

const {
  addMaterialController,
  getMaterialsByProjectController,
  updateMaterialImageController,
  resetMaterialImageController,
  getMaterialByIdController
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

router.get(
  "/material/:id",
  verifyToken,
  getMaterialByIdController,
);

router.put(
  "/materials/:id/image",
  upload.single("image"),
  verifyToken,
  updateMaterialImageController,
);

router.put("/materials/:id/reset-image", verifyToken, resetMaterialImageController);

module.exports = router;
