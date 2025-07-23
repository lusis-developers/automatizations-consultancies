import type { Request, Response, NextFunction } from "express";
import models from "../models";
import { HttpStatusCode } from "axios";
import { MeetingStatus, MeetingType } from "../enums/meetingStatus.enum";
import { Types } from "mongoose";
import { IMeeting } from "../models/meeting.model";
import { IClient } from "../models/clients.model";
import { IBusiness } from "../models/business.model";
import { MeetingService } from "../services/meeting.service";
import { OnboardingStepEnum } from "../enums/onboardingStep.enum";

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
      const businessesWithManager = await models.business.find({ "managers.email": email.toLowerCase() });
      
      if (businessesWithManager.length === 1) {
        businessToAssign = businessesWithManager[0];
        client = await models.clients.findById(businessToAssign.owner);
      } else if (businessesWithManager.length > 1) {
        console.log(`[Webhook] Manager with email ${email} exists in multiple businesses. Meeting requires manual assignment.`);
      }
    }

    if (client && !businessToAssign) {
      const clientBusinesses = await models.business.find({ owner: client._id });
      if (clientBusinesses.length === 1) {
        businessToAssign = clientBusinesses[0];
        console.log(`[Webhook] Client has only one business. Auto-assigning to ${businessToAssign.name}`);
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
    } else {
      console.warn(`[Webhook] No client or unique manager found for appointment ${calendar.appointmentId}. Creating unassigned meeting.`);
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
    const { clientId } = req.params;
    if (!Types.ObjectId.isValid(clientId)) {
      res.status(400).json({ message: "El ID del cliente proporcionado no es válido." });
      return;
    }

    const { businessId } = req.query;
    if (businessId && !Types.ObjectId.isValid(businessId as string)) {
      res.status(400).json({ message: "El ID del negocio proporcionado no es válido." });
      return;
    }

    const client = await models.clients.findById(clientId).populate('meetings');

    if (!client) {
      res.status(404).json({ message: "Cliente no encontrado." });
      return;
    }

    let relevantMeetings: IMeeting[];

    if (businessId) {
      relevantMeetings = (client.meetings as IMeeting[]).filter(
        (meeting) => meeting.business?.toString() === businessId
      );
    } else {
      relevantMeetings = client.meetings as IMeeting[];
    }
    
    if (!relevantMeetings || relevantMeetings.length === 0) {
      res.status(200).json({
        hasScheduledMeeting: false,
        message: "El cliente no tiene reuniones para el contexto especificado.",
      });
      return;
    }

    const sortedMeetings = [...relevantMeetings].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const latestMeeting = sortedMeetings[0];
    res.status(200).json({
      hasScheduledMeeting: true, 
      meeting: {
        id: latestMeeting._id,
        status: latestMeeting.status,
        meetingType: latestMeeting.meetingType,
        assignedTo: latestMeeting.assignedTo,
        scheduledTime: latestMeeting.scheduledTime,
        meetingLink: latestMeeting.meetingLink,
        business: latestMeeting.business,
        createdAt: latestMeeting.createdAt,
      },
    });

  } catch (error: unknown) {
    console.error("Error al obtener el estado de la reunión del cliente:", error);
    next(error);
  }
}

export async function confirmStrategyMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Logging para depuración: La herramienta más importante.
    // Si este log muestra un objeto vacío {}, el problema es el middleware express.json() en tu app.
    console.log("Cuerpo de la petición recibido:", req.body);

    const { clientId } = req.params;
    const { portfolioMeetingId } = req.body; // El frontend debe enviar un JSON con esta clave.

    // 2. Validación explícita y con mensajes de error claros.
    if (!portfolioMeetingId) {
      res.status(400).json({ message: "El ID de la reunión de portafolio (portfolioMeetingId) es requerido en el cuerpo de la petición." });
      return;
    }
    if (!Types.ObjectId.isValid(clientId) || !Types.ObjectId.isValid(portfolioMeetingId)) {
      res.status(400).json({ message: "El formato del ID del cliente o de la reunión no es válido." });
      return;
    }

    // 3. Lógica de negocio (con validaciones de seguridad)
    const portfolioMeeting = await models.meetings.findById(portfolioMeetingId);

    // Verificamos que la reunión exista y corresponda al cliente y al tipo correcto.
    if (!portfolioMeeting || portfolioMeeting.client!.toString() !== clientId || portfolioMeeting.meetingType !== MeetingType.PORTFOLIO_ACCESS) {
      res.status(404).json({ message: "La reunión de acceso especificada no es válida o no corresponde a este cliente." });
      return;
    }

    // Idempotencia: Si ya está completada, no hacemos nada más.
    if (portfolioMeeting.status === MeetingStatus.COMPLETED) {
        res.status(200).json({ message: "Esta reunión ya fue marcada como completada previamente." });
        return;
    }

    portfolioMeeting.status = MeetingStatus.COMPLETED;
    
    // Verificamos si ya existe una reunión de estrategia para este negocio para no duplicarla
    const existingStrategyMeeting = await models.meetings.findOne({
        client: clientId,
        business: portfolioMeeting.business, // Crucial: La nueva reunión debe ser para el MISMO negocio.
        meetingType: MeetingType.DATA_STRATEGY,
    });

    if (existingStrategyMeeting) {
      await portfolioMeeting.save();
      console.log(`El cliente ${clientId} ya tiene una reunión de estrategia pendiente para el negocio ${portfolioMeeting.business}.`);
      res.status(200).json({ 
        message: "Acceso confirmado. La reunión de estrategia ya existía.",
        strategyMeeting: existingStrategyMeeting 
      });
      return;
    }

    // Creamos la nueva reunión de estrategia ASOCIADA AL MISMO NEGOCIO.
    const newStrategyMeeting = new models.meetings({
        client: clientId,
        business: portfolioMeeting.business, // Mantenemos el contexto del negocio
        assignedTo: "Luis Reyes (Estratega)",
        status: MeetingStatus.PENDING_SCHEDULE,
        meetingType: MeetingType.DATA_STRATEGY,
    });

    // Guardamos ambas operaciones en paralelo para mayor eficiencia.
    await Promise.all([
        portfolioMeeting.save(),
        newStrategyMeeting.save(),
        models.clients.findByIdAndUpdate(clientId, { $push: { meetings: newStrategyMeeting._id } })
    ]);
    
    console.log(`Nueva reunión de Estrategia (pendiente) creada para el cliente ${clientId} y negocio ${portfolioMeeting.business}`);

    res.status(200).json({ 
      message: "Acceso a portafolio confirmado y reunión de estrategia habilitada.",
      strategyMeeting: newStrategyMeeting 
    });

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
      res.status(HttpStatusCode.BadRequest).send({ message: "Meeting ID or Client ID is invalid." });
      return;
    }
    if (businessId && !Types.ObjectId.isValid(businessId)) {
      res.status(HttpStatusCode.BadRequest).send({ message: "The provided Business ID is invalid." });
      return;
    }

    const meetingService = new MeetingService();
    const updatedMeeting = await meetingService.assignMeetingToClient(
      meetingId,
      clientId,
      businessId,
    );

    res.status(HttpStatusCode.Ok).send({
      message: "Meeting successfully assigned.",
      data: updatedMeeting,
    });

  } catch (error: unknown) {
    console.error("Error in assignMeetingController:", error);
    next(error);
  }
}

/**
 * @description Marca una reunión de estrategia de datos (con Luis Reyes) como completada y finaliza el proceso de onboarding del negocio asociado.
 * @route POST /api/client/:clientId/complete-data-strategy-meeting
 * @access Private (Debe ser llamado por el frontend de administración)
 */
export async function completeDataStrategyMeeting(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { clientId } = req.params;
    const { strategyMeetingId } = req.body as { strategyMeetingId: string };

    if (
      !Types.ObjectId.isValid(clientId) ||
      !Types.ObjectId.isValid(strategyMeetingId)
    ) {
      res
        .status(HttpStatusCode.BadRequest)
        .json({ message: "El ID del cliente o de la reunión no es válido." });
      return;
    }

    const strategyMeeting = await models.meetings
      .findById(strategyMeetingId)
      .populate("business");

    if (
      !strategyMeeting ||
      strategyMeeting.client?.toString() !== clientId ||
      strategyMeeting.meetingType !== MeetingType.DATA_STRATEGY
    ) {
      res.status(HttpStatusCode.NotFound).send({
        message:
          "La reunión de estrategia de datos especificada no es válida o no corresponde a este cliente.",
      });
      return;
    }

    if (strategyMeeting.status === MeetingStatus.COMPLETED) {
      res.status(HttpStatusCode.Ok).send({
        message: "Esta reunión ya fue marcada como completada previamente.",
        meeting: strategyMeeting,
      });
      return;
    }

    strategyMeeting.status = MeetingStatus.COMPLETED;

    const businessToUpdate = strategyMeeting.business as IBusiness;
    if (businessToUpdate) {
      businessToUpdate.onboardingStep = OnboardingStepEnum.ONBOARDING_COMPLETE;
    }

    await Promise.all([
      strategyMeeting.save(),
      businessToUpdate ? businessToUpdate.save() : Promise.resolve(),
    ]);

    console.log(
      `[Onboarding] Reunión de estrategia ${strategyMeetingId} completada.`,
    );
    if (businessToUpdate) {
      console.log(
        `[Onboarding] Negocio ${businessToUpdate.name} (${businessToUpdate._id}) ha completado el onboarding.`,
      );
    }

    res.status(HttpStatusCode.Ok).send({
      message:
        "Reunión de estrategia completada y onboarding del negocio finalizado.",
      data: {
        updatedMeeting: strategyMeeting,
        updatedBusiness: businessToUpdate,
      },
    });
  } catch (error: unknown) {
    console.error(
      "Error al completar la reunión de estrategia de datos:",
      error,
    );
    next(error);
  }
}