# HappyPods

HappyPods is a Web3-enabled grants management platform that helps Grants Pools (GPs) co-manage applications from Pods (builders) with milestone-based payouts. The project is incubated by [LXDAO](https://lxdao.io/), an R&D-focused DAO that backs public-good tooling for the Web3 ecosystem.

## Feature Highlights

- Grant lifecycle: submission, review, milestone approval, payout/refund tracking.
- Wallet-first auth with RainbowKit + wagmi; tailored for Ethereum mainnet/Sepolia.
- Real-time Safe (Gnosis) treasury insights and warnings for insufficient balances.
- Prisma-backed API layer through tRPC for type-safe server/client contracts.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19.
- **Language/Tooling**: TypeScript, Tailwind CSS, HeroUI.
- **Database**: PostgreSQL with Prisma ORM.
- **Web3**: RainbowKit, wagmi, viem, Safe SDKs.
- **State/API**: tRPC 11 + TanStack Query 5.

## Getting Started

### Requirements

1. Node.js 20+, pnpm 9+.
2. Docker/Podman for local PostgreSQL or access to a managed instance.
3. WalletConnect Project ID (free at [cloud.walletconnect.com](https://cloud.walletconnect.com/)).

### Environment

Create `.env` (or `.env.local`) with:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/happy_pods"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id"
```

### Install & Run

```bash
pnpm install
./start-database.sh        # optional helper for local Postgres
pnpm db:migrate            # apply dev migrations
pnpm dev                   # http://localhost:3016
```

### Database Operations

- `pnpm db:gen` / `pnpm db:migrate` – develop new migrations.
- `pnpm db:dev` – deploy migrations on staging/production DB.
- `pnpm db:prod` – production-safe alias for `prisma migrate deploy`.
- `pnpm db:push` – sync schema without migrations (use cautiously).
- `pnpm db:studio` – open Prisma Studio for inspection.

### Production Deploy

```bash
pnpm deploy:prod  # run migrations, build, and start Next.js
```

## Testing Checklist

- Navigate major flows (GP list, Pod detail, milestone submission).
- Connect wallet on supported chains and simulate Safe treasury actions.
- Monitor logs for Prisma connection health after deployments.

## About LXDAO

LXDAO researches and builds public-good infrastructure for Web3. Learn more or get involved at [lxdao.io](https://lxdao.io/) and follow the latest initiatives at [twitter.com/LXDAO_Official](https://x.com/LXDAO_Official).
