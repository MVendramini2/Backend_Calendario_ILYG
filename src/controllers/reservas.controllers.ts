// src/controllers/reservas.controller.ts
import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { enviarMailNuevaReserva } from "../services/mail.service";

// --------- Helpers de validación ---------

const isSalaValida = (s: any): s is "A" | "B" => s === "A" || s === "B";

const isISODate = (value: any): boolean => {
  if (typeof value !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(value)) return false;

  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  );
};

const isHoraValida = (value: any): boolean => {
  if (typeof value !== "string") return false;
  const regex = /^([01]\d|2[0-3]):[0-5]\d$/; // 00:00 a 23:59
  return regex.test(value);
};

const timeToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const haySolapamientoRango = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  // solapan si se pisan en algún tramo
  return s1 < e2 && e1 > s2;
};

// Horario permitido: 08:00 a 20:00
const MIN_MINUTOS = 8 * 60;
const MAX_MINUTOS = 20 * 60;

const validarDatosReserva = (body: any) => {
  const errores: string[] = [];

  const { sala, date, start, end, persona, area, motivo } = body;

  // Campos obligatorios
  if (!sala || !date || !start || !end || !persona || !area || !motivo) {
    errores.push("Faltan campos obligatorios.");
  }

  // Sala
  if (!isSalaValida(sala)) {
    errores.push("La sala debe ser 'A' o 'B'.");
  }

  // Fecha
  if (!isISODate(date)) {
    errores.push("La fecha debe tener formato YYYY-MM-DD y ser válida.");
  }

  // Horarios formato
  if (!isHoraValida(start) || !isHoraValida(end)) {
    errores.push("Los horarios deben tener formato HH:mm (por ejemplo 09:30).");
  } else {
    const minStart = timeToMinutes(start);
    const minEnd = timeToMinutes(end);

    // start < end
    if (minStart >= minEnd) {
      errores.push("La hora de inicio debe ser menor a la hora de fin.");
    }

    // dentro del rango permitido
    if (minStart < MIN_MINUTOS || minEnd > MAX_MINUTOS) {
      errores.push("El horario debe estar dentro del rango 08:00 a 20:00.");
    }
  }

  // Texto no vacío
  if (typeof persona !== "string" || persona.trim().length === 0) {
    errores.push("El nombre de la persona es obligatorio.");
  }
  if (typeof area !== "string" || area.trim().length === 0) {
    errores.push("El sector es obligatorio.");
  }
  if (typeof motivo !== "string" || motivo.trim().length === 0) {
    errores.push("El motivo es obligatorio.");
  }

  return errores;
};


const existeSolapamiento = async (params: {
  sala: "A" | "B";
  date: string;
  start: string;
  end: string;
  ignoreId?: number;
}): Promise<boolean> => {
  const { sala, date, start, end, ignoreId } = params;

  // buscamos todas las reservas de esa sala y fecha
  const reservas = await prisma.reserva.findMany({
    where: {
      sala,
      date,
      ...(ignoreId
        ? {
            NOT: { id: ignoreId },
          }
        : {}),
    },
  });

  return reservas.some((r: any) =>
    haySolapamientoRango(start, end, r.start, r.end)
  );
};

// --------- Controladores ---------

// GET /api/reservas
export const getReservas = async (_req: Request, res: Response) => {
  try {
    const reservas = await prisma.reserva.findMany({
      orderBy: [{ date: "asc" }, { start: "asc" }],
    });

    return res.json(reservas);
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// POST /api/reservas
export const createReserva = async (req: Request, res: Response) => {
  try {
    const { sala, date, start, end, persona, area, motivo } = req.body;

    // Validaciones generales
    const errores = validarDatosReserva(req.body);
    if (errores.length > 0) {
      return res.status(400).json({
        message: "Error de validación",
        errores,
      });
    }

    // Solapamiento
    const solapa = await existeSolapamiento({
      sala,
      date,
      start,
      end,
    });

    if (solapa) {
      return res.status(400).json({
        message:
          "Ya existe una reserva en esa sala para un horario que se solapa.",
      });
    }

    const nueva = await prisma.reserva.create({
      data: { sala, date, start, end, persona, area, motivo },
    });

    // 🔔 Enviar mail (no rompemos la API si falla el envío)
    enviarMailNuevaReserva({
      sala,
      date,
      start,
      end,
      persona,
      area,
      motivo,
    }).catch((err) => {
      console.error("Error al enviar correo de nueva reserva:", err);
    });

    return res.status(201).json(nueva);
  } catch (error) {
    console.error("Error al crear reserva:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// PUT /api/reservas/:id
export const updateReserva = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const { sala, date, start, end, persona, area, motivo } = req.body;

    // Validaciones generales
    const errores = validarDatosReserva(req.body);
    if (errores.length > 0) {
      return res.status(400).json({
        message: "Error de validación",
        errores,
      });
    }

    // Solapamiento (ignorando la propia reserva)
    const solapa = await existeSolapamiento({
      sala,
      date,
      start,
      end,
      ignoreId: id,
    });

    if (solapa) {
      return res.status(400).json({
        message:
          "Ya existe una reserva en esa sala para un horario que se solapa.",
      });
    }

    const actualizada = await prisma.reserva.update({
      where: { id },
      data: { sala, date, start, end, persona, area, motivo },
    });

    return res.json(actualizada);
  } catch (error: any) {
    console.error("Error al actualizar reserva:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// DELETE /api/reservas/:id
export const deleteReserva = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    await prisma.reserva.delete({
      where: { id },
    });


    return res.json({ ok: true, message: "Reserva eliminada" });
  } catch (error: any) {
    console.error("Error al eliminar reserva:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
