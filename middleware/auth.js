import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "pollify-dev-secret-change-me";

export const protect = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

  if (!token)
    return res
      .status(401)
      .json({ message: "Unauthorized Access, No token found" });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Unauthorized Access, invalid token" });
  }
};
