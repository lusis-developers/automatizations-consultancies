// ARCHIVO: src/utils/email-templates.ts (o donde residan tus plantillas de email)

/**
 * Genera el HTML para el email de confirmación de eliminación de datos.
 * @param recipientName - El nombre del cliente cuyos datos han sido eliminados.
 * @returns El string del HTML del email.
 */
export function generateDataDeletionConfirmationEmail(recipientName: string): string {
  const BAKANO_PINK = '#e6285c';
  const BAKANO_DARK = '#191423';
  const BAKANO_LIGHT = '#ededed';
  const WHITE = '#ffffff';

  // --- Enlaces Relevantes ---
  const WEBSITE_POLICY_LINK = 'https://mkt.bakano.ec/politicas';
  const WEBSITE_URL = 'https://bakano.ec'; // URL principal por si el usuario quiere volver

  const HtmlEmail = `
  <html>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: ${BAKANO_LIGHT}; color: ${BAKANO_DARK};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BAKANO_LIGHT};">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: ${WHITE}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); margin-top: 40px;">
              
              <tr style="background-color: ${BAKANO_DARK};">
                <td align="center" style="padding: 30px;">
                  <img src="https://res.cloudinary.com/dpjzfua3n/image/upload/v1747532776/bakano-light_xvxdmc.png" alt="Bakano Logo" width="150" style="display:block;"/>
                </td>
              </tr>
              
              <tr>
                <td align="center" style="padding: 20px 40px 0 40px;">
                  <h1 style="margin: 0; font-size: 28px; color: ${BAKANO_DARK};">Confirmación de Eliminación</h1>
                  <h2 style="margin: 10px 0 0 0; font-size: 20px; color: #555;">Tus Datos Han Sido Eliminados</h2>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">Hola <strong>${recipientName}</strong>,</p>
                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">
                    Te escribimos para confirmar que tu solicitud para eliminar tus datos personales ha sido procesada exitosamente. Toda tu información ha sido permanentemente borrada de nuestros sistemas, de acuerdo con nuestras políticas de privacidad.
                  </p>
                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">
                    Esto significa que tu cuenta y los datos asociados ya no existen en nuestra plataforma. Si en el futuro deseas utilizar nuestros servicios, será necesario que te registres nuevamente.
                  </p>
                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">
                    Agradecemos el tiempo que pasaste con nosotros. Si tienes alguna pregunta o si crees que esto fue un error, por favor, no dudes en contactarnos.
                  </p>
                </td>
              </tr>

              <tr style="background-color: ${BAKANO_DARK};">
                <td align="center" style="padding: 30px 40px; color: ${WHITE};">
                   <p style="margin: 0; font-size: 12px; color: #bbbbbb; line-height: 1.6;">
                     Este es un correo generado automáticamente. Por favor, no respondas a este mensaje, ya que esta casilla no es monitoreada.
                     <br><br>
                     © ${new Date().getFullYear()} Bakano Agency. Todos los derechos reservados.
                     <br>
                     Puedes consultar nuestras <a href="${WEBSITE_POLICY_LINK}" target="_blank" style="color: #bbbbbb; text-decoration: underline;">Políticas de Servicio y Privacidad en nuestro sitio web</a>.
                   </p>
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