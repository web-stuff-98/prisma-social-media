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
    const decodedToken = jwt.verify(token, String(process.env.JWT_SECRET));
    const verifiedData = JSON.parse(JSON.stringify(decodedToken));
    req.user = verifiedData;
  } catch (error) {
    return res.status(403).json({ msg: "Unauthorized" }).end();
  }
  next();
};

export const withUser = (req: Request, _: Response, next: NextFunction) => {
  const { token } = req.cookies;
  if (token) {
    const decodedToken = jwt.verify(token, String(process.env.JWT_SECRET));
    const verifiedData = JSON.parse(JSON.stringify(decodedToken));
    req.user = verifiedData;
  }
  next();
};

export default authMiddleware;
