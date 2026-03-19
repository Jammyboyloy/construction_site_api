const express = require("express");
const router = express.Router();

const {
  createSupervisorAccount,
  createWorkerAccount,
  getAllSupervisors,
  getAllWorkers,
} = require("../controllers/adminController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");

router.post(
  "/create-supervisor",
  verifyToken,
  checkRole("admin"),
  createSupervisorAccount,
);

// GET all supervisors
router.get("/supervisors", verifyToken, checkRole("admin"), getAllSupervisors);

router.post(
  "/create-worker",
  verifyToken,
  checkRole("admin"),
  createWorkerAccount,
);

router.get("/workers", verifyToken, checkRole("admin"), getAllWorkers);

module.exports = router;
