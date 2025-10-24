// Simple API utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const authAPI = {
  // API-based authentication
  login: async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store user data locally
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('isLoggedIn', 'true')
        
        return { success: true, user: data.user }
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Login failed')
      }
    } catch (error) {
      throw new Error((error as Error).message || 'Login failed')
    }
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('isLoggedIn')
  },

  getStoredUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  isLoggedIn: () => {
    return localStorage.getItem('isLoggedIn') === 'true'
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
