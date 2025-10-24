"""
Simple API for Trip Optimizer Frontend
Only handles login with admin/admin credentials
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from datetime import datetime
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

class LoginResponse(BaseModel):
    success: bool
    message: str
    user: dict = None

@app.get("/")
async def root():
    return {"message": "Trip Optimizer API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Simple login endpoint - accepts admin/admin"""
    
    if request.username == "admin" and request.password == "admin":
        user_data = {
            "username": "admin",
            "name": "Administrator",
            "role": "admin",
            "login_time": datetime.now().isoformat()
        }
        
        return LoginResponse(
            success=True,
            message="Login successful",
            user=user_data
        )
    else:
        raise HTTPException(
            status_code=401, 
            detail="Invalid username or password. Use admin/admin"
        )

if __name__ == "__main__":
    uvicorn.run(app, host=API_HOST, port=API_PORT)
