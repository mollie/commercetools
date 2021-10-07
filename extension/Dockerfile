FROM node:16-alpine

# A directory within the virtualized Docker environment
WORKDIR /app

# Copy all needed files from current directory to working dir in image
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY config ./config

# Install node modules and build assets
RUN npm install && npm run build

# Default port exposure (TODO: use var from config)
EXPOSE 3000
CMD ["npm", "start"]
