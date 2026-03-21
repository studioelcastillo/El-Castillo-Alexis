FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN npm ci

COPY . .

RUN npm run build --workspace @studiocore/api

WORKDIR /app/apps/api

EXPOSE 4102

CMD ["node", "dist/main.js"]
