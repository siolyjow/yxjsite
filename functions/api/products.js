const PRODUCT_KEY = "products";

export async function onRequestGet(context) {
  const { env } = context;

  if (env.PRODUCTS_KV) {
    const products = await env.PRODUCTS_KV.get(PRODUCT_KEY, "json");
    if (Array.isArray(products)) {
      return json(products);
    }
  }

  const fallback = await env.ASSETS.fetch(new URL("/data/products.json", context.request.url));
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
