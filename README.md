# TaskFlow — Production-Ready Task Management Platform

A modern, full-stack task management platform built with Node.js 22, Express, Sequelize, PostgreSQL, Docker, and Nginx...

---

## 🚀 Quick Start

```bash
# Clone / enter project
cd taskflow

# Build and start all services
docker compose up --build

# Open browser
open http://localhost
```

Seeded with 12 sample tasks on first boot.

---

## 🏗 Architecture

```
Browser
  └── Nginx :80  (reverse proxy + static files)
        ├── /           → Frontend (Nginx static server :8080)
        ├── /api/*      → Backend (Express :3000)
        ├── /metrics    → Backend metrics
        └── /health     → Nginx + Backend health
              └── PostgreSQL :5432
```

## 📁 Project Structure

```
taskflow/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── config/database.js
│       ├── models/Task.js
│       ├── controllers/taskController.js
│       └── routes/tasks.js
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js
└── nginx/
    ├── Dockerfile
    └── nginx.conf
```

---

## 🔌 API Reference

### Health & Metrics
| Method | Endpoint   | Description           |
|--------|------------|-----------------------|
| GET    | /health    | Service health check  |
| GET    | /metrics   | Aggregated statistics |

### Tasks
| Method | Endpoint        | Description      |
|--------|-----------------|------------------|
| GET    | /api/tasks      | List tasks       |
| GET    | /api/tasks/:id  | Get single task  |
| POST   | /api/tasks      | Create task      |
| PUT    | /api/tasks/:id  | Update task      |
| DELETE | /api/tasks/:id  | Delete task      |

### Query Parameters (GET /api/tasks)
| Param      | Values                              | Default      |
|------------|-------------------------------------|--------------|
| page       | number                              | 1            |
| limit      | number (max 100)                    | 10           |
| search     | string                              | ""           |
| priority   | Low, Medium, High, Critical         | all          |
| status     | Todo, In Progress, Done             | all          |
| sortBy     | title, priority, estimated_hours, created_at, status | created_at |
| sortOrder  | ASC, DESC                           | DESC         |

### Task Payload
```json
{
  "title": "string (required, max 255)",
  "description": "string (optional)",
  "priority": "Low | Medium | High | Critical",
  "status": "Todo | In Progress | Done",
  "estimated_hours": "number (optional, 0–9999.99)"
}
```

---

## 🐳 Services

| Service  | Container          | Internal Port | External |
|----------|--------------------|---------------|----------|
| Nginx    | taskflow_nginx     | 80            | 80       |
| Frontend | taskflow_frontend  | 8080          | —        |
| Backend  | taskflow_backend   | 3000          | —        |
| Postgres | taskflow_db        | 5432          | —        |

---

## 🛠 Commands

```bash
# Start
docker compose up -d --build

# Logs
docker compose logs -f backend
docker compose logs -f nginx

# Stop
docker compose down

# Wipe data
docker compose down -v

# Shell into backend
docker exec -it taskflow_backend sh

# Shell into DB
docker exec -it taskflow_db psql -U taskflow_user -d taskflow
```

---

## ✨ Features

- **CRUD tasks** with title, description, priority, status, estimated hours
- **Real-time search** with debouncing
- **Sort** by any column (click header)
- **Filter** by priority and status
- **Pagination** with configurable page size
- **Statistics** dashboard with live metrics
- **Toast notifications** for all actions
- **Loading skeletons** while data fetches
- **Empty states** with action prompts
- **Add / Edit / Delete** modals with animation
- **Keyboard accessible** (Escape to close modals)
- **Responsive** down to mobile
- **Health checks** on all containers
- **Auto-retry** database connection on boot
- **12 sample tasks** seeded on first run
