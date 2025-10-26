# Auth API Service

A dedicated authentication service for the Trip Optimizer project that provides JWT-based authentication for all microservices.

## Features

- 🔐 JWT-based authentication
- 👤 User registration and login
- 🔄 Token refresh mechanism
- 🚪 Logout functionality (single device and all devices)
- 🛡️ Role-based access control
- 🔒 Password hashing with bcrypt
- 📊 User profile management
- 🏥 Health check endpoints
- 🚦 Rate limiting
- 🔧 CORS configuration

## Architecture

The Auth API follows a microservices architecture pattern where it acts as an authentication facade:

```
┌─────────────┐    HTTP Requests    ┌─────────────┐
│   Auth API  │ ──────────────────► │Database API │
│  (Port 8003)│                    │ (Port 8002) │
└─────────────┘                    └─────────────┘
       │                                    │
       │                                    │
       ▼                                    ▼
┌─────────────┐                    ┌─────────────┐
│   Frontend  │                    │   MongoDB   │
│  (Port 3000)│                    │ (Port 27017)│
└─────────────┘                    └─────────────┘
```

**Service Responsibilities:**
- **Auth API:** JWT token generation, validation, and authentication logic
- **Database API:** User data persistence, password hashing, and database operations
- **MongoDB:** Data storage

**Data Flow:**
1. Client requests authentication from Auth API
2. Auth API validates credentials via Database API
3. Database API performs user operations and returns data
4. Auth API generates JWT tokens and returns to client
5. Client uses JWT tokens for subsequent API calls

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB
- **Database API** (Required dependency - must be running on port 8002)
- Docker (optional)

### Dependencies

The Auth API **depends on the Database API** for all user data operations:

- **Database API URL:** `http://localhost:8002` (development) or `http://database-api:8002` (Docker)
- **Required Endpoints:**
  - `POST /api/v1/users` - User registration
  - `POST /api/v1/users/authenticate` - User authentication
  - `GET /api/v1/users/:id` - User profile retrieval
  - `POST /api/v1/users/:id/refresh-tokens` - Refresh token management
  - `GET /api/v1/users/:id/refresh-tokens` - Get refresh tokens
  - `DELETE /api/v1/users/:id/refresh-tokens` - Remove refresh tokens

**⚠️ Important:** The Database API must be running before starting the Auth API, otherwise authentication operations will fail.

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp env.example env.development
```

3. Update environment variables in `env.development`

4. Start the service:
```bash
# Development
npm run dev

# Production
npm start
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run standalone
docker build -t auth-api .
docker run -p 8003:8003 --env-file env.development auth-api
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login user | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | Refresh Token |
| POST | `/api/v1/auth/logout` | Logout user | Access Token |
| POST | `/api/v1/auth/logout-all` | Logout from all devices | Access Token |
| GET | `/api/v1/auth/profile` | Get user profile | Access Token |
| POST | `/api/v1/auth/verify` | Verify token validity | Access Token |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/` | API information |

## Request/Response Examples

### Register User

**Request:**
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2023-09-06T10:30:00.000Z",
      "updatedAt": "2023-09-06T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 1800
  }
}
```

### Login User

**Request:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "emailOrUsername": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "lastLogin": "2023-09-06T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 1800
  }
}
```

### Refresh Token

**Request:**
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

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
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 1800
  }
}
```

## JWT Token Structure

### Access Token Payload
```json
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "iat": 1694001000,
  "exp": 1694002800
}
```

### Refresh Token Payload
```json
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "iat": 1694001000,
  "exp": 1694605800
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `8003` |
| `JWT_SECRET_KEY` | JWT signing secret | Required |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token expiry | `30` |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token expiry | `7` |
| **`DATABASE_API_URL`** | **Database API URL (REQUIRED)** | **`http://localhost:8002`** |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |
| `CORS_ORIGIN` | CORS allowed origins | Comma-separated list |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

**⚠️ Important:** The `DATABASE_API_URL` is a critical dependency. The Auth API cannot function without a running Database API instance.

## Integration with Other Services

This Auth API is designed to work with other services in the Trip Optimizer project:

- **Database API** (Port 8002) - User data management
- **Storage API** (Port 8001) - File uploads with authentication
- **Backend API** (Port 8000) - Main application logic
- **Frontend** (Port 3000) - User interface

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed integration instructions.

## Security Features

- **Password Hashing**: Uses bcrypt with configurable rounds
- **JWT Security**: Configurable algorithm and expiration
- **Rate Limiting**: Prevents brute force attacks
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error messages without sensitive data

## Error Handling

All endpoints return consistent error responses:

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

## Troubleshooting

### Database API Connection Issues

**Error:** `connect ECONNREFUSED ::1:8002` or `connect ECONNREFUSED 127.0.0.1:8002`

**Solution:** Ensure the Database API is running:
```bash
# Check if Database API is running
curl http://localhost:8002/api/v1/health

# Start Database API if not running
cd ../database-api
npm run dev
```

**Error:** `Error: Cannot find module 'axios'`

**Solution:** Install missing dependencies:
```bash
npm install
```

**Error:** `User not found` during authentication

**Solution:** Check Database API logs and ensure user exists in the database.

### Service Startup Order

For proper operation, start services in this order:

1. **MongoDB** (if not using Docker Compose)
2. **Database API** (Port 8002)
3. **Auth API** (Port 8003)

### Docker Compose

Use the main `docker-compose.yml` to start all services together:
```bash
# From project root
docker-compose up
```

This ensures proper service dependencies and networking.

## Testing

### Manual Testing

Test the API endpoints using curl or Postman:

```bash
# Register a user
curl -X POST http://localhost:8003/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:8003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "test@example.com",
    "password": "TestPass123"
  }'

# Get profile (replace TOKEN with actual token)
curl -X GET http://localhost:8003/api/v1/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

### Automated Testing

```bash
npm test
```

## Monitoring and Logging

The service includes comprehensive logging:
- Request/response logging
- Authentication events
- Error tracking
- Performance metrics

## Production Deployment

1. Set strong JWT secret key
2. Configure proper CORS origins
3. Use HTTPS
4. Set up monitoring and alerting
5. Configure rate limiting appropriately
6. Use environment-specific configurations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
