import { useState, useEffect } from 'react'
import { User } from '../utils/api'

interface OptimizationsProps {
  user: User
}

interface Optimization {
  id: string
  type: 'hotel_deal' | 'flight_deal' | 'package_deal'
  title: string
  description: string
  currentOption: {
    name: string
    price: number
    currency: string
  }
  suggestedOption: {
    name: string
    price: number
    currency: string
    rating?: number
    amenities?: string[]
  }
  savings: {
    amount: number
    currency: string
    percentage: number
  }
  confidence: number
  expiresAt: string
  tripId: string
}

export default function Optimizations({ user }: OptimizationsProps) {
  const [optimizations, setOptimizations] = useState<Optimization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading optimizations
    setTimeout(() => {
      const sampleOptimizations: Optimization[] = [
        {
          id: 'opt_1',
          type: 'hotel_deal',
          title: 'Better Hotel Deal Available',
          description: 'Found a similar hotel in the same area for €70 less',
          currentOption: {
            name: 'Grand Hotel Paris',
            price: 450.00,
            currency: 'EUR'
          },
          suggestedOption: {
            name: 'Hotel Plaza Paris',
            price: 380.00,
            currency: 'EUR',
            rating: 4.2,
            amenities: ['WiFi', 'Breakfast', 'Gym']
          },
          savings: {
            amount: 70.00,
            currency: 'EUR',
            percentage: 15.6
          },
          confidence: 0.85,
          expiresAt: '2024-01-25T23:59:59Z',
          tripId: 'trip_789'
        },
        {
          id: 'opt_2',
          type: 'flight_deal',
          title: 'Flight Optimization Found',
          description: 'Alternative flight route with better timing and lower cost',
          currentOption: {
            name: 'Air France Direct',
            price: 320.00,
            currency: 'EUR'
          },
          suggestedOption: {
            name: 'Lufthansa via Frankfurt',
            price: 280.00,
            currency: 'EUR',
            rating: 4.0,
            amenities: ['Meal', 'Entertainment']
          },
          savings: {
            amount: 40.00,
            currency: 'EUR',
            percentage: 12.5
          },
          confidence: 0.78,
          expiresAt: '2024-01-23T18:00:00Z',
          tripId: 'trip_789'
        }
      ]
      setOptimizations(sampleOptimizations)
      setLoading(false)
    }, 1000)
  }, [])

  const applyOptimization = (optimizationId: string) => {
    setOptimizations(prev => prev.map(opt => 
      opt.id === optimizationId 
        ? { ...opt, status: 'applied' as any }
        : opt
    ))
  }

  const dismissOptimization = (optimizationId: string) => {
    setOptimizations(prev => prev.filter(opt => opt.id !== optimizationId))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel_deal':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      case 'flight_deal':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )
      case 'package_deal':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel_deal':
        return 'bg-blue-100 text-blue-800'
      case 'flight_deal':
        return 'bg-green-100 text-green-800'
      case 'package_deal':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Optimizations</h2>
            <p className="text-gray-600">
              AI-powered suggestions to help you save money on your trips
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              €{optimizations.reduce((sum, opt) => sum + opt.savings.amount, 0).toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Total Potential Savings</div>
          </div>
        </div>
      </div>

      {/* Optimizations List */}
      <div className="space-y-4">
        {optimizations.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No optimizations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              We're continuously monitoring for better deals. Check back later!
            </p>
          </div>
        ) : (
          optimizations.map((optimization) => (
            <div key={optimization.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTypeIcon(optimization.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{optimization.title}</h3>
                      <p className="text-sm text-gray-600">{optimization.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(optimization.type)}`}>
                      {optimization.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(optimization.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>

                {/* Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Current Option */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Current Option</h4>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">{optimization.currentOption.name}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {optimization.currentOption.currency} {optimization.currentOption.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Suggested Option */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Suggested Option</h4>
                    <div className="space-y-2">
                      <p className="font-medium text-green-900">{optimization.suggestedOption.name}</p>
                      <p className="text-lg font-bold text-green-900">
                        {optimization.suggestedOption.currency} {optimization.suggestedOption.price.toFixed(2)}
                      </p>
                      {optimization.suggestedOption.rating && (
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-green-700">Rating:</span>
                          <span className="text-sm font-medium text-green-700">{optimization.suggestedOption.rating}/5</span>
                        </div>
                      )}
                      {optimization.suggestedOption.amenities && (
                        <div className="flex flex-wrap gap-1">
                          {optimization.suggestedOption.amenities.map((amenity, index) => (
                            <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Savings Highlight */}
                <div className="bg-green-100 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">Potential Savings</h4>
                      <p className="text-sm text-green-700">
                        Save {optimization.savings.currency} {optimization.savings.amount.toFixed(2)} ({optimization.savings.percentage.toFixed(1)}% off)
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      -{optimization.savings.currency} {optimization.savings.amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Expiration */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>Expires: {new Date(optimization.expiresAt).toLocaleString()}</span>
                  <span>Trip: {optimization.tripId}</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => applyOptimization(optimization.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Apply Optimization
                  </button>
                  <button
                    onClick={() => dismissOptimization(optimization.id)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">🔍 How Our AI Finds Optimizations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="font-medium text-blue-900 mb-1">Continuous Monitoring</h4>
            <p className="text-sm text-blue-800">Our AI agents scan travel APIs 24/7 for better deals</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="font-medium text-blue-900 mb-1">Smart Analysis</h4>
            <p className="text-sm text-blue-800">Compares options based on location, amenities, and timing</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="font-medium text-blue-900 mb-1">Real Savings</h4>
            <p className="text-sm text-blue-800">Only shows deals with significant savings potential</p>
          </div>
        </div>
      </div>
    </div>
  )
}
