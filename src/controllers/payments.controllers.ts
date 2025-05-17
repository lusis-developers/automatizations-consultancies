import type { Request, Response } from 'express'
import { PagoPluxService } from '../services/pagoplux.service'
import { v4 as uuidv4 } from 'uuid'
import models from '../models'
import { IPagopluxWebhookResponse } from '../types/pagoplux.types'
import { PaymentStatus } from '../enums/paymentStatus.enum'

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
      ci
    } = req.body

    if (!monto || !descripcion || !nombreCliente || !correoCliente || !telefono) {
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
      prefijo || '+593',
      direccion || 'Sin dirección',
      ci || 'consumidor final',
      `intentId=${intentId}` // extras
    )

    await models.paymentsIntents.create({
      intentId,
      status: 'pending',
      email: correoCliente,
      name: nombreCliente,
      phone: telefono,
      amount: monto,
      description: descripcion,
      paymentLink: link,
      createdAt: new Date()
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
    const body: IPagopluxWebhookResponse = req.body
    console.log('[Webhook - Payload Recibido]', JSON.stringify(body, null, 2))

    // Validamos estado del pago
    console.log('[Webhook - Validando Estado]', `Estado actual: ${body.state}`)
    if (body.state !== PaymentStatus.PAID) {
      console.log('[Webhook - Estado Ignorado]', `Estado: ${body.state}`)
      res.status(200).json({ message: 'Estado ignorado: no pagado' })
      return
    }

    // Parseamos extras
    console.log('[Webhook - Parseando Extras]', `Extras recibidos: ${body.extras}`)
    const parsedExtras = body.extras ? new URLSearchParams(body.extras) : {}
    const intentId = parsedExtras instanceof URLSearchParams ? parsedExtras.get('intentId') || '' : ''
    console.log('[Webhook - IntentId Extraído]', intentId)

    if (!intentId) {
      console.log('[Webhook - Error]', 'No se encontró intentId en extras')
      res.status(400).json({ message: 'Extras sin intentId' })
      return
    }

    // Buscamos el intento
    console.log('[Webhook - Buscando Intento de Pago]', `IntentId: ${intentId}`)
    const intent = await models.paymentsIntents.findOne({ intentId })
    console.log('[Webhook - Intento Encontrado]', intent)

    if (!intent) {
      console.log('[Webhook - Error]', `Intento no encontrado para id: ${intentId}`)
      res.status(404).json({ message: 'Intento de pago no encontrado' })
      return
    }

    // Verificamos si ya fue procesado
    console.log('[Webhook - Verificando Estado Previo]', `Estado actual: ${intent.state}`)
    if (intent.state === PaymentStatus.PAID) {
      console.log('[Webhook - Pago Ya Procesado]', `IntentId: ${intentId}`)
      res.status(200).json({ message: 'Pago ya procesado previamente' })
      return
    }

    // Creamos cliente
    console.log('[Webhook - Creando Cliente]', {
      nombre: body.clientName,
      email: intent.email,
      telefono: intent.phone
    })
    
    const cliente = await models.clients.create({
      name: body.clientName,
      email: intent.email,
      phone: intent.phone,
      dateOfBirth: new Date(),
      city: 'No especificada',
      country: 'Ecuador',
      paymentInfo: {
        preferredMethod: body.typePayment,
        lastPaymentDate: new Date(),
        cardType: body.cardType,
        cardInfo: body.cardInfo,
        bank: body.bank
      },
      createdAt: new Date()
    })
    console.log('[Webhook - Cliente Creado]', cliente)

    // Actualizamos intento
    console.log('[Webhook - Actualizando Intento]', {
      intentId,
      transactionId: body.id_transaccion,
      userId: cliente._id
    })
    
    await models.paymentsIntents.updateOne(
      { intentId },
      {
        $set: {
          status: 'paid',
          transactionId: body.id_transaccion,
          paidAt: new Date(),
          userId: cliente._id
        }
      }
    )

    console.log('[Webhook - Proceso Completado]', `IntentId: ${intentId}`)
    res.status(200).json({ message: 'Cliente creado y pago registrado exitosamente' })

  } catch (error: unknown) {
    console.error('[Webhook - Error Fatal]', error)
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    }
  }
}