/**
 * Genera el HTML para el email de políticas de servicio y privacidad.
 * @param recipientName - El nombre de la persona que recibirá el correo (cliente o manager).
 * @returns El string del HTML del email.
 */
export function generatePolicyEmail(recipientName: string): string {
  const BAKANO_PINK = '#e6285c';
  const BAKANO_DARK = '#191423';
  const BAKANO_LIGHT = '#ededed';
  const WHITE = '#ffffff';
  const POLICY_LINK = 'https://docs.google.com/document/d/1VZ5SSZDsdHeZlDwzMz1mN-4v7ie8QPNwGvXNnUEtaW0/edit?usp=sharing';

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
                  <h1 style="margin: 0; font-size: 28px; color: ${BAKANO_DARK};">Información Importante</h1>
                  <h2 style="margin: 10px 0 0 0; font-size: 20px; color: #555;">Nuestras Políticas de Servicio y Privacidad</h2>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">Hola <strong>${recipientName}</strong>,</p>
                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">
                    Como parte de nuestro compromiso con la transparencia y la seguridad de tu información, te facilitamos el acceso a nuestras políticas de servicio. En este documento encontrarás detalles sobre cómo manejamos tus datos, la confidencialidad y los términos de nuestra colaboración.
                  </p>
                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">
                    Te recomendamos leerlo detenidamente.
                  </p>
                 <p style="text-align: center; margin-top: 30px;">
                    <a href="${POLICY_LINK}" target="_blank" style="background-color: ${BAKANO_PINK}; color: ${WHITE}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Leer Políticas de Servicio</a>
                  </p>
                </td>
              </tr>

              <tr style="background-color: ${BAKANO_DARK};">
                <td align="center" style="padding: 30px 40px; color: ${WHITE};">
                   <p style="margin: 0; font-size: 12px; color: #bbbbbb; line-height: 1.5;">
                     Este es un correo generado automáticamente por el sistema de Bakano Agency. Por favor, no respondas a este mensaje, ya que esta casilla de correo no es monitoreada.
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