FROM node:20-alpine AS builder

WORKDIR /app

# Set Vietnam timezone
RUN apk add --no-cache tzdata
ENV TZ=Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY package*.json ./
RUN npm install

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

ARG NEXT_PUBLIC_MANAGE_LOGIN_URL
ENV NEXT_PUBLIC_MANAGE_LOGIN_URL=${NEXT_PUBLIC_MANAGE_LOGIN_URL}

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Ho_Chi_Minh

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 4040

CMD ["npm", "start", "--", "-p", "4040"]
