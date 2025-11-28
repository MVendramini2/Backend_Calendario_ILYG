import { mailer } from "../config/mailer";

type NuevaReservaMail = {
  sala: "A" | "B";
  date: string;   // yyyy-mm-dd
  start: string;  // HH:mm
  end: string;    // HH:mm
  persona: string;
  area: string;
  motivo: string;
};

export async function enviarMailNuevaReserva(reserva: NuevaReservaMail) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const to = process.env.MAIL_TO;

  if (!to) {
    console.error("MAIL_TO no está definido en el .env");
    return;
  }

  const asunto = `Nueva reserva – Sala ${reserva.sala} – ${reserva.date}`;

  const html = `
    <h2>Nueva reserva de sala</h2>
    <p><b>Sala:</b> ${reserva.sala === "A" ? "Sala Grande" : "Sala Chica"} </p>
    <p><b>Fecha:</b> ${reserva.date}</p>
    <p><b>Horario:</b> ${reserva.start} – ${reserva.end}</p>
    <p><b>Persona:</b> ${reserva.persona}</p>
    <p><b>Sector:</b> ${reserva.area}</p>
    <p><b>Motivo:</b> ${reserva.motivo}</p>
  `;

  await mailer.sendMail({
    from,
    to,
    subject: asunto,
    html,
  });
}