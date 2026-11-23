const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const MenuItem = require('../models/MenuItem');
const Admin = require('../models/Admin');

const sampleMenuItems = [
  {
    name: 'Veggie Samosa (2 pcs)',
    description: 'Crispy pastry filled with spiced potatoes and green peas, served with mint chutney.',
    price: 40,
    category: 'Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  },
  {
    name: 'Paneer Tikka Roll',
    description: 'Grilled marinated cottage cheese cubes rolled in a whole wheat wrap with tangy sauces.',
    price: 90,
    category: 'Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  },
  {
    name: 'French Fries',
    description: 'Crispy golden potato fries seasoned with sea salt.',
    price: 60,
    category: 'Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  },
  {
    name: 'Veg Burger',
    description: 'Crispy veggie patty with lettuce, tomatoes, and mayo in a toasted sesame bun.',
    price: 80,
    category: 'Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  },
  {
    name: 'Chole Bhature',
    description: 'Spicy chickpea curry paired with two fluffy deep-fried leavened sourdough bhaturas.',
    price: 120,
    category: 'Meals',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  },
  {
    name: 'Veg Thali Special',
    description: 'Complete meal with 2 rotis, paneer gravy, dal tadka, jeera rice, salad and papad.',
    price: 150,
    category: 'Meals',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  },
  {
    name: 'Paneer Butter Masala Meal',
    description: 'Rich cottage cheese gravy served with basmati steamed rice and garlic naan.',
    price: 140,
    category: 'Meals',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  },
  {
    name: 'Masala Chai',
    description: 'Traditional spiced Indian black tea brewed with whole milk and aromatic spices.',
    price: 20,
    category: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  },
  {
    name: 'Cold Coffee with Ice Cream',
    description: 'Chilled blended milk coffee topped with a creamy scoop of vanilla ice cream.',
    price: 70,
    category: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  },
  {
    name: 'Fresh Mango Lassi',
    description: 'Smooth yogurt-based sweet drink made with sweet Alphonso mango pulp.',
    price: 60,
    category: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  },
  {
    name: 'Hot Gulab Jamun (2 pcs)',
    description: 'Soft fried dough balls soaked in cardamom flavored sugar syrup.',
    price: 50,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1589119908995-c6837fa14d48?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  },
  {
    name: 'Chocolate Brownie with Fudge',
    description: 'Warm double chocolate brownie drizzled with rich chocolate sauce.',
    price: 80,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60',
    isAvailable: true
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://demo_user:DEMO_PASSWORD@cluster0.xxxxx.mongodb.net/canteenkart?retryWrites=true&w=majority';
  console.log('[Seed] Connecting to MongoDB...');
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed] Connected to database');

    // 1. Seed Admin user (Safe to run twice: update or create)
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'demo_admin_password';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await Admin.findOne({ username: adminUsername });
    if (existingAdmin) {
      existingAdmin.passwordHash = passwordHash;
      await existingAdmin.save();
      console.log(`[Seed] Admin user "${adminUsername}" updated.`);
    } else {
      await Admin.create({ username: adminUsername, passwordHash });
      console.log(`[Seed] Admin user "${adminUsername}" created.`);
    }

    // 2. Seed Menu Items (Safe to run twice: upsert by name)
    console.log(`[Seed] Seeding ${sampleMenuItems.length} menu items...`);
    for (const item of sampleMenuItems) {
      await MenuItem.findOneAndUpdate(
        { name: item.name },
        { $set: item },
        { upsert: true, new: true }
      );
    }
    console.log('[Seed] All sample menu items successfully seeded without duplicates.');

    await mongoose.disconnect();
    console.log('[Seed] Database disconnected. Done!');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, sampleMenuItems };
