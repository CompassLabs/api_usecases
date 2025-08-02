https://api-usecases.vercel.app/

This is a demo on how Compass API can be used within a wallet application.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You need to set an enironment variable
```bash
NEXT_PUBLIC_COMPASS_API_KEY=<API key here>
```

## Compass API

See the full code with fee payment at [./src/lib/supplyApi.ts](./src/lib/supplyApi.ts).

Note that we use the Compass API capability for batching transactions.
