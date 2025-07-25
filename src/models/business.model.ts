import mongoose, { Schema, Document, Types } from "mongoose";
import { OnboardingStepEnum } from "../enums/onboardingStep.enum";
import { BusinessTypeEnum } from "../enums/businessType.enum";


export interface IManager extends Document {
	_id: Types.ObjectId,
	name: string;
	email: string;
	role?: string
}


const managerSchema = new Schema<IManager>({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	email: {
		type: String,
		required: true,
		trim: true,
	},
	role: {
		type: String,
		trim: true,
		default: "manager",
	},
})

export interface IBusiness extends Document {
	name: string;
	ruc: string;
	address: string;
	businessType: BusinessTypeEnum;
	phone: string;
	email: string;
	managers: IManager[]
	owner: Schema.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	instagram?: string;
	tiktok?: string;
	empleados?: string;
	ingresoMensual?: string;
	ingresoAnual?: string;
	desafioPrincipal?: string;
	objetivoIdeal?: string;
	costoPorPlatoPath?: string; // Para almacenar la ruta del archivo
	menuRestaurantePath?: string | string[];
	ventasClientePath?: string; // Para almacenar la ruta del archivo
	ventasMovimientosPath?: string; // Para almacenar la ruta del archivo
	ventasProductosPath?: string; // Para almacenar la ruta del archivo
	vendePorWhatsapp?: boolean;
	gananciaWhatsapp?: string;
	onboardingStep: OnboardingStepEnum;
	dataSubmissionCompletedAt?: Date;
  meetingScheduledAt?: Date;
  meetingDateTime?: Date;
  meetingLink?: string; // ej: Calendly, Google Meet link
  lastDataReminderSentAt?: Date;
  lastScheduleMeetingReminderSentAt?: Date;
  meetingReminder24hSent?: boolean;
  meetingReminder1hSent?: boolean;
}

const BusinessSchema = new Schema<IBusiness>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		ruc: {
			type: String,
			required: false,
			trim: true,
			unique: true,
			sparse: true
		},
		address: {
			type: String,
			required: false,
			trim: true,
		},
		phone: {
			type: String,
			required: false,
			trim: true,
		},
		email: {
			type: String,
			required: false,
			trim: true,
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: "clients",
			required: true,
		},
		managers: {
			type: [managerSchema],
			default: []
		},
		instagram: { 
      type: String, 
      required: false, trim: 
      true 
    },
		tiktok: { 
      type: String, 
      required: false, 
      trim: true 
    },
		empleados: {
      type: String, 
      required: false, 
      trim: true 
    },
		ingresoMensual: { 
      type: String, 
      required: false, 
      trim: true 
    },
		ingresoAnual: { 
      type: String, 
      required: false, 
      trim: true 
    },
		desafioPrincipal: { 
      type: String, 
      required: false, 
      trim: true 
    },
		objetivoIdeal: { 
      type: String, 
      required: false, 
      trim: true 
    },
		costoPorPlatoPath: { 
      type: String,
      required: false
    }, // Campo para la ruta del archivo
		menuRestaurantePath: {
      type: Schema.Types.Mixed,
      default: null,
    },
		ventasClientePath: {
      type: String, 
      required: false 
    }, // Campo para la ruta del archivo
		ventasMovimientosPath: { 
      type: String, 
      required: false 
    }, // Campo para la ruta del archivo
		ventasProductosPath: { 
      type: String, 
      required: false 
    }, // Campo para la ruta del archivo
		vendePorWhatsapp: {
      type: Boolean, 
      required: false, 
      default: false 
    },
		gananciaWhatsapp: { 
      type: String, 
      required: false, 
      trim: true 
    },
		onboardingStep: {
      type: String,
			enum: Object.values(OnboardingStepEnum),
      default: OnboardingStepEnum.PENDING_DATA_SUBMISSION,
			required: true,
    },
    dataSubmissionCompletedAt: { 
			type: Date, 
			required: false 
		},
		meetingScheduledAt: {
      type: Date,
      required: false
    },
		meetingDateTime: {
      type: Date,
      required: false
    },
		meetingLink: {
      type: String,
      required: false
    },
		lastDataReminderSentAt: {
      type: Date,
      required: false
    },
		lastScheduleMeetingReminderSentAt: {
      type: Date,
      required: false
    },
		meetingReminder24hSent: {
      type: Boolean,
      required: false,
      default: false
    },
		meetingReminder1hSent: {
      type: Boolean,
      required: false,
      default: false
		},
		businessType: {
			type: String,
			enum: Object.values(BusinessTypeEnum),
			required: true
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);


BusinessSchema.index({ onboardingStep: 1, meetingDateTime: 1 });

const BusinessModel = mongoose.model<IBusiness>("business", BusinessSchema);

export default BusinessModel;
