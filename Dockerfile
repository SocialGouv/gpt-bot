FROM node:18-alpine as builder

WORKDIR /app

COPY src ./src
COPY yarn.lock .
COPY package.json .
COPY tsconfig.json .

RUN yarn --frozen-lockfile
RUN yarn tsc

FROM node:18-alpine as runner

USER node

WORKDIR /app

COPY LICENSE .
COPY --from=builder /app/dist .
COPY --from=builder /app/node_modules ./node_modules

CMD [ "node", "./index.js" ]
