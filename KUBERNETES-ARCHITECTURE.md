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
│  ┌─────────────┐            │                   │                               │
│  │    Redis    │            │                   │                               │
│  │    Pod      │            │                   │                               │
│  │             │            │                   │                               │
│  │ Port: 6379  │            │                   │                               │
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
│  │  redis-service       → redis-pod:6379                                      │ │
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
│  localhost:6379         ←→  redis-service                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Secrets Management in Kubernetes

### **Why Use Kubernetes Secrets?**

Kubernetes Secrets provide several security benefits over storing sensitive data in ConfigMaps:

#### **🔐 Security Benefits:**
```yaml
# ❌ BAD: Sensitive data in ConfigMap (visible to anyone)
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  JWT_SECRET_KEY: "my-super-secret-key"  # Anyone can see this!
  DB_PASSWORD: "password123"             # Exposed in plain text!

# ✅ GOOD: Sensitive data in Secret (encrypted at rest)
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  JWT_SECRET_KEY: ZGV2LXNlY3JldC1rZXktY2hhbmdlLWluLXByb2R1Y3Rpb24=  # Base64 encoded
  DB_PASSWORD: cGFzc3dvcmQxMjM=  # Base64 encoded
```

#### **🛡️ Access Control & RBAC:**
- Secrets can be restricted with Kubernetes RBAC
- Only specific pods/users can access secrets
- ConfigMaps are readable by anyone with pod access
- Better audit trail for secret access

#### **🔄 Encryption at Rest:**
- Kubernetes can encrypt secrets in etcd
- ConfigMaps are stored in plain text
- Secrets support encryption providers (AWS KMS, Azure Key Vault, etc.)

### **Current Implementation:**

Our manifests use Kubernetes Secrets for:
- **JWT Secret Keys** - For token signing and validation
- **Database Credentials** - MongoDB username/password
- **AWS Credentials** - For S3 storage access
- **API Keys** - Google Maps, Stripe, etc.

### **Production Alternatives:**

#### **Option 1: External Secrets Operator**
```yaml
# Connect to AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: auth-api-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: auth-api-secrets
  data:
  - secretKey: JWT_SECRET_KEY
    remoteRef:
      key: trip-optimizer/jwt-secret
```

#### **Option 2: HashiCorp Vault Integration**
```yaml
# Use Vault Agent Injector
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-api
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "trip-optimizer"
        vault.hashicorp.com/agent-inject-secret-jwt: "secret/data/jwt"
```

#### **Option 3: Cloud Provider Secrets**
- **AWS**: AWS Secrets Manager + External Secrets Operator
- **Azure**: Azure Key Vault + CSI Driver
- **GCP**: Secret Manager + External Secrets Operator

### **Development vs Production:**

| Environment | Approach | Pros | Cons |
|-------------|----------|------|------|
| **Development** | ConfigMaps | Simple setup | Less secure |
| **Development** | Kubernetes Secrets | Better security | More complex |
| **Production** | External Secrets | Best security | Requires setup |
| **Production** | Cloud Secrets | Enterprise grade | Vendor lock-in |

### **Quick Secret Management Commands:**

```bash
# Create secrets manually
kubectl create secret generic auth-api-secrets \
  --from-literal=JWT_SECRET_KEY="your-secret-key" \
  --from-literal=DB_PASSWORD="your-password"

# Create secrets from files
kubectl create secret generic app-secrets \
  --from-file=./secrets/jwt-key.txt \
  --from-file=./secrets/db-password.txt

# View secrets (base64 encoded)
kubectl get secret auth-api-secrets -o yaml

# Decode secret values
echo "ZGV2LXNlY3JldC1rZXk=" | base64 --decode

# Update secrets
kubectl patch secret auth-api-secrets -p='{"data":{"JWT_SECRET_KEY":"'$(echo -n "new-secret" | base64)'"}}'
```

### **Security Best Practices:**

1. **Never commit secrets to Git**
2. **Use different secrets for different environments**
3. **Rotate secrets regularly**
4. **Use least privilege access**
5. **Monitor secret access**
6. **Use external secret management in production**

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

# Redis Pod
kubectl run redis --image=redis:7-alpine --port=6379
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

# Redis Service
kubectl expose pod redis --port=6379 --name=redis-service
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

# Redis
kubectl port-forward service/redis-service 6379:6379
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
Backend Pod  → redis-service:6379 → Redis Pod
Auth API Pod → redis-service:6379 → Redis Pod
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
kubectl scale deployment redis --replicas=2
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
   Backend Pod → redis-service:6379 → Redis Pod (caching)
   ```

5. **Database API retrieves user data:**
   ```
   Database API Pod → mongodb-service:27017 → MongoDB Pod
   ```

6. **Auth API validates tokens and manages authentication:**
   ```
   Auth API Pod → database-api-service:8002 → Database API Pod (user validation)
   Auth API Pod → redis-service:6379 → Redis Pod (session storage)
   ```

7. **Storage API handles file operations:**
   ```
   Storage API Pod → mongodb-service:27017 → MongoDB Pod (metadata)
   Storage API Pod → External Storage (S3, etc.) → File Storage
   ```

8. **Complete Response Flow:**
   ```
   MongoDB → Database API → Auth API → Frontend → Your Browser
   MongoDB → Database API → Backend → Frontend → Your Browser
   MongoDB → Storage API → Backend → Frontend → Your Browser
   Redis → Auth API → Frontend → Your Browser (cached responses)
   ```

### **Service Responsibilities:**

| Service | Port | Purpose | Dependencies |
|---------|------|---------|--------------|
| **Frontend** | 3000 | React UI | Backend API, Auth API |
| **Backend** | 8000 | Main API | Database-API, Storage-API, Auth-API, Redis |
| **Database-API** | 8002 | User Management | MongoDB |
| **Storage-API** | 8001 | File Storage | MongoDB |
| **Auth-API** | 8003 | Authentication & JWT | Database-API, Redis |
| **MongoDB** | 27017 | Database | None |
| **Redis** | 6379 | Caching & Sessions | None |

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
kubectl create secret generic auth-api-secrets \
  --from-literal=JWT_SECRET_KEY="your-jwt-secret" \
  --from-literal=MONGODB_USERNAME="admin" \
  --from-literal=MONGODB_PASSWORD="password"

kubectl create secret generic database-api-secrets \
  --from-literal=JWT_SECRET="your-jwt-secret" \
  --from-literal=MONGODB_USERNAME="admin" \
  --from-literal=MONGODB_PASSWORD="password"

kubectl create secret generic storage-api-secrets \
  --from-literal=AWS_ACCESS_KEY_ID="your-aws-key" \
  --from-literal=AWS_SECRET_ACCESS_KEY="your-aws-secret"
```

### **3. ConfigMaps**
```bash
# Store configuration separately for each service
kubectl create configmap backend-config --from-file=backend.env
kubectl create configmap frontend-config --from-file=frontend.env
kubectl create configmap auth-api-config --from-file=auth-api.env
kubectl create configmap database-api-config --from-file=database-api.env
kubectl create configmap storage-api-config --from-file=storage-api.env
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
- **Redis**: localhost:6379

### **Kubernetes Service Names:**
- `frontend-service:3000`
- `backend-service:8000`
- `storage-api-service:8001`
- `database-api-service:8002`
- `auth-api-service:8003`
- `mongodb-service:27017`
- `redis-service:6379`

### **Quick Commands:**
```bash
# Start all services
kubectl port-forward service/frontend-service 3000:3000 &
kubectl port-forward service/backend-service 8000:8000 &
kubectl port-forward service/storage-api-service 8001:8001 &
kubectl port-forward service/database-api-service 8002:8002 &
kubectl port-forward service/auth-api-service 8003:8003 &
kubectl port-forward service/mongodb-service 27017:27017 &
kubectl port-forward service/redis-service 6379:6379 &

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
kubectl logs redis

# Deploy everything at once
kubectl apply -f k8s-manifests.yaml

# Check deployment status
kubectl get deployments
kubectl get pods -o wide
```
