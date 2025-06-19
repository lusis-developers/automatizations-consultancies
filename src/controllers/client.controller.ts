import type { Request, Response, NextFunction } from "express";
import models from "../models";
import { HttpStatusCode } from "axios";
import { MeetingStatus, MeetingType } from "../enums/meetingStatus.enum";
import { Types } from "mongoose";
import { IMeeting } from "../models/meeting.model";

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

    // 1. Validar que el payload del calendario es correcto
    if (!calendar || !calendar.appointmentId) {
      console.log("Webhook ignorado: Datos de calendario incompletos.");
      res.status(200).json({ message: "Datos de calendario incompletos." });
      return;
    }

    // 2. Prevenir duplicados (Idempotencia)
    const existingMeeting = await models.meetings.findOne({ sourceId: calendar.appointmentId });
    if (existingMeeting) {
      console.log(`Webhook ignorado: La reunión con ID ${calendar.appointmentId} ya existe.`);
      res.status(200).json({ message: "Reunión ya procesada." });
      return;
    }

    // 3. Buscar al cliente (lógica multi-criterio)
    const searchCriteria = [];
    if (email) searchCriteria.push({ email: email.toLowerCase() });
    if (phone) {
      const normalizedPhone = phone.replace(/[\s\-()+\D]/g, '');
      searchCriteria.push({ phone: new RegExp(normalizedPhone + '$') });
    }
    const client = await models.clients.findOne({ $or: searchCriteria });
    if (!client) {
      console.warn(`Cliente no encontrado para la cita ${calendar.appointmentId}`);
      res.status(404).json({ message: "Cliente no encontrado." });
      return;
    }

    // 4. Identificar al experto y el tipo de reunión
    // CORRECCIÓN: Se inicializan las variables con null para solucionar el error de TypeScript
    let assignedToExpertName: string | null = null;
    let meetingType: MeetingType | null = null;

    // Asignamos los valores basados en el nombre del calendario
    if (calendar.calendarName === "MEETING ACCESO PORTAFOLIO EMPRESARIAL") {
      assignedToExpertName = "Denisse Quimi";
      meetingType = MeetingType.PORTFOLIO_ACCESS;
    } else if (calendar.calendarName === "PRIMER MEETING CON EXPERTO ANALISIS DE DATOS (LUIS)") {
      assignedToExpertName = "Luis Reyes";
      meetingType = MeetingType.DATA_STRATEGY; // Usamos el tipo de reunión que corresponde
    } else {
      // Aquí podrías añadir lógica para otros calendarios en el futuro
      // Ejemplo:
      // } else if (calendar.calendarName === "REUNIÓN DE DATOS") {
      //   assignedToExpertName = "Luis Reyes";
      //   meetingType = MeetingType.DATA_STRATEGY;
    }

    // Si el calendario no es reconocido, no continuamos. La validación ahora es segura.
    if (!assignedToExpertName || !meetingType) {
        console.warn(`Tipo de calendario no reconocido: ${calendar.calendarName}`);
        res.status(200).json({message: "Tipo de calendario no manejado."});
        return;
    }

    // 5. Crear el nuevo documento de Reunión
    const newMeeting = new models.meetings({
      client: client._id,
      assignedTo: assignedToExpertName,
      status: MeetingStatus.SCHEDULED,
      meetingType: meetingType,
      scheduledTime: new Date(calendar.startTime),
      endTime: new Date(calendar.endTime),
      meetingLink: calendar.address,
      sourceId: calendar.appointmentId,
    });
    
    // 6. Guardar la nueva reunión en la base de datos
    await newMeeting.save();

    // 7. Asociar la nueva reunión con el cliente, añadiendo su ID al array
    client.meetings.push(newMeeting._id);
    await client.save();

    console.log(`Nueva reunión de tipo '${meetingType}' con '${assignedToExpertName}' creada y asociada al cliente ${client.email}`);

    // 8. Enviar respuesta de éxito
    res.status(200).json({ message: "Reunión creada y asociada exitosamente." });

  } catch (error: unknown) {
    console.error("Error en el webhook de citas (versión refactorizada):", error);
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
    if (!portfolioMeeting || portfolioMeeting.client.toString() !== clientId || portfolioMeeting.meetingType !== MeetingType.PORTFOLIO_ACCESS) {
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