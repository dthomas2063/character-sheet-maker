# Character Sheet API

This is a minimal Express + Mongoose API for the Character Sheet Maker.

Requires Node.js 24.

Quick start:

```bash
cd api
npm install
cp .env.example .env
# edit .env to set MONGO_URI if needed
npm run dev
```

Endpoints:
- `GET /` - health
- `GET /example` - example response
- `GET /characters` - list
- `POST /characters` - create
- `GET /characters/:id` - retrieve
- `DELETE /characters/:id` - delete
