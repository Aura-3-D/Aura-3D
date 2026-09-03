# aura-3d

Live 3D companions: chat, voice, image gen, Aura-coin shop.

## Run

```bash
npm install
cp .env.example .env.local
# fill the keys you have, then:
npm run dev
```

## Environment

Server-only (never `VITE_`-prefix these):

| Variable | Purpose |
|---|---|
| `SHOPIER_API_KEY` | Shopier merchant key |
| `SHOPIER_API_SECRET` | HMAC for `/api/shopier-callback` |
| `SHOPIER_WEBSITE_INDEX` | Shopier website index (usually `1`) |
| `OPENROUTER_API_KEY` | Free chat models |
| `XAI_API_KEY` | Grok chat fallback + TTS |
| `DATABASE_URL` | Postgres (optional; local preview uses PGLite) |

Shopier callback URL: `https://<your-host>/api/shopier-callback`

Until Shopier keys are set, the shop stays in trial mode (coins add instantly).

## Push to GitHub

```bash
cd aura-3d
git init
git add .
git commit -m "aura-3d"
gh repo create aura-3d --private --source=. --push
```

Or create an empty repo on github.com, then:

```bash
git remote add origin git@github.com:<you>/aura-3d.git
git branch -M main
git push -u origin main
```

Do not commit `.env.local`.
