# FixFlow — Workplace Maintenance Management

A full-stack MERN application for managing workplace maintenance requests, assets, and technician operations.

## Features

- **Role-based portals** — separate login pages for Admin, Technician, and Employee
- **Admin dashboard** — live ticket stats, technician workload, SLA monitoring, analytics
- **Technician workbench** — assigned jobs queue, claim & update work orders
- **Employee self-service** — submit requests, track progress with status timeline
- **Kanban board** — drag-style ticket management with list/board toggle
- **Asset management** — asset registry with QR code labels and scanner
- **Predictive maintenance** — flag assets before they fail
- **SLA monitoring** — real-time overdue & due-soon tracking
- **Analytics** — resolution trends, priority breakdown charts
- **Smart matching** — suggest best-fit technician per ticket
- **Dark / light mode** — full theme toggle persisted to localStorage
- **Notifications** — real-time unread badge with mark-all-read
- **Comment threads** — per-ticket conversation with history log

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Auth | JWT (access + refresh tokens) |
| Styling | CSS custom properties (design tokens), dark-mode via `data-theme` |

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB running locally on port 27017

### 1. Clone the repo
```bash
git clone https://github.com/rohan123-git/Fix-Flow.git
cd Fix-Flow
```

### 2. Backend setup
```bash
cd server
npm install
node server.js
```

Create `server/.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/fixflow
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://localhost:5173
PORT=5000
```

### 3. Frontend setup
```bash
cd client
npm install
npx vite
```

Open **http://localhost:5173**

### 4. Seed test data (optional)
```bash
cd server
node seed.js
```

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fixflow.com | Admin@1234 |
| Employee | alice@fixflow.com | Pass1234! |
| Technician | bob@fixflow.com | Pass1234! |

## Portals

| Portal | URL | Who |
|--------|-----|-----|
| Role selection | /portal | Everyone |
| Admin login | /portal/admin | Administrators |
| Technician login | /portal/technician | Field technicians |
| Employee login | /portal/employee | All staff + register |

## License

MIT
