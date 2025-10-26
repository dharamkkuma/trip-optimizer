#!/bin/bash

# Auth API Test Script
# This script tests the basic functionality of the Auth API

AUTH_API_URL="http://localhost:8003"
API_BASE="/api/auth"

echo "🧪 Testing Auth API..."
echo "======================"

# Test 1: Health Check
echo "1. Testing health check..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$AUTH_API_URL/api/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health check passed"
    cat /tmp/health_response.json | jq .
else
    echo "❌ Health check failed (HTTP $HEALTH_RESPONSE)"
    exit 1
fi

echo ""

# Test 2: Register User
echo "2. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/register_response.json \
    -X POST "$AUTH_API_URL$API_BASE/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser'$(date +%s)'",
        "email": "test'$(date +%s)'@example.com",
        "password": "TestPass123",
        "firstName": "Test",
        "lastName": "User"
    }')

if [ "$REGISTER_RESPONSE" = "201" ]; then
    echo "✅ User registration passed"
    ACCESS_TOKEN=$(cat /tmp/register_response.json | jq -r '.data.accessToken')
    REFRESH_TOKEN=$(cat /tmp/register_response.json | jq -r '.data.refreshToken')
    USER_ID=$(cat /tmp/register_response.json | jq -r '.data.user.id')
    echo "   Access Token: ${ACCESS_TOKEN:0:20}..."
    echo "   Refresh Token: ${REFRESH_TOKEN:0:20}..."
else
    echo "❌ User registration failed (HTTP $REGISTER_RESPONSE)"
    cat /tmp/register_response.json | jq .
    exit 1
fi

echo ""

# Test 3: Login User
echo "3. Testing user login..."
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/login_response.json \
    -X POST "$AUTH_API_URL$API_BASE/login" \
    -H "Content-Type: application/json" \
    -d '{
        "emailOrUsername": "test'$(date +%s)'@example.com",
        "password": "TestPass123"
    }')

if [ "$LOGIN_RESPONSE" = "200" ]; then
    echo "✅ User login passed"
    LOGIN_ACCESS_TOKEN=$(cat /tmp/login_response.json | jq -r '.data.accessToken')
    echo "   Login Access Token: ${LOGIN_ACCESS_TOKEN:0:20}..."
else
    echo "❌ User login failed (HTTP $LOGIN_RESPONSE)"
    cat /tmp/login_response.json | jq .
fi

echo ""

# Test 4: Get Profile (if we have a token)
if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo "4. Testing get profile..."
    PROFILE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/profile_response.json \
        -X GET "$AUTH_API_URL$API_BASE/profile" \
        -H "Authorization: Bearer $ACCESS_TOKEN")

    if [ "$PROFILE_RESPONSE" = "200" ]; then
        echo "✅ Get profile passed"
        cat /tmp/profile_response.json | jq '.data.user | {username, email, firstName, lastName, role}'
    else
        echo "❌ Get profile failed (HTTP $PROFILE_RESPONSE)"
        cat /tmp/profile_response.json | jq .
    fi
else
    echo "4. ⏭️  Skipping profile test (no access token)"
fi

echo ""

# Test 5: Token Verification
if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo "5. Testing token verification..."
    VERIFY_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/verify_response.json \
        -X POST "$AUTH_API_URL$API_BASE/verify" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN")

    if [ "$VERIFY_RESPONSE" = "200" ]; then
        echo "✅ Token verification passed"
        cat /tmp/verify_response.json | jq '.data.user | {username, email, role}'
    else
        echo "❌ Token verification failed (HTTP $VERIFY_RESPONSE)"
        cat /tmp/verify_response.json | jq .
    fi
else
    echo "5. ⏭️  Skipping token verification test (no access token)"
fi

echo ""

# Test 6: Refresh Token
if [ ! -z "$REFRESH_TOKEN" ] && [ "$REFRESH_TOKEN" != "null" ]; then
    echo "6. Testing token refresh..."
    REFRESH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/refresh_response.json \
        -X POST "$AUTH_API_URL$API_BASE/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

    if [ "$REFRESH_RESPONSE" = "200" ]; then
        echo "✅ Token refresh passed"
        NEW_ACCESS_TOKEN=$(cat /tmp/refresh_response.json | jq -r '.data.accessToken')
        echo "   New Access Token: ${NEW_ACCESS_TOKEN:0:20}..."
    else
        echo "❌ Token refresh failed (HTTP $REFRESH_RESPONSE)"
        cat /tmp/refresh_response.json | jq .
    fi
else
    echo "6. ⏭️  Skipping token refresh test (no refresh token)"
fi

echo ""

# Test 7: Logout
if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ] && [ ! -z "$REFRESH_TOKEN" ] && [ "$REFRESH_TOKEN" != "null" ]; then
    echo "7. Testing logout..."
    LOGOUT_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/logout_response.json \
        -X POST "$AUTH_API_URL$API_BASE/logout" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

    if [ "$LOGOUT_RESPONSE" = "200" ]; then
        echo "✅ Logout passed"
    else
        echo "❌ Logout failed (HTTP $LOGOUT_RESPONSE)"
        cat /tmp/logout_response.json | jq .
    fi
else
    echo "7. ⏭️  Skipping logout test (no tokens)"
fi

echo ""
echo "🎉 Auth API testing completed!"
echo "============================="

# Cleanup
rm -f /tmp/*_response.json
