import type { Request, NextFunction, Response } from "express";
import { models, Types } from "mongoose";
import { IManager } from "../models/business.model";
import { HttpStatusCode } from "axios";


/**
 * @description Añade un nuevo manager a un negocio específico.
 * @route POST /api/businesses/:businessId/managers
 */

export async function addManagerToBusiness(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { businessId } = req.params;
		const { name, email, role } = req.body as IManager;

		if (!Types.ObjectId.isValid(businessId)) {
			res.status(400).send({ message: "Invalid business ID." });
			return;
		}
		if (!name || !email) {
			res.status(400).send({
				message: "Manager name and email are required.",
			});
			return;
		}

		const business = await models.business.findById(businessId);

		if (!business) {
			res.status(404).send({ message: "Business not found." });
			return;
		}

		const managerExists = business.managers?.some(
			(manager: IManager) => manager.email === email
		);

		if (managerExists) {
			res.status(409).send({
				message: `A manager with email ${email} already exists in this business.`,
			});
			return;
		}

		const updatedBusiness = await models.business.findByIdAndUpdate(
			businessId,
			{ $push: { managers: { name, email, role } } },
			{ new: true, runValidators: true }
		);

		res.status(201).send({
			message: "Manager added successfully.",
			data: updatedBusiness?.managers,
		});
	} catch (error: unknown) {
		console.error("Error adding manager to business", error);
    next(error)
	}
}

/**
 * @description Elimina un manager de un negocio específico.
 * @route DELETE /api/businesses/:businessId/managers/:managerId
 */
export async function removeManagerFromBusiness(req: Request, res: Response, next: NextFunction):Promise<void> {
  const { businessId, managerId } = req.params;

  if (!Types.ObjectId.isValid(businessId) || !Types.ObjectId.isValid(managerId)) {
    res.status(HttpStatusCode.BadRequest).send({ message: "Business ID or manager ID is invalid." });
    return
  }

  try {
    const updatedBusiness = await models.business.findByIdAndUpdate(
      businessId,
      { $pull: { managers: { _id: new Types.ObjectId(managerId) } } },
      { new: true }
    );

    if (!updatedBusiness) {
      res.status(HttpStatusCode.NotFound).send({ message: "Business not found." });
      return
    }
    
    res.status(HttpStatusCode.Ok).send({
      message: "Manager successfully removed.",
      data: updatedBusiness.managers?.length ? updatedBusiness.managers : "No managers remaining in this business"
    });

    return
  } catch (error) {
    console.error("Error removing manager:", error);
    next(error)
  }
}

/**
 * @description Obtiene todos los managers de un negocio.
 * @route GET /api/businesses/:businessId/managers
 */
export async function getBusinessManagers(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { businessId } = req.params;

  if (!Types.ObjectId.isValid(businessId)) {
    res.status(400).send({ message: "Invalid business ID." });
    return
  }
    
  try {
    const business = await models.business.findById(businessId).select('managers');

    if (!business) {
      res.status(HttpStatusCode.NotFound).send({ message: "Business not found." });
      return
    }

    res.status(HttpStatusCode.Ok).send({
      message: "Managers retrieved successfully.",
      data: business.managers
    });

    return
  } catch (error) {
    console.error("Error getting managers:", error);
    next(error)
  }
}