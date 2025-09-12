# ======================================================================================
# ETAPA 1: BUILDER - Compila la aplicación
# Esta etapa instala todas las dependencias (incluyendo devDependencies)
# y ejecuta el script de compilación para generar los artefactos de producción.
# ======================================================================================
FROM node:18 AS builder

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Descargar e instalar pnpm
RUN npm install -g pnpm

# Copiar los archivos de definición de dependencias.
# Usamos package*.json para incluir pnpm-lock.yaml y mejorar el cacheo de capas.
COPY package*.json ./

# Optimizar memoria para VPS con recursos limitados
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Instalar todas las dependencias con configuración optimizada para VPS
# El store-dir temporal se limpia solo, no es necesario eliminarlo manualmente.
RUN pnpm install

# Copiar el resto del código fuente de la aplicación
COPY . .

# Compilar la aplicación con configuración optimizada para VPS
RUN pnpm run build

# ======================================================================================
# ETAPA 2: PRODUCTION - Crea la imagen final
# Esta etapa toma una imagen base ligera, instala solo las dependencias
# de producción y copia los archivos compilados de la etapa "builder".
# ======================================================================================
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Descargar e instalar pnpm
RUN npm install -g pnpm

# Copiar los archivos de definición de dependencias
COPY package*.json ./

# Instalar ÚNICAMENTE las dependencias de producción
RUN pnpm install --prod

# Copiar los archivos compilados desde la etapa 'builder'
COPY --from=builder /usr/src/app/dist ./dist

# Copiar las credenciales directamente en la imagen final
COPY src/credentials ./dist/credentials

# Crear la carpeta de uploads que necesita la aplicación
RUN mkdir uploads

# Exponer el puerto en el que la aplicación se ejecutará
EXPOSE 8100

# Comando para iniciar la aplicación en producción
CMD [ "node", "dist/index.js" ]