#!/bin/bash

# Trip Optimizer - Git Helper Scripts

set -e

echo "🔧 Trip Optimizer Git Helpers"
echo "============================="

# Function to show git status with ignored files
show_status() {
    echo "📊 Git Status (excluding ignored files):"
    git status --porcelain
    echo ""
    echo "📁 Ignored files count:"
    git status --ignored --porcelain | wc -l
}

# Function to clean ignored files
clean_ignored() {
    echo "🧹 Cleaning ignored files..."
    git clean -fdX
    echo "✅ Cleaned ignored files"
}

# Function to show what would be ignored
show_ignored() {
    echo "📋 Files that would be ignored:"
    git status --ignored --porcelain
}

# Function to add all non-ignored files
add_all() {
    echo "📦 Adding all non-ignored files..."
    git add .
    echo "✅ Added all non-ignored files"
}

# Function to show help
show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Available commands:"
    echo "  status     - Show git status (excluding ignored files)"
    echo "  clean      - Clean ignored files"
    echo "  ignored    - Show what files are ignored"
    echo "  add        - Add all non-ignored files"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 clean"
    echo "  $0 add"
}

# Main script logic
case "${1:-help}" in
    "status")
        show_status
        ;;
    "clean")
        clean_ignored
        ;;
    "ignored")
        show_ignored
        ;;
    "add")
        add_all
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
