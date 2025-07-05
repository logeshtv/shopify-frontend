FROM node:20-alpine

WORKDIR /app

COPY package.json .
COPY .env.production ./
RUN npm install

RUN npm i -g serve

COPY . .

RUN npm run build

EXPOSE 8080

CMD [ "serve", "-s", "dist" ]