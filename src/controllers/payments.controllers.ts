import type { Request, Response } from 'express'
import { PagoPluxService } from '../services/pagoplux.service'
import { v4 as uuidv4 } from 'uuid'
import models from '../models'
import { PaymentStatus } from '../enums/paymentStatus.enum'
import ResendEmail from '../services/resend.service'

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
    console.log('[Webhook - Payload Recibido]', JSON.stringify(body, null, 2))

    // Si es una transferencia directa, el body tendrá una estructura diferente
    const isDirectTransfer = !body.extras && body.amount && body.clientName

    if (isDirectTransfer) {
      // Generamos un ID de transacción único para transferencias
      const transactionId = `TRANSFER-${Date.now()}-${body.clientId?.slice(-4) || 'XXXX'}`
      
      // Buscamos cliente existente o creamos uno nuevo
      let cliente = await models.clients.findOne({ email: body.email })
      let isFirstPayment = false
      
      if (!cliente) {
        isFirstPayment = true
        cliente = await models.clients.create({
          name: body.clientName,
          email: body.email,
          phone: body.phone,
          dateOfBirth: new Date(),
          city: 'No especificada',
          country: body.country || 'No especificado', // Ahora el país es configurable
          paymentInfo: {
            preferredMethod: 'Transferencia Bancaria',
            lastPaymentDate: new Date(),
            cardType: 'N/A',
            cardInfo: 'N/A',
            bank: body.bank || 'No especificado'
          },
          transactions: []
        })
      }

      // Creamos la transacción
      const transaction = await models.transactions.create({
        transactionId,
        intentId: 'TRANSFER-MANUAL',
        amount: parseFloat(body.amount),
        paymentMethod: 'Transferencia Bancaria',
        cardInfo: 'N/A',
        cardType: 'N/A',
        bank: body.bank || 'No especificado',
        date: new Date(),
        description: body.description,
        clientId: cliente._id,
        transferClientId: body.clientId // Guardamos la cédula del cliente
      })

      // Actualizamos el cliente con la referencia de la transacción
      await models.clients.updateOne(
        { _id: cliente._id },
        {
          $push: { transactions: transaction._id },
          $set: {
            'paymentInfo.lastPaymentDate': new Date(),
            'paymentInfo.preferredMethod': 'Transferencia Bancaria',
            'paymentInfo.bank': body.bank || 'No especificado'
          }
        }
      )

      // Manejamos la creación o actualización del negocio
      let business = await models.business.findOne({ name: body.businessName })
      
      if (!business && isFirstPayment) {
        business = await models.business.create({
          name: body.businessName,
          email: body.email,
          phone: body.phone,
          address: 'Sin dirección',
          owner: cliente._id,
          ruc: body.clientId || 'CONSUMIDOR-FINAL' // Agregamos el RUC usando el clientId o un valor por defecto
        })
      
        await models.clients.updateOne(
          { _id: cliente._id },
          { $push: { businesses: business._id } }
        )
      
        console.log('[Transfer - Nuevo Negocio Creado]', `Negocio: ${business.name}`)
      }

      // Enviamos el email correspondiente
      try {
        const resendService = new ResendEmail()
        if (isFirstPayment) {
          await resendService.sendOnboardingEmail(
            body.email,
            body.clientName,
            cliente.id,
            business?.id
          )
          console.log('[Transfer - Email de Onboarding Enviado]', `Cliente: ${body.clientName}`)
        } else {
          await resendService.sendPaymentConfirmationEmail(
            body.email,
            body.clientName,
            body.businessName
          )
          console.log('[Transfer - Email de Confirmación Enviado]', `Cliente: ${body.clientName}`)
        }
      } catch (emailError) {
        console.error('[Transfer - Error al enviar email]', emailError)
      }

      const responseMessage = isFirstPayment
        ? 'Bienvenido! Tu primer pago ha sido registrado exitosamente. Te enviaremos la información de onboarding por correo.'
        : `Gracias por tu pago adicional para ${body.businessName}. La transacción ha sido registrada exitosamente.`

      res.status(200).json({ 
        message: responseMessage,
        isFirstPayment,
        transactionId
      })
      return
    }

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
    
    // Buscamos cliente existente o creamos uno nuevo
    let cliente = await models.clients.findOne({ email: intent.email })
    let isFirstPayment = false
    
    // Modificamos la creación del cliente para manejar transferencia
    if (!cliente) {
      isFirstPayment = true
      // Si no existe el cliente, lo creamos
      cliente = await models.clients.create({
        name: body.clientName,
        email: intent.email,
        phone: intent.phone,
        dateOfBirth: new Date(),
        city: 'No especificada',
        country: body.country || 'No especificado', // También actualizamos aquí
        paymentInfo: {
          preferredMethod: body.typePayment === 'TRANSFER' ? 'Transferencia Bancaria' : body.typePayment,
          lastPaymentDate: new Date(),
          cardType: body.typePayment === 'TRANSFER' ? 'N/A' : body.cardType,
          cardInfo: body.typePayment === 'TRANSFER' ? 'N/A' : body.cardInfo,
          bank: body.bank || 'No especificado'
        },
        transactions: []
      })
    }

    // Modificamos la creación de la transacción para manejar transferencia
    const transaction = await models.transactions.create({
      transactionId: body.id_transaccion,
      intentId: intentId,
      amount: parseFloat(body.amount),
      paymentMethod: body.typePayment === 'TRANSFER' ? 'Transferencia Bancaria' : body.typePayment,
      cardInfo: body.typePayment === 'TRANSFER' ? 'N/A' : body.cardInfo,
      cardType: body.typePayment === 'TRANSFER' ? 'N/A' : body.cardType,
      bank: body.bank || 'No especificado',
      date: new Date(),
      description: intent.description,
      clientId: cliente._id
    })

    // Actualizamos el cliente con la referencia de la transacción
    await models.clients.updateOne(
      { _id: cliente._id },
      {
        $push: {
          transactions: transaction._id
        },
        $set: {
          'paymentInfo.lastPaymentDate': new Date(),
          'paymentInfo.preferredMethod': body.typePayment === 'TRANSFER' ? 'Transferencia Bancaria' : body.typePayment,
          'paymentInfo.cardType': body.typePayment === 'TRANSFER' ? 'N/A' : body.cardType,
          'paymentInfo.cardInfo': body.typePayment === 'TRANSFER' ? 'N/A' : body.cardInfo,
          'paymentInfo.bank': body.bank || 'No especificado'
        }
      }
    )

    // Después de crear el cliente y antes de actualizar el intento de pago
    // Creamos el negocio si no existe y es el primer pago
    let business = await models.business.findOne({ name: intent.businessName })
    
    if (!business && isFirstPayment) {
      business = await models.business.create({
        name: intent.businessName,
        email: intent.email,
        phone: intent.phone,
        address: 'Sin dirección',
        owner: cliente._id
      })

      // Actualizamos el cliente con la referencia al negocio
      await models.clients.updateOne(
        { _id: cliente._id },
        {
          $push: {
            businesses: business._id
          }
        }
      )

      console.log('[Webhook - Nuevo Negocio Creado]', `Negocio: ${business.name}`)
    } else if (business) {
      console.log('[Webhook - Negocio Existente]', `Negocio: ${business.name}, Cliente: ${cliente.name}`)
    }

    // Actualizamos intento de pago
    await models.paymentsIntents.updateOne(
      { intentId },
      {
        $set: {
          state: PaymentStatus.PAID,
          transactionId: body.id_transaccion,
          paidAt: new Date(),
          userId: cliente._id,
          businessId: business?._id
        }
      }
    )

    // Después de crear el negocio y antes de la respuesta final
    if (isFirstPayment) {
      try {
        const resendService = new ResendEmail()
        await resendService.sendOnboardingEmail(
          intent.email!,
          cliente.name,
          cliente.id,
          business?.id
        )
        
        console.log('[Webhook - Email de Onboarding Enviado]', `Cliente: ${cliente.name}`)
      } catch (emailError) {
        console.error('[Webhook - Error al enviar email]', emailError)
        // No interrumpimos el flujo si falla el envío del correo
      }
    } else {
      // Enviamos el correo de confirmación de pago para pagos subsecuentes
      try {
        const resendService = new ResendEmail()
        await resendService.sendPaymentConfirmationEmail(
          intent.email!,
          cliente.name,
          intent.businessName
        )
        
        console.log('[Webhook - Email de Confirmación de Pago Enviado]', `Cliente: ${cliente.name}`)
      } catch (emailError) {
        console.error('[Webhook - Error al enviar email de confirmación]', emailError)
        // No interrumpimos el flujo si falla el envío del correo
      }
    }

    // Preparamos el mensaje de respuesta según si es primer pago o no
    const responseMessage = isFirstPayment
      ? 'Bienvenido! Tu primer pago ha sido registrado exitosamente. Te enviaremos la información de onboarding por correo.'
      : `Gracias por tu pago adicional para ${intent.businessName}. La transacción ha sido registrada exitosamente.`

    console.log('[Webhook - Proceso Completado]', `IntentId: ${intentId}`)
    res.status(200).json({ 
      message: responseMessage,
      isFirstPayment
    })

  } catch (error: unknown) {
    console.error('[Webhook - Error Fatal]', error)
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error desconocido' })
    }
  }
}