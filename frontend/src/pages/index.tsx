import { useState, useEffect } from 'react'
import Head from 'next/head'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import UserProfile from '../components/UserProfile'
import FileUpload from '../components/FileUpload'
import { authAPI, User } from '../utils/api'

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

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Trip Optimizer
            </h1>
            <p className="text-gray-600">
              AI-powered travel optimization platform
            </p>
          </header>

          {isLoading ? (
            <div className="max-w-md mx-auto text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : !isLoggedIn ? (
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
          ) : (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Welcome back, {user?.firstName || user?.username}!
                </h2>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                >
                  Logout
                </button>
              </div>

              {/* Main content area */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <UserProfile user={user} onUserUpdate={handleUserUpdate} />
                </div>
                <div className="lg:col-span-2">
                  <FileUpload />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
