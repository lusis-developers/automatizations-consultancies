// src/emails/generateBusinessDeletion.email.ts

/**
 * Genera el HTML para el email de notificación de eliminación de un negocio.
 * @param businessName - El nombre del negocio eliminado.
 * @param ownerName - El nombre del dueño del negocio.
 * @returns El string del HTML del email.
 */
export function generateBusinessDeletionEmail(
  businessName: string,
  ownerName: string,
): string {
  const BAKANO_PINK = '#e6285c';
  const BAKANO_DARK = '#191423';
  const BAKANO_LIGHT = '#ededed';
  const WHITE = '#ffffff';

  const HtmlEmail = `
  <html>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: ${BAKANO_LIGHT}; color: ${BAKANO_DARK};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BAKANO_LIGHT};">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: ${WHITE}; border-radius: 12px; overflow: hidden; margin-top: 40px;">
              <tr style="background-color: ${BAKANO_DARK};">
                <td align="center" style="padding: 30px;">
                  <img src="https://res.cloudinary.com/dpjzfua3n/image/upload/v1747532776/bakano-light_xvxdmc.png" alt="Bakano Logo" width="150"/>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px 40px 0 40px;">
                  <h1 style="margin: 0; font-size: 28px; color: ${BAKANO_DARK};">Notificación de Eliminación de Datos</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <p style="font-size: 16px; line-height: 1.6;">Estimado equipo,</p>
                  <p style="font-size: 16px; line-height: 1.6;">
                    Te informamos que, siguiendo una solicitud, los datos asociados al negocio <strong>${businessName}</strong>, propiedad de <strong>${ownerName}</strong>, han sido permanentemente eliminados de nuestra plataforma.
                  </p>
                  <p style="font-size: 16px; line-height: 1.6;">
                    Esta acción es irreversible y toda la información de consultoría, archivos y configuraciones relacionadas han sido borrados.
                  </p>
                   <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK}; margin-top: 25px;">
                    Si crees que esto es un error o tienes alguna pregunta, por favor, contacta a nuestro equipo de soporte inmediatamente a través de <a href="mailto:dquimi@bakano.ec" style="color: ${BAKANO_PINK};">dquimi@bakano.ec</a>.
                  </p>
                </td>
              </tr>
              <tr style="background-color: #f1f1f1;">
                <td align="center" style="padding: 20px; font-size: 12px; color: #777;">
                  <p style="margin:0;">© ${new Date().getFullYear()} Bakano Agency. Todos los derechos reservados.</p>
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