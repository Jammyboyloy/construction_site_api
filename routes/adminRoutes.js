const express = require("express");
const router = express.Router();

const {
  createSupervisorAccount,
  createWorkerAccount,
  createClientAccount,
  getAllSupervisors,
  getSupervisorById,
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
  removeWorkerFromProject,
  getWorkerById,
  getClientById,
  getProjectByIdController,
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

router.get(
  "/supervisor/:id",
  verifyToken,
  checkRole("admin"),
  getSupervisorById,
);

router.post(
  "/create-worker",
  verifyToken,
  checkRole("admin"),
  createWorkerAccount,
);

router.get("/workers", verifyToken, checkRole("admin"), getAllWorkers);

router.get("/worker/:id", verifyToken, checkRole("admin"), getWorkerById);

router.post(
  "/create-client",
  verifyToken,
  checkRole("admin"),
  createClientAccount,
);

router.get("/clients", verifyToken, checkRole("admin"), getAllClients);

router.get("/client/:id", verifyToken, checkRole("admin"), getClientById);

router.post(
  "/create-project",
  verifyToken,
  checkRole("admin"),
  createProjectController,
);

router.put(
  "/project/:id/thumbnail",
  verifyToken,
  checkRole("admin"),
  upload.single("thumbnail"),
  updateProjectThumbnail,
);

router.put(
  "/project/:id/reset-thumbnail",
  verifyToken,
  checkRole("admin"),
  resetProjectThumbnail,
);

router.get(
  "/projects",
  verifyToken,
  checkRole("admin"),
  getAllProjectsController,
);

router.get(
  "/project/:id",
  verifyToken,
  checkRole("admin"),
  getProjectByIdController,
);

router.put(
  "/project/:id",
  verifyToken,
  checkRole("admin"),
  updateProjectController,
);

router.get(
  "/available-supervisors",
  verifyToken,
  checkRole("admin"),
  getAvailableSupervisors,
);

router.put(
  "/project/:id/assign-supervisor",
  verifyToken,
  checkRole("admin"),
  assignSupervisorController,
);

router.get(
  "/available-workers",
  verifyToken,
  checkRole("admin"),
  getAvailableWorkers,
);

router.put(
  "/project/:id/assign-workers",
  verifyToken,
  checkRole("admin"),
  assignWorkersController,
);

router.delete(
  "/project/:id/remove-worker",
  verifyToken,
  checkRole("admin"),
  removeWorkerFromProject,
);

router.put("/user/:id", verifyToken, checkRole("admin"), updateUserController);

router.put(
  "/user/:id/password",
  verifyToken,
  checkRole("admin"),
  updateUserPassword,
);

router.put(
  "/status/user/:id",
  verifyToken,
  checkRole("admin"),
  updateUserStatusController,
);

module.exports = router;
