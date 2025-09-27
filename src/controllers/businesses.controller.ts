import type { NextFunction, Request, Response } from "express";
import models from "../models";
import path from "path";
import fs from "fs";
import { GoogleDriveService } from "../services/googleDrive.service";
import { Types } from "mongoose";
import ResendEmail from "../services/resend.service";
import { OnboardingStepEnum } from "../enums/onboardingStep.enum";
import { HttpStatusCode } from "axios";
import { IClient } from "../models/clients.model";
import { IManager, IHandoffData } from "../models/business.model";
import { BusinessTypeEnum } from "../enums/businessType.enum";

export async function receiveConsultancyData(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const allFiles = req.files as Express.Multer.File[];
  try {
    const { businessId } = req.params;

    if (!Types.ObjectId.isValid(businessId)) {
        res.status(HttpStatusCode.BadRequest).send({ message: "Invalid business ID format." });
        return;
    }

    // Ensure uploads directory exists
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const driveService = new GoogleDriveService(
      path.resolve(
        __dirname,
        "../credentials/bakano-mvp-generate-content-4618d04c0dde.json",
      ),
      "0ADeVKG56ujJCUk9PVA",
    );

    const business = await models.business.findById(businessId)
      .populate<{ owner: IClient }>('owner');

    if (!business) {
      if (Array.isArray(allFiles)) {
        for (const file of allFiles) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
      res.status(HttpStatusCode.NotFound).send({ message: "Business not found with that ID." });
      return;
    }
    
    if (!business.businessType) {
      console.log(`[Backward Compatibility] El negocio '${business.name}' no tenía businessType. Asignando uno.`);
      business.businessType = req.body.businessType || BusinessTypeEnum.OTHER;
    }

    const businessFolderId = await driveService.ensureSubfolder(business.name);
    
    const updatePayload: any = { ...req.body };
    const newMenuUrls: string[] = [];
    
    // Handle brand identity text fields
    if (req.body.brandPrimaryColor) {
      updatePayload.brandPrimaryColor = req.body.brandPrimaryColor;
    }
    if (req.body.brandSecondaryColor) {
      updatePayload.brandSecondaryColor = req.body.brandSecondaryColor;
    }
    if (req.body.brandTypographyName) {
      updatePayload.brandTypographyName = req.body.brandTypographyName;
    }
    
    // Handle consultancy-specific fields
    if (req.body.serviceType) {
      updatePayload.serviceType = req.body.serviceType;
    }
    if (req.body.serviceDescription) {
      updatePayload.serviceDescription = req.body.serviceDescription;
    }

    if (Array.isArray(allFiles)) {
      for (const file of allFiles) {
        const driveUrl = await driveService.uploadFileToSubfolder(
          file.path,
          file.originalname,
          businessFolderId,
        );

        if (file.fieldname === 'menuRestaurante') {
          newMenuUrls.push(driveUrl);
        } else if (file.fieldname === 'monthlyTransactions') {
          updatePayload.monthlyTransactionsPathPath = driveUrl;
        } else if (file.fieldname === 'brandLogo') {
          updatePayload.brandLogoPath = driveUrl;
        } else if (file.fieldname === 'brandTypography') {
          updatePayload.brandTypographyPath = driveUrl;
        } else if (file.fieldname === 'brandUsageExamples') {
          updatePayload.brandUsageExamplesPath = driveUrl;
        } else {
          updatePayload[`${file.fieldname}Path`] = driveUrl;
        }

        // Clean up temporary file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    if (newMenuUrls.length > 0) {
      const existingMenus = business.menuRestaurantePath;
      let finalMenuPaths: string[] = [];

      if (typeof existingMenus === 'string' && existingMenus) {
        finalMenuPaths = [existingMenus, ...newMenuUrls];
      } else if (Array.isArray(existingMenus)) {
        finalMenuPaths = [...existingMenus, ...newMenuUrls];
      } else {
        finalMenuPaths = newMenuUrls;
      }
      updatePayload.menuRestaurantePath = finalMenuPaths;
    }

    business.set(updatePayload);
    await business.save();

    try {
      if (business.owner) {
        const resendService = new ResendEmail();
        await resendService.sendInternalUploadNotification(
          business.name,
          business._id as string,
          business.owner.name,
          business.owner._id as string,
          business.owner.email
        );
      }
    } catch (emailError) {
      console.error(`Los datos de ${business.name} se guardaron, pero la notificación interna falló:`, emailError);
    }

    res.status(HttpStatusCode.Ok).send({
      message: "Consultancy data updated successfully.",
      businessId: business._id,
      updatedData: updatePayload,
    });

  } catch (error: any) {
    console.error("Error receiving consultancy data:", error);
    if (Array.isArray(allFiles)) {
      for (const file of allFiles) {
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
      }
    }
    next(error)
  }
}

/**
 * Edita los datos de un negocio existente basado en su ID.
 * Utiliza un método PATCH para actualizaciones parciales.
 * @param req El objeto de solicitud de Express. Espera `businessId` en los parámetros y los datos a actualizar en el body.
 * @param res El objeto de respuesta de Express.
 * @param next La función de middleware para el manejo de errores.
 */
export async function editBusinessData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.params;
    const updateData = req.body;

    if (!Types.ObjectId.isValid(businessId)) {
      res.status(400).json({ message: "El ID del negocio proporcionado no es válido." });
      return;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "No se proporcionaron datos para actualizar." });
      return;
    }

    const updatedBusiness = await models.business.findByIdAndUpdate(
      businessId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBusiness) {
      res.status(404).json({ message: "No se encontró un negocio con el ID proporcionado." });
      return;
    }

    res.status(200).json({
      message: "Negocio actualizado exitosamente.",
      data: updatedBusiness,
    });

  } catch (error: unknown) {
    console.error('error al editar negocio', error);
    next(error);
  }
}

export async function sendDataUploadReminders(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resendEmail = new ResendEmail();
    let remindersSentCount = 0;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const businessesToRemind = await models.business.find({
      $and: [
        { onboardingStep: OnboardingStepEnum.ON_BOARDING },
        {
          $or: [
            { costoPorPlatoPath: { $in: [null, undefined, ""] } },
            { menuRestaurantePath: { $in: [null, undefined, ""] } },
            { ventasClientePath: { $in: [null, undefined, ""] } },
            { ventasMovimientosPath: { $in: [null, undefined, ""] } },
            { ventasProductosPath: { $in: [null, undefined, ""] } },
          ]
        },
        {
          $or: [
            { lastDataReminderSentAt: { $eq: null } },
            { lastDataReminderSentAt: { $lt: twentyFourHoursAgo } }
          ]
        }
      ]
    }).populate<{ owner: { _id: Types.ObjectId, email: string } }>('owner', '_id email');

    if (businessesToRemind.length === 0) {
      res.status(HttpStatusCode.Ok).send({ message: "No businesses require a reminder at this time." });
      return;
    }
    
    for (const business of businessesToRemind) {
      if (business.owner && business.owner.email && business.owner._id) {
        try {
          await resendEmail.sendUploadReminderEmail(
            business.owner.email,
            business.name,
            business.owner._id.toString(),
            business._id as any,
          );

          await models.business.findByIdAndUpdate(business._id, {
            lastDataReminderSentAt: new Date(),
          });
          remindersSentCount++;
        } catch (error) {
          console.error(`Failed to process reminder for business ${business.name} (${business._id}):`, error);
        }
      }
    }

    res.status(HttpStatusCode.Ok).send({
      message: "Reminder process completed.",
      remindersSent: remindersSentCount,
    });
  } catch (error) {
    console.error("Error in reminder sending process:", error);
    next(error);
  }
}

export async function deleteBusinessAndNotifyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { businessId } = req.params;

    if (!Types.ObjectId.isValid(businessId)) {
      res.status(HttpStatusCode.BadRequest).send({ message: "Invalid business ID" });
      return;
    }

    const business = await models.business.findById(businessId)
      .populate<{ owner: IClient }>('owner')
      .populate<{ managers: IManager[] }>('managers');

    if (!business) {
      res.status(HttpStatusCode.NotFound).send({ message: "Business not found" });
      return;
    }

    const businessName = business.name;
    const owner = business.owner;
    const managers = business.managers;

    const recipientEmails: string[] = [];
    if (owner && owner.email) {
      recipientEmails.push(owner.email);
    }
    if (managers && managers.length > 0) {
      managers.forEach(manager => {
        if (manager.email) {
          recipientEmails.push(manager.email);
        }
      });
    }

    await models.business.findByIdAndDelete(businessId);
    if (owner) {
      await models.clients.updateOne(
        { _id: owner._id },
        { $pull: { businesses: business._id } }
      );
    }

    try {
      const driveService = new GoogleDriveService(
        path.resolve(__dirname, "../credentials/bakano-mvp-generate-content-4618d04c0dde.json"),
        "0ADeVKG56ujJCUk9PVA"
      );
      await driveService.deleteFolderByName(businessName);
    } catch (driveError) {
      console.error(`[Business Controller] Error initializing or using GoogleDriveService:`, driveError);
    }

    if (recipientEmails.length > 0) {
      const resendService = new ResendEmail();
      await resendService.sendBusinessDeletionEmail(
        businessName,
        owner.name,
        recipientEmails,
      );
    }

    res.status(HttpStatusCode.Ok).send({
      message: `Business '${businessName}' deleted. Owner and managers have been notified.`,
    });

  } catch (error: unknown) {
    console.error("[Business - Delete Error]", error);
    next(error);
  }
}

/**
 * Adds handoff data to a business when it converts to a client (Phase 0)
 * This endpoint is used by administrators to track conversion details
 * @param req The Express request object. Expects businessId in params and handoff data in body
 * @param res The Express response object
 * @param next The Express next function for error handling
 */
export async function addHandoffData(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { businessId } = req.params;
    const {
      salesSummary,
      clientExpectations,
      billingSegment,
      clientExpectedOutcome,
      handoffBy,
      notes
    }: {
      salesSummary: string;
      clientExpectations: string;
      billingSegment: string;
      clientExpectedOutcome: string;
      handoffBy: string;
      notes?: string;
    } = req.body;

    if (!Types.ObjectId.isValid(businessId)) {
      res.status(HttpStatusCode.BadRequest).send({ 
        message: "Invalid business ID provided." 
      });
      return;
    }

    if (!salesSummary || !clientExpectations || !billingSegment || !clientExpectedOutcome || !handoffBy) {
      res.status(HttpStatusCode.BadRequest).send({ 
        message: "All required handoff fields must be provided: salesSummary, clientExpectations, billingSegment, clientExpectedOutcome, handoffBy." 
      });
      return;
    }

    const business = await models.business.findById(businessId);

    if (!business) {
      res.status(HttpStatusCode.NotFound).send({ 
        message: "Business not found with the provided ID." 
      });
      return;
    }

    if (business.handoffData) {
      res.status(HttpStatusCode.Conflict).send({ 
        message: "Handoff data already exists for this business. Use update endpoint to modify." 
      });
      return;
    }

    const handoffData: Partial<IHandoffData> = {
      salesSummary: salesSummary.trim(),
      clientExpectations: clientExpectations.trim(),
      billingSegment: billingSegment.trim(),
      clientExpectedOutcome: clientExpectedOutcome.trim(),
      handoffBy: handoffBy.trim(),
      handoffDate: new Date(),
      notes: notes?.trim() || undefined
    };

    business.handoffData = handoffData as IHandoffData;
    await business.save();

    res.status(HttpStatusCode.Created).send({
      message: "Handoff data added successfully.",
      businessId: business._id,
      handoffData: business.handoffData
    });

  } catch (error: unknown) {
    console.error("[Business - Add Handoff Data Error]", error);
    next(error);
  }
}