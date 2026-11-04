# Smart Lab Equipment Management System

A web-based equipment tracking and inventory management system designed for academic and research laboratories. Smart Lab streamlines the complete lifecycle of lab equipment: student requests, QR code scanning, staff approvals, issue and return verification, maintenance logs, and automated notifications.

Built following a strict, clean, government-portal style (minimalist aesthetics, system font stack, high-contrast layouts, and single accent color `#1F3A5F`).

---

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JSON Web Tokens (JWT), bcryptjs, express-validator, node-cron, qrcode
- **Frontend**: React 18, Vite, React Router DOM (v6), Axios, html5-qrcode
- **Styling**: Vanilla CSS in single `src/index.css` with CSS custom properties (no UI framework or Tailwind)

---

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) running locally or accessible via URI (default: `mongodb://localhost:27017/smart-lab`)

---

### 2. Backend Configuration & Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Verify the environment variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/smart-lab
   JWT_SECRET=supersecret_smartlab_jwt_key_2026
   JWT_EXPIRES_IN=1d
   CLIENT_URL=http://localhost:5173
   SEED_STAFF_NAME=Lab Staff
   SEED_STAFF_EMAIL=staff@smartlab.edu
   SEED_STAFF_PASSWORD=StaffPassword123
   ```

4. Seed the initial staff account:
   ```bash
   npm run seed
   ```
   *Default Staff Credentials*:
   - Email: `staff@smartlab.edu`
   - Password: `StaffPassword123`

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run at `http://localhost:5000`.

---

### 3. Frontend Configuration & Setup

1. In a separate terminal, navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Ensure it contains:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The client application will run at `http://localhost:5173`.

---

## Overdue & Maintenance Background Jobs

The backend includes a daily scheduled job running at `08:00 AM` via `node-cron` that:
- Flags overdue transactions (status `ISSUED` with `dueDate < now`) and notifies both the student and lab staff.
- Flags maintenance records due today or tomorrow and notifies lab staff.

To manually trigger this check at any time without waiting for the cron schedule:
```bash
cd backend
npm run run-jobs
```
Running this command multiple times is safe and idempotent (already-notified records are not duplicated).

---

## Application Routes

### Public Routes
- `/login` — Login for students and staff
- `/register` — Student account registration

### Student Routes (Role: `student`)
- `/student` — Student dashboard with request statistics, items due soon, and quick links
- `/student/equipment` — Equipment catalog with search, category/condition filters, and detail view
- `/student/scan` — Camera QR scanner and manual equipment code entry
- `/student/transactions` — Transaction history, active loan tracking, return requests, and cancellations
- `/equipment/:equipmentId` — Detailed equipment specifications, availability status, and request submission

### Staff Routes (Role: `staff`)
- `/staff` — Staff dashboard with inventory overview, pending requests, active returns, overdue loans, and maintenance alerts
- `/staff/equipment` — Full equipment inventory management (Add, Edit, Retire, view QR codes)
- `/staff/qr-labels` — Printable batch QR label sheets for physical lab tagging
- `/staff/requests` — Review, approve, or reject student equipment requests
- `/staff/returns` — Verify returned equipment, inspect condition, and record remarks
- `/staff/maintenance` — Equipment maintenance schedule, status tracking (`OPEN`, `IN_PROGRESS`, `COMPLETED`), and condition adjustments
- `/staff/history` — Complete audit trail of all transactions with date filtering and CSV export

### Shared Protected Route
- `/alerts` — System notifications with unread badge counter, view routing, and "Mark all as read"

---

## API Route Groups

All protected routes require a Bearer token (`Authorization: Bearer <token>`).

- **Authentication** (`/api/auth`)
  - `POST /register` — Register student account
  - `POST /login` — Login user & return JWT token
  - `GET /me` — Current authenticated user profile
- **Equipment** (`/api/equipment`)
  - `GET /` — List equipment with search, filters & pagination
  - `GET /categories` — List distinct equipment categories
  - `GET /code/:equipmentId` — Fetch equipment by code
  - `GET /:id/qr` — Get generated QR code data URI (Staff)
  - `POST /` — Create new equipment (Staff)
  - `PUT /:id` — Update equipment details (Staff)
  - `DELETE /:id` — Deactivate/retire equipment (Staff)
- **Transactions** (`/api/transactions`)
  - `POST /request` — Student submits checkout request
  - `GET /my` — Logged-in student's requests and transactions
  - `PATCH /:id/cancel` — Student cancels pending request
  - `PATCH /:id/return-request` — Student initiates return request
  - `GET /` — List all transactions with filters & CSV export (Staff)
  - `PATCH /:id/approve` — Staff approves request & issues equipment
  - `PATCH /:id/reject` — Staff rejects request with reason
  - `PATCH /:id/confirm-return` — Staff confirms item returned and records condition
- **Maintenance** (`/api/maintenance`)
  - `POST /` — Schedule new maintenance record & optionally mark equipment unavailable (Staff)
  - `GET /` — List maintenance records with status/equipment filters (Staff)
  - `PATCH /:id/status` — Advance record status from `OPEN` to `IN_PROGRESS` (Staff)
  - `PATCH /:id/complete` — Complete maintenance, update condition, and restore equipment to `AVAILABLE` (Staff)
- **Alerts** (`/api/alerts`)
  - `GET /` — Fetch latest 50 notifications with `isRead` flag
  - `GET /unread-count` — Count of unread alerts for current user
  - `PATCH /read-all` — Mark all user alerts as read
  - `PATCH /:id/read` — Mark individual alert as read
- **Dashboard** (`/api/dashboard`)
  - `GET /stats` — Role-based statistics (Staff inventory totals, requests & maintenance; Student loans & items due soon)
- **Health Check** (`/api/health`)
  - `GET /` — Basic API liveness check
