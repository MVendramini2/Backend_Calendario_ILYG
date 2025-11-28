// src/routes/reservas.routes.ts
import { Router } from "express";
import { createReserva } from "../controllers/reservas.controllers";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.use(authMiddleware);

router.post("/", createReserva);

export default router;