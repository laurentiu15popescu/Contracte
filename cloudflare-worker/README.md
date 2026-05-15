# Cloudflare Worker — proxy ANAF + BNR (web)

Necesar doar pentru versiunea web hostată (GitHub Pages). Desktop și `npm run dev` NU au nevoie.

## Deploy (gratis, fără card)

1. Cont gratuit pe https://dash.cloudflare.com
2. Instalează wrangler și loghează-te:
   ```
   npm i -g wrangler
   wrangler login
   ```
3. Din folderul acesta:
   ```
   cd cloudflare-worker
   wrangler deploy
   ```
4. Primești o adresă de forma:
   `https://contracte-proxy.<subdomeniu>.workers.dev`

## Conectare la web

Adaugă în GitHub un secret nou:

- **Name:** `VITE_PROXY_BASE`
- **Value:** adresa workerului (ex. `https://contracte-proxy.xxx.workers.dev`)

Apoi în `.github/workflows/web.yml` env-ul îl injectează la build (vezi workflow).

## Securitate (opțional, recomandat)

În `worker.js` schimbă `ALLOW_ORIGIN = "*"` cu originea ta exactă
(ex. `https://laurentiu15popescu.github.io`).
