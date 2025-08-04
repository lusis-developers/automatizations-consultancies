# 🛣️ Documentación de Rutas

Esta documentación detalla todos los endpoints disponibles en la API del sistema de automatizaciones de Bakano.

## 📋 Estructura General

Todas las rutas están bajo el prefijo `/api` y están organizadas por módulos:

- `/api/clients/*` - Gestión de clientes
- `/api/business/*` - Gestión de negocios
- `/api/payments/*` - Procesamiento de pagos
- `/api/search/*` - Búsquedas avanzadas
- `/api/meetings/*` - Gestión de reuniones

## 👤 Rutas de Clientes (`/api/clients`)

### `GET /client/:clientId/business/:businessId`
**Descripción**: Obtiene información de un cliente y valida acceso a un negocio específico.

**Parámetros de Ruta**:
- `clientId` (string): ID del cliente
- `businessId` (string): ID del negocio

**Respuesta Exitosa (200)**:
```json
{
  "client": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "phone": "+593987654321",
    "businesses": [...]
  }
}
```

**Errores**:
- `404`: Cliente no encontrado
- `404`: Negocio no pertenece al cliente
- `500`: Error interno del servidor

---

### `GET /clients`
**Descripción**: Lista todos los clientes con filtros y paginación.

**Query Parameters**:
- `email` (string, opcional): Filtro por email
- `name` (string, opcional): Filtro por nombre
- `page` (number, opcional): Número de página (default: 1)
- `limit` (number, opcional): Elementos por página (default: 10)
- `country` (string, opcional): Filtro por país
- `city` (string, opcional): Filtro por ciudad
- `hasBusinesses` (boolean, opcional): Filtrar clientes con/sin negocios
- `hasTransactions` (boolean, opcional): Filtrar clientes con/sin transacciones

**Ejemplo de Uso**:
```
GET /api/clients?page=1&limit=20&country=Ecuador&hasBusinesses=true
```

**Respuesta Exitosa (200)**:
```json
{
  "clients": [
    {
      "_id": "...",
      "name": "Juan Pérez",
      "email": "juan@email.com",
      "country": "Ecuador",
      "businessCount": 2,
      "transactionCount": 5
    }
  ],
  "totalClients": 150,
  "totalPages": 8,
  "currentPage": 1,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

---

### `GET /client/:clientId`
**Descripción**: Obtiene información detallada de un cliente específico.

**Parámetros de Ruta**:
- `clientId` (string): ID del cliente

**Respuesta Exitosa (200)**:
```json
{
  "client": {
    "_id": "...",
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "phone": "+593987654321",
    "country": "Ecuador",
    "city": "Quito",
    "dateOfBirth": "1985-06-15T00:00:00.000Z",
    "businesses": [...],
    "meetings": [...],
    "transactions": [...],
    "paymentInfo": {
      "preferredMethod": "credit_card",
      "lastPaymentDate": "2024-01-10T00:00:00.000Z"
    }
  }
}
```

---

### `POST /webhook/appointment`
**Descripción**: Webhook para recibir notificaciones de citas desde GoHighLevel.

**Headers Requeridos**:
- `Content-Type: application/json`
- `X-Webhook-Signature` (opcional): Firma del webhook

**Body**:
```json
{
  "contact": {
    "email": "cliente@email.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+593987654321",
    "country": "Ecuador",
    "city": "Quito",
    "dateOfBirth": "1985-06-15"
  },
  "appointment": {
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T11:00:00Z",
    "calendarId": "cal_denisse_portfolio",
    "appointmentId": "apt_123456",
    "meetingLink": "https://meet.google.com/abc-defg-hij"
  },
  "business": {
    "name": "Restaurante XYZ",
    "businessType": "restaurant"
  }
}
```

**Respuesta Exitosa (200)**:
```json
{
  "message": "Appointment processed successfully",
  "clientId": "...",
  "businessId": "...",
  "meetingId": "..."
}
```

---

### `GET /client/:clientId/meeting-status`
**Descripción**: Obtiene el estado de las reuniones de un cliente.

**Respuesta Exitosa (200)**:
```json
{
  "client": {...},
  "meetings": [
    {
      "_id": "...",
      "status": "scheduled",
      "meetingType": "portfolio-access",
      "scheduledTime": "2024-01-15T10:00:00Z",
      "assignedTo": "Denisse",
      "meetingLink": "https://meet.google.com/..."
    }
  ],
  "nextMeeting": {...},
  "completedMeetings": 1,
  "pendingMeetings": 1,
  "onboardingProgress": {
    "currentStep": "meeting_scheduled",
    "completionPercentage": 75
  }
}
```

---

### `POST /confirm-strategy-meeting`
**Descripción**: Confirma la realización de una reunión de estrategia.

**Body**:
```json
{
  "meetingId": "meeting_id_here",
  "clientId": "client_id_here",
  "businessId": "business_id_here",
  "notes": "Reunión completada exitosamente. Cliente interesado en paquete premium.",
  "nextSteps": ["Enviar propuesta", "Programar seguimiento"]
}
```

**Respuesta Exitosa (200)**:
```json
{
  "message": "Strategy meeting confirmed successfully",
  "meeting": {...},
  "business": {
    "onboardingStep": "onboarding_complete"
  }
}
```

---

### `GET /meetings`
**Descripción**: Obtiene todas las reuniones con filtros.

**Query Parameters**:
- `status` (string): Estado de la reunión
- `assignedTo` (string): Asignado a
- `meetingType` (string): Tipo de reunión
- `startDate` (string): Fecha inicio (YYYY-MM-DD)
- `endDate` (string): Fecha fin (YYYY-MM-DD)
- `page` (number): Página
- `limit` (number): Límite

---

### `GET /meetings/unassigned`
**Descripción**: Obtiene reuniones sin asignar a ningún consultor.

**Respuesta Exitosa (200)**:
```json
{
  "meetings": [
    {
      "_id": "...",
      "client": {...},
      "business": {...},
      "scheduledTime": "2024-01-15T10:00:00Z",
      "meetingType": "portfolio-access",
      "status": "pending-schedule"
    }
  ],
  "totalUnassigned": 5
}
```

---

### `POST /meetings/:meetingId/assign`
**Descripción**: Asigna una reunión a un consultor específico.

**Parámetros de Ruta**:
- `meetingId` (string): ID de la reunión

**Body**:
```json
{
  "assignedTo": "Luis",
  "meetingType": "data-strategy",
  "notes": "Cliente requiere análisis avanzado de datos"
}
```

---

### `POST /complete-data-strategy-meeting`
**Descripción**: Marca como completada una reunión de estrategia de datos.

**Body**:
```json
{
  "meetingId": "...",
  "clientId": "...",
  "businessId": "...",
  "deliverables": [
    "Análisis de ventas",
    "Recomendaciones de mejora",
    "Plan de implementación"
  ],
  "followUpRequired": true,
  "followUpDate": "2024-02-01T10:00:00Z"
}
```

---

## 🏢 Rutas de Negocios (`/api/business`)

### `POST /business/consultancy-data/:businessId`
**Descripción**: Recibe archivos de datos de consultoría del cliente.

**Parámetros de Ruta**:
- `businessId` (string): ID del negocio

**Content-Type**: `multipart/form-data`

**Campos de Archivo**:
- `costoPorPlato` (file, opcional): Archivo de costos por plato
- `menuRestaurante` (file[], opcional): Archivos del menú
- `ventasCliente` (file, opcional): Archivo de ventas por cliente
- `ventasMovimientos` (file, opcional): Archivo de movimientos de ventas
- `ventasProductos` (file, opcional): Archivo de productos vendidos

**Campos de Texto**:
- `instagram` (string, opcional): Usuario de Instagram
- `tiktok` (string, opcional): Usuario de TikTok
- `empleados` (string, opcional): Número de empleados
- `ingresoMensual` (string, opcional): Rango de ingresos mensuales
- `ingresoAnual` (string, opcional): Rango de ingresos anuales
- `desafioPrincipal` (string, opcional): Principal desafío del negocio
- `objetivoIdeal` (string, opcional): Objetivo ideal a alcanzar
- `vendePorWhatsapp` (boolean, opcional): Vende por WhatsApp
- `gananciaWhatsapp` (string, opcional): Ganancia por WhatsApp

**Respuesta Exitosa (200)**:
```json
{
  "message": "Consultancy data received and processed successfully",
  "business": {
    "_id": "...",
    "name": "Restaurante XYZ",
    "onboardingStep": "pending_meeting_schedule",
    "dataSubmissionCompletedAt": "2024-01-15T14:30:00Z"
  },
  "uploadedFiles": [
    {
      "fieldName": "costoPorPlato",
      "originalName": "costos_enero.xlsx",
      "driveFileId": "1ABC123...",
      "driveFileUrl": "https://drive.google.com/file/d/1ABC123.../view"
    }
  ]
}
```

---

### `PATCH /business/:businessId`
**Descripción**: Edita información básica de un negocio.

**Parámetros de Ruta**:
- `businessId` (string): ID del negocio

**Body**:
```json
{
  "name": "Nuevo Nombre del Restaurante",
  "ruc": "1234567890001",
  "address": "Nueva Dirección 123",
  "phone": "+593987654321",
  "email": "nuevo@email.com",
  "instagram": "@nuevo_restaurante",
  "tiktok": "@nuevo_restaurante",
  "empleados": "10-20",
  "ingresoMensual": "$10000-$20000",
  "ingresoAnual": "$120000-$240000",
  "desafioPrincipal": "Mejorar presencia digital",
  "objetivoIdeal": "Aumentar ventas online en 50%"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "message": "Business data updated successfully",
  "business": {...}
}
```

---

### `POST /business/send-upload-reminders`
**Descripción**: Envía recordatorios automáticos a clientes que no han subido datos.

**Body** (opcional):
```json
{
  "forceResend": false,
  "specificBusinessIds": ["business1", "business2"]
}
```

**Respuesta Exitosa (200)**:
```json
{
  "message": "Upload reminders sent successfully",
  "remindersSent": 5,
  "businessesNotified": [
    {
      "businessId": "...",
      "businessName": "Restaurante XYZ",
      "ownerEmail": "owner@email.com",
      "daysSinceCreation": 3
    }
  ],
  "businessesSkipped": [
    {
      "businessId": "...",
      "reason": "Reminder sent recently"
    }
  ]
}
```

---

### `DELETE /business/:businessId`
**Descripción**: Elimina un negocio y notifica a todos los involucrados.

**Parámetros de Ruta**:
- `businessId` (string): ID del negocio

**Query Parameters**:
- `reason` (string, opcional): Razón de la eliminación
- `notifyOwner` (boolean, opcional): Notificar al propietario (default: true)
- `notifyManagers` (boolean, opcional): Notificar a managers (default: true)

**Respuesta Exitosa (200)**:
```json
{
  "message": "Business deleted and notifications sent successfully",
  "deletedBusiness": {
    "_id": "...",
    "name": "Restaurante XYZ"
  },
  "notificationsSent": {
    "owner": true,
    "managers": 2,
    "totalEmails": 3
  },
  "filesDeleted": {
    "driveFiles": 5,
    "localFiles": 0
  }
}
```

---

### Rutas de Managers

#### `POST /businesses/:businessId/managers`
**Descripción**: Añade un nuevo manager a un negocio.

**Body**:
```json
{
  "name": "Carlos López",
  "email": "carlos@email.com",
  "role": "manager"
}
```

#### `GET /businesses/:businessId/managers`
**Descripción**: Obtiene lista de managers de un negocio.

#### `DELETE /businesses/:businessId/managers/:managerId`
**Descripción**: Elimina un manager de un negocio.

---

## 💳 Rutas de Pagos (`/api/payments`)

### `POST /generate-payment-link`
**Descripción**: Genera un enlace de pago único usando PagoPlux.

**Body**:
```json
{
  "monto": 150.00,
  "descripcion": "Consultoría empresarial - Enero 2024",
  "nombreCliente": "Juan Pérez",
  "correoCliente": "juan@email.com",
  "telefono": "987654321",
  "prefijo": "593",
  "direccion": "Av. Principal 123, Quito",
  "ci": "1234567890",
  "nombreNegocio": "Restaurante XYZ",
  "extras": "Paquete premium con análisis avanzado"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "message": "Payment link generated successfully",
  "paymentLink": "https://pay.pagoplux.com/pl/abc123...",
  "intentId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 150.00,
  "expiresAt": "2024-01-16T23:59:59Z",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

### `POST /receive-payment`
**Descripción**: Webhook para recibir notificaciones de pagos desde PagoPlux.

**Headers**:
- `X-PagoPlux-Signature`: Firma del webhook

**Body del Webhook**:
```json
{
  "status": "approved",
  "transactionId": "txn_1234567890",
  "intentId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 150.00,
  "paymentMethod": "credit_card",
  "cardInfo": "****1234",
  "cardType": "visa",
  "bank": "Banco Pichincha",
  "date": "2024-01-15T14:30:00Z",
  "customerInfo": {
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "phone": "+593987654321"
  }
}
```

**Respuesta Exitosa (200)**:
```json
{
  "message": "Payment processed successfully",
  "transactionId": "txn_1234567890",
  "status": "completed"
}
```

---

### `GET /transactions`
**Descripción**: Obtiene transacciones con filtros avanzados.

**Query Parameters**:
- `clientId` (string, opcional): ID del cliente
- `startDate` (string, opcional): Fecha inicio (YYYY-MM-DD)
- `endDate` (string, opcional): Fecha fin (YYYY-MM-DD)
- `paymentMethod` (string, opcional): Método de pago
- `minAmount` (number, opcional): Monto mínimo
- `maxAmount` (number, opcional): Monto máximo
- `status` (string, opcional): Estado de la transacción
- `page` (number, opcional): Página (default: 1)
- `limit` (number, opcional): Límite (default: 10)
- `sort` (string, opcional): Campo de ordenamiento
- `order` (string, opcional): 'asc' o 'desc'

**Ejemplo**:
```
GET /api/transactions?startDate=2024-01-01&endDate=2024-01-31&paymentMethod=credit_card&page=1&limit=20
```

**Respuesta Exitosa (200)**:
```json
{
  "transactions": [
    {
      "_id": "...",
      "transactionId": "txn_1234567890",
      "amount": 150.00,
      "paymentMethod": "credit_card",
      "cardInfo": "****1234",
      "date": "2024-01-15T14:30:00Z",
      "description": "Consultoría empresarial",
      "client": {
        "_id": "...",
        "name": "Juan Pérez",
        "email": "juan@email.com"
      }
    }
  ],
  "pagination": {
    "totalTransactions": 50,
    "totalPages": 5,
    "currentPage": 1,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "summary": {
    "totalAmount": 7500.00,
    "averageAmount": 150.00,
    "transactionCount": 50
  }
}
```

---

### `GET /payment-intents`
**Descripción**: Obtiene intenciones de pago con sus estados.

**Query Parameters**:
- `status` (string, opcional): Estado del intent
- `clientEmail` (string, opcional): Email del cliente
- `startDate` (string, opcional): Fecha inicio
- `endDate` (string, opcional): Fecha fin
- `page` (number, opcional): Página
- `limit` (number, opcional): Límite

**Respuesta Exitosa (200)**:
```json
{
  "paymentIntents": [
    {
      "_id": "...",
      "intentId": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 150.00,
      "status": "completed",
      "customerName": "Juan Pérez",
      "customerEmail": "juan@email.com",
      "description": "Consultoría empresarial",
      "paymentLink": "https://pay.pagoplux.com/pl/abc123...",
      "createdAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-15T14:30:00Z"
    }
  ],
  "totalIntents": 25,
  "totalPages": 3,
  "currentPage": 1
}
```

---

### `GET /payments-summary`
**Descripción**: Genera resumen ejecutivo de pagos y transacciones.

**Query Parameters**:
- `period` (string, opcional): 'daily', 'weekly', 'monthly', 'yearly'
- `startDate` (string, opcional): Fecha inicio personalizada
- `endDate` (string, opcional): Fecha fin personalizada
- `groupBy` (string, opcional): 'day', 'week', 'month', 'paymentMethod', 'client'

**Respuesta Exitosa (200)**:
```json
{
  "summary": {
    "totalRevenue": 15000.00,
    "totalTransactions": 100,
    "averageTransaction": 150.00,
    "successRate": 95.5,
    "topPaymentMethod": "credit_card",
    "monthlyGrowth": 12.5,
    "conversionRate": 87.3
  },
  "breakdown": {
    "byPaymentMethod": {
      "credit_card": 12000.00,
      "debit_card": 2500.00,
      "bank_transfer": 500.00
    },
    "byPeriod": [
      {
        "period": "2024-01-01",
        "revenue": 1500.00,
        "transactions": 10
      }
    ],
    "topClients": [
      {
        "clientId": "...",
        "clientName": "Juan Pérez",
        "totalSpent": 450.00,
        "transactionCount": 3
      }
    ]
  },
  "trends": {
    "dailyAverage": 483.87,
    "weeklyGrowth": 8.2,
    "seasonalPattern": "increasing"
  }
}
```

---

### `DELETE /transactions/:transactionId`
**Descripción**: Elimina una transacción específica (solo para administradores).

**Parámetros de Ruta**:
- `transactionId` (string): ID de la transacción

**Query Parameters**:
- `reason` (string, opcional): Razón de la eliminación
- `refund` (boolean, opcional): Si se debe procesar reembolso

**Respuesta Exitosa (200)**:
```json
{
  "message": "Transaction deleted successfully",
  "deletedTransaction": {
    "transactionId": "txn_1234567890",
    "amount": 150.00
  },
  "refundProcessed": true,
  "refundId": "ref_0987654321"
}
```

---

## 🔍 Rutas de Búsqueda (`/api/search`)

### `GET /search/clients`
**Descripción**: Búsqueda avanzada de clientes con múltiples filtros.

**Query Parameters**:
- `q` (string, opcional): Término de búsqueda general (nombre, email)
- `email` (string, opcional): Búsqueda exacta por email
- `phone` (string, opcional): Búsqueda por teléfono
- `country` (string, opcional): Filtro por país
- `city` (string, opcional): Filtro por ciudad
- `hasBusinesses` (boolean, opcional): Clientes con/sin negocios
- `hasTransactions` (boolean, opcional): Clientes con/sin transacciones
- `registeredAfter` (string, opcional): Registrados después de fecha (YYYY-MM-DD)
- `registeredBefore` (string, opcional): Registrados antes de fecha (YYYY-MM-DD)
- `minTransactionAmount` (number, opcional): Monto mínimo de transacciones
- `businessType` (string, opcional): Tipo de negocio del cliente
- `onboardingStep` (string, opcional): Estado del onboarding
- `sort` (string, opcional): Campo de ordenamiento
- `order` (string, opcional): 'asc' o 'desc'
- `page` (number, opcional): Página
- `limit` (number, opcional): Límite

**Ejemplo**:
```
GET /api/search/clients?q=juan&country=Ecuador&hasBusinesses=true&sort=createdAt&order=desc
```

**Respuesta Exitosa (200)**:
```json
{
  "clients": [
    {
      "_id": "...",
      "name": "Juan Pérez",
      "email": "juan@email.com",
      "country": "Ecuador",
      "businessCount": 2,
      "transactionCount": 5,
      "totalSpent": 750.00,
      "lastActivity": "2024-01-15T14:30:00Z",
      "onboardingStatus": "completed"
    }
  ],
  "totalResults": 25,
  "totalPages": 3,
  "currentPage": 1,
  "searchCriteria": {
    "query": "juan",
    "filters": {
      "country": "Ecuador",
      "hasBusinesses": true
    }
  }
}
```

---

### `GET /search/businesses`
**Descripción**: Búsqueda avanzada de negocios.

**Query Parameters**:
- `q` (string, opcional): Término de búsqueda general
- `businessType` (string, opcional): Tipo de negocio
- `onboardingStep` (string, opcional): Estado del onboarding
- `hasManagers` (boolean, opcional): Negocios con/sin managers
- `revenueRange` (string, opcional): Rango de ingresos
- `employeeRange` (string, opcional): Rango de empleados
- `hasDataSubmitted` (boolean, opcional): Datos subidos
- `hasMeetingScheduled` (boolean, opcional): Reunión programada
- `createdAfter` (string, opcional): Creados después de fecha
- `createdBefore` (string, opcional): Creados antes de fecha
- `ownerCountry` (string, opcional): País del propietario
- `sort` (string, opcional): Campo de ordenamiento
- `order` (string, opcional): 'asc' o 'desc'
- `page` (number, opcional): Página
- `limit` (number, opcional): Límite

**Respuesta Exitosa (200)**:
```json
{
  "businesses": [
    {
      "_id": "...",
      "name": "Restaurante XYZ",
      "businessType": "restaurant",
      "onboardingStep": "meeting_scheduled",
      "owner": {
        "name": "Juan Pérez",
        "email": "juan@email.com"
      },
      "managersCount": 2,
      "dataSubmitted": true,
      "meetingScheduled": true,
      "nextMeetingDate": "2024-01-20T10:00:00Z",
      "createdAt": "2024-01-10T00:00:00Z"
    }
  ],
  "totalResults": 15,
  "totalPages": 2,
  "currentPage": 1
}
```

---

## 📅 Rutas de Reuniones (`/api/meetings`)

### Endpoints específicos para gestión de reuniones

**Nota**: Los endpoints de reuniones están distribuidos entre el módulo de clientes y un módulo específico de reuniones. Consultar la documentación de controladores para detalles específicos.

---

## 🔒 Autenticación y Autorización

### Headers Comunes
- `Content-Type: application/json` (para requests con body JSON)
- `Authorization: Bearer <token>` (cuando se implemente autenticación)

### Códigos de Estado HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Datos inválidos o faltantes
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: No autorizado
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto (ej: email duplicado)
- `422 Unprocessable Entity`: Datos válidos pero no procesables
- `500 Internal Server Error`: Error interno del servidor

### Formato de Respuesta de Error

```json
{
  "message": "Descripción del error",
  "error": "Detalles técnicos (solo en desarrollo)",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T14:30:00Z",
  "path": "/api/endpoint"
}
```

---

## 📝 Notas Importantes

1. **Paginación**: Todos los endpoints que retornan listas soportan paginación con `page` y `limit`.

2. **Filtros**: Los filtros son case-insensitive y soportan búsqueda parcial donde sea apropiado.

3. **Fechas**: Todas las fechas están en formato ISO 8601 (UTC).

4. **IDs**: Todos los IDs son ObjectIds de MongoDB en formato string.

5. **Archivos**: Los uploads de archivos usan `multipart/form-data` y tienen límites de tamaño.

6. **Rate Limiting**: Algunos endpoints pueden tener límites de velocidad implementados.

7. **Webhooks**: Los webhooks incluyen verificación de firma para seguridad.

8. **CORS**: La API está configurada para aceptar requests desde dominios específicos.

---

**Última actualización**: Enero 2024  
**Versión de la API**: 1.0.0