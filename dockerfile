# stage 1: build
FROM node:19.7.0-bullseye-slim as build
WORKDIR /app
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install
RUN npm run build

# stage 2: run
FROM node:19.7.0-bullseye-slim
WORKDIR /app
COPY package.json ./
RUN npm install --only=production
COPY --from=build /app/dist .
RUN mkdir /app/src
EXPOSE 9001
CMD ["node", "server.js"]
