import { useState, useEffect } from 'react'
import { User } from '../utils/api'

interface TripManagementProps {
  user: User
}

interface Trip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  status: 'planned' | 'active' | 'completed'
  budget: number
  totalExpenses: number
  documentsCount: number
  createdAt: string
}

export default function TripManagement({ user }: TripManagementProps) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    // Simulate loading trips
    setTimeout(() => {
      const sampleTrips: Trip[] = [
        {
          id: 'trip_1',
          name: 'Paris Business Trip',
          destination: 'Paris, France',
          startDate: '2024-02-15',
          endDate: '2024-02-18',
          status: 'planned',
          budget: 2000.00,
          totalExpenses: 450.00,
          documentsCount: 3,
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'trip_2',
          name: 'London Conference',
          destination: 'London, UK',
          startDate: '2024-03-10',
          endDate: '2024-03-12',
          status: 'active',
          budget: 1500.00,
          totalExpenses: 1200.00,
          documentsCount: 5,
          createdAt: '2024-01-10T14:30:00Z'
        },
        {
          id: 'trip_3',
          name: 'Berlin Meeting',
          destination: 'Berlin, Germany',
          startDate: '2024-04-05',
          endDate: '2024-04-07',
          status: 'planned',
          budget: 1200.00,
          totalExpenses: 0.00,
          documentsCount: 0,
          createdAt: '2024-01-20T09:15:00Z'
        }
      ]
      setTrips(sampleTrips)
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'planned':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBudgetProgress = (expenses: number, budget: number) => {
    return Math.min((expenses / budget) * 100, 100)
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
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Trips</h2>
            <p className="text-gray-600">
              Manage your travel plans, view expenses, and track documents
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Trip
          </button>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{trip.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {trip.destination}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {trip.documentsCount} documents
                </div>
              </div>
              
              {/* Budget Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Budget Progress</span>
                  <span className="font-medium text-gray-900">
                    €{trip.totalExpenses.toLocaleString()} / €{trip.budget.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getBudgetProgress(trip.totalExpenses, trip.budget) > 80 ? 'bg-red-500' :
                      getBudgetProgress(trip.totalExpenses, trip.budget) > 60 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${getBudgetProgress(trip.totalExpenses, trip.budget)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(getBudgetProgress(trip.totalExpenses, trip.budget))}% used
                </div>
              </div>
            </div>
            
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  View Details
                </button>
                <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Edit Trip
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {trips.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No trips yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first trip.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Trip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
