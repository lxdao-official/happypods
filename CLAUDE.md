# CLAUDE.md

所有的回复使用中文表达

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HappyPods is a Web3-enabled grants management platform built with the T3 Stack. It facilitates funding applications between Grants Pools (GPs) and Pods (applicants), managing the entire lifecycle from grant applications to milestone-based funding.

## Technology Stack

- **Framework**: Next.js 15.2.3 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma 6.5.0 ORM
- **API**: tRPC 11.0.0 for type-safe APIs
- **Web3**: RainbowKit 2.2.8 + wagmi 2.15.6 + viem for Ethereum integration
- **UI**: HeroUI 2.8.1 + Tailwind CSS 3.4.17
- **State**: TanStack Query 5.69.0 for server state
- **Auth**: JWT with wallet signature verification

## Development Commands

```bash
# Development (runs on port 3016)
pnpm dev

# Build and type checking
pnpm build
pnpm typecheck
pnpm check  # Runs lint + typecheck

# Code quality
pnpm lint
pnpm lint:fix
pnpm format:write

# Database operations
./start-database.sh  # Start PostgreSQL container
pnpm db:generate     # Generate Prisma migrations
pnpm db:push         # Push schema changes
pnpm db:studio       # Open Prisma Studio GUI
```

## Architecture

### File Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/server/api/routers/` - tRPC API endpoints (auth, user, pod, grants-pool)
- `src/components/` - Reusable UI components
- `src/lib/` - Utilities including Web3 config (`wagmi.ts`)
- `prisma/schema.prisma` - Database schema

### Key Business Logic
- **User**: Identified by wallet addresses, JWT authentication
- **GrantsPool**: Funding organizations with multi-sig treasury wallets
- **Pod**: Grant applications with milestone-based funding
- **Milestone**: Phase-based funding releases and deliverable tracking

### Web3 Integration
- Supports Ethereum Mainnet and Sepolia Testnet and Optimistic
- Multi-sig wallet integration for treasury management
- Wallet-first user authentication with signature verification
- Configured in `src/lib/wagmi.ts`

## Code Standards

### TypeScript
- Use `import type { ... }` for type imports
- Use `zod` for runtime validation
- Wrap props with `Readonly<T>`
- Use `~` alias for `src` directory

### tRPC
- Define routers in `src/server/api/routers/`
- Register in `src/server/api/root.ts`
- Use `createTRPCRouter` and proper error handling

### Database
- Use `server-only` package for database operations
- Add indexes for frequently queried fields
- Use Prisma `select`/`include` for optimization

### Components
- Use `'use client'` directive for client components
- Use `React.ReactNode` for children props
- Follow HeroUI component patterns

## Environment Setup

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID

## Testing Notes

No test framework is currently configured. When adding tests, check existing patterns in the codebase and consider the Web3 functionality that may need mocking.