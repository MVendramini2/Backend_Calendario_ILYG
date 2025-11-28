import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

export interface AuthRequest extends Request {
  user?: {
    username: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.substring(7); // después de "Bearer "

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      username: string;
      role: string;
    };

    req.user = {
      username: payload.username,
      role: payload.role,
    };

    next();
  } catch (error) {
    console.error("Token inválido:", error);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};