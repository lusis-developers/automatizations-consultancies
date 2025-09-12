import { Schema, model, Document, Types } from "mongoose";

export interface IChecklistItem {
	id: string;
	title: string;
	description?: string;
	completed: boolean;
	completedAt?: Date;
	completedBy?: Types.ObjectId;
}

export interface IChecklistPhase {
	id: string;
	name: string;
	items: IChecklistItem[];
	completed: boolean;
	completedAt?: Date;
}

export interface IChecklist extends Document {
	businessId: Types.ObjectId;
	phases: IChecklistPhase[];
	currentPhase: number;
	createdAt: Date;
	updatedAt: Date;
}

const checklistItemSchema = new Schema<IChecklistItem>({
	id: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
		trim: true,
	},
	description: {
		type: String,
		trim: true,
	},
	completed: {
		type: Boolean,
		default: false,
	},
	completedAt: {
		type: Date,
	},
	completedBy: {
		type: Schema.Types.ObjectId,
		ref: "User",
	},
});

const checklistPhaseSchema = new Schema<IChecklistPhase>({
	id: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
		trim: true,
	},
	items: [checklistItemSchema],
	completed: {
		type: Boolean,
		default: false,
	},
	completedAt: {
		type: Date,
	},
});

const checklistSchema = new Schema<IChecklist>({
	businessId: {
		type: Schema.Types.ObjectId,
		ref: "Business",
		required: true,
		unique: true,
	},
	phases: [checklistPhaseSchema],
	currentPhase: {
		type: Number,
		default: 0,
	},
}, {
	timestamps: true,
	versionKey: false,
});

// Create default checklist structure
checklistSchema.statics.createDefaultChecklist = function(businessId: Types.ObjectId) {
	return new this({
		businessId,
		phases: [
			{
				id: "onboarding",
				name: "ON BOARDING",
				items: [
					{
						id: "billing-history",
						title: "Facturación histórica",
						completed: false,
					},
					{
						id: "product-list",
						title: "Lista de productos",
						completed: false,
					},
					{
						id: "client-list",
						title: "Lista de clientes (si aplica)",
						completed: false,
					},
					{
						id: "brand-identity",
						title: "Identidad de marca (Logo, Colores, Tipografía, Ejemplos de Uso)",
						completed: false,
					},
				],
				completed: false,
			},
			{
				id: "meta-config",
				name: "TESIS DE COMUNICACIÓN",
				items: [
					{
						id: "meta-setup",
						title: "Configuración META (Seteo del portafolio empresarial, cuenta publicitaria, conexión de cuenta fb e IG, y cuenta de WA)",
						completed: false,
					},
					{
						id: "taglines",
						title: "Taglines",
						completed: false,
					},
					{
						id: "soundbites",
						title: "SoundBites",
						completed: false,
					},
					{
						id: "ideal-client",
						title: "Cliente ideal del negocio",
						completed: false,
					},
					{
						id: "content-structure",
						title: "Estructura contenido diario",
						completed: false,
					},
					{
						id: "planning",
						title: "Planificaciones",
						completed: false,
					},
				],
				completed: false,
			},
			{
				id: "data-analysis",
				name: "ANÁLISIS DE DATOS",
				items: [
					{
						id: "data-analysis-item",
						title: "Análisis de datos",
						completed: false,
					},
					{
						id: "strategy-definition",
						title: "Definición de estrategia",
						completed: false,
					},
				],
				completed: false,
			},
			{
				id: "ads",
				name: "ADS",
				items: [
					{
						id: "ad-material",
						title: "Material para anuncios",
						completed: false,
					},
					{
						id: "ads-config",
						title: "Configuración Ads",
						completed: false,
					},
					{
						id: "community-norms",
						title: "Normas de la comunidad",
						completed: false,
					},
					{
						id: "ads-activation",
						title: "Activación de Anuncios",
						completed: false,
					},
				],
				completed: false,
			},
			{
				id: "sales-process",
				name: "PROCESO DE VENTAS",
				items: [
					{
						id: "video-guides",
						title: "Guiones para videos de anuncios",
						completed: false,
					},
					{
						id: "wa-sales-guides",
						title: "Guiones para ventas por WA",
						completed: false,
					},
					{
						id: "roas-stabilization",
						title: "Estabilización ROAS=4",
						completed: false,
					},
					{
						id: "subscription-platform",
						title: "Entrega de plataforma de suscripción",
						completed: false,
					},
				],
				completed: false,
			},
		],
		currentPhase: 0,
	});
};

export const Checklist = model<IChecklist>("Checklist", checklistSchema);