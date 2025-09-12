import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { HttpStatusCode } from "axios";
import models from "../models";
import { OnboardingStepEnum } from "../enums/onboardingStep.enum";

// Get checklist for a business
export async function getBusinessChecklist(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { businessId } = req.params;

		if (!Types.ObjectId.isValid(businessId)) {
			res.status(HttpStatusCode.BadRequest).send({
				message: "Invalid business ID format.",
			});
			return;
		}

		// Check if business exists
		const business = await models.business.findById(businessId);
		if (!business) {
			res.status(HttpStatusCode.NotFound).send({
				message: "Business not found.",
			});
			return;
		}

		// Get or create checklist
		let checklist = await models.checklists.findOne({ businessId });
		if (!checklist) {
			checklist = new models.checklists({
				businessId: new Types.ObjectId(businessId),
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
			await checklist.save();
		}

		res.status(HttpStatusCode.Ok).send({
			message: "Checklist retrieved successfully.",
			checklist,
		});
		return;
	} catch (error) {
		console.error("Error getting business checklist:", error);
		next(error);
	}
}

// Update checklist item status
export async function updateChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { businessId, phaseId, itemId } = req.params;
		const { completed, completedBy } = req.body;

		if (!Types.ObjectId.isValid(businessId)) {
			res.status(HttpStatusCode.BadRequest).send({
				message: "Invalid business ID format.",
			});
			return;
		}

		if (typeof completed !== "boolean") {
			res.status(HttpStatusCode.BadRequest).send({
				message: "Completed field must be a boolean.",
			});
			return;
		}

		// Get checklist
		const checklist = await models.checklists.findOne({ businessId });
		if (!checklist) {
			res.status(HttpStatusCode.NotFound).send({
				message: "Checklist not found for this business.",
			});
			return;
		}

		// Find phase
		const phase = checklist.phases.find(p => p.id === phaseId);
		if (!phase) {
			res.status(HttpStatusCode.NotFound).send({
				message: "Phase not found.",
			});
			return;
		}

		// Find item
		const item = phase.items.find(i => i.id === itemId);
		if (!item) {
			res.status(HttpStatusCode.NotFound).send({
				message: "Item not found.",
			});
			return;
		}

		// Update item
		item.completed = completed;
		if (completed) {
			item.completedAt = new Date();
			if (completedBy && Types.ObjectId.isValid(completedBy)) {
				item.completedBy = new Types.ObjectId(completedBy);
			}
		} else {
			item.completedAt = undefined;
			item.completedBy = undefined;
		}

		// Check if all items in phase are completed
		const allItemsCompleted = phase.items.every(i => i.completed);
		if (allItemsCompleted && !phase.completed) {
			phase.completed = true;
			phase.completedAt = new Date();
			
			// Update current phase if this phase is completed
			const currentPhaseIndex = checklist.phases.findIndex(p => p.id === phaseId);
			if (currentPhaseIndex === checklist.currentPhase) {
				const nextPhaseIndex = Math.min(currentPhaseIndex + 1, checklist.phases.length - 1);
				checklist.currentPhase = nextPhaseIndex;
				
				// Update business onboardingStep based on the new current phase
				const business = await models.business.findById(businessId);
				if (business && nextPhaseIndex > currentPhaseIndex) {
					const onboardingSteps = [
						OnboardingStepEnum.ON_BOARDING,
						OnboardingStepEnum.TESIS_DE_COMUNICACION,
						OnboardingStepEnum.ANALISIS_DE_DATOS,
						OnboardingStepEnum.ADS,
						OnboardingStepEnum.PROCESO_DE_VENTAS
					];
					
					if (nextPhaseIndex < onboardingSteps.length) {
						business.onboardingStep = onboardingSteps[nextPhaseIndex];
						await business.save();
					}
				}
			}
		} else if (!allItemsCompleted && phase.completed) {
			phase.completed = false;
			phase.completedAt = undefined;
		}

		await checklist.save();

		res.status(HttpStatusCode.Ok).send({
			message: "Checklist item updated successfully.",
			checklist,
		});
		return;
	} catch (error) {
		console.error("Error updating checklist item:", error);
		next(error);
	}
}

// Move to next phase
export async function moveToNextPhase(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { businessId } = req.params;

		if (!Types.ObjectId.isValid(businessId)) {
			res.status(HttpStatusCode.BadRequest).send({
				message: "Invalid business ID format.",
			});
			return;
		}

		const checklist = await models.checklists.findOne({ businessId });
		if (!checklist) {
			res.status(HttpStatusCode.NotFound).send({
				message: "Checklist not found for this business.",
			});
			return;
		}

		// Check if current phase is completed
		const currentPhase = checklist.phases[checklist.currentPhase];
		if (!currentPhase || !currentPhase.completed) {
			res.status(HttpStatusCode.BadRequest).send({
				message: "Current phase must be completed before moving to next phase.",
			});
			return;
		}

		// Move to next phase
		if (checklist.currentPhase < checklist.phases.length - 1) {
			checklist.currentPhase += 1;
			await checklist.save();
		}

		res.status(HttpStatusCode.Ok).send({
			message: "Moved to next phase successfully.",
			checklist,
		});
		return;
	} catch (error) {
		console.error("Error moving to next phase:", error);
		next(error);
	}
}

// Get checklist progress summary
export async function getChecklistProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { businessId } = req.params;

		if (!Types.ObjectId.isValid(businessId)) {
			res.status(HttpStatusCode.BadRequest).send({
				message: "Invalid business ID format.",
			});
			return;
		}

		const checklist = await models.checklists.findOne({ businessId });
		if (!checklist) {
			res.status(HttpStatusCode.NotFound).send({
				message: "Checklist not found for this business.",
			});
			return;
		}

		// Calculate progress
		const totalItems = checklist.phases.reduce((total, phase) => total + phase.items.length, 0);
		const completedItems = checklist.phases.reduce((total, phase) => {
			return total + phase.items.filter(item => item.completed).length;
		}, 0);
		const completedPhases = checklist.phases.filter(phase => phase.completed).length;

		const progress = {
			totalPhases: checklist.phases.length,
			completedPhases,
			currentPhase: checklist.currentPhase,
			currentPhaseName: checklist.phases[checklist.currentPhase]?.name || "Unknown",
			totalItems,
			completedItems,
			overallProgress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
		};

		res.status(HttpStatusCode.Ok).send({
			message: "Checklist progress retrieved successfully.",
			progress,
		});
		return;
	} catch (error) {
		console.error("Error getting checklist progress:", error);
		next(error);
	}
}