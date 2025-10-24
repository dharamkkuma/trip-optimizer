#!/bin/bash

# Ultra-quick Kubernetes deployment - One command does everything!

echo "🚀 Quick K8s Deploy - Building and deploying everything..."

# Start Minikube if not running
minikube start --driver=docker 2>/dev/null || true

# Set Docker environment
eval $(minikube docker-env)

# Build images
echo "📦 Building images..."
docker build -t trip-optimizer-backend:latest ./backend/ >/dev/null 2>&1
docker build -t trip-optimizer-frontend:latest ./frontend/ >/dev/null 2>&1

# Clean up and deploy
echo "🔄 Deploying to Kubernetes..."
kubectl delete deployment frontend backend 2>/dev/null || true
kubectl delete service frontend-service backend-service 2>/dev/null || true

kubectl create deployment frontend --image=trip-optimizer-frontend:latest --port=3000
kubectl create deployment backend --image=trip-optimizer-backend:latest --port=8000

kubectl patch deployment frontend -p '{"spec":{"template":{"spec":{"containers":[{"name":"trip-optimizer-frontend","imagePullPolicy":"Never"}]}}}}' >/dev/null 2>&1
kubectl patch deployment backend -p '{"spec":{"template":{"spec":{"containers":[{"name":"trip-optimizer-backend","imagePullPolicy":"Never"}]}}}}' >/dev/null 2>&1

kubectl expose deployment frontend --port=3000 --name=frontend-service
kubectl expose deployment backend --port=8000 --name=backend-service

# Wait for pods
echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=available --timeout=60s deployment/frontend >/dev/null 2>&1
kubectl wait --for=condition=available --timeout=60s deployment/backend >/dev/null 2>&1

# Port forwarding
echo "🔗 Setting up port forwarding..."
pkill -f "kubectl port-forward" 2>/dev/null || true
kubectl port-forward service/frontend-service 3000:3000 >/dev/null 2>&1 &
kubectl port-forward service/backend-service 8000:8000 >/dev/null 2>&1 &

echo "✅ Done! Your app is running at:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔧 Backend: http://localhost:8000"
echo ""
echo "To stop everything: ./quick-k8s-deploy.sh stop"
