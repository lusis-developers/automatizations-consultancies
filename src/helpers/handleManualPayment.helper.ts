import { Response } from "express";
import { Types } from "mongoose";
import models from "../models"; // Asegúrate que la ruta a tus modelos es correcta
import ResendEmail from "../services/resend.service"; // Asegúrate que la ruta a tu servicio de email es correcta

// El enum de métodos de pago para mantener la consistencia
export enum PayMethod {
  PAGOPLUX = 'pagoplux',
  BANK_TRANSFER = 'bank transfer',
  DATIL = 'datil',
}

// La interfaz para el cuerpo de la solicitud de un pago manual
export interface ManualPaymentBody {
  amount: string;
  clientName: string;
  clientId?: string;
  email: string;
  phone: string;
  description?: string;
  country?: string;
  bank?: string; // Por ejemplo: "DATIL", "Banco Pichincha", etc.
  businessName: string;
  paymentMethod: PayMethod; // El campo clave para diferenciar el tipo de pago
}

/**
 * Maneja el registro de un pago manual, ya sea por Transferencia Bancaria o Dátil.
 * Crea o actualiza clientes, negocios y transacciones.
 * @param body El cuerpo de la solicitud con los datos del pago.
 * @param res El objeto de respuesta de Express.
 */
export async function handleManualPayment(
  body: ManualPaymentBody,
  res: Response,
): Promise<void> {
  try {
    // 1. Determina los textos y IDs basados en el método de pago
    const paymentMethodString = body.paymentMethod === PayMethod.BANK_TRANSFER 
      ? "Transferencia Bancaria" 
      : "Dátil";
      
    const bankProvider = body.bank || "No especificado";
    
    const intentId = body.paymentMethod === PayMethod.BANK_TRANSFER 
      ? "TRANSFER-MANUAL" 
      : "DATIL-MANUAL";

    const transactionId = `${intentId}-${Date.now()}-${body.clientId?.slice(-4) || "XXXX"}`;

    // 2. Busca o crea el cliente
    let cliente = await models.clients.findOne({ email: body.email });
    let isFirstPayment = false;

    if (!cliente) {
      isFirstPayment = true;
      cliente = await models.clients.create({
        name: body.clientName,
        email: body.email,
        phone: body.phone,
        dateOfBirth: new Date(),
        city: "No especificada",
        nationalIdentification: body.clientId || "",
        country: body.country || "No especificado",
        paymentInfo: {
          preferredMethod: paymentMethodString,
          lastPaymentDate: new Date(),
          cardType: "N/A",
          cardInfo: "N/A",
          bank: bankProvider,
        },
        transactions: [],
      });
    }

    // Actualiza la cédula/RUC si no existía
    if (cliente && !cliente.nationalIdentification && body.clientId) {
      await models.clients.updateOne(
        { _id: cliente._id },
        { $set: { nationalIdentification: body.clientId } }
      );
    }
    
    // 3. Crea la transacción con los datos dinámicos
    const transaction = await models.transactions.create({
      transactionId,
      intentId,
      amount: parseFloat(body.amount),
      paymentMethod: paymentMethodString,
      cardInfo: "N/A",
      cardType: "N/A",
      bank: bankProvider,
      date: new Date(),
      description: body.description,
      clientId: cliente._id,
    });

    // 4. Actualiza el cliente con la nueva transacción y fecha de último pago
    await models.clients.updateOne(
      { _id: cliente._id },
      {
        $push: { transactions: transaction._id },
        $set: {
          "paymentInfo.lastPaymentDate": new Date(),
          "paymentInfo.preferredMethod": paymentMethodString,
          "paymentInfo.bank": bankProvider,
        },
      },
    );

    // 5. Lógica para crear un negocio si es el primer pago de un cliente nuevo
    let business = await models.business.findOne({ name: body.businessName });
    if (!business && isFirstPayment) {
      business = await models.business.create({
        name: body.businessName,
        email: body.email,
        phone: body.phone,
        address: "Sin dirección",
        owner: cliente._id,
        ruc: body.clientId || "CONSUMIDOR-FINAL",
      });

      await models.clients.updateOne(
        { _id: cliente._id },
        { $push: { businesses: business._id } },
      );

      console.log(
        "[Manual Payment - Nuevo Negocio Creado]",
        `Negocio: ${business.name}`,
      );
    }

    // 6. Envío de correos electrónicos
    const resendService = new ResendEmail();
    try {
      if (isFirstPayment) {
        await resendService.sendOnboardingEmail(
          body.email,
          body.clientName,
          cliente.id,
          business?.id,
        );
        console.log(
          "[Manual Payment - Email de Onboarding Enviado]",
          `Cliente: ${body.clientName}`,
        );
      } else {
        await resendService.sendPaymentConfirmationEmail(
          body.email,
          body.clientName,
          body.businessName,
        );
        console.log(
          "[Manual Payment - Email de Confirmación Enviado]",
          `Cliente: ${body.clientName}`,
        );
      }
    } catch (emailError) {
      console.error("[Manual Payment - Error al enviar email]", emailError);
    }

    // 7. Envía la respuesta exitosa
    const responseMessage = isFirstPayment
      ? "¡Bienvenido! Tu primer pago ha sido registrado exitosamente. Te enviaremos la información de onboarding por correo."
      : `Gracias por tu pago para ${body.businessName}. La transacción ha sido registrada exitosamente.`;

    res.status(200).json({
      message: responseMessage,
      isFirstPayment,
      transactionId,
    });

  } catch (error) {
    console.error("[Manual Payment - Error Interno]", error);
    res
      .status(500)
      .json({ message: "Error procesando el pago manual" });
  }
}