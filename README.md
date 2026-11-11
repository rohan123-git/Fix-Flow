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

---

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

### 4. Seed demo data
```bash
cd server
node scripts/seedDemoUsers.js
```

---

## Demo Accounts

> Sign in at the role-selection portal: **http://localhost:5173/portal**

---

### 👤 Admin — Vikram Malhotra

| Field | Value |
|-------|-------|
| **Portal** | http://localhost:5173/portal/admin |
| **Name** | Vikram Malhotra |
| **Email** | vikram.malhotra@fixflow.in |
| **User ID** | `FF-6AE6E18B269885C46E8F6C3E` |
| **Password** | `Vikram@Ops#2026` |
| **Department** | Operations |
| **Access** | Full system — analytics, team, assets, SLA, settings |

---

### 🔧 Technician — Aarav Mehta

| Field | Value |
|-------|-------|
| **Portal** | http://localhost:5173/portal/technician |
| **Name** | Aarav Mehta |
| **Email** | aarav.mehta@fixflow.in |
| **User ID** | `FF-6AE6F924C523F8A4610EBB2B` |
| **Password** | `Aarav@Field#2026` |
| **Department** | Facilities |
| **Skills** | Electrical, HVAC |
| **Access** | Field workbench — assigned jobs, claim & resolve work orders |

---

### 🧑‍💼 Employee — Aditi Sharma

| Field | Value |
|-------|-------|
| **Portal** | http://localhost:5173/portal/employee |
| **Name** | Aditi Sharma |
| **Email** | aditi.sharma@fixflow.in |
| **User ID** | `FF-6AE6F923C523F8A4610EBB1B` |
| **Password** | `Aditi@People#2026` |
| **Department** | HR |
| **Access** | Self-service — submit requests, track progress, view notifications |

---

## All Test Users (from seed)

### Technicians

| Name | Email | User ID | Password | Skills |
|------|-------|---------|----------|--------|
| Aarav Mehta | aarav.mehta@fixflow.in | `FF-6AE6F924C523F8A4610EBB2B` | `Aarav@Field#2026` | Electrical, HVAC |
| Priya Nair | priya.nair@fixflow.in | *(generated on seed)* | `Priya@Service#2026` | Plumbing, Facilities |
| Rohan Kulkarni | rohan.kulkarni@fixflow.in | *(generated on seed)* | `Rohan@Network#2026` | IT Support, Networking |

### Employees (sample)

| Name | Email | User ID | Password | Dept |
|------|-------|---------|----------|------|
| Aditi Sharma | aditi.sharma@fixflow.in | `FF-6AE6F923C523F8A4610EBB1B` | `Aditi@People#2026` | HR |
| Vikram Patel | vikram.patel@fixflow.in | *(generated on seed)* | `Vikram@Finance#2026` | Finance |
| Sneha Reddy | sneha.reddy@fixflow.in | *(generated on seed)* | `Sneha@Build#2026` | Engineering |
| Rahul Verma | rahul.verma@fixflow.in | *(generated on seed)* | `Rahul@Ops#2026` | Operations |
| Kavya Menon | kavya.menon@fixflow.in | *(generated on seed)* | `Kavya@Market#2026` | Marketing |

> **Note:** User IDs marked *(generated on seed)* are assigned at document creation time by MongoDB. Run the query below to look up any user's ID.

```bash
# In server/ directory:
node -e "
import('./models/User.js').then(async ({default: User}) => {
  const {default: mongoose} = await import('mongoose');
  const {default: dotenv} = await import('dotenv');
  dotenv.config();
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}).select('name userId email role');
  users.forEach(u => console.log(u.role, '|', u.name, '|', u.userId, '|', u.email));
  await mongoose.disconnect();
});
"
```

---

## Portals

| Portal | URL | Who |
|--------|-----|-----|
| Role selection | /portal | Everyone — choose your role here |
| Admin login | /portal/admin | Administrators only |
| Technician login | /portal/technician | Field technicians only |
| Employee login | /portal/employee | All staff — also has register option |

---

## Project Structure

```
FixFlow/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Layout, ProtectedRoute, AssetQrScanner
│   │   ├── context/        # AuthContext, ThemeContext
│   │   ├── pages/          # Portal, LoginPages, Dashboard, Tickets, Assets…
│   │   └── services/       # Axios API client
│   └── vite.config.js
│
└── server/                 # Express backend
    ├── controllers/        # Auth, ticket, admin, asset controllers
    ├── models/             # Mongoose schemas (User, Ticket, Asset, Comment…)
    ├── routes/             # API route definitions
    ├── middleware/         # Auth middleware, role guards
    ├── scripts/            # seedAdmin.js, seedDemoUsers.js
    └── server.js
```

## License

MIT
