export async function generateOnBoardingEmail(email: string, name: string, businessName: string): Promise<string> {
  const HtmlEmail = `
  <html>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #ededed; color: #191423;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ededed;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="40" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); margin-top: 40px;">
              <tr>
                <td align="center" style="border-bottom: 2px solid #e6285c;">
                  <h1 style="margin: 0; font-size: 28px; color: #e6285c;">¡Bienvenido a Bakano, ${name}!</h1>
                </td>
              </tr>
              <tr>
                <td>
                  <p style="font-size: 16px; color: #191423;">Hola <strong>${name}</strong>,</p>
                  <p style="font-size: 16px; color: #191423;">
                    Gracias por confiar en nosotros para llevar al siguiente nivel a <strong>${businessName}</strong>.
                    Tu pago ha sido recibido exitosamente y ahora comenzamos nuestro proceso de onboarding.
                  </p>
                  <p style="font-size: 16px; color: #191423;">
                    En las próximas horas recibirás:
                  </p>
                  <ul style="font-size: 16px; color: #191423;">
                    <li>✅ Acceso a tu panel personalizado</li>
                    <li>✅ Invitación a la reunión de Kick-off</li>
                    <li>✅ Primeros pasos y documentación clave</li>
                  </ul>
                  <p style="font-size: 16px; color: #191423;">
                    Nuestro equipo está emocionado por acompañarte en este camino. Si tienes alguna duda, puedes responder a este correo o escribirnos directamente por WhatsApp 📲.
                  </p>
                  <p style="font-size: 16px; color: #191423;">
                    ¡Vamos a hacer cosas increíbles juntos!
                  </p>
                  <p style="font-size: 16px; color: #85529c; font-style: italic;">
                    — El equipo de Bakano 💥
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="background-color: #191423; color: #f5f5f5; border-radius: 0 0 12px 12px; padding: 20px;">
                  <p style="margin: 0; font-size: 14px;">
                    ¿Tienes preguntas? Escríbenos a <a href="mailto:hola@bakano.agency" style="color: #e6285c; text-decoration: none;">hola@bakano.agency</a>
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
