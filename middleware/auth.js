import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

  if (!token)
    return res
      .status(401)
      .json({ message: "Unauthorized Access, No token found" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next;
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Unauthorized Access, invalid token" });
  }
};
