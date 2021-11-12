FROM node:16-alpine

# A directory within the virtualized Docker environment
WORKDIR /app

# Copy all needed files from current directory to working dir in image
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY config ./config
COPY typings ./typings

# Install node modules and build assets, remove dev dependencies
RUN npm ci && npm run build && npm prune --production

CMD ["npm", "start"]
