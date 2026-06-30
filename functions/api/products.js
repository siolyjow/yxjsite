const PRODUCT_KEY = "products";
const PRODUCT_VERSION_KEY = "products_seed_version";

export async function onRequestGet(context) {
  const { env } = context;
  const seed = await readProductSeed(context);

  if (env.PRODUCTS_KV) {
    if (seed.version && seed.products.length) {
      const kvVersion = await env.PRODUCTS_KV.get(PRODUCT_VERSION_KEY);
      if (kvVersion !== seed.version) {
        await env.PRODUCTS_KV.put(PRODUCT_KEY, JSON.stringify(seed.products, null, 2));
        await env.PRODUCTS_KV.put(PRODUCT_VERSION_KEY, seed.version);
        return json(seed.products);
      }
    }

    const products = await env.PRODUCTS_KV.get(PRODUCT_KEY, "json");
    if (Array.isArray(products)) {
      return json(products);
    }
  }

  return json(seed.products);
}

async function readProductSeed(context) {
  const productsResponse = await context.env.ASSETS.fetch(new URL("/data/products.json", context.request.url));
  const products = productsResponse.ok ? await productsResponse.json() : [];
  const versionResponse = await context.env.ASSETS.fetch(new URL("/data/products-version.json", context.request.url));
  const versionData = versionResponse.ok ? await versionResponse.json().catch(() => ({})) : {};

  return {
    products: Array.isArray(products) ? products : [],
    version: String(versionData.version || "").trim()
  };
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
