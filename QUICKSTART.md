# 🚀 Quick Start Guide - Royals Marine

## 1. What Are the Two Parts?

- **🖥️ Frontend (`/frontend`)**: 
  - Built with **React 19 + Vite**.
  - Provides the Web UI for Field Technicians, Regional Incharges, and Head Office Admin.
  - Runs on port **`5173`**.

- **⚡ Backend (`/backend`)**:
  - Built with **Node.js + Express (ESM)**.
  - Provides the REST API for Authentication, Farmer & Tank Registration, Test Logging, and GPS tracking.
  - Runs on port **`5000`**.

---

## 2. How to Start Everything (Single Command)

In your terminal at `c:\work\projests\royalsmarine`:

```bash
# 1. Install all dependencies (if not already installed)
npm run install:all

# 2. Start both Frontend & Backend concurrently
npm run dev
```

- Open your browser to: **`http://localhost:5173`**
- API runs at: **`http://localhost:5000`**

---

## 3. How to Start Separately (Two Terminals)

If you prefer running them in separate command prompts:

### Terminal 1 (Backend):
```bash
cd c:\work\projests\royalsmarine\backend
npm install
npm run dev
```

### Terminal 2 (Frontend):
```bash
cd c:\work\projests\royalsmarine\frontend
npm install
npm run dev
```

---

## 4. Test Login Credentials

| Role | Username / ID | Password |
| :--- | :--- | :--- |
| **Agent / Field Technician** | `agent001` | `agent123` |
| **Incharge / Regional ASM** | `INC001` | `incharge123` |
| **Head Office Admin** | `ADM001` | `admin123` |

---

## 5. Push to GitHub

Run these commands in your PowerShell or Command Prompt at `c:\work\projests\royalsmarine`:

```bash
git add .
git commit -m "Clean project: Frontend and backend with 0 mock data"
git branch -M main
git remote add origin https://github.com/gowthamkrishna27/RoyalMarines.git
git push -u origin main
```
