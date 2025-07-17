import type { Request, Response, NextFunction } from "express";
import models from "../models";
import { HttpStatusCode } from "axios";
import { MeetingStatus, MeetingType } from "../enums/meetingStatus.enum";
import { Types } from "mongoose";
import { IMeeting } from "../models/meeting.model";
import { IClient } from "../models/clients.model";
import { IBusiness } from "../models/business.model";

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

export async function handleAppointmentWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, phone, calendar } = req.body;

    console.log('req.body: ', req.body)
    if (!calendar || !calendar.appointmentId) {
      console.log("[Webhook] Ignored: Incomplete calendar data.");
      res.status(HttpStatusCode.Ok).send({ message: "Incomplete calendar data." });
      return;
    }

    const existingMeeting = await models.meetings.findOne({ sourceId: calendar.appointmentId });
    if (existingMeeting) {
      console.log(`[Webhook] Ignored: Meeting with ID ${calendar.appointmentId} already exists.`);
      res.status(HttpStatusCode.Ok).send({ message: "Meeting already processed." });
      return;
    }

    let client: IClient | null = null;
    let businessToAssign: IBusiness | null = null;
    const searchCriteria = [];
    if (email) searchCriteria.push({ email: email.toLowerCase() });
    if (phone) {
      const normalizedPhone = phone.replace(/[\s\-()+\D]/g, '');
      searchCriteria.push({ phone: new RegExp(normalizedPhone + '$') });
    }

    if (searchCriteria.length > 0) {
      client = await models.clients.findOne({ $or: searchCriteria });
    }

    if (!client && email) {
      const businessWithManager = await models.business.findOne({ "managers.email": email.toLowerCase() });
      if (businessWithManager) {
        businessToAssign = businessWithManager;
        client = await models.clients.findById(businessWithManager.owner);
      }
    }

    if (client && !businessToAssign) {
      const clientBusinesses = await models.business.find({ owner: client._id });
      if (clientBusinesses.length === 1) {
        businessToAssign = clientBusinesses[0];
        console.log(`[Webhook] Client with one business. Auto-assigning to ${businessToAssign.name}`);
      } else {
        console.log(`[Webhook] Client ${client.email} has ${clientBusinesses.length} businesses. Meeting requires manual business assignment.`);
      }
    }

    let assignedToExpertName: string | null = null;
    let meetingType: MeetingType | null = null;

    if (calendar.calendarName === "MEETING ACCESO PORTAFOLIO EMPRESARIAL") {
      assignedToExpertName = "Denisse Quimi";
      meetingType = MeetingType.PORTFOLIO_ACCESS;
    } else if (calendar.calendarName === "PRIMER MEETING CON EXPERTO ANALISIS DE DATOS (LUIS)") {
      assignedToExpertName = "Luis Reyes";
      meetingType = MeetingType.DATA_STRATEGY;
    }

    if (!assignedToExpertName || !meetingType) {
        console.warn(`[Webhook] Unrecognized calendar type: ${calendar.calendarName}`);
        res.status(HttpStatusCode.Ok).send({message: "Unhandled calendar type."});
        return;
    }

    const meetingData: Partial<IMeeting> = {
      assignedTo: assignedToExpertName,
      status: MeetingStatus.SCHEDULED,
      meetingType: meetingType,
      scheduledTime: new Date(calendar.startTime),
      endTime: new Date(calendar.endTime),
      meetingLink: calendar.address,
      sourceId: calendar.appointmentId,
      attendeeEmail: email,
      attendeePhone: phone,
    };

    if (client) {
      meetingData.client = client;
    } else {
      console.warn(`[Webhook] No client or manager found for appointment ${calendar.appointmentId}. Creating unassigned meeting.`);
      meetingData.attendeeEmail = email;
      meetingData.attendeePhone = phone;
    }

    if (businessToAssign) {
      meetingData.business = businessToAssign;
    }

    const newMeeting = await models.meetings.create(meetingData);

    if (client) {
      client.meetings.push(newMeeting._id);
      await client.save();
      console.log(`[Webhook] New meeting created and associated with client ${client.email}`);
    }

    res.status(HttpStatusCode.Ok).send({ message: "Webhook processed successfully." });
    return
  } catch (error: unknown) {
    console.error("Error in appointment webhook:", error);
    next(error);
  }
}

export async function getClientMeetingStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Obtener y validar el ID del cliente (sin cambios)
    const { clientId } = req.params;
    if (!Types.ObjectId.isValid(clientId)) {
      res.status(400).json({ message: "El ID del cliente proporcionado no es válido." });
      return;
    }

    // 2. Buscar al cliente y poblar sus reuniones (sin cambios)
    const client = await models.clients.findById(clientId).populate('meetings');

    if (!client) {
      res.status(404).json({ message: "Cliente no encontrado." });
      return;
    }

    // --- LÓGICA NUEVA para encontrar la última reunión creada ---

    // 3. Verificamos si el cliente tiene reuniones
    if (!client.meetings || client.meetings.length === 0) {
      // Si no hay ninguna reunión, lo informamos como antes.
      res.status(200).json({
        hasScheduledMeeting: false,
        message: "El cliente no tiene ninguna reunión en su historial.",
      });
      return;
    }

    // 4. Ordenamos todas las reuniones por su fecha de creación (createdAt) de forma descendente.
    // Usamos [...client.meetings] para crear una copia y no modificar el array original.
    const sortedMeetings = [...client.meetings].sort((a: IMeeting, b: IMeeting) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 5. La "última" reunión es la primera de la lista ya ordenada.
    const latestMeeting = sortedMeetings[0];

    // 6. Formular y enviar la respuesta para el frontend
    // Adaptamos la respuesta para que siga siendo útil para tu componente.
    res.status(200).json({
      // Indicamos que SÍ se encontró una reunión (la última) para analizar.
      hasScheduledMeeting: true, 
      meeting: {
        id: latestMeeting._id,
        status: latestMeeting.status,
        meetingType: latestMeeting.meetingType,
        assignedTo: latestMeeting.assignedTo,
        scheduledTime: latestMeeting.scheduledTime,
        meetingLink: latestMeeting.meetingLink,
        // Añadimos createdAt para que puedas verificar si lo necesitas
        createdAt: latestMeeting.createdAt 
      },
    });

  } catch (error: unknown) {
    console.error("Error al obtener el estado de la reunión del cliente:", error);
    next(error);
  }
}

export async function confirmStrategyMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { clientId } = req.params;
    const { portfolioMeetingId } = req.body;

    // Validaciones de seguridad
    if (!Types.ObjectId.isValid(clientId) || !Types.ObjectId.isValid(portfolioMeetingId)) {
      res.status(400).json({ message: "IDs de cliente o reunión no válidos." });
      return
    }
    const portfolioMeeting = await models.meetings.findById(portfolioMeetingId);
    if (!portfolioMeeting || portfolioMeeting.client!.toString() !== clientId || portfolioMeeting.meetingType !== MeetingType.PORTFOLIO_ACCESS) {
      res.status(404).json({ message: "La reunión de acceso especificada no es válida o no corresponde a este cliente." });
      return
    }

    // Paso 1: Completar la reunión actual
    portfolioMeeting.status = MeetingStatus.COMPLETED;
    await portfolioMeeting.save();
    console.log(`Reunión de portafolio ${portfolioMeetingId} marcada como completada.`);

    // Verificamos si la reunión de estrategia ya fue creada para no duplicarla
    const existingStrategyMeeting = await models.meetings.findOne({
        client: clientId,
        meetingType: MeetingType.DATA_STRATEGY,
    });

    if (existingStrategyMeeting) {
      console.log(`El cliente ${clientId} ya tiene una reunión de estrategia pendiente.`);
      res.status(200).json({ 
        message: "Acceso confirmado. La reunión de estrategia ya existía.",
        strategyMeeting: existingStrategyMeeting 
      });
      return
    }

    // Paso 2: Crear la nueva reunión en estado "pendiente"
    const newStrategyMeeting = new models.meetings({
        client: clientId,
        assignedTo: "Luis Reyes (Experto en Estrategia)",
        status: MeetingStatus.PENDING_SCHEDULE, // <-- El estado clave
        meetingType: MeetingType.DATA_STRATEGY,
    });
    await newStrategyMeeting.save();

    // Paso 3: Asociar la nueva reunión al cliente
    await models.clients.findByIdAndUpdate(clientId, {
        $push: { meetings: newStrategyMeeting._id }
    });
    
    console.log(`Nueva reunión de Estrategia (pendiente) creada para el cliente ${clientId}`);

    // Devolvemos la información de la nueva reunión creada
    res.status(200).json({ 
      message: "Acceso a portafolio confirmado y reunión de estrategia habilitada.",
      strategyMeeting: newStrategyMeeting 
    });

    return
  } catch (error: unknown) {
    console.error("Error al confirmar la reunión de estrategia:", error);
    next(error);
  }
}

export async function getAllMeetings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { clientId } = req.params;
    const client = await models.clients.findById(clientId).populate('meetings');

    if (!client) {
      res.status(404).json({ message: "Cliente no encontrado." });
      return
    }

    res.status(200).json({
      message: "Reuniones del cliente obtenidas exitosamente.",
      meetings: client.meetings
    });

  } catch (error: unknown) {
    console.error("Error al obtener todas las reuniones del cliente:", error);
    next(error);
  }
}

export async function getUnassignedMeetingsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = "1", limit = "10" } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNumber - 1) * pageSize;

    const filter = { client: { $in: [null, undefined] } };

    const [unassignedMeetings, total] = await Promise.all([
      models.meetings
        .find(filter)
        .sort({ scheduledTime: 1 })
        .skip(skip)
        .limit(pageSize),
      models.meetings.countDocuments(filter),
    ]);

    res.status(200).json({
      data: unassignedMeetings,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: unknown) {
    console.error("Error getting unassigned meetings:", error);
    next(error);
  }
}

export async function assignMeetingController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { meetingId } = req.params;
    const { clientId, businessId } = req.body;

    if (!Types.ObjectId.isValid(meetingId) || !Types.ObjectId.isValid(clientId)) {
      res.status(HttpStatusCode.BadRequest).send({ message: "Meeting ID or client ID is invalid." });
      return;
    }
    if (businessId && !Types.ObjectId.isValid(businessId)) {
      res.status(HttpStatusCode.BadRequest).send({ message: "The provided business ID is invalid." });
      return;
    }

    const [meeting, client, business] = await Promise.all([
      models.meetings.findOne({ _id: meetingId, client: { $in: [null, undefined] } }),
      models.clients.findById(clientId),
      businessId ? models.business.findById(businessId) : Promise.resolve(null)
    ]);

    if (!meeting) {
      res.status(HttpStatusCode.NotFound).send({ message: "Meeting not found or already has an assigned client." });
      return;
    }
    if (!client) {
      res.status(HttpStatusCode.NotFound).send({ message: "Client not found." });
      return;
    }
    if (businessId && !business) {
        res.status(HttpStatusCode.NotFound).send({ message: "Business not found." });
        return;
    }
    if (business) {
      if (business.owner.toString() !== client._id.toString()) {
        res.status(HttpStatusCode.Conflict).send({ message: "Assignment error: This business does not belong to the selected client." });
        return;
      }
    }
    
    meeting.client = client;
    if (business) {
      meeting.business = business;
    }
    
    client.meetings.push(meeting._id);

    await Promise.all([
      meeting.save(),
      client.save()
    ]);

    console.log(`Meeting ${meeting._id} successfully assigned to client ${client.email}`);
    if(business) {
        console.log(`... and to business ${business.name}`);
    }

    res.status(HttpStatusCode.Ok).send({
      message: "Meeting successfully assigned.",
      data: meeting,
    });

  } catch (error: unknown) {
    console.error("Error assigning meeting:", error);
    next(error);
  }
}