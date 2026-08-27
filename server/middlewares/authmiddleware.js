import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const isAdmin = (req, res, next) => {
  // protect must be run before isAdmin so req.user exists
  const role = (req.user && (req.user.role || req.user?.payload?.role)) || null;
  const roleStr = role ? String(role).toLowerCase() : null;
  if (roleStr === "admin") return next();
  return res.status(403).json({ message: "Admin role required" });
};
