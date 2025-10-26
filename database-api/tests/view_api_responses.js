const axios = require('axios');

// Simple API Response Viewer - User Endpoints Only
// This script calls all user endpoints and shows their responses
// Run with: node tests/view_api_responses.js

const API_BASE_URL = 'http://localhost:8002';

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

const log = {
    section: (text) => {
        console.log(`\n${colors.blue}========================================${colors.reset}`);
        console.log(`${colors.blue}${text}${colors.reset}`);
        console.log(`${colors.blue}========================================${colors.reset}\n`);
    },
    endpoint: (method, path) => console.log(`${colors.cyan}${method} ${path}${colors.reset}`),
    response: (data) => {
        console.log(`${colors.yellow}Response:${colors.reset}`);
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    },
    error: (error) => {
        console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
        if (error.response?.data) {
            console.log(`${colors.yellow}Response:${colors.reset}`);
            console.log(JSON.stringify(error.response.data, null, 2));
        }
        console.log('');
    }
};

// API client
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Test data
const testUser = {
    email: 'apiviewer@example.com',
    username: 'apiviewer',
    firstName: 'API',
    lastName: 'Viewer',
    password: 'password123',
    phone: '+1234567890'
};

async function viewHealthEndpoints() {
    log.section('Health Endpoints');
    
    // Root endpoint
    log.endpoint('GET', '/');
    try {
        const response = await api.get('/');
        log.response(response.data);
    } catch (error) {
        log.error(error);
    }
    
    // Health check
    log.endpoint('GET', '/api/health');
    try {
        const response = await api.get('/api/health');
        log.response(response.data);
    } catch (error) {
        log.error(error);
    }
    
    // Readiness probe
    log.endpoint('GET', '/api/health/ready');
    try {
        const response = await api.get('/api/health/ready');
        log.response(response.data);
    } catch (error) {
        log.error(error);
    }
    
    // Liveness probe
    log.endpoint('GET', '/api/health/live');
    try {
        const response = await api.get('/api/health/live');
        log.response(response.data);
    } catch (error) {
        log.error(error);
    }
}

async function viewUserEndpoints() {
    log.section('User Endpoints');
    
    // List all users
    log.endpoint('GET', '/api/users');
    try {
        const response = await api.get('/api/users');
        log.response(response.data);
    } catch (error) {
        log.error(error);
    }
    
    // List users with query parameters
    log.endpoint('GET', '/api/users?page=1&limit=5&status=active');
    try {
        const response = await api.get('/api/users?page=1&limit=5&status=active');
        log.response(response.data);
    } catch (error) {
        log.error(error);
    }
    
    // Create a new user
    log.endpoint('POST', '/api/users');
    try {
        const response = await api.post('/api/users', testUser);
        log.response(response.data);
        
        // If user was created successfully, test other endpoints with this user
        if (response.data.success && response.data.data) {
            const userId = response.data.data._id;
            
            // Get user by ID
            log.endpoint('GET', `/api/users/${userId}`);
            try {
                const getResponse = await api.get(`/api/users/${userId}`);
                log.response(getResponse.data);
            } catch (error) {
                log.error(error);
            }
            
            // Update user (PATCH)
            log.endpoint('PATCH', `/api/users/${userId}`);
            try {
                const patchResponse = await api.patch(`/api/users/${userId}`, {
                    firstName: 'Updated',
                    lastName: 'Name',
                    phone: '+9876543210'
                });
                log.response(patchResponse.data);
            } catch (error) {
                log.error(error);
            }
            
            // Update user (PUT)
            log.endpoint('PUT', `/api/users/${userId}`);
            try {
                const putResponse = await api.put(`/api/users/${userId}`, {
                    ...testUser,
                    firstName: 'Fully Updated',
                    lastName: 'User'
                });
                log.response(putResponse.data);
            } catch (error) {
                log.error(error);
            }
        }
    } catch (error) {
        log.error(error);
    }
    
    // Search users
    log.endpoint('GET', '/api/users/search/test');
    try {
        const response = await api.get('/api/users/search/test');
        log.response(response.data);
    } catch (error) {
        log.error(error);
    }
    
    // Error cases
    log.endpoint('GET', '/api/users/invalid-id');
    try {
        const response = await api.get('/api/users/invalid-id');
        log.response(response.data);
    } catch (error) {
        log.error(error);
    }
    
    log.endpoint('GET', '/api/users/507f1f77bcf86cd799439011');
    try {
        const response = await api.get('/api/users/507f1f77bcf86cd799439011');
        log.response(response.data);
    } catch (error) {
        log.error(error);
    }
}

async function main() {
    console.log(`${colors.green}${colors.bold}📋 Database API Response Viewer${colors.reset}`);
    console.log(`${colors.green}=====================================${colors.reset}`);
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('');
    
    try {
        await viewHealthEndpoints();
        await viewUserEndpoints();
        
        console.log(`${colors.green}✅ All endpoints viewed successfully!${colors.reset}`);
        console.log(`Finished at: ${new Date().toISOString()}`);
        
    } catch (error) {
        console.log(`${colors.red}❌ Error viewing endpoints: ${error.message}${colors.reset}`);
    }
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    viewHealthEndpoints,
    viewUserEndpoints
};
