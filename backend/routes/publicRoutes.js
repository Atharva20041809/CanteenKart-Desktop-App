const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

// GET /api/menu - List available items (for customers/mobile)
router.get('/menu', async (req, res) => {
  try {
    const items = await MenuItem.find({ isAvailable: true }).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching menu items', error: err.message });
  }
});

// POST /api/orders - Place an order (server calculates totalAmount)
router.post('/orders', async (req, res) => {
  try {
    const { tableNumber, customerName, items } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ message: 'Table number is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items list cannot be empty' });
    }

    // Verify items and calculate server-side total
    const itemIds = items.map(i => i.menuItemId);
    const dbItems = await MenuItem.find({ _id: { $in: itemIds } });
    const dbItemsMap = new Map();
    dbItems.forEach(i => dbItemsMap.set(i._id.toString(), i));

    let calculatedTotal = 0;
    const verifiedOrderItems = [];

    for (const item of items) {
      if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: 'Invalid item format or non-positive quantity' });
      }

      const dbItem = dbItemsMap.get(item.menuItemId.toString());
      if (!dbItem) {
        return res.status(400).json({ message: `Item with id ${item.menuItemId} does not exist` });
      }
      if (!dbItem.isAvailable) {
        return res.status(400).json({ message: `Item ${dbItem.name} is currently unavailable` });
      }

      const itemTotal = dbItem.price * item.quantity;
      calculatedTotal += itemTotal;

      verifiedOrderItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: item.quantity
      });
    }

    const order = new Order({
      tableNumber: Number(tableNumber),
      customerName: customerName ? customerName.trim() : '',
      items: verifiedOrderItems,
      totalAmount: calculatedTotal,
      status: 'New'
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ message: 'Failed to place order', error: err.message });
  }
});

// GET /api/orders - Orders for a table or list
router.get('/orders', async (req, res) => {
  try {
    const { table } = req.query;
    const query = {};
    if (table) {
      query.tableNumber = Number(table);
    }
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
});

// GET /api/orders/:id - Get a single order
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching order', error: err.message });
  }
});

module.exports = router;
