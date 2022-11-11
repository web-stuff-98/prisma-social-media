import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { token } = req.cookies;
  if (!token) return res.status(403).end();
  try {
    console.log(token)
    const decodedToken = jwt.verify(token, String(process.env.JWT_SECRET));
    if (!req.user) {
      const verifiedData = JSON.parse(JSON.stringify(decodedToken));
      req.user = verifiedData;
    }
  } catch (error) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  next();
};

export const withUser = async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.cookies;
  if (token) {
    try {
      const decodedToken = jwt.verify(token, String(process.env.JWT_SECRET));
      if (!req.user) {
        const verifiedData = JSON.parse(JSON.stringify(decodedToken));
        req.user = verifiedData;
      }
    } catch (error) {}
  }
  next();
};

export default authMiddleware;
