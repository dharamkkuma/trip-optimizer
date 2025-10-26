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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store tokens and user data locally
        localStorage.setItem('accessToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('isLoggedIn', 'true')
        
        return data.data
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Registration failed')
    }
  },

  // Login user
  login: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername: username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store tokens and user data locally
        localStorage.setItem('accessToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('isLoggedIn', 'true')
        
        return data.data
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.data.data.user
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get profile')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to get profile')
    }
  },

  // Update user profile
  updateProfile: async (profileData: {
    firstName: string
    lastName: string
    email: string
  }): Promise<User> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        const data = await response.json()
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(data.data.user))
        return data.data.user
      } else if (response.status === 403) {
        // Token expired, try to refresh
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken }),
            })

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              localStorage.setItem('accessToken', refreshData.data.accessToken)
              localStorage.setItem('refreshToken', refreshData.data.refreshToken)
              localStorage.setItem('user', JSON.stringify(refreshData.data.user))
              
              // Retry the original request with new token
              const retryResponse = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${refreshData.data.accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
              })

              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                localStorage.setItem('user', JSON.stringify(retryData.data.user))
                return retryData.data.user
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            // Clear tokens and redirect to login
            authAPI.clearAuthData()
            throw new Error('Session expired. Please login again.')
          }
        }
        throw new Error('Session expired. Please login again.')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update profile')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to update profile')
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    const token = localStorage.getItem('accessToken')
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
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
    authAPI.clearAuthData()
  },

  // Utility functions
  getStoredUser: (): User | null => {
    try {
      const user = localStorage.getItem('user')
      if (!user || user === 'undefined' || user === 'null') {
        return null
      }
      return JSON.parse(user)
    } catch (error) {
      console.error('Error parsing stored user:', error)
      // Clear invalid data
      authAPI.clearAuthData()
      return null
    }
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken')
  },

  isLoggedIn: (): boolean => {
    try {
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      const accessToken = localStorage.getItem('accessToken')
      return isLoggedIn === 'true' && !!accessToken && accessToken !== 'undefined'
    } catch (error) {
      console.error('Error checking login status:', error)
      return false
    }
  },

  // Clear all auth data safely
  clearAuthData: (): void => {
    try {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('isLoggedIn')
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }
  },

  // Admin functions
  getAllUsers: async (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  }): Promise<any> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.role) queryParams.append('role', params.role)
      if (params?.status) queryParams.append('status', params.status)

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/admin/users?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.data
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get users')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to get users')
    }
  },

  getUserById: async (userId: string): Promise<User> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/admin/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.data.data
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get user')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to get user')
    }
  },

  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const data = await response.json()
        return data.data.data
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update user')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to update user')
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete user')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to delete user')
    }
  },

  resetUserPassword: async (userId: string, newPassword: string): Promise<void> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to reset password')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to reset password')
    }
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
