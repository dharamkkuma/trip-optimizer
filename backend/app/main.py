"""
Trip Optimizer Backend API
Handles authentication via Auth API and user management via Database API
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
    title="Trip Optimizer API",
    description="Simple API for frontend login",
    version="1.0.0"
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

# HTTP client for API calls
async def get_http_client():
    return httpx.AsyncClient(timeout=30.0)

# Authentication dependency
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Access token required")
    
    token = authorization.split(" ")[1]
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_API_URL}/api/v1/auth/verify",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["data"]["user"]
            else:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth service unavailable")

@app.get("/")
async def root():
    return {"message": "Trip Optimizer API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/auth/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    """Register a new user via Auth API"""
    
    async with httpx.AsyncClient() as client:
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
                error_data = response.json()
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Registration failed")
                )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth service unavailable")

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login user via Auth API"""
    
    async with httpx.AsyncClient() as client:
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
                error_data = response.json()
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Login failed")
                )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth service unavailable")

@app.get("/auth/profile", response_model=UserProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile via Auth API"""
    
    async with httpx.AsyncClient() as client:
        try:
            # Get the token from the request headers
            # This is a simplified approach - in production, you'd want to pass the token properly
            response = await client.get(
                f"{AUTH_API_URL}/api/v1/auth/profile",
                headers={"Authorization": f"Bearer {current_user.get('accessToken', '')}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return UserProfileResponse(
                    success=True,
                    message="Profile retrieved successfully",
                    user=data["data"]["user"]
                )
            else:
                error_data = response.json()
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to retrieve profile")
                )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth service unavailable")

@app.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user via Auth API"""
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_API_URL}/api/v1/auth/logout",
                headers={"Authorization": f"Bearer {current_user.get('accessToken', '')}"}
            )
            
            if response.status_code == 200:
                return {"success": True, "message": "Logged out successfully"}
            else:
                error_data = response.json()
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Logout failed")
                )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth service unavailable")

# Legacy endpoint for backward compatibility
@app.post("/login", response_model=LoginResponse)
async def legacy_login(request: LoginRequest):
    """Legacy login endpoint - redirects to new auth flow"""
    return await login(request)

if __name__ == "__main__":
    uvicorn.run(app, host=API_HOST, port=API_PORT)
