const express = require("express");
const router = express.Router();

// controllers
const {
  getMyProjectsController,
  createTasksController,
  assignWorkersToTaskController,
  getTasksByProjectController,
  reviewTaskReportController,
  getTaskReportsController,
  getDailyReportsController,
  createDailyReportController,
} = require("../controllers/supervisorController");

// middleware
const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");

// routes
router.get(
  "/my-projects",
  verifyToken,
  checkRole("supervisor"),
  getMyProjectsController
);

router.post(
  "/tasks",
  verifyToken,
  checkRole("supervisor"),
  createTasksController
);

router.post(
  "/task/:id/assign-workers",
  verifyToken,
  checkRole("supervisor"),
  assignWorkersToTaskController
);

router.get(
  "/project/:project_id/tasks",
  verifyToken,
  getTasksByProjectController
);

router.get(
  "/task-reports",
  verifyToken,
  checkRole("supervisor"),
  getTaskReportsController
);

router.put(
  "/task-report/:id",
  verifyToken,
  checkRole("supervisor"),
  reviewTaskReportController
);

// supervisor
router.post(
  "/daily-report",
  verifyToken,
  checkRole("supervisor"),
  createDailyReportController
);

// admin/client
router.get(
  "/daily-reports/:project_id",
  verifyToken,
  getDailyReportsController
);


module.exports = router;