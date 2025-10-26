# Database API Service

A simple Node.js API microservice for user management with MongoDB.

## Quick Start

### Using Docker Compose (Recommended)
```bash
# Start all services (database-api + MongoDB)
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down
```

### Local Development
```bash
# Install dependencies
npm install

# Start MongoDB locally first, then:
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Environment

Uses `env.development` file:
- **Port**: 8002
- **MongoDB**: mongodb://admin:password@mongodb:27017/trip_optimizer
- **CORS**: Enabled for localhost:3000

## Testing

```bash
cd tests
npm install
npm run view    # Quick API test
npm test        # Full test suite
```

## User Model

Required fields: `email`, `username`, `firstName`, `lastName`, `password`
Optional: `phone`, `address`, `profile`, `preferences`
