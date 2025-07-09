import mongoose, { Document, Model, Schema } from "mongoose";
import { MeetingStatus, MeetingType } from "../enums/meetingStatus.enum";

export interface IMeeting extends Document {
	client?: Schema.Types.ObjectId | string;
	assignedTo: string;
	status: MeetingStatus;
	meetingType: MeetingType;
	scheduledTime: Date;
	endTime: Date;
	meetingLink?: string;
	source: string;
	sourceId: string;
	createdAt: Date;
	attendeeEmail?: string;
	attendeePhone?: string;
}

const MeetingSchema: Schema<IMeeting> = new Schema(
	{
		client: {
			type: Schema.Types.ObjectId,
			ref: "clients",
			required: false,
		},
		assignedTo: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: Object.values(MeetingStatus),
			required: true,
		},
		meetingType: {
			type: String,
			enum: Object.values(MeetingType),
			required: true,
		},
		scheduledTime: { type: Date, required: false },
		endTime: { type: Date, required: false },
		meetingLink: { type: String, trim: false },
		source: { type: String, default: "GoHighLevel" },
		sourceId: {
			type: String,
			unique: true,
			required: false,
			default: null,
		},
		attendeeEmail: { type: String, trim: true },
		attendeePhone: { type: String, trim: true },
	},
	{ timestamps: true, versionKey: false }
);

const MeetingModel: Model<IMeeting> = mongoose.model<IMeeting>(
	"meetings",
	MeetingSchema
);

export default MeetingModel;
