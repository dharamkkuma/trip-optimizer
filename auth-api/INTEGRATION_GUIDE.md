# Auth API Integration Guide

This guide explains how to integrate the Auth API with other services in the Trip Optimizer project.

## Overview

The Auth API provides JWT-based authentication for all services. It runs on port 8003 and provides the following endpoints:

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/logout-all` - Logout from all devices
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/verify` - Verify token validity

## JWT Token Structure

### Access Token Payload
```json
{
  "userId": "user_id",
  "username": "username",
  "email": "user@example.com",
  "role": "user|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Refresh Token Payload
```json
{
  "userId": "user_id",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Integration with Other APIs

### 1. Database API Integration

Add JWT validation middleware to your Database API:

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const secretKey = process.env.JWT_SECRET_KEY || 'fallback-secret-key';
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { authenticateToken };
```

Update your routes to use authentication:

```javascript
// routes/protectedRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Protected route example
router.get('/users', authenticateToken, (req, res) => {
  // req.user contains the decoded JWT payload
  res.json({
    success: true,
    user: req.user,
    message: 'Access granted'
  });
});

module.exports = router;
```

### 2. Storage API Integration (FastAPI)

For FastAPI services, create JWT middleware:

```python
# middleware/auth.py
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        secret_key = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
        payload = jwt.decode(credentials.credentials, secret_key, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token"
        )

# Usage in routes
@app.get("/protected")
async def protected_route(user: dict = Depends(verify_token)):
    return {"message": "Access granted", "user": user}
```

### 3. Backend API Integration (FastAPI)

Similar to Storage API, add JWT verification to your FastAPI backend:

```python
# Add to your existing main.py
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        secret_key = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
        payload = jwt.decode(credentials.credentials, secret_key, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token"
        )

# Protect your existing routes
@app.post("/protected-endpoint")
async def protected_endpoint(user: dict = Depends(verify_token)):
    return {"message": "Access granted", "user": user}
```

## Environment Variables

Add these environment variables to your services:

```bash
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-make-it-very-long-and-random
JWT_ALGORITHM=HS256

# Auth API URL
AUTH_API_URL=http://auth-api:8003
```

## Frontend Integration

### 1. Login Flow

```javascript
// Login function
const login = async (emailOrUsername, password) => {
  try {
    const response = await fetch('http://localhost:8003/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Store tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### 2. Token Refresh

```javascript
// Token refresh function
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const response = await fetch('http://localhost:8003/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data;
    } else {
      // Refresh failed, redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
};
```

### 3. API Request Interceptor

```javascript
// Axios interceptor for automatic token handling
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Your API base URL
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        await refreshToken();
        // Retry the original request
        return api.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## Testing the Integration

### 1. Test Registration
```bash
curl -X POST http://localhost:8003/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Test Login
```bash
curl -X POST http://localhost:8003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "test@example.com",
    "password": "TestPass123"
  }'
```

### 3. Test Protected Route
```bash
curl -X GET http://localhost:8002/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Security Considerations

1. **JWT Secret Key**: Use a strong, random secret key in production
2. **Token Expiration**: Set appropriate expiration times for access and refresh tokens
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Configure CORS properly for your frontend domains
5. **Rate Limiting**: Implement rate limiting on authentication endpoints
6. **Password Security**: Use strong password requirements and bcrypt hashing

## Error Handling

The Auth API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials, missing token)
- `403` - Forbidden (invalid token, insufficient permissions)
- `500` - Internal Server Error

## Monitoring and Logging

Monitor authentication events:
- Failed login attempts
- Token refresh patterns
- Unauthorized access attempts
- User registration rates

This integration ensures secure, scalable authentication across all your Trip Optimizer services.
