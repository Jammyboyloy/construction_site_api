const express = require("express");
const router = express.Router();

const upload = require("../middlewares/uploadMiddleware");

const {
  getMyTasksController,
  getMyProjectsController,
  submitTaskReportController,
} = require("../controllers/workerController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");

// 👷 worker upload report
router.post(
  "/task-report",
  verifyToken,
  checkRole("worker"),
  upload.single("image"),
  submitTaskReportController,
);

router.get("/my-tasks", verifyToken, checkRole("worker"), getMyTasksController);

router.get(
  "/my-projects",
  verifyToken,
  checkRole("worker"),
  getMyProjectsController,
);

module.exports = router;
