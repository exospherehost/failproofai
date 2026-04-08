FROM node:22-slim

WORKDIR /app

RUN npm install -g mintlify

COPY docs/ ./

EXPOSE 3000

CMD ["mintlify", "dev", "--host", "0.0.0.0"]
