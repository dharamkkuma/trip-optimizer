# Kubernetes Deployment Architecture

## How Your Application Works in Kubernetes

```
┌─────────────────────────────────────────────────────────────────┐
│                        MINIKUBE CLUSTER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Frontend  │    │   Backend   │    │    Redis    │         │
│  │    Pod      │    │    Pod      │    │    Pod      │         │
│  │             │    │             │    │             │         │
│  │ Port: 3000  │    │ Port: 8000  │    │ Port: 6379  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│  ┌─────────────┐            │                                   │
│  │   MongoDB   │            │                                   │
│  │    Pod      │            │                                   │
│  │             │            │                                   │
│  │ Port: 27017 │            │                                   │
│  └─────────────┘            │                                   │
│                             │                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Kubernetes Services                          │ │
│  │                                                             │ │
│  │  frontend-service → frontend-pod:3000                      │ │
│  │  backend-service  → backend-pod:8000                       │ │
│  │  redis-service    → redis-pod:6379                         │ │
│  │  mongodb-service  → mongodb-pod:27017                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Port Forwarding
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL MACHINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  http://localhost:3000  ←→  frontend-service                   │
│  http://localhost:8000  ←→  backend-service                    │
│  localhost:6379         ←→  redis-service                      │
│  localhost:27017        ←→  mongodb-service                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Deployment Process

### 1. **Pod Creation**
```bash
kubectl run frontend --image=trip-optimizer-frontend:latest --port=3000
```
- Creates a container running your frontend
- Assigns it a unique IP address inside the cluster
- Pod can communicate with other pods by name

### 2. **Service Creation**
```bash
kubectl expose pod frontend --port=3000 --name=frontend-service
```
- Creates a stable endpoint for your pod
- Other pods can find your frontend at `frontend-service:3000`
- Provides load balancing if you have multiple pods

### 3. **Port Forwarding**
```bash
kubectl port-forward service/frontend-service 3000:3000
```
- Maps your local port 3000 to the Kubernetes service
- Allows you to access the pod from your local machine
- Creates a tunnel: `localhost:3000` → `frontend-service:3000` → `frontend-pod:3000`

### 4. **Inter-Pod Communication**
```
Frontend Pod → backend-service:8000 → Backend Pod
Backend Pod  → redis-service:6379   → Redis Pod
Backend Pod  → mongodb-service:27017 → MongoDB Pod
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
# Scale your backend to 3 instances
kubectl scale deployment backend --replicas=3
```
- Kubernetes automatically distributes traffic
- Load balancing happens automatically

### **4. Health Checks**
- Kubernetes monitors pod health
- Automatically restarts failed pods
- Removes unhealthy pods from service

## Real-World Example

When you access `http://localhost:3000`:

1. **Request Flow:**
   ```
   Your Browser → localhost:3000 → kubectl port-forward → frontend-service → frontend-pod
   ```

2. **Frontend makes API call:**
   ```
   Frontend Pod → backend-service:8000 → Backend Pod
   ```

3. **Backend needs data:**
   ```
   Backend Pod → redis-service:6379 → Redis Pod (for caching)
   Backend Pod → mongodb-service:27017 → MongoDB Pod (for data)
   ```

4. **Response flows back:**
   ```
   MongoDB → Backend → Frontend → Your Browser
   ```

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
