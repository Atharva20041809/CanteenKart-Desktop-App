const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const authMiddleware = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'demo_jwt_secret_change_me';
    const token = jwt.sign(
      { adminId: admin._id, username: admin.username },
      secret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Protected routes below
router.use(authMiddleware);

// GET /api/admin/orders?status=&date=
router.get('/orders', async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = {};

    if (status && ['New', 'Preparing', 'Ready', 'Served'].includes(status)) {
      filter.status = status;
    }

    if (date) {
      // Expecting YYYY-MM-DD
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      if (!isNaN(startOfDay.getTime())) {
        filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admin orders', error: err.message });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['New', 'Preparing', 'Ready', 'Served'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order status', error: err.message });
  }
});

// GET /api/admin/menu - Get all items including unavailable
router.get('/menu', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch menu items', error: err.message });
  }
});

// POST /api/admin/menu - Create menu item
router.post('/menu', async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, isAvailable } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: 'Name, price and category are required' });
    }

    const validCategories = ['Snacks', 'Meals', 'Drinks', 'Desserts'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    const newItem = new MenuItem({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      category,
      imageUrl: imageUrl ? imageUrl.trim() : '',
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true
    });

    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create menu item', error: err.message });
  }
});

// PUT /api/admin/menu/:id - Update menu item
router.put('/menu/:id', async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, isAvailable } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl.trim();
    if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);
    if (category !== undefined) {
      const validCategories = ['Snacks', 'Meals', 'Drinks', 'Desserts'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          message: `Category must be one of: ${validCategories.join(', ')}`
        });
      }
      updateData.category = category;
    }

    const updated = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update menu item', error: err.message });
  }
});

// DELETE /api/admin/menu/:id - Delete menu item
router.delete('/menu/:id', async (req, res) => {
  try {
    const deleted = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully', item: deleted });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete menu item', error: err.message });
  }
});

// GET /api/admin/stats - Today's order count + total sales + orders per status
router.get('/stats', async (req, res) => {
  try {
    // Current day UTC boundaries
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const todayOrders = await Order.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    const todayOrderCount = todayOrders.length;
    const todayTotalSales = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Orders per status (all time or today - providing counts for both or per status overall for board/chart)
    // Common dashboard requirement: status breakdown
    const allStatuses = ['New', 'Preparing', 'Ready', 'Served'];
    const statusCounts = {
      New: 0,
      Preparing: 0,
      Ready: 0,
      Served: 0
    };

    const statusAggregation = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    statusAggregation.forEach(item => {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    const ordersPerStatus = allStatuses.map(status => ({
      status,
      count: statusCounts[status] || 0
    }));

    res.json({
      todayOrderCount,
      todayTotalSales,
      ordersPerStatus
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admin stats', error: err.message });
  }
});

module.exports = router;
