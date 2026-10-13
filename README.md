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

### Step 2: Provision Admin Account & Sample Data

#### Option A: Provision Dedicated Initial Administrator (Production & Review)
Provisions an authorized administrator account securely from environment variables (`ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`):

```powershell
npm run seed:admin
```
*(Default: `admin@mandiplus.com` / `Password123!`)*

#### Option B: Populate Sample Agricultural Data & Demo Accounts
Populates 10 agricultural categories, active demo accounts, 12 fresh produce listings with bulk tiers, and sample order histories:

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

Admin Portal Login:
👉 **http://localhost:5173/admin/login**

Public Application Status Lookup:
👉 **http://localhost:5173/application-status**

Backend API Health Check:
👉 **http://localhost:5000/api/health**

---

## 👥 Demo Accounts & Credentials

The seed script creates ready-to-test accounts for every platform persona with the default password: `Password123!`

| Role | Email | Password | Access / Features |
| :--- | :--- | :--- | :--- |
| **Retailer / Buyer** | `buyer@mandiplus.com` | `Password123!` | Marketplace, Cart, Bulk Tier Checkout, AI Assistant, Order Tracking |
| **Farmer / Seller** | `farmer@mandiplus.com` | `Password123!` | Farmer Dashboard, Produce Listing, Crop Grading, Order Fulfillment (Approved) |
| **Delivery Partner**| `delivery@mandiplus.com` | `Password123!` | Delivery Hub, Accept Shipments, Status Updates, Proof of Delivery (Approved) |
| **Administrator**   | `admin@mandiplus.com` | `Password123!` | Full Admin Console, Applications Review, Approvals/Rejections, User Moderation |

---

## 🛡️ Role-Based Registration & Admin Approval Workflow

### 1. Registration Rules by Role
- **Buyer / Retailer**:
  - Registers immediately as active (`approvalStatus: "not_required"`, `isActive: true`).
  - Receives authenticated JWT session immediately upon registration.
- **Farmer / Seller**:
  - Registers with `approvalStatus: "pending"` and `isActive: false`.
  - **No authenticated session** is issued at registration.
  - Receives a dedicated confirmation screen explaining that application is awaiting administrator approval.
  - Login attempts while pending or rejected are blocked with clear feedback.
- **Delivery Fleet**:
  - Registers with `approvalStatus: "pending"` and `isActive: false`.
  - **No authenticated session** is issued at registration.
  - Login attempts while pending or rejected are blocked with clear feedback.
- **Admin**:
  - **Public registration is strictly blocked** (HTTP 403 Forbidden). Administrator accounts can only be provisioned via server-side seeding or CLI operations.

### 2. Global Email Uniqueness
- An email address belongs to **only one account** across the entire platform.
- Checked against all roles (e.g. an email registered as Buyer cannot register as Farmer or Delivery, and vice versa).
- Applies even if the existing account is pending review or rejected.
- Normalization (lowercase + trimmed whitespace) is enforced before uniqueness validation and guarded by MongoDB unique index on `normalizedEmail`.
- Duplicate registration attempts return **HTTP 409 Conflict** with:
  `"Email already registered. Please sign in with your existing account or use another email address."`

### 3. Application Lifecycle & Admin Actions
- `/admin/login`: Dedicated login page strictly for administrators.
- `/admin/dashboard`: Real database-backed statistics (Total Users, Pending Farmers, Pending Delivery, Approved Farmers, Approved Delivery, Rejected Applications).
- `/admin/applications`: Administrative table with role filtering, status filtering, search by applicant name or email, and full detail modal.
- **Approve Action**: Verifies pending status, transitions to `approved` (`isActive: true`), records `approvedBy` & `approvedAt`, logs to `AuditLog`.
- **Reject Action**: Requires an administrative rejection reason, transitions to `rejected` (`isActive: false`), records `rejectedBy`, `rejectedAt`, and `rejectionReason`, logs to `AuditLog`.
- **Invalid Transitions Blocked**: Re-approving an approved account or approving an already rejected account is strictly rejected on the backend.

### 4. Application Status Verification
- Applicants can check their status publicly at `/application-status` using their registered email.
- Displays applicant name, role, submission timestamp, current approval status, and rejection reason (if rejected). No sensitive credentials or tokens are ever exposed.

---

## 🏗️ Project Architecture

```
MandiPlus/
├── package.json              # Unified root scripts (dev, build, seed, test)
├── server/                   # Node.js + Express + MongoDB Backend
│   ├── src/
│   │   ├── config/           # Database connection & env variables (adminEmail, adminInitialPassword)
│   │   ├── controllers/      # Auth, Admin, Products, Cart, Orders, AI, Seller, Delivery
│   │   ├── middleware/       # JWT auth, role validation (authorizeRoles, requireApprovedAccount)
│   │   ├── models/           # Mongoose schemas (User, AuditLog, Product, Order, Cart, etc.)
│   │   ├── routes/           # RESTful API route definitions (authRoutes, adminRoutes)
│   │   ├── seeds/            # seedAdmin.js, seed.js, seedData.js
│   │   └── services/         # Conversational NLP engine & produce grading logic
│   └── tests/                # Automated API endpoint & approval workflow test suites
└── client/                   # React 18 + Vite + Tailwind CSS Frontend
    ├── src/
    │   ├── components/       # Header, CategoryStrip, ProductCard, Modals, ProtectedRoute
    │   ├── context/          # Auth, Cart, Wishlist, Language, Location, Notifications
    │   ├── pages/            # RegisterPage, LoginPage, ApplicationStatusPage, AdminDashboardPage, AdminLoginPage
    │   └── services/         # authService, adminService, axios clients
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
3. **Admin Portal & Application Review**:
   - Real-time KPI summary cards (pending farmers, pending fleet, approved ratios).
   - Approval and rejection workflows with mandatory rejection reasons and audit logs.
   - User directory with status toggling and profile inspector.
4. **Volume Tier Pricing**:
   - Transparent price tiers per listing (e.g. 50+ kg @ 5% off, 200+ kg @ 12% off, 500+ kg @ 20% off).
5. **Multi-Role Portals**:
   - **Seller Portal**: Manage listings, view sales analytics with Recharts, dispatch shipments.
   - **Delivery Partner Hub**: View active dispatch assignments, update delivery milestones.
   - **Admin Console**: Applications review, platform GMV, dispute moderation, and CSV audit reports.

---

## 🧪 Testing & Building

- **Run Automated Test Suite (36 passing tests covering API & Approval Workflows)**:
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
