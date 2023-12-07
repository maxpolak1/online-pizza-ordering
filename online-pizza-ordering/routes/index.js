const express = require('express');
const db = require('../db');

const router = express.Router();

/* GET home page. */
router.get('/', async (req, res) => {
  if (req.session.user) {
    // Fetch products from the database
    const productsQuery = await db.query('SELECT * FROM products');
    const products = productsQuery.rows;

    // Fetch customizations from the "customizations" table
    const customizationsQuery = await db.query(
      'SELECT id AS customId, name FROM customizations'
    );
    const customizations = customizationsQuery.rows;

    res.render('index', {
      user: req.session.user,
      products,
      customizations,
    });
  } else {
    res.render('landingpage', { title: 'Landing Page' });
  }
});

/* Go to the login in the users */
router.get('/login', (req, res) => {
  res.redirect('users/login');
});

// Route for creating a new topping
router.get('/topping/create', (req, res) => {
  res.render('topping-create');
});

// go to the menu
router.get('/index', (req, res) => {
  res.redirect('users/login');
});

// Handling the creation of a new topping
router.post('/topping/create', async (req, res) => {
  const { name, category } = req.body;
  try {
    const query =
      'INSERT INTO customizations (name, category) VALUES ($1, $2) RETURNING *';
    const values = [name, category];
    const result = await db.query(query, values);
    console.log('New topping added:', result.rows[0]);
    res.redirect('/index'); // Redirect back to product list
  } catch (error) {
    console.error('Error adding publisher:', error);
    res.status(500).send('Error adding publisher to the database');
  }
});

/* Add pizza */
// Route to handle adding a product to the cart
router.post('/add-to-cart/:productId', async (req, res) => {
  console.log(req.session.cart);
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    console.log('product id: ', productId);
    console.log('quantity: ', quantity);
    console.log('Adding product to cart. Product ID:', productId);

    // Assuming you have a session cart stored as an array
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if the product is a regular pizza or a custom pizza
    const isCustomPizza = 'false';

    // Check if the product is already in the cart
    const existingProductIndex = req.session.cart.findIndex(
      (item) => item.productId === productId
    );

    if (existingProductIndex !== -1) {
      // Increment quantity if the product is already in the cart
      req.session.cart[existingProductIndex].quantity += quantity;
    } else {
      // Add the product to the cart with the specified quantity
      req.session.cart.push({
        productId,
        quantity,
        isCustomPizza,
      });
    }

    // Calculate and send back the updated cart size
    const cartSize = req.session.cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
    console.log('cart size: ', cartSize);

    res.json({ cartSize });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/products', async (req, res) => {
  const productsQuery = await db.query(
    `SELECT id AS productId, name, description, category FROM products`
  );
  const products = productsQuery.rows;
  res.json(products);
});

// Cart Summary
/* eslint-disable */
router.get('/cart-summary', async (req, res) => {
  try {
    if (req.session.user) {
      const { cart } = req.session;

      // Calculate cart count
      const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

      // Fetch details of items in the cart from the database
      const cartDetails = await Promise.all(
        cart.map(async (cartItem) => {
          console.log(cartItem);
          if (cartItem.isCustomPizza == true) {
            // If it's a custom pizza, fetch details from the database
            console.log(cartItem.productId);
            const productQuery = await db.query(
              'SELECT * FROM products WHERE id = $1',
              [cartItem.pizzaId]
            );
            const product = productQuery.rows[0];

            const customQuery = await db.query(
              'SELECT * FROM customizations WHERE id = $1',
              [cartItem.customizationId]
            );
            const custom = customQuery.rows[0];

            if (product) {
              return {
                productName: product,
                quantity: cartItem.quantity,
                customizations: custom,
                isCustomPizza: true,
              };
            }
          } else {
            // If it's a regular product, use existing logic
            console.log(cartItem.productId);
            const productQuery = await db.query(
              'SELECT * FROM products WHERE id = $1',
              [cartItem.productId]
            );
            const product = productQuery.rows[0];

            if (product) {
              return {
                productName: product,
                quantity: cartItem.quantity,
                isCustomPizza: false,
              };
            }
          }
        })
      );

      console.log(cartDetails);
      res.render('cart-summary', {
        user: req.session.user,
        cart: cartDetails,
        cartCount, // Include cart count in the rendering context
      });
    } else {
      res.render('landingpage', { title: 'Landing Page' });
    }
  } catch (error) {
    console.error('Error fetching cart details:', error);
    res.status(500).send('Error fetching cart details');
  }
});
/* eslint-disable */

// Add this route to fetch customizations from the database
router.get('/customizations', async (req, res) => {
  try {
    const customizationsQuery = await db.query(
      'SELECT id AS customizationId, name FROM customizations'
    );
    const customizations = customizationsQuery.rows;

    res.json({ customizations });
  } catch (error) {
    console.error('Error fetching customizations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to handle adding a custom pizza to the cart
router.post('/addToCart/:pizzaId/:customizationId', async (req, res) => {
  try {
    console.log('it goes to add to cart/custom successfully.');

    const { pizzaId, customizationId } = req.params;
    const { quantity } = req.body;

    console.log('pizza: ', pizzaId);
    console.log('custom: ', customizationId);
    console.log('quantity: ', quantity);

    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if the product is already in the cart
    const existingProductIndex = req.session.cart.findIndex(
      (item) =>
        (item.pizzaId === pizzaId) & (item.customizationId === customizationId)
    );

    if (existingProductIndex !== -1) {
      // Increment quantity if the product is already in the cart
      req.session.cart[existingProductIndex].quantity += quantity;
    } else {
      // Add the product to the cart with the specified quantity
      req.session.cart.push({
        pizzaId,
        customizationId,
        quantity,
        isCustomPizza: true,
      });
    }

    const cartSize = req.session.cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
    console.log('cart size: ', cartSize);

    res.json({ cartSize });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to handle deleting the entire cart
router.post('/delete-cart', (req, res) => {
  console.log('go to delete cart successfully.');

  try {
    // Clear the session cart
    req.session.cart = [];

    // Send back a success response
    res.json({ message: 'Cart deleted successfully' });
  } catch (error) {
    console.error('Error deleting cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to handle deleting a specific item from the cart based on index
router.post('/delete-cart-item/:index', (req, res) => {
  try {
    const { index } = req.params;

    // Check if the index is valid
    if (index >= 0) {
      // Use splice to remove the item at the specified index
      req.session.cart.splice(index, 1);

      // Calculate and send back the updated cart size
      const cartSize = req.session.cart.reduce(
        (total, item) => total + item.quantity,
        0
      );

      res.json({ cartSize });
    } else {
      res.status(400).json({ error: 'Invalid index' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to update quantity of an item in the cart based on index
router.post('/update-cart-item/:index', (req, res) => {
  try {
    const { index } = req.params;
    console.log('index: ', index);

    const { quantity } = req.body; // Update this line
    console.log('new quantity: ', quantity);

    // Ensure quantity is a positive integer
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity value' });
    }

    // Assuming cart is an array of items in the session
    const cart = req.session.cart;

    // Ensure index is within the valid range
    if (index < 0 || index >= cart.length) {
      return res.status(404).json({ error: 'Item not found in the cart' });
    }

    // Update the quantity of the item in the cart
    cart[index].quantity = parsedQuantity;

    // Calculate and send back the updated cart size
    const updatedCartSize = cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
    console.log('new cart size: ', updatedCartSize);

    res.json({ cartSize: updatedCartSize });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//submit
// Route to submit the shopping cart and create order records
router.post('/submit-order', async (req, res) => {
  try {
    console.log('user: ', req.session.user);
    const customer_id = req.session.user.id;
    const cart = req.session.cart;
    console.log('customer id: ', customer_id);

    // Create an order record
    const orderResult = await db.query(
      'INSERT INTO orders (customer_id, created_at) VALUES ($1, NOW()) RETURNING id',
      [customer_id]
    );
    const orderId = orderResult.rows[0].id;
    console.log('order id: ', orderId);

    // Iterate through cart items and create order line records
    for (const cartItem of cart) {
      if (cartItem.isCustomPizza == true) {
        const { pizzaId, customizationId, quantity } = cartItem;

        // Create order line record
        console.log('order id for custom: ', orderId);
        const orderLineResult = await db.query(
          'INSERT INTO order_lines (order_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING id',
          [orderId, pizzaId, quantity]
        );
        const orderLineId = orderLineResult.rows[0].id;
        console.log('order line id for custom: ', orderLineId);

        await db.query(
          'INSERT INTO order_line_customizations (order_line_id, customization_id) VALUES ($1, $2)',
          [orderLineId, customizationId]
        );
      } else {
        const { productId, quantity } = cartItem;

        // Create order line record
        await db.query(
          'INSERT INTO order_lines (order_id, product_id, quantity) VALUES ($1, $2, $3)',
          [orderId, productId, quantity]
        );
        console.log('order id for normal: ', orderId);
      }
    }

    // Reset the shopping cart in the session
    req.session.cart = [];

    res.status(201).json({ message: 'Order submitted successfully' });
  } catch (error) {
    console.error('Error submitting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
