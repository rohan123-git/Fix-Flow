# FixFlow – Smart Maintenance & Service Management Platform

Intermediate-level MERN stack application for managing maintenance requests and technician workflows.

## Roles
- **Admin:** View all tickets, assign technicians, create staff accounts, manage assets, and view dashboard analytics.
- **Employee:** Register/login, create maintenance requests, view own requests, receive updates, and confirm resolution by closing resolved tickets.
- **Technician:** View assigned tickets, start work, resolve jobs with repair notes, and receive notifications.

## Tech stack
React + Vite, Tailwind CSS, React Router, Axios, Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Recharts.

## Requirements
- Node.js 18+
- MongoDB local installation or MongoDB Atlas database

## Setup

### 1. Configure the backend
```bash
cd server
cp .env.example .env
```
Set `MONGO_URI` and a long random `JWT_SECRET` in `server/.env`.
Password reset email is optional; configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` to enable it. Without SMTP, the API reports that password reset delivery is unavailable.

### 2. Install dependencies
From the FixFlow root:
```bash
npm run install-all
```

### 3. Create the first administrator
From the `server` directory:
```bash
node scripts/seedAdmin.js admin@fixflow.com StrongPassword123 "FixFlow Admin"
```
Use a unique email and a strong password. Public registration deliberately creates employee accounts only; privileged roles are provisioned by an existing admin or the seed script.

### 4. Seed the sample workspace (optional)
From the FixFlow root, create the sample administrator, 3 technicians, 15 employees, 9 active requests and 15 completed requests:
```bash
npm run seed:demo
```
The script updates its sample accounts and requests when rerun. It is intended for local development only; do not run it against a production database.
Demo account credentials are maintained in `server/scripts/seedDemoUsers.js`; rerunning the script restores those sample passwords and adds an initial notification for each role.

### 5. Run the application
Open two terminals.

Terminal 1:
```bash
cd server
npm run dev
```

Terminal 2:
```bash
cd client
npm run dev
```
Open http://localhost:5173.

## Main API endpoints

### Authentication
- `POST /api/auth/register` – employee registration
- `POST /api/auth/login` – login
- `GET /api/auth/me` – current user
- `PATCH /api/auth/profile` – update the signed-in user's name, phone, and department
- `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` – email a one-time reset link and set a new password (SMTP required)
- `PATCH /api/auth/availability` – technician updates their availability (`available`, `busy` or `unavailable`)

### Tickets (authenticated)
- `GET /api/tickets` – list tickets scoped to the current role; supports `status`, `priority`, `search`, `page`, `limit`
- `GET /api/tickets/summary` – role-scoped ticket totals and SLA counts
- `GET /api/tickets/available` – open requests a technician may claim
- `PATCH /api/tickets/:id/claim` – technician claims an unassigned request
- `POST /api/tickets` – create request (employee/admin)
- `GET /api/tickets/:id` – ticket and history, access controlled
- `PATCH /api/tickets/:id/assign` – admin assigns a technician
- `GET /api/tickets/:id/matches` – admin receives ranked, explainable technician recommendations
- `PATCH /api/tickets/:id/status` – assigned technician starts/resolves work
- `PATCH /api/tickets/:id/worklog` – update a repair checklist and parts used
- `POST /api/tickets/:id/images` – upload an in-progress before/after image (5 MB maximum)
- `PATCH /api/tickets/:id/close` – employee confirms resolution

### Administration
- `GET /api/admin/dashboard` – aggregate dashboard metrics
- `GET /api/admin/users` – list users
- `POST /api/admin/users` – create employee, technician or admin account
- `GET /api/admin/technicians` – technician directory
- `GET /api/admin/analytics/technicians` – technician workload and performance metrics
- `GET /api/admin/settings` and `PATCH /api/admin/settings` – read and configure priority-based SLA hours

### Assets and notifications
- `GET /api/assets` – list assets for authenticated users
- `POST /api/assets` – create asset (admin)
- `GET /api/assets/code/:assetCode` – look up an asset and role-scoped service history by QR code
- `GET /api/assets/predictive` – rule-based maintenance schedule (admin)
- `PATCH /api/assets/:id/maintenance-plan` and `POST /api/assets/:id/maintenance` – manage intervals and record maintenance (admin)
- `GET /api/notifications` – current user's notifications
- `PATCH /api/notifications/:id/read` – mark notification as read

## Ticket lifecycle
`open → assigned → in-progress → resolved → closed`

- Admin assigns a technician to an open/assigned/in-progress request (not a resolved/closed request).
- Assigned technician moves the ticket to `in-progress` and then `resolved`.
- The employee who created the request confirms the resolution and closes it.
- TicketHistory records creation, assignment, status changes and closure.

## Security notes
- Passwords are hashed with bcrypt before storage.
- JWTs expire after seven days.
- Public signup cannot select a privileged role.
- Role-specific sign-in checks the account role on the server; remembering a session stores an authentication token, not the password.
- Protected routes enforce role permissions and ticket ownership/assignment on the server.
- Disabled accounts cannot sign in and are excluded from active team lists; their ticket history can be retained.
- Never commit `.env`; use separate secrets and database credentials in deployment.

## Operational workflows
- Technician recommendations are rule-based and rank skill compatibility, availability, active workload, rating, and experience; unavailable technicians cannot be assigned.
- Asset QR codes identify records by asset code. Maintenance predictions use the configured interval from the latest maintenance, purchase, or creation date; they are rules, not machine learning.
- New requests receive a due date from the configured priority SLA unless one is supplied. Existing due dates are not retroactively changed.
- Technician repair checklists, parts, and before/after images are stored with the ticket. Images are stored on the server's local disk and limited to 5 MB; deployments should use durable shared storage and configure backups.

## Production considerations
Configure SMTP for password recovery, durable image storage for multi-instance deployments, rate limiting, automated tests, and operational backups before public launch.
