import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { HttpStatusCode } from "axios";
import models from "../models";
import { OnboardingStepEnum } from "../enums/onboardingStep.enum";
import { migrateChecklistToNewStructure } from "../helpers/checklistMigration.helper";

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
		
		// Apply migration if checklist exists
		if (checklist) {
			const hasChanges = await migrateChecklistToNewStructure(checklist);
			if (hasChanges) {
				await checklist.save();
			}
		}
		
		if (!checklist) {
			checklist = new models.checklists({
				businessId: new Types.ObjectId(businessId),
				phases: [
					{
						id: "onboarding",
						name: "ON BOARDING",
						items: [
							{
								id: "business-details",
								title: "Detalles del negocio",
								completed: false,
							},
							{
								id: "business-files",
								title: "Archivos del negocio",
								completed: false,
							},
							{
								id: "brand-identity",
								title: "Identidad de marca",
								completed: false,
							},
						],
						completed: false,
					},
					{
						id: "meta-config",
						name: "STAGE 2",
						items: [
							{
								id: "meta-setup",
								title: "Configuración META (primera reunión)",
								completed: false,
							},
							{
								id: "data-analysis-stage2",
								title: "Análisis de datos",
								completed: false,
							},
						],
						completed: false,
					},
					{
						id: "data-analysis",
						name: "TESIS DE COMUNICACIÓN",
						items: [
							{
								id: "taglines-soundbites",
								title: "Taglines - Soundbites",
								completed: false,
							},
							{
								id: "ideal-client",
								title: "Cliente ideal del negocio",
								completed: false,
							},
							{
								id: "content-planning",
								title: "Planificación de contenido diario",
								completed: false,
							},
						],
						completed: false,
					},
					{
						id: "ads",
						name: "STAGE 4",
						items: [
							{
								id: "marketing-strategy",
								title: "Estrategia de marketing dirigido a ventas",
								completed: false,
							},
							{
								id: "storybrand-platform-sale",
								title: "Venta de plataforma storybrand",
								completed: false,
							},
						],
						completed: false,
					},
					{
						id: "sales-process",
						name: "STAGE 5",
						items: [
							{
								id: "ad-scripts",
								title: "Guiones para anuncios",
								completed: false,
							},
							{
								id: "ad-materials",
								title: "Material para anuncios",
								completed: false,
							},
							{
								id: "community-guidelines",
								title: "Normas de la comunidad",
								completed: false,
							},
							{
								id: "ad-activation",
								title: "Activación de anuncios (aprobado por meta)",
								completed: false,
							},
						],
						completed: false,
					},
					{
						id: "venta",
						name: "STAGE 6",
						items: [
							{
								id: "whatsapp-sales-manual",
								title: "Manual para ventas por whatsapp",
								completed: false,
							},
							{
								id: "roas-stabilization",
								title: "Estabilización de roas",
								completed: false,
							},
							{
								id: "subscription-platform-delivery",
								title: "Entrega de plataforma de suscripción y capacitación",
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
						OnboardingStepEnum.PROCESO_DE_VENTAS,
						OnboardingStepEnum.VENTA
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

// Update phase observations
export async function updatePhaseObservations(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { businessId, phaseId } = req.params;
		const { observations, updatedBy } = req.body;

		if (!Types.ObjectId.isValid(businessId)) {
			res.status(HttpStatusCode.BadRequest).send({
				message: "Invalid business ID format.",
			});
			return;
		}

		if (typeof observations !== "string") {
			res.status(HttpStatusCode.BadRequest).send({
				message: "Observations field must be a string.",
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

		// Update observations
		phase.observations = observations.trim() || undefined;
		phase.observationsUpdatedAt = new Date();
		
		if (updatedBy && Types.ObjectId.isValid(updatedBy)) {
			phase.observationsUpdatedBy = new Types.ObjectId(updatedBy);
		}

		await checklist.save();

		res.status(HttpStatusCode.Ok).send({
			message: "Phase observations updated successfully.",
			checklist,
		});
		return;
	} catch (error) {
		console.error("Error updating phase observations:", error);
		next(error);
	}
}

// Migrate all existing checklists to new structure
export async function migrateAllChecklists(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const checklists = await models.checklists.find({});
		let migratedCount = 0;

		for (const checklist of checklists) {
			const hasChanges = await migrateChecklistToNewStructure(checklist);
			if (hasChanges) {
				await checklist.save();
				migratedCount++;
			}
		}

		res.status(HttpStatusCode.Ok).send({
			message: `Migration completed successfully. ${migratedCount} checklists were updated.`,
			migratedCount,
			totalChecklists: checklists.length,
		});
		return;
	} catch (error) {
		console.error("Error migrating checklists:", error);
		next(error);
	}
}