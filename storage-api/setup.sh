#!/bin/bash

# Storage API Setup Script for Conda

echo "🚀 Setting up Storage API with Conda..."

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "❌ Conda is not installed. Please install Miniconda or Anaconda first."
    echo "   Download from: https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

# Create conda environment
echo "📦 Creating conda environment 'storage-api'..."
conda env create -f environment.yml

# Activate environment
echo "🔄 Activating environment..."
conda activate storage-api

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your AWS credentials and other settings"
fi

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Activate the environment: conda activate storage-api"
echo "2. Run the app: python run.py"
echo ""
echo "Or use Docker:"
echo "docker-compose up --build"
