# NeuroTwin Web Dashboard

A modern, accessible desktop Caregiver Portal and Patient Memory Companion built with **React 18**, **Three.js**, **Vite**, and **Tailwind CSS**.

---

## 🌟 Key Features

- **Caregiver Operations Dashboard**: Live cognitive recall index, real-time telemetry from Qdrant Cloud and FastAPI backend, and patient vitality status.
- **Memories Library**: Visual memory anchor library categorized by life events, stories, songs, and favorite places.
- **Family & Caregiver Contacts**: Photo and contact manager with automatic InsightFace 512-d vector indexing in Qdrant Cloud.
- **Medication Scheduling**: Timed medication reminders with write-through synchronization to Supabase Cloud Postgres.
- **Interactive Three.js Neural Monitor**: Real-time 3D particle and neural visualization of memory query activity.
- **Seamless Backend Proxy**: Built-in Vite proxy forwarding `/api` and `/static` requests to FastAPI on port `8000`.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

### 3. Build for Production
```bash
npm run build
```
The production bundle is generated in `dist/` and automatically served by FastAPI under `http://localhost:8000/dashboard/`.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React 18, Vite 5
- **3D & Motion**: Three.js, `@react-three/fiber`, `@react-three/drei`, GSAP, Framer Motion
- **Styling**: Tailwind CSS + Custom Empathy Design Tokens
- **Icons**: Material Symbols Outlined & Google Fonts Inter
- **Backend Connection**: FastAPI REST API (`http://localhost:8000/api/v1`)
