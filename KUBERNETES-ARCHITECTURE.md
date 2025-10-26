# Kubernetes Deployment Architecture - Trip Optimizer

## Complete Application Architecture in Kubernetes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MINIKUBE CLUSTER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Frontend  │    │   Backend   │    │ Database-API│    │ Storage-API │     │
│  │    Pod      │    │    Pod      │    │    Pod      │    │    Pod      │     │
│  │             │    │             │    │             │    │             │     │
│  │ Port: 3000  │    │ Port: 8000  │    │ Port: 8002  │    │ Port: 8001  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │                   │           │
│         └───────────────────┼───────────────────┼───────────────────┘           │
│                             │                   │                               │
│  ┌─────────────┐            │                   │                               │
│  │   Auth-API  │            │                   │                               │
│  │    Pod      │            │                   │                               │
│  │             │            │                   │                               │
│  │ Port: 8003  │            │                   │                               │
│  └─────────────┘            │                   │                               │
│         │                   │                   │                   │           │
│         └───────────────────┼───────────────────┼───────────────────┘           │
│                             │                   │                               │
│  ┌─────────────┐            │                   │                               │
│  │   MongoDB   │            │                   │                               │
│  │    Pod      │            │                   │                               │
│  │             │            │                   │                               │
│  │ Port: 27017 │            │                   │                               │
│  └─────────────┘            │                   │                               │
│                             │                   │                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        Kubernetes Services                                  │ │
│  │                                                                             │ │
│  │  frontend-service    → frontend-pod:3000                                   │ │
│  │  backend-service     → backend-pod:8000                                    │ │
│  │  database-api-service → database-api-pod:8002                             │ │
│  │  storage-api-service → storage-api-pod:8001                               │ │
│  │  auth-api-service    → auth-api-pod:8003                                  │ │
│  │  mongodb-service     → mongodb-pod:27017                                   │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                │ Port Forwarding
                                │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            YOUR LOCAL MACHINE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  http://localhost:3000  ←→  frontend-service                                   │
│  http://localhost:8000  ←→  backend-service                                    │
│  http://localhost:8001  ←→  storage-api-service                               │
│  http://localhost:8002  ←→  database-api-service                              │
│  http://localhost:8003  ←→  auth-api-service                                   │
│  localhost:27017        ←→  mongodb-service                                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Deployment Process

### 1. **Pod Creation**
```bash
# Frontend Pod
kubectl run frontend --image=trip-optimizer-frontend:latest --port=3000

# Backend Pod
kubectl run backend --image=trip-optimizer-backend:latest --port=8000

# Database API Pod
kubectl run database-api --image=trip-optimizer-database-api:latest --port=8002

# Storage API Pod
kubectl run storage-api --image=trip-optimizer-storage-api:latest --port=8001

# Auth API Pod
kubectl run auth-api --image=trip-optimizer-auth-api:latest --port=8003

# MongoDB Pod
kubectl run mongodb --image=mongo:7.0 --port=27017
```
- Creates containers for each microservice
- Each pod gets a unique IP address inside the cluster
- Pods can communicate with each other by service name

### 2. **Service Creation**
```bash
# Frontend Service
kubectl expose pod frontend --port=3000 --name=frontend-service

# Backend Service
kubectl expose pod backend --port=8000 --name=backend-service

# Database API Service
kubectl expose pod database-api --port=8002 --name=database-api-service

# Storage API Service
kubectl expose pod storage-api --port=8001 --name=storage-api-service

# Auth API Service
kubectl expose pod auth-api --port=8003 --name=auth-api-service

# MongoDB Service
kubectl expose pod mongodb --port=27017 --name=mongodb-service
```
- Creates stable endpoints for each pod
- Services provide load balancing and service discovery
- Other pods can find services by name (e.g., `backend-service:8000`)

### 3. **Port Forwarding**
```bash
# Frontend
kubectl port-forward service/frontend-service 3000:3000

# Backend
kubectl port-forward service/backend-service 8000:8000

# Database API
kubectl port-forward service/database-api-service 8002:8002

# Storage API
kubectl port-forward service/storage-api-service 8001:8001

# Auth API
kubectl port-forward service/auth-api-service 8003:8003

# MongoDB
kubectl port-forward service/mongodb-service 27017:27017
```
- Maps local ports to Kubernetes services
- Allows access from your local machine
- Creates tunnels: `localhost:PORT` → `service-name:PORT` → `pod:PORT`

### 4. **Inter-Service Communication**
```
Frontend Pod → backend-service:8000 → Backend Pod
Frontend Pod → auth-api-service:8003 → Auth API Pod
Backend Pod  → database-api-service:8002 → Database API Pod
Backend Pod  → storage-api-service:8001 → Storage API Pod
Backend Pod  → auth-api-service:8003 → Auth API Pod
Auth API Pod → database-api-service:8002 → Database API Pod
Database API Pod → mongodb-service:27017 → MongoDB Pod
Storage API Pod → mongodb-service:27017 → MongoDB Pod
```

## Why This Architecture is Powerful

### **1. Isolation**
- Each service runs in its own container
- If one service crashes, others keep running
- Easy to scale individual services

### **2. Service Discovery**
- Pods find each other by service name
- No need to hardcode IP addresses
- Automatic load balancing

### **3. Scaling**
```bash
# Scale individual services independently
kubectl scale deployment backend --replicas=3
kubectl scale deployment database-api --replicas=2
kubectl scale deployment storage-api --replicas=2
kubectl scale deployment auth-api --replicas=2
kubectl scale deployment frontend --replicas=2
```
- Scale each microservice independently based on demand
- Kubernetes automatically distributes traffic
- Load balancing happens automatically across replicas

### **4. Health Checks**
- Kubernetes monitors pod health
- Automatically restarts failed pods
- Removes unhealthy pods from service

## Real-World Example - Trip Optimizer Flow

When you access `http://localhost:3000` (Frontend):

1. **Frontend Request Flow:**
   ```
   Your Browser → localhost:3000 → kubectl port-forward → frontend-service → frontend-pod
   ```

2. **Frontend makes API calls to Backend:**
   ```
   Frontend Pod → backend-service:8000 → Backend Pod
   ```

3. **Frontend authenticates users via Auth API:**
   ```
   Frontend Pod → auth-api-service:8003 → Auth API Pod
   ```

4. **Backend orchestrates data from multiple APIs:**
   ```
   Backend Pod → database-api-service:8002 → Database API Pod (user data)
   Backend Pod → storage-api-service:8001 → Storage API Pod (file storage)
   Backend Pod → auth-api-service:8003 → Auth API Pod (token validation)
   ```

4. **Database API retrieves user data:**
   ```
   Database API Pod → mongodb-service:27017 → MongoDB Pod
   ```

5. **Auth API validates tokens and manages authentication:**
   ```
   Auth API Pod → database-api-service:8002 → Database API Pod (user validation)
   ```

6. **Storage API handles file operations:**
   ```
   Storage API Pod → mongodb-service:27017 → MongoDB Pod (metadata)
   Storage API Pod → External Storage (S3, etc.) → File Storage
   ```

7. **Complete Response Flow:**
   ```
   MongoDB → Database API → Auth API → Frontend → Your Browser
   MongoDB → Database API → Backend → Frontend → Your Browser
   MongoDB → Storage API → Backend → Frontend → Your Browser
   ```

### **Service Responsibilities:**

| Service | Port | Purpose | Dependencies |
|---------|------|---------|--------------|
| **Frontend** | 3000 | React UI | Backend API, Auth API |
| **Backend** | 8000 | Main API | Database-API, Storage-API, Auth-API |
| **Database-API** | 8002 | User Management | MongoDB |
| **Storage-API** | 8001 | File Storage | MongoDB |
| **Auth-API** | 8003 | Authentication & JWT | Database-API |
| **MongoDB** | 27017 | Database | None |

## Benefits Over Docker Compose

| Docker Compose | Kubernetes |
|----------------|------------|
| Single machine | Multi-machine ready |
| Manual scaling | Automatic scaling |
| Basic networking | Advanced networking |
| No health checks | Built-in health checks |
| No service discovery | Automatic service discovery |
| Development only | Production ready |

## Production Considerations

### **1. Persistent Storage**
```bash
# For production, use persistent volumes
kubectl create -f mongodb-pvc.yaml
```

### **2. Secrets Management**
```bash
# Store sensitive data securely
kubectl create secret generic app-secrets --from-literal=db-password=secret
```

### **3. ConfigMaps**
```bash
# Store configuration separately
kubectl create configmap app-config --from-file=config.properties
```

### **4. Ingress for External Access**
```bash
# Expose services to the internet
kubectl create -f ingress.yaml
```

This is why Kubernetes is so powerful - it handles all the complex networking, service discovery, and scaling automatically!

## Quick Reference - All Services & Ports

### **Local Access URLs:**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Storage API**: http://localhost:8001
- **Database API**: http://localhost:8002
- **Auth API**: http://localhost:8003
- **MongoDB**: localhost:27017

### **Kubernetes Service Names:**
- `frontend-service:3000`
- `backend-service:8000`
- `storage-api-service:8001`
- `database-api-service:8002`
- `auth-api-service:8003`
- `mongodb-service:27017`

### **Quick Commands:**
```bash
# Start all services
kubectl port-forward service/frontend-service 3000:3000 &
kubectl port-forward service/backend-service 8000:8000 &
kubectl port-forward service/storage-api-service 8001:8001 &
kubectl port-forward service/database-api-service 8002:8002 &
kubectl port-forward service/auth-api-service 8003:8003 &
kubectl port-forward service/mongodb-service 27017:27017 &

# Check all pods
kubectl get pods

# Check all services
kubectl get services

# View logs
kubectl logs frontend
kubectl logs backend
kubectl logs database-api
kubectl logs storage-api
kubectl logs auth-api
kubectl logs mongodb
```
