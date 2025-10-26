const axios = require('axios');

// Database API Test Suite - User Endpoints Only
// This script tests all user endpoints and shows sample outputs
// Run with: node tests/test_all_endpoints.js

// Configuration
const API_BASE_URL = 'http://localhost:8002';
const API_TIMEOUT = 10000;

// Test data
const TEST_USER = {
    email: 'testuser@example.com',
    username: 'testuser123',
    firstName: 'Test',
    lastName: 'User',
    password: 'password123',
    phone: '+1234567890',
    preferences: {
        language: 'en',
        timezone: 'UTC',
        notifications: {
            email: true,
            sms: false,
            push: true
        }
    }
};

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Utility functions
const log = {
    section: (text) => {
        console.log(`\n${colors.blue}========================================${colors.reset}`);
        console.log(`${colors.blue}${text}${colors.reset}`);
        console.log(`${colors.blue}========================================${colors.reset}\n`);
    },
    success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
    error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
    info: (text) => console.log(`${colors.yellow}ℹ️  ${text}${colors.reset}`),
    test: (text) => console.log(`${colors.cyan}🧪 ${text}${colors.reset}`),
    response: (data) => {
        console.log(`${colors.yellow}Response:${colors.reset}`);
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    }
};

// API client
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Test result tracking
let testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

// Test wrapper function
async function runTest(testName, testFunction) {
    testResults.total++;
    log.test(`Testing ${testName}`);
    
    try {
        const result = await testFunction();
        if (result.success) {
            testResults.passed++;
            log.success(`${testName}`);
            if (result.data) {
                log.response(result.data);
            }
        } else {
            testResults.failed++;
            log.error(`${testName} - ${result.error}`);
            if (result.data) {
                log.response(result.data);
            }
        }
    } catch (error) {
        testResults.failed++;
        log.error(`${testName} - ${error.message}`);
    }
}

// Health Endpoints Tests
async function testHealthEndpoints() {
    log.section('Health Endpoints');
    
    // Main health endpoint
    await runTest('GET /api/health', async () => {
        const response = await api.get('/api/health');
        return {
            success: response.status === 200,
            data: response.data
        };
    });
    
    // Readiness probe
    await runTest('GET /api/health/ready', async () => {
        const response = await api.get('/api/health/ready');
        return {
            success: response.status === 200,
            data: response.data
        };
    });
    
    // Liveness probe
    await runTest('GET /api/health/live', async () => {
        const response = await api.get('/api/health/live');
        return {
            success: response.status === 200,
            data: response.data
        };
    });
    
    // Root endpoint
    await runTest('GET /', async () => {
        const response = await api.get('/');
        return {
            success: response.status === 200,
            data: response.data
        };
    });
}

// User Endpoints Tests
async function testUserEndpoints() {
    log.section('User Endpoints');
    
    let userId = null;
    
    // 1. GET /api/users - List all users
    await runTest('GET /api/users (List all users)', async () => {
        const response = await api.get('/api/users');
        if (response.status === 200 && response.data.data && response.data.data.length > 0) {
            userId = response.data.data[0]._id;
        }
        return {
            success: response.status === 200,
            data: response.data
        };
    });
    
    // 2. POST /api/users - Create new user
    await runTest('POST /api/users (Create new user)', async () => {
        const response = await api.post('/api/users', TEST_USER);
        if (response.status === 201 && response.data.data) {
            userId = response.data.data._id;
        }
        return {
            success: response.status === 201,
            data: response.data
        };
    });
    
    // 3. GET /api/users/:id - Get user by ID
    if (userId) {
        await runTest(`GET /api/users/${userId} (Get user by ID)`, async () => {
            const response = await api.get(`/api/users/${userId}`);
            return {
                success: response.status === 200,
                data: response.data
            };
        });
    } else {
        log.error('Skipping GET /api/users/:id - No user ID available');
    }
    
    // 4. PUT /api/users/:id - Full update
    if (userId) {
        await runTest(`PUT /api/users/${userId} (Full update)`, async () => {
            const updateData = {
                ...TEST_USER,
                firstName: 'Updated',
                lastName: 'User',
                phone: '+1234567890'
            };
            const response = await api.put(`/api/users/${userId}`, updateData);
            return {
                success: response.status === 200,
                data: response.data
            };
        });
    } else {
        log.error('Skipping PUT /api/users/:id - No user ID available');
    }
    
    // 5. PATCH /api/users/:id - Partial update
    if (userId) {
        await runTest(`PATCH /api/users/${userId} (Partial update)`, async () => {
            const patchData = {
                firstName: 'Patched',
                lastName: 'Name',
                phone: '+9876543210'
            };
            const response = await api.patch(`/api/users/${userId}`, patchData);
            return {
                success: response.status === 200,
                data: response.data
            };
        });
    } else {
        log.error('Skipping PATCH /api/users/:id - No user ID available');
    }
    
    // 6. GET /api/users/search/:query - Search users
    await runTest('GET /api/users/search/test (Search users)', async () => {
        const response = await api.get('/api/users/search/test');
        return {
            success: response.status === 200,
            data: response.data
        };
    });
    
    // 7. GET /api/users with query parameters
    await runTest('GET /api/users?page=1&limit=5&status=active (With query params)', async () => {
        const response = await api.get('/api/users?page=1&limit=5&status=active');
        return {
            success: response.status === 200,
            data: response.data
        };
    });
    
    // 8. DELETE /api/users/:id - Delete user (commented out to keep test data)
    if (userId) {
        log.info(`DELETE /api/users/${userId} (Delete user) - SKIPPED to keep test data`);
        log.info('To test deletion, uncomment the DELETE test in the script');
        
        // Uncomment the following lines to test deletion:
        // await runTest(`DELETE /api/users/${userId} (Delete user)`, async () => {
        //     const response = await api.delete(`/api/users/${userId}`);
        //     return {
        //         success: response.status === 200,
        //         data: response.data
        //     };
        // });
    } else {
        log.error('Skipping DELETE /api/users/:id - No user ID available');
    }
}

// Error Cases Tests
async function testErrorCases() {
    log.section('Error Cases');
    
    // 1. Invalid user ID
    await runTest('GET /api/users/invalid-id (Invalid user ID)', async () => {
        try {
            const response = await api.get('/api/users/invalid-id');
            return {
                success: response.status === 400,
                data: response.data
            };
        } catch (error) {
            return {
                success: error.response?.status === 400,
                error: error.response?.data?.message || error.message,
                data: error.response?.data
            };
        }
    });
    
    // 2. Non-existent user ID
    await runTest('GET /api/users/507f1f77bcf86cd799439011 (Non-existent user ID)', async () => {
        try {
            const response = await api.get('/api/users/507f1f77bcf86cd799439011');
            return {
                success: response.status === 404,
                data: response.data
            };
        } catch (error) {
            return {
                success: error.response?.status === 404,
                error: error.response?.data?.message || error.message,
                data: error.response?.data
            };
        }
    });
    
    // 3. Missing required fields
    await runTest('POST /api/users with missing fields', async () => {
        try {
            const response = await api.post('/api/users', { email: 'test@example.com' });
            return {
                success: response.status === 400,
                data: response.data
            };
        } catch (error) {
            return {
                success: error.response?.status === 400,
                error: error.response?.data?.message || error.message,
                data: error.response?.data
            };
        }
    });
    
    // 4. Duplicate email
    await runTest('POST /api/users with duplicate email', async () => {
        try {
            const response = await api.post('/api/users', TEST_USER);
            return {
                success: response.status === 409,
                data: response.data
            };
        } catch (error) {
            return {
                success: error.response?.status === 409,
                error: error.response?.data?.message || error.message,
                data: error.response?.data
            };
        }
    });
}

// API Status Check
async function checkApiStatus() {
    log.section('API Status Check');
    
    await runTest('API Health Check', async () => {
        try {
            const response = await api.get('/api/health');
            return {
                success: response.status === 200,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: 'API is not running or not accessible',
                data: error.message
            };
        }
    });
}

// Main execution function
async function main() {
    console.log(`${colors.green}${colors.bold}🚀 Database API Test Suite${colors.reset}`);
    console.log(`${colors.green}==========================${colors.reset}`);
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Test started at: ${new Date().toISOString()}`);
    console.log('');
    
    try {
        // Check if API is running
        await checkApiStatus();
        
        // Run all tests
        await testHealthEndpoints();
        await testUserEndpoints();
        await testErrorCases();
        
        // Test Summary
        log.section('Test Summary');
        console.log(`${colors.green}✅ Tests Passed: ${testResults.passed}${colors.reset}`);
        console.log(`${colors.red}❌ Tests Failed: ${testResults.failed}${colors.reset}`);
        console.log(`${colors.blue}📊 Total Tests: ${testResults.total}${colors.reset}`);
        console.log(`Test finished at: ${new Date().toISOString()}`);
        
        console.log(`\n${colors.yellow}📝 Notes:${colors.reset}`);
        console.log('  - User deletion test is skipped to keep test data');
        console.log('  - Only user endpoints are tested (trips and payments removed)');
        console.log('  - Check the responses above to see what each endpoint returns');
        
        console.log(`\n${colors.blue}🔧 To run individual tests:${colors.reset}`);
        console.log(`  - Health: curl ${API_BASE_URL}/api/health`);
        console.log(`  - Users: curl ${API_BASE_URL}/api/users`);
        console.log(`  - Create User: curl -X POST ${API_BASE_URL}/api/users -H 'Content-Type: application/json' -d '{"email":"test@example.com","username":"testuser","firstName":"Test","lastName":"User","password":"password123"}'`);
        
        if (testResults.failed > 0) {
            process.exit(1);
        }
        
    } catch (error) {
        log.error(`Test suite failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    runTest,
    testHealthEndpoints,
    testUserEndpoints,
    testErrorCases,
    checkApiStatus
};
