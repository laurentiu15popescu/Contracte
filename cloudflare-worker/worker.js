// Proxy CORS pentru ANAF + cursbnr.ro, folosit de versiunea web hostată.
// Deploy: vezi cloudflare-worker/README.md

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Pune aici originea ta web (GitHub Pages) ca să restrângi accesul. "*" = oricine.
const ALLOW_ORIGIN = "*";

function cors(resp) {
  const h = new Headers(resp.headers);
  h.set("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(resp.body, { status: resp.status, headers: h });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    try {
      if (p.startsWith("/anaf/")) {
        const target =
          "https://webservicesp.anaf.ro" + p.replace(/^\/anaf/, "");
        const upstream = await fetch(target, {
          method: request.method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": UA,
          },
          body:
            request.method === "GET" || request.method === "HEAD"
              ? undefined
              : await request.text(),
        });
        return cors(upstream);
      }

      if (p.startsWith("/cursbnr/")) {
        const target =
          "https://www.cursbnr.ro" + p.replace(/^\/cursbnr/, "");
        const upstream = await fetch(target, {
          headers: {
            "User-Agent": UA,
            Accept: "text/html,*/*",
            "Accept-Language": "ro-RO,ro;q=0.9,en;q=0.8",
          },
        });
        return cors(upstream);
      }

      return cors(new Response("Not found", { status: 404 }));
    } catch (err) {
      return cors(new Response("Proxy error: " + err.message, { status: 502 }));
    }
  },
};
