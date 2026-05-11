FROM node:20-alpine
LABEL authors="Anna"
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
USER node
EXPOSE 5000
CMD ["node", "server.js"]