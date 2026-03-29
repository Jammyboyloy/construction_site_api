const express = require("express");
const router = express.Router();

const {
  createSupervisorAccount,
  createWorkerAccount,
  createClientAccount,
  getAllSupervisors,
  getAllWorkers,
  getAllClients,
  createProjectController,
  updateProjectThumbnail,
  resetProjectThumbnail,
  getAllProjectsController,
  updateProjectController,
  getAvailableSupervisors,
  assignSupervisorController,
  getAvailableWorkers,
  assignWorkersController,
  updateUserController,
  updateUserPassword,
  updateUserStatusController,
  removeWorkerFromProject
} = require("../controllers/adminController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");

router.post(
  "/create-supervisor",
  verifyToken,
  checkRole("admin"),
  createSupervisorAccount,
);

router.get("/supervisors", verifyToken, checkRole("admin"), getAllSupervisors);

router.post(
  "/create-worker",
  verifyToken,
  checkRole("admin"),
  createWorkerAccount,
);

router.get("/workers", verifyToken, checkRole("admin"), getAllWorkers);

router.post(
  "/create-client",
  verifyToken,
  checkRole("admin"),
  createClientAccount,
);

router.get("/clients", verifyToken, checkRole("admin"), getAllClients);

router.post(
  "/create-project",
  verifyToken,
  checkRole("admin"),
  createProjectController
);

router.put(
  "/project/:id/thumbnail",
  verifyToken,
  checkRole("admin"),
  upload.single("thumbnail"),
  updateProjectThumbnail
);

router.put(
  "/project/:id/reset-thumbnail",
  verifyToken,
  checkRole("admin"),
  resetProjectThumbnail
);

router.get(
  "/projects",
  verifyToken,
  checkRole("admin"),
  getAllProjectsController
);

router.put(
  "/project/:id",
  verifyToken,
  checkRole("admin"),
  updateProjectController
);

router.get(
  "/available-supervisors",
  verifyToken,
  checkRole("admin"),
  getAvailableSupervisors
);

router.put(
  "/project/:id/assign-supervisor",
  verifyToken,
  checkRole("admin"),
  assignSupervisorController
);

router.get(
  "/available-workers",
  verifyToken,
  checkRole("admin"),
  getAvailableWorkers
);

router.put(
  "/project/:id/assign-workers",
  verifyToken,
  checkRole("admin"),
  assignWorkersController
);

router.delete(
  "/project/:id/remove-worker",
  verifyToken,
  checkRole("admin"),
  removeWorkerFromProject
);

router.put(
  "/user/:id",
  verifyToken,
  checkRole("admin"),
  updateUserController
);

router.put(
  "/user/:id/password",
  verifyToken,
  checkRole("admin"),
  updateUserPassword
);

router.put(
  "/status/user/:id",
  verifyToken,
  checkRole("admin"),
  updateUserStatusController
);

module.exports = router;
