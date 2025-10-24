#!/bin/bash

# Trip Optimizer - Quick Kubernetes Deploy & Stop Script
# This script quickly builds images, deploys to Kubernetes, and provides easy cleanup

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to deploy to Kubernetes
deploy_to_k8s() {
    print_status "🚀 Starting Quick Kubernetes Deployment..."
    echo ""
    
    # 1. Start Minikube
    print_status "Starting Minikube..."
    if ! minikube status | grep -q "Running"; then
        minikube start --driver=docker --memory=4096 --cpus=2
    else
        print_warning "Minikube is already running"
    fi
    
    # 2. Set Docker environment for Minikube
    print_status "Setting Docker environment for Minikube..."
    eval $(minikube docker-env)
    
    # 3. Build Docker images
    print_status "Building Docker images..."
    docker build -t trip-optimizer-backend:latest ./backend/
    print_success "Backend image built"
    
    docker build -t trip-optimizer-frontend:latest ./frontend/
    print_success "Frontend image built"
    
    # 4. Clean up existing deployments
    print_status "Cleaning up existing deployments..."
    kubectl delete deployment frontend backend 2>/dev/null || true
    kubectl delete service frontend-service backend-service 2>/dev/null || true
    
    # 5. Create deployments
    print_status "Creating Kubernetes deployments..."
    kubectl create deployment frontend --image=trip-optimizer-frontend:latest --port=3000
    kubectl create deployment backend --image=trip-optimizer-backend:latest --port=8000
    
    # 6. Set image pull policy to Never (use local images)
    print_status "Configuring image pull policy..."
    kubectl patch deployment frontend -p '{"spec":{"template":{"spec":{"containers":[{"name":"trip-optimizer-frontend","imagePullPolicy":"Never"}]}}}}'
    kubectl patch deployment backend -p '{"spec":{"template":{"spec":{"containers":[{"name":"trip-optimizer-backend","imagePullPolicy":"Never"}]}}}}'
    
    # 7. Create services
    print_status "Creating services..."
    kubectl expose deployment frontend --port=3000 --name=frontend-service
    kubectl expose deployment backend --port=8000 --name=backend-service
    
    # 8. Wait for pods to be ready
    print_status "Waiting for pods to be ready..."
    kubectl wait --for=condition=available --timeout=120s deployment/frontend
    kubectl wait --for=condition=available --timeout=120s deployment/backend
    
    # 9. Set up port forwarding
    print_status "Setting up port forwarding..."
    pkill -f "kubectl port-forward" 2>/dev/null || true
    kubectl port-forward service/frontend-service 3000:3000 &
    kubectl port-forward service/backend-service 8000:8000 &
    
    # 10. Show status
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "Your application is now running:"
    echo "  🌐 Frontend: http://localhost:3000"
    echo "  🔧 Backend API: http://localhost:8000"
    echo "  ❤️  Health Check: http://localhost:8000/health"
    echo ""
    print_status "Useful commands:"
    echo "  kubectl get pods"
    echo "  kubectl get services"
    echo "  kubectl logs -f deployment/frontend"
    echo "  kubectl logs -f deployment/backend"
    echo "  minikube dashboard"
    echo ""
    print_warning "To stop everything, run: $0 stop"
}

# Function to stop everything
stop_k8s() {
    print_status "🛑 Stopping Kubernetes deployment..."
    echo ""
    
    # Stop port forwarding
    print_status "Stopping port forwarding..."
    pkill -f "kubectl port-forward" 2>/dev/null || true
    
    # Delete deployments and services
    print_status "Deleting deployments and services..."
    kubectl delete deployment frontend backend 2>/dev/null || true
    kubectl delete service frontend-service backend-service 2>/dev/null || true
    
    # Stop Minikube (optional)
    read -p "Do you want to stop Minikube? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping Minikube..."
        minikube stop
        print_success "Minikube stopped"
    else
        print_status "Minikube left running"
    fi
    
    print_success "✅ Cleanup completed!"
}

# Function to show status
show_status() {
    print_status "📊 Current Status:"
    echo ""
    
    if minikube status | grep -q "Running"; then
        print_success "Minikube: Running"
        echo ""
        print_status "Pods:"
        kubectl get pods 2>/dev/null || print_warning "No pods found"
        echo ""
        print_status "Services:"
        kubectl get services 2>/dev/null || print_warning "No services found"
        echo ""
        print_status "Port Forwarding:"
        ps aux | grep "kubectl port-forward" | grep -v grep || print_warning "No port forwarding active"
    else
        print_warning "Minikube: Not running"
    fi
}

# Main script logic
case "${1:-deploy}" in
    "deploy"|"start")
        deploy_to_k8s
        ;;
    "stop"|"cleanup")
        stop_k8s
        ;;
    "status")
        show_status
        ;;
    "restart")
        stop_k8s
        sleep 2
        deploy_to_k8s
        ;;
    *)
        echo "Usage: $0 [deploy|stop|status|restart]"
        echo ""
        echo "Commands:"
        echo "  deploy (default) - Build images and deploy to Kubernetes"
        echo "  stop            - Stop all services and cleanup"
        echo "  status          - Show current deployment status"
        echo "  restart         - Stop and redeploy everything"
        echo ""
        echo "Examples:"
        echo "  $0              # Deploy everything"
        echo "  $0 deploy       # Deploy everything"
        echo "  $0 stop         # Stop everything"
        echo "  $0 status       # Show status"
        echo "  $0 restart      # Restart everything"
        exit 1
        ;;
esac
