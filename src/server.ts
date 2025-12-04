import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import reservasRouter from "./services/reservas.services";
import authRouter from "./routes/auth.routes";
import { authMiddleware } from "./middlewares/auth.middlewares";
import { enviarMailNuevaReserva } from "./services/mail.service";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend Calendario ILYG funcionando ✅" });
});

// rutas públicas
app.use("/api/auth", authRouter);

// rutas protegidas
app.use("/api/reservas", authMiddleware, reservasRouter);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

