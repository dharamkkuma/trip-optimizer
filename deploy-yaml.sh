#!/bin/bash

# Trip Optimizer - Deploy with YAML (The Right Way!)
# This script builds images and applies the complete YAML manifest

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

# Function to deploy with YAML
deploy_with_yaml() {
    print_status "🚀 Deploying Trip Optimizer with YAML manifests..."
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
    
    # 4. Apply the complete YAML manifest
    print_status "Applying Kubernetes manifests..."
    kubectl apply -f k8s-manifests.yaml
    print_success "All resources created"
    
    # 5. Wait for deployments to be ready
    print_status "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=120s deployment/backend -n trip-optimizer
    kubectl wait --for=condition=available --timeout=120s deployment/frontend -n trip-optimizer
    kubectl wait --for=condition=available --timeout=120s deployment/redis -n trip-optimizer
    kubectl wait --for=condition=available --timeout=120s deployment/mongodb -n trip-optimizer
    
    # 6. Set up port forwarding
    print_status "Setting up port forwarding..."
    pkill -f "kubectl port-forward" 2>/dev/null || true
    kubectl port-forward service/frontend-service 3000:3000 -n trip-optimizer &
    kubectl port-forward service/backend-service 8000:8000 -n trip-optimizer &
    kubectl port-forward service/redis-service 6379:6379 -n trip-optimizer &
    kubectl port-forward service/mongodb-service 27017:27017 -n trip-optimizer &
    
    # 7. Show status
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "Your complete application stack is now running:"
    echo "  🌐 Frontend: http://localhost:3000"
    echo "  🔧 Backend API: http://localhost:8000"
    echo "  ❤️  Health Check: http://localhost:8000/health"
    echo "  🔴 Redis: localhost:6379"
    echo "  🍃 MongoDB: localhost:27017"
    echo ""
    print_status "All services are in the 'trip-optimizer' namespace:"
    echo "  kubectl get all -n trip-optimizer"
    echo ""
    print_status "Useful commands:"
    echo "  kubectl get pods -n trip-optimizer"
    echo "  kubectl get services -n trip-optimizer"
    echo "  kubectl logs -f deployment/frontend -n trip-optimizer"
    echo "  kubectl logs -f deployment/backend -n trip-optimizer"
    echo "  kubectl logs -f deployment/redis -n trip-optimizer"
    echo "  kubectl logs -f deployment/mongodb -n trip-optimizer"
    echo "  minikube dashboard"
    echo ""
    print_warning "To stop everything, run: $0 stop"
}

# Function to stop everything
stop_deployment() {
    print_status "🛑 Stopping Trip Optimizer deployment..."
    echo ""
    
    # Stop port forwarding
    print_status "Stopping port forwarding..."
    pkill -f "kubectl port-forward" 2>/dev/null || true
    
    # Delete all resources
    print_status "Deleting all resources..."
    kubectl delete -f k8s-manifests.yaml 2>/dev/null || true
    
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
        print_status "All resources in trip-optimizer namespace:"
        kubectl get all -n trip-optimizer 2>/dev/null || print_warning "No resources found in trip-optimizer namespace"
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
        deploy_with_yaml
        ;;
    "stop"|"cleanup")
        stop_deployment
        ;;
    "status")
        show_status
        ;;
    "restart")
        stop_deployment
        sleep 2
        deploy_with_yaml
        ;;
    *)
        echo "Usage: $0 [deploy|stop|status|restart]"
        echo ""
        echo "Commands:"
        echo "  deploy (default) - Build images and deploy with YAML"
        echo "  stop            - Stop all services and cleanup"
        echo "  status          - Show current deployment status"
        echo "  restart         - Stop and redeploy everything"
        echo ""
        echo "Examples:"
        echo "  $0              # Deploy everything with YAML"
        echo "  $0 deploy       # Deploy everything with YAML"
        echo "  $0 stop         # Stop everything"
        echo "  $0 status       # Show status"
        echo "  $0 restart      # Restart everything"
        echo ""
        echo "This is the PROPER way to deploy to Kubernetes!"
        echo "Uses a single YAML file with all resources defined."
        exit 1
        ;;
esac
