const express = require("express");
const router = express.Router();

const {
  getBudgetStatusController
} = require("../controllers/projectController");

const { verifyToken } = require("../middlewares/authMiddleware");

// 🔥 budget tracking
router.get(
  "/budget-status/:id",
  verifyToken,
  getBudgetStatusController
);

module.exports = router;