FROM node:18

# Instalar dependencias necesarias para sharp
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    gcc \
    libc6-dev

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Descargar pnpm
RUN npm install -g pnpm

# Copiar solo package.json primero
COPY package.json ./

# Instalar dependencias con pnpm
RUN pnpm install

# Copiar el resto del código fuente
COPY . .

# Reconstruir sharp específicamente
RUN pnpm add sharp@latest

# Construir la aplicación
RUN pnpm run build

# Exponer el puerto que utilizará la aplicación
EXPOSE 8000

# Comando para iniciar la aplicación
CMD [ "node", "dist/index.js" ]