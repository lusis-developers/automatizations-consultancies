# 🔐 Guía de Seguridad - Sistema de Automatizaciones Bakano

## ⚠️ Archivos Sensibles y Credenciales

### Credenciales de Google Drive

**Archivo**: `src/credentials/bakano-mvp-generate-content-4618d04c0dde.json`

**⚠️ CRÍTICO**: Este archivo contiene credenciales de Google Service Account y **NO DEBE** estar en el repositorio.

**Para obtener este archivo**:
- 📧 **Contactar**: dreyes@bakano.ec
- 📝 **Solicitar**: Archivo de credenciales de Google Drive para el proyecto
- 📍 **Ubicación**: Debe colocarse en `src/credentials/bakano-mvp-generate-content-4618d04c0dde.json`

**Detalles del Service Account**:
- **Proyecto**: bakano-mvp-generate-content
- **Email**: god-service-account@bakano-mvp-generate-content.iam.gserviceaccount.com
- **Tipo**: Service Account con acceso completo a Google Drive
- **Folder ID**: 1IXfjJgXD-uWOKPxwKOXiJl_dhp3uBkOL

### Variables de Entorno Sensibles

Las siguientes variables contienen información sensible y deben configurarse correctamente:

```env
# PagoPlux - Credenciales de pago
CLIENT_TOKEN=tu_token_base64_pagoplux
PAGOPLUX_ENDPOINT=https://api.pagoplux.com/intv1/integrations/createLinkFacturaResource

# Resend - API Key para emails
RESEND_KEY=re_tu_api_key_resend
FROM_EMAIL=noreply@bakano.ec

# Google Drive - Ruta a credenciales
GOOGLE_DRIVE_CREDENTIALS_PATH=./src/credentials/bakano-mvp-generate-content-4618d04c0dde.json
GOOGLE_DRIVE_FOLDER_ID=1IXfjJgXD-uWOKPxwKOXiJl_dhp3uBkOL

# MongoDB - Conexión a base de datos
MONGO_URI=mongodb://localhost:27017/bakano-automatizations
```

## 🚫 Archivos que NO deben estar en el repositorio

### 1. Credenciales de Google
```
src/credentials/
├── bakano-mvp-generate-content-4618d04c0dde.json ❌ NO INCLUIR
├── *.json ❌ NO INCLUIR
└── service-account-*.json ❌ NO INCLUIR
```

### 2. Archivos de configuración local
```
.env ❌ NO INCLUIR
.env.local ❌ NO INCLUIR
.env.production ❌ NO INCLUIR
```

### 3. Archivos de uploads
```
uploads/ ❌ NO INCLUIR
*.pdf ❌ NO INCLUIR
*.doc ❌ NO INCLUIR
*.xlsx ❌ NO INCLUIR
```

### 4. Logs y archivos temporales
```
logs/ ❌ NO INCLUIR
*.log ❌ NO INCLUIR
node_modules/ ❌ NO INCLUIR
dist/ ❌ NO INCLUIR
```

## ✅ Configuración de .gitignore

Asegúrate de que tu `.gitignore` incluya:

```gitignore
# Credenciales y configuración
.env
.env.*
src/credentials/
*.json
!package.json
!tsconfig.json

# Uploads y archivos temporales
uploads/
*.pdf
*.doc
*.docx
*.xlsx
*.zip

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Dependencias
node_modules/

# Build
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

## 🔑 Gestión de Credenciales

### Para Desarrolladores Nuevos

1. **Clonar el repositorio**:
   ```bash
   git clone <repository-url>
   cd automatizations-server
   ```

2. **Solicitar credenciales**:
   - 📧 Enviar email a **dreyes@bakano.ec**
   - 📝 Asunto: "Solicitud de credenciales - Sistema Automatizaciones"
   - 📋 Incluir: Nombre, rol, y propósito del acceso

3. **Configurar credenciales**:
   ```bash
   # Crear directorio de credenciales
   mkdir -p src/credentials
   
   # Colocar archivo recibido
   # src/credentials/bakano-mvp-generate-content-4618d04c0dde.json
   
   # Configurar variables de entorno
   cp .env.example .env
   # Editar .env con las credenciales proporcionadas
   ```

### Para Administradores

**Rotación de Credenciales**:
- Google Service Account: Cada 90 días
- PagoPlux Token: Según política de PagoPlux
- Resend API Key: Cada 180 días
- MongoDB: Según política de seguridad

**Backup de Credenciales**:
- Almacenar en gestor de contraseñas corporativo
- Documentar fecha de creación y expiración
- Mantener versiones anteriores por 30 días

## 🛡️ Mejores Prácticas de Seguridad

### 1. Manejo de Credenciales

```typescript
// ✅ CORRECTO - Usar variables de entorno
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error('RESEND_API_KEY is required');
}

// ❌ INCORRECTO - Hardcodear credenciales
const apiKey = 're_abc123def456'; // NUNCA HACER ESTO
```

### 2. Validación de Archivos

```typescript
// ✅ CORRECTO - Verificar existencia de credenciales
const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;
if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  throw new Error('Google Drive credentials file not found');
}

// ✅ CORRECTO - Validar contenido
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
if (!credentials.private_key || !credentials.client_email) {
  throw new Error('Invalid Google Drive credentials format');
}
```

### 3. Logging Seguro

```typescript
// ✅ CORRECTO - No loguear información sensible
console.log('Payment processed successfully', {
  transactionId: transaction.id,
  amount: transaction.amount,
  // NO incluir: token, private_key, etc.
});

// ❌ INCORRECTO - Loguear credenciales
console.log('API Response:', {
  token: 'abc123', // NUNCA HACER ESTO
  response: data
});
```

### 4. Manejo de Errores

```typescript
// ✅ CORRECTO - Errores sin información sensible
try {
  await pagoPluxService.createPayment(data);
} catch (error) {
  console.error('Payment creation failed:', {
    message: error.message,
    timestamp: new Date().toISOString()
    // NO incluir: credenciales, tokens, etc.
  });
  
  res.status(500).send({
    message: 'Payment processing failed'
    // NO exponer detalles internos
  });
}
```

## 🚨 Procedimiento de Incidentes de Seguridad

### Si se comprometen credenciales:

1. **Inmediato** (0-15 minutos):
   - Revocar credenciales comprometidas
   - Notificar a dreyes@bakano.ec
   - Documentar el incidente

2. **Corto plazo** (15-60 minutos):
   - Generar nuevas credenciales
   - Actualizar sistemas afectados
   - Verificar logs de acceso

3. **Seguimiento** (1-24 horas):
   - Análisis de impacto
   - Actualización de procedimientos
   - Comunicación a stakeholders

### Contactos de Emergencia:

- **Administrador Principal**: dreyes@bakano.ec
- **Equipo de Desarrollo**: [team@bakano.ec]
- **Soporte Técnico**: [support@bakano.ec]

## 📋 Checklist de Seguridad

### Para cada Deploy:

- [ ] Verificar que no hay credenciales en el código
- [ ] Confirmar que .gitignore está actualizado
- [ ] Validar variables de entorno en producción
- [ ] Verificar permisos de archivos
- [ ] Confirmar que logs no contienen información sensible

### Para cada nuevo desarrollador:

- [ ] Solicitar credenciales a dreyes@bakano.ec
- [ ] Configurar .env correctamente
- [ ] Verificar acceso a servicios externos
- [ ] Revisar esta guía de seguridad
- [ ] Confirmar que .gitignore funciona correctamente

### Revisión mensual:

- [ ] Auditar accesos a servicios externos
- [ ] Verificar rotación de credenciales
- [ ] Revisar logs de seguridad
- [ ] Actualizar documentación si es necesario
- [ ] Verificar backups de credenciales

---

**⚠️ RECORDATORIO IMPORTANTE**: 

Este documento contiene información sensible sobre la seguridad del sistema. Debe ser tratado como confidencial y solo compartido con personal autorizado.

**Última actualización**: Enero 2024  
**Próxima revisión**: Abril 2024  
**Responsable**: dreyes@bakano.ec