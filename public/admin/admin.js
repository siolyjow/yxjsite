const list = document.getElementById("productList");
const form = document.getElementById("productForm");
const editorTitle = document.getElementById("editorTitle");
const statusBox = document.getElementById("status");
const fileInput = document.getElementById("fileInput");

const reloadButton = document.getElementById("reloadButton");
const saveButton = document.getElementById("saveButton");
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

let products = [];
let selectedIndex = -1;
let kvReady = false;

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
saveButton.addEventListener("click", () => saveProducts().catch((error) => setStatus(error.message)));
exportButton.addEventListener("click", exportProductsFile);
addButton.addEventListener("click", addProduct);
moveUpButton.addEventListener("click", () => moveSelected(-1));
moveDownButton.addEventListener("click", () => moveSelected(1));
duplicateButton.addEventListener("click", duplicateSelected);
deleteButton.addEventListener("click", deleteSelected);
form.addEventListener("input", updateSelectedFromForm);

loadProducts();
