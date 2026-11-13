# Hair Reviver — Clinic CRM

A full-stack CRM for a hair patch clinic. One server, one deployment.

- **Frontend:** React 18 + Vite (single-page app, no framework)
- **Backend:** Express + MongoDB (Mongoose)
- **Database:** MongoDB — real Atlas connection *or* zero-install in-memory MongoDB

Manages clients, appointments, patch inventory, billing, staff roles and reports, with automatic maintenance reminders and WhatsApp deep links for reminders and invoice follow-up.

## Features

- **Dashboard** — today's schedule, revenue chart, overdue maintenance, pending payments, technician view
- **Clients** — add/edit clients, patch profile (type/base/vendor/attach), maintenance cycle, auto-computed due dates, notes, WhatsApp contact
- **Appointments** — book, reschedule to any later day, start / no-show / cancel / complete; completing a service auto-raises the invoice; day & week views; WhatsApp reminder per appointment
- **Automatic WhatsApp reminders** — a scheduler picks appointments whose reminder is due (appointment date − days before) and shows them on the dashboard with one-tap send; connect the WhatsApp Cloud API to send them fully automatically
- **Inventory** — patch stock with reorder thresholds, restock logging (vendor purchase log), usage deduction, low-stock warnings
- **Billing** — invoices raised from completed services, partial payments, WhatsApp invoice reminders, pending follow-up list
- **Staff & roles** — owner / front desk (staff) / technician; per-role module permissions that can be toggled from the UI
- **Reports** — collection rates, service mix, technician workload
- **Clinic-network gate** — staff and technician accounts can only sign in / use the CRM from the clinic Wi-Fi/LAN; the owner works from anywhere
- **Demo data** — realistic seed (clients, appointments, inventory, invoices, staff)

## Getting started

Requires **Node 18+** (Node 24 recommended).

### 1. Install

```bash
npm install
```

This installs the backend, frontend and the dev runner (`concurrently`) together.

### 2. Run (production mode — one server on `http://localhost:4000`)

```bash
npm start
```

Builds the frontend and serves it from the Express backend. No MongoDB install needed — with an empty `MONGODB_URI` the app runs on an in-memory MongoDB and auto-seeds demo data.

### 3. Development mode (hot reload)

```bash
npm run dev
```

Runs the API (`http://localhost:4000`) and the Vite dev server side by side. The frontend dev server proxies `/api` to the backend.

### 4. Seed data manually

```bash
npm run seed --prefix backend        # reseed only if the DB is empty
npm run seed:reset --prefix backend  # wipe and reseed
```

## Demo accounts

Everything is seeded on first start. Password for all demo accounts: **`demo1234`**

| Role        | Email                 | Access |
|-------------|-----------------------|--------|
| Owner       | `neeraj@hairreviver.in` | Full access, works from anywhere |
| Front desk  | `ritu@hairreviver.in`   | Clients, appointments, billing — clinic network only |
| Front desk  | `imran@hairreviver.in`  | Same as above |
| Technician  | `meghna@hairreviver.in` | Own appointments, service status, stock usage — clinic network only |
| Technician  | `sandeep@hairreviver.in` | Same as above |
| Technician  | `kavita@hairreviver.in`  | Same as above |

> Staff and technician logins are rejected (401) off the clinic network. During development `127.0.0.0/8` (localhost) is always allowed, so testing from the same machine works.

## Configuration

Copy `backend/.env.example` to `backend/.env` and adjust if needed:

| Variable           | Meaning |
|--------------------|---------|
| `PORT`             | API/server port (default `4000`) |
| `MONGODB_URI`      | MongoDB connection string. **Leave empty for in-memory MongoDB** (auto-seeded, no install). Paste an Atlas URI for persistent data. |
| `JWT_SECRET`       | Secret for login tokens. Change in production. |
| `SIM_TODAY`        | Demo date for "overdue / due today / this month". Leave empty for the real date. |
| `MONGOMS_DISTRO`   | In-memory MongoDB binary flavor. Ubuntu-based distros (incl. Kali) need `ubuntu2204`. |
| `CLINIC_NETWORKS`  | Optional. Comma-separated CIDRs that staff/technician accounts are restricted to. Leave empty (default) to allow any network. |
| `WHATSAPP_TOKEN`   | WhatsApp Cloud API token. Leave empty to keep manual one-tap reminder buttons. |
| `WHATSAPP_PHONE_ID`| WhatsApp Cloud API phone number ID (required together with the token). |
| `REMINDER_INTERVAL_MS` | How often the reminder scheduler checks, in ms (default `300000` = 5 min). |

### Persistent data (MongoDB Atlas)

By default the app runs on an in-memory MongoDB — data is lost when the server stops. For a real clinic, use a free MongoDB Atlas cluster:

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas) → **Database Access** → add a user → **Network Access** → allow your clinic IP (or `0.0.0.0/0` for simplicity).
2. **Connect → Drivers** → copy the connection string, e.g. `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`.
3. Paste it into `backend/.env` as `MONGODB_URI=…` and restart the server. The app seeds demo data once, then everything you add persists.

### Automatic WhatsApp reminders

Two levels, both work out of the box:

- **Manual (default):** the dashboard shows a "WhatsApp reminders due" panel listing appointments whose reminder is due today — one tap opens WhatsApp with the reminder message pre-filled, plus a "Mark sent" button.
- **Automatic:** set `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID` (WhatsApp Cloud API / Meta — see [the Meta get-started guide](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)). The scheduler then sends each due reminder itself and records it as sent. `REMINDER_INTERVAL_MS` controls how often it checks.

### Clinic-network gate

The gate is **off by default**, so front desk and technician accounts can sign in from anywhere (localhost, Vercel, Render). To restrict them to the clinic Wi-Fi, set `CLINIC_NETWORKS` to your clinic subnet, e.g. `192.168.1.0/24` (comma-separate multiple CIDRs). Owner accounts are never restricted. When enabled, the gate is enforced at login and on every authenticated request.

## WhatsApp reminders & invoices

The CRM uses WhatsApp **deep links** (`https://wa.me/...`) — no external service or API key. Buttons open the WhatsApp app with a pre-filled message:

- **Appointments → Remind** — reminder message with date/time
- **Billing → WhatsApp** — invoice with pending balance
- **Client profile → WhatsApp** — quick contact
- **Dashboard → WhatsApp reminders due** — appointments whose reminder is due today, with send + mark-sent buttons

With `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` configured, the built-in scheduler sends these reminders automatically (see above).

## API overview

All routes are under `/api` and require a `Bearer` token from `POST /api/auth/login`.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Clients | `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/:id` |
| Appointments | `GET/POST /api/appointments`, `GET/PUT/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status` |
| Billing | `GET/POST /api/invoices`, `GET/PUT /api/invoices/:id`, `POST /api/invoices/:id/payments` |
| Inventory | `GET/POST /api/inventory`, `PUT /api/inventory/:id`, `POST /api/inventory/:id/restock`, `POST /api/inventory/:id/deduct`, `GET /api/inventory/purchases` |
| Roles | `GET /api/roles`, `PUT /api/roles/:role` |
| Reminders | `GET /api/reminders` (due), `PATCH /api/reminders/appointments/:id/reminder-sent` |
| Reports | `GET /api/reports/summary` |

## Tests

```bash
npm test --prefix backend
```

Runs the backend test suite (auth, roles, clients, appointments, billing, inventory and the clinic-network gate) on an isolated in-memory MongoDB.

## Project structure

```
├── backend/            # Express + MongoDB API
│   ├── src/
│   │   ├── models/     # Mongoose models (Client, Appointment, Invoice, …)
│   │   ├── routes/     # Express routers
│   │   ├── middleware/ # auth, clinic-network gate
│   │   ├── seed/       # demo data + seeding
│   │   └── server.js
│   └── .env.example
├── frontend/           # React 18 + Vite SPA
│   ├── src/
│   │   ├── app.jsx     # root: auth, shell, routing
│   │   ├── views/      # dashboard, clients, appointments, operations, …
│   │   └── lib/        # api client, ui primitives, data, wa helpers
│   └── index.html
└── package.json        # one-command orchestration
```

## Deployment

1. `npm install`
2. Set `MONGODB_URI` to your persistent MongoDB (Atlas) and change `JWT_SECRET` (leave `CLINIC_NETWORKS` empty unless you want the LAN gate)
3. `npm start` — serves the built SPA + API on one port

For the clinic-network gate to see real client IPs behind a reverse proxy, forward `X-Forwarded-For` (`trust proxy` is already enabled server-side).
