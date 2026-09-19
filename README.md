# ⚡ Voltra Smart EV Charging Portal (`softwarehackathon00001`)

Voltra is an advanced, full-stack Smart EV Charging Management Portal designed for residential communities, multi-apartment complexes, and smart microgrids. It solves peak-demand transformer overloads, provides a 5-port multi-factor fair queueing system for 30 resident flats, and integrates AI assistance for navigation and technical inquiries.

---

## 🚀 Key Features

* **Resident Portal (Flats 1–30):** Look up assigned flat details, battery SoC %, set target SoC %, departure time, and plug status.
* **5-Port Multi-Factor Priority Queueing:** Dynamic priority scoring engine ($0–100$) balancing battery deficit, departure urgency, required energy (kWh), solar surplus, anti-hoarding penalties, and anti-starvation bonuses.
* **Real-time Grid & Power Flow Telemetry:** Live monitoring of building demand (kW), solar generation (kW), and grid limit (50 kW feeder envelope).
* **Interactive AI Assistant (`/api/chat`):** Express + Gemini AI backend proxy serving real-time guidance on EV terms, SoC, algorithms, and troubleshooting.
* **Vercel & Cloud Run Ready:** Pre-configured with `vercel.json` and `api/index.ts` serverless functions for instant deployment.

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Motion.
* **Backend:** Node.js, Express, `@google/genai` (Gemini 3.8 Flash), CORS enabled.
* **Deployment & Serverless:** Vercel serverless adapter (`api/index.ts`), Docker/Cloud Run (`server.ts`).

---

## 📁 Repository Structure

```
softwarehackathon00001/
├── api/                  # Vercel serverless function entrypoint
│   └── index.ts          # Express server wrapped for Vercel serverless routes
├── src/                  # React Frontend Application
│   ├── components/       # PowerFlowDiagram, ResidentPortal, QueueVisualizer, SmartAiChatbot, etc.
│   ├── services/         # Priority Engine, Charging Port Engine, Notification Service
│   ├── types.ts          # Shared TypeScript interfaces & types
│   ├── App.tsx           # Main Application Layout & Tab Manager
│   └── main.tsx          # React Entry Point
├── server.ts             # Express full-stack Node.js development/production server
├── vercel.json           # Vercel route rewrites & deployment configuration
├── vite.config.ts        # Vite configuration
├── package.json          # Dependencies & scripts
└── .env.example          # Environment variable template
```

---

## ⚙️ Quick Start (Local Setup)

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/softwarehackathon00001.git
   cd softwarehackathon00001
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🌐 Deploying to Vercel

1. Push this repository to GitHub as `softwarehackathon00001`.
2. Connect your GitHub account to [Vercel](https://vercel.com).
3. Import `softwarehackathon00001`:
   * **Framework:** Vite
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. In Vercel Project Settings, add `GEMINI_API_KEY` under **Environment Variables**.
5. Click **Deploy**!

---

## 📜 License

MIT License - feel free to use and adapt for hackathons or production deployments.
