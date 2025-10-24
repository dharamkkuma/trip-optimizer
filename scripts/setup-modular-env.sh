#!/bin/bash

# Trip Optimizer Modular Environment Setup Script
# This script helps you set up dedicated environment files for each service

set -e

echo "🚀 Trip Optimizer Modular Environment Setup"
echo "=========================================="

# Function to setup service environment
setup_service_env() {
    local service=$1
    local env_type=$2
    local source_file="${service}/env.${env_type}"
    local target_file="${service}/.env"
    
    if [ "$service" = "frontend" ]; then
        target_file="${service}/.env.local"
    fi
    
    if [ -f "$source_file" ]; then
        if [ -f "$target_file" ]; then
            echo "⚠️  ${target_file} already exists. Do you want to overwrite it? (y/N)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                cp "$source_file" "$target_file"
                echo "✅ ${service} environment file copied from $source_file to $target_file"
            else
                echo "❌ Setup cancelled for ${service}. Existing file preserved."
            fi
        else
            cp "$source_file" "$target_file"
            echo "✅ ${service} environment file copied from $source_file to $target_file"
        fi
    else
        echo "❌ Source file $source_file not found!"
        exit 1
    fi
}

# Function to show available environments
show_help() {
    echo "Usage: $0 [environment]"
    echo ""
    echo "Available environments:"
    echo "  development  - Set up development environment for all services"
    echo "  production   - Set up production environment for all services"
    echo "  help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 production"
    echo ""
    echo "This will create:"
    echo "  - backend/.env"
    echo "  - frontend/.env.local"
}

# Main script logic
case "${1:-help}" in
    "development"|"dev")
        echo "Setting up development environment for all services..."
        setup_service_env "backend" "development"
        setup_service_env "frontend" "development"
        echo ""
        echo "🔧 Development environment configured for all services!"
        echo "   - Backend: backend/.env"
        echo "   - Frontend: frontend/.env.local"
        echo "   - API URL: http://localhost:8000"
        echo "   - Frontend URL: http://localhost:3000"
        echo "   - Login: admin/admin"
        ;;
    "production"|"prod")
        echo "Setting up production environment for all services..."
        setup_service_env "backend" "production"
        setup_service_env "frontend" "production"
        echo ""
        echo "🔧 Production environment configured for all services!"
        echo "   - Remember to update all production values"
        echo "   - Set secure passwords and API keys"
        echo "   - Update domain names and URLs"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "❌ Unknown environment: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

echo ""
echo "📝 Next steps:"
echo "   1. Review and update the environment files with your specific values"
echo "   2. Run: docker-compose up -d"
echo "   3. Access your application at the configured URLs"
echo ""
echo "🎉 Modular environment setup complete!"
