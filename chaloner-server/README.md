# Chaloner Backend (Next.js API)

Backend service for job listing, job detail, application submit, and RSS endpoints.

## Requirements

- Node.js 20+
- pnpm
- Loxo bearer token in environment

## Environment

Create `.env.local`:

```bash
BEARER_AUTH=your_loxo_bearer_token
```

## Run locally

```bash
pnpm install
pnpm dev
```

Server runs at `http://localhost:3000`.

## Useful scripts

```bash
pnpm lint
pnpm build
pnpm start
```
