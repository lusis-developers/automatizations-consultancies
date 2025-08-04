# 🔧 Documentación de Servicios

Esta documentación detalla todos los servicios externos y internos utilizados en el sistema de automatizaciones de Bakano.

## 📋 Arquitectura de Servicios

Los servicios están organizados siguiendo el patrón de **Inversión de Dependencias** y **Separación de Responsabilidades**:

```
src/services/
├── pagoplux.service.ts      # Procesamiento de pagos
├── resend.service.ts        # Envío de emails
├── googleDrive.service.ts   # Gestión de archivos
└── meeting.service.ts       # Gestión de reuniones
```

## 💰 PagoPlux Service

### Descripción
Servicio para integración con la pasarela de pagos PagoPlux, maneja la creación de enlaces de pago y procesamiento de transacciones.

### Configuración
```typescript
class PagoPluxService {
  private endpoint: string;
  private establishmentRuc: string;
  private clientToken: string;
}
```

### Variables de Entorno Requeridas
```env
PAGOPLUX_ENDPOINT=https://api.pagoplux.com/intv1/integrations/createLinkFacturaResource
CLIENT_TOKEN=tu_token_base64_de_pagoplux
```

### Métodos Principales

#### `createPaymentLink()`
**Propósito**: Crea un enlace de pago único para un cliente.

**Parámetros**:
```typescript
createPay mentLink(
  amount: number,           // Monto total con impuestos
  description: string,      // Descripción del pago
  customerName: string,     // Nombre del cliente
  customerEmail: string,    // Email del cliente
  phone: string,           // Teléfono del cliente
  prefix: string = "+593", // Código de país
  address: string = "Address not specified", // Dirección
  idNumber: string = "consumidor final",     // Cédula/RUC
  extras?: string          // Información adicional
): Promise<string>
```

**Ejemplo de Uso**:
```typescript
const pagoService = new PagoPluxService();
const paymentLink = await pagoService.createPaymentLink(
  150.00,
  "Consultoría empresarial - Enero 2024",
  "Juan Pérez",
  "juan@email.com",
  "987654321",
  "+593",
  "Av. Principal 123, Quito",
  "1234567890",
  "Paquete premium con análisis avanzado"
);
```

**Respuesta**:
```typescript
// Retorna URL del enlace de pago
"https://pay.pagoplux.com/pl/abc123..."
```

### Estructura del Request a PagoPlux
```typescript
interface PagoPluxRequest {
  rucEstablecimiento: string;    // RUC en Base64
  montoCero: number;             // Monto con tarifa 0%
  monto12: number;               // Monto con IVA 12%
  descripcion: string;           // Descripción del pago
  linkUnico: boolean;            // true para enlaces únicos
  esQR: boolean;                 // false para enlaces web
  esRecurrente: boolean;         // false para pagos únicos
  ci: string;                    // Cédula del cliente
  nombreCliente: string;         // Nombre completo
  correoCliente: string;         // Email del cliente
  direccion: string;             // Dirección del cliente
  telefono: string;              // Teléfono con prefijo
  extras?: string;               // Información adicional
}
```

### Manejo de Errores
```typescript
try {
  const link = await pagoService.createPaymentLink(...);
} catch (error) {
  if (error.response?.status === 400) {
    // Error de validación de datos
  } else if (error.response?.status === 401) {
    // Token inválido
  } else {
    // Error de conexión o servidor
  }
}
```

---

## 📧 Resend Service

### Descripción
Servicio para envío de emails transaccionales usando la plataforma Resend. Maneja templates, personalización y tracking de emails.

### Configuración
```typescript
class ResendService {
  private resend: Resend;
  private fromEmail: string = "noreply@bakano.ec";
}
```

### Variables de Entorno Requeridas
```env
RESEND_API_KEY=re_tu_api_key_de_resend
FROM_EMAIL=noreply@bakano.ec
```

### Métodos Principales

#### `sendOnboardingEmail()`
**Propósito**: Envía email de bienvenida al iniciar onboarding.

```typescript
sendOnboardingEmail(
  clientEmail: string,
  clientName: string,
  businessName: string,
  uploadLink: string
): Promise<void>
```

#### `sendDataUploadReminder()`
**Propósito**: Envía recordatorio para subir datos de consultoría.

```typescript
sendDataUploadReminder(
  clientEmail: string,
  clientName: string,
  businessName: string,
  uploadLink: string,
  daysSinceCreation: number
): Promise<void>
```

#### `sendMeetingConfirmation()`
**Propósito**: Confirma programación de reunión.

```typescript
sendMeetingConfirmation(
  clientEmail: string,
  clientName: string,
  meetingDetails: {
    date: Date;
    time: string;
    duration: number;
    meetingLink: string;
    consultantName: string;
    meetingType: string;
  }
): Promise<void>
```

#### `sendPaymentConfirmation()`
**Propósito**: Confirma pago exitoso.

```typescript
sendPaymentConfirmation(
  clientEmail: string,
  clientName: string,
  paymentDetails: {
    amount: number;
    transactionId: string;
    date: Date;
    description: string;
    paymentMethod: string;
  }
): Promise<void>
```

#### `sendManagerInvitation()`
**Propósito**: Invita a un nuevo manager al sistema.

```typescript
sendManagerInvitation(
  managerEmail: string,
  managerName: string,
  businessName: string,
  inviteLink: string
): Promise<void>
```

### Templates de Email

Todos los emails utilizan templates HTML responsivos ubicados en `src/emails/`:

- `generateOnBoarding.email.ts` - Email de bienvenida
- `generateUploadReminderEmail.email.ts` - Recordatorio de subida
- `generatePayEmail.email.ts` - Confirmación de pago
- `generateManagerOnboarding.email.ts` - Invitación de manager

### Ejemplo de Uso
```typescript
const emailService = new ResendService();

// Enviar email de bienvenida
await emailService.sendOnboardingEmail(
  "cliente@email.com",
  "Juan Pérez",
  "Restaurante XYZ",
  "https://onboarding.bakano.ec/upload/business123"
);

// Enviar confirmación de pago
await emailService.sendPaymentConfirmation(
  "cliente@email.com",
  "Juan Pérez",
  {
    amount: 150.00,
    transactionId: "txn_123456",
    date: new Date(),
    description: "Consultoría empresarial",
    paymentMethod: "Tarjeta de crédito"
  }
);
```

### Personalización de Templates
```typescript
interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
  attachments?: Attachment[];
}

// Función para generar template personalizado
function generateCustomTemplate(
  templateName: string,
  variables: Record<string, any>
): EmailTemplate {
  // Lógica de generación de template
}
```

---

## ☁️ Google Drive Service

### Descripción
Servicio para gestión de archivos en Google Drive, incluyendo subida, organización en carpetas y gestión de permisos.

### Configuración
```typescript
class GoogleDriveService {
  private drive: drive_v3.Drive;
  private parentFolderId: string;
}
```

### Variables de Entorno Requeridas
```env
GOOGLE_DRIVE_CREDENTIALS_PATH=./credentials/service-account.json
GOOGLE_DRIVE_FOLDER_ID=1IXfjJgXD-uWOKPxwKOXiJl_dhp3uBkOL
```

### Autenticación
```typescript
// Archivo de credenciales de Service Account
{
  "type": "service_account",
  "project_id": "bakano-mvp-generate-content",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@bakano-mvp.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### Métodos Principales

#### `uploadFile()`
**Propósito**: Sube un archivo a Google Drive.

```typescript
uploadFile(
  filePath: string,        // Ruta local del archivo
  fileName: string,        // Nombre del archivo en Drive
  mimeType: string,        // Tipo MIME del archivo
  parentFolderId?: string  // ID de carpeta padre (opcional)
): Promise<{
  fileId: string;
  fileName: string;
  fileUrl: string;
  parentFolderId: string;
}>
```

#### `createBusinessFolder()`
**Propósito**: Crea carpeta específica para un negocio.

```typescript
createBusinessFolder(
  businessName: string,
  businessId: string
): Promise<{
  folderId: string;
  folderName: string;
  folderUrl: string;
}>
```

#### `uploadBusinessFiles()`
**Propósito**: Sube múltiples archivos de un negocio organizándolos en subcarpetas.

```typescript
uploadBusinessFiles(
  businessId: string,
  files: {
    costoPorPlato?: Express.Multer.File[];
    menuRestaurante?: Express.Multer.File[];
    ventasCliente?: Express.Multer.File[];
    ventasMovimientos?: Express.Multer.File[];
    ventasProductos?: Express.Multer.File[];
  }
): Promise<{
  uploadedFiles: UploadedFile[];
  businessFolderId: string;
  totalFilesUploaded: number;
}>
```

#### `deleteFile()`
**Propósito**: Elimina un archivo de Google Drive.

```typescript
deleteFile(fileId: string): Promise<void>
```

#### `shareFile()`
**Propósito**: Comparte un archivo con usuarios específicos.

```typescript
shareFile(
  fileId: string,
  emails: string[],
  role: 'reader' | 'writer' | 'commenter' = 'reader'
): Promise<void>
```

### Estructura de Carpetas
```
Bakano Automatizaciones/
├── Clientes/
│   ├── [BusinessName] - [BusinessId]/
│   │   ├── Costos/
│   │   │   └── costo_por_plato.xlsx
│   │   ├── Menus/
│   │   │   ├── menu_principal.pdf
│   │   │   └── menu_bebidas.pdf
│   │   ├── Ventas/
│   │   │   ├── ventas_clientes.xlsx
│   │   │   ├── movimientos_ventas.xlsx
│   │   │   └── productos_vendidos.xlsx
│   │   └── Documentos/
│   │       └── otros_documentos.pdf
```

### Ejemplo de Uso
```typescript
const driveService = new GoogleDriveService(
  "./credentials/service-account.json",
  "1IXfjJgXD-uWOKPxwKOXiJl_dhp3uBkOL"
);

// Crear carpeta para negocio
const businessFolder = await driveService.createBusinessFolder(
  "Restaurante XYZ",
  "business123"
);

// Subir archivos del negocio
const uploadResult = await driveService.uploadBusinessFiles(
  "business123",
  {
    costoPorPlato: [file1],
    menuRestaurante: [file2, file3],
    ventasCliente: [file4]
  }
);

console.log(`Subidos ${uploadResult.totalFilesUploaded} archivos`);
```

### Tipos de Archivo Soportados
```typescript
const SUPPORTED_MIME_TYPES = {
  // Documentos
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  
  // Hojas de cálculo
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/csv': '.csv',
  
  // Imágenes
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};
```

---

## 📅 Meeting Service

### Descripción
Servicio para gestión de reuniones, integración con calendarios y automatización de recordatorios.

### Configuración
```typescript
class MeetingService {
  private calendarIntegrations: Map<string, CalendarProvider>;
  private reminderScheduler: ReminderScheduler;
}
```

### Métodos Principales

#### `scheduleMeeting()`
**Propósito**: Programa una nueva reunión.

```typescript
scheduleMeeting(
  meetingData: {
    clientId: string;
    businessId: string;
    meetingType: MeetingType;
    scheduledTime: Date;
    duration: number; // en minutos
    assignedTo: string;
    meetingLink?: string;
    notes?: string;
  }
): Promise<{
  meetingId: string;
  calendarEventId?: string;
  reminderScheduled: boolean;
}>
```

#### `updateMeetingStatus()`
**Propósito**: Actualiza el estado de una reunión.

```typescript
updateMeetingStatus(
  meetingId: string,
  status: MeetingStatus,
  notes?: string
): Promise<void>
```

#### `sendMeetingReminders()`
**Propósito**: Envía recordatorios automáticos de reuniones.

```typescript
sendMeetingReminders(
  timeframe: '24h' | '1h' | '15m'
): Promise<{
  remindersSent: number;
  meetingsNotified: string[];
}>
```

#### `rescheduleMe eting()`
**Propósito**: Reprograma una reunión existente.

```typescript
rescheduleMeeting(
  meetingId: string,
  newDateTime: Date,
  reason?: string
): Promise<void>
```

#### `cancelMeeting()`
**Propósito**: Cancela una reunión.

```typescript
cancelMeeting(
  meetingId: string,
  reason: string,
  notifyAttendees: boolean = true
): Promise<void>
```

### Integración con Calendarios
```typescript
interface CalendarProvider {
  createEvent(eventData: CalendarEvent): Promise<string>;
  updateEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
}

// Proveedores soportados
class GoogleCalendarProvider implements CalendarProvider { ... }
class OutlookCalendarProvider implements CalendarProvider { ... }
class CalendlyProvider implements CalendarProvider { ... }
```

### Automatización de Recordatorios
```typescript
// Configuración de recordatorios
const REMINDER_SCHEDULE = {
  '24h': { hours: 24, template: 'meeting_reminder_24h' },
  '1h': { hours: 1, template: 'meeting_reminder_1h' },
  '15m': { minutes: 15, template: 'meeting_reminder_15m' }
};

// Programación automática
class ReminderScheduler {
  scheduleReminders(meeting: IMeeting): void {
    // Programa recordatorios usando node-cron
  }
}
```

---

## 🔄 Helpers y Utilidades

### Payment Helpers

#### `handleIntentPayment.helper.ts`
**Propósito**: Procesa pagos por intención (webhooks).

```typescript
export async function handleIntentPayment(
  paymentData: PagoPluxWebhookData
): Promise<{
  transaction: ITransaction;
  client: IClient;
  emailSent: boolean;
}>
```

#### `handleManualPayment.helper.ts`
**Propósito**: Procesa pagos manuales.

```typescript
export async function handleManualPayment(
  paymentData: ManualPaymentData
): Promise<{
  transaction: ITransaction;
  paymentIntent: IPaymentIntent;
}>
```

### Controller Helpers

#### `extractExtras.util.ts`
**Propósito**: Extrae información adicional de requests.

```typescript
export function extractExtras(
  req: Request
): {
  userAgent: string;
  ipAddress: string;
  timestamp: Date;
  extras: Record<string, any>;
}
```

---

## 🛡️ Seguridad y Mejores Prácticas

### Manejo de Credenciales
```typescript
// ❌ NUNCA hacer esto
const apiKey = "sk_live_abc123...";

// ✅ Usar variables de entorno
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error("RESEND_API_KEY is required");
}
```

### Validación de Datos
```typescript
// Validar antes de procesar
if (!email || !isValidEmail(email)) {
  throw new Error("Valid email is required");
}

if (!amount || amount <= 0) {
  throw new Error("Amount must be greater than 0");
}
```

### Manejo de Errores
```typescript
try {
  await service.performOperation();
} catch (error) {
  // Log del error
  console.error(`Service error in ${operation}:`, error);
  
  // Re-throw con contexto
  throw new Error(`Failed to ${operation}: ${error.message}`);
}
```

### Rate Limiting
```typescript
// Implementar rate limiting para APIs externas
class RateLimitedService {
  private lastRequest: Date = new Date(0);
  private minInterval: number = 1000; // 1 segundo
  
  async makeRequest() {
    const now = new Date();
    const timeSinceLastRequest = now.getTime() - this.lastRequest.getTime();
    
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = new Date();
    // Hacer request...
  }
}
```

---

## 📊 Monitoreo y Logging

### Logging Estructurado
```typescript
interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  service: string;
  operation: string;
  data?: any;
  error?: Error;
}

class Logger {
  static log(entry: LogEntry): void {
    console.log(JSON.stringify({
      ...entry,
      timestamp: entry.timestamp.toISOString()
    }));
  }
}

// Uso en servicios
Logger.log({
  timestamp: new Date(),
  level: 'info',
  service: 'PagoPluxService',
  operation: 'createPaymentLink',
  data: { amount, customerEmail }
});
```

### Métricas de Performance
```typescript
class PerformanceMonitor {
  static async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      Logger.log({
        timestamp: new Date(),
        level: 'info',
        service: 'PerformanceMonitor',
        operation: operationName,
        data: { duration, success: true }
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      Logger.log({
        timestamp: new Date(),
        level: 'error',
        service: 'PerformanceMonitor',
        operation: operationName,
        data: { duration, success: false },
        error
      });
      
      throw error;
    }
  }
}
```

---

## 🧪 Testing de Servicios

### Mocking de Servicios Externos
```typescript
// Mock para testing
class MockPagoPluxService extends PagoPluxService {
  async createPaymentLink(): Promise<string> {
    return "https://mock-payment-link.com/test123";
  }
}

// Test unitario
describe('PaymentController', () => {
  it('should create payment link', async () => {
    const mockService = new MockPagoPluxService();
    const controller = new PaymentController(mockService);
    
    const result = await controller.generatePaymentLink(mockRequest);
    expect(result.paymentLink).toContain('mock-payment-link');
  });
});
```

---

**Nota**: Todos los servicios están diseñados para ser modulares, testeable y fácilmente extensibles. Cada servicio maneja sus propias dependencias y errores, siguiendo los principios SOLID de desarrollo de software.