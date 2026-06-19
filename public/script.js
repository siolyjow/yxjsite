const grid = document.querySelector(".product-grid");
const filters = document.querySelectorAll(".filter");

let activeFilter = "all";
let products = [];

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

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderProducts();
  });
});

loadProducts();
