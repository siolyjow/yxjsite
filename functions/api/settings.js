const SETTINGS_KEY = "settings";

export async function onRequestGet(context) {
  const { env } = context;

  if (env.PRODUCTS_KV) {
    const settings = await env.PRODUCTS_KV.get(SETTINGS_KEY, "json");
    if (settings && typeof settings === "object" && !Array.isArray(settings)) {
      return json(settings);
    }
  }

  const fallback = await env.ASSETS.fetch(new URL("/data/settings.json", context.request.url));
  return new Response(fallback.body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}
