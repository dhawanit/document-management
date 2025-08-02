# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Build the application
RUN npm run start:dev

# Expose backend port
EXPOSE 3000

# Run the app
CMD ["npm", "run", "start:prod"]