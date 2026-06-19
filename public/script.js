const grid = document.querySelector(".product-grid");
const filtersContainer = document.querySelector(".filter-group");
const categoryLinks = document.getElementById("categoryLinks");
const announcement = document.getElementById("announcement");
const productEyebrow = document.getElementById("productEyebrow");
const productTitle = document.getElementById("productTitle");
const productIntro = document.getElementById("productIntro");

let activeFilter = "all";
let products = [];
let categories = [
  { value: "flower", filterLabel: "花", homeLabel: "香立て", eyebrow: "Incense Holder" },
  { value: "lotus", filterLabel: "蓮", homeLabel: "蓮", eyebrow: "Lotus" },
  { value: "gift", filterLabel: "Gift", homeLabel: "贈り物", eyebrow: "Seasonal Gift" }
];

async function loadSettings() {
  try {
    const response = await fetch("/api/settings", { cache: "no-store" });
    if (!response.ok) throw new Error("API settings were not found.");
    applySettings(await response.json());
  } catch {
    const response = await fetch("/data/settings.json", { cache: "no-store" });
    if (response.ok) applySettings(await response.json());
  }
}

function applySettings(settings = {}) {
  if (announcement) {
    const text = (settings.announcementText || "").trim();
    announcement.textContent = text;
    announcement.classList.toggle("has-text", Boolean(text));
    announcement.setAttribute("aria-hidden", text ? "false" : "true");
  }

  if (productEyebrow) {
    const text = (settings.productEyebrow || "").trim();
    productEyebrow.textContent = text;
    productEyebrow.hidden = !text;
  }

  if (productTitle && settings.productTitle) {
    productTitle.textContent = settings.productTitle;
  }

  if (productIntro && settings.productIntro) {
    productIntro.textContent = settings.productIntro;
  }

  if (settings.heroImage) {
    document.documentElement.style.setProperty("--hero-image", `url("${settings.heroImage}")`);
  }

  const giftImage = document.getElementById("giftImage");
  if (giftImage && settings.giftImage) {
    giftImage.src = settings.giftImage;
  }

  if (Array.isArray(settings.categories) && settings.categories.length) {
    categories = settings.categories.map(normalizeCategory).filter((category) => category.value);
  }

  renderCategoryControls();
}

function normalizeCategory(category = {}) {
  return {
    value: String(category.value || "").trim(),
    filterLabel: String(category.filterLabel || category.value || "").trim(),
    homeLabel: String(category.homeLabel || category.filterLabel || category.value || "").trim(),
    eyebrow: String(category.eyebrow || category.value || "").trim()
  };
}

function renderCategoryControls() {
  filtersContainer.innerHTML = "";
  const allButton = document.createElement("button");
  allButton.className = `filter${activeFilter === "all" ? " active" : ""}`;
  allButton.type = "button";
  allButton.dataset.filter = "all";
  allButton.textContent = "All";
  filtersContainer.appendChild(allButton);

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = `filter${activeFilter === category.value ? " active" : ""}`;
    button.type = "button";
    button.dataset.filter = category.value;
    button.textContent = category.filterLabel;
    filtersContainer.appendChild(button);
  });

  categoryLinks.innerHTML = "";
  categories.slice(0, 3).forEach((category) => {
    const link = document.createElement("a");
    link.href = "#products";
    link.dataset.filter = category.value;
    link.innerHTML = `<span>${category.eyebrow}</span>${category.homeLabel}`;
    categoryLinks.appendChild(link);
  });
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products", { cache: "no-store" });
    if (!response.ok) throw new Error("API product data was not found.");
    const data = await response.json();
    products = Array.isArray(data) ? data : [];
  } catch {
    const response = await fetch("/data/products.json", { cache: "no-store" });
    products = response.ok ? await response.json() : [];
  }

  renderProducts();
}

function renderProducts() {
  grid.innerHTML = "";

  const visibleProducts = products.filter((product) => {
    return activeFilter === "all" || (product.category || []).includes(activeFilter);
  });

  if (!visibleProducts.length) {
    grid.innerHTML = '<div class="empty-state">現在表示できる作品がありません。</div>';
    return;
  }

  visibleProducts.forEach((product) => {
    const card = document.createElement("a");
    card.className = "product-card";
    card.href = product.url;
    card.target = "_blank";
    card.rel = "noopener";
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
        <span class="badge">${product.tag || "minne"}</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description || "minneの商品ページで詳細をご確認ください。"}</p>
        <div class="price-row">
          <span>${product.price}</span>
          <span>minneへ</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

filtersContainer.addEventListener("click", (event) => {
  const button = event.target.closest(".filter");
  if (!button) return;
  activeFilter = button.dataset.filter;
  renderCategoryControls();
  renderProducts();
});

categoryLinks.addEventListener("click", (event) => {
  const link = event.target.closest("[data-filter]");
  if (!link) return;
  activeFilter = link.dataset.filter;
  renderCategoryControls();
  renderProducts();
});

renderCategoryControls();
loadSettings();
loadProducts();
