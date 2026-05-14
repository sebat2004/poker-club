# Poker Club at OSU

A web platform for the Oregon State University Poker Club.

The site gives club members a central place to learn about the club, manage their member profile, and launch shared GTO Wizard study rooms backed by [Neko](https://neko.m1k1o.net/) and [neko-rooms](https://github.com/m1k1o/neko-rooms).

The public app lives in `website/`. The Neko browser-room infrastructure lives in `infra/`, with helper scripts in `scripts/`.

---

## Features

- Public member profiles with avatar upload, bio, major/year, and optional favorite hand display
- GTO Wizard room dashboard for paid members
- Automatic EC2 startup and shutdown flow for room creation
- CRON cleanup job for shutting down idle rooms and EC2 instance
- Terraform-managed AWS infrastructure

---

## Tech Stack

### Web App

- [Next.js](https://nextjs.org/) App Router
- React
- TypeScript
- Tailwind CSS
- Better Auth
- TanStack Query

### Data and Storage

- Postgres through `pg`
- SQL migrations in `website/db/migrations`
- Vercel Blob for profile avatar uploads

### Browser Rooms

- [Neko](https://neko.m1k1o.net/)
- [neko-rooms](https://github.com/m1k1o/neko-rooms)
- Docker
- Docker Compose
- Caddy reverse proxy

### Infrastructure

- AWS EC2
- EBS data volume for persistent Neko browser profiles
- Elastic IP
- Security Groups
- IAM role / OIDC support for Vercel
- Terraform

---

## Repo Layout

```text
.
├── website/              # Next.js app
│   ├── app/              # App Router pages, API routes, and components
│   ├── db/               # Postgres helper and migrations
│   └── scripts/          # Database migration runner
├── infra/                # Terraform and EC2 user-data template
├── scripts/              # Deployment/environment helper scripts
└── neko-rooms-club/      # Local Neko Rooms compose setup
```

---

## Helpful Commands

Run the website:

```bash
cd website
npm run dev
```

Run migrations:

```bash
cd website
npm run db:migrate
```

Sync Vercel environment variables from a local env file:

```bash
./scripts/sync-vercel-env.sh production .env.local
```

Redeploy Neko compose files to the EC2 host:

```bash
./scripts/deploy-neko-compose.sh
```
