// API utilities for Trip Optimizer Frontend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface User {
  _id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
  fullName: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user: User
  accessToken: string
  refreshToken: string
}

export const authAPI = {
  // Register a new user
  register: async (userData: {
    username: string
    email: string
    password: string
    firstName: string
    lastName: string
  }): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store tokens and user data locally
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('isLoggedIn', 'true')
        
        return data
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Registration failed')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Registration failed')
    }
  },

  // Login user
  login: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store tokens and user data locally
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('isLoggedIn', 'true')
        
        return data
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Login failed')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Login failed')
    }
  },

  // Get user profile
  getProfile: async (): Promise<User> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.user
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to get profile')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to get profile')
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    const token = localStorage.getItem('accessToken')
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        console.error('Logout request failed:', error)
      }
    }
    
    // Clear local storage regardless of API call success
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('isLoggedIn')
  },

  // Utility functions
  getStoredUser: (): User | null => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken')
  },

  isLoggedIn: (): boolean => {
    return localStorage.getItem('isLoggedIn') === 'true' && !!localStorage.getItem('accessToken')
  }
}

// Placeholder for future document API
export const documentsAPI = {
  upload: async (file: File) => {
    // Placeholder for future implementation
    console.log('Document upload:', file.name)
    return Promise.resolve({
      document_id: 'demo_' + Date.now(),
      status: 'uploaded',
      filename: file.name
    })
  },

  getStatus: async (documentId: string) => {
    // Placeholder for future implementation
    return Promise.resolve({
      document_id: documentId,
      status: 'processing',
      progress: 50,
      extracted_data: null
    })
  }
}
