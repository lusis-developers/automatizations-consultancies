import type { Request, Response, NextFunction } from "express";
import models from "../models";
import { HttpStatusCode } from "axios";

/**
 * @description Realiza una búsqueda unificada y paginada a través de clientes y sus negocios asociados.
 * @route GET /api/search?q=<termino>&page=<n>&limit=<n>
 */
export async function unifiedSearchController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { q, page = "1", limit = "10" } = req.query;

    if (!q || typeof q !== "string" || q.trim() === "") {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Se requiere un término de búsqueda 'q'.",
      });
      return;
    }

    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, "i"); // 'i' para búsqueda case-insensitive

    const pageNumber = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNumber - 1) * pageSize;

    // El Pipeline de Agregación es la clave para una búsqueda potente y escalable.
    const aggregationPipeline = [
      // Etapa 1: Unir la colección `clients` con su correspondiente `businesses`
      {
        $lookup: {
          from: "businesses", // La colección con la que queremos unir
          localField: "businesses", // El campo en `clients` (es un array de ObjectIds)
          foreignField: "_id", // El campo en `businesses` que coincide
          as: "businesses", // El nombre del nuevo array que contendrá los negocios poblados
        },
      },
      // Etapa 2: Filtrar los resultados basados en el término de búsqueda `q`
      {
        $match: {
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { phone: searchRegex },
            { nationalIdentification: searchRegex },
            { "businesses.name": searchRegex },
            { "businesses.ruc": searchRegex },
            { "businesses.managers.name": searchRegex },
            { "businesses.managers.email": searchRegex },
          ],
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: pageSize }],
        },
      },
    ];

    const results = await models.clients.aggregate(aggregationPipeline);

    const data = results[0].data;
    const total = results[0].metadata[0]?.total || 0;

    res.status(HttpStatusCode.Ok).json({
      message: "Búsqueda completada exitosamente.",
      data,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[Unified Search - Error]", error);
    next(error);
  }
}