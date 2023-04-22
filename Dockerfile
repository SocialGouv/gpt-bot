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

ARG MATTERMOST_URL
ARG OPENAI_API_KEY
ARG MATTERMOST_TOKEN
ARG MATTERMOST_BOT_NAME

ENV MATTERMOST_URL $MATTERMOST_URL
ENV OPENAI_API_KEY $OPENAI_API_KEY
ENV MATTERMOST_TOKEN $MATTERMOST_TOKEN
ENV MATTERMOST_BOT_NAME $MATTERMOST_BOT_NAME

COPY LICENSE .
COPY --from=builder /app/dist .
COPY --from=builder /app/node_modules ./node_modules

CMD [ "node", "./index.js" ]
