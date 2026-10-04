# Royals Marine - Backend API Service

High-performance, low-latency REST API service built for the **Royals Marine Aquafeed Management System**.

---

## ⚡ Performance Highlights

- **Aiven MySQL Integration**: Connected to live Aiven MySQL with connection pooling, SSL/TLS, and automated schema migration.
- **Sub-5ms Response Times**: High-speed database pooling with in-memory caching and non-blocking asynchronous event loop.
- **Payload Compression**: Automatic gzip/deflate response compression via `compression()`.
- **Response Timing Header**: Automatically injects `X-Response-Time` header to monitor latency on every request.
- **Native ES Modules**: Clean, modern ES syntax (`import`/`export`) running on Node 20+.
- **Zero Config Setup**: Automatically verifies tables and seeds initial aquaculture datasets into MySQL on boot.

---

## 🗄️ Database Architecture (Aiven MySQL)

The backend connects directly to **Aiven MySQL** with automated table provisioning and initial data seeding:

- **`users`**: Administrative, regional managers (ASM), and field agent accounts.
- **`regions`**: Coastal regions (Bhimavaram, Kakinada, Narasapuram).
- **`incharges`**: Regional operations heads supervising zones.
- **`agents`**: Field aquaculture agents and lab technicians.
- **`farmers`**: Aquaculture farm owners with acreage, water sources, and contact details.
- **`tanks`**: Individual ponds/tanks with ABW, FCR, Biomass, DOC, and testing cycles.
- **`submissions`**: Field water analysis (pH, DO, Salinity, Alkalinity, Ammonia) & feed tests.
- **`harvests`**: Commercial harvest batches, count/kg, quality classification, and revenue.

---

## 📁 Directory Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── env.js             # Environment variables and system configuration
│   │   ├── database.js        # Aiven MySQL pool, SSL configuration & health check
│   │   └── initDb.js          # Automated MySQL table schema & seed provisioning
│   ├── controllers/
│   │   ├── authController.js       # Agent, ASM, and Admin authentication
│   │   ├── farmerController.js     # Farmers CRUD & team allocations
│   │   ├── tankController.js       # Tanks/ponds metrics & water tests
│   │   ├── submissionController.js # Verification workflow & reviews
│   │   ├── harvestController.js    # Harvest batch logging & cycle closures
│   │   └── analyticsController.js  # Dashboard KPIs, regional comparisons
│   ├── data/
│   │   ├── seedData.js        # Aquaculture master datasets (farmers, tanks, incharges)
│   │   └── store.js           # Fast in-memory state repository with query filters
│   ├── middleware/
│   │   ├── auth.js            # Role-based route guards (Agent, ASM, Admin)
│   │   ├── errorHandler.js    # Clean centralized JSON error handling
│   │   └── responseTimer.js   # Microsecond performance tracking
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── farmerRoutes.js
│   │   ├── tankRoutes.js
│   │   ├── submissionRoutes.js
│   │   ├── harvestRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── index.js           # Master API router mounting /api
│   ├── utils/
│   │   └── response.js        # Standardized JSON response envelope
│   └── app.js                 # Express application configuration
├── server.js                  # Server entry point & startup listener
├── package.json               # Backend dependencies and scripts
├── .env.example
├── .env
└── README.md
```

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Development Server (Watch Mode)
```bash
npm run dev
```

The server will start on `http://localhost:5000` with native Node file watching.

### 3. Production Start
```bash
npm start
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health status and uptime |
| `POST` | `/api/auth/login` | Login for Agent, ASM, Admin |
| `GET` | `/api/auth/profile` | Current user profile |
| `GET` | `/api/farmers` | List farmers (supports `agentId`, `inchargeId`, `search`) |
| `GET` | `/api/farmers/:id` | Farmer details with tank list |
| `POST` | `/api/farmers` | Register new farmer |
| `PUT` | `/api/farmers/:id` | Update farmer details |
| `PATCH` | `/api/farmers/:id/reassign` | Reallocate farmer to agent or incharge |
| `GET` | `/api/tanks` | List tanks (supports `farmerId`, `status`, `testStatus`) |
| `GET` | `/api/tanks/:id` | Tank details with farmer details |
| `POST` | `/api/tanks` | Add new pond/tank |
| `POST` | `/api/tanks/:id/water-tests` | Record water analysis (pH, DO, Salinity, FCR) |
| `GET` | `/api/submissions` | List field test submissions |
| `PATCH` | `/api/submissions/:id/verify`| Approve, flag, or reject submissions |
| `GET` | `/api/harvests` | List harvest records |
| `POST` | `/api/harvests` | Record harvest and close tank cycle |
| `GET` | `/api/analytics/summary` | Executive summary metrics |
| `GET` | `/api/analytics/regions` | Region comparison metrics |
| `GET` | `/api/analytics/agents` | Agent performance and test compliance |

---

## 🔑 Demo Credentials

- **Admin**: `ADM001` / `admin123`
- **ASM / Incharge**: `INC001` / `incharge123`
- **Agent**: `agent001` / `agent123`
