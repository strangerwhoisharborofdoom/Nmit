<div align="center">

# Dayflow HRMS

### A modern, role-aware Human Resource Management System

**Employee self-service · HR operations · Attendance · Leave · Payroll · Audit**

<br />

<a href="https://nmit-delta.vercel.app"><strong>🚀 Open Live Demo</strong></a>
&nbsp;&nbsp;•&nbsp;&nbsp;
<a href="https://github.com/strangerwhoisharborofdoom/Nmit/issues">Report a Bug</a>
&nbsp;&nbsp;•&nbsp;&nbsp;
<a href="https://github.com/strangerwhoisharborofdoom/Nmit/issues">Request a Feature</a>

<br /><br />

[![Live Demo](https://img.shields.io/badge/Live-Demo-111827?style=for-the-badge)](https://nmit-delta.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111827)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=flat-square&logo=firebase&logoColor=111827)](https://firebase.google.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🧭 What is Dayflow?

**Dayflow HRMS** is a full-stack-ready HR management interface built around a simple idea:

> **Employees should be able to manage everyday HR tasks themselves, while HR teams should have one place to manage the workforce.**

The application separates the experience by role and brings employee records, attendance, leave, payroll, documents, notifications, settings, and audit activity into a single workspace.

It is currently deployed as a working web application and is structured so that the UI, authentication, persistence, seed data, and feature modules can evolve independently.

---

## ✨ Why Dayflow?

Traditional HR systems often bury simple actions behind complicated navigation. Dayflow focuses on the workflows people actually perform repeatedly:

- **Employees** check attendance, view salary information, manage profiles, and request leave.
- **HR teams** manage people, review attendance, approve time off, and administer payroll.
- **Administrators** control organizational settings, departments, and audit activity.
- **Developers** get a modular React + TypeScript codebase with a dedicated data-service layer.

The goal is not to make another spreadsheet with buttons. It is to provide a foundation for a practical, extensible HR operating system.

---

## 🚀 Live Demo

**Production:** https://nmit-delta.vercel.app

The live application is deployed from the `main` branch.

> **Demo note:** The repository contains seeded demonstration data. Do not use demo accounts, seeded passwords, or sample employee information in a real production environment.

---

## 🎯 Feature Matrix

| Area | Employee | HR | Admin |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Personal profile | ✅ | ✅ | ✅ |
| Employee directory | — | ✅ | ✅ |
| Attendance | 👁️ | 🛠️ | 🛠️ |
| Leave / time off | 📝 | ✅ | ✅ |
| Leave approval | — | ✅ | ✅ |
| Payroll | 👁️ | 🛠️ | 🛠️ |
| Payslips | ✅ | 🛠️ | 🛠️ |
| Documents | ✅ | 🛠️ | 🛠️ |
| Departments | — | 🛠️ | 🛠️ |
| System settings | — | 🛠️ | 🛠️ |
| Audit logs | — | 👁️ | 👁️ |
| Notifications | ✅ | ✅ | ✅ |

**Legend:** `👁️ View` · `📝 Submit` · `🛠️ Manage` · `— Not exposed`

---

# 👤 Employee Experience

Dayflow gives employees a self-service workspace instead of making every small HR action dependent on an HR representative.

### Employee dashboard

- Personal overview
- Quick access to common HR actions
- Attendance information
- Leave status and balances
- Payroll access
- Notifications

### Profile

- Personal information
- Employment details
- Department and designation
- Contact information
- Employee documents

### Attendance

Employees can access their attendance information through a dedicated attendance experience while HR/admin users have a separate management workflow.

### Time off

Employees can:

1. Review available leave balances.
2. Select a leave type.
3. Submit a request.
4. Track request status.
5. Review request history.

HR/admin users receive the corresponding management workflow for reviewing requests.

### Payroll

Employees have access to their salary and payslip experience, while HR/admin users have dedicated payroll administration screens.

---

# 🧑‍💼 HR & Admin Experience

The administrative side of Dayflow is designed around workforce operations rather than just CRUD screens.

### Workforce management

- Employee directory
- Employee profiles
- Department management
- Employee lifecycle workflows
- Employee removal requests

### Attendance administration

- Workforce attendance visibility
- Administrative attendance workflows
- Employee-level attendance access

### Leave management

- Leave request queue
- Approval/review workflow
- Leave types
- Leave balances
- Request history

### Payroll administration

- Salary profiles
- Salary components
- Payroll records
- Payslip management

### Governance

- System settings
- Notifications
- Audit logs
- Role-aware access

---

# 🧠 Architecture

```text
                         ┌──────────────────────┐
                         │      Dayflow UI      │
                         │ React + TypeScript   │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          ┌────────────┐     ┌─────────────┐    ┌──────────────┐
          │ Auth Layer │     │ React Router│    │ Feature UI   │
          │ Firebase + │     │ Role guards │    │ Dashboard    │
          │ local demo │     │             │    │ HR / Payroll │
          └──────┬─────┘     └─────────────┘    └──────┬───────┘
                 │                                     │
                 └──────────────────┬──────────────────┘
                                    ▼
                         ┌──────────────────────┐
                         │  DayflowDbService    │
                         │  Single data layer   │
                         └──────────┬───────────┘
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                 ┌──────────────┐      ┌───────────────┐
                 │  Firestore   │      │ localStorage  │
                 │   Primary    │      │   Fallback    │
                 └──────────────┘      └───────────────┘
```

### Architectural principle

UI components should not become database clients.

Feature screens communicate with the **DayflowDbService**, which owns persistence behavior. This keeps Firestore access, fallback storage, seeding, and data operations in one place.

---

# 🔐 Authentication & Authorization

Dayflow supports three application roles:

```text
ADMIN
  │
  ├── Organization management
  ├── HR operations
  ├── Payroll
  ├── Settings
  └── Audit

HR
  │
  ├── Workforce management
  ├── Attendance
  ├── Leave management
  └── Payroll operations

EMPLOYEE
  │
  ├── Dashboard
  ├── Profile
  ├── Attendance
  ├── Time off
  └── Payroll / payslips
```

Protected routes redirect unauthenticated users to `/login`, while role-restricted routes prevent unauthorized navigation into HR/admin screens.

**Important:** client-side route protection is a UX/security boundary, not a replacement for backend authorization. Production Firestore rules and server-side authorization must independently enforce permissions.

---

# 💾 Data & Reliability

Dayflow uses **Firebase Firestore** as the primary persistence layer and a **localStorage-backed fallback** for resilience during development and demonstrations.

### Initialization flow

```text
Application starts
       │
       ▼
Seed local fallback
       │
       ▼
Try Firestore
   ┌───┴────┐
   │        │
 success   failure/timeout
   │        │
   ▼        ▼
Firestore  localStorage
```

The fallback makes the UI resilient when the remote database cannot be reached. It is **not** a full offline synchronization engine. Production deployments should add explicit conflict resolution, synchronization semantics, and stronger data-integrity guarantees.

---

# 🗂️ Data Domains

The application models the major entities needed by an HR platform:

- `User`
- `Employee`
- `Department`
- `Attendance`
- `LeaveType`
- `LeaveBalance`
- `LeaveRequest`
- `SalaryProfile`
- `SalaryComponent`
- `Payslip / PayrollRecord`
- `EmployeeDocument`
- `Notification`
- `AuditLog`
- `SystemSettings`
- `EmployeeRemovalRequest`

Seed data is included for development/demo workflows and can populate corresponding Firestore collections when the remote database is empty.

---

# 🧰 Technology Stack

| Category | Technology |
|---|---|
| Language | TypeScript |
| UI | React 19 |
| Build | Vite 6 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 |
| Forms | React Hook Form |
| Validation | Zod |
| Icons | Lucide React |
| Charts | Recharts |
| Animation | Motion |
| Authentication | Firebase Authentication |
| Database | Firebase Firestore |
| Local fallback | Browser localStorage |
| AI integration SDK | Google GenAI SDK |
| Server utility layer | Express + TSX |
| Deployment | Vercel |

---

# 📁 Project Structure

```text
Nmit/
│
├── src/
│   ├── components/
│   │   ├── common/              # Shared UI primitives and feedback
│   │   └── layout/              # Navigation and application shell
│   │
│   ├── context/
│   │   └── AuthContext.tsx      # Session, role and authentication state
│   │
│   ├── features/
│   │   ├── auth/                # Login
│   │   ├── dashboard/           # Employee + admin dashboards
│   │   ├── employees/           # Employee directory
│   │   ├── profile/             # Employee profiles
│   │   ├── attendance/          # Attendance workflows
│   │   ├── timeoff/             # Leave workflows
│   │   ├── payroll/             # Payroll + payslips
│   │   └── settings/            # Settings + audit
│   │
│   ├── services/
│   │   ├── db.ts                # Firestore + localStorage data service
│   │   └── seedData.ts           # Demo and initial datasets
│   │
│   ├── firebase/
│   │   └── config.ts            # Firebase client configuration
│   │
│   ├── types.ts                 # Shared domain types
│   ├── App.tsx                  # Routing + protected layouts
│   └── main.tsx                 # Application entry point
│
├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

---

# 🛣️ Application Routes

## Employee

| Route | Purpose |
|---|---|
| `/dashboard` | Employee dashboard |
| `/profile` | Current employee profile |
| `/profile/:id` | Employee profile |
| `/attendance` | Attendance |
| `/time-off` | Leave / time off |
| `/payroll` | Payslips and payroll information |
| `/employee/documents` | Employee documents |

## HR / Admin

| Route | Purpose |
|---|---|
| `/admin/dashboard` | Administrative dashboard |
| `/admin/reports` | Reporting dashboard |
| `/admin/employees` | Employee directory |
| `/admin/employees/:id` | Employee profile management |
| `/admin/attendance` | Attendance administration |
| `/admin/time-off` | Leave management and approvals |
| `/admin/payroll` | Payroll administration |
| `/admin/settings` | System settings |
| `/admin/audit-logs` | Audit logs |

---

# ⚡ Getting Started

## Prerequisites

- **Node.js 18+**
- **npm**
- A Firebase project for persistent cloud authentication/data

## 1. Clone

```bash
git clone https://github.com/strangerwhoisharborofdoom/Nmit.git
cd Nmit
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure Firebase

Create/configure your Firebase project and provide the client configuration expected by the project.

Keep production credentials and environment-specific secrets outside committed source code.

## 4. Start development

```bash
npm run dev
```

The Vite development server is configured for port `3000`.

Open:

```text
http://localhost:3000
```

## 5. Type-check

```bash
npm run lint
```

## 6. Production build

```bash
npm run build
```

## 7. Preview production build

```bash
npm run preview
```

---

# 🧪 Development Quality Gate

Before opening a pull request, run:

```bash
npm install
npm run lint
npm run build
```

A good contribution should leave the repository in a state where:

- TypeScript passes without errors.
- The production build succeeds.
- Existing role boundaries remain intact.
- Sensitive operations continue to produce appropriate audit records.
- New persistence logic stays inside the data-service layer.

---

# 🔒 Production Security Checklist

Dayflow contains HR and payroll concepts, so security is not optional.

Before handling real employee data:

- [ ] Configure Firebase Authentication for production.
- [ ] Write restrictive Firestore security rules.
- [ ] Enforce role authorization at the database/backend layer.
- [ ] Remove or disable demo credentials.
- [ ] Never store plaintext production passwords.
- [ ] Review personal-data exposure in employee profiles.
- [ ] Protect payroll and banking information.
- [ ] Validate all client-provided data server-side.
- [ ] Restrict administrative writes.
- [ ] Protect audit-log integrity.
- [ ] Configure production monitoring and error reporting.
- [ ] Review environment-variable handling.
- [ ] Add automated security and regression testing.

> **Never treat frontend route guards as the only authorization mechanism.** A malicious client can bypass UI restrictions.

---

# 🧭 Roadmap

The current foundation can evolve toward a more complete HR platform.

### Platform

- [ ] Strong server-side authorization
- [ ] Production-grade Firestore security rules
- [ ] Automated test suite
- [ ] CI/CD quality gates
- [ ] Structured application logging
- [ ] Error monitoring

### Employee experience

- [ ] Attendance clock-in / clock-out
- [ ] Attendance corrections
- [ ] Secure document upload
- [ ] Document expiry reminders
- [ ] Employee announcements
- [ ] Rich notification center

### HR operations

- [ ] Advanced employee lifecycle management
- [ ] Bulk employee import/export
- [ ] Approval chains
- [ ] HR analytics
- [ ] Advanced reporting
- [ ] CSV/PDF exports

### Payroll

- [ ] Automated payroll calculations
- [ ] Configurable statutory deductions
- [ ] Payroll processing periods
- [ ] Payroll approval workflow
- [ ] Secure payslip generation

### Intelligence & automation

- [ ] HR workflow automation
- [ ] Intelligent employee query assistant
- [ ] Attendance anomaly detection
- [ ] Payroll anomaly detection
- [ ] Automated HR reminders

### Reliability

- [ ] Real-time Firestore listeners
- [ ] True offline synchronization
- [ ] Conflict resolution
- [ ] Background retry queues

---

# 🧩 Design Principles

### 1. Role-first UX

The application should answer **“what can I do?”** before exposing unnecessary system complexity.

### 2. Feature isolation

Attendance should not know how payroll works. Payroll should not own authentication. Each domain stays in its feature module.

### 3. Data access through a service layer

Persistence belongs in `DayflowDbService`, not scattered across components.

### 4. Audit sensitive actions

Administrative changes should be traceable.

### 5. Resilient development experience

Local fallback data makes the application easier to develop, demo, and test when the remote database is unavailable.

### 6. Security at the data boundary

UI restrictions are useful, but actual authorization belongs where the data lives.

---

# 🤝 Contributing

Contributions are welcome.

### Workflow

```bash
git checkout -b feature/your-feature

# Make your changes

npm run lint
npm run build

git add .
git commit -m "feat: describe your change"
git push -u origin feature/your-feature
```

Then open a pull request with:

- What changed
- Why it changed
- How it was tested
- Screenshots for meaningful UI changes
- Any security or migration considerations

For bugs and feature requests, use GitHub Issues.

---

# 📜 License

No license file is currently defined in this repository.

Until an explicit open-source license is added, the repository remains subject to default copyright restrictions. If this project is intended to accept external contributions, adding a license should be considered before wider distribution.

---

# 🔗 Links

| Resource | Link |
|---|---|
| 🚀 Live application | https://nmit-delta.vercel.app |
| 💻 GitHub repository | https://github.com/strangerwhoisharborofdoom/Nmit |

---

<div align="center">

### Built with React, TypeScript, Firebase and a lot of coffee. ☕

**Dayflow HRMS**

*Making everyday HR workflows simpler, clearer, and easier to operate.*

</div>
