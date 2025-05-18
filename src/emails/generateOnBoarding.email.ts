export async function generateOnBoardingEmail(email: string, name: string, businessName: string): Promise<string> {
  const HtmlEmail = `
  <html>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #ededed; color: #191423;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ededed;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); margin-top: 40px;">
              <!-- LOGO -->
              <tr style="background-color: #191423;">
                <td align="center" style="padding: 30px;">
                  <img src="https://res.cloudinary.com/dpjzfua3n/image/upload/v1747532776/bakano-light_xvxdmc.png" alt="Bakano Logo" width="150" style="display:block;"/>
                </td>
              </tr>
              
              <!-- HEADER -->
              <tr>
                <td align="center" style="padding: 20px 40px 0 40px;">
                  <h1 style="margin: 0; font-size: 28px; color: #e6285c;">¡Bienvenido a Bakano, ${name}!</h1>
                </td>
              </tr>

              <!-- CONTENT -->
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <p style="font-size: 16px; color: #191423;">Hola <strong>${name}</strong>,</p>
                  <p style="font-size: 16px; color: #191423;">
                    Tu pago ha sido confirmado y ahora comenzamos el proceso de onboarding para <strong>${businessName}</strong>. 🚀
                  </p>
                  <p style="font-size: 16px; color: #191423;">
                    En breve recibirás:
                  </p>
                  <ul style="font-size: 16px; color: #191423;">
                    <li>✅ Acceso a tu panel personalizado</li>
                    <li>✅ Invitación a la reunión de Kick-off</li>
                    <li>✅ Documentación y primeros pasos</li>
                  </ul>
                  <p style="font-size: 16px; color: #191423;">
                    Si tienes dudas o necesitas soporte, nuestro equipo está listo para ayudarte.
                  </p>
                  <p style="font-size: 16px; color: #85529c; font-style: italic;">
                    — Bakano Team 💥
                  </p>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr style="background-color: #191423;">
                <td align="center" style="padding: 30px; color: #ffffff;">
                  <p style="margin: 0; font-size: 14px; color: #ffffff;">¿Tienes preguntas? Escríbenos a <a href="mailto:dquimi@bakano.ec" style="color: #e6285c; text-decoration: none;">dquimi@bakano.ec</a></p>
                  <p style="margin: 20px 0 10px 0; font-size: 14px; color: #ffffff;">Visita nuestra web: <a href="https://bakano.ec/" style="color: #e6285c; text-decoration: none;">bakano.ec</a></p>
                  <p style="margin: 20px 0 10px 0; font-size: 14px; color: #ffffff;">Síguenos en nuestras redes:</p>
                  <p style="margin: 0;">
                    <a href="https://www.instagram.com/bakano.ec/" style="margin: 0 10px;"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384063.png" alt="Instagram" width="24"/></a>
                    <a href="https://www.facebook.com/bakano.ec" style="margin: 0 10px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="24"/></a>
                  </p>
                  <p style="margin-top: 20px; font-size: 12px; color: #bbbbbb;">© ${new Date().getFullYear()} Bakano Agency. Todos los derechos reservados.</p>
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
