/**
 * Helper functions for checklist migration operations
 */

/**
 * Migration function to update existing checklists to new structure
 * @param checklist - The checklist object to migrate
 * @returns Promise<boolean> - Returns true if changes were made, false otherwise
 */
export async function migrateChecklistToNewStructure(checklist: any): Promise<boolean> {
	let hasChanges = false;

	// Find the meta-config phase (STAGE 2)
	const metaConfigPhase = checklist.phases.find((phase: any) => phase.id === "meta-config");
	
	if (metaConfigPhase) {
		// Update phase name if it's still the old name
		if (metaConfigPhase.name === "TESIS DE COMUNICACIÓN") {
			metaConfigPhase.name = "STAGE 2";
			hasChanges = true;
		}

		// Update meta-setup item title if it's still the old title
		const metaSetupItem = metaConfigPhase.items.find((item: any) => item.id === "meta-setup");
		if (metaSetupItem && metaSetupItem.title === "Configuración META (Seteo del portafolio empresarial, cuenta publicitaria, conexión de cuenta fb e IG, y cuenta de WA)") {
			metaSetupItem.title = "Configuración META (primera reunión)";
			hasChanges = true;
		}

		// Remove old items that should no longer exist in STAGE 2
		const itemsToRemove = ["taglines", "soundbites", "ideal-client", "content-structure", "planning"];
		const originalItemsLength = metaConfigPhase.items.length;
		
		metaConfigPhase.items = metaConfigPhase.items.filter((item: any) => !itemsToRemove.includes(item.id));
		
		if (metaConfigPhase.items.length !== originalItemsLength) {
			hasChanges = true;
		}

		// Add data-analysis item if it doesn't exist
		const dataAnalysisItem = metaConfigPhase.items.find((item: any) => item.id === "data-analysis-stage2");
		if (!dataAnalysisItem) {
			metaConfigPhase.items.push({
				id: "data-analysis-stage2",
				title: "Análisis de datos",
				completed: false,
			});
			hasChanges = true;
		}

		// Ensure the phase is marked as incomplete if items were removed or added
		if (hasChanges && metaConfigPhase.completed) {
			// Check if all remaining items are still completed
			const allItemsCompleted = metaConfigPhase.items.every((item: any) => item.completed);
			if (!allItemsCompleted) {
				metaConfigPhase.completed = false;
				metaConfigPhase.completedAt = undefined;
			}
		}
	}

	// Find the data-analysis phase (TESIS DE COMUNICACIÓN)
	const dataAnalysisPhase = checklist.phases.find((phase: any) => phase.id === "data-analysis");
	
	if (dataAnalysisPhase) {
		// Update phase name if it's still the old name
		if (dataAnalysisPhase.name === "ANÁLISIS DE DATOS") {
			dataAnalysisPhase.name = "TESIS DE COMUNICACIÓN";
			hasChanges = true;
		}

		// Check if we need to update the items structure
		const hasOldItems = dataAnalysisPhase.items.some((item: any) => 
			item.id === "data-analysis-item" || item.id === "strategy-definition"
		);

		if (hasOldItems) {
			// Replace old items with new structure
			dataAnalysisPhase.items = [
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
			];
			hasChanges = true;

			// Mark phase as incomplete since items changed
			if (dataAnalysisPhase.completed) {
				dataAnalysisPhase.completed = false;
				dataAnalysisPhase.completedAt = undefined;
			}
		}
	}

	// Find the ads phase (STAGE 4)
	const adsPhase = checklist.phases.find((phase: any) => phase.id === "ads");
	
	if (adsPhase) {
		// Update phase name if it's still the old name
		if (adsPhase.name === "ADS") {
			adsPhase.name = "STAGE 4";
			hasChanges = true;
		}

		// Check if we need to update the items structure
		const hasOldItems = adsPhase.items.some((item: any) => 
			item.id === "ad-material" || item.id === "ads-config" || item.id === "community-norms" || item.id === "ads-activation"
		);

		if (hasOldItems) {
			// Replace old items with new structure
			adsPhase.items = [
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
			];
			hasChanges = true;

			// Mark phase as incomplete since items changed
			if (adsPhase.completed) {
				adsPhase.completed = false;
				adsPhase.completedAt = undefined;
			}
		}
	}

	// Find the sales-process phase (STAGE 5)
	const salesProcessPhase = checklist.phases.find((phase: any) => phase.id === "sales-process");
	
	if (salesProcessPhase) {
		// Update phase name from "PROCESO DE VENTAS" or "ADS" to "STAGE 5"
		if (salesProcessPhase.name === "PROCESO DE VENTAS" || salesProcessPhase.name === "ADS") {
			salesProcessPhase.name = "STAGE 5";
			hasChanges = true;
		}

		// Check if we need to update the items structure
		const hasOldItems = salesProcessPhase.items.some((item: any) => 
			item.id === "video-guides" || item.id === "wa-sales-guides" || item.id === "roas-stabilization" || item.id === "subscription-platform"
		);

		if (hasOldItems) {
			// Replace old items with new structure
			salesProcessPhase.items = [
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
			];
			hasChanges = true;

			// Mark phase as incomplete since items changed
			if (salesProcessPhase.completed) {
				salesProcessPhase.completed = false;
				salesProcessPhase.completedAt = undefined;
			}
		}
	}

	// Find the venta phase (STAGE 6) - add if missing
	const ventaPhase = checklist.phases.find((phase: any) => phase.id === "venta");
	
	if (!ventaPhase) {
		// Add the VENTA phase if it doesn't exist
		checklist.phases.push({
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
		});
		hasChanges = true;
	} else if (ventaPhase.name === "VENTA") {
		// Update phase name from "VENTA" to "STAGE 6"
		ventaPhase.name = "STAGE 6";
		hasChanges = true;
	}

	// Ensure all phases have observations fields initialized
	for (const phase of checklist.phases) {
		if (phase.observations === undefined) {
			phase.observations = undefined;
			phase.observationsUpdatedAt = undefined;
			phase.observationsUpdatedBy = undefined;
			// Note: We don't mark hasChanges as true for this since these are optional fields
			// and adding undefined values doesn't change the document structure significantly
		}
	}

	return hasChanges;
}