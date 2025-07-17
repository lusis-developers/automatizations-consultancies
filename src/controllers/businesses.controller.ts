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
import { IManager } from "../models/business.model";

export async function receiveConsultancyData(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const allFiles = req.files as Express.Multer.File[];
  try {
    const { businessId } = req.params;

    if (!Types.ObjectId.isValid(businessId)) {
        res.status(HttpStatusCode.BadRequest).send({ message: "El ID del negocio no es válido." });
        return;
    }

    const driveService = new GoogleDriveService(
      path.resolve(
        __dirname,
        "../credentials/bakano-mvp-generate-content-4618d04c0dde.json",
      ),
      "1IXfjJgXD-uWOKPxwKOXiJl_dhp3uBkOL",
    );

    const business = await models.business.findById(businessId)
      .populate<{ owner: IClient }>('owner');

    if (!business) {
      if (Array.isArray(allFiles)) {
        for (const file of allFiles) {
          fs.unlinkSync(file.path);
        }
      }
      res.status(HttpStatusCode.BadRequest).send({ message: "Negocio no encontrado con ese ID" });
      return;
    }

    const businessFolderId = await driveService.ensureSubfolder(business.name);
    
    const updatePayload: any = { ...req.body };
    const newMenuUrls: string[] = [];
    
    if (Array.isArray(allFiles)) {
      for (const file of allFiles) {
        const driveUrl = await driveService.uploadFileToSubfolder(
          file.path,
          file.originalname,
          businessFolderId,
        );

        if (file.fieldname === 'menuRestaurante') {
          newMenuUrls.push(driveUrl);
        } else {
          updatePayload[`${file.fieldname}Path`] = driveUrl;
        }

        fs.unlinkSync(file.path);
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
      message: "Datos de consultoría actualizados correctamente",
      businessId: business._id,
      updatedData: updatePayload,
    });

  } catch (error: any) {
    console.error("Error al recibir datos de consultoría:", error);
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
        { onboardingStep: OnboardingStepEnum.PENDING_DATA_SUBMISSION },
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
        "1IXfjJgXD-uWOKPxwKOXiJl_dhp3uBkOL"
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