SuccessVan Docker deployment files

Place Dockerfile, docker-compose.yaml, and .dockerignore inside:
  successvan-intgration/succesvan-main/

Create .env.production in the same directory from your existing working
environment values. Never commit .env.production or SVH.pem.

Build and run:
  docker compose build
  docker compose up -d
  docker compose ps
  docker compose logs --tail=200 app

The app is bound to 127.0.0.1:3000 and is intended to sit behind Nginx.
