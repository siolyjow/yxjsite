// About us 弹窗
function openAbout() {
  document.getElementById('aboutModal').style.display = 'block';
}
function closeAbout() {
  document.getElementById('aboutModal').style.display = 'none';
}

// 購入案内 弹窗
function openPurchase() {
  document.getElementById('purchaseModal').style.display = 'block';
}
function closePurchase() {
  document.getElementById('purchaseModal').style.display = 'none';
}

// 点击弹窗外部关闭
window.onclick = function(event) {
  const aboutModal = document.getElementById('aboutModal');
  const purchaseModal = document.getElementById('purchaseModal');
  if (event.target === aboutModal) aboutModal.style.display = 'none';
  if (event.target === purchaseModal) purchaseModal.style.display = 'none';
};
