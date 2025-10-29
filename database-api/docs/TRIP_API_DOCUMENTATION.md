# Trip API Documentation

## Overview
The Trip API provides comprehensive CRUD operations for managing trips, including trip creation, updates, user filtering, and trip management workflows.

## Base URL
```
http://localhost:8002/api/trips
```

## Authentication
All endpoints require authentication via custom headers for user identification:
```
x-user-id: <user_id>
x-user-email: <user_email>
```

**Note**: The system uses custom headers instead of JWT tokens for database-api authentication. The user ID and email are passed in custom headers to enable user-specific data filtering.

## Data Models

### Trip Schema
```javascript
{
  // Basic Information
  title: String (required),
  description: String,
  
  // Destination
  destination: {
    country: String (required),
    city: String (required),
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Dates
  dates: {
    startDate: Date (required),
    endDate: Date (required)
  },
  
  // Budget Information
  budget: {
    total: Number (required, min: 0),
    currency: String (default: USD),
    breakdown: {
      accommodation: Number,
      transportation: Number,
      food: Number,
      activities: Number,
      miscellaneous: Number
    }
  },
  
  // Travelers
  travelers: [{
    userId: ObjectId (ref: User, required),
    role: String (enum: owner, admin, member, default: member)
  }],
  
  // Status and Visibility
  status: String (enum: planning, confirmed, active, completed, cancelled, default: planning),
  tags: [String],
  isPublic: Boolean (default: false),
  visibility: String (enum: private, friends, public, default: private),
  
  // Virtual Fields
  owner: ObjectId (virtual - references traveler with role 'owner'),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## Endpoints

### 1. Get All Trips
**GET** `/api/trips`

#### Query Parameters
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by trip status
- `search` (string): Search in title, destination city, or country
- `userId` (string): Filter by user ID (alternative to header)

#### Response
```json
{
  "success": true,
  "data": [Trip],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50,
    "limit": 10
  }
}
```

#### Example Request
```bash
curl -H "x-user-id: 507f1f77bcf86cd799439011" \
     -H "x-user-email: user@example.com" \
     "http://localhost:8002/api/trips?page=1&limit=10&status=active"
```

### 2. Get Single Trip
**GET** `/api/trips/:id`

#### Response
```json
{
  "success": true,
  "data": Trip
}
```

#### Example Request
```bash
curl -H "x-user-id: 507f1f77bcf86cd799439011" \
     -H "x-user-email: user@example.com" \
     "http://localhost:8002/api/trips/60f7b3b3b3b3b3b3b3b3b3b3"
```

### 3. Create Trip
**POST** `/api/trips`

#### Request Body
```json
{
  "title": "Business Trip to New York",
  "description": "Quarterly business meeting and client visits",
  "destination": {
    "country": "USA",
    "city": "New York",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  },
  "dates": {
    "startDate": "2024-02-15T00:00:00Z",
    "endDate": "2024-02-20T00:00:00Z"
  },
  "budget": {
    "total": 2500.00,
    "currency": "USD",
    "breakdown": {
      "accommodation": 1200.00,
      "transportation": 800.00,
      "food": 300.00,
      "activities": 200.00
    }
  },
  "travelers": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "role": "owner"
    }
  ],
  "status": "planning",
  "tags": ["business", "meeting"],
  "visibility": "private"
}
```

#### Response
```json
{
  "success": true,
  "data": Trip
}
```

#### Example Request
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "x-user-id: 507f1f77bcf86cd799439011" \
     -H "x-user-email: user@example.com" \
     -d '{
       "title": "Business Trip to New York",
       "destination": {
         "country": "USA",
         "city": "New York"
       },
       "dates": {
         "startDate": "2024-02-15T00:00:00Z",
         "endDate": "2024-02-20T00:00:00Z"
       },
       "budget": {
         "total": 2500.00,
         "currency": "USD"
       },
       "travelers": [
         {
           "userId": "507f1f77bcf86cd799439011",
           "role": "owner"
         }
       ]
     }' \
     "http://localhost:8002/api/trips"
```

### 4. Update Trip
**PUT** `/api/trips/:id`

#### Request Body
```json
{
  "title": "Updated Business Trip to New York",
  "status": "confirmed",
  "budget": {
    "total": 3000.00,
    "breakdown": {
      "accommodation": 1500.00,
      "transportation": 1000.00,
      "food": 400.00,
      "activities": 100.00
    }
  }
}
```

#### Response
```json
{
  "success": true,
  "data": Trip
}
```

### 5. Partial Update Trip
**PATCH** `/api/trips/:id`

#### Request Body
```json
{
  "status": "active",
  "tags": ["business", "meeting", "urgent"]
}
```

#### Response
```json
{
  "success": true,
  "data": Trip
}
```

### 6. Delete Trip (Soft Delete)
**DELETE** `/api/trips/:id`

#### Response
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

**Note**: This performs a soft delete by setting the status to 'cancelled' instead of removing the record.

### 7. Get Trips by User
**GET** `/api/trips/user/:userId`

#### Response
```json
{
  "success": true,
  "data": [Trip]
}
```

#### Example Request
```bash
curl -H "x-user-id: 507f1f77bcf86cd799439011" \
     -H "x-user-email: user@example.com" \
     "http://localhost:8002/api/trips/user/507f1f77bcf86cd799439011"
```

## User Filtering

The Trip API automatically filters trips based on the authenticated user. Only trips where the user is listed as a traveler will be returned. This ensures data privacy and security.

### Filtering Logic
- Trips are filtered by `travelers.userId` matching the authenticated user's ID
- The user ID is extracted from the `x-user-id` header
- If no user ID is provided, an error may occur or no trips will be returned

## Validation Rules

### Required Fields
- `title`: Trip title (string)
- `destination.country`: Destination country (string)
- `destination.city`: Destination city (string)
- `dates.startDate`: Trip start date (Date)
- `dates.endDate`: Trip end date (Date)
- `budget.total`: Total budget amount (number, min: 0)
- `travelers`: Array with at least one traveler

### Traveler Validation
- Each traveler must have a valid `userId` (ObjectId)
- At least one traveler is required
- Traveler roles must be one of: 'owner', 'admin', 'member'

### Status Values
- `planning`: Trip is being planned
- `confirmed`: Trip is confirmed and booked
- `active`: Trip is currently ongoing
- `completed`: Trip has finished
- `cancelled`: Trip was cancelled

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: title, destination, dates, budget, travelers"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Trip not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error processing request",
  "error": "Detailed error message"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting
- 100 requests per 15 minutes per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Virtual Fields
- `owner`: References the traveler with role 'owner'

## Indexes
- `title` (text search)
- `destination.country`
- `destination.city`
- `dates.startDate`
- `status`
- `createdAt` (descending)
- `travelers.userId` (for user filtering)

## Population
The API automatically populates related fields:
- `travelers.userId`: Populated with user details (firstName, lastName, email, username)
- `expenses`: Populated when fetching single trip details

## Example Complete Trip Object
```json
{
  "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "title": "Business Trip to New York",
  "description": "Quarterly business meeting and client visits",
  "destination": {
    "country": "USA",
    "city": "New York",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  },
  "dates": {
    "startDate": "2024-02-15T00:00:00Z",
    "endDate": "2024-02-20T00:00:00Z"
  },
  "budget": {
    "total": 2500.00,
    "currency": "USD",
    "breakdown": {
      "accommodation": 1200.00,
      "transportation": 800.00,
      "food": 300.00,
      "activities": 200.00
    }
  },
  "travelers": [
    {
      "userId": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "username": "johndoe"
      },
      "role": "owner"
    }
  ],
  "status": "planning",
  "tags": ["business", "meeting"],
  "isPublic": false,
  "visibility": "private",
  "owner": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```
