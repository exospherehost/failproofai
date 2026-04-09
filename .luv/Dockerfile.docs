FROM node:22-slim

RUN npm install -g mintlify

WORKDIR /app/docs
EXPOSE 3000

CMD ["mintlify", "dev", "--host", "0.0.0.0"]
