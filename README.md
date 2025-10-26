# Trip Optimizer - AI-Powered Travel Expense & Optimization Platform

## Overview

Trip Optimizer is an intelligent travel management platform that combines document processing, ML-based expense extraction, and AI-powered travel optimization. The system automatically processes travel invoices (hotels and flights), extracts structured data using machine learning, and continuously monitors travel APIs to find better pricing opportunities for your trips.

## Quick Start

### 🚀 Starting the Application

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Auth API: http://localhost:8003
   - Database API: http://localhost:8002
   - Storage API: http://localhost:8001

### 👤 Admin Access

An admin user is **automatically created** when you start the project. Use these credentials to access the admin panel and manage all users:

- **Username**: `admin`
- **Password**: `Admin123!`
- **Email**: `admin@tripoptimizer.com`
- **Role**: Administrator (full user management access)

**Admin Features**:
- ✅ View and manage all users
- ✅ Reset user passwords
- ✅ Change user roles and status
- ✅ Delete users (except self)
- ✅ Search and filter users
- ✅ Access user management interface

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

## System Architecture

![System Architecture](assets/architecture.png)

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
