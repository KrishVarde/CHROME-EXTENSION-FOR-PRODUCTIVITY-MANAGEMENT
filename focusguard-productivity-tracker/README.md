# 🛡️ FocusGuard – Productivity Tracker Chrome Extension

A full-stack Chrome Extension for tracking website time and blocking distractions.
Built with **React + Tailwind**, **Node.js + Express**, and **MongoDB**.

---

## 📁 Project Structure

```
productivity-tracker/
├── extension/              # Chrome Extension (React, Manifest V3)
│   ├── public/
│   │   ├── manifest.json   # Extension manifest
│   │   ├── background.js   # Service worker (tracking + blocking)
│   │   ├── content.js      # Injected into every page
│   │   └── blocked.html    # Shown when a blocked site is visited
│   └── src/
│       ├── App.jsx         # Root with tab navigation
│       ├── popup/
│       │   ├── Dashboard.jsx    # Time tracking charts & stats
│       │   ├── BlockList.jsx    # Manage blocked sites
│       │   └── SettingsPanel.jsx
│       └── utils/
│           ├── chrome.js   # chrome.runtime.sendMessage wrapper
│           └── time.js     # Formatting helpers
│
└── server/                 # Node.js + Express + MongoDB API
    └── src/
        ├── index.js        # Express entry point
        ├── config/db.js    # MongoDB connection
        ├── models/
        │   ├── WebsiteAnalytics.js
        │   └── BlockedSite.js
        └── routes/
            ├── analytics.js
            └── blocked.js
```

---

## 🚀 Setup

### 1. Backend

```bash
cd server
cp .env.example .env      # Edit MONGODB_URI if needed
npm install
npm run dev               # Starts on http://localhost:5000
```

**MongoDB** must be running locally (`mongod`) or provide an Atlas URI in `.env`.

### 2. Extension

```bash
cd extension
npm install
npm run build             # Outputs to extension/dist/
```

Then:
1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `extension/dist/` folder
4. Pin the FocusGuard extension from the toolbar

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/analytics/track` | Record time: `{ domain, seconds, date? }` |
| GET | `/api/analytics/today` | Today's usage per domain |
| GET | `/api/analytics/week` | Last 7 days aggregated |
| GET | `/api/analytics/summary` | Full today + week summary |
| DELETE | `/api/analytics?date=YYYY-MM-DD` | Delete data for a date |
| GET | `/api/blocked` | List blocked sites |
| POST | `/api/blocked` | Add: `{ domain }` |
| DELETE | `/api/blocked/:domain` | Remove a blocked site |
| GET | `/api/blocked/check/:domain` | Check if blocked |

---

## ✨ Features

- **Time Tracking** — Tracks time per domain automatically via `chrome.tabs` API
- **Site Blocking** — Redirects blocked domains to a custom block page
- **Dashboard** — Bar chart + breakdown with focus score ring
- **Dark Mode** — Fully dark UI throughout
- **Offline-first** — Data stored in `chrome.storage.local` and synced to MongoDB
- **Default blocked sites** — YouTube, Instagram, Reddit, Facebook

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Extension UI | React 18, Tailwind CSS, Recharts |
| Extension APIs | Manifest V3, chrome.tabs, chrome.storage, chrome.alarms |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
