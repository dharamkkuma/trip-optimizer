import { useState, useEffect } from 'react'
import Head from 'next/head'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import DashboardLayout from '../components/DashboardLayout'
import { authAPI, User } from '../utils/api'
import { AlertProvider } from '../components/AlertProvider'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    // Check for existing authentication on page load
    const storedUser = authAPI.getStoredUser()
    const isLoggedIn = authAPI.isLoggedIn()
    
    if (storedUser && isLoggedIn) {
      setUser(storedUser)
      setIsLoggedIn(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
    setIsLoggedIn(true)
  }

  const handleRegister = (userData: User) => {
    setUser(userData)
    setIsLoggedIn(true)
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    setUser(null)
    setIsLoggedIn(false)
  }

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <>
      <Head>
        <title>Trip Optimizer</title>
        <meta name="description" content="AI-powered travel optimization" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AlertProvider>
        <main className="min-h-screen bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading Trip Optimizer...</p>
            </div>
          </div>
        ) : !isLoggedIn ? (
          <div className="container mx-auto px-4 py-8">
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Trip Optimizer
              </h1>
              <p className="text-gray-600">
                AI-powered travel optimization platform
              </p>
            </header>

            <div className="max-w-md mx-auto">
              {authMode === 'login' ? (
                <LoginForm 
                  onLogin={handleLogin} 
                  onSwitchToRegister={() => setAuthMode('register')}
                />
              ) : (
                <RegisterForm 
                  onRegister={handleRegister}
                  onSwitchToLogin={() => setAuthMode('login')}
                />
              )}
            </div>
          </div>
        ) : user ? (
          <DashboardLayout 
            user={user} 
            onUserUpdate={handleUserUpdate}
            onLogout={handleLogout}
          />
        ) : null}
        </main>
      </AlertProvider>
    </>
  )
}