import { HttpStatusCode } from 'axios';
import { Request, Response, NextFunction } from 'express';
import { models, Types } from 'mongoose';

/**
 * @description Elimina una reunión específica de la base de datos.
 * @route DELETE /api/meeting/:meetingId
 * @access Private (Requiere autenticación y autorización)
 */
export async function deleteMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { meetingId } = req.params;
    if (!Types.ObjectId.isValid(meetingId)) {
      res.status(HttpStatusCode.BadRequest).json({ message: "The provided meeting ID is not valid." });
      return;
    }
    const deletedMeeting = await models.meetings.findByIdAndDelete(meetingId);

    if (!deletedMeeting) {
      res.status(HttpStatusCode.NotFound).send({ message: "Meeting not found." });
      return;
    }

    console.log(`[Success] Meeting successfully deleted: ${deletedMeeting._id}`);
    res.status(200).send({
      message: "Meeting successfully deleted.",
      deletedMeetingId: deletedMeeting._id
    });

  } catch (error: unknown) {
    console.error("Error deleting meeting:", error);
    next(error);
  }
}