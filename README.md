# Marketplace

Webapp tipo MercadoLibre con soporte de negocios (tiendas multi-vendedor).
El diseño completo está en [docs/DISENO.md](docs/DISENO.md).

## Estructura

```
apps/
  api/        API REST — NestJS + Prisma + PostgreSQL (puerto 3001)
  web/        Frontend — Next.js 16 + Tailwind (puerto 3000)
packages/
  shared/     Tipos compartidos entre API y frontend
docs/         Documento de diseño
```

## Requisitos

- Node.js ≥ 22 y pnpm (`npm i -g pnpm`)
- PostgreSQL 17+: instalación nativa, Docker (`docker compose up -d`) **o** una base en [Neon](https://neon.tech)

> Nota: en esta máquina hay un PostgreSQL 18 preexistente en el puerto 5432;
> la instancia 17 del proyecto corre en el **5433** (ya configurado en `.env`).

## Primer arranque

```bash
pnpm install

# 1. Configurar entorno
cp apps/api/.env.example apps/api/.env        # ajustar DATABASE_URL si no usás Docker
cp apps/web/.env.example apps/web/.env.local

# 2. Base de datos
docker compose up -d
pnpm db:migrate          # crea las tablas (prisma migrate dev)

# 3. Compilar el paquete compartido (una vez, o tras cambiarlo)
pnpm --filter @marketplace/shared build

# 4. Levantar todo
pnpm dev                 # api en :3001, web en :3000
```

Abrí http://localhost:3000 — la home muestra el estado de frontend, API y DB.

## Scripts útiles

| Comando | Qué hace |
|---------|----------|
| `pnpm dev` | API + web en paralelo |
| `pnpm build` | Build de todos los paquetes (orden topológico) |
| `pnpm lint` / `pnpm test` | Lint / tests en todos los paquetes |
| `pnpm db:migrate` | Migraciones de Prisma (dev) |
| `pnpm db:studio` | UI para inspeccionar la base |
