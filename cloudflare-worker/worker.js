// Proxy CORS pentru ANAF + cursbnr.ro, folosit de versiunea web hostată.
// Acces protejat: token secret obligatoriu + origin strict.
// Deploy: vezi cloudflare-worker/README.md

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function corsHeaders(origin, allowOrigin) {
  const allow =
    allowOrigin && allowOrigin !== "*" && origin === allowOrigin
      ? allowOrigin
      : allowOrigin === "*"
        ? "*"
        : allowOrigin || "";
  const h = new Headers();
  h.set("Access-Control-Allow-Origin", allow);
  h.set("Vary", "Origin");
  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type,X-Proxy-Token");
  h.set("Access-Control-Max-Age", "86400");
  return h;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    const origin = request.headers.get("Origin") || "";
    const allowOrigin = env.ALLOW_ORIGIN || "*";
    const ch = corsHeaders(origin, allowOrigin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: ch });
    }

    // Token obligatoriu (configurat ca secret în Cloudflare: PROXY_TOKEN)
    const token = request.headers.get("X-Proxy-Token") || "";
    if (!env.PROXY_TOKEN || token !== env.PROXY_TOKEN) {
      return new Response("Unauthorized", { status: 401, headers: ch });
    }

    // Origin strict (dacă ALLOW_ORIGIN e setat și nu e "*")
    if (allowOrigin !== "*" && origin && origin !== allowOrigin) {
      return new Response("Forbidden origin", { status: 403, headers: ch });
    }

    function out(resp) {
      const h = new Headers(resp.headers);
      for (const [k, v] of ch) h.set(k, v);
      return new Response(resp.body, { status: resp.status, headers: h });
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
        return out(upstream);
      }

      if (p.startsWith("/cursbnr/")) {
        const target = "https://www.cursbnr.ro" + p.replace(/^\/cursbnr/, "");
        const upstream = await fetch(target, {
          headers: {
            "User-Agent": UA,
            Accept: "text/html,*/*",
            "Accept-Language": "ro-RO,ro;q=0.9,en;q=0.8",
          },
        });
        return out(upstream);
      }

      return new Response("Not found", { status: 404, headers: ch });
    } catch (err) {
      return new Response("Proxy error: " + err.message, {
        status: 502,
        headers: ch,
      });
    }
  },
};
