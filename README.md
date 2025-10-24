# Trip Optimizer - Simple Frontend with Login

## Overview
Simple frontend with admin/admin login functionality.

## Features
- ✅ Simple login form with admin/admin credentials
- ✅ Clean UI with Tailwind CSS
- ✅ Local authentication with API endpoint
- ✅ Post-login dashboard

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)



### Environment Setup

Before running docker-compose, you need to set up environment files:

#### Backend Environment:
```bash
# Copy development environment
cp backend/env.development backend/.env

# Or copy production environment
cp backend/env.production backend/.env
```

#### Frontend Environment:
```bash
# Copy development environment
cp frontend/env.development frontend/.env.local

# Or copy production environment
cp frontend/env.production frontend/.env.local
```


**Note**: The `.env` files contain sensitive configuration and are gitignored. Always use the template files (`env.development`, `env.production`) as starting points.



### Run with Docker
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Access Points
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000


### Login Credentials
- **Username**: `admin`
- **Password**: `admin`

## Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Project Structure

```
trip-optimizer/
├── frontend/               # Next.js React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Next.js pages
│   │   └── utils/        # API utilities
│   └── package.json
├── backend/               # FastAPI backend
│   ├── app/
│   │   └── main.py       # API endpoints
│   └── requirements.txt
└── docker-compose.yml    # Services configuration
```

## API Endpoints

### POST /login
Login with admin/admin credentials

**Request:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "username": "admin",
    "name": "Administrator",
    "role": "admin",
    "login_time": "2024-01-15T10:30:00"
  }
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00"
}
```
