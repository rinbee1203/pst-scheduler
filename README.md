# 🏫 PST Teacher Scheduler

Full-stack web app for Philippine Standard Time (PST) teacher scheduling.
Built with **React + Vite** (frontend), **Node.js + Express** (backend), and **PostgreSQL** (database).

---

## 📁 Project Structure

```
pst-scheduler/
├── frontend/         ← React + Vite app
├── backend/          ← Node.js + Express API
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Set up the backend
```bash
cd backend
cp .env.example .env        # Fill in your values
npm install
npm run db:setup            # Creates tables + seeds admin
npm run dev                 # Starts API on http://localhost:4000
```

### 2. Set up the frontend
```bash
cd frontend
cp .env.example .env        # Fill in your values
npm install
npm run dev                 # Starts UI on http://localhost:5173
```

---

## 🔐 Default Admin Login
```
Email:    admin@school.edu.ph
Password: Admin@2026!
```
> Change this immediately after first login via the database.

---

## 🌐 Deployment
- **Frontend** → [Vercel](https://vercel.com)
- **Backend + DB** → [Railway](https://railway.app)

See `PST_Scheduler_Deployment_Guide.docx` for full step-by-step instructions.
