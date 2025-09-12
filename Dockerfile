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
ENV NODE_OPTIONS="--max-old-space-size=1024 --max-semi-space-size=64"

# Instalar todas las dependencias con configuración optimizada para VPS
RUN pnpm config set store-dir /tmp/.pnpm-store && \
    pnpm install --frozen-lockfile --prefer-offline && \
    rm -rf /tmp/.pnpm-store

# Copiar el resto del código fuente de la aplicación
COPY . .

# Copiar las credenciales a su futura ruta en /dist
# Se hace antes del build si el build las necesita, o se puede mover para después.
# Asumiendo que el build no las empaqueta, las copiamos directamente.
COPY src/credentials ./dist/credentials

# Compilar la aplicación con configuración optimizada para VPS
RUN NODE_OPTIONS="--max-old-space-size=1024" pnpm run build


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

# Copiar los archivos compilados y las credenciales desde la etapa 'builder'
COPY --from=builder /usr/src/app/dist ./dist

RUN mkdir uploads

# Exponer el puerto en el que la aplicación se ejecutará
EXPOSE 8100

# Comando para iniciar la aplicación en producción
CMD [ "node", "dist/index.js" ]
