# 🚀 Sistema de Automatizaciones Bakano

## 📋 Descripción General

Este es el backend del sistema de automatizaciones de Bakano, una API REST desarrollada con Node.js, Express.js, TypeScript y MongoDB. El sistema gestiona el proceso completo de onboarding de clientes, desde la recopilación de datos hasta la programación de reuniones y el procesamiento de pagos.

## 🏗️ Arquitectura del Proyecto

El proyecto sigue el patrón arquitectónico **Modelo-Ruta-Controlador-Servicio**:

```
src/
├── app.ts                 # Configuración principal de Express
├── index.ts              # Punto de entrada de la aplicación
├── config/               # Configuraciones (MongoDB, etc.)
├── controllers/          # Lógica de negocio y manejo de requests
├── models/              # Esquemas de MongoDB con Mongoose
├── routes/              # Definición de endpoints de la API
├── services/            # Servicios externos (PagoPlux, Google Drive, etc.)
├── middlewares/         # Middlewares de Express
├── enums/               # Enumeraciones TypeScript
├── types/               # Tipos TypeScript personalizados
├── utils/               # Utilidades y helpers
├── validators/          # Validadores de datos
├── emails/              # Templates de emails
├── schedulers/          # Tareas programadas (cron jobs)
└── errors/              # Manejo de errores personalizado
```

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **Multer** - Manejo de archivos
- **Google Drive API** - Almacenamiento de archivos
- **PagoPlux** - Procesamiento de pagos
- **Resend** - Servicio de emails
- **Node-cron** - Tareas programadas

## 📊 Modelos de Datos

### 👤 Cliente (IClient)
```typescript
interface IClient {
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  dateOfBirth: Date;
  nationalIdentification?: string;
  businesses: ObjectId[];           // Referencias a negocios
  paymentInfo: PaymentInfo;         // Información de pagos
  meetings: ObjectId[];             // Referencias a reuniones
  transactions: ObjectId[];         // Referencias a transacciones
}
```

### 🏢 Negocio (IBusiness)
```typescript
interface IBusiness {
  name: string;
  ruc: string;
  address: string;
  businessType: BusinessTypeEnum;
  phone: string;
  email: string;
  managers: IManager[];             // Gestores del negocio
  owner: ObjectId;                  // Referencia al cliente propietario
  
  // Datos del negocio
  instagram?: string;
  tiktok?: string;
  empleados?: string;
  ingresoMensual?: string;
  ingresoAnual?: string;
  desafioPrincipal?: string;
  objetivoIdeal?: string;
  
  // Archivos subidos
  costoPorPlatoPath?: string;
  menuRestaurantePath?: string | string[];
  ventasClientePath?: string;
  ventasMovimientosPath?: string;
  ventasProductosPath?: string;
  
  // Estado del onboarding
  onboardingStep: OnboardingStepEnum;
  dataSubmissionCompletedAt?: Date;
  meetingScheduledAt?: Date;
  meetingDateTime?: Date;
  meetingLink?: string;
}
```

### 📅 Reunión (IMeeting)
```typescript
interface IMeeting {
  client?: ObjectId;                // Referencia al cliente
  business?: ObjectId;              // Referencia al negocio
  assignedTo: string;               // Asignado a (ej: "Denisse", "Luis")
  status: MeetingStatus;            // Estado de la reunión
  meetingType: MeetingType;         // Tipo de reunión
  scheduledTime: Date;
  endTime: Date;
  meetingLink?: string;
  source: string;                   // Origen (ej: "GoHighLevel")
  sourceId: string;                 // ID externo
  attendeeEmail?: string;
  attendeePhone?: string;
}
```

### 💳 Transacción (ITransaction)
```typescript
interface ITransaction {
  transactionId: string;
  intentId: string;
  amount: number;
  paymentMethod: string;
  cardInfo?: string;
  cardType?: string;
  bank?: string;
  date: Date;
  description: string;
  clientId: ObjectId;
}
```

## 🔄 Estados y Enumeraciones

### Estados del Onboarding
```typescript
enum OnboardingStepEnum {
  PENDING_DATA_SUBMISSION = "pending_data_submission",
  PENDING_MEETING_SCHEDULE = "pending_meeting_schedule", 
  MEETING_SCHEDULED = "meeting_scheduled",
  ONBOARDING_COMPLETE = "onboarding_complete"
}
```

### Estados de Reuniones
```typescript
enum MeetingStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no-show',
  PENDING_SCHEDULE = 'pending-schedule'
}

enum MeetingType {
  PORTFOLIO_ACCESS = 'portfolio-access',  // Reunión con Denisse
  DATA_STRATEGY = 'data-strategy',        // Reunión con Luis
  FOLLOW_UP = 'follow-up'
}
```

## 🛣️ Endpoints de la API

### 👤 Clientes (`/api/clients`)
- `GET /client/:clientId/business/:businessId` - Obtener cliente y negocio específico
- `GET /clients` - Listar clientes con filtros y paginación
- `GET /client/:clientId` - Obtener cliente por ID
- `POST /webhook/appointment` - Webhook para citas de GoHighLevel
- `GET /client/:clientId/meeting-status` - Estado de reuniones del cliente
- `POST /confirm-strategy-meeting` - Confirmar reunión de estrategia
- `GET /meetings` - Obtener todas las reuniones
- `GET /meetings/unassigned` - Reuniones sin asignar
- `POST /meetings/:meetingId/assign` - Asignar reunión
- `POST /complete-data-strategy-meeting` - Completar reunión de estrategia

### 🏢 Negocios (`/api/business`)
- `POST /business/consultancy-data/:businessId` - Subir datos de consultoría
- `PATCH /business/:businessId` - Editar datos del negocio
- `POST /business/send-upload-reminders` - Enviar recordatorios de subida
- `DELETE /business/:businessId` - Eliminar negocio y notificar
- `POST /businesses/:businessId/managers` - Añadir manager
- `GET /businesses/:businessId/managers` - Obtener managers
- `DELETE /businesses/:businessId/managers/:managerId` - Eliminar manager

### 💳 Pagos (`/api/payments`)
- `POST /generate-payment-link` - Generar enlace de pago PagoPlux
- `POST /receive-payment` - Webhook para recibir pagos
- `GET /transactions` - Obtener transacciones con filtros
- `GET /payment-intents` - Obtener intenciones de pago
- `GET /payments-summary` - Resumen de pagos
- `DELETE /transactions/:transactionId` - Eliminar transacción

### 🔍 Búsqueda (`/api/search`)
- `GET /search/clients` - Búsqueda avanzada de clientes
- `GET /search/businesses` - Búsqueda avanzada de negocios

### 📅 Reuniones (`/api/meetings`)
- Endpoints específicos para gestión de reuniones

## 🔧 Servicios Externos

### 💰 PagoPluxService
Maneja la integración con PagoPlux para procesamiento de pagos:
- Creación de enlaces de pago únicos
- Procesamiento de webhooks de pago
- Gestión de transacciones

### 📧 ResendService
Gestiona el envío de emails:
- Emails de onboarding
- Recordatorios de subida de datos
- Notificaciones de reuniones
- Confirmaciones de pago

### ☁️ GoogleDriveService
Maneja la subida y gestión de archivos:
- Subida de documentos de consultoría
- Organización en carpetas por cliente
- Gestión de permisos

### 📅 MeetingService
Gestiona las reuniones y citas:
- Integración con sistemas de calendario
- Notificaciones automáticas
- Gestión de estados

## ⚙️ Configuración

### Variables de Entorno
```env
# Base de datos
MONGO_URI=mongodb://localhost:27017/bakano-automatizations

# PagoPlux
PAGOPLUX_ENDPOINT=https://api.pagoplux.com/intv1/integrations/createLinkFacturaResource
CLIENT_TOKEN=tu_token_de_pagoplux

# Resend
RESEND_API_KEY=tu_api_key_de_resend

# Google Drive
GOOGLE_DRIVE_CREDENTIALS_PATH=./src/credentials/bakano-mvp-generate-content-4618d04c0dde.json
GOOGLE_DRIVE_FOLDER_ID=1IXfjJgXD-uWOKPxwKOXiJl_dhp3uBkOL

# IMPORTANTE: El archivo de credenciales de Google Drive debe solicitarse a dreyes@bakano.ec
# Este archivo contiene información sensible y NO debe estar en el repositorio

# Servidor
PORT=3000
NODE_ENV=development
```

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js 18+
- MongoDB
- Credenciales de Google Drive API
- Cuenta de PagoPlux
- Cuenta de Resend
- **Credenciales de Google Drive**: Solicitar archivo `bakano-mvp-generate-content-4618d04c0dde.json` a **dreyes@bakano.ec**

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd automatizations-server

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# IMPORTANTE: Solicitar credenciales de Google Drive
# Contactar a dreyes@bakano.ec para obtener:
# - src/credentials/bakano-mvp-generate-content-4618d04c0dde.json

# Compilar TypeScript
npm run build
```

### Desarrollo
```bash
# Modo desarrollo con hot reload
npm run dev

# Compilar en modo watch
npm run compile
```

### Producción
```bash
# Compilar para producción
npm run build

# Ejecutar en producción
npm start
```

### Docker
```bash
# Construir imagen
docker build -t bakano-automatizations .

# Ejecutar contenedor
docker run -p 3000:3000 bakano-automatizations
```

## 📋 Flujo de Onboarding

1. **Registro Inicial**: Cliente se registra y crea un negocio
2. **Subida de Datos**: Cliente sube documentos y completa información
3. **Programación de Reunión**: Sistema programa reunión automáticamente
4. **Reunión de Acceso**: Primera reunión con Denisse
5. **Reunión de Estrategia**: Segunda reunión con Luis
6. **Completado**: Onboarding finalizado

## 🔄 Tareas Programadas

El sistema incluye schedulers para:
- Envío de recordatorios de subida de datos
- Recordatorios de reuniones (24h y 1h antes)
- Limpieza de archivos temporales
- Sincronización con sistemas externos

## 🛡️ Seguridad

- Validación estricta de tipos con TypeScript
- Sanitización de datos de entrada
- Manejo seguro de archivos
- Autenticación y autorización
- Rate limiting
- CORS configurado

## 📝 Logging y Monitoreo

- Logs estructurados para todas las operaciones
- Manejo centralizado de errores
- Monitoreo de performance
- Alertas automáticas

## 📚 Documentación Adicional

Para información más detallada, consulta:

- **Controladores**: Documentación detallada de cada controlador en `CONTROLLERS.md`
- **Rutas**: Especificación completa de endpoints en `ROUTES.md`
- **Servicios**: Documentación de servicios externos en `SERVICES.md`
- **Desarrollo**: Guía completa de desarrollo en `DEVELOPMENT.md`
- **🔐 Seguridad**: **IMPORTANTE** - Guía de credenciales y seguridad en `SECURITY.md`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es propiedad de Bakano y está bajo licencia privada.

---

**Desarrollado con ❤️ por el equipo de Bakano**