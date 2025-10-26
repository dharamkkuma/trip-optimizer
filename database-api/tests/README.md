# Database API Test Suite - User Endpoints Only

This directory contains comprehensive test suites for the Database API user endpoints. The tests help you understand what each user endpoint returns and verify that the API is working correctly.

## Files

- **`test_all_endpoints.js`** - Comprehensive test suite with pass/fail validation
- **`view_api_responses.js`** - Simple response viewer that shows what each endpoint returns
- **`package.json`** - Dependencies and scripts for running tests

## Prerequisites

1. **Database API must be running**:
   ```bash
   docker-compose up -d
   ```

2. **Install test dependencies**:
   ```bash
   cd tests
   npm install
   ```

## Running Tests

### Option 1: Comprehensive Test Suite
```bash
cd tests
npm test
# or
node test_all_endpoints.js
```

This will:
- ✅ Test all endpoints with validation
- ✅ Show pass/fail status for each test
- ✅ Display detailed responses
- ✅ Test error cases
- ✅ Provide a summary of results

### Option 2: Simple Response Viewer
```bash
cd tests
npm run view
# or
node view_api_responses.js
```

This will:
- 📋 Call all endpoints
- 📋 Show raw responses
- 📋 Display what each endpoint returns
- 📋 Help you understand the API structure

### Option 3: Individual Test Categories
```bash
# Test only health endpoints
npm run test:health

# Test only user endpoints
npm run test:users
```

## What Each Test Covers

### Health Endpoints
- `GET /` - Root endpoint
- `GET /api/health` - Comprehensive health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### User Endpoints
- `GET /api/users` - List all users with pagination
- `GET /api/users?page=1&limit=5&status=active` - List with query parameters
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Full user update
- `PATCH /api/users/:id` - Partial user update
- `GET /api/users/search/:query` - Search users
- `DELETE /api/users/:id` - Delete user (skipped to keep test data)

### Error Cases
- Invalid user ID format
- Non-existent user ID
- Missing required fields
- Duplicate email addresses
- Invalid JSON data

## Sample Outputs

### Successful User Creation
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "email": "test@example.com",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User",
    "status": "active",
    "role": "user",
    "_id": "68fe3ab10efd2189cff63b5e",
    "createdAt": "2025-10-26T15:13:53.898Z",
    "updatedAt": "2025-10-26T15:13:53.898Z"
  }
}
```

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T15:11:41.512Z",
  "uptime": 9.652757255,
  "environment": "development",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "connected": true
  },
  "memory": {
    "used": "23 MB",
    "total": "25 MB"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

## Troubleshooting

### API Not Running
If you get connection errors:
```bash
# Check if services are running
docker-compose ps

# Start services
docker-compose up -d

# Check API health
curl http://localhost:8002/api/health
```

### Test Dependencies
If you get module not found errors:
```bash
cd tests
npm install
```

### Permission Issues
Make sure the test files are executable:
```bash
chmod +x test_all_endpoints.js
chmod +x view_api_responses.js
```

## Customization

You can modify the test data in the files:
- **Test User Data**: Change `TEST_USER` object
- **Test Trip Data**: Change `testTrip` object  
- **Test Payment Data**: Change `testPayment` object
- **API Base URL**: Change `API_BASE_URL` constant

## Notes

- User deletion tests are skipped to keep test data
- Trip and Payment endpoints may return errors if not fully implemented
- The tests create actual data in your database
- Check the responses to understand what each endpoint returns
- Use the simple viewer for quick API exploration
- Use the comprehensive tests for validation and CI/CD
