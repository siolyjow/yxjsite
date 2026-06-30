const PRODUCT_KEY = "products";
const PRODUCT_VERSION_KEY = "products_seed_version";
const FALLBACK_ADMIN_EMAIL = "siolyjow@gmail.com";

export async function onRequestGet(context) {
  const denied = requireAdmin(context.request, context.env);
  if (denied) return denied;

  const products = await readProducts(context);
  return json({ products, kvReady: Boolean(context.env.PRODUCTS_KV) });
}

export async function onRequestPut(context) {
  const denied = requireAdmin(context.request, context.env);
  if (denied) return denied;

  if (!context.env.PRODUCTS_KV) {
    return json({ error: "PRODUCTS_KV is not bound yet." }, { status: 503 });
  }

  const products = await context.request.json();
  if (!Array.isArray(products)) {
    return json({ error: "Products payload must be an array." }, { status: 400 });
  }

  const normalized = products.map(normalizeProduct);
  await context.env.PRODUCTS_KV.put(PRODUCT_KEY, JSON.stringify(normalized, null, 2));
  await markCurrentSeedVersion(context);
  return json({ ok: true, products: normalized });
}

async function readProducts(context) {
  const seeded = await syncSeededProducts(context);
  if (seeded) return seeded;

  if (context.env.PRODUCTS_KV) {
    const products = await context.env.PRODUCTS_KV.get(PRODUCT_KEY, "json");
    if (Array.isArray(products)) return products;
  }

  const fallback = await context.env.ASSETS.fetch(new URL("/data/products.json", context.request.url));
  return fallback.ok ? fallback.json() : [];
}

async function syncSeededProducts(context) {
  if (!context.env.PRODUCTS_KV) return null;

  const seed = await readProductSeed(context);
  if (!seed.version || !seed.products.length) return null;

  const kvVersion = await context.env.PRODUCTS_KV.get(PRODUCT_VERSION_KEY);
  if (kvVersion === seed.version) return null;

  await context.env.PRODUCTS_KV.put(PRODUCT_KEY, JSON.stringify(seed.products, null, 2));
  await context.env.PRODUCTS_KV.put(PRODUCT_VERSION_KEY, seed.version);
  return seed.products;
}

async function markCurrentSeedVersion(context) {
  const seed = await readProductSeed(context);
  if (seed.version) {
    await context.env.PRODUCTS_KV.put(PRODUCT_VERSION_KEY, seed.version);
  }
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

function requireAdmin(request, env) {
  const expectedEmail = (env.ADMIN_EMAIL || FALLBACK_ADMIN_EMAIL).toLowerCase();
  const accessEmail = (request.headers.get("Cf-Access-Authenticated-User-Email") || "").toLowerCase();

  if (accessEmail !== expectedEmail) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

function normalizeProduct(product = {}) {
  return {
    name: String(product.name || "").trim(),
    price: String(product.price || "").trim(),
    tag: String(product.tag || "").trim(),
    category: Array.isArray(product.category)
      ? product.category.map((item) => String(item).trim()).filter(Boolean)
      : [],
    image: String(product.image || "").trim(),
    url: String(product.url || "").trim(),
    description: String(product.description || "").trim()
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
