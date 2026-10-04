# 🌊 Royals Marine Food - Aqua Feed Management System

A full-stack aquaculture operations platform built for **Royals Marine Food Private Limited**. It provides three specialized portals for **Field Agents / Technicians**, **Regional Incharges / ASMs**, and **Executive Administrators** to log water quality tests, monitor shrimp pond health, track GPS visits, and manage harvests in real time.

---

## ⚡ Quick Start Guide (How to Start Frontend & Backend)

### 📋 Prerequisites
- [Node.js](https://nodejs.org/) installed (v18 or v20+ recommended)
- [npm](https://www.npmjs.com/) installed

---

### Option 1: Start Both Together (Recommended — Single Command)

1. Open your terminal in the root project folder:
   ```bash
   cd c:\work\projests\royalsmarine
   ```

2. Install all dependencies (runs once):
   ```bash
   npm run install:all
   ```

3. Start both backend and frontend together:
   ```bash
   npm run dev
   ```

- 🖥️ **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
- ⚡ **Backend REST API**: [http://localhost:5000](http://localhost:5000)
- 🩺 **Health Check Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Option 2: Start Frontend and Backend in Separate Terminals

#### 🔹 Terminal 1: Backend Server (Node.js + Express)
The backend manages data persistence, authentication, and REST API endpoints.
```bash
cd c:\work\projests\royalsmarine\backend
npm install
npm run dev
```
> Runs at **`http://localhost:5000`**

#### 🔹 Terminal 2: Frontend Client (React 19 + Vite)
The frontend provides the responsive user interface, interactive maps, and field forms.
```bash
cd c:\work\projests\royalsmarine\frontend
npm install
npm run dev
```
> Runs at **`http://localhost:5173`** (Automatically proxies `/api/*` to port 5000)

---

## 🔑 Login Credentials

| Portal | Username / Phone | Password | Description |
| :--- | :--- | :--- | :--- |
| **Agent / Technician** | `agent001` or `9000000001` | `agent123` | Field Agent (Chinnamiram) |
| **Agent / Technician** | `agent002` or `9000000002` | `agent123` | Field Agent (Bhimavaram) |
| **Incharge / ASM** | `INC001` or `9876543210` | `incharge123` | Area Sales Manager (Ravi Kumar - Bhimavaram) |
| **Admin Portal** | `ADM001` or `9999999999` | `admin123` | Central Administrator |

---

## 🏗️ Project Architecture & Components

```text
royalsmarine/
├── frontend/                   # 🖥️ React 19 + Vite Application (Port 5173)
│   ├── src/
│   │   ├── agent/              # Field technician portal (daily logs, pond maps, GPS)
│   │   ├── asm/ & incharge/    # Regional managers (approvals, routine scheduling)
│   │   ├── admin/              # Central monitoring, analytics & verifications
│   │   ├── context/            # Reactive data store & clean local sync
│   │   └── components/         # Shared UI components & navigation bars
│   └── package.json
│
├── backend/                    # ⚡ Node.js + Express API Server (Port 5000)
│   ├── src/
│   │   ├── controllers/        # Farmers, tanks, tests, harvest handlers
│   │   ├── routes/             # Express API router (/api/auth, /api/farmers, etc.)
│   │   ├── data/               # Seed data & clean in-memory database
│   │   └── server.js           # Server entry point
│   └── package.json
│
├── package.json                # Workspace orchestration scripts
├── .gitignore                  # Git ignore rules for node_modules and .env
└── README.md
```

---

## 🛠️ Helpful Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs both Frontend and Backend concurrently |
| `npm run dev:frontend` | Runs only Frontend (`http://localhost:5173`) |
| `npm run dev:backend` | Runs only Backend (`http://localhost:5000`) |
| `npm run build` | Builds optimized production bundle in `frontend/dist` |
| `npm run install:all` | Installs root, frontend, and backend packages |
