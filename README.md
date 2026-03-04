# Geckode (gk-template)

node > v16.0.0 - v21.6.0

A Geckode Project

## Install the dependencies
```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```


### Lint the files
```bash
yarn lint
# or
npm run lint
```


### Format the files
```bash
yarn format
# or
npm run format
```



### Build the app for production
```bash
quasar build
```

## Dashboard (React/Vite)

From the repo root:
```bash
npm run dashboard:install
npm run dashboard:dev
```

Or directly:
```bash
cd apps/dashboard
npm install
npm run dev
```

### Env vars
Copy `apps/dashboard/.env.example` to `apps/dashboard/.env` and set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` (if needed by the dashboard)

### Database extensions
If you need the extra dashboard modules (room control, chat, monetization, etc.),
apply `apps/dashboard/supabase/schema_extensions.sql` after `supabase/schema.sql`.

### Customize the configuration
See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
