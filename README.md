# Trip Optimizer - AI-Powered Travel Expense & Optimization Platform

## Overview

Trip Optimizer is an intelligent travel management platform that combines document processing, ML-based expense extraction, and AI-powered travel optimization. The system automatically processes travel invoices (hotels and flights), extracts structured data using machine learning, and continuously monitors travel APIs to find better pricing opportunities for your trips.

## System Architecture

![System Architecture](assets/architecture.png)

## Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | React + Next.js | UI framework |
| | Tailwind CSS | Styling |
| **Backend** | Python | Backend services |
| | Node.js | Additional services |
| **Database** | MongoDB | Primary database + Vector search |
| | Redis | Semantic caching, Auth token storage, Pub/Sub messaging |
| **Storage** | AWS S3 | File storage |
| **AI/ML** | DeDoc | OCR + Layout parsing |
| | Voyage-3-large | Embeddings |
| | Mistral 7B(v0.3) / Llama 2 7B / gemma3:4b (Text, Image) | LLMs |
| | LayoutLMv3 + LoRA | PDF extraction model tuning |
| **Infrastructure** | Docker + Docker Compose | Containerization |
| | Kubernetes (Minikube) | Deployment |
| | AWS Cognito | Authentication |
| | Atlas Search | Autocomplete capabilities |
| **Automation** | K8s Cron Jobs | Scheduled tasks |
| | Periodic model fine-tuning | ML model updates |

## Features

1. 📄 Invoice Upload & AI-Powered Parsing
2. 🔍 Autonomous Travel Optimization
3. 💬 Conversational AI Interface (RAG)

![Feature Overview](assets/feature-diagram.png)

### 1. 📄 Invoice Upload & AI-Powered Parsing
Users upload hotel and flight invoices (PDF format)

Machine learning models extract structured data:
- Flight details (dates, routes, prices, booking references)
- Hotel information (check-in/out, location, costs, amenities)
- Passenger/guest details

### 2. 🔍 Autonomous Travel Optimization
- **Continuous Monitoring**: AI agents periodically scan external travel APIs
- **💰 Price Optimization**: Identifies better flight and hotel deals
- **🎯 Smart Recommendations**: Suggests optimal rebooking opportunities
- **📊 Savings Tracking**: Monitors potential cost savings
- **⚡ Real-time Alerts**: Notifies users of significant price drops

### 3. 💬 Conversational AI Interface (RAG)
- **Context-Aware Chat**: Ask questions about your travel documents
- **📚 Multi-Document Queries**: Search across all uploaded invoices
- **🧠 Intelligent Retrieval**: RAG-powered responses with source citations
- **🗺️ Trip Planning Assistance**: General travel advice and recommendations
- **📈 Expense Analysis**: Query spending patterns and trip costs

## Quick Start

### Prerequisites

Before running the application, ensure you have:

- **Docker Desktop** installed and running
- **Minikube** installed (`brew install minikube` on macOS)
- **kubectl** installed (`brew install kubectl` on macOS)
- **Git** installed

### First Time Setup

1. **Clone and navigate to the repository:**
   ```bash
   git clone <repository-url>
   cd trip-optimizer
   ```

2. **Start the application:**
   ```bash
   ./deploy-yaml.sh
   ```

   This will:
   - Start Minikube (if not running)
   - Build all Docker images with latest code
   - Deploy all services to Kubernetes
   - Set up port forwarding
   - Show you the access URLs

### Application Commands

| Command | Description | What It Does |
|---------|-------------|--------------|
| `./deploy-yaml.sh` | **Start Everything** | Builds fresh images, deploys to Kubernetes, sets up port forwarding |
| `./deploy-yaml.sh build` | **Build Images Only** | Builds all Docker images without deploying (useful for testing) |
| `./deploy-yaml.sh status` | **Check Status** | Shows all pods, services, port forwarding, and available images |
| `./deploy-yaml.sh list-images` | **Show Images** | Lists all Docker images available in Minikube |
| `./deploy-yaml.sh port-forward` | **Fix Connections** | Restarts port forwarding if APIs are not accessible |
| `./deploy-yaml.sh restart` | **Restart Everything** | Stops and redeploys everything with fresh images |
| `./deploy-yaml.sh stop` | **Stop Everything** | Stops all services and cleans up |

### Daily Usage

**To start the application:**
```bash
./deploy-yaml.sh
```

**To check if everything is running:**
```bash
./deploy-yaml.sh status
```

**To restart with fresh code changes:**
```bash
./deploy-yaml.sh restart
```

**To stop everything:**
```bash
./deploy-yaml.sh stop
```

## 🌐 Access URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Main application |
| **Backend API** | http://localhost:8000 | Core API |
| **Auth API** | http://localhost:8003 | Authentication |
| **Database API** | http://localhost:8002 | Data management |
| **Storage API** | http://localhost:8001 | File storage |

## 👤 Admin Access

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `Admin123!` |
| **Email** | `admin@tripoptimizer.com` |
| **Role** | Administrator |

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. **"Failed to fetch" or API Connection Errors**

**Problem:** Frontend can't connect to backend APIs
**Solution:**
```bash
# Restart port forwarding
./deploy-yaml.sh port-forward

# Or restart everything
./deploy-yaml.sh restart
```

#### 2. **"Image not found" or Outdated Code**

**Problem:** Changes to code not reflected in running application
**Solution:**
```bash
# Build fresh images and redeploy
./deploy-yaml.sh restart

# Or just build images first
./deploy-yaml.sh build
./deploy-yaml.sh restart
```

#### 3. **Minikube Not Starting**

**Problem:** Minikube fails to start
**Solution:**
```bash
# Check Docker Desktop is running
# Then try:
minikube delete
minikube start --driver=docker --memory=4096 --cpus=2
```

#### 4. **Port Already in Use**

**Problem:** Port forwarding fails because ports are already in use
**Solution:**
```bash
# Kill existing port forwarding processes
pkill -f "kubectl port-forward"

# Then restart
./deploy-yaml.sh port-forward
```

#### 5. **Services Not Ready**

**Problem:** Pods are stuck in "Pending" or "CrashLoopBackOff"
**Solution:**
```bash
# Check pod status
kubectl get pods -n trip-optimizer

# Check pod logs
kubectl logs -f deployment/database-api -n trip-optimizer

# Restart specific deployment
kubectl rollout restart deployment/database-api -n trip-optimizer
```

#### 6. **Database Connection Issues**

**Problem:** Database API can't connect to MongoDB
**Solution:**
```bash
# Check if MongoDB is running
kubectl get pods -n trip-optimizer | grep mongodb

# Restart MongoDB if needed
kubectl rollout restart deployment/mongodb -n trip-optimizer
```

### Debugging Commands

```bash
# Check overall status
./deploy-yaml.sh status

# View all resources
kubectl get all -n trip-optimizer

# Check pod logs
kubectl logs -f deployment/frontend -n trip-optimizer
kubectl logs -f deployment/backend -n trip-optimizer
kubectl logs -f deployment/database-api -n trip-optimizer

# Check available images
./deploy-yaml.sh list-images

# Test API endpoints
curl http://localhost:8000/health
curl http://localhost:8002/api/health
curl http://localhost:8003/api/v1/health
```

### Performance Tips

- **Memory Issues:** Ensure Docker Desktop has at least 4GB RAM allocated
- **Slow Builds:** Use `./deploy-yaml.sh build` to build images separately
- **Port Conflicts:** Use `./deploy-yaml.sh port-forward` to restart port forwarding
- **Clean Restart:** Use `./deploy-yaml.sh stop` then `./deploy-yaml.sh` for a clean start

## 👨‍💻 Development

### Working with Code Changes

When you make changes to the code, you need to rebuild the images:

```bash
# Quick restart with fresh code
./deploy-yaml.sh restart

# Or step by step:
./deploy-yaml.sh build    # Build fresh images
./deploy-yaml.sh restart  # Deploy with new images
```

### Service-Specific Development

**Frontend Development:**
```bash
# Check frontend logs
kubectl logs -f deployment/frontend -n trip-optimizer

# Restart only frontend
kubectl rollout restart deployment/frontend -n trip-optimizer
```

**Backend Development:**
```bash
# Check backend logs
kubectl logs -f deployment/backend -n trip-optimizer

# Restart only backend
kubectl rollout restart deployment/backend -n trip-optimizer
```

**Database API Development:**
```bash
# Check database API logs
kubectl logs -f deployment/database-api -n trip-optimizer

# Restart only database API
kubectl rollout restart deployment/database-api -n trip-optimizer
```

### Testing Individual Services

```bash
# Test backend health
curl http://localhost:8000/health

# Test database API health
curl http://localhost:8002/api/health

# Test auth API health
curl http://localhost:8003/api/v1/health

# Test storage API health
curl http://localhost:8001/health
```

### Environment Variables

The application uses environment variables configured in Kubernetes ConfigMaps and Secrets. Key configurations:

- **MongoDB:** `mongodb://mongodb-service:27017/trip_optimizer`
- **Redis:** `redis://redis-service:6379`
- **JWT Secret:** Configured in Kubernetes secrets
- **CORS Origins:** Configured for localhost and service-to-service communication

## 📋 Quick Reference

### Most Common Commands

```bash
# Start everything
./deploy-yaml.sh

# Check status
./deploy-yaml.sh status

# Restart with fresh code
./deploy-yaml.sh restart

# Stop everything
./deploy-yaml.sh stop

# Fix connection issues
./deploy-yaml.sh port-forward
```

### Health Check URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:8000/health
- Database API: http://localhost:8002/api/health
- Auth API: http://localhost:8003/api/v1/health
- Storage API: http://localhost:8001/health

### Admin Login

- **URL:** http://localhost:3000
- **Username:** `admin`
- **Password:** `Admin123!`

---

**Need Help?** Check the troubleshooting section above or run `./deploy-yaml.sh status` to see the current state of all services.