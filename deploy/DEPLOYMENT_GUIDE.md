# Deployment Guide (Docker + Nginx + HTTPS)

This guide packages the backend, frontend, and PostgreSQL into Docker containers and uses Nginx to terminate HTTPS.
Docker images include Java, Node, and Postgres runtimes, so you do not need to install them on the host.

## 1) Prerequisites on the Server
- Docker Engine
- Docker Compose plugin
- SSL certificate and key files

If you do not have certificates yet, obtain them from your provider (or use Lets Encrypt).
Place them on the server at:
- deploy/certs/fullchain.pem
- deploy/certs/privkey.pem

Dummy paths (placeholders until you add real certs):
- deploy/certs/fullchain.pem
- deploy/certs/privkey.pem

Example dummy commands (Linux):
```
mkdir -p deploy/certs
cp /path/to/your/fullchain.pem deploy/certs/fullchain.pem
cp /path/to/your/privkey.pem deploy/certs/privkey.pem
```

Example dummy commands (Windows PowerShell):
```
New-Item -ItemType Directory -Force deploy\certs
Copy-Item C:\path\to\your\fullchain.pem deploy\certs\fullchain.pem
Copy-Item C:\path\to\your\privkey.pem deploy\certs\privkey.pem
```

## 2) Copy Project to the Server
Copy the full project folder to the server (for example using SCP, SFTP, or rsync).
This deployment is platform-independent: the Docker images run the same on Windows and Linux.

## 3) Configure Environment
Create a .env file in the project root by copying .env.example.

Update these values:
- POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
- APP_FRONTEND_BASE_URL (your public HTTPS domain)
- SPRING_MAIL_USERNAME, SPRING_MAIL_PASSWORD
- APP_MAIL_FROM and APP_MAIL_CC

Files you may need to edit:
- .env (required)
- deploy/nginx/nginx.conf (optional: set server_name to your domain)
- deploy/certs/fullchain.pem and deploy/certs/privkey.pem (required for HTTPS)

## 4) Start the Stack
From the project root:

```
docker compose --env-file .env up -d --build
```

Containers will be created:
- db (PostgreSQL)
- backend (Spring Boot)
- nginx (serves frontend and proxies /api to backend)

## 5) Verify
Check status:

```
docker compose ps
```

Check logs if needed:

```
docker compose logs -f backend
```

## 6) Notes
- Database data persists in the docker volume named db-data.
- Uploaded PDFs are stored on the host in uploads/trades and mounted into the backend container.
- Nginx terminates HTTPS and proxies /api to the backend container.
- The frontend is built into the Nginx image, so it is served at the root path.

## 7) Full Deployment Steps (Copy/Paste)
1) Copy the project folder to the server.
2) Add certificates:
	- deploy/certs/fullchain.pem
	- deploy/certs/privkey.pem
3) Create the environment file:
```
cp .env.example .env
```
Windows PowerShell alternative:
```
Copy-Item .env.example .env
```
4) Edit .env and set:
	- POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
	- APP_FRONTEND_BASE_URL=https://your-domain.example
	- SPRING_MAIL_USERNAME, SPRING_MAIL_PASSWORD
	- APP_MAIL_FROM, APP_MAIL_CC
5) (Optional) Edit deploy/nginx/nginx.conf and change:
	- server_name _; -> server_name your-domain.example;
6) Build and start:
```
docker compose --env-file .env up -d --build
```
7) Dry run (validate compose config without starting containers):
```
docker compose --env-file .env config
```
8) Verify:
```
docker compose ps
docker compose logs -f nginx
```

## 8) Updating the Deployment
Pull new code and rebuild:

```
docker compose --env-file .env up -d --build
```

## 9) Optional: Host-Level Install Alternative
If you prefer installing Java, Node, and PostgreSQL directly on the host, use standard package manager instructions for your OS.
This project is designed to run without host-level installs when using Docker.
