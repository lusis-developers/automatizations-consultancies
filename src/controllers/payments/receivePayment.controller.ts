import type { Request, Response } from 'express'


export async function receivePaymentController(req: Request, res: Response): Promise<void> {
  try {
    

    res.status(200).json({ message: 'Payment received successfully' })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
      return
    }
  }
}