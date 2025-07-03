import type { NextFunction, Request, Response } from "express";
import models from "../models";
import path from "path";
import fs from "fs";
import { GoogleDriveService } from "../services/googleDrive.service";
import { Types } from "mongoose";
import ResendEmail from "../services/resend.service";
import { OnboardingStepEnum } from "../enums/onboardingStep.enum";
import { HttpStatusCode } from "axios";

export async function receiveConsultancyData(
  req: Request,
  res: Response,
): Promise<void> {
  const files = req.files as Express.Multer.File[];
  try {
    const {
      address,
      phone,
      email,
      instagram,
      tiktok,
      empleados,
      ingresoMensual,
      ingresoAnual,
      desafioPrincipal,
      objetivoIdeal,
      vendePorWhatsapp,
      gananciaWhatsapp
    } = req.body;

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
    const business = await models.business.findById(businessId);
    if (!business) {
      if (Array.isArray(files)) {
        for (const file of files) {
          fs.unlinkSync(file.path);
        }
      }
      res.status(HttpStatusCode.BadRequest).send({ message: "Negocio no encontrado con ese ID" });
      return;
    }

    const businessFolderId = await driveService.ensureSubfolder(business.name);
    const filePaths: { [key: string]: string } = {};

    if (Array.isArray(files)) {
      for (const file of files) {
        const driveUrl = await driveService.uploadFileToSubfolder(
          file.path,
          file.originalname,
          businessFolderId,
        );

        const fieldName = file.fieldname;
        filePaths[`${fieldName}Path`] = driveUrl;

        fs.unlinkSync(file.path);
      }
    }

    business.set({
        instagram,
        tiktok,
        empleados,
        ingresoMensual,
        ingresoAnual,
        desafioPrincipal,
        objetivoIdeal,
        address,
        phone,
        email,
        vendePorWhatsapp,
        gananciaWhatsapp,
        ...filePaths
    });
    await business.save();

    res.status(HttpStatusCode.Ok).send({
      message: "Datos de consultoría actualizados correctamente",
      businessId: business._id,
      filePaths,
    });
  } catch (error: any) {
    console.error("Error al recibir datos de consultoría:", error);
    if (Array.isArray(files)) {
      for (const file of files) {
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
      }
    }
    res.status(500).send({ message: "Error interno del servidor", error: error.message });
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