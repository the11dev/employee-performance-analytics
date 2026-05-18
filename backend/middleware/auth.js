const jwt = require("jsonwebtoken");

/**
 * verifyToken middleware
 * Reads the Authorization header (Bearer <token>), decodes the JWT,
 * and attaches the decoded payload to req.user for downstream handlers.
 *
 * Returns 401 if the token is missing, malformed, or expired.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Expect header in the form: "Bearer <jwt_token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // jwt.verify throws if the token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

module.exports = { verifyToken };
