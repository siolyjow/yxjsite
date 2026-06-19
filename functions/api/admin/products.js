const PRODUCT_KEY = "products";
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
  return json({ ok: true, products: normalized });
}

async function readProducts(context) {
  if (context.env.PRODUCTS_KV) {
    const products = await context.env.PRODUCTS_KV.get(PRODUCT_KEY, "json");
    if (Array.isArray(products)) return products;
  }

  const fallback = await context.env.ASSETS.fetch(new URL("/data/products.json", context.request.url));
  return fallback.ok ? fallback.json() : [];
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
