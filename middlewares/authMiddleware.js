const jwt = require("jsonwebtoken");
const { secret } = require("../config/jwt");
const db = require("../config/db");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    // 🔥 CHECK BLACKLIST FIRST
    const [blacklisted] = await db.query(
      "SELECT * FROM token_blacklist WHERE token = ?",
      [token]
    );

    if (blacklisted.length > 0) {
      return res.status(401).json({
        message: "Token already expired"
      });
    }

    // ✅ verify token
    const decoded = jwt.verify(token, secret);

    req.user = decoded;

    next();

  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

module.exports = { verifyToken };