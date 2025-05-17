import type { Request, Response } from 'express'
import { PagoPluxService } from '../services/pagoplux.service'


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

    // Validación rápida (puedes mejorarla)
    if (!monto || !descripcion || !nombreCliente || !correoCliente || !telefono) {
      res.status(400).json({ message: 'Faltan campos obligatorios' })
      return
    }

    const pagoService = new PagoPluxService()

    const link = await pagoService.createPaymentLink(
      monto,
      descripcion,
      nombreCliente,
      correoCliente,
      telefono,
      prefijo || '+593',
      direccion || 'Sin dirección',
      ci || 'consumidor final'
    )

    res.status(200).json({ url: link })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error desconocido' })
    }
  }
}


export async function receivePaymentController(req: Request, res: Response): Promise<void> {
  try {
    
    const { body }  = req

    console.log('body: ', body)


    res.status(200).json({ message: 'Payment received successfully' })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
      return
    }
  }
}