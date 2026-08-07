# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Chat backend

The chat panel always connects to the Lighthouse backend. Start it from the
backend project before starting the frontend:

```bash
cd ../lighthouse_back
uvicorn src.main:app --reload --workers 1
```

The frontend uses `http://localhost:8000` for chat by default. Set these
optional public runtime variables before running `npm run dev` when your
backend uses a different address or requires an API key:

```bash
NUXT_PUBLIC_API_BASE_URL=http://localhost:8000
NUXT_PUBLIC_API_KEY=your-api-key
npm run dev
```

`NUXT_PUBLIC_API_KEY` is sent as the `x-api-key` header only when configured.
Project and playground services retain their existing mock behavior; only chat
is forced to use the backend.

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
