FROM node:22-alpine3.19 AS builder

WORKDIR /app
COPY . .

RUN npm i -g @vercel/ncc
RUN npm i -g @angular/cli@latest

RUN npm run build
#RUN ncc build index.js -o dist


FROM node:22-alpine3.19

RUN apk add --no-cache ffmpeg

WORKDIR /app
#COPY --from=builder /app/dist .
COPY --from=builder /app/public ./public
COPY --from=builder /app/services ./services
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/index.js ./index.js
COPY --from=builder /app/package.json ./package.json
CMD ["node", "."]
