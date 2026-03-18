const express = require("express");
const router = express.Router();

const { createSupervisorAccount } = require("../controllers/adminController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");
const { getAllSupervisors } = require("../controllers/adminController");

router.post(
  "/create-supervisor",
  verifyToken,
  checkRole("admin"),
  createSupervisorAccount,
);

// GET all supervisors
router.get(
  "/supervisors",
  verifyToken,
  checkRole("admin"),
  getAllSupervisors
);

module.exports = router;
