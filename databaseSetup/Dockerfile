# Use the official PostgreSQL image as the base image
FROM postgres:latest

# Environment variables for PostgreSQL
ENV POSTGRES_DB farmiot
ENV POSTGRES_USER postgres
ENV POSTGRES_PASSWORD 123123

# Copy an SQL initialization script to the Docker container
COPY database.sql /docker-entrypoint-initdb.d/

# Expose the PostgreSQL port
EXPOSE 5432
