# Dayflow HRMS

> A modern Human Resource Management System for employee self-service, HR operations, attendance, leave, payroll, profiles, notifications, and audit workflows.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-nmit--delta.vercel.app-111827?style=for-the-badge)](https://nmit-delta.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111827)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=flat-square&logo=firebase&logoColor=111827)](https://firebase.google.com/)

## Overview

Dayflow HRMS is a role-aware web application designed to bring common HR workflows into one clean workspace. Employees get a self-service portal for their personal information, attendance, time-off requests, and payroll information, while HR and administrators get dedicated tools for employee management, attendance, leave approvals, payroll, reporting, settings, and audit activity.

The application is built with React and TypeScript, uses React Router for navigation, Firebase/Firestore for persistent data, and keeps a localStorage-backed data layer as a resilient fallback when Firestore is unavailable.

## Live Application

**Production:** https://nmit-delta.vercel.app

## Core Capabilities

### Employee self-service

- Employee dashboard
- Personal profile and employee details
- Attendance views
- Time-off / leave requests
- Leave balances and request history
- Payslips and salary information
- Employee documents
- Notifications

### HR & administration

- Admin / HR dashboard
- Employee directory and employee profiles
- Attendance management
- Leave request review and approval workflows
- Payroll management
- Departments and organizational settings
- System settings
- Audit logs
- Employee removal request workflows

### Authentication & roles

The application supports role-aware routing for:

- `ADMIN`
- `HR`
- `EMPLOYEE`

Protected routes redirect unauthenticated users to the login page, while role-restricted routes prevent employees from accessing HR/admin areas.

## Architecture

```text
React UI
   │
   ├── Authentication
   │     ├── Firebase Auth
   │     └── Demo / local session login
   │
   ├── Feature Modules
   │     ├── Dashboard
   │     ├── Employees & Profiles
   │     ├── Attendance
   │     ├── Time Off
   │     ├── Payroll
   │     └── Settings & Audit
   │
   └── DayflowDbService
         │
         ├── Firestore
         │
         └── localStorage fallback
```

The data service initializes local fallback data first, then attempts to connect to Firestore. This lets the interface remain usable even when the remote database cannot be reached.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build tool | Vite 6 |
| Routing | React Router |
| UI styling | Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Motion | Motion |
| Authentication | Firebase Authentication |
| Database | Firebase Firestore |
| Offline / fallback storage | Browser localStorage |
| AI SDK | Google GenAI SDK |
| Server utilities | Express + TSX |
| Deployment | Vercel |

## Project Structure

```text
Nmit/
├── src/
│   ├── components/
│   │   ├── common/          # Shared UI and feedback components
│   │   └── layout/          # Application shell and navigation
│   ├── context/             # Authentication and global context
│   ├── features/
│   │   ├── attendance/      # Employee + admin attendance
│   │   ├── auth/            # Login and authentication UI
│   │   ├── dashboard/       # Employee + admin dashboards
│   │   ├── employees/       # Employee directory
│   │   ├── payroll/         # Payroll and payslips
│   │   ├── profile/         # Employee profiles
│   │   ├── settings/        # Settings and audit pages
│   │   └── timeoff/         # Leave and time-off workflows
│   ├── services/
│   │   ├── db.ts            # Firestore + localStorage data service
│   │   └── seedData.ts      # Initial demo data
│   ├── firebase/             # Firebase configuration
│   └── App.tsx              # Routes and protected application shell
├── index.html
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js 18+
- npm
- A Firebase project if you want persistent cloud data/authentication

### 1. Clone the repository

```bash
git clone https://github.com/strangerwhoisharborofdoom/Nmit.git
cd Nmit
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create or configure your Firebase project and add the required client-side configuration used by the application.

Keep secrets and environment-specific values out of source control. Use environment variables for credentials or configuration that should not be committed.

### 4. Start the development server

```bash
npm run dev
```

The Vite development server is configured to run on port `3000`.

Open:

```text
http://localhost:3000
```

### 5. Build for production

```bash
npm run build
```

### 6. Preview the production build

```bash
npm run preview
```

### 7. Type-check the project

```bash
npm run lint
```

## Demo / Seed Data

The project includes seed data for development and demonstration. It contains example users, employees, departments, leave types, leave balances, attendance records, payroll profiles, documents, notifications, audit logs, and removal requests.

The application can use these datasets locally and can seed the corresponding Firestore collections when the remote database is empty.

> **Security note:** Demo credentials and seeded passwords are intended for local/demo use only. Never reuse demo credentials in production.

## Application Routes

### Employee

| Route | Purpose |
|---|---|
| `/dashboard` | Employee dashboard |
| `/profile` | Current employee profile |
| `/attendance` | Attendance |
| `/time-off` | Leave / time-off |
| `/payroll` | Payslips and payroll information |
| `/employee/documents` | Employee documents |

### HR / Admin

| Route | Purpose |
|---|---|
| `/admin/dashboard` | Admin / HR dashboard |
| `/admin/employees` | Employee directory |
| `/admin/attendance` | Attendance administration |
| `/admin/time-off` | Leave management and approval |
| `/admin/payroll` | Payroll administration |
| `/admin/settings` | System settings |
| `/admin/audit-logs` | Audit activity |

## Data Model

Dayflow's data layer is organized around HR entities such as:

- Users and roles
- Employees
- Departments
- Attendance records
- Leave types
- Leave balances
- Leave requests
- Salary profiles and salary components
- Payslips / payroll records
- Employee documents
- Notifications
- Audit logs
- System settings
- Employee removal requests

## Reliability Model

Dayflow is intentionally designed with a fallback data path:

1. Local seed data is initialized for immediate UI availability.
2. The app attempts to read/write through Firestore.
3. When Firestore is unavailable or times out, the service falls back to localStorage-backed data.
4. When Firestore becomes available, remote data can be used again.

This is useful for development, demos, unstable connections, and offline-friendly workflows. It should not be mistaken for a complete offline synchronization system; production deployments still need careful conflict handling, security rules, and data integrity controls.

## Security Considerations

Before using Dayflow with real employee data, review and harden the following:

- Firebase Authentication configuration
- Firestore security rules
- Role enforcement at the database layer
- Password handling and credential storage
- Personal and payroll data exposure
- Audit-log integrity
- Environment variable management
- Production error logging
- Data validation and authorization on every write

The client-side route guards improve UX, but authorization must ultimately be enforced by the backend/database security layer.

## Development Guidelines

### Recommended workflow

```bash
git checkout -b feature/your-feature
npm install
npm run lint
npm run build
git add .
git commit -m "feat: describe your change"
git push -u origin feature/your-feature
```

### Code conventions

- Keep feature-specific logic inside the relevant `src/features/*` module.
- Reuse shared UI from `src/components/`.
- Keep persistence logic inside the service layer instead of directly calling Firestore from UI components.
- Validate user input before writing data.
- Preserve role-based access boundaries.
- Add audit logging for sensitive administrative operations.

## Roadmap Ideas

Potential next steps for turning the prototype into a stronger production HRMS include:

- Real-time Firestore listeners for high-value data
- Stronger Firestore security rules and server-side authorization
- Secure password/account provisioning
- Full payroll calculation and statutory compliance support
- Attendance clock-in/out integration
- Employee document upload and secure storage
- Richer analytics and exports
- Automated notifications and reminders
- Test coverage for critical HR workflows
- CI/CD checks for type safety, builds, and regression testing
- Proper offline synchronization and conflict resolution

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run `npm run lint` and `npm run build`.
5. Open a pull request with a clear description of the change.

Bug reports and improvement ideas are welcome through GitHub Issues.

## License

No license file is currently defined in this repository. Unless a license is added, default copyright restrictions apply to the repository contents.

## Project Links

- **Live app:** https://nmit-delta.vercel.app
- **Repository:** https://github.com/strangerwhoisharborofdoom/Nmit

---

Built as a modern HRMS-style application with a focus on practical employee self-service and HR administration workflows.
