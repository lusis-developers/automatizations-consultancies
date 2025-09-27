import mongoose, { Schema, Document, Types } from "mongoose";
import { OnboardingStepEnum } from "../enums/onboardingStep.enum";
import { BusinessTypeEnum } from "../enums/businessType.enum";

export interface IHandoffData extends Document {
	_id: Types.ObjectId;
	salesSummary: string;
	clientExpectations: string;
	billingSegment: string;
	clientExpectedOutcome: string;
	handoffBy: string; // Luis Reyes or admin name
	handoffDate: Date;
	notes?: string;
}

const handoffDataSchema = new Schema<IHandoffData>({
	salesSummary: {
		type: String,
		required: true,
		trim: true,
	},
	clientExpectations: {
		type: String,
		required: true,
		trim: true,
	},
	billingSegment: {
		type: String,
		required: true,
		trim: true,
	},
	clientExpectedOutcome: {
		type: String,
		required: true,
		trim: true,
	},
	handoffBy: {
		type: String,
		required: true,
		trim: true,
	},
	handoffDate: {
		type: Date,
		required: true,
		default: Date.now,
	},
	notes: {
		type: String,
		required: false,
		trim: true,
	},
})


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
	valueProposition?: string;
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
	handoffData?: IHandoffData;
	// Brand Identity Fields
	brandLogoPath?: string;
	brandPrimaryColor?: string;
	brandSecondaryColor?: string;
	brandTypographyName?: string;
	brandTypographyPath?: string;
	brandUsageExamplesPath?: string;
	// Checklist reference
	checklistId?: Types.ObjectId;
	// Consultancy-specific fields
	serviceType?: string; // Tipo de servicio
	monthlyTransactionsPath?: string; // Archivo de transacciones al mes
	monthlyTransactionsPathPath?: string; // Temporary field for compatibility
	serviceDescription?: string; // Descripción de servicios
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
      default: OnboardingStepEnum.ON_BOARDING,
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
			required: true,
			default: BusinessTypeEnum.UNKNOWN
		},
		valueProposition: {
			type: String,
			required: false,
			trim: true,
		},
		handoffData: {
			type: handoffDataSchema,
			required: false,
		},
		// Brand Identity Fields
		brandLogoPath: {
			type: String,
			required: false,
			trim: true,
		},
		brandPrimaryColor: {
			type: String,
			required: false,
			trim: true,
		},
		brandSecondaryColor: {
			type: String,
			required: false,
			trim: true,
		},
		brandTypographyName: {
			type: String,
			required: false,
			trim: true,
		},
		brandTypographyPath: {
			type: String,
			required: false,
			trim: true,
		},
		brandUsageExamplesPath: {
			type: String,
			required: false,
			trim: true,
		},

		// Checklist Reference
		checklistId: {
			type: Schema.Types.ObjectId,
			ref: "Checklist",
			required: false,
		},
		// Consultancy-specific fields
		serviceType: {
			type: String,
			required: false,
			trim: true,
		},
		monthlyTransactionsPath: {
			type: String,
			required: false,
			trim: true,
		},
		monthlyTransactionsPathPath: {
			type: String,
			required: false,
			trim: true,
		},
		serviceDescription: {
			type: String,
			required: false,
			trim: true,
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
