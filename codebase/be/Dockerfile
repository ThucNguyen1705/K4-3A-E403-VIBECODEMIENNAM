FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY src ./src
COPY db ./db
EXPOSE 4000
CMD ["node", "src/server.js"]
