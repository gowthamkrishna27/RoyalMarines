# Royals Marine - Role Architecture & Directory Structure

This document details the role separation in the Royals Marine platform, structured into **Operational Web App Logins (Agent & ASM)** and a **Separate Executive Flow (Admin)**.

---

## 🏛️ Application Architecture & Role Flows

```
                          ┌──────────────────────────┐
                          │   Splash Screen ( / )    │
                          └─────────────┬────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │   Portal Selector (/login)│
                          └──────┬────────────┬──────┘
                                 │            │
         ┌───────────────────────┴──────┐     └───────────────────────┐
         │                              │                             │
         ▼                              ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│   Agent Portal   │          │    ASM Portal    │          │   Admin Portal   │
│  (/agent-login)  │          │   (/asm-login)   │          │  (/admin-login)  │
├──────────────────┤          ├──────────────────┤          ├──────────────────┤
│ Field Operations │          │ Regional Manager │          │  SEPARATE FLOW   │
│ Pond Monitoring  │          │ Team Allocations │          │ System Admin     │
│ Test Submissions │          │ Test Verify/Sign │          │ Global Analytics │
│ Offline Sync     │          │ Performance Logs │          │ User & Role Logs │
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

---

## 📋 Role Matrix

| Scope | Role | Target User | Base Route | Login Route | Module Directory | Route Guard |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Web App** | **Agent** | Aqua Field Agents & Lab Technicians | `/agent/*`, `/technician/*` | `/agent-login` | [`src/agent/`](file:///c:/work/projests/royalsmarine/src/agent) | `AgentProtectedRoute` |
| **Web App** | **ASM** | Area Sales Managers & Regional Supervisors | `/asm/*`, `/incharge/*` | `/asm-login` | [`src/asm/`](file:///c:/work/projests/royalsmarine/src/asm) | `AsmProtectedRoute` |
| **Separate Flow** | **Admin** | System Directors & Executives | `/admin/*` | `/admin-login` | [`src/admin/`](file:///c:/work/projests/royalsmarine/src/admin) | `AdminProtectedRoute` |

---

## 📁 Source Tree (`src/`)

```
src/
├── agent/                         # 🚜 WEB APP ROLE 1: FIELD AGENT / TECHNICIAN
│   ├── components/                # Agent UI (Layout, BottomNavigation, QuickRecordModal, etc.)
│   ├── pages/                     # Agent pages (Dashboard, Farmers, TankDetails, SiteVisit, Harvest)
│   ├── utils/                     # Offline sync, GPS service, medication catalog, agentAuth
│   ├── AgentRoutes.jsx            # Subrouter for Agent flow
│   └── index.js                   # Module entry point
│
├── asm/                           # 👔 WEB APP ROLE 2: AREA SALES MANAGER (ASM)
│   ├── components/                # ASM UI (InchargeLayout, InchargeSidebar, FCRFilter, Modals)
│   ├── pages/                     # ASM pages (Dashboard, Agents, Allocations, RecordReview, Tests)
│   ├── utils/                     # inchargeAuth (with asmAuth aliases)
│   ├── AsmRoutes.jsx              # Subrouter for ASM flow
│   └── index.js                   # Module entry point
│
├── incharge/                      # 🔄 LEGACY COMPATIBILITY ALIAS
│   └── index.js                   # Re-exports from src/asm for seamless legacy import compatibility
│
├── admin/                         # 🛡️ SEPARATE FLOW: SYSTEM ADMINISTRATOR
│   ├── components/                # Admin UI (AdminHeader, AdminSidebar, AdminLayout, Modals)
│   ├── pages/                     # Admin pages (Dashboard, Regions, Incharges, Agents, Reports)
│   ├── utils/                     # adminAuth, adminMockData, mockRouteData
│   ├── AdminRoutes.jsx            # Subrouter for Admin flow (/admin/*)
│   └── index.js                   # Module entry point
│
├── pages/                         # 🌐 PUBLIC & MULTI-PORTAL ENTRY PAGES
│   ├── PortalSelector.jsx         # Multi-portal launcher (/login) separating Agent/ASM from Admin
│   └── Splash.jsx                 # App splash screen with automatic role session redirection (/)
│
├── components/                    # 🧩 SHARED CROSS-ROLE COMPONENTS
│   ├── BackButton.jsx             # Universal navigation back button
│   ├── ErrorBoundary.jsx          # Top-level React error boundary
│   ├── MarineLoader.jsx           # Branded marine loading animation
│   ├── ProtectedRoute.jsx         # Role route guards (AdminProtectedRoute, AsmProtectedRoute, AgentProtectedRoute)
│   ├── Spinner.jsx                # Lightweight loading indicator
│   └── TankModal.jsx              # Reusable pond/tank quick view modal
│
├── context/                       # 🗄️ GLOBAL REACTIVE STATE
│   └── MockDataContext.jsx        # Unified reactive store for farmers, tanks, tests, and notifications
│
├── utils/                         # 🛠️ SHARED APPLICATION UTILITIES
│   └── excelReportGenerator.js    # Multi-sheet Excel export engine
│
├── assets/                        # 🎨 MEDIA & ASSETS
│   ├── logo-trans2.png
│   └── topnavlogo.png
│
├── App.jsx                        # 🚦 HIGH-LEVEL ROLE ROUTER (Clean separation of flows)
├── App.css
├── index.css
└── main.jsx
```

---

## 🚦 Flow Separation in `App.jsx`

1. **Public Entry**:
   - `/` → Role-aware splash screen redirecting directly to active dashboard.
   - `/login` → Portal selector clearly separating operational logins (Agent & ASM) from Executive Admin access.

2. **Operational Web App Logins**:
   - **Agent**: `/agent-login` → `/agent/*` or `/technician/*`
   - **ASM**: `/asm-login` or `/incharge-login` → `/asm/*` or `/incharge/*`

3. **Separate Admin Flow**:
   - `/admin-login` → `/admin/*`
   - Independent navigation, executive dashboard, system configurations, and master data management.
