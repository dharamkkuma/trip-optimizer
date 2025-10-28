import { useState, useEffect } from 'react'
import { User } from '../utils/api'
import Sidebar from './Sidebar'
import Dashboard from './Dashboard'
import TripManagement from './TripManagement'
import DocumentUpload from './DocumentUpload'
import ExpenseLogging from './ExpenseLogging'
import ChatInterface from './ChatInterface'
import Notifications from './Notifications'
import Optimizations from './Optimizations'
import TripTimeline from './TripTimeline'
import AdminDashboard from './AdminDashboard'
import UserProfile from './UserProfile'
import AdminUserManagement from './AdminUserManagement'

interface DashboardLayoutProps {
  user: User
  onUserUpdate: (user: User) => void
  onLogout: () => void
}

type ActiveSection = 
  | 'dashboard'
  | 'trips'
  | 'upload'
  | 'expenses'
  | 'chat'
  | 'notifications'
  | 'optimizations'
  | 'timeline'
  | 'admin'
  | 'profile'
  | 'user-management'

export default function DashboardLayout({ user, onUserUpdate, onLogout }: DashboardLayoutProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard user={user} onSectionChange={(section) => setActiveSection(section as ActiveSection)} />
      case 'trips':
        return <TripManagement user={user} />
      case 'upload':
        return <DocumentUpload user={user} />
      case 'expenses':
        return <ExpenseLogging user={user} />
      case 'chat':
        return <ChatInterface user={user} />
      case 'notifications':
        return <Notifications user={user} />
      case 'optimizations':
        return <Optimizations user={user} />
      case 'timeline':
        return <TripTimeline user={user} />
      case 'admin':
        return <AdminDashboard user={user} />
      case 'profile':
        return <UserProfile user={user} onUserUpdate={onUserUpdate} />
      case 'user-management':
        return <AdminUserManagement user={user} />
      default:
        return <Dashboard user={user} onSectionChange={(section) => setActiveSection(section as ActiveSection)} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <Sidebar
        user={user}
        activeSection={activeSection}
        onSectionChange={(section) => setActiveSection(section as ActiveSection)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {activeSection.replace('_', ' ')}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date and Time Display */}
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-gray-500">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              {/* Notifications Bell */}
              <button 
                onClick={() => setActiveSection('notifications')}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Notifications"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.5-1.5a7 7 0 01-2-4.5V9a5 5 0 00-10 0v2a7 7 0 01-2 4.5L3 17h5m7 0a3 3 0 11-6 0m6 0H9" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  5
                </span>
              </button>

              {/* User Profile Dropdown */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
