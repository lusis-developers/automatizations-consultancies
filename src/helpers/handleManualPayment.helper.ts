import { Response } from "express";
import models from "../models";
import ResendEmail from "../services/resend.service";
import { BusinessTypeEnum } from "../enums/businessType.enum";
import { ClientTypeEnum } from "../enums/clientType.enum";

export enum PayMethod {
  PAGOPLUX = "pagoplux",
  BANK_TRANSFER = "bank transfer",
  DATIL = "datil",
}

export interface ManualPaymentBody {
  amount: string;
  clientName: string;
  clientId?: string;
  email: string;
  phone: string;
  description?: string;
  country?: string;
  bank?: string;
  businessName: string;
  businessType: BusinessTypeEnum;
  clientType?: ClientTypeEnum;
  valueProposition?: string;
  paymentMethod: PayMethod;
}

export async function handleManualPayment(
  body: ManualPaymentBody,
  res: Response,
): Promise<void> {
  try {
    let hasRucConflict = false; // Track RUC conflicts for warning purposes
    
    const paymentMethodString =
      body.paymentMethod === PayMethod.BANK_TRANSFER
        ? "Transferencia Bancaria"
        : "Dátil";
    const bankProvider = body.bank || "No especificado";
    const intentId =
      body.paymentMethod === PayMethod.BANK_TRANSFER
        ? "TRANSFER-MANUAL"
        : "DATIL-MANUAL";
    const transactionId = `${intentId}-${Date.now()}-${
      body.clientId?.slice(-4) || "XXXX"
    }`;

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
        clientType: body.clientType || ClientTypeEnum.MEDIUM,
        paymentInfo: {
          preferredMethod: paymentMethodString,
          lastPaymentDate: new Date(),
          bank: bankProvider,
        },
        transactions: [],
        businesses: [],
      });
    } else if (body.clientId && !cliente.nationalIdentification) {
      cliente.nationalIdentification = body.clientId;
      await cliente.save();
    }

    let business;
    let wasNewBusinessCreated = false;

    if (
      !body.businessType ||
      !Object.values(BusinessTypeEnum).includes(body.businessType)
    ) {
      res.status(400).send({
        message: `The business type '${body.businessType}' is not valid.`,
      });
      return;
    }

    business = await models.business.findOne({
      owner: cliente._id,
      name: body.businessName,
    });

    if (!business) {
      try {
        // Use clientId as RUC if provided, otherwise leave undefined to avoid null conflicts
        const rucValue = body.clientId && body.clientId.trim() !== '' ? body.clientId.trim() : undefined;
        
        // Check if RUC already exists when provided (for warning purposes only)
        if (rucValue) {
          const existingBusinessWithRuc = await models.business.findOne({ ruc: rucValue });
          if (existingBusinessWithRuc) {
            hasRucConflict = true;
            console.warn(`[Manual Payment] Warning: Creating business with duplicate RUC: ${rucValue}`);
          }
        }
        
        business = await models.business.create({
          name: body.businessName,
          businessType: body.businessType,
          valueProposition: body.valueProposition,
          owner: cliente._id,
          ruc: rucValue,
          email: body.email,
          phone: body.phone,
          address: "Sin dirección",
        });
        wasNewBusinessCreated = true;

        await models.clients.updateOne(
          { _id: cliente._id },
          { $push: { businesses: business._id } },
        );

        const resendService = new ResendEmail();
        await resendService.sendPoliciesEmail(cliente.name, cliente.email);

      } catch (error: any) {
        if (error.code === 11000 && error.keyPattern?.ruc) {
            // Handle duplicate RUC by creating business without RUC and setting conflict flag
            console.warn(`[Manual Payment] Conflict: Creating business without RUC due to duplicate: ${error.keyValue.ruc}`);
            hasRucConflict = true;
            
            business = await models.business.create({
              name: body.businessName,
              businessType: body.businessType,
              valueProposition: body.valueProposition,
              owner: cliente._id,
              ruc: undefined, // Don't set RUC to avoid conflict
              email: body.email,
              phone: body.phone,
              address: "Sin dirección",
            });
            wasNewBusinessCreated = true;

            await models.clients.updateOne(
              { _id: cliente._id },
              { $push: { businesses: business._id } },
            );

            const resendService = new ResendEmail();
            await resendService.sendPoliciesEmail(cliente.name, cliente.email);
        } else {
          throw error;
        }
      }
    }

    const transaction = await models.transactions.create({
      transactionId,
      intentId,
      amount: parseFloat(body.amount),
      paymentMethod: paymentMethodString,
      bank: bankProvider,
      date: new Date(),
      description: body.description || "Sin descripción",
      clientId: cliente._id,
    });

    await models.clients.updateOne(
      { _id: cliente._id },
      { $push: { transactions: transaction._id } },
    );

    const resendService = new ResendEmail();
    try {
      if (isFirstPayment || wasNewBusinessCreated) {
        await resendService.sendOnboardingEmail(
          body.email,
          body.clientName,
          cliente.id,
          business?.id,
        );
      } else {
        await resendService.sendPaymentConfirmationEmail(
          body.email,
          body.clientName,
          body.businessName,
        );
      }
    } catch (emailError) {
      console.error("[Manual Payment] Error sending email:", emailError);
    }

    let responseMessage = `Thank you for your payment to '${body.businessName}'. Transaction recorded.`;
    if (wasNewBusinessCreated && !isFirstPayment) {
      responseMessage = `Payment recorded and new business created: '${body.businessName}'. 
      Onboarding email coming soon.`;
    }
    if (isFirstPayment) {
      responseMessage = `Welcome! First payment recorded and '${body.businessName}' created. 
      Check email for details.`;
    }

    // Add RUC conflict warning if applicable
    if (hasRucConflict) {
      responseMessage += ` Warning: The RUC '${body.clientId}' is already registered by another business in the system. This may cause conflicts later.`;
    }

    res.status(200).json({
      message: responseMessage,
      isFirstPayment,
      wasNewBusinessCreated,
      hasRucConflict,
      transactionId,
      clientId: cliente._id,
      businessId: business?._id,
    });
  } catch (error) {
    console.error("[Manual Payment - Error Interno Fatal]", error);
    res.status(500).json({
      message: "Internal server error while processing manual payment.", error
    });
  }
}