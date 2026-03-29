const router = require("express").Router();
const {
  generatePayrollController,
  markPayrollPaidController,
  getMyPayrollController,
  getPayrollController,
  updateWorkerRateController
} = require("../controllers/payrollController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");

// 🔥 supervisor/admin
router.post("/generate", verifyToken, generatePayrollController);
router.post("/mark-paid", verifyToken, markPayrollPaidController);
router.get("/", verifyToken, getPayrollController);
router.put("/rate", verifyToken, updateWorkerRateController);

// 🔥 worker
router.get("/my-payroll", verifyToken, checkRole("worker"), getMyPayrollController);

module.exports = router;
