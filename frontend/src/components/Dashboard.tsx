import { useState, useEffect } from 'react'
import { User, tripsAPI, Trip } from '../utils/api'

interface DashboardProps {
  user: User
  onSectionChange: (section: string) => void
}

interface DashboardStats {
  totalTrips: number
  activeTrips: number
  totalExpenses: number
  totalSavings: number
  documentsProcessed: number
}

interface RecentTrip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  status: 'planning' | 'booked' | 'active' | 'completed' | 'cancelled'
  totalExpenses: number
  budget: number
}

export default function Dashboard({ user, onSectionChange }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    activeTrips: 0,
    totalExpenses: 0,
    totalSavings: 0,
    documentsProcessed: 0
  })
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([])
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Load real data from API
    loadDashboardData()

    return () => clearInterval(timeInterval)
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load trips from API
      const tripsResponse = await tripsAPI.getAll()
      const trips = tripsResponse.data || []

      // Calculate stats
      const totalTrips = trips.length
      const activeTrips = trips.filter(trip => trip.status === 'active' || trip.status === 'booked').length
      const totalExpenses = trips.reduce((sum, trip) => sum + (trip.budget?.total || 0), 0)
      
      // Convert trips to RecentTrip format
      const recentTripsData: RecentTrip[] = trips.slice(0, 5).map(trip => ({
        id: trip._id,
        name: trip.title,
        destination: `${trip.destination.city}, ${trip.destination.country}`,
        startDate: trip.dates.startDate,
        endDate: trip.dates.endDate,
        status: trip.status as 'planning' | 'booked' | 'active' | 'completed' | 'cancelled',
        totalExpenses: 0, // We'll calculate this when we have expenses
        budget: trip.budget?.total || 0
      }))

      // Get upcoming trips (next 30 days)
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const upcoming = trips.filter(trip => {
        const startDate = new Date(trip.dates.startDate)
        return startDate >= now && startDate <= thirtyDaysFromNow
      })

      setStats({
        totalTrips,
        activeTrips,
        totalExpenses,
        totalSavings: 150.00, // Placeholder
        documentsProcessed: 12 // Placeholder
      })
      
      setRecentTrips(recentTripsData)
      setUpcomingTrips(upcoming)
      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getTimeUntilTrip = (dateString: string) => {
    const tripDate = new Date(dateString)
    const now = new Date()
    const diffTime = tripDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Past trip'
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `${diffDays} days away`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks away`
    return `${Math.ceil(diffDays / 30)} months away`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {user?.firstName || user?.username}!
          </h2>
          <p className="text-blue-100">
            Here's what's happening with your trips today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Trips</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeTrips}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">€{stats.totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Savings</p>
              <p className="text-2xl font-bold text-gray-900">€{stats.totalSavings.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.documentsProcessed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Trips</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentTrips.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{trip.name}</h4>
                  <p className="text-sm text-gray-600">{trip.destination}</p>
                  <p className="text-xs text-gray-500">
                    {trip.startDate} - {trip.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      trip.status === 'active' ? 'bg-green-100 text-green-800' :
                      trip.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                      trip.status === 'booked' ? 'bg-yellow-100 text-yellow-800' :
                      trip.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    €{trip.totalExpenses} / €{trip.budget}
                  </p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(trip.totalExpenses / trip.budget) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => onSectionChange('upload')}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium">Upload Document</span>
            </button>
            <button 
              onClick={() => onSectionChange('trips')}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium">View Trips</span>
            </button>
            <button 
              onClick={() => onSectionChange('chat')}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium">Ask AI Assistant</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <p className="text-sm text-gray-600">Document processed successfully</p>
              <span className="text-xs text-gray-400">2m ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <p className="text-sm text-gray-600">New optimization found</p>
              <span className="text-xs text-gray-400">1h ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <p className="text-sm text-gray-600">Trip budget updated</p>
              <span className="text-xs text-gray-400">3h ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Trips</h3>
          <div className="space-y-3">
            {upcomingTrips.length > 0 ? (
              upcomingTrips.map((trip) => {
                const startDate = new Date(trip.dates.startDate)
                const now = new Date()
                const daysUntilTrip = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={trip._id} className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">{trip.title}</h4>
                    <p className="text-sm text-gray-600">{trip.destination.city}, {trip.destination.country}</p>
                    <p className="text-sm text-gray-600">{formatDate(trip.dates.startDate)} - {formatDate(trip.dates.endDate)}</p>
                    <p className="text-xs text-blue-600">{getTimeUntilTrip(trip.dates.startDate)}</p>
                  </div>
                )
              })
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No upcoming trips</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
