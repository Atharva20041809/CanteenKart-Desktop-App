# CanteenKart - Desktop Management Application (.dmg)

CanteenKart is a modern canteen and cafe management system. This repository contains the **Desktop application** built for canteen administrators and kitchen staff to manage live orders, menu items, order history, and daily analytics. The backend API is designed cleanly in Express/Node.js so that future mobile customer apps can seamlessly connect and place orders.

---

## 📁 Folder Structure

```
CanteenKart-Desktop-App/
├── .env.example              # Placeholder environment template
├── .env                      # Local environment configuration (gitignored)
├── .gitignore                # Git ignore patterns (node_modules, dist, .env, etc.)
├── README.md                 # Project documentation & viva guide
├── backend/                  # Node.js + Express API
│   ├── middleware/
│   │   └── auth.js           # JWT Bearer token authentication middleware
│   ├── models/
│   │   ├── Admin.js          # Admin credentials schema (username & passwordHash)
│   │   ├── MenuItem.js       # Menu items schema (name, price, category, etc.)
│   │   └── Order.js          # Orders schema (tableNumber, items, total, status)
│   ├── routes/
│   │   ├── adminRoutes.js    # Protected admin routes (login, orders, menu, stats)
│   │   └── publicRoutes.js   # Public customer endpoints (menu, order placement)
│   ├── scripts/
│   │   └── seed.js           # Idempotent seed script (admin + 12 sample menu items)
│   ├── package.json          # Backend dependencies (express, mongoose, bcrypt, jwt)
│   └── server.js             # Express app setup, DB connection, & server starter
└── desktop/                  # Electron + React 18 + Vite desktop application
    ├── electron/
    │   ├── main.js           # Electron main process (lifecycle, env loader, server host)
    │   └── preload.js        # Secure contextBridge preload script
    ├── src/
    │   ├── components/
    │   │   └── DbErrorScreen.jsx   # Friendly screen when MONGODB_URI is misconfigured
    │   ├── pages/
    │   │   ├── Dashboard.jsx       # Daily sales KPIs & Recharts orders per status chart
    │   │   ├── LiveOrders.jsx      # Real-time 4-column Kanban board (auto-refreshes every 5s)
    │   │   ├── Login.jsx           # Admin login portal
    │   │   ├── MenuManagement.jsx  # Menu items table with Add/Edit/Delete & toggle
    │   │   └── OrderHistory.jsx    # Historical orders audit with status & date filters
    │   ├── services/
    │   │   └── api.js              # Fetch client wrapper with auto-auth headers
    │   ├── App.jsx           # Main navigation shell with responsive sidebar
    │   ├── index.css         # Clean light theme styles (system fonts, rose accent)
    │   └── main.jsx          # React DOM entrypoint
    ├── dist/                 # Generated DMG packages
    │   └── CanteenKart-1.0.0-arm64.dmg
    ├── index.html            # Vite HTML template
    ├── package.json          # Desktop scripts & electron-builder packaging config
    └── vite.config.js        # Vite bundler configuration
```

---

## 🍃 MongoDB Atlas Setup & Environment Configuration

### 1. Creating a Free MongoDB Atlas Cluster
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in or create a free account.
2. Select **Deploy a database** -> Choose the free **M0 (Free)** tier.
3. Under **Database Access**, create a database user:
   - Example Username: `canteenkart_admin`
   - Example Password: Choose a secure password (avoid special characters like `@` or url-encode them).
4. Under **Network Access**, click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** for testing.
5. In your cluster dashboard, click **Connect** -> **Drivers** -> Copy the connection string.
   - It will look like:
     ```
     mongodb+srv://canteenkart_admin:<password>@cluster0.xxxxx.mongodb.net/canteenkart?retryWrites=true&w=majority
     ```

### 2. Environment Variables (.env)
The repository contains `.env.example` with placeholder credentials:
```env
MONGODB_URI=mongodb+srv://demo_user:DEMO_PASSWORD@cluster0.xxxxx.mongodb.net/canteenkart?retryWrites=true&w=majority
JWT_SECRET=demo_jwt_secret_change_me
ADMIN_USERNAME=admin
ADMIN_PASSWORD=demo_admin_password
PORT=5000
```

- Create your local `.env` in the project root:
  ```bash
  cp .env.example .env
  ```
- Replace `demo_user` and `DEMO_PASSWORD` with your real MongoDB Atlas username and password.

---

## 🛠 Installation & Development

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install desktop dependencies
cd ../desktop
npm install
```

### 2. Seed the Database
Run the seed script from the `backend/` directory. It creates the default admin user and inserts 12 rich canteen items across Snacks, Meals, Drinks, and Desserts. It is completely safe to run multiple times without duplicating data:
```bash
cd backend
npm run seed
```
*Default Admin Credentials:*
- **Username:** `admin` (or whatever is defined in `ADMIN_USERNAME`)
- **Password:** `demo_admin_password` (or whatever is defined in `ADMIN_PASSWORD`)

### 3. Running in Development Mode
You can start the backend and frontend together:
```bash
# Terminal 1: Run the backend API
cd backend
npm start

# Terminal 2: Run Desktop Vite + Electron
cd desktop
npm run dev
```

---

## 📦 Packaging & macOS DMG Build

The desktop application is configured with `electron-builder` to bundle the React UI, Electron main/preload scripts, and the Node.js Express backend into a standalone macOS `.dmg` file for Apple Silicon (`arm64`).

### Building the DMG:
```bash
cd desktop
npm run dist:mac
```

### Output File:
The generated DMG installer is located at:
```
desktop/dist/CanteenKart-1.0.0-arm64.dmg
```

### 🍏 macOS Gatekeeper Notice ("App is damaged" or "Unidentified Developer")
Because this app is built locally without a paid Apple Developer ID certificate:
1. Double click `CanteenKart-1.0.0-arm64.dmg` to open it, and drag `CanteenKart` into your `Applications` folder.
2. If macOS displays a warning when opening the app, **Right-click (or Control-click) `CanteenKart.app`** in Applications, then select **Open**, and click **Open** in the confirmation dialog.
3. Alternatively, you can run in your terminal:
   ```bash
   xattr -cr /Applications/CanteenKart.app
   ```

---

## ⚙️ Updating Environment in the Packaged App

When running the packaged `.dmg` application, Electron checks for configuration in two locations:
1. **User Override File:** `~/Library/Application Support/CanteenKart/.env`
2. **Bundled Fallback:** The `.env` bundled with the application inside `extraResources`.

> **Note:**
> - If you change your MongoDB credentials or port, you do **NOT** have to rebuild the entire DMG every time.
> - You can simply create or edit the override file at:
>   `~/Library/Application Support/CanteenKart/.env`
> - If that file does not exist, Electron falls back to the bundled `.env`. If you prefer to bake new credentials into the installer, update the root `.env` and rebuild with `npm run dist:mac`.

---

## 🗣 Architecture & Viva / Code Walkthrough

When explaining this project in a viva or technical interview, here is how the core files are structured:

### Backend (`backend/`)
- **`server.js`**: Initializes Express, registers CORS and JSON parsing, connects to MongoDB via Mongoose with a graceful timeout, and exports `startServer()` so Electron can invoke it directly. Also exposes `/api/health` so the UI can check connectivity status.
- **`models/MenuItem.js`**: Defines the food menu schema (item name, description, price, category enum, image URL, and availability flag).
- **`models/Order.js`**: Schema for customer orders (table number, optional customer name, item array, total amount calculated server-side, and status workflow enum: `New` -> `Preparing` -> `Ready` -> `Served`).
- **`models/Admin.js`**: Schema storing administrator credentials with a bcrypt hashed password.
- **`middleware/auth.js`**: Verifies the JWT bearer token for administrative operations.
- **`routes/publicRoutes.js`**: Public endpoints designed for future customer mobile apps (`GET /api/menu`, `POST /api/orders`, `GET /api/orders/:id`, `GET /api/orders?table=N`). The server verifies prices from the database to prevent client tampering.
- **`routes/adminRoutes.js`**: Protected administrative endpoints for authentication (`/login`), live status progression (`PATCH /orders/:id/status`), menu catalog CRUD, and analytics (`GET /admin/stats`).
- **`scripts/seed.js`**: Automated script using `upsert` and bcrypt hashing to seed sample data without duplicate errors.

### Desktop App (`desktop/`)
- **`electron/main.js`**: The Electron main process. Checks `~/Library/Application Support/CanteenKart/.env` or falls back to bundled `.env`. Spawns the Express backend server on startup, polls `/api/health` until ready, creates the secure browser window, and gracefully stops the server when the application quits.
- **`electron/preload.js`**: Bridge script exposing safe IPC channels (`getServerStatus`, `getEnvPath`) under `contextIsolation: true` without exposing raw Node APIs.
- **`src/App.jsx`**: Top-level shell managing active tabs, user session state, and global error handling. If MongoDB is unreachable, it renders the friendly `DbErrorScreen` instead of crashing.
- **`src/pages/LiveOrders.jsx`**: 4-column live Kanban board (`New`, `Preparing`, `Ready`, `Served`) that auto-refreshes every 5 seconds, displaying table numbers, items, order sums, and action buttons to advance order states.
- **`src/pages/MenuManagement.jsx`**: Table interface to view, add, edit, or delete items, as well as toggle availability for out-of-stock items.
- **`src/pages/OrderHistory.jsx`**: Historical audit log with status and date filters.
- **`src/pages/Dashboard.jsx`**: Executive dashboard displaying today's order count, revenue metrics, and a Recharts bar chart showing status breakdown.
- **`src/components/DbErrorScreen.jsx`**: User-friendly fallback screen showing clear guidance ("Update MONGODB_URI in .env") if the database connection fails.
