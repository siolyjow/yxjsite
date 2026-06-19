const list = document.getElementById("productList");
const form = document.getElementById("productForm");
const settingsForm = document.getElementById("settingsForm");
const editorTitle = document.getElementById("editorTitle");
const statusBox = document.getElementById("status");
const fileInput = document.getElementById("fileInput");

const reloadButton = document.getElementById("reloadButton");
const saveButton = document.getElementById("saveButton");
const saveSettingsButton = document.getElementById("saveSettingsButton");
const exportButton = document.getElementById("exportButton");
const addButton = document.getElementById("addButton");
const moveUpButton = document.getElementById("moveUpButton");
const moveDownButton = document.getElementById("moveDownButton");
const duplicateButton = document.getElementById("duplicateButton");
const deleteButton = document.getElementById("deleteButton");

const previewImage = document.getElementById("previewImage");
const previewTag = document.getElementById("previewTag");
const previewName = document.getElementById("previewName");
const previewDescription = document.getElementById("previewDescription");
const previewPrice = document.getElementById("previewPrice");
const heroPreview = document.getElementById("heroPreview");
const giftPreview = document.getElementById("giftPreview");

let products = [];
let selectedIndex = -1;
let kvReady = false;
let settings = {
  announcementText: "",
  productEyebrow: "",
  productTitle: "ひとつ置くだけで、いつもの部屋が少し特別に。",
  productIntro: "今なら、すべてのご注文に上質なお香をプレゼント。",
  heroImage: "/images/insence113.webp",
  giftImage: "/images/highqualitygift.webp",
  categories: [
    { value: "flower", filterLabel: "花", homeLabel: "香立て", eyebrow: "Incense Holder" },
    { value: "lotus", filterLabel: "蓮", homeLabel: "蓮", eyebrow: "Lotus" },
    { value: "gift", filterLabel: "Gift", homeLabel: "贈り物", eyebrow: "Seasonal Gift" }
  ]
};

function setStatus(message) {
  statusBox.textContent = message;
}

function formatProducts() {
  return `${JSON.stringify(products, null, 2)}\n`;
}

function normalizeProduct(product = {}) {
  return {
    name: product.name || "",
    price: product.price || "",
    tag: product.tag || "",
    category: Array.isArray(product.category) ? product.category : [],
    image: product.image || "",
    url: product.url || "",
    description: product.description || ""
  };
}

function normalizeSettings(nextSettings = {}) {
  return {
    announcementText: nextSettings.announcementText || "",
    productEyebrow: nextSettings.productEyebrow || "",
    productTitle: nextSettings.productTitle || "ひとつ置くだけで、いつもの部屋が少し特別に。",
    productIntro: nextSettings.productIntro || "今なら、すべてのご注文に上質なお香をプレゼント。",
    heroImage: nextSettings.heroImage || "/images/insence113.webp",
    giftImage: nextSettings.giftImage || "/images/highqualitygift.webp",
    categories: normalizeCategories(nextSettings.categories)
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

function formatCategories(categories) {
  return categories
    .map((category) => `${category.value} | ${category.filterLabel} | ${category.homeLabel} | ${category.eyebrow}`)
    .join("\n");
}

function parseCategories(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, filterLabel, homeLabel, eyebrow] = line.split("|").map((part) => part.trim());
      return { value, filterLabel, homeLabel, eyebrow };
    })
    .filter((category) => category.value);
}

function fillSettingsForm() {
  settingsForm.elements.announcementText.value = settings.announcementText;
  settingsForm.elements.productEyebrow.value = settings.productEyebrow;
  settingsForm.elements.productTitle.value = settings.productTitle;
  settingsForm.elements.productIntro.value = settings.productIntro;
  settingsForm.elements.heroImage.value = settings.heroImage;
  settingsForm.elements.giftImage.value = settings.giftImage;
  settingsForm.elements.categories.value = formatCategories(settings.categories);
  renderSettingsPreview();
}

function readSettingsForm() {
  return normalizeSettings({
    announcementText: settingsForm.elements.announcementText.value.trim(),
    productEyebrow: settingsForm.elements.productEyebrow.value.trim(),
    productTitle: settingsForm.elements.productTitle.value.trim(),
    productIntro: settingsForm.elements.productIntro.value.trim(),
    heroImage: settingsForm.elements.heroImage.value.trim(),
    giftImage: settingsForm.elements.giftImage.value.trim(),
    categories: parseCategories(settingsForm.elements.categories.value)
  });
}

function renderSettingsPreview() {
  heroPreview.src = settings.heroImage;
  giftPreview.src = settings.giftImage;
}

function renderList() {
  list.innerHTML = "";

  products.forEach((product, index) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `product-row${index === selectedIndex ? " active" : ""}`;
    row.addEventListener("click", () => selectProduct(index));

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = "";

    const text = document.createElement("div");
    const name = document.createElement("span");
    name.textContent = product.name || "未命名商品";
    const price = document.createElement("small");
    price.textContent = product.price || "未填写价格";
    text.append(name, price);

    row.append(image, text);
    list.appendChild(row);
  });
}

function fillForm(product) {
  const fields = form.elements;
  fields.name.value = product.name;
  fields.price.value = product.price;
  fields.tag.value = product.tag;
  fields.category.value = product.category.join(", ");
  fields.image.value = product.image;
  fields.url.value = product.url;
  fields.description.value = product.description;
}

function renderPreview(product) {
  previewImage.src = product.image;
  previewImage.alt = product.name;
  previewTag.textContent = product.tag || "minne";
  previewName.textContent = product.name || "商品预览";
  previewDescription.textContent = product.description || "编辑左侧字段后，这里会同步显示。";
  previewPrice.textContent = product.price || "-";
}

function selectProduct(index) {
  selectedIndex = index;
  const product = products[selectedIndex] || normalizeProduct();
  editorTitle.textContent = product.name || "未命名商品";
  fillForm(product);
  renderPreview(product);
  renderList();
}

function readFormProduct() {
  const fields = form.elements;
  return normalizeProduct({
    name: fields.name.value.trim(),
    price: fields.price.value.trim(),
    tag: fields.tag.value.trim(),
    category: fields.category.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    image: fields.image.value.trim(),
    url: fields.url.value.trim(),
    description: fields.description.value.trim()
  });
}

function updateSelectedFromForm() {
  if (selectedIndex < 0) return;
  products[selectedIndex] = readFormProduct();
  editorTitle.textContent = products[selectedIndex].name || "未命名商品";
  renderPreview(products[selectedIndex]);
  renderList();
}

function setProducts(nextProducts) {
  products = nextProducts.map(normalizeProduct);
  selectedIndex = products.length ? 0 : -1;
  renderList();
  if (selectedIndex >= 0) {
    selectProduct(selectedIndex);
  }
}

async function loadProducts() {
  try {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    if (response.status === 403) {
      setStatus("未通过 Cloudflare Access 登录，无法管理商品。");
      return;
    }
    if (!response.ok) throw new Error("后台接口暂不可用");
    const data = await response.json();
    kvReady = Boolean(data.kvReady);
    setProducts(data.products || []);
    setStatus(kvReady ? "已载入线上 KV 商品数据" : "已载入静态商品数据；KV 尚未绑定，暂不能保存到线上");
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadSettings() {
  try {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    if (response.status === 403) return;
    if (!response.ok) throw new Error("首页设置接口暂不可用");
    const data = await response.json();
    settings = normalizeSettings(data.settings || {});
    fillSettingsForm();
  } catch (error) {
    setStatus(error.message);
  }
}

async function saveProducts() {
  const response = await fetch("/api/admin/products", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: formatProducts()
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    setStatus(data.error || "保存失败");
    return;
  }

  setProducts(data.products || products);
  setStatus("已保存到线上 KV");
}

async function saveSettings() {
  settings = readSettingsForm();
  const response = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(settings, null, 2)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    setStatus(data.error || "首页设置保存失败");
    return;
  }

  settings = normalizeSettings(data.settings || settings);
  fillSettingsForm();
  setStatus("首页图片设置已保存到线上");
}

function exportProductsFile() {
  const blob = new Blob([formatProducts()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "products.json";
  link.click();
  URL.revokeObjectURL(url);
}

function addProduct() {
  products.unshift(normalizeProduct({
    name: "新商品",
    price: "",
    tag: "New",
    category: ["gift"],
    image: "/images/a001.jpg",
    url: "https://minne.com/items/",
    description: ""
  }));
  selectProduct(0);
  setStatus("已新增商品，记得保存到线上");
}

function moveSelected(direction) {
  const nextIndex = selectedIndex + direction;
  if (selectedIndex < 0 || nextIndex < 0 || nextIndex >= products.length) return;
  const current = products[selectedIndex];
  products[selectedIndex] = products[nextIndex];
  products[nextIndex] = current;
  selectProduct(nextIndex);
}

function duplicateSelected() {
  if (selectedIndex < 0) return;
  const copy = normalizeProduct({
    ...products[selectedIndex],
    name: `${products[selectedIndex].name} copy`
  });
  products.splice(selectedIndex + 1, 0, copy);
  selectProduct(selectedIndex + 1);
  setStatus("已复制商品，记得保存到线上");
}

function deleteSelected() {
  if (selectedIndex < 0) return;
  const deleted = products[selectedIndex].name || "未命名商品";
  products.splice(selectedIndex, 1);
  selectedIndex = Math.min(selectedIndex, products.length - 1);
  renderList();
  if (selectedIndex >= 0) {
    selectProduct(selectedIndex);
  } else {
    form.reset();
    renderPreview(normalizeProduct());
    editorTitle.textContent = "选择一个商品";
  }
  setStatus(`已删除：${deleted}，记得保存到线上`);
}

fileInput.addEventListener("change", async () => {
  const [file] = fileInput.files;
  if (!file) return;
  const data = JSON.parse(await file.text());
  if (!Array.isArray(data)) {
    setStatus("JSON 必须是商品数组");
    return;
  }
  setProducts(data);
  setStatus(`已导入：${file.name}，记得保存到线上`);
});

reloadButton.addEventListener("click", loadProducts);
reloadButton.addEventListener("click", loadSettings);
saveButton.addEventListener("click", () => saveProducts().catch((error) => setStatus(error.message)));
saveSettingsButton.addEventListener("click", () => saveSettings().catch((error) => setStatus(error.message)));
exportButton.addEventListener("click", exportProductsFile);
addButton.addEventListener("click", addProduct);
moveUpButton.addEventListener("click", () => moveSelected(-1));
moveDownButton.addEventListener("click", () => moveSelected(1));
duplicateButton.addEventListener("click", duplicateSelected);
deleteButton.addEventListener("click", deleteSelected);
form.addEventListener("input", updateSelectedFromForm);
settingsForm.addEventListener("input", () => {
  settings = readSettingsForm();
  renderSettingsPreview();
});

loadProducts();
loadSettings();
