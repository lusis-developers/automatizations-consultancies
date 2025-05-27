import type { Request, Response } from "express";
import models from "../models";
import { HttpStatusCode } from "axios";

export async function getClientAndBusiness(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { clientId, businessId } = req.params;

    const client = await models.clients
      .findById(clientId)
      .populate("businesses");
    if (!client) {
      res.status(404).json({ message: "Cliente no encontrado" });
      return;
    }

    const businessExists = client.businesses.some(
      (b: any) => b._id.toString() === businessId,
    );

    if (!businessExists) {
      res
        .status(404)
        .json({ message: "Negocio no encontrado para este cliente" });
      return;
    }

    res.status(200).json({ client });
  } catch (error) {
    console.error("Error al obtener cliente y negocio:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}


export async function getClientsController(req: Request, res: Response): Promise<void> {
  try {
    const {
      email,
      name,
      phone,
      page = '1',
      limit = '20'
    } = req.query

    const filter: Record<string, any> = {}

    if (email) {
      filter.email = { $regex: new RegExp(email as string, 'i') }
    }

    if (name) {
      filter.name = { $regex: new RegExp(name as string, 'i') }
    }

    if (phone) {
      filter.phone = { $regex: new RegExp(phone as string, 'i') }
    }

    const pageNumber = Math.max(1, parseInt(page as string, 10))
    const pageSize = Math.max(1, parseInt(limit as string, 10))
    const skip = (pageNumber - 1) * pageSize

    const [clients, total] = await Promise.all([
      models.clients
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      models.clients.countDocuments(filter)
    ])

    res.status(200).json({
      data: clients,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error: unknown) {
    console.error('[Clients - Fetch Error]', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    res.status(500).json({ message })
  }
}

export async function getClientById(req: Request, res: Response): Promise<void> {
  try {
    const { clientId } = req.params
    const client = await models.clients.findById(clientId).populate('transactions').populate('businesses')
    
    if (!client) {
      res.status(HttpStatusCode.NotFound).send({ message: 'Client not found' })
      return
    }

    res.status(200).send({ client })
  } catch (error: unknown) {
    console.error('[Client - Fetch Error]', error)
  }
}