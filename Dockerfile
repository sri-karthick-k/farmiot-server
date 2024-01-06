FROM node:14.18.1

WORKDIR /app

ARG CACHEBUST
RUN echo $CACHEBUST

# Clone the repository and install dependencies
RUN git clone https://github.com/sri-karthick-k/farmiot-server.git . && \
    npm install

ENV PG_USER postgres
ENV PG_DB farmiot
ENV PG_PORT 5432
ENV PG_PASSWORD 123123
ENV PG_HOST farm-db-service
ENV AUTH_KEY 123

# Expose the port
EXPOSE 4001

# Run the application
CMD ["node", "index.js"]
