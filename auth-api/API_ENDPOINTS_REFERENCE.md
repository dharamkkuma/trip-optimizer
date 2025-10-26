# Auth API Endpoints Reference

## Base URL
```
http://localhost:8003
```

## Authentication
Most endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Health Check Endpoints

### GET /api/v1/health
**Description:** Check the health status of the Auth API

**Authentication:** None required

**Request:**
```bash
GET /api/v1/health
```

**Response:**
```json
{
  "success": true,
  "message": "Auth API Health Check",
  "timestamp": "2025-10-26T16:30:00.000Z",
  "status": "healthy",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200` - Service is healthy

---

### GET /
**Description:** Get API information and available endpoints

**Authentication:** None required

**Request:**
```bash
GET /
```

**Response:**
```json
{
  "message": "Auth API Service",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2025-10-26T16:30:00.000Z",
  "endpoints": {
    "health": "/api/v1/health",
    "register": "/api/v1/auth/register",
    "login": "/api/v1/auth/login",
    "refresh": "/api/v1/auth/refresh",
    "logout": "/api/v1/auth/logout",
    "profile": "/api/v1/auth/profile",
    "verify": "/api/v1/auth/verify"
  }
}
```

**Status Codes:**
- `200` - API information retrieved

---

## Authentication Endpoints

### POST /api/v1/auth/register
**Description:** Register a new user account

**Authentication:** None required

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123",
  "firstName": "Test",
  "lastName": "User"
}
```

**Validation Rules:**
- `username`: 3-30 characters, alphanumeric and underscores only
- `email`: Valid email format
- `password`: Min 6 characters, must contain uppercase, lowercase, and number
- `firstName`: 1-50 characters
- `lastName`: 1-50 characters

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "test@example.com",
      "username": "testuser",
      "firstName": "Test",
      "lastName": "User",
      "role": "user",
      "status": "active",
      "emailVerified": false,
      "twoFactorEnabled": false,
      "loginAttempts": 0,
      "createdAt": "2025-10-26T16:30:00.000Z",
      "updatedAt": "2025-10-26T16:30:00.000Z",
      "fullName": "Test User",
      "id": "507f1f77bcf86cd799439011"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 1800
  }
}
```

**Status Codes:**
- `201` - User registered successfully
- `400` - Validation failed or user already exists
- `409` - User with email/username already exists

---

### POST /api/v1/auth/login
**Description:** Authenticate user and get access tokens

**Authentication:** None required

**Request Body:**
```json
{
  "emailOrUsername": "test@example.com",
  "password": "Password123"
}
```

**Validation Rules:**
- `emailOrUsername`: Required, can be email or username
- `password`: Required

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "test@example.com",
      "username": "testuser",
      "firstName": "Test",
      "lastName": "User",
      "role": "user",
      "status": "active",
      "lastLogin": "2025-10-26T16:30:00.000Z",
      "createdAt": "2025-10-26T16:30:00.000Z",
      "updatedAt": "2025-10-26T16:30:00.000Z",
      "fullName": "Test User",
      "id": "507f1f77bcf86cd799439011"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 1800
  }
}
```

**Status Codes:**
- `200` - Login successful
- `400` - Validation failed
- `401` - Invalid credentials

---

### POST /api/v1/auth/logout
**Description:** Logout user from current device

**Authentication:** Access token required

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Status Codes:**
- `200` - Logout successful
- `401` - Access token required
- `500` - Logout failed

---

### POST /api/v1/auth/logout-all
**Description:** Logout user from all devices

**Authentication:** Access token required

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

**Status Codes:**
- `200` - Logout successful
- `401` - Access token required
- `500` - Logout failed

---

## Token Management Endpoints

### POST /api/v1/auth/refresh
**Description:** Refresh access token using refresh token

**Authentication:** Refresh token required

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "test@example.com",
      "username": "testuser",
      "firstName": "Test",
      "lastName": "User",
      "role": "user",
      "status": "active",
      "createdAt": "2025-10-26T16:30:00.000Z",
      "updatedAt": "2025-10-26T16:30:00.000Z",
      "fullName": "Test User",
      "id": "507f1f77bcf86cd799439011"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 1800
  }
}
```

**Status Codes:**
- `200` - Token refreshed successfully
- `400` - Validation failed
- `401` - Invalid or expired refresh token

---

### POST /api/v1/auth/verify
**Description:** Verify access token validity

**Authentication:** Access token required

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "test@example.com",
      "username": "testuser",
      "firstName": "Test",
      "lastName": "User",
      "role": "user",
      "status": "active",
      "createdAt": "2025-10-26T16:30:00.000Z",
      "updatedAt": "2025-10-26T16:30:00.000Z",
      "fullName": "Test User",
      "id": "507f1f77bcf86cd799439011"
    },
    "tokenData": {
      "userId": "507f1f77bcf86cd799439011",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "iat": 1761496200,
      "exp": 1761498000
    }
  }
}
```

**Status Codes:**
- `200` - Token is valid
- `401` - Invalid or expired token

---

## User Profile Endpoints

### GET /api/v1/auth/profile
**Description:** Get current user profile

**Authentication:** Access token required

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "test@example.com",
      "username": "testuser",
      "firstName": "Test",
      "lastName": "User",
      "role": "user",
      "status": "active",
      "emailVerified": false,
      "twoFactorEnabled": false,
      "loginAttempts": 0,
      "lastLogin": "2025-10-26T16:30:00.000Z",
      "createdAt": "2025-10-26T16:30:00.000Z",
      "updatedAt": "2025-10-26T16:30:00.000Z",
      "fullName": "Test User",
      "id": "507f1f77bcf86cd799439011"
    }
  }
}
```

**Status Codes:**
- `200` - Profile retrieved successfully
- `401` - Access token required
- `403` - Invalid or expired token
- `404` - User not found

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "ab",
      "msg": "Username must be between 3 and 30 characters",
      "path": "username",
      "location": "body"
    }
  ]
}
```

### Unauthorized Error
```json
{
  "success": false,
  "message": "Access token required"
}
```

### Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### User Already Exists
```json
{
  "success": false,
  "message": "User with this email or username already exists"
}
```

### Route Not Found
```json
{
  "success": false,
  "message": "Route not found",
  "path": "/api/non-existent-route"
}
```

---

## JWT Token Information

### Access Token
- **Expiration:** 30 minutes
- **Purpose:** API authentication
- **Payload:**
  ```json
  {
    "userId": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "iat": 1761496200,
    "exp": 1761498000
  }
  ```

### Refresh Token
- **Expiration:** 7 days
- **Purpose:** Token refresh
- **Payload:**
  ```json
  {
    "userId": "507f1f77bcf86cd799439011",
    "iat": 1761496200,
    "exp": 1762101000
  }
  ```

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Headers:** 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## CORS Configuration

**Allowed Origins:**
- `http://localhost:3000` (Frontend)
- `http://localhost:8000` (Backend)
- `http://localhost:8001` (Storage API)
- `http://localhost:8002` (Database API)

**Allowed Methods:**
- GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization, X-Requested-With, Accept, Origin

---

## Testing

Run the comprehensive test suite:

```bash
cd tests
npm install
npm test
```

For detailed test documentation, see `tests/TEST_DOCUMENTATION.md`
