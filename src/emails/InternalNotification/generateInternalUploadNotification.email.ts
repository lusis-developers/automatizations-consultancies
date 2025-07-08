// ARCHIVO: src/emails/generateInternalUploadNotification.email.ts

/**
 * Genera el HTML para la notificación interna de subida de archivos.
 * @param businessName - El nombre del negocio del cliente.
 * @param ownerName - El nombre del dueño del negocio.
 * @param ownerEmail - El email del dueño.
 * @param businessId - El ID del negocio para generar un enlace directo.
 * @returns El string del HTML del email.
 */
export function generateInternalUploadNotificationEmail(
  businessName: string,
  ownerName: string,
  ownerEmail: string,
  businessId: string
): string {
  const BAKANO_PINK = '#e6285c';
  const BAKANO_DARK = '#191423';
  const BAKANO_LIGHT = '#ededed';
  const BAKANO_GREEN = '#3bb77e'; // Color para indicar éxito/acción
  const WHITE = '#ffffff';

  // Enlace hipotético a un panel de administración interno
  const adminLink = `https://admin.bakano.ec/business/${businessId}`;

  const HtmlEmail = `
  <html>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: ${BAKANO_LIGHT}; color: ${BAKANO_DARK};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BAKANO_LIGHT};">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: ${WHITE}; border-radius: 8px; overflow: hidden; margin-top: 40px; border: 1px solid #ddd;">
              <tr style="background-color: ${BAKANO_DARK};">
                <td align="center" style="padding: 20px;">
                  <h1 style="margin: 0; font-size: 24px; color: ${WHITE};">Alerta de Onboarding</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 30px 40px;">
                  <h2 style="margin: 0 0 20px 0; font-size: 20px; color: ${BAKANO_DARK};">Nuevos Datos Recibidos</h2>
                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">
                    El cliente del negocio <strong>${businessName.toUpperCase()}</strong> ha completado el paso de subir sus archivos de onboarding.
                  </p>
                  
                  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: ${BAKANO_DARK}; border-bottom: 1px solid #eee; padding-bottom: 5px;">Detalles del Cliente</h3>
                    <p style="margin: 5px 0; font-size: 15px;"><strong>Negocio:</strong> ${businessName}</p>
                    <p style="margin: 5px 0; font-size: 15px;"><strong>Dueño:</strong> ${ownerName}</p>
                    <p style="margin: 5px 0; font-size: 15px;"><strong>Email:</strong> <a href="mailto:${ownerEmail}" style="color: ${BAKANO_PINK};">${ownerEmail}</a></p>
                  </div>

                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">
                    Por favor, ingresa al sistema para revisar la información y continuar con el siguiente paso del proceso.
                  </p>

                 <p style="text-align: center; margin-top: 30px;">
                    <a href="${adminLink}" style="background-color: ${BAKANO_GREEN}; color: ${WHITE}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Revisar Archivos</a>
                  </p>
                </td>
              </tr>

              <tr style="background-color: #f1f1f1;">
                <td align="center" style="padding: 20px; color: #777; font-size: 12px;">
                  <p style="margin: 0;">Este es un correo automático del sistema de Bakano Agency.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
  return HtmlEmail;
}