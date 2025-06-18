import type { Request, Response, NextFunction } from "express";
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

export async function handleAppointmentWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    console.log("Webhook de cita recibido:", JSON.stringify(req.body, null, 2));

    // 1. Extraer el email y el teléfono del payload
    const { email, phone, calendar } = req.body;

    // 2. Validar que tenemos al menos un identificador y los datos del calendario
    if ((!email && !phone) || !calendar || !calendar.appointmentId) {
      console.log("Webhook ignorado: Faltan identificadores (email/phone) o datos del calendario.");
      // Respondemos con 200 para que GHL no siga reintentando.
      res.status(200).json({ message: "Datos de identificación insuficientes." });
      return;
    }

    // Opcional: Validar que sea el calendario correcto
    if (calendar.calendarName !== "MEETING ACCESO PORTAFOLIO EMPRESARIAL") {
        console.log(`Webhook ignorado: Calendario no aplicable "${calendar.calendarName}".`);
        res.status(200).json({ message: "Calendario no aplicable." });
        return;
    }

    // 3. CONSTRUIR LA CONSULTA DE BÚSQUEDA MULTI-CRITERIO
    // Creamos un array de condiciones para la búsqueda.
    const searchCriteria = [];

    if (email) {
      searchCriteria.push({ email: email.toLowerCase() });
    }

    if (phone) {
      // Normalizamos el teléfono para una búsqueda más fiable.
      // Esto quita espacios, guiones, paréntesis y el signo '+'.
      const normalizedPhone = phone.replace(/[\s\-()+\D]/g, ''); 
      // Buscamos un teléfono que TERMINE con los dígitos normalizados.
      // Esto ayuda a coincidir con formatos como +593... y 099...
      searchCriteria.push({ phone: new RegExp(normalizedPhone + '$') });
    }

    // 4. Buscar al cliente en la base de datos usando $or
    // $or encontrará un documento que cumpla CUALQUIERA de las condiciones.
    const client = await models.clients.findOne({ $or: searchCriteria });

    if (!client) {
      console.warn(`Cliente no encontrado con email: ${email} O teléfono: ${phone}`);
      // Respondemos 404 porque, según la nueva lógica, no crearemos el cliente.
      res.status(404).json({ message: "Cliente no encontrado con los criterios proporcionados." });
      return;
    }

    // 5. Actualizar la información de la cita en el documento del cliente encontrado
    // Uso "denisseMeeting" como definimos antes. Cámbialo si usas otro nombre en tu schema.
    client.IPortfolioMetaAdsMeeting = {
      status: 'scheduled',
      appointmentId: calendar.appointmentId,
      scheduledTime: new Date(calendar.startTime),
    };

    // 6. Guardar los cambios en la base de datos
    await client.save();

    console.log(`Cita (Portafolio) actualizada para el cliente: ${client.email}`);

    // 7. Enviar una respuesta de éxito
    res.status(200).json({ message: "Cita del cliente actualizada correctamente." });

  } catch (error: unknown) {
    console.error("Error en el webhook de citas:", error);
    next(error);
  }
}