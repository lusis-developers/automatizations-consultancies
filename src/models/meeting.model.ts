import mongoose, { Document, Model, Schema } from "mongoose";
import { MeetingStatus, MeetingType } from "../enums/meetingStatus.enum";

export interface IMeeting extends Document {
  client: Schema.Types.ObjectId;
  assignedTo: string; // <-- CAMBIO: De ObjectId a String
  status: MeetingStatus;
  meetingType: MeetingType;
  scheduledTime: Date;
  endTime: Date;
  meetingLink?: string;
  source: string;
  sourceId: string;
  createdAt: Date;
}

const MeetingSchema: Schema<IMeeting> = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: "clients",
      required: true,
    },
    assignedTo: {
      type: String, // <-- CAMBIO: El tipo ahora es String
      required: true,
    },
    // El 'ref: "users"' se ha eliminado porque ya no es una referencia
    status: {
      type: String,
      enum: Object.values(MeetingStatus),
      required: true,
    },
    // ... resto del schema sin cambios ...
    meetingType: {
      type: String,
      enum: Object.values(MeetingType),
      required: true,
    },
    scheduledTime: { type: Date, required: false },
    endTime: { type: Date, required: false },
    meetingLink: { type: String, trim: false },
    source: { type: String, default: 'GoHighLevel' },
    sourceId: {
      type: String,
      unique: true,
      required: false,
      default: null
    },
  },
  { timestamps: true, versionKey: false },
);

const MeetingModel: Model<IMeeting> = mongoose.model<IMeeting>(
  "meetings",
  MeetingSchema,
);

export default MeetingModel;