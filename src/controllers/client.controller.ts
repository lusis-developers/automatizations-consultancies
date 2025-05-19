import type { Request, Response } from 'express'
import models from '../models'

export async function getClientAndBusiness(req: Request, res: Response): Promise<void> {
  try {
    const { clientId, businessId } = req.params;

    const client = await models.clients.findById(clientId).populate('businesses');
    if (!client) {
      res.status(404).json({ message: 'Cliente no encontrado' });
      return;
    }

    const businessExists = client.businesses.some(
      (b: any) => b._id.toString() === businessId
    );

    if (!businessExists) {
      res.status(404).json({ message: 'Negocio no encontrado para este cliente' });
      return;
    }

    res.status(200).json({ client });
  } catch (error) {
    console.error('Error al obtener cliente y negocio:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}