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

  const [año, mes, dia] = reserva.date.split('-'); 
  const fechaFormateada = `${dia}/${mes}/${año}`;

  const nombresSala: Record<"A" | "B", string> = {
  A: "Grande",
  B: "Chica",
  };

  if (!to) {
    console.error("MAIL_TO no está definido en el .env");
    return;
  }

  const asunto = `Nueva reserva – Sala ${nombresSala[reserva.sala]} – ${reserva.date}`;

  const html = `
  <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5; padding: 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <tr>
                <td style="background-color: #0b43a8; padding: 30px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Nueva Reserva Confirmada</h1>
                  <p style="color: #e0e7ff; margin: 5px 0 0 0; font-size: 14px;">Detalles del evento programado</p>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px;">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    
                    <tr>
                      <td style="padding-bottom: 16px; border-bottom: 1px solid #f0f0f0;">
                        <p style="margin: 0; font-size: 12px; color: #888888; text-transform: uppercase; font-weight: bold;">Sala</p>
                        <p style="margin: 4px 0 0 0; font-size: 18px; color: #0b43a8; font-weight: 600;">
                          ${nombresSala[reserva.sala]}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td width="50%" valign="top">
                              <p style="margin: 0; font-size: 12px; color: #888888; text-transform: uppercase; font-weight: bold;">Fecha</p>
                              <p style="margin: 4px 0 0 0; font-size: 16px; color: #333333;">${fechaFormateada}</p>
                            </td>
                            <td width="50%" valign="top">
                              <p style="margin: 0; font-size: 12px; color: #888888; text-transform: uppercase; font-weight: bold;">Horario</p>
                              <p style="margin: 4px 0 0 0; font-size: 16px; color: #333333;">${reserva.start} – ${reserva.end}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td width="50%" valign="top">
                              <p style="margin: 0; font-size: 12px; color: #888888; text-transform: uppercase; font-weight: bold;">Solicitante</p>
                              <p style="margin: 4px 0 0 0; font-size: 16px; color: #333333;">${reserva.persona}</p>
                            </td>
                            <td width="50%" valign="top">
                              <p style="margin: 0; font-size: 12px; color: #888888; text-transform: uppercase; font-weight: bold;">Sector</p>
                              <p style="margin: 4px 0 0 0; font-size: 16px; color: #333333;">${reserva.area}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding-top: 16px;">
                        <p style="margin: 0; font-size: 12px; color: #888888; text-transform: uppercase; font-weight: bold;">Motivo</p>
                        <p style="margin: 4px 0 0 0; font-size: 16px; color: #333333; line-height: 1.5;">${reserva.motivo}</p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>

              <tr>
                <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">Sistema de Gestión de Salas - ILYG</p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  await mailer.sendMail({
    from,
    to,
    subject: asunto,
    html,
  });
}