import models from "../models";
import { IBusiness } from "../models/business.model";
import CustomError from "../errors/customError.error";
import { HttpStatusCode } from "axios";

export class MeetingService {
  /**
   * Asigna una reunión a un cliente y, si es posible, a un negocio.
   * Contiene toda la lógica de negocio para la asignación.
   * @param meetingId - El ID de la reunión a asignar.
   * @param clientId - El ID del cliente al que se asignará.
   * @param businessId - (Opcional) El ID del negocio específico al que se asignará.
   * @returns El documento de la reunión actualizado.
   */
  public async assignMeetingToClient(
    meetingId: string,
    clientId: string,
    businessId?: string,
  ) {
    const meeting = await models.meetings.findById(meetingId);
    if (!meeting) {
      throw new CustomError("Meeting not found.", HttpStatusCode.NotFound);
    }

    const client = await models.clients.findById(clientId);
    if (!client) {
      throw new CustomError("Client not found.", HttpStatusCode.NotFound);
    }

    let businessToAssign: IBusiness | null = null;

    if (businessId) {
      const business = await models.business.findById(businessId);
      if (!business) {
        throw new CustomError("Business not found.", HttpStatusCode.NotFound);
      }
      if (business.owner.toString() !== client._id.toString()) {
        throw new CustomError(
          "Assignment error: This business does not belong to the selected client.",
          HttpStatusCode.Conflict,
        );
      }
      businessToAssign = business;
    } else {
      const clientBusinesses = await models.business.find({ owner: client._id });
      if (clientBusinesses.length === 1) {
        businessToAssign = clientBusinesses[0];
        console.log(`[Meeting Service] Client has one business. Auto-assigning to business: ${businessToAssign.name}`);
      }
    }

    meeting.client = client._id;
    if (businessToAssign) {
      meeting.set('business', businessToAssign._id);
    }

    const meetingAlreadyExists = client.meetings.some((mId: any) => mId.equals(meeting._id));
    if (!meetingAlreadyExists) {
      client.meetings.push(meeting._id);
    }

    await Promise.all([
      meeting.save(),
      client.save(),
    ]);
    
    console.log(`[Meeting Service] Meeting ${meeting._id} successfully assigned to client ${client.email}`);
    if (businessToAssign) {
        console.log(`... and to business ${businessToAssign.name}`);
    }

    return meeting;
  }
}