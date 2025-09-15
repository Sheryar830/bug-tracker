# 🐛 Bug Tracker System

A full-featured **MERN Stack Bug Reporting & Tracking System** that supports **Admin**, **Developer**, and **Tester** roles — developed by **Sheryar Waris**.

> 📅 Last Updated: September 15, 2025

---

## 🚀 Features

### 👤 Role-Based Access
- **Admin**: Manages users, projects, issues, and system settings.
- **Developer**: Views & resolves assigned bugs.
- **Tester**: Reports bugs, tracks their status.

### 📋 Modules

- **User Management**
  - Register/login with role selection
  - Activate/deactivate users
  - Profile editing & password change

- **Project Management**
  - Create new projects
  - Assign users (testers/developers) to projects

- **Bug Reporting**
  - Report bug with project, steps, environment, priority, and severity
  - Automatically assigned status: `NEW`
  - View bugs by role (assigned or reported)

- **Bug Tracking**
  - Status options: `NEW`, `IN_PROGRESS`, `READY_FOR_TEST`, `CLOSED`
  - Prioritize and categorize bugs by severity/priority
  - Developer can mark bugs resolved
  - Tester gets status update

- **Admin Dashboard**
  - Total projects, open issues, stats by severity/status
  - Recent issues and activity

- **Notifications**
  - Role-specific actions visible in sidebar
  - Status badges for real-time tracking

---

## 🛠️ Tech Stack

| Tech           | Description                       |
|----------------|-----------------------------------|
| **MongoDB**    | Database                          |
| **Express.js** | Backend Framework (Node.js)       |
| **React.js**   | Frontend Library                  |
| **Node.js**    | Server-side Runtime               |
| **Axios**      | HTTP Requests                     |
| **JWT**        | Authentication                    |
| **Bootstrap**  | UI Styling                        |
| **SweetAlert** | User feedback modals              |

---

## 📂 Folder Structure

```bash
📁 client/                # React frontend
📁 server/                # Node + Express backend
  └── 📁 controllers/
  └── 📁 routes/
  └── 📁 models/
  └── 📁 middleware/
  └── 📁 config/
