import { Response } from "express";
import { Types } from "mongoose";
import models from "../models";
import ResendEmail from "../services/resend.service";

interface DirectTransferBody {
  amount: string;
  clientName: string;
  clientId?: string;
  email: string;
  phone: string;
  description?: string;
  country?: string;
  bank?: string;
  businessName: string;
}

export async function handleDirectTransfer(
  body: DirectTransferBody,
  res: Response,
): Promise<void> {
  try {
    const transactionId = `TRANSFER-${Date.now()}-${body.clientId?.slice(-4) || "XXXX"}`;
    let cliente = await models.clients.findOne({ email: body.email });
    let isFirstPayment = false;

    if (!cliente) {
      isFirstPayment = true;
      cliente = await models.clients.create({
        name: body.clientName,
        email: body.email,
        phone: body.phone,
        dateOfBirth: new Date(), // valor temporal
        city: "No especificada",
        country: body.country || "No especificado",
        paymentInfo: {
          preferredMethod: "Transferencia Bancaria",
          lastPaymentDate: new Date(),
          cardType: "N/A",
          cardInfo: "N/A",
          bank: body.bank || "No especificado",
        },
        transactions: [],
      });
    }

    const transaction = await models.transactions.create({
      transactionId,
      intentId: "TRANSFER-MANUAL",
      amount: parseFloat(body.amount),
      paymentMethod: "Transferencia Bancaria",
      cardInfo: "N/A",
      cardType: "N/A",
      bank: body.bank || "No especificado",
      date: new Date(),
      description: body.description,
      clientId: cliente._id,
      transferClientId: body.clientId || "N/A",
    });

    await models.clients.updateOne(
      { _id: cliente._id },
      {
        $push: { transactions: transaction._id },
        $set: {
          "paymentInfo.lastPaymentDate": new Date(),
          "paymentInfo.preferredMethod": "Transferencia Bancaria",
          "paymentInfo.bank": body.bank || "No especificado",
        },
      },
    );

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
        "[Transfer - Nuevo Negocio Creado]",
        `Negocio: ${business.name}`,
      );
    }

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
          "[Transfer - Email de Onboarding Enviado]",
          `Cliente: ${body.clientName}`,
        );
      } else {
        await resendService.sendPaymentConfirmationEmail(
          body.email,
          body.clientName,
          body.businessName,
        );
        console.log(
          "[Transfer - Email de Confirmación Enviado]",
          `Cliente: ${body.clientName}`,
        );
      }
    } catch (emailError) {
      console.error("[Transfer - Error al enviar email]", emailError);
    }

    const responseMessage = isFirstPayment
      ? "Bienvenido! Tu primer pago ha sido registrado exitosamente. Te enviaremos la información de onboarding por correo."
      : `Gracias por tu pago adicional para ${body.businessName}. La transacción ha sido registrada exitosamente.`;

    res.status(200).json({
      message: responseMessage,
      isFirstPayment,
      transactionId,
    });
  } catch (error) {
    console.error("[Transfer - Error Interno]", error);
    res
      .status(500)
      .json({ message: "Error procesando la transferencia directa" });
  }
}
