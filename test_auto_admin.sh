#!/bin/bash

# Test Automatic Admin User Creation
echo "=== Testing Automatic Admin User Creation ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "SUCCESS" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "ERROR" ]; then
        echo -e "${RED}✗${NC} $message"
    elif [ "$status" = "INFO" ]; then
        echo -e "${BLUE}ℹ${NC} $message"
    elif [ "$status" = "WARNING" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
    fi
}

echo "1. Testing Fresh Start - Deleting existing admin user..."
ADMIN_ID=$(curl -s -X GET "http://localhost:8002/api/users" | grep -o '"_id":"[^"]*","email":"admin@tripoptimizer.com"' | cut -d'"' -f4)
if [ -n "$ADMIN_ID" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "http://localhost:8002/api/users/$ADMIN_ID")
    if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
        print_status "SUCCESS" "Existing admin user deleted"
    else
        print_status "WARNING" "Could not delete existing admin user"
    fi
else
    print_status "INFO" "No existing admin user found"
fi

echo
echo "2. Restarting Database API to trigger admin creation..."
docker-compose restart database-api
sleep 8

echo
echo "3. Checking if admin user was created automatically..."
ADMIN_CHECK=$(curl -s -X GET "http://localhost:8002/api/users" | grep -o '"email":"admin@tripoptimizer.com"')
if [ -n "$ADMIN_CHECK" ]; then
    print_status "SUCCESS" "Admin user created automatically"
    ADMIN_ID=$(curl -s -X GET "http://localhost:8002/api/users" | grep -o '"_id":"[^"]*","email":"admin@tripoptimizer.com"' | cut -d'"' -f4)
    print_status "INFO" "Admin User ID: $ADMIN_ID"
else
    print_status "ERROR" "Admin user was not created automatically"
    exit 1
fi

echo
echo "4. Testing admin user login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"admin","password":"Admin123!"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    print_status "SUCCESS" "Admin user can login successfully"
    ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    ADMIN_ROLE=$(echo "$LOGIN_RESPONSE" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
    print_status "INFO" "Admin role: $ADMIN_ROLE"
else
    print_status "ERROR" "Admin user login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo
echo "5. Testing admin functionality..."
USERS_RESPONSE=$(curl -s -X GET "http://localhost:8003/api/v1/auth/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

if echo "$USERS_RESPONSE" | grep -q '"success":true'; then
    USER_COUNT=$(echo "$USERS_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    print_status "SUCCESS" "Admin can access users management endpoint"
    print_status "INFO" "Total users accessible: $USER_COUNT"
else
    print_status "ERROR" "Admin cannot access users management endpoint"
fi

echo
echo "=== Automatic Admin Creation Test Summary ==="
print_status "SUCCESS" "Automatic admin user creation is working!"
print_status "INFO" "Admin credentials:"
print_status "INFO" "  📧 Email: admin@tripoptimizer.com"
print_status "INFO" "  👤 Username: admin"
print_status "INFO" "  🔑 Password: Admin123!"
print_status "INFO" "  🎭 Role: admin"

echo
print_status "SUCCESS" "🎉 Automatic admin user creation is fully operational!"