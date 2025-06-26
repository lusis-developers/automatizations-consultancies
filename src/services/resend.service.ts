import "dotenv/config";

import CustomError from "../errors/customError.error";
import { Resend } from "resend";
import { generateOnBoardingEmail } from "../emails/generateOnBoarding.email";
import { generatePaymentConfirmationEmail } from "../emails/generatePayEmail.email";
import { generateUploadReminderEmail } from "../emails/generateUploadReminderEmail.email";

class ResendEmail {
  private resend: Resend;

  constructor() {
    const RESEND_KEY = process.env.RESEND_KEY;
    if (!RESEND_KEY) {
      throw new Error("Resend API key is missing");
    }
    this.resend = new Resend(RESEND_KEY);
  }

  public async sendOnboardingEmail(
    email: string,
    name: string,
    userId: string,
    businessId: string,
  ): Promise<void> {
    try {
      const link = `https://${process.env.FRONTEND_URL}/${userId}/${businessId}`;
      console.log("link: ", link); // Agrega este log para verificar el valor del enlace
      const content = await generateOnBoardingEmail(name, link);

      const { data, error } = await this.resend.emails.send({
        to: email,
        from: "bakano@bakano.ec",
        html: content,
        subject:
          "¡Gracias por unirte a nosotros! Empecemos a transformar tu negocio gastronómico 🚀",
      });

      if (error) {
        throw new CustomError("Problem sending email from resend", 400, error);
      }
    } catch (error) {
      throw new Error(`Problem sending onboarding email: ${error}`);
    }
  }

  public async sendPaymentConfirmationEmail(
    email: string,
    name: string,
    businessName: string,
  ): Promise<void> {
    try {
      const content = await generatePaymentConfirmationEmail(
        email,
        name,
        businessName,
      );

      const { data, error } = await this.resend.emails.send({
        to: email,
        from: "bakano@bakano.ec",
        html: content,
        subject: "¡Pago recibido con éxito! 🎉",
      });

      if (error) {
        console.error("error: ", error);
        throw new CustomError(
          "Problema al enviar email desde resend",
          400,
          error,
        );
      }
    } catch (error) {
      console.error("Resend email", error);
      throw new Error(
        `Problema al enviar email de confirmación de pago: ${error}`,
      );
    }
  }

  public async sendUploadReminderEmail(
    email: string,
    businessName: string,
    userId: string,
    businessId: string
  ): Promise<void> {
    try {
      const link = `https://onboarding.bakano.ec/${userId}/${businessId}`;
      
      const content = await generateUploadReminderEmail(businessName, link);

      const { error } = await this.resend.emails.send({
        to: email,
        from: "bakano@bakano.ec",
        html: content,
        subject: `Recordatorio: Sube tus archivos para ${businessName}`,
      });

      if (error) {
        throw new CustomError("Problem sending upload reminder email from resend", 400, error);
      }
    } catch (error) {
      console.error("Resend upload reminder email error", error);
      throw new Error(`Problem sending upload reminder email: ${error}`);
    }
  }
}

export default ResendEmail;
