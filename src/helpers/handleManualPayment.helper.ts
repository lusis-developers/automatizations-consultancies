import { Response } from "express";
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
  bank?: string;
  businessName: string;
  paymentMethod: PayMethod;
}

/**
 * Maneja el registro de un pago manual. La lógica de negocio es:
 * 1. Busca o crea el cliente por su email.
 * 2. Busca un negocio que pertenezca a ESE cliente y tenga ESE nombre.
 * 3. Si no lo encuentra, crea un nuevo negocio y lo vincula al cliente.
 * 4. Registra la transacción y envía las notificaciones.
 * 5. Envía email de Onboarding si el cliente O el negocio son nuevos.
 * @param body El cuerpo de la solicitud con los datos del pago.
 * @param res El objeto de respuesta de Express.
 */
export async function handleManualPayment(
  body: ManualPaymentBody,
  res: Response,
): Promise<void> {
  try {
    // ... (Secciones 1 y 2 permanecen iguales: Buscar/crear cliente) ...
    // 1. Determina los textos y IDs basados en el método de pago
    const paymentMethodString = body.paymentMethod === PayMethod.BANK_TRANSFER 
      ? "Transferencia Bancaria" 
      : "Dátil";
    const bankProvider = body.bank || "No especificado";
    const intentId = body.paymentMethod === PayMethod.BANK_TRANSFER 
      ? "TRANSFER-MANUAL" 
      : "DATIL-MANUAL";
    const transactionId = `${intentId}-${Date.now()}-${body.clientId?.slice(-4) || "XXXX"}`;

    // 2. Busca o crea el cliente. Es el primer paso y el más importante.
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
          bank: bankProvider,
        },
        transactions: [],
        businesses: [],
      });
    } else if (body.clientId && !cliente.nationalIdentification) {
      cliente.nationalIdentification = body.clientId;
      await cliente.save();
    }

    // 3. LÓGICA DE NEGOCIO POR NOMBRE Y DUEÑO
    let business;
    let wasNewBusinessCreated = false;

    business = await models.business.findOne({
      owner: cliente._id,
      name: body.businessName
    });

    if (!business) {
		business = await models.business.create({
			name: body.businessName,
			owner: cliente._id,
			ruc: body.clientId || "",
			email: body.email,
			phone: body.phone,
			address: "Sin dirección",
		});
		wasNewBusinessCreated = true;

		await models.clients.updateOne(
			{ _id: cliente._id },
			{ $push: { businesses: business._id } }
		);
		console.log(
			`[Manual Payment - Nuevo Negocio Creado] Nombre: ${business.name}, Dueño: ${cliente.email}`
		);

		try {
			const resendService = new ResendEmail();
			await resendService.sendPoliciesEmail(cliente.name, cliente.email);
		} catch (policyEmailError) {
			console.error(
				`[Payment Flow] Business ${business.name} created, but policies email failed:`,
				policyEmailError
			);
		}
	}

    // 4. Crea la transacción (esto siempre ocurre)
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

    // 5. Actualiza el cliente con la nueva transacción
    await models.clients.updateOne(
      { _id: cliente._id },
      { $push: { transactions: transaction._id } }
    );

    // 6. LÓGICA DE ENVÍO DE CORREOS CORREGIDA
    const resendService = new ResendEmail();
    try {
      // Se envía Onboarding si es el primer pago del cliente O si se acaba de crear un nuevo negocio.
      if (isFirstPayment || wasNewBusinessCreated) {
        await resendService.sendOnboardingEmail(body.email, body.clientName, cliente.id, business?.id);
        console.log(`[Manual Payment] Email de ONBOARDING enviado para ${business.name}.`);
      } else {
        // Solo se envía confirmación si tanto el cliente como el negocio ya existían.
        await resendService.sendPaymentConfirmationEmail(body.email, body.clientName, body.businessName);
        console.log(`[Manual Payment] Email de Confirmación de Pago enviado para ${business.name}.`);
      }
    } catch (emailError) {
      console.error("[Manual Payment] Error al enviar email:", emailError);
    }

    // 7. Envía la respuesta exitosa
    let responseMessage = `Gracias por tu pago para '${body.businessName}'. La transacción ha sido registrada.`;
    if (wasNewBusinessCreated && !isFirstPayment) {
        responseMessage = `Hemos registrado tu pago y creado tu nuevo negocio: '${body.businessName}'. Te enviaremos un correo con la información de onboarding.`;
    }
    if (isFirstPayment) {
        responseMessage = `¡Bienvenido! Tu primer pago ha sido registrado y tu negocio '${body.businessName}' ha sido creado. Te enviaremos un correo con más información.`;
    }

    res.status(200).json({
      message: responseMessage,
      isFirstPayment,
      wasNewBusinessCreated,
      transactionId,
      clientId: cliente._id,
      businessId: business?._id,
    });

  } catch (error) {
    console.error("[Manual Payment - Error Interno Fatal]", error);
    res.status(500).json({ message: "Error interno del servidor al procesar el pago manual." });
  }
}
