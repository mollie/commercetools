FROM node:16-alpine

# A directory within the virtualized Docker environment
WORKDIR /app

# Copy all needed files from current directory to working dir in image
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY config ./config

# Expect a variable for port number when running the dockerfile, eg `--build-arg PORT=3050`, but default to 3000
ARG PORT
ENV PORT=${PORT:-3000}

# Install node modules and build assets, remove dev dependencies
RUN npm ci && npm run build && npm prune --production

EXPOSE $PORT
CMD ["npm", "start"]
