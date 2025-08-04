# 🛠️ Guía de Desarrollo

Esta guía proporciona información detallada para desarrolladores que trabajen en el sistema de automatizaciones de Bakano.

## 🏗️ Arquitectura del Sistema

### Patrón Arquitectónico: Modelo-Ruta-Controlador-Servicio

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     RUTAS       │───▶│  CONTROLADORES  │───▶│    SERVICIOS    │───▶│    MODELOS      │
│                 │    │                 │    │                 │    │                 │
│ • Definición    │    │ • Lógica de     │    │ • APIs externas │    │ • Esquemas DB   │
│   de endpoints  │    │   negocio       │    │ • Lógica        │    │ • Validaciones  │
│ • Middlewares   │    │ • Validaciones  │    │   compleja      │    │ • Relaciones    │
│ • Parámetros    │    │ • Respuestas    │    │ • Integraciones │    │ • Índices       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Flujo de Request

1. **Cliente** → Envía request HTTP
2. **Middleware** → Procesa CORS, autenticación, validaciones
3. **Ruta** → Mapea endpoint a controlador específico
4. **Controlador** → Ejecuta lógica de negocio
5. **Servicio** → Interactúa con APIs externas (opcional)
6. **Modelo** → Interactúa con base de datos
7. **Respuesta** → Retorna JSON al cliente

## 🔧 Configuración del Entorno de Desarrollo

### Prerrequisitos

- **Node.js**: v18.0.0 o superior
- **npm**: v8.0.0 o superior
- **MongoDB**: v5.0 o superior
- **Git**: Para control de versiones
- **VS Code**: Editor recomendado

### Instalación Inicial

```bash
# Clonar repositorio
git clone <repository-url>
cd automatizations-server

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Configurar variables de entorno
nano .env
```

### Variables de Entorno

```env
# Base de datos
MONGO_URI=mongodb://localhost:27017/bakano-automatizations

# Servidor
PORT=3000
NODE_ENV=development

# PagoPlux
PAGOPLUX_ENDPOINT=https://api.pagoplux.com/intv1/integrations/createLinkFacturaResource
CLIENT_TOKEN=tu_token_base64

# Resend
RESEND_KEY=re_tu_api_key
FROM_EMAIL=noreply@bakano.ec

# Google Drive
GOOGLE_DRIVE_CREDENTIALS_PATH=./credentials/service-account.json
GOOGLE_DRIVE_FOLDER_ID=1IXfjJgXD-uWOKPxwKOXiJl_dhp3uBkOL

# URLs del frontend
FRONTEND_URL=http://localhost:5173
ONBOARDING_URL=https://onboarding.bakano.ec
```

### Scripts de Desarrollo

```bash
# Desarrollo con hot reload
npm run dev

# Compilar TypeScript en modo watch
npm run compile

# Compilar para producción
npm run build

# Ejecutar en producción
npm start

# Formatear código
npm run format
```

## 📁 Estructura de Archivos Detallada

```
src/
├── app.ts                    # Configuración de Express
├── index.ts                  # Punto de entrada
├── config/
│   └── mongo.ts             # Configuración de MongoDB
├── controllers/             # Controladores por módulo
│   ├── client.controller.ts
│   ├── businesses.controller.ts
│   ├── payments.controllers.ts
│   ├── manager.controller.ts
│   └── search.controller.ts
├── models/                  # Modelos de Mongoose
│   ├── index.ts            # Exportación centralizada
│   ├── clients.model.ts
│   ├── business.model.ts
│   ├── meeting.model.ts
│   ├── paymentsIntents.model.ts
│   └── transactions.model.ts
├── routes/                  # Definición de rutas
│   ├── index.ts            # Router principal
│   ├── client.route.ts
│   ├── business.routes.ts
│   ├── payments.routes.ts
│   ├── search.routes.ts
│   └── meeting.route.ts
├── services/               # Servicios externos
│   ├── pagoplux.service.ts
│   ├── resend.service.ts
│   ├── googleDrive.service.ts
│   └── meeting.service.ts
├── middlewares/            # Middlewares personalizados
│   ├── globalErrorHandler.middleware.ts
│   └── upload.middleware.ts
├── enums/                  # Enumeraciones TypeScript
│   ├── businessType.enum.ts
│   ├── meetingStatus.enum.ts
│   ├── onboardingStep.enum.ts
│   └── paymentStatus.enum.ts
├── types/                  # Tipos TypeScript
│   └── pagoplux.types.ts
├── utils/                  # Utilidades
│   └── extractExtras.util.ts
├── helpers/                # Funciones helper
│   ├── handleIntentPayment.helper.ts
│   └── handleManualPayment.helper.ts
├── validators/             # Validadores de datos
├── emails/                 # Templates de emails
│   ├── generateOnBoarding.email.ts
│   ├── generateUploadReminderEmail.email.ts
│   ├── generatePayEmail.email.ts
│   └── generateManagerOnboarding.email.ts
├── schedulers/             # Tareas programadas
│   ├── index.ts
│   └── jobs/
└── errors/                 # Manejo de errores
    ├── customError.error.ts
    └── errorHandler.error.ts
```

## 🎯 Convenciones de Código

### Nomenclatura

```typescript
// ✅ Correcto
interface IClient { ... }           // Interfaces con prefijo I
class PagoPluxService { ... }       // Clases en PascalCase
const clientController = { ... }    // Variables en camelCase
const API_BASE_URL = "...";         // Constantes en UPPER_SNAKE_CASE

// ❌ Incorrecto
interface client { ... }
class pagopluxservice { ... }
const ClientController = { ... }
const apiBaseUrl = "...";
```

### Estructura de Controladores

```typescript
// Template estándar para controladores
import type { Request, Response, NextFunction } from "express";
import models from "../models";
import { HttpStatusCode } from "axios";
import { Types } from "mongoose";

export async function controllerName(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validar parámetros
    const { param1, param2 } = req.params;
    const { field1, field2 } = req.body;
    
    if (!Types.ObjectId.isValid(param1)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid ID format"
      });
      return;
    }
    
    // 2. Validar campos requeridos
    if (!field1 || !field2) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Missing required fields"
      });
      return;
    }
    
    // 3. Lógica de negocio
    const result = await models.entityName.findById(param1);
    
    if (!result) {
      res.status(HttpStatusCode.NotFound).send({
        message: "Entity not found"
      });
      return;
    }
    
    // 4. Respuesta exitosa
    res.status(HttpStatusCode.Ok).send({
      message: "Operation completed successfully",
      data: result
    });
    return;
    
  } catch (error) {
    console.error("Error in controllerName:", error);
    res.status(HttpStatusCode.InternalServerError).send({
      message: "Internal server error"
    });
    return;
  }
}
```

### Estructura de Modelos

```typescript
// Template estándar para modelos
import mongoose, { Document, Model, Schema } from "mongoose";
import { EnumType } from "../enums/enumType.enum";

export interface IEntityName extends Document {
  field1: string;
  field2: number;
  field3: Date;
  relatedEntity: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EntitySchema: Schema<IEntityName> = new Schema(
  {
    field1: {
      type: String,
      required: true,
      trim: true,
    },
    field2: {
      type: Number,
      required: true,
      min: 0,
    },
    field3: {
      type: Date,
      required: true,
    },
    relatedEntity: {
      type: Schema.Types.ObjectId,
      ref: "relatedentities",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices para optimización
EntitySchema.index({ field1: 1, field2: 1 });
EntitySchema.index({ createdAt: -1 });

const EntityModel: Model<IEntityName> = mongoose.model<IEntityName>(
  "entities",
  EntitySchema
);

export default EntityModel;
```

### Estructura de Rutas

```typescript
// Template estándar para rutas
import express from "express";
import {
  controllerFunction1,
  controllerFunction2,
  controllerFunction3,
} from "../controllers/entity.controller";
import { upload } from "../middlewares/upload.middleware";

const router = express.Router();

// GET routes
router.get("/entities", controllerFunction1);
router.get("/entity/:entityId", controllerFunction2);

// POST routes
router.post(
  "/entity",
  upload.single("file"), // Middleware si es necesario
  controllerFunction3
);

// PUT/PATCH routes
router.patch("/entity/:entityId", controllerFunction4);

// DELETE routes
router.delete("/entity/:entityId", controllerFunction5);

export default router;
```

## 🧪 Testing

### Configuración de Testing

```bash
# Instalar dependencias de testing
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest

# Configurar Jest
npx ts-jest config:init
```

### Estructura de Tests

```
tests/
├── unit/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   └── utils/
├── integration/
│   ├── routes/
│   └── database/
├── e2e/
│   └── workflows/
└── fixtures/
    ├── data/
    └── mocks/
```

### Ejemplo de Test Unitario

```typescript
// tests/unit/controllers/client.controller.test.ts
import { Request, Response } from "express";
import { getClientById } from "../../../src/controllers/client.controller";
import models from "../../../src/models";

// Mock del modelo
jest.mock("../../../src/models");
const mockModels = models as jest.Mocked<typeof models>;

describe("Client Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    mockRequest = {
      params: { clientId: "507f1f77bcf86cd799439011" }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe("getClientById", () => {
    it("should return client when found", async () => {
      // Arrange
      const mockClient = {
        _id: "507f1f77bcf86cd799439011",
        name: "Juan Pérez",
        email: "juan@email.com"
      };
      
      mockModels.clients.findById.mockResolvedValue(mockClient);
      
      // Act
      await getClientById(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: "Client retrieved successfully",
        client: mockClient
      });
    });
    
    it("should return 404 when client not found", async () => {
      // Arrange
      mockModels.clients.findById.mockResolvedValue(null);
      
      // Act
      await getClientById(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: "Client not found"
      });
    });
  });
});
```

### Ejemplo de Test de Integración

```typescript
// tests/integration/routes/client.routes.test.ts
import request from "supertest";
import createApp from "../../../src/app";
import dbConnect from "../../../src/config/mongo";
import models from "../../../src/models";

describe("Client Routes Integration", () => {
  let app: any;
  
  beforeAll(async () => {
    await dbConnect();
    const { app: testApp } = createApp();
    app = testApp;
  });
  
  afterEach(async () => {
    // Limpiar base de datos de test
    await models.clients.deleteMany({});
  });
  
  describe("GET /api/clients", () => {
    it("should return paginated clients", async () => {
      // Arrange
      await models.clients.create({
        name: "Test Client",
        email: "test@email.com",
        phone: "+593987654321",
        country: "Ecuador",
        city: "Quito",
        dateOfBirth: new Date("1990-01-01")
      });
      
      // Act
      const response = await request(app)
        .get("/api/clients")
        .query({ page: 1, limit: 10 })
        .expect(200);
      
      // Assert
      expect(response.body.clients).toHaveLength(1);
      expect(response.body.totalClients).toBe(1);
      expect(response.body.clients[0].name).toBe("Test Client");
    });
  });
});
```

## 🔍 Debugging

### Configuración de VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
```

### Logging Avanzado

```typescript
// utils/logger.ts
interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

class Logger {
  private static level: number = process.env.NODE_ENV === 'development' ? 3 : 1;
  
  static error(message: string, data?: any): void {
    if (this.level >= 0) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, data);
    }
  }
  
  static warn(message: string, data?: any): void {
    if (this.level >= 1) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
    }
  }
  
  static info(message: string, data?: any): void {
    if (this.level >= 2) {
      console.info(`[INFO] ${new Date().toISOString()} - ${message}`, data);
    }
  }
  
  static debug(message: string, data?: any): void {
    if (this.level >= 3) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }
}

export default Logger;
```

## 📊 Performance y Optimización

### Índices de Base de Datos

```typescript
// Índices recomendados para optimización

// Clientes
ClientSchema.index({ email: 1 }, { unique: true });
ClientSchema.index({ phone: 1 });
ClientSchema.index({ country: 1, city: 1 });
ClientSchema.index({ createdAt: -1 });

// Negocios
BusinessSchema.index({ owner: 1 });
BusinessSchema.index({ onboardingStep: 1 });
BusinessSchema.index({ businessType: 1 });
BusinessSchema.index({ meetingDateTime: 1 });

// Reuniones
MeetingSchema.index({ client: 1, status: 1 });
MeetingSchema.index({ assignedTo: 1, scheduledTime: 1 });
MeetingSchema.index({ status: 1, meetingType: 1 });

// Transacciones
TransactionSchema.index({ clientId: 1, date: -1 });
TransactionSchema.index({ transactionId: 1 }, { unique: true });
TransactionSchema.index({ date: -1 });
```

### Consultas Optimizadas

```typescript
// ✅ Consulta optimizada con populate selectivo
const clients = await models.clients
  .find({ country: "Ecuador" })
  .populate("businesses", "name businessType onboardingStep")
  .select("name email phone businesses")
  .limit(20)
  .sort({ createdAt: -1 });

// ✅ Agregación para estadísticas
const stats = await models.transactions.aggregate([
  {
    $match: {
      date: { $gte: startDate, $lte: endDate }
    }
  },
  {
    $group: {
      _id: "$paymentMethod",
      totalAmount: { $sum: "$amount" },
      count: { $sum: 1 },
      avgAmount: { $avg: "$amount" }
    }
  },
  {
    $sort: { totalAmount: -1 }
  }
]);

// ✅ Consultas paralelas
const [clients, totalCount] = await Promise.all([
  models.clients.find(query).limit(limit).skip(skip),
  models.clients.countDocuments(query)
]);
```

### Caching

```typescript
// Simple in-memory cache
class SimpleCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiry });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

// Uso en controladores
export async function getCachedData(req: Request, res: Response): Promise<void> {
  const cacheKey = `data_${req.params.id}`;
  
  let data = cache.get(cacheKey);
  
  if (!data) {
    data = await models.entity.findById(req.params.id);
    cache.set(cacheKey, data, 300); // 5 minutos
  }
  
  res.status(200).send({ data });
}
```

## 🚀 Deployment

### Docker

```dockerfile
# Dockerfile optimizado para producción
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /usr/src/app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bakano -u 1001

# Copiar archivos compilados
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Cambiar propietario
RUN chown -R bakano:nodejs /usr/src/app
USER bakano

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/index.js"]
```

### Docker Compose para Desarrollo

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/bakano-dev
    volumes:
      - ./src:/usr/src/app/src
      - ./credentials:/usr/src/app/credentials
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=bakano-dev
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  mongo-express:
    image: mongo-express
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_SERVER=mongo
      - ME_CONFIG_MONGODB_PORT=27017
    depends_on:
      - mongo
    restart: unless-stopped

volumes:
  mongo_data:
```

## 🔐 Seguridad

### Validación de Entrada

```typescript
// validators/common.validator.ts
import { Types } from "mongoose";

export class Validator {
  static isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }
  
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }
  
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>"'&]/g, '');
  }
  
  static isValidAmount(amount: number): boolean {
    return typeof amount === 'number' && amount > 0 && amount <= 999999;
  }
}
```

### Rate Limiting

```typescript
// middlewares/rateLimit.middleware.ts
import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15 minutos
  ) {}
  
  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const key = req.ip || 'unknown';
      const now = Date.now();
      
      if (!this.store[key] || now > this.store[key].resetTime) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs
        };
      } else {
        this.store[key].count++;
      }
      
      if (this.store[key].count > this.maxRequests) {
        res.status(429).send({
          message: "Too many requests, please try again later"
        });
        return;
      }
      
      next();
    };
  }
}

export const rateLimiter = new RateLimiter();
```

## 📚 Recursos Adicionales

### Documentación de APIs Externas

- [PagoPlux API Documentation](https://docs.pagoplux.com/)
- [Resend API Documentation](https://resend.com/docs)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)

### Herramientas Recomendadas

- **Postman**: Para testing de APIs
- **MongoDB Compass**: Para visualización de base de datos
- **Docker Desktop**: Para containerización
- **Git**: Para control de versiones
- **VS Code Extensions**:
  - TypeScript Importer
  - Prettier
  - ESLint
  - Thunder Client
  - MongoDB for VS Code

### Comandos Útiles

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Ver logs en tiempo real
npm run dev | grep ERROR

# Compilar y verificar tipos
npx tsc --noEmit

# Formatear todo el código
npm run format

# Verificar dependencias vulnerables
npm audit

# Actualizar dependencias
npm update

# Generar documentación de tipos
npx typedoc src/
```

---

**Nota**: Esta guía debe actualizarse conforme evolucione el proyecto. Mantén siempre la documentación sincronizada con los cambios en el código.