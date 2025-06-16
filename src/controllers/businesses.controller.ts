import type { NextFunction, Request, Response } from "express";
import models from "../models";
import path from "path";
import fs from "fs";
import os from "os";
import { GoogleDriveService } from "../services/googleDrive.service";
import { Types } from "mongoose";

export async function receiveConsultancyData(
  req: Request,
  res: Response,
): Promise<void> {
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

    console.log("Datos recibidos:", req.body);
    console.log("Business ID recibido:", businessId);

    const driveService = new GoogleDriveService(
      path.resolve(
        __dirname,
        "../credentials/bakano-mvp-generate-content-4618d04c0dde.json",
      ),
      "1IXfjJgXD-uWOKPxwKOXiJl_dhp3uBkOL",
    );

    const files = req.files as Express.Multer.File[];

    const business = await models.business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: "Negocio no encontrado con ese ID" });
      return;
    }

    const businessFolderId = await driveService.ensureSubfolder(business.name);
    const filePaths: { [key: string]: string } = {};

    if (Array.isArray(files)) {
      for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const tempPath = path.join(os.tmpdir(), fileName);

        fs.writeFileSync(tempPath, file.buffer);

        const driveUrl = await driveService.uploadFileToSubfolder(
          tempPath,
          fileName,
          businessFolderId,
        );

        const fieldName = file.fieldname;
        filePaths[`${fieldName}Path`] = driveUrl;

        fs.unlinkSync(tempPath);
      }
    }

    // Actualizar el negocio con los nuevos datos
    business.instagram = instagram;
    business.tiktok = tiktok;
    business.empleados = empleados;
    business.ingresoMensual = ingresoMensual;
    business.ingresoAnual = ingresoAnual;
    business.desafioPrincipal = desafioPrincipal;
    business.objetivoIdeal = objetivoIdeal;
    business.ruc = business.ruc;
    business.address = address;
    business.phone = phone;
    business.email = email;
    business.name = business.name;
    business.vendePorWhatsapp = vendePorWhatsapp;
    business.gananciaWhatsapp = gananciaWhatsapp;

    // Añadir las rutas de archivos cargados
    Object.entries(filePaths).forEach(([key, value]) => {
      business.set(key, value);
    });

    await business.save();

    res.status(200).json({
      message: "Datos de consultoría actualizados correctamente",
      businessId: business._id,
      filePaths,
    });
  } catch (error: any) {
    console.error("Error al recibir datos de consultoría:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
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