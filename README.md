# 🌾 Mandi+ — AI-Powered Hyper-Local Agri-Commerce Platform

> **Mandi+** is a full-stack agricultural e-commerce platform and conversational procurement engine combining familiar Flipkart-inspired shopping ergonomics with specialized agricultural commerce: bulk tier pricing, APMC mandi rates, bilingual/multilingual natural language procurement, produce grading, direct farmer listings, and real-time order tracking.

---

## 🚀 Quick Start — How to Run the Project

### Prerequisites
- **Node.js**: v18.0.0 or later
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` (Optional: if no local MongoDB service is installed, Mandi+ automatically starts an embedded zero-config in-memory MongoDB engine).

---

### Step 1: Install Dependencies
From the root repository directory (`MandiPlus`):

```powershell
npm run install:all
```

*(Alternatively, run `npm install` inside both `server/` and `client/` directories)*.

---

### Step 2: Seed Sample Agricultural Data (Recommended)
Populates 10 agricultural categories, 5 multi-role accounts, 12 fresh produce listings with bulk tiers, and sample order histories:

```powershell
npm run seed
```

---

### Step 3: Start the Application

You can start both frontend and backend concurrently in a single terminal:

```powershell
npm run dev
```

#### Or run each in separate terminals:

**Terminal 1 (Backend API - Port 5000):**
```powershell
npm run dev:server
# Or: cd server; npm run dev
```

**Terminal 2 (Frontend Client - Port 5173):**
```powershell
npm run dev:client
# Or: cd client; npm run dev
```

Once running, open your browser at:
👉 **http://localhost:5173**

Backend API Health Check:
👉 **http://localhost:5000/api/health**

---

## 👥 Demo Accounts & Credentials

The seed script creates ready-to-test accounts for every platform persona with the default password: `Password123!`

| Role | Email | Password | Access / Features |
| :--- | :--- | :--- | :--- |
| **Retailer / Buyer** | `buyer@mandiplus.com` | `Password123!` | Marketplace, Cart, Bulk Tier Checkout, AI Assistant, Order Tracking |
| **Farmer / Seller** | `farmer@mandiplus.com` | `Password123!` | Farmer Dashboard, Produce Listing, Crop Grading, Order Fulfillment |
| **Delivery Partner**| `delivery@mandiplus.com` | `Password123!` | Delivery Hub, Accept Shipments, Status Updates, Proof of Delivery |
| **Administrator**   | `admin@mandiplus.com` | `Password123!` | Full Admin Console, User Moderation, Dispute Resolution, CSV Exports |

---

## 🏗️ Project Architecture

```
MandiPlus/
├── package.json              # Unified root scripts (dev, build, seed, test)
├── server/                   # Node.js + Express + MongoDB Backend
│   ├── src/
│   │   ├── config/           # Database connection & env variables
│   │   ├── controllers/      # Auth, Products, Cart, Orders, AI, Seller, Delivery, Admin
│   │   ├── middleware/       # JWT auth, role validation, error handling, Multer uploads
│   │   ├── models/           # Mongoose schemas (User, Product, Order, Cart, Review, etc.)
│   │   ├── routes/           # RESTful API route definitions
│   │   ├── seeds/            # High-fidelity agricultural sample data & seed script
│   │   └── services/         # Conversational NLP engine & produce grading logic
│   └── tests/                # Automated API endpoint test suites
└── client/                   # React 18 + Vite + Tailwind CSS Frontend
    ├── src/
    │   ├── components/       # Header, CategoryStrip, ProductCard, Modals, Drawers, ProtectedRoute
    │   ├── context/          # Auth, Cart, Wishlist, Language (EN/HI/MR), Location, Notifications
    │   ├── pages/            # Marketplace, PDP, Cart, Checkout, Tracking, Assistant, Dashboards
    │   └── services/         # Axios API clients
    └── vite.config.js        # Vite build & proxy configuration
```

---

## 🧠 Key Features

1. **Flipkart-Familiar UX with Agricultural Focus**:
   - Distinctive Mandi+ branding (Trust Blue `#2874F0`, Navy `#172337`, Fresh Produce Green `#18864B`, and Soft Canvas `#F1F3F6`).
   - Sticky category strip with agricultural icons (Vegetables, Fruits, Grains, Pulses, Dairy, Spices, Organic).
   - Quantity selector enforcing Minimum Order Quantities (MOQ) and unit types (`kg`, `quintal`, `crate`, `ton`).
2. **AI-Powered Procurement Assistant**:
   - Conversational search in English, Hindi (हिंदी), and Marathi (मराठी).
   - Natural language query extraction for crop types, desired quantity, and price thresholds.
   - Grounded product recommendations directly linked to local supplier inventories.
   - Built-in Web Speech API voice search with fallback visual input.
3. **Computer Vision Produce Grading**:
   - Quality grading (Grade A / B / C) based on color uniformness, surface defect heuristics, and size metrics.
   - Instant recommended wholesale price calculation.
4. **Volume Tier Pricing**:
   - Transparent price tiers per listing (e.g. 50+ kg @ 5% off, 200+ kg @ 12% off, 500+ kg @ 20% off).
5. **Multi-Role Portals**:
   - **Seller Portal**: Manage listings, view sales analytics with Recharts, dispatch shipments.
   - **Delivery Partner Hub**: View active dispatch assignments, update delivery milestones.
   - **Admin Console**: Platform GMV, user management, dispute moderation, and CSV audit reports.

---

## 🧪 Testing & Building

- **Run Automated Backend Tests**:
  ```powershell
  npm run test
  ```
- **Build Client for Production**:
  ```powershell
  npm run build
  ```

---

## 📄 License
ISC © Mandi+ Engineering Team
