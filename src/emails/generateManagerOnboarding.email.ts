/**
 * Genera el HTML para el email de onboarding de un manager.
 * @param managerName - El nombre del manager que recibirá el correo.
 * @param ownerName - El nombre del dueño del negocio que lo designó.
 * @param businessName - El nombre del negocio.
 * @param link - El enlace para el onboarding.
 * @returns El string del HTML del email.
 */
export function generateManagerOnboardingEmail(
  managerName: string,
  ownerName: string,
  businessName: string,
  link: string,
): string {
  const BAKANO_PINK = '#e6285c';
  const BAKANO_DARK = '#191423';
  const BAKANO_LIGHT = '#ededed';
  const BAKANO_PURPLE = '#85529c';
  const WHITE = '#ffffff';
  const FOOTER_TEXT_COLOR = '#bbbbbb';

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
                  <h1 style="margin: 0; font-size: 28px; color: ${BAKANO_PURPLE};">¡Has sido invitado a colaborar!</h1>
                  <h2 style="margin: 10px 0 0 0; font-size: 20px; color: ${BAKANO_DARK};">Formarás parte del equipo de ${businessName.toUpperCase()}</h2>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">Hola <strong>${managerName}</strong>,</p>
                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">
                    Te escribimos porque <strong>${ownerName}</strong>, propietario(a) de <strong>${businessName}</strong>, te ha designado como manager en nuestra plataforma. 
                    ¡Bienvenido(a) al equipo!
                  </p>
                  <p style="font-size: 16px; line-height: 1.6; color: ${BAKANO_DARK};">
                    Tu rol será clave para analizar datos, definir estrategias y ayudar a que el negocio crezca con control y previsión. Para ello, el primer paso es completar el proceso de onboarding subiendo la información requerida.
                  </p>

                  <div style="background-color: #f7f7f9; border-left: 4px solid ${BAKANO_PURPLE}; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: ${BAKANO_DARK};">
                      <strong>Nota importante:</strong> El onboarding es un esfuerzo de equipo. Es posible que <strong>${ownerName}</strong> u otro manager ya haya completado este paso. 
                      <br><br>
                      Si al hacer clic en el botón ves que los datos ya están enviados, ¡excelente! Significa que el trabajo en equipo funciona y ya podemos avanzar a la siguiente fase.
                    </p>
                  </div>
                  <p style="text-align: center; margin-top: 30px;">
                    <a href="${link}" style="background-color: ${BAKANO_PINK}; color: ${WHITE}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Comenzar o Revisar Onboarding</a>
                  </p>
                </td>
              </tr>

              <tr style="background-color: ${BAKANO_DARK};">
                <td align="center" style="padding: 30px 40px; color: ${WHITE};">
                  <p style="margin: 0; font-size: 14px; color: ${WHITE};">¿Tienes preguntas? Escríbenos a <a href="mailto:dquimi@bakano.ec" style="color: ${BAKANO_PINK}; text-decoration: none;">dquimi@bakano.ec</a></p>
                  <p style="margin: 20px 0 10px 0; font-size: 14px; color: ${WHITE};">Visita nuestra web: <a href="https://bakano.ec/" style="color: ${BAKANO_PINK}; text-decoration: none;">bakano.ec</a></p>
                  
                  <p style="margin-top: 30px; font-size: 12px; color: ${FOOTER_TEXT_COLOR}; line-height: 1.5;">
                    © ${new Date().getFullYear()} Bakano Agency. Todos los derechos reservados.
                    <br>
                    Al continuar, aceptas nuestros 
                    <a href="https://mkt.bakano.ec/politicas" target="_blank" style="color: ${FOOTER_TEXT_COLOR}; text-decoration: underline;">Términos y Políticas</a>.
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