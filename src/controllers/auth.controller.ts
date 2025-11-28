import { Request, Response } from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

const SECRET_KEY = JWT_SECRET;

export const login = (req: Request, res: Response) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res
      .status(400)
      .json({ message: "Usuario y contraseña son obligatorios" });
  }

  if (usuario !== ADMIN_USER || contrasena !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const payload = {
    username: usuario,
    role: "admin" as const,
  };


  const token = (jwt as any).sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return res.json({
    token,
    username: usuario,
    role: "admin",
  });
};