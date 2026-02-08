function renderCarGrid() {
  const carGrid = document.getElementById('car-grid');
  if (!carGrid) {
    return;
  }
  carGrid.innerHTML = '';
  for (let car of carListing) {
    const carOptionEl = document.createElement('div');
    const { id, brand, imagePath, model, price } = car;
    const qty = carQty[id.toString().padStart(2, '0')];
    carOptionEl.innerHTML = `
      <img src="${imagePath}" alt="${brand} ${model}">
      <h3>${brand} ${model}</h3>
      <p>SGD ${price} per day</p>
      <a class="btn-primary" href="/checkout.html?carid=${id}">Select!</a>`;
    carOptionEl.setAttribute('data-qty', qty.toString());
    carGrid?.appendChild(carOptionEl);
  }
}

localStorageInitPromise.then(() => renderCarGrid());
