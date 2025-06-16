import type { Request, Response } from "express";
import { PagoPluxService } from "../services/pagoplux.service";
import { v4 as uuidv4 } from "uuid";
import models from "../models";
import { PaymentStatus } from "../enums/paymentStatus.enum";
import { handleIntentPayment } from "../helpers/handleIntentPayment.helper";
import { handleManualPayment } from "../helpers/handleManualPayment.helper";

export async function generatePagopluxPaymentLinkController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      monto,
      descripcion,
      nombreCliente,
      correoCliente,
      telefono,
      prefijo,
      direccion,
      ci,
      nombreNegocio,
    } = req.body;

    if (
      !monto ||
      !descripcion ||
      !nombreCliente ||
      !correoCliente ||
      !telefono ||
      !nombreNegocio
    ) {
      res.status(400).json({ message: "Faltan campos obligatorios" });
      return;
    }

    const intentId = uuidv4();

    const pagoService = new PagoPluxService();
    const link = await pagoService.createPaymentLink(
      monto,
      descripcion,
      nombreCliente,
      correoCliente,
      telefono,
      `+${prefijo}` || "+593",
      direccion || "Sin dirección",
      ci || "consumidor final",
      `intentId=${intentId}`, // extras
    );

    await models.paymentsIntents.create({
      intentId,
      state: PaymentStatus.PENDING,
      email: correoCliente,
      name: nombreCliente,
      phone: telefono,
      amount: monto,
      description: descripcion,
      paymentLink: link,
      createdAt: new Date(),
      businessName: nombreNegocio, // Solo guardamos el nombre del negocio
    });

    res.status(200).json({ url: link, intentId });
  } catch (error: unknown) {
    console.error("[PagoPluxController Error]", error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error desconocido" });
    }
  }
}

export async function receivePaymentController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const body = req.body;

    const isDirectTransfer = !body.extras && body.amount && body.clientName;

    if (isDirectTransfer) {
      await handleManualPayment(body, res);
    } else {
      if (body.state !== PaymentStatus.PAID) {
        console.log("[Webhook - Estado Ignorado]", `Estado: ${body.state}`);
        res.status(200).send({ message: "Estado ignorado: no pagado" });
        return;
      }
      await handleIntentPayment(body, res);
      return;
    }
  } catch (error: unknown) {
    console.error("[Webhook - Error Fatal]", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    res.status(500).json({ message });
  }
}

export async function getTransactionsController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
  } catch (error: unknown) {
    console.error("[Webhook - Error Fatal]", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    res.status(500).send({ message });
  }
}

export async function getPagopluxPaymentIntentsController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      from,
      to,
      state,
      businessName,
      email,
      page = "1",
      limit = "20",
    } = req.query;

    const filter: Record<string, any> = {};

    // Rango de fechas
    if (from || to) {
      filter.createdAt = {};
      if (from && !isNaN(Date.parse(from as string))) {
        filter.createdAt.$gte = new Date(from as string);
      }
      if (to && !isNaN(Date.parse(to as string))) {
        filter.createdAt.$lte = new Date(to as string);
      }
    }

    // Estado de pago
    if (
      state &&
      Object.values(PaymentStatus).includes(state as PaymentStatus)
    ) {
      filter.state = state;
    }

    // Negocio
    if (businessName) {
      filter.businessName = { $regex: new RegExp(businessName as string, "i") };
    }

    // Email
    if (email) {
      filter.email = { $regex: new RegExp(email as string, "i") };
    }

    // Paginación
    const pageNumber = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNumber - 1) * pageSize;

    const [intents, total] = await Promise.all([
      models.paymentsIntents
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      models.paymentsIntents.countDocuments(filter),
    ]);

    res.status(200).send({
      data: intents,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: unknown) {
    console.error("[Pagoplux - Error al buscar intents]", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    res.status(500).send({ message });
  }
}

export async function getPaymentsSummaryController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { from, to } = req.query

    const dateFilter: Record<string, any> = {}

    if (from || to) {
      dateFilter.createdAt = {}
      if (from && !isNaN(Date.parse(from as string))) {
        dateFilter.createdAt.$gte = new Date(from as string)
      }
      if (to && !isNaN(Date.parse(to as string))) {
        dateFilter.createdAt.$lte = new Date(to as string)
      }
    }

    const [paymentIntents, transactions] = await Promise.all([
      models.paymentsIntents.find(dateFilter),
      models.transactions.find(dateFilter),
    ])

    // Summary from intents
    let totalIntents = paymentIntents.length
    let totalIntentAmount = 0

    let pendingCount = 0
    let pendingAmount = 0

    let paidCount = 0
    let paidAmount = 0

    for (const intent of paymentIntents) {
      totalIntentAmount += intent.amount

      if (intent.state === PaymentStatus.PENDING) {
        pendingCount++
        pendingAmount += intent.amount
      } else if (intent.state === PaymentStatus.PAID) {
        paidCount++
        paidAmount += intent.amount
      }
    }

    // Transactions grouped
    let withIntentCount = 0
    let withIntentAmount = 0

    let directTransferCount = 0
    let directTransferAmount = 0

    const intentIdsSet = new Set(paymentIntents.map((i) => i.intentId))

    for (const tx of transactions) {
      if (intentIdsSet.has(tx.intentId)) {
        withIntentCount++
        withIntentAmount += tx.amount
      } else {
        directTransferCount++
        directTransferAmount += tx.amount
      }
    }

    const totalTransactions = transactions.length
    const totalPaidAmount = withIntentAmount + directTransferAmount

    res.status(200).send({
      summary: {
        dateRange: {
          from: from || null,
          to: to || null,
        },
        intents: {
          totalCount: totalIntents,
          totalAmount: totalIntentAmount,
          pending: {
            count: pendingCount,
            amount: pendingAmount,
          },
          paid: {
            count: paidCount,
            amount: paidAmount,
          },
        },
        confirmedPayments: {
          total: totalTransactions,
          totalPaidAmount,
          withIntent: {
            count: withIntentCount,
            amount: withIntentAmount,
          },
          directTransfer: {
            count: directTransferCount,
            amount: directTransferAmount,
          },
        },
      },
    })
  } catch (error: unknown) {
    console.error('[Payments - Summary Error]', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ message })
  }
}