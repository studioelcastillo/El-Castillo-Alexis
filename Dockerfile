FROM node:21.6.0-alpine

WORKDIR /app

COPY package*.json ./

EXPOSE 8080