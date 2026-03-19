const jwt = require("jsonwebtoken");
const { secret } = require("../config/jwt");

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    // ❌ No header
    if (!authHeader) {
      return res.status(403).json({
        message: "No token provided",
      });
    }

    // ❌ Wrong format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(403).json({
        message: "Invalid token format",
      });
    }

    // ✅ Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(403).json({
        message: "Token missing",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, secret);

    // ✅ Attach user to request
    req.user = decoded;

    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = { verifyToken };