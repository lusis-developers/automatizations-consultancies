import type { Request, Response } from 'express'
import models from '../models'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { GoogleDriveService } from '../services/googleDrive.service'

export async function receiveConsultancyData(req: Request, res: Response): Promise<void> {
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
      objetivoIdeal
    } = req.body;

    const { businessId } = req.params;

    console.log('Datos recibidos:', req.body);
    console.log('Business ID recibido:', businessId);

    const driveService = new GoogleDriveService(
      path.resolve(__dirname, '../credentials/bakano-mvp-generate-content-4618d04c0dde.json'),
      '1IXfjJgXD-uWOKPxwKOXiJl_dhp3uBkOL'
    );

    const files = req.files as Express.Multer.File[];

    const business = await models.business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Negocio no encontrado con ese ID' });
      return;
    }

    const businessFolderId = await driveService.ensureSubfolder(business.name);
    const filePaths: { [key: string]: string } = {};

    if (Array.isArray(files)) {
      for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const tempPath = path.join(os.tmpdir(), fileName);

        fs.writeFileSync(tempPath, file.buffer);

        const driveUrl = await driveService.uploadFileToSubfolder(tempPath, fileName, businessFolderId);

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

    // Añadir las rutas de archivos cargados
    Object.entries(filePaths).forEach(([key, value]) => {
      business.set(key, value);
    });

    await business.save();

    res.status(200).json({
      message: 'Datos de consultoría actualizados correctamente',
      businessId: business._id,
      filePaths
    });

  } catch (error: any) {
    console.error('Error al recibir datos de consultoría:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
}