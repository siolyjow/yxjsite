const SETTINGS_KEY = "settings";
const FALLBACK_ADMIN_EMAIL = "siolyjow@gmail.com";

export async function onRequestGet(context) {
  const denied = requireAdmin(context.request, context.env);
  if (denied) return denied;

  const settings = await readSettings(context);
  return json({ settings, kvReady: Boolean(context.env.PRODUCTS_KV) });
}

export async function onRequestPut(context) {
  const denied = requireAdmin(context.request, context.env);
  if (denied) return denied;

  if (!context.env.PRODUCTS_KV) {
    return json({ error: "PRODUCTS_KV is not bound yet." }, { status: 503 });
  }

  const settings = normalizeSettings(await context.request.json());
  await context.env.PRODUCTS_KV.put(SETTINGS_KEY, JSON.stringify(settings, null, 2));
  return json({ ok: true, settings });
}

async function readSettings(context) {
  if (context.env.PRODUCTS_KV) {
    const settings = await context.env.PRODUCTS_KV.get(SETTINGS_KEY, "json");
    if (settings && typeof settings === "object" && !Array.isArray(settings)) return settings;
  }

  const fallback = await context.env.ASSETS.fetch(new URL("/data/settings.json", context.request.url));
  return fallback.ok ? fallback.json() : normalizeSettings();
}

function requireAdmin(request, env) {
  const expectedEmail = (env.ADMIN_EMAIL || FALLBACK_ADMIN_EMAIL).toLowerCase();
  const accessEmail = (request.headers.get("Cf-Access-Authenticated-User-Email") || "").toLowerCase();

  if (accessEmail !== expectedEmail) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

function normalizeSettings(settings = {}) {
  return {
    announcementText: String(settings.announcementText || "").trim(),
    heroImage: String(settings.heroImage || "/images/insence113.webp").trim(),
    giftImage: String(settings.giftImage || "/images/highqualitygift.webp").trim(),
    categories: normalizeCategories(settings.categories)
  };
}

function normalizeCategories(categories) {
  const fallback = [
    { value: "flower", filterLabel: "花", homeLabel: "香立て", eyebrow: "Incense Holder" },
    { value: "lotus", filterLabel: "蓮", homeLabel: "蓮", eyebrow: "Lotus" },
    { value: "gift", filterLabel: "Gift", homeLabel: "贈り物", eyebrow: "Seasonal Gift" }
  ];

  if (!Array.isArray(categories) || !categories.length) return fallback;

  return categories
    .map((category) => ({
      value: String(category.value || "").trim(),
      filterLabel: String(category.filterLabel || category.value || "").trim(),
      homeLabel: String(category.homeLabel || category.filterLabel || category.value || "").trim(),
      eyebrow: String(category.eyebrow || category.value || "").trim()
    }))
    .filter((category) => category.value);
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
