const express = require("express");
const router = express.Router();

const { login, getMe, logout } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/login", login);
router.delete("/logout", verifyToken, logout);
router.get("/me", verifyToken, getMe);

module.exports = router;