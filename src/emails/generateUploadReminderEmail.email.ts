export async function generateUploadReminderEmail(
  businessName: string,
  link: string, // <--- NUEVO PARÁMETRO
): Promise<string> {
  const HtmlEmail = `
  <html>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #ededed; color: #191423;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ededed;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); margin-top: 40px;">
              <tr style="background-color: #191423;">
                <td align="center" style="padding: 30px;">
                  <img src="https://res.cloudinary.com/dpjzfua3n/image/upload/v1747532776/bakano-light_xvxdmc.png" alt="Bakano Logo" width="150">
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px 40px 0 40px;">
                  <h1 style="margin: 0; font-size: 26px; color: #e6285c;">¡Acción Requerida! Sube tus Archivos 📂</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <p style="font-size: 16px; color: #191423;">Hola, equipo de <strong>${businessName}</strong>,</p>
                  <p style="font-size: 16px; color: #191423;">
                    Te enviamos un recordatorio amistoso para que subas los documentos de tu negocio. Este es un paso crucial para que podamos iniciar la consultoría y potenciar tus resultados.
                  </p>
                  
                  <table border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                    <tr>
                      <td align="center" bgcolor="#e6285c" style="border-radius: 8px;">
                        <a href="${link}" target="_blank" style="font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; display: inline-block; padding: 15px 25px; border-radius: 8px;">Subir mis Archivos Ahora</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="font-size: 16px; color: #191423;">
                    Si tienes algún problema con el botón, puedes copiar y pegar el siguiente enlace en tu navegador:
                  </p>
                  <p style="font-size: 12px; color: #85529c; word-break: break-all;">${link}</p>
                  
                  <p style="margin-top: 30px; font-size: 16px; color: #85529c; font-style: italic;">
                    — Bakano Team 💥
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