# Cloudflare Worker — proxy ANAF + BNR (web protejat)

Necesar doar pentru versiunea web. Desktop și `npm run dev` NU au nevoie.

Securitate: worker-ul cere un token secret (`PROXY_TOKEN`) + origin strict
(`ALLOW_ORIGIN`). Web-ul e în plus protejat de Cloudflare Access (doar
email-ul autorizat intră în aplicație).

## 1. Deploy worker

```
cd cloudflare-worker
$env:CLOUDFLARE_API_TOKEN = "token-cu-permisiune-workers"
wrangler deploy
```

## 2. Setează secret-ul PROXY_TOKEN pe worker

Generează un token aleator lung (ex. în PowerShell):

```
[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
```

Pune-l ca secret pe worker:

```
wrangler secret put PROXY_TOKEN
# lipești valoarea când îți cere
```

## 3. Setează originea permisă (după ce știi domeniul Cloudflare Pages)

În dashboard Cloudflare → Workers & Pages → contracte-proxy → Settings →
Variables → adaugă variabilă (text simplu, nu secret):

- `ALLOW_ORIGIN` = `https://contracte-web.pages.dev` (domeniul tău Pages)

## 4. GitHub Secrets necesare

| Secret | Valoare |
| --- | --- |
| `VITE_PROXY_BASE` | adresa worker, ex. `https://contracte-proxy.xxx.workers.dev` |
| `VITE_PROXY_TOKEN` | aceeași valoare ca `PROXY_TOKEN` de la pasul 2 |
| `CLOUDFLARE_API_TOKEN` | token cu permisiune Pages + Workers |
| `CLOUDFLARE_ACCOUNT_ID` | din dashboard Cloudflare (dreapta jos pe orice pagină) |
| cele 7 `VITE_FIREBASE_*` | din `.env.local` |

## 5. Cloudflare Access (poarta pe email)

Zero Trust → Access → Applications → Add → Self-hosted:

- Application domain: domeniul Pages (`contracte-web.pages.dev`)
- Policy: Allow, Include → Emails → adresa autorizată

Doar acel email primește cod pe mail și intră. Restul = respinși la poartă.
