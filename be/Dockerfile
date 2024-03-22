# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory in the container to /app
WORKDIR /src

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm ci

# Bundle the app source inside the Docker image
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 8080

# Define the command to run the app
CMD [ "node", "index.js" ]