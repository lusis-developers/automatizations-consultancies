import type { Request, Response } from 'express'
import models from '../models'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { GoogleDriveService } from '../services/googleDrive.service'

export async function receiveConsultancyData(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      ruc,
      address,
      phone,
      email,
      owner, 
      instagram,
      tiktok,
      empleados,
      ingresoMensual,
      ingresoAnual,
      desafioPrincipal,
      objetivoIdeal
    } = req.body;

    console.log('Datos recibidos:', req.body);
    const driveService = new GoogleDriveService(
      path.resolve(__dirname, '../credentials/bakano-mvp-generate-content-4618d04c0dde.json'),
      '1IXfjJgXD-uWOKPxwKOXiJl_dhp3uBkOL'
    );
    console.log('Servicio de Google Drive creado');

    const files = req.files as Express.Multer.File[];

    // Validar que el owner exista
    const existingOwner = await models.clients.findById(owner);
    if (!existingOwner) {
      res.status(404).json({ message: 'Cliente (owner) no encontrado' });
      return;
    }

    const businessFolderId = await driveService.ensureSubfolder(name);

    console.log('Archivos recibidos:', files);

    const filePaths: { [key: string]: string } = {};
    if (Array.isArray(files)) {
      for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const tempPath = path.join(os.tmpdir(), fileName);
    
        fs.writeFileSync(tempPath, file.buffer);
    
        const driveUrl = await driveService.uploadFileToSubfolder(tempPath, fileName, businessFolderId);
    
        // Asegurarse de usar el nombre original del campo de formulario como clave
        const fieldName = file.fieldname;
        filePaths[`${fieldName}Path`] = driveUrl;
    
        fs.unlinkSync(tempPath);
      }
    }
    

    const newBusiness = new models.business({
      name,
      ruc,
      address,
      phone,
      email,
      owner,
      instagram,
      tiktok,
      empleados,
      ingresoMensual,
      ingresoAnual,
      desafioPrincipal,
      objetivoIdeal,
      ...filePaths
    });

    await newBusiness.save();

    existingOwner.businesses.push(newBusiness.id);
    await existingOwner.save();

    res.status(201).json({
      message: 'Datos de consultoría y archivos recibidos y guardados exitosamente',
      businessId: newBusiness._id,
      filePaths
    });

  } catch (error: any) {
    console.error('Error al recibir datos de consultoría:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
}