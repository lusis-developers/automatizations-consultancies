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

# Instalar dependencias
RUN pnpm install

# Copiar el resto del código fuente
COPY . .

# Reconstruir sharp
RUN pnpm add sharp@latest

# Copiar credenciales a la ruta esperada por el código compilado
COPY src/credentials ./dist/credentials

# Aumentar memoria disponible para la compilación
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Compilar
RUN pnpm run build

# Exponer puerto
EXPOSE 8000

# Comando para iniciar app
CMD [ "node", "dist/index.js" ]
