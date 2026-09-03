# Royals Marine Food - Aqua Feed Management System

A multi-portal aquaculture field monitoring and management platform built for **Royals Marine Food Private Limited**. The system connects field agents, regional operations managers (incharges), and central administrators to monitor shrimp/fish farming ponds, track feed conversion and biomass, record water quality parameters, and manage harvest operations in real time.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Key Features & Portals](#key-features--portals)
  - [1. Agent Portal (Field Operations)](#1-agent-portal-field-operations)
  - [2. Incharge Portal (Regional Operations)](#2-incharge-portal-regional-operations)
  - [3. Admin Portal (Executive & System Admin)](#3-admin-portal-executive--system-admin)
- [Tech Stack](#tech-stack)
- [Demo Credentials](#demo-credentials)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
- [Scripts](#scripts)
- [License](#license)

---

## 🌊 Overview

The **Aqua Feed Management System** streamlines field data collection, pond health verification, and aquaculture farm tracking. It eliminates paper-based reporting with real-time digital logging of water parameters, feeding rates, average body weight (ABW), feed conversion ratio (FCR), biomass estimations, and harvest yields across diverse coastal regions (such as Bhimavaram, Narasapuram, Kakinada, and surrounding farming clusters).

---

## 🚀 Key Features & Portals

### 1. Agent Portal (Field Operations)
Mobile-first interface optimized for field agents operating directly at farm sites:
- **Farmer & Tank Management**: View assigned farmers, contact information, pond/tank specifications, and water source types.
- **Water Quality & Health Testing**: Log parameters including pH, Salinity, Dissolved Oxygen (DO), Alkalinity, Ammonia (NH3), Nitrite (NO2), and Temperature.
- **Biomass & Feed Tracking**: Track Average Body Weight (ABW), daily feed consumption, Feed Conversion Ratio (FCR), and estimated survival rates.
- **Site Visit Records**: Submit field visit logs with geo-notes and observation checklists.
- **Harvest Logging**: Record harvest batches, net biomass, count/kg, harvest date, and quality classification.
- **Agent Profile**: Manage personal contact details and custom avatar.

### 2. Incharge Portal (Regional Operations)
Web dashboard for regional coordinators and operations managers:
- **Regional Dashboard**: Overview of active ponds, pending tests, overdue tank audits, and agent activity within the assigned region.
- **Agent Monitoring & Allocation**: Allocate farmers to specific field agents and inspect agent performance.
- **Test Submissions Review**: Review, verify, or flag field water test records.
- **Weekly Testing Schedules**: Monitor weekly test completion cycles and identify overdue ponds.
- **Reports & Export Center**: Filter and export regional test history and farmer records.

### 3. Admin Portal (Executive & System Admin)
Comprehensive central governance platform for head-office administrators:
- **Executive Analytics**: Visual performance trends, biomass distribution, regional comparison charts, and feed efficiency graphs powered by Recharts.
- **Hierarchy Management**: Complete CRUD operations for Regions, Incharges, Agents, Farmers, and Tanks.
- **Verifications & Approvals**: Multi-tier review workflow to approve critical test deviations and harvest submissions.
- **Activity & Audit Logs**: Detailed chronological log of all field and management actions.
- **Data Export Center**: Consolidated reporting and export functionality for business intelligence.

---

## 🛠 Tech Stack

- **Framework / UI Library**: [React 19](https://react.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts & Data Visualization**: [Recharts](https://recharts.org/)
- **Styling**: Vanilla CSS with modern Glassmorphism, CSS Custom Properties, and responsive mobile-first views
- **Data Management**: React Context API with LocalStorage persistence

---

## 🔑 Demo Credentials

| Portal | Login Identifier / ID | Password | Role / Description |
| :--- | :--- | :--- | :--- |
| **Admin Portal** | `ADM001` or `9999999999` | `admin123` | Head Office Administrator |
| **Incharge Portal** | `INC001` or `9876543210` | `incharge123` | Regional Incharge (Ravi Kumar - Bhimavaram) |
| **Agent Portal** | `agent001` | `agent123` | Field Agent A (Chinnamiram / Bhimavaram) |
| **Agent Portal** | `agent002` | `agent123` | Field Agent B (Narasapuram) |

---

## 📂 Project Structure

```text
RoyalMarines/
├── index.html                  # Main HTML entry point
├── package.json                # Project dependencies and npm scripts
├── vite.config.js              # Vite configuration
├── public/                     # Static assets (favicons, manifest)
└── src/
    ├── assets/                 # Brand logos, background images, illustrations
    ├── components/             # Reusable UI components (BackButton, modals, badges)
    ├── context/                # Global mock data store & Context Provider
    │   └── MockDataContext.jsx # Initial seed data, CRUD handlers & state
    ├── pages/                  # Top-level route pages (PortalSelector, etc.)
    │   └── PortalSelector.jsx  # Multi-portal landing selection page
    ├── agent/                  # Agent Portal module
    │   ├── components/         # Agent navigation, headers, layout wrappers
    │   ├── pages/              # AgentDashboard, Farmers, TankDetails, SiteVisit, Tests, Harvest, etc.
    │   └── utils/              # Agent auth helpers & local storage utilities
    ├── incharge/               # Incharge Portal module
    │   ├── components/         # Incharge sidebar, topbar, cards
    │   ├── pages/              # Dashboard, Allocations, Agents, Farmers, RecordReview, Reports, etc.
    │   ├── utils/              # Incharge authentication utils
    │   └── InchargeRoutes.jsx  # Sub-routes for incharge portal
    ├── admin/                  # Admin Portal module
    │   ├── components/         # Admin sidebar, header, stat cards, metric tables
    │   ├── pages/              # AdminDashboard, AgentsList, FarmersList, Regions, Analytics, Verifications, etc.
    │   ├── utils/              # Admin auth and data processing utilities
    │   └── AdminRoutes.jsx     # Sub-routes for admin portal
    ├── App.jsx                 # Route definitions and auth protection wrappers
    ├── App.css                 # Application-wide utility styles
    ├── index.css               # Design system variables, color tokens, global styles
    └── main.jsx                # React DOM render root
```

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)

### Installation

1. Clone or navigate to the repository directory:
   ```bash
   cd RoyalMarines
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

Start the local Vite development server:
```bash
npm run dev
```

Open `http://localhost:5173` (or the URL displayed in your terminal) in your browser.

### Production Build

Create an optimized production bundle:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## 📜 Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with HMR |
| `npm run build` | Compiles and builds production assets into `dist/` |
| `npm run preview` | Runs a local web server to preview production build |
| `npm run lint` | Runs `oxlint` linter across source files |

---

## 📄 License

This project is proprietary and confidential to **Royals Marine Food Private Limited**.
