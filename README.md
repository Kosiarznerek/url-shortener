# URL Shortener

A high-performance URL shortening service built with a modern, scalable NestJS architecture. This service handles creation of new short links, manages unique slug generation (using UUIDs or custom aliases), and efficiently redirects users to the original long URL while tracking visit counts. It features a robust PostgreSQL database backend for reliable data persistence and utilizes TypeORM for seamless entity management.

## 📦 Tech-Stack

* **Language**: Node.js 20 LTS, TypeScript
* **Framework**: NestJS
* **ORM**: TypeOrm
* **Database**: PostgreSQL 15

## 🚀 Getting Started

The repository is configured and ready to use. Follow the steps below to set up and run the development environment.

**Prerequisites:**
* Node.js v20
* Docker

**Steps:**
1.  Start the database container:
    ```bash
    docker compose up -d
    ```
2.  Create an `.env` file based on the provided `.env.example`
3.  Install dependencies and start the application in development mode
    ```bash
    npm ci && npm run start:dev
    ```