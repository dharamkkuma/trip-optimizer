"""
Trip Optimizer Backend API - Orchestrator Service
Routes requests between frontend and microservices (Auth API, Database API, Storage API)
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import httpx
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Trip Optimizer Backend API",
    description="Lightweight orchestrator service for coordinating microservice requests",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration from environment variables
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
AUTH_API_URL = os.getenv("AUTH_API_URL", "http://localhost:8003")
DATABASE_API_URL = os.getenv("DATABASE_API_URL", "http://localhost:8002")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    firstName: str
    lastName: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    user: dict = None
    accessToken: str = None
    refreshToken: str = None

class RegisterResponse(BaseModel):
    success: bool
    message: str
    user: dict = None
    accessToken: str = None
    refreshToken: str = None

class UserProfileResponse(BaseModel):
    success: bool
    message: str
    user: dict = None

# HTTP client configuration
HTTP_TIMEOUT = 30.0
MAX_RETRIES = 3

# HTTP client for API calls
def get_http_client():
    """Get configured HTTP client for microservice communication"""
    return httpx.AsyncClient(
        timeout=HTTP_TIMEOUT,
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=100)
    )

# Authentication dependency
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Validate JWT token and return current user information"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Access token required. Please provide a valid Bearer token."
        )
    
    token = authorization.split(" ")[1]
    
    async with get_http_client() as client:
        try:
            response = await client.post(
                f"{AUTH_API_URL}/api/v1/auth/verify",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["data"]["user"]
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            else:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Token validation failed: {response.text}"
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Auth service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")

@app.get("/")
async def root():
    """API information and status"""
    return {
        "service": "Trip Optimizer Backend API",
        "version": "1.0.0",
        "description": "Lightweight orchestrator service for coordinating microservice requests",
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "backend-orchestrator",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.post("/auth/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    """Register a new user via Auth API"""
    
    async with get_http_client() as client:
        try:
            response = await client.post(
                f"{AUTH_API_URL}/api/v1/auth/register",
                json={
                    "username": request.username,
                    "email": request.email,
                    "password": request.password,
                    "firstName": request.firstName,
                    "lastName": request.lastName
                }
            )
            
            if response.status_code == 201:
                data = response.json()
                return RegisterResponse(
                    success=True,
                    message="Registration successful",
                    user=data["data"]["user"],
                    accessToken=data["data"]["accessToken"],
                    refreshToken=data["data"]["refreshToken"]
                )
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Registration failed"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Registration failed")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Auth service timeout during registration")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login user via Auth API"""
    
    async with get_http_client() as client:
        try:
            response = await client.post(
                f"{AUTH_API_URL}/api/v1/auth/login",
                json={
                    "emailOrUsername": request.username,
                    "password": request.password
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return LoginResponse(
                    success=True,
                    message="Login successful",
                    user=data["data"]["user"],
                    accessToken=data["data"]["accessToken"],
                    refreshToken=data["data"]["refreshToken"]
                )
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Login failed"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Login failed")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Auth service timeout during login")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")

@app.get("/auth/profile", response_model=UserProfileResponse)
async def get_profile(authorization: Optional[str] = Header(None)):
    """Get user profile via Auth API"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Access token required. Please provide a valid Bearer token."
        )
    
    token = authorization.split(" ")[1]
    
    async with get_http_client() as client:
        try:
            response = await client.get(
                f"{AUTH_API_URL}/api/v1/auth/profile",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return UserProfileResponse(
                    success=True,
                    message="Profile retrieved successfully",
                    user=data["data"]["user"]
                )
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to retrieve profile"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to retrieve profile")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Auth service timeout during profile retrieval")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")

@app.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Logout user via Auth API"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Access token required. Please provide a valid Bearer token."
        )
    
    token = authorization.split(" ")[1]
    
    async with get_http_client() as client:
        try:
            response = await client.post(
                f"{AUTH_API_URL}/api/v1/auth/logout",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                return {"success": True, "message": "Logged out successfully"}
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Logout failed"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Logout failed")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Auth service timeout during logout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")

# Legacy endpoint for backward compatibility
@app.post("/login", response_model=LoginResponse)
async def legacy_login(request: LoginRequest):
    """Legacy login endpoint - redirects to new auth flow"""
    return await login(request)

if __name__ == "__main__":
    uvicorn.run(app, host=API_HOST, port=API_PORT)
