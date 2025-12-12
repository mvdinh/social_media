import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: "Access Denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Gán payload vào req.user
    // Payload lúc login: { id: ..., address: "0x123..." }
    req.user = verified; 
    
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid Token" });
  }
};