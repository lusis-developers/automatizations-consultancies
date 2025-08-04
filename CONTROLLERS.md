# 📋 Documentación de Controladores

Esta documentación detalla las funcionalidades de cada controlador del sistema de automatizaciones de Bakano.

## 👤 Client Controller (`client.controller.ts`)

### Funcionalidades Principales

#### `getClientAndBusiness(req, res)`
**Propósito**: Obtiene un cliente específico y valida que tenga acceso a un negocio determinado.

**Parámetros**:
- `clientId`: ID del cliente
- `businessId`: ID del negocio

**Respuesta**:
```json
{
  "client": {
    "_id": "...",
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "businesses": [...]
  }
}
```

**Casos de Error**:
- 404: Cliente no encontrado
- 404: Negocio no pertenece al cliente
- 500: Error interno

---

#### `getClientsController(req, res)`
**Propósito**: Lista clientes con filtros y paginación.

**Query Parameters**:
- `email`: Filtro por email
- `name`: Filtro por nombre
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `country`: Filtro por país
- `city`: Filtro por ciudad

**Respuesta**:
```json
{
  "clients": [...],
  "totalClients": 150,
  "totalPages": 15,
  "currentPage": 1
}
```

---

#### `handleAppointmentWebhook(req, res, next)`
**Propósito**: Procesa webhooks de citas desde GoHighLevel.

**Flujo**:
1. Valida datos del webhook
2. Busca o crea cliente
3. Busca o crea negocio
4. Crea reunión en el sistema
5. Envía notificaciones

**Payload Esperado**:
```json
{
  "contact": {
    "email": "cliente@email.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+593987654321"
  },
  "appointment": {
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T11:00:00Z",
    "calendarId": "cal_123",
    "appointmentId": "apt_456"
  }
}
```

---

#### `getClientMeetingStatus(req, res, next)`
**Propósito**: Obtiene el estado de las reuniones de un cliente.

**Respuesta**:
```json
{
  "client": {...},
  "meetings": [
    {
      "_id": "...",
      "status": "scheduled",
      "meetingType": "portfolio-access",
      "scheduledTime": "2024-01-15T10:00:00Z",
      "assignedTo": "Denisse"
    }
  ],
  "nextMeeting": {...},
  "completedMeetings": 1,
  "pendingMeetings": 1
}
```

---

#### `confirmStrategyMeeting(req, res, next)`
**Propósito**: Confirma una reunión de estrategia y actualiza el estado del onboarding.

**Body**:
```json
{
  "meetingId": "meeting_id",
  "clientId": "client_id",
  "businessId": "business_id"
}
```

**Flujo**:
1. Valida que la reunión existe
2. Actualiza estado a 'completed'
3. Avanza el onboarding del negocio
4. Programa siguiente reunión si es necesario

---

#### `assignMeetingController(req, res, next)`
**Propósito**: Asigna una reunión a un consultor específico.

**Body**:
```json
{
  "assignedTo": "Luis",
  "meetingType": "data-strategy"
}
```

---

## 🏢 Business Controller (`businesses.controller.ts`)

### Funcionalidades Principales

#### `receiveConsultancyData(req, res, next)`
**Propósito**: Recibe y procesa archivos de consultoría subidos por el cliente.

**Archivos Soportados**:
- Costos por plato (Excel/PDF)
- Menú del restaurante (PDF/Imágenes)
- Ventas por cliente (Excel)
- Movimientos de ventas (Excel)
- Productos vendidos (Excel)

**Flujo**:
1. Valida que el negocio existe
2. Sube archivos a Google Drive
3. Actualiza rutas en la base de datos
4. Actualiza estado de onboarding
5. Envía notificación de confirmación

**Respuesta**:
```json
{
  "message": "Consultancy data received and processed successfully",
  "business": {...},
  "uploadedFiles": [
    {
      "fieldName": "costoPorPlato",
      "fileName": "costos_enero.xlsx",
      "driveFileId": "1ABC..."
    }
  ]
}
```

---

#### `editBusinessData(req, res, next)`
**Propósito**: Permite editar información básica del negocio.

**Campos Editables**:
```json
{
  "name": "Nuevo nombre",
  "ruc": "1234567890001",
  "address": "Nueva dirección",
  "phone": "+593987654321",
  "email": "nuevo@email.com",
  "instagram": "@mi_negocio",
  "tiktok": "@mi_negocio",
  "empleados": "5-10",
  "ingresoMensual": "$5000-$10000",
  "desafioPrincipal": "Aumentar ventas online",
  "objetivoIdeal": "Duplicar ingresos en 6 meses"
}
```

---

#### `sendDataUploadReminders(req, res, next)`
**Propósito**: Envía recordatorios automáticos a clientes que no han subido datos.

**Criterios**:
- Negocios en estado `PENDING_DATA_SUBMISSION`
- Más de 24 horas desde la creación
- No se ha enviado recordatorio en las últimas 24 horas

**Respuesta**:
```json
{
  "message": "Upload reminders sent successfully",
  "remindersSent": 5,
  "businessesNotified": [
    {
      "businessId": "...",
      "businessName": "Restaurante XYZ",
      "ownerEmail": "owner@email.com"
    }
  ]
}
```

---

#### `deleteBusinessAndNotifyController(req, res, next)`
**Propósito**: Elimina un negocio y notifica a todos los involucrados.

**Flujo**:
1. Valida permisos de eliminación
2. Elimina archivos de Google Drive
3. Cancela reuniones programadas
4. Elimina registros de la base de datos
5. Notifica al cliente y managers

---

## 💳 Payments Controller (`payments.controllers.ts`)

### Funcionalidades Principales

#### `generatePagopluxPaymentLinkController(req, res)`
**Propósito**: Genera un enlace de pago único usando PagoPlux.

**Body Requerido**:
```json
{
  "monto": 150.00,
  "descripcion": "Consultoría empresarial - Enero 2024",
  "nombreCliente": "Juan Pérez",
  "correoCliente": "juan@email.com",
  "telefono": "987654321",
  "prefijo": "593",
  "direccion": "Av. Principal 123",
  "ci": "1234567890",
  "nombreNegocio": "Restaurante XYZ"
}
```

**Respuesta**:
```json
{
  "message": "Payment link generated successfully",
  "paymentLink": "https://pay.pagoplux.com/...",
  "intentId": "uuid-generated",
  "expiresAt": "2024-01-15T23:59:59Z"
}
```

---

#### `receivePaymentController(req, res)`
**Propósito**: Procesa webhooks de pagos completados desde PagoPlux.

**Webhook Payload**:
```json
{
  "status": "approved",
  "transactionId": "txn_123456",
  "intentId": "intent_uuid",
  "amount": 150.00,
  "paymentMethod": "credit_card",
  "cardInfo": "****1234",
  "cardType": "visa",
  "bank": "Banco Pichincha",
  "date": "2024-01-15T14:30:00Z"
}
```

**Flujo**:
1. Valida webhook signature
2. Busca la intención de pago
3. Crea registro de transacción
4. Actualiza estado del cliente
5. Envía confirmación por email

---

#### `getTransactionsController(req, res, next)`
**Propósito**: Obtiene transacciones con filtros avanzados.

**Query Parameters**:
- `clientId`: Filtro por cliente
- `startDate`: Fecha inicio (YYYY-MM-DD)
- `endDate`: Fecha fin (YYYY-MM-DD)
- `paymentMethod`: Método de pago
- `minAmount`: Monto mínimo
- `maxAmount`: Monto máximo
- `page`: Página
- `limit`: Límite por página

**Respuesta**:
```json
{
  "transactions": [...],
  "totalTransactions": 50,
  "totalAmount": 7500.00,
  "totalPages": 5,
  "currentPage": 1,
  "summary": {
    "credit_card": 6000.00,
    "debit_card": 1500.00
  }
}
```

---

#### `getPaymentsSummaryController(req, res)`
**Propósito**: Genera resumen ejecutivo de pagos.

**Query Parameters**:
- `period`: 'daily', 'weekly', 'monthly', 'yearly'
- `startDate`: Fecha inicio
- `endDate`: Fecha fin

**Respuesta**:
```json
{
  "summary": {
    "totalRevenue": 15000.00,
    "totalTransactions": 100,
    "averageTransaction": 150.00,
    "successRate": 95.5,
    "topPaymentMethod": "credit_card",
    "monthlyGrowth": 12.5
  },
  "breakdown": {
    "byPaymentMethod": {...},
    "byDay": [...],
    "byClient": [...]
  }
}
```

---

## 👨‍💼 Manager Controller (`manager.controller.ts`)

### Funcionalidades Principales

#### `addManagerToBusiness(req, res, next)`
**Propósito**: Añade un nuevo manager a un negocio específico.

**Body**:
```json
{
  "name": "Carlos López",
  "email": "carlos@email.com",
  "role": "manager"
}
```

**Flujo**:
1. Valida que el negocio existe
2. Verifica que el email no esté duplicado
3. Añade manager al array
4. Envía email de bienvenida

---

#### `getBusinessManagers(req, res, next)`
**Propósito**: Obtiene lista de managers de un negocio.

**Respuesta**:
```json
{
  "managers": [
    {
      "_id": "...",
      "name": "Carlos López",
      "email": "carlos@email.com",
      "role": "manager",
      "addedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "totalManagers": 3
}
```

---

#### `removeManagerFromBusiness(req, res, next)`
**Propósito**: Elimina un manager de un negocio.

**Parámetros**:
- `businessId`: ID del negocio
- `managerId`: ID del manager

**Flujo**:
1. Valida permisos
2. Elimina manager del array
3. Notifica al manager eliminado
4. Actualiza logs de auditoría

---

## 🔍 Search Controller (`search.controller.ts`)

### Funcionalidades Principales

#### Búsqueda Avanzada de Clientes
**Endpoint**: `GET /api/search/clients`

**Query Parameters**:
- `q`: Término de búsqueda general
- `email`: Búsqueda por email
- `phone`: Búsqueda por teléfono
- `country`: Filtro por país
- `hasBusinesses`: true/false
- `hasTransactions`: true/false
- `registeredAfter`: Fecha de registro
- `sort`: Campo de ordenamiento
- `order`: 'asc' o 'desc'

#### Búsqueda Avanzada de Negocios
**Endpoint**: `GET /api/search/businesses`

**Query Parameters**:
- `q`: Término de búsqueda general
- `businessType`: Tipo de negocio
- `onboardingStep`: Estado del onboarding
- `hasManagers`: true/false
- `revenueRange`: Rango de ingresos
- `employeeRange`: Rango de empleados

---

## 🛡️ Manejo de Errores

Todos los controladores implementan manejo de errores consistente:

```typescript
try {
  // Lógica del controlador
  res.status(HttpStatusCode.Ok).send({
    message: "Operation completed successfully",
    data: result
  });
  return;
} catch (error) {
  console.error("Error in controllerName:", error);
  res.status(HttpStatusCode.InternalServerError).send({
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
  return;
}
```

## 📝 Validaciones Comunes

### Validación de ObjectId
```typescript
if (!Types.ObjectId.isValid(id)) {
  res.status(HttpStatusCode.BadRequest).send({
    message: "Invalid ID format"
  });
  return;
}
```

### Validación de Campos Requeridos
```typescript
if (!field1 || !field2) {
  res.status(HttpStatusCode.BadRequest).send({
    message: "Missing required fields"
  });
  return;
}
```

### Validación de Existencia
```typescript
const entity = await models.entityName.findById(id);
if (!entity) {
  res.status(HttpStatusCode.NotFound).send({
    message: "Entity not found"
  });
  return;
}
```

---

**Nota**: Todos los controladores siguen el patrón de arquitectura establecido y utilizan TypeScript para tipado fuerte. Cada función está documentada con JSDoc para mejor comprensión del código.