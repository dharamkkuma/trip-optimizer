// API utilities for Trip Optimizer Frontend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8003'
const DATABASE_API_URL = process.env.NEXT_PUBLIC_DATABASE_API_URL || 'http://localhost:8002'

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
  phone?: string
  bio?: string
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
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/register`, {
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
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/login`, {
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
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/profile`, {
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
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/profile`, {
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
            const refreshResponse = await fetch(`${AUTH_API_URL}/api/v1/auth/refresh`, {
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
              const retryResponse = await fetch(`${AUTH_API_URL}/api/v1/auth/profile`, {
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
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (token) {
      try {
        await fetch(`${AUTH_API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
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

      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/admin/users?${queryParams.toString()}`, {
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
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/admin/users/${userId}`, {
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
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/admin/users/${userId}`, {
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
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/admin/users/${userId}`, {
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

  // Admin function to create user without auto-login
  createUser: async (userData: {
    username: string
    email: string
    password: string
    firstName: string
    lastName: string
    role?: string
  }): Promise<User> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      // Use the regular register endpoint but don't store the response tokens
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const data = await response.json()
        // Return the user data without storing tokens (to avoid auto-login)
        return data.data.user
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create user')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to create user')
    }
  },

  resetUserPassword: async (userId: string, newPassword: string): Promise<void> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        throw new Error(errorData.message || 'Failed to reset password')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to reset password')
    }
  }
}

// Trip interfaces
export interface Trip {
  _id: string
  title: string
  destination: {
    country: string
    city: string
  }
  dates: {
    startDate: string
    endDate: string
  }
  budget: {
    total: number
    currency: string
  }
  status: 'planning' | 'booked' | 'active' | 'completed' | 'cancelled'
  travelers: Array<{
    userId: string
    role: 'owner' | 'admin' | 'member'
  }>
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTripData {
  title: string
  destination: {
    country: string
    city: string
  }
  dates: {
    startDate: string
    endDate: string
  }
  budget: {
    total: number
    currency: string
  }
  travelers: Array<{
    userId: string
    role: 'owner' | 'admin' | 'member'
  }>
  tags?: string[]
  isPublic?: boolean
}

// Invoice interfaces
export interface Invoice {
  _id: string
  invoiceNumber?: string
  invoiceDate: string
  dueDate: string
  documentStatus: 'uploaded' | 'processing' | 'parsed' | 'verified' | 'approved' | 'rejected' | 'archived'
  processingStatus: 'pending' | 'in_progress' | 'completed' | 'failed' | 'retry'
  parsingStatus: 'not_started' | 'extracting_text' | 'analyzing_structure' | 'completed' | 'failed'
  originalFileName: string
  filePath: string
  fileSize?: number
  fileType?: string
  mimeType?: string
  parsedData?: {
    vendor?: {
      name?: string
      address?: {
        street?: string
        city?: string
        state?: string
        zipCode?: string
        country?: string
      }
      contact?: {
        email?: string
        phone?: string
      }
      taxId?: string
    }
    customer?: {
      name?: string
      address?: {
        street?: string
        city?: string
        state?: string
        zipCode?: string
        country?: string
      }
      contact?: {
        email?: string
        phone?: string
      }
      taxId?: string
    }
    financial?: {
      subtotal?: number
      taxAmount?: number
      totalAmount?: number
      currency?: string
      taxRate?: number
      discountAmount?: number
    }
    lineItems?: Array<{
      description?: string
      quantity?: number
      unitPrice?: number
      totalPrice?: number
      taxRate?: number
    }>
  }
  processingMetadata?: {
    startTime?: string
    endTime?: string
    processingTime?: number
    retryCount?: number
    lastError?: string
    confidenceScore?: number
    extractionMethod?: 'manual' | 'ocr' | 'ai_model'
  }
  verification?: {
    isVerified?: boolean
    verifiedBy?: string
    verifiedAt?: string
    notes?: string
    confidenceLevel?: 'low' | 'medium' | 'high'
  }
  approval?: {
    isApproved?: boolean
    approvedBy?: string
    approvedAt?: string
    notes?: string
    approvalLevel?: 'pending' | 'level_1' | 'level_2' | 'final'
  }
  tripId?: string
  expenseId?: string
  tags?: string[]
  category?: 'accommodation' | 'transportation' | 'meals' | 'entertainment' | 'shopping' | 'other' | 'utility' | 'software' | 'travel' | 'office_supplies' | 'marketing' | 'salary' | 'rent'
  auditTrail?: Array<{
    action: string
    performedBy?: string
    timestamp: string
    details?: string
    changes?: any
  }>
  createdAt: string
  updatedAt: string
}

export interface CreateInvoiceData {
  invoiceNumber?: string
  invoiceDate: string
  dueDate: string
  originalFileName: string
  filePath: string
  fileSize?: number
  fileType?: string
  mimeType?: string
  tripId?: string
  category?: string
  tags?: string[]
}

// Trip API functions
export const tripsAPI = {
  // Create a new trip
  create: async (tripData: CreateTripData): Promise<Trip> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/trips`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create trip')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to create trip')
    }
  },

  // Get all trips
  getAll: async (params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }): Promise<{ data: Trip[], pagination: any }> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.status) queryParams.append('status', params.status)
      if (params?.search) queryParams.append('search', params.search)

      const response = await fetch(`${DATABASE_API_URL}/api/trips?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch trips')
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to fetch trips')
    }
  },

  // Get single trip by ID
  getById: async (id: string): Promise<Trip> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/trips/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch trip')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to fetch trip')
    }
  },

  // Update trip
  update: async (id: string, tripData: Partial<CreateTripData>): Promise<Trip> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/trips/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update trip')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to update trip')
    }
  },

  // Delete trip
  delete: async (id: string): Promise<void> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/trips/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete trip')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to delete trip')
    }
  }
}

// Invoice API functions
export const invoicesAPI = {
  // Create a new invoice
  create: async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create invoice')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to create invoice')
    }
  },

  // Get all invoices
  getAll: async (params?: {
    page?: number
    limit?: number
    documentStatus?: string
    tripId?: string
    search?: string
  }): Promise<{ data: Invoice[], pagination: any }> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.documentStatus) queryParams.append('documentStatus', params.documentStatus)
      if (params?.tripId) queryParams.append('tripId', params.tripId)
      if (params?.search) queryParams.append('search', params.search)

      const response = await fetch(`${DATABASE_API_URL}/api/invoices?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch invoices')
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to fetch invoices')
    }
  },

  // Get single invoice by ID
  getById: async (id: string): Promise<Invoice> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/invoices/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch invoice')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to fetch invoice')
    }
  },

  // Update an invoice
  update: async (id: string, invoiceData: Partial<Invoice>): Promise<Invoice> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update invoice')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to update invoice')
    }
  },

  // Start invoice processing
  startProcessing: async (id: string): Promise<Invoice> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/invoices/${id}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to start processing')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to start processing')
    }
  },

  // Complete invoice processing with parsed data
  completeProcessing: async (id: string, parsedData: any, confidenceScore?: number): Promise<Invoice> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/invoices/${id}/complete-processing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parsedData, confidenceScore }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to complete processing')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to complete processing')
    }
  },

  // Fail invoice processing
  failProcessing: async (id: string, error: { message: string; code?: string }): Promise<Invoice> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/invoices/${id}/fail-processing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to mark processing as failed')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to mark processing as failed')
    }
  },

  // Verify invoice
  verify: async (id: string, notes?: string, confidenceLevel?: 'low' | 'medium' | 'high'): Promise<Invoice> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/invoices/${id}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes, confidenceLevel }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to verify invoice')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to verify invoice')
    }
  },

  // Approve invoice
  approve: async (id: string, notes?: string, approvalLevel?: string): Promise<Invoice> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/invoices/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes, approvalLevel }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to approve invoice')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to approve invoice')
    }
  },

  // Reject invoice
  reject: async (id: string, reason?: string): Promise<Invoice> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/invoices/${id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to reject invoice')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to reject invoice')
    }
  },

  // Get invoice analytics
  getAnalytics: async (): Promise<any> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/invoices/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch analytics')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to fetch analytics')
    }
  },

  // Validate invoice data
  validate: async (parsedData: any): Promise<any> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No access token found')
    }

    try {
      const response = await fetch(`${DATABASE_API_URL}/api/invoices/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parsedData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to validate invoice data')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to validate invoice data')
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
