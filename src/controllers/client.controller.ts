import type { Request, Response } from 'express'
import models from '../models'

export async function getClient(req: Request, res: Response): Promise<void> {
  try {
    console.log(req.params)
    const { clientId } = req.params
    console.log('clientId', clientId)
    const client = await models.clients.findById(clientId)

    if (!client) {
      res.status(404).send({ message: 'Client not found' })
      return
    }

    res.status(200).send(client)

    return
  } catch (error) {
    console.log(error)
  }
}