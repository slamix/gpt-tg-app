FROM node:22.17.0-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code (excluding .env files)
COPY . .

# Copy .env file if exists (this will be the last layer to avoid cache issues)
COPY .env* ./ 2>/dev/null || true

# Build the application with debug logs enabled
RUN npm run build

# Install serve globally to serve the built files
RUN npm install -g serve

# Expose port 5173
EXPOSE 5173

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "5173"]
  