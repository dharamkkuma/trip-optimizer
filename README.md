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



### Run with Docker for Quick testing
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps
```


## Minikube Deployment

Deploy your entire application stack (Frontend, Backend, Redis, MongoDB) to Minikube on your Mac.

### Prerequisites

- [Minikube](https://minikube.sigs.k8s.io/docs/start/) installed
- [kubectl](https://kubernetes.io/docs/tasks/tools/) installed
- [Docker](https://docs.docker.com/get-docker/) installed

### 🚀 Super Simple Deployment (Choose One!)

**Option 1: Deploy Quickly - Ultra-Quick One-Liner (FASTEST!)**
```bash
./k8s-quick.sh
```

**Option 2: Full Control Script (Recommended)** 
```bash
./quick-k8s-deploy.sh <START/STOP>
```


### Access Your Application

After deployment, access your application at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Minikube Dashboard**: `minikube dashboard`

### Useful Commands

```bash
# Check deployment status
kubectl get pods
kubectl get services
kubectl get ingress

# View logs
kubectl logs -f deployment/backend-deployment
kubectl logs -f deployment/frontend-deployment

# Scale services
kubectl scale deployment backend-deployment --replicas=3

# Access Minikube shell
minikube ssh
```

### Cleanup

**Quick Stop (Recommended):**
```bash
./quick-k8s-deploy.sh stop
```

**Manual Cleanup:**
```bash
# Stop port forwarding
pkill -f "kubectl port-forward"

# Delete deployments
kubectl delete deployment frontend backend

# Delete services
kubectl delete service frontend-service backend-service

# Stop Minikube (optional)
minikube stop
```

## Troubleshooting

### Common Issues

**1. Minikube won't start**
```bash
# Check if Docker is running
docker ps

# Try with different driver
minikube start --driver=hyperkit  # For Mac with HyperKit
minikube start --driver=virtualbox  # For VirtualBox
```

**2. Images not found in Minikube**
```bash
# Make sure you're using Minikube's Docker daemon
eval $(minikube docker-env)

# Rebuild images
docker build -t trip-optimizer-backend:latest ./backend/
docker build -t trip-optimizer-frontend:latest ./frontend/
```

**3. Pods stuck in Pending state**
```bash
# Check pod status
kubectl describe pod <pod-name>

# Check node resources
kubectl top nodes
kubectl describe nodes
```

**4. Services not accessible**
```bash
# Check service endpoints
kubectl get endpoints

# Test service connectivity
kubectl run test-pod --image=busybox --rm -it -- nslookup backend-service
```

**5. Port forwarding issues**
```bash
# Kill existing port forwards
pkill -f "kubectl port-forward"

# Restart port forwarding
kubectl port-forward service/frontend-service 3000:3000 &
kubectl port-forward service/backend-service 8000:8000 &
```

### Getting Help

- Check pod logs: `kubectl logs -f deployment/backend-deployment`
- View Minikube dashboard: `minikube dashboard`
- Access Minikube shell: `minikube ssh`
- Reset Minikube: `minikube delete && minikube start`




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
│   ├── Dockerfile
│   └── package.json
├── backend/               # FastAPI backend
│   ├── app/
│   │   └── main.py       # API endpoints
│   ├── Dockerfile
│   └── requirements.txt
├── k8s/                   # Kubernetes manifests
│   ├── configmaps/       # Configuration maps
│   ├── secrets/          # Kubernetes secrets
│   ├── services/         # Kubernetes services
│   ├── deployments/      # Kubernetes deployments
│   └── ingress/          # Ingress configuration
├── scripts/               # Deployment scripts
│   ├── deploy-to-minikube.sh
│   ├── cleanup-minikube.sh
│   └── validate-setup.sh
├── docker-compose.yml    # Docker Compose configuration
└── README.md
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
