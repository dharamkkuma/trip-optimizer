import { useState, useEffect } from 'react'
import { User } from '../utils/api'

interface TripTimelineProps {
  user: User
}

interface TimelineEvent {
  id: string
  date: string
  type: 'check_in' | 'check_out' | 'transportation' | 'meeting' | 'meal' | 'expense' | 'document'
  title: string
  description: string
  time?: string
  location?: string
  amount?: number
  currency?: string
  documentId?: string
}

interface TripTimelineData {
  tripId: string
  tripName: string
  events: TimelineEvent[]
}

export default function TripTimeline({ user }: TripTimelineProps) {
  const [timelineData, setTimelineData] = useState<TripTimelineData[]>([])
  const [selectedTrip, setSelectedTrip] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading timeline data
    setTimeout(() => {
      const sampleData: TripTimelineData[] = [
        {
          tripId: 'trip_789',
          tripName: 'Paris Business Trip',
          events: [
            {
              id: 'evt_1',
              date: '2024-02-15',
              type: 'transportation',
              title: 'Airport Transfer',
              description: 'Taxi from CDG Airport to hotel',
              time: '12:30',
              location: 'CDG Airport to Hotel',
              amount: 25.50,
              currency: 'EUR'
            },
            {
              id: 'evt_2',
              date: '2024-02-15',
              type: 'check_in',
              title: 'Hotel Check-in',
              description: 'Arrived at Grand Hotel Paris',
              time: '14:00',
              location: 'Grand Hotel Paris',
              amount: 450.00,
              currency: 'EUR'
            },
            {
              id: 'evt_3',
              date: '2024-02-15',
              type: 'meal',
              title: 'Business Dinner',
              description: 'Dinner with client team',
              time: '19:00',
              location: 'Restaurant Le Comptoir',
              amount: 85.00,
              currency: 'EUR'
            },
            {
              id: 'evt_4',
              date: '2024-02-16',
              type: 'meeting',
              title: 'Client Presentation',
              description: 'Quarterly business review meeting',
              time: '10:00',
              location: 'Office Building, Champs-Élysées'
            },
            {
              id: 'evt_5',
              date: '2024-02-16',
              type: 'meal',
              title: 'Working Lunch',
              description: 'Lunch meeting with stakeholders',
              time: '13:00',
              location: 'Café de Flore',
              amount: 45.00,
              currency: 'EUR'
            },
            {
              id: 'evt_6',
              date: '2024-02-17',
              type: 'transportation',
              title: 'City Tour',
              description: 'Sightseeing around Paris',
              time: '15:00',
              location: 'Various locations',
              amount: 60.00,
              currency: 'EUR'
            },
            {
              id: 'evt_7',
              date: '2024-02-18',
              type: 'check_out',
              title: 'Hotel Check-out',
              description: 'Departure from Grand Hotel Paris',
              time: '11:00',
              location: 'Grand Hotel Paris'
            },
            {
              id: 'evt_8',
              date: '2024-02-18',
              type: 'transportation',
              title: 'Return Flight',
              description: 'Flight back to home city',
              time: '16:30',
              location: 'CDG Airport',
              amount: 320.00,
              currency: 'EUR'
            }
          ]
        },
        {
          tripId: 'trip_790',
          tripName: 'London Conference',
          events: [
            {
              id: 'evt_9',
              date: '2024-03-10',
              type: 'transportation',
              title: 'Flight to London',
              description: 'Direct flight to Heathrow',
              time: '08:00',
              location: 'Heathrow Airport',
              amount: 280.00,
              currency: 'EUR'
            },
            {
              id: 'evt_10',
              date: '2024-03-10',
              type: 'check_in',
              title: 'Hotel Check-in',
              description: 'Arrived at The Savoy London',
              time: '12:00',
              location: 'The Savoy London',
              amount: 600.00,
              currency: 'EUR'
            }
          ]
        }
      ]
      setTimelineData(sampleData)
      setSelectedTrip(sampleData[0]?.tripId || '')
      setLoading(false)
    }, 1000)
  }, [])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'check_in':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'check_out':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'transportation':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )
      case 'meeting':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      case 'meal':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
          </svg>
        )
      case 'expense':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      case 'document':
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'check_in':
        return 'bg-green-100 border-green-200'
      case 'check_out':
        return 'bg-red-100 border-red-200'
      case 'transportation':
        return 'bg-blue-100 border-blue-200'
      case 'meeting':
        return 'bg-purple-100 border-purple-200'
      case 'meal':
        return 'bg-orange-100 border-orange-200'
      case 'expense':
        return 'bg-yellow-100 border-yellow-200'
      case 'document':
        return 'bg-gray-100 border-gray-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }

  const selectedTripData = timelineData.find(trip => trip.tripId === selectedTrip)
  const groupedEvents = selectedTripData ? 
    selectedTripData.events.reduce((groups, event) => {
      const date = event.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(event)
      return groups
    }, {} as Record<string, TimelineEvent[]>) : {}

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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Timeline</h2>
            <p className="text-gray-600">
              Visualize your travel journey with chronological events and expenses
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedTrip}
              onChange={(e) => setSelectedTrip(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timelineData.map((trip) => (
                <option key={trip.tripId} value={trip.tripId}>
                  {trip.tripName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {selectedTripData ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{selectedTripData.tripName}</h3>
            <p className="text-sm text-gray-600">
              {selectedTripData.events.length} events • 
              Total expenses: €{selectedTripData.events
                .filter(e => e.amount)
                .reduce((sum, e) => sum + (e.amount || 0), 0)
                .toFixed(2)}
            </p>
          </div>
          
          <div className="p-6">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-8">
                {Object.entries(groupedEvents)
                  .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                  .map(([date, events]) => (
                    <div key={date} className="relative">
                      {/* Date Header */}
                      <div className="flex items-center mb-4">
                        <div className="w-16 h-8 bg-blue-600 text-white text-sm font-medium rounded-full flex items-center justify-center">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </h4>
                        </div>
                      </div>
                      
                      {/* Events for this date */}
                      <div className="ml-8 space-y-4">
                        {events
                          .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                          .map((event, index) => (
                            <div key={event.id} className="relative">
                              {/* Event Dot */}
                              <div className="absolute -left-8 top-4 w-4 h-4 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              </div>
                              
                              {/* Event Card */}
                              <div className={`p-4 rounded-lg border ${getEventColor(event.type)}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1">
                                      {getEventIcon(event.type)}
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{event.title}</h5>
                                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                        {event.time && (
                                          <span className="flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {event.time}
                                          </span>
                                        )}
                                        {event.location && (
                                          <span className="flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            {event.location}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {event.amount && (
                                    <div className="text-right">
                                      <div className="text-lg font-semibold text-gray-900">
                                        {event.currency} {event.amount.toFixed(2)}
                                      </div>
                                      <div className="text-xs text-gray-500 capitalize">
                                        {event.type.replace('_', ' ')}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No timeline data</h3>
          <p className="mt-1 text-sm text-gray-500">Select a trip to view its timeline.</p>
        </div>
      )}
    </div>
  )
}
