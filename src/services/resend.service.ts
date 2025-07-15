import "dotenv/config";

import CustomError from "../errors/customError.error";
import { Resend } from "resend";
import { generateOnBoardingEmail } from "../emails/generateOnBoarding.email";
import { generatePaymentConfirmationEmail } from "../emails/generatePayEmail.email";
import { generateUploadReminderEmail } from "../emails/generateUploadReminderEmail.email";
import { generateManagerOnboardingEmail } from "../emails/generateManagerOnboarding.email";
import { generateInternalUploadNotificationEmail } from "../emails/InternalNotification/generateInternalUploadNotification.email";
import { generatePolicyEmail } from "../emails/InternalNotification/generatePolicyEmail.email";
import { generateDataDeletionConfirmationEmail } from "../emails/ExternalNotification/removeDataClient.email";
import { generateBusinessDeletionEmail } from "../emails/ExternalNotification/generateBusinessDeletion.email";

class ResendEmail {
  private resend: Resend;

  private internalSpecialists: string[] = [
    "dreyes@bakano.ec",
    "dquimi@bakano.ec",
    "lreyes@bakano.ec",
  ];

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

  public async sendManagerOnboardingEmail(
    managerEmail: string,
    managerName: string,
    ownerName: string,
    businessName: string,
    userId: string,
    businessId: string
  ): Promise<void> {
    try {
      const link = `https://${process.env.FRONTEND_URL}/${userId}/${businessId}`;
      const content = generateManagerOnboardingEmail(managerName, ownerName, businessName, link);

      const { data, error } = await this.resend.emails.send({
        to: managerEmail,
        from: "bakano@bakano.ec",
        html: content,
        subject: `Has sido invitado a colaborar en ${businessName} 🚀`,
      });

      if (error) {
        throw new CustomError("Problem sending manager onboarding email from resend", 400, error);
      }
      
      console.log(`[Email Service] Onboarding para manager ${managerName} enviado a ${managerEmail}.`);

    } catch (error) {
      console.error(`[Email Service] Failed to send manager onboarding email: ${error}`);
      throw new CustomError("Problem sending manager onboarding email", 400, error);
    }
  }

   public async sendInternalUploadNotification(
    businessName: string,
    businessId: string,
    ownerName: string,
    clientId: string,
    ownerEmail: string
  ): Promise<void> {
    try {
      const content = generateInternalUploadNotificationEmail(businessName, ownerName, ownerEmail, businessId, clientId);

      const { data, error } = await this.resend.emails.send({
        to: this.internalSpecialists,
        from: "sistema@bakano.ec", // Usamos un 'from' más sistémico
        html: content,
        subject: `Alerta de Onboarding: Nuevos archivos subidos por ${businessName} 🚀`,
      });

      if (error) {
        throw new CustomError("Problem sending internal notification from resend", 400, error);
      }

      console.log(`[Email Service] Notificación interna enviada exitosamente para el negocio ${businessName}.`);

    } catch (error) {
      console.error(`[Email Service] Failed to send internal notification for ${businessName}:`, error);
      throw new CustomError("Problem sending internal notification from resend", 400, error);
    }
  }

  public async sendPoliciesEmail(
    recipientName: string,
    recipientEmail: string,
  ): Promise<void> {
    try {
      const content = generatePolicyEmail(recipientName);

      const { error } = await this.resend.emails.send({
        to: recipientEmail,
        from: "legal@bakano.ec",
        html: content,
        subject: "Importante: Políticas de Servicio y Privacidad de Bakano Agency",
      });

      if (error) {
        throw new CustomError("Problem sending policies email from resend", 400, error);
      }
      
      console.log(`[Email Service] Email de políticas enviado a ${recipientEmail}.`);

    } catch (error) {
      console.error(`[Email Service] Failed to send policies email to ${recipientEmail}:`, error);
      throw new CustomError("Problem sending policies email from resend", 400, error);
    }
  }

  public async sendBusinessDeletionEmail(
    businessName: string,
    ownerName: string,
    recipients: string[],
  ): Promise<void> {
    try {
      if (!recipients || recipients.length === 0) {
        console.warn(`[Email Service] No se proporcionaron destinatarios para la notificación de eliminación del negocio ${businessName}.`);
        return;
      }

      const content = generateBusinessDeletionEmail(businessName, ownerName);

      const { error } = await this.resend.emails.send({
        to: recipients,
        from: "notificaciones@bakano.ec",
        html: content,
        subject: `Notificación Importante: Eliminación de datos del negocio '${businessName}'`,
      });

      if (error) {
        throw new CustomError("Problem sending business deletion email from resend", 400, error);
      }
      
      console.log(`[Email Service] Email de eliminación del negocio ${businessName} enviado a: ${recipients.join(", ")}.`);

    } catch (error) {
      console.error(`[Email Service] Failed to send business deletion email for ${businessName}:`, error);
      throw new CustomError("Problem sending business deletion email", 500, error);
    }
  }
}

export default ResendEmail;