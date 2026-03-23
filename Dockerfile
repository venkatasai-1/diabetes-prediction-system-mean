# 1. Build Stage for Angular Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build -- --output-path=dist/frontend/browser

# 2. Final Output Stage (Full Container with Node and Python)
FROM node:20-alpine
WORKDIR /app

# Install Python and dependencies for ML model
RUN apk add --no-cache python3 py3-pip py3-numpy py3-pandas py3-scikit-learn || \
    (apk add --no-cache python3 py3-pip && \
     python3 -m venv /opt/venv && \
     /opt/venv/bin/pip install --upgrade pip && \
     /opt/venv/bin/pip install numpy pandas scikit-learn pickle-mixin)

# Path to our Python virtual environment (if used)
ENV PATH="/opt/venv/bin:$PATH"

# Copy Backend and ML Model folders
COPY backend ./backend
COPY ml-model ./ml-model

# Install Backend Dependencies
WORKDIR /app/backend
RUN npm install

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/dist/frontend/browser /app/frontend/dist/frontend/browser

# Final Configuration
WORKDIR /app/backend
EXPOSE 5001
ENV PORT=5001
ENV NODE_ENV=production

# Start the Node.js server
CMD ["node", "server.js"]
