// Reset the pizza builder
function resetPizzaBuilder() {
  const productSelect = document.getElementById('product');
  const customizationSelect = document.getElementById('customization');
  const quantityInput = document.getElementById('quantity');

  if (productSelect) {
    productSelect.selectedIndex = 0;
  }

  if (customizationSelect) {
    customizationSelect.selectedIndex = 0;
  }

  if (quantityInput) {
    quantityInput.value = 1;
  }
}

// Declare the updateCartSize function
function updateCartSize(cartSize) {
  document.getElementById('cartsize').textContent = cartSize;
}

// Function to remove the table from the DOM
function removeTable() {
  const table = document.getElementById('tableCart');
  if (table) {
    table.remove();
    console.log('Table removed on the client side');
  }
}

/* eslint-disable */
// eslint-disable-next-line no-unused-vars
// Add normal pizza
function addToCart(event) {
  console.log('Button clicked!');
  const clickedButton = event.target;
  const productId = clickedButton.getAttribute('data-productid');
  const quantityInput = document.querySelector(
    `.quantityInput[data-productid="${productId}"]`
  );
  const quantity = parseInt(quantityInput.value, 10);

  console.log('Product ID:', productId);
  console.log('Quantity:', quantity);

  axios.post(`/add-to-cart/${productId}`, { quantity }).then((response) => {
    console.log('Response:', response.data);
    // Update the cart size displayed
    updateCartSize(response.data.cartSize);
    // Reset the pizza builder
    resetPizzaBuilder();
  });
}

// eslint-disable-next-line no-unused-vars
// Add custom pizza
function addToCartBtn(event) {
  console.log('Button clicked!');

  const pizzaId = document.getElementById('customPizzaNameSelect').value;
  const customizationId = document.getElementById('customizationsSelect').value;
  const quantityInput = document.getElementById('quantityIn');
  const quantity = parseInt(quantityInput.value, 10);

  console.log('pizza: ', pizzaId);
  console.log('custom: ', customizationId);
  console.log('quantity: ', quantity);

  axios
    .post(`/addToCart/${pizzaId}/${customizationId}`, { quantity })
    .then((response) => {
      console.log('Response:', response.data);

      // Update the cart size displayed
      updateCartSize(response.data.cartSize);

      // Reset the pizza builder
      resetPizzaBuilder();
    });
}

// Delete the whole cart
function deleteCartBtn(event) {
  const cartTable = document.querySelector('.table');
  axios
    .post('/delete-cart')
    .then((response) => {
      console.log(response.data.message);

      // Update the cart size displayed to 0
      document.getElementById('cartsize').textContent = 0;

      // Remove all items from the UI immediately
      document.querySelectorAll('.cartItem').forEach((item) => item.remove());

      // Hide the table when the cart is empty
      if (cartTable) {
        cartTable.style.display = 'none';
      }
    })
    .catch((error) => {
      console.error('Error deleting cart:', error);
    });
}

// Delete based on the index
function deleteCartButton(event) {
  console.log('Button clicked!');
  const clickedButton = event.target;

  const index = clickedButton.getAttribute('data-index');
  const rowIndex = parseInt(index, 10);
  console.log('Deleting item at index:', rowIndex);

  axios
    .post(`/delete-cart-item/${rowIndex}`)
    .then((response) => {
      console.log('Item deleted successfully:', response.data);

      // Update the cart size displayed
      updateCartSize(response.data.cartSize);

      const table = document.querySelector('.table');

      if (rowIndex >= 0) {
        table.deleteRow(rowIndex + 1);
      } else {
        console.error('Invalid index:', rowIndex);
      }
    })
    .catch((error) => {
      console.error('Error deleting item:', error);
    });
}

// Update the quantity
function updateCartItem(event) {
  console.log('Button clicked!');
  const clickedButton = event.target;

  const index = clickedButton.getAttribute('data-index');
  const rowIndex = parseInt(index, 10);
  console.log('Updating item at index:', rowIndex);

  const quantityInput = document.querySelector(
    `.quantityInput[data-index="${index}"]`
  );
  const newQuantity = parseInt(quantityInput.value, 10);
  console.log('New Quantity: ', newQuantity);

  axios
    .post(`/update-cart-item/${rowIndex}`, { quantity: newQuantity })
    .then((response) => {
      console.log('Item updated successfully:', response.data);

      // Update the cart size displayed
      updateCartSize(response.data.cartSize);
    })
    .catch((error) => {
      console.error('Error updating item:', error);
    });
}

//Submit
function submitOrderBtn(event) {
  axios
    .post('/submit-order')
    .then((response) => {
      console.log('Order submitted successfully:', response.data);

      // Update the cart size displayed
      updateCartSize(0);
      removeTable();
    })
    .catch((error) => {
      console.error('Error submitting order:', error);
    });
}
