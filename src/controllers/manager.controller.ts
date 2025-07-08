import type { Request, NextFunction, Response } from "express";
import { models, Types } from "mongoose";
import { IManager } from "../models/business.model";
import { HttpStatusCode } from "axios";
import { IClient } from "../models/clients.model";
import ResendEmail from "../services/resend.service";


/**
 * @description Añade un nuevo manager a un negocio específico.
 * @route POST /api/businesses/:businessId/managers
 */

export async function addManagerToBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { businessId } = req.params;
  const { name, email, role } = req.body as IManager;

  // 1. Input Validation
  if (!Types.ObjectId.isValid(businessId)) {
    res.status(HttpStatusCode.BadRequest).send({ message: "Business ID is invalid." });
    return
  }
  if (!name || !email) {
    res.status(HttpStatusCode.BadRequest).send({ message: "Manager name and email are required." });
    return
  }

  try {
    // 2. Find business and get owner data with .populate()
    const business = await models.business.findById(businessId).populate<{ owner: IClient }>('owner');

    if (!business) {
      res.status(HttpStatusCode.NotFound).send({ message: "Business not found." });
      return
    }
    
    const managerExists = business.managers?.some((manager: IManager) => manager.email === email);
    if (managerExists) {
      res.status(HttpStatusCode.Conflict).send({ message: `A manager with email ${email} already exists in this business.` });
      return
    }

    // 3. Add manager to database
    business.managers.push({ name, email, role } as IManager);
    await business.save();
    
    try {
      const resendService = new ResendEmail();
      await resendService.sendManagerOnboardingEmail(
        email,
        name,
        business.owner.name,
        business.name,
        business.owner._id.toString(),
        business._id.toString()
      );
    } catch (emailError) {
      console.error(`Manager ${name} was added to ${business.name}, but onboarding email failed:`, emailError);
    }

    res.status(HttpStatusCode.Created).send({ 
      message: "Manager successfully added. Onboarding email has been sent.",
      data: business.managers,
    });
    return

  } catch (error) {
    console.error("Error adding manager:", error);
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