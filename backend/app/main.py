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
STORAGE_API_URL = os.getenv("STORAGE_API_URL", "http://localhost:8001")

# CORS configuration - allow both internal Kubernetes service and external localhost (for port-forwarding)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",           # External URL (port forwarding)
    "http://frontend-service:3000",    # Internal Kubernetes service URL
    FRONTEND_URL,                      # From environment variable
]
# Remove duplicates while preserving order
CORS_ALLOWED_ORIGINS = list(dict.fromkeys(CORS_ALLOWED_ORIGINS))

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
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

# Additional models for trips and invoices
class TripCreateRequest(BaseModel):
    title: str
    destination: dict
    dates: dict
    budget: dict
    travelers: list
    tags: list = []
    isPublic: bool = False

class TripUpdateRequest(BaseModel):
    title: str = None
    destination: dict = None
    dates: dict = None
    budget: dict = None
    travelers: list = None
    tags: list = None
    isPublic: bool = None

class InvoiceCreateRequest(BaseModel):
    invoiceNumber: str = None
    invoiceDate: str
    dueDate: str
    originalFileName: str
    filePath: str
    fileSize: int = None
    fileType: str = None
    mimeType: str = None
    tripId: str = None
    category: str = None
    tags: list = []

class InvoiceUpdateRequest(BaseModel):
    invoiceNumber: str = None
    invoiceDate: str = None
    dueDate: str = None
    originalFileName: str = None
    filePath: str = None
    fileSize: int = None
    fileType: str = None
    mimeType: str = None
    tripId: str = None
    category: str = None
    tags: list = None

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
                user_data = data["data"]["user"]
                user_data["accessToken"] = token  # Store the token for later use
                return user_data
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

# =============================================================================
# TRIPS API ROUTES - Proxy to Database API
# =============================================================================

@app.post("/api/trips")
async def create_trip(request: TripCreateRequest, current_user: dict = Depends(get_current_user)):
    """Create a new trip via Database API"""
    
    # Extract user ID and email from current_user
    user_id = current_user.get('_id') or current_user.get('id')
    user_email = current_user.get('email', '')
    
    async with get_http_client() as client:
        try:
            response = await client.post(
                f"{DATABASE_API_URL}/api/trips",
                json=request.dict(),
                headers={
                    "Authorization": f"Bearer {current_user.get('accessToken', '')}",
                    "x-user-id": str(user_id) if user_id else "",
                    "x-user-email": user_email
                }
            )
            
            if response.status_code == 201:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to create trip"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to create trip")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

@app.get("/api/trips")
async def get_trips(
    page: int = 1,
    limit: int = 10,
    status: str = None,
    search: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all trips via Database API"""
    
    # Extract user ID and email from current_user
    user_id = current_user.get('_id') or current_user.get('id')
    user_email = current_user.get('email', '')
    
    params = {"page": page, "limit": limit}
    if status:
        params["status"] = status
    if search:
        params["search"] = search
    
    async with get_http_client() as client:
        try:
            response = await client.get(
                f"{DATABASE_API_URL}/api/trips",
                params=params,
                headers={
                    "Authorization": f"Bearer {current_user.get('accessToken', '')}",
                    "x-user-id": str(user_id) if user_id else "",
                    "x-user-email": user_email
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to fetch trips"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to fetch trips")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

@app.get("/api/trips/{trip_id}")
async def get_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    """Get single trip by ID via Database API"""
    
    async with get_http_client() as client:
        try:
            response = await client.get(
                f"{DATABASE_API_URL}/api/trips/{trip_id}",
                headers={"Authorization": f"Bearer {current_user.get('accessToken', '')}"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to fetch trip"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to fetch trip")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

@app.put("/api/trips/{trip_id}")
async def update_trip(trip_id: str, request: TripUpdateRequest, current_user: dict = Depends(get_current_user)):
    """Update trip via Database API"""
    
    async with get_http_client() as client:
        try:
            response = await client.put(
                f"{DATABASE_API_URL}/api/trips/{trip_id}",
                json=request.dict(exclude_unset=True),
                headers={"Authorization": f"Bearer {current_user.get('accessToken', '')}"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to update trip"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to update trip")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

@app.delete("/api/trips/{trip_id}")
async def delete_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    """Delete trip via Database API"""
    
    async with get_http_client() as client:
        try:
            response = await client.delete(
                f"{DATABASE_API_URL}/api/trips/{trip_id}",
                headers={"Authorization": f"Bearer {current_user.get('accessToken', '')}"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to delete trip"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to delete trip")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

# =============================================================================
# INVOICES API ROUTES - Proxy to Database API
# =============================================================================

@app.post("/api/invoices")
async def create_invoice(request: InvoiceCreateRequest, current_user: dict = Depends(get_current_user)):
    """Create a new invoice via Database API"""
    
    # Extract user ID and email from current_user
    user_id = current_user.get('_id') or current_user.get('id')
    user_email = current_user.get('email', '')
    
    async with get_http_client() as client:
        try:
            response = await client.post(
                f"{DATABASE_API_URL}/api/invoices",
                json=request.dict(),
                headers={
                    "Authorization": f"Bearer {current_user.get('accessToken', '')}",
                    "x-user-id": str(user_id) if user_id else "",
                    "x-user-email": user_email
                }
            )
            
            if response.status_code == 201:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to create invoice"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to create invoice")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

@app.get("/api/invoices")
async def get_invoices(
    page: int = 1,
    limit: int = 10,
    documentStatus: str = None,
    tripId: str = None,
    search: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all invoices via Database API"""
    
    # Extract user ID and email from current_user
    user_id = current_user.get('_id') or current_user.get('id')
    user_email = current_user.get('email', '')
    
    params = {"page": page, "limit": limit}
    if documentStatus:
        params["documentStatus"] = documentStatus
    if tripId:
        params["tripId"] = tripId
    if search:
        params["search"] = search
    
    async with get_http_client() as client:
        try:
            response = await client.get(
                f"{DATABASE_API_URL}/api/invoices",
                params=params,
                headers={
                    "Authorization": f"Bearer {current_user.get('accessToken', '')}",
                    "x-user-id": str(user_id) if user_id else "",
                    "x-user-email": user_email
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to fetch invoices"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to fetch invoices")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

@app.get("/api/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    """Get single invoice by ID via Database API"""
    
    # Extract user ID and email from current_user
    user_id = current_user.get('_id') or current_user.get('id')
    user_email = current_user.get('email', '')
    
    async with get_http_client() as client:
        try:
            response = await client.get(
                f"{DATABASE_API_URL}/api/invoices/{invoice_id}",
                headers={
                    "Authorization": f"Bearer {current_user.get('accessToken', '')}",
                    "x-user-id": str(user_id) if user_id else "",
                    "x-user-email": user_email
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to fetch invoice"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to fetch invoice")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

@app.put("/api/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, request: InvoiceUpdateRequest, current_user: dict = Depends(get_current_user)):
    """Update invoice via Database API"""
    
    # Extract user ID and email from current_user
    user_id = current_user.get('_id') or current_user.get('id')
    user_email = current_user.get('email', '')
    
    async with get_http_client() as client:
        try:
            response = await client.put(
                f"{DATABASE_API_URL}/api/invoices/{invoice_id}",
                json=request.dict(exclude_unset=True),
                headers={
                    "Authorization": f"Bearer {current_user.get('accessToken', '')}",
                    "x-user-id": str(user_id) if user_id else "",
                    "x-user-email": user_email
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to update invoice"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to update invoice")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

@app.post("/api/invoices/{invoice_id}/process")
async def start_invoice_processing(invoice_id: str, current_user: dict = Depends(get_current_user)):
    """Start invoice processing via Database API"""
    
    # Extract user ID and email from current_user
    user_id = current_user.get('_id') or current_user.get('id')
    user_email = current_user.get('email', '')
    
    async with get_http_client() as client:
        try:
            response = await client.post(
                f"{DATABASE_API_URL}/api/invoices/{invoice_id}/process",
                headers={
                    "Authorization": f"Bearer {current_user.get('accessToken', '')}",
                    "x-user-id": str(user_id) if user_id else "",
                    "x-user-email": user_email
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to start invoice processing"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to start invoice processing")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

@app.post("/api/invoices/{invoice_id}/complete-processing")
async def complete_invoice_processing(
    invoice_id: str, 
    request: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Complete invoice processing via Database API"""
    
    # Extract user ID and email from current_user
    user_id = current_user.get('_id') or current_user.get('id')
    user_email = current_user.get('email', '')
    
    async with get_http_client() as client:
        try:
            response = await client.post(
                f"{DATABASE_API_URL}/api/invoices/{invoice_id}/complete-processing",
                json=request,
                headers={
                    "Authorization": f"Bearer {current_user.get('accessToken', '')}",
                    "x-user-id": str(user_id) if user_id else "",
                    "x-user-email": user_email
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to complete invoice processing"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to complete invoice processing")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

@app.post("/api/invoices/{invoice_id}/fail-processing")
async def fail_invoice_processing(
    invoice_id: str,
    request: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Mark invoice processing as failed via Database API"""
    
    # Extract user ID and email from current_user
    user_id = current_user.get('_id') or current_user.get('id')
    user_email = current_user.get('email', '')
    
    async with get_http_client() as client:
        try:
            response = await client.post(
                f"{DATABASE_API_URL}/api/invoices/{invoice_id}/fail-processing",
                json=request,
                headers={
                    "Authorization": f"Bearer {current_user.get('accessToken', '')}",
                    "x-user-id": str(user_id) if user_id else "",
                    "x-user-email": user_email
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to mark invoice processing as failed"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to mark invoice processing as failed")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

# =============================================================================
# USERS API ROUTES - Proxy to Database API
# =============================================================================

@app.get("/api/users")
async def get_users(
    page: int = 1,
    limit: int = 10,
    search: str = None,
    role: str = None,
    status: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all users via Database API"""
    
    params = {"page": page, "limit": limit}
    if search:
        params["search"] = search
    if role:
        params["role"] = role
    if status:
        params["status"] = status
    
    async with get_http_client() as client:
        try:
            response = await client.get(
                f"{DATABASE_API_URL}/api/users",
                params=params,
                headers={"Authorization": f"Bearer {current_user.get('accessToken', '')}"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to fetch users"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to fetch users")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

@app.get("/api/users/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get single user by ID via Database API"""
    
    async with get_http_client() as client:
        try:
            response = await client.get(
                f"{DATABASE_API_URL}/api/users/{user_id}",
                headers={"Authorization": f"Bearer {current_user.get('accessToken', '')}"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to fetch user"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to fetch user")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Database service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Database service unavailable: {str(e)}")

# =============================================================================
# STORAGE API ROUTES - Proxy to Storage API
# =============================================================================

@app.post("/api/storage/upload")
async def upload_file(current_user: dict = Depends(get_current_user)):
    """Upload file via Storage API"""
    
    async with get_http_client() as client:
        try:
            response = await client.post(
                f"{STORAGE_API_URL}/upload",
                headers={"Authorization": f"Bearer {current_user.get('accessToken', '')}"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to upload file"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to upload file")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Storage service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Storage service unavailable: {str(e)}")

@app.get("/api/storage/files")
async def get_files(current_user: dict = Depends(get_current_user)):
    """Get all files via Storage API"""
    
    async with get_http_client() as client:
        try:
            response = await client.get(
                f"{STORAGE_API_URL}/files",
                headers={"Authorization": f"Bearer {current_user.get('accessToken', '')}"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": "Failed to fetch files"}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to fetch files")
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Storage service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Storage service unavailable: {str(e)}")

# Legacy endpoint for backward compatibility
@app.post("/login", response_model=LoginResponse)
async def legacy_login(request: LoginRequest):
    """Legacy login endpoint - redirects to new auth flow"""
    return await login(request)

if __name__ == "__main__":
    uvicorn.run(app, host=API_HOST, port=API_PORT)
