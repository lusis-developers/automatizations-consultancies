import type { Request, Response } from 'express'
import { PagoPluxService } from '../services/pagoplux.service'
import { v4 as uuidv4 } from 'uuid'
import models from '../models'
import { PaymentStatus } from '../enums/paymentStatus.enum'
import { handleDirectTransfer } from '../helpers/handleDirectTransfer.helper'
import { handleIntentPayment } from '../helpers/handleIntentPayment.helper'

export async function generatePagopluxPaymentLinkController(req: Request, res: Response): Promise<void> {
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
      nombreNegocio
    } = req.body

    if (!monto || !descripcion || !nombreCliente || !correoCliente || !telefono || !nombreNegocio) {
      res.status(400).json({ message: 'Faltan campos obligatorios' })
      return
    }

    const intentId = uuidv4()

    const pagoService = new PagoPluxService()
    const link = await pagoService.createPaymentLink(
      monto,
      descripcion,
      nombreCliente,
      correoCliente,
      telefono,
      `+${prefijo}` || '+593',
      direccion || 'Sin dirección',
      ci || 'consumidor final',
      `intentId=${intentId}` // extras
    )

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
      businessName: nombreNegocio // Solo guardamos el nombre del negocio
    })

    res.status(200).json({ url: link, intentId })
  } catch (error: unknown) {
    console.error('[PagoPluxController Error]', error)
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error desconocido' })
    }
  }
}


export async function receivePaymentController(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body

    const isDirectTransfer = !body.extras && body.amount && body.clientName

    if (isDirectTransfer) {
      await handleDirectTransfer(body, res)
    } else {
      if (body.state !== PaymentStatus.PAID) {
        console.log('[Webhook - Estado Ignorado]', `Estado: ${body.state}`)
        res.status(200).send({ message: 'Estado ignorado: no pagado' })
        return
      }
      await handleIntentPayment(body, res)
      return
    }
  } catch (error: unknown) {
    console.error('[Webhook - Error Fatal]', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    res.status(500).json({ message })
  }
}