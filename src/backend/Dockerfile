# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
# Use a clean install to ensure a consistent dependency tree
RUN npm ci

# Copy the rest of the application's source code
COPY . .

# Transpile TypeScript to JavaScript
RUN npm run build

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Define the command to run the app
CMD [ "node", "dist/index.js" ]
