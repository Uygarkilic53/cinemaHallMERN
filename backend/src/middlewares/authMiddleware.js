import jwt from "jsonwebtoken";

// 👑 Authentication middleware
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // normalize so all controllers can safely use req.user._id and req.user.role
    req.user = { _id: decoded.userId, role: decoded.role };

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// 👑 Role check middleware
export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};
