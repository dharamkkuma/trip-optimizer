import { useState, useEffect, useRef } from 'react'
import { User } from '../utils/api'

interface ChatInterfaceProps {
  user: User
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Array<{
    documentId: string
    filename: string
    relevanceScore: number
  }>
  confidence?: number
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  tripId?: string
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load sample chat sessions
    const sampleSessions: ChatSession[] = [
      {
        id: 'session_1',
        title: 'Paris Trip Questions',
        tripId: 'trip_789',
        createdAt: new Date('2024-01-20T10:00:00'),
        messages: [
          {
            id: 'msg_1',
            type: 'user',
            content: 'What was my total spending on accommodation in Paris?',
            timestamp: new Date('2024-01-20T10:00:00')
          },
          {
            id: 'msg_2',
            type: 'assistant',
            content: 'Based on your Paris trip, your total spending on accommodation was €450.00. This includes your stay at Grand Hotel Paris from February 15-18, 2024.',
            timestamp: new Date('2024-01-20T10:00:30'),
            sources: [
              {
                documentId: 'doc_456',
                filename: 'hotel_invoice.pdf',
                relevanceScore: 0.95
              }
            ],
            confidence: 0.92
          }
        ]
      },
      {
        id: 'session_2',
        title: 'General Travel Questions',
        createdAt: new Date('2024-01-19T15:30:00'),
        messages: [
          {
            id: 'msg_3',
            type: 'user',
            content: 'What are the best practices for business travel?',
            timestamp: new Date('2024-01-19T15:30:00')
          },
          {
            id: 'msg_4',
            type: 'assistant',
            content: 'Here are some best practices for business travel:\n\n1. **Book in advance** - Get better rates and availability\n2. **Keep receipts** - For expense tracking and reimbursement\n3. **Use corporate cards** - For easier expense management\n4. **Plan for delays** - Always have backup plans\n5. **Track expenses** - Use apps or spreadsheets for budgeting',
            timestamp: new Date('2024-01-19T15:30:45'),
            confidence: 0.88
          }
        ]
      }
    ]
    setSessions(sampleSessions)
    setActiveSession(sampleSessions[0])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [activeSession?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    }
    setSessions(prev => [newSession, ...prev])
    setActiveSession(newSession)
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeSession) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    // Add user message
    setActiveSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null)

    setInputMessage('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        type: 'assistant',
        content: generateAIResponse(inputMessage),
        timestamp: new Date(),
        confidence: 0.85
      }

      setActiveSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, assistantMessage]
      } : null)

      setIsTyping(false)
    }, 2000)
  }

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    if (input.includes('expense') || input.includes('spending') || input.includes('cost')) {
      return 'Based on your travel documents, I can help you analyze your expenses. I found several invoices and receipts in your account. Would you like me to break down your spending by category or trip?'
    } else if (input.includes('trip') || input.includes('travel')) {
      return 'I can see you have multiple trips in your account. I can help you with trip planning, expense analysis, or finding optimizations. What specific aspect would you like to know more about?'
    } else if (input.includes('optimization') || input.includes('save') || input.includes('deal')) {
      return 'Great question! I\'ve found several optimization opportunities for your upcoming trips. There are better hotel deals available for your Paris trip that could save you €70. Would you like me to show you the details?'
    } else {
      return 'I\'m here to help you with your travel planning and expense management. I can analyze your documents, answer questions about your trips, suggest optimizations, and provide travel advice. What would you like to know?'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Sidebar - Chat Sessions */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
            <button
              onClick={createNewSession}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Ask questions about your trips, expenses, or get travel advice
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeSession?.id === session.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900 truncate">
                  {session.title}
                </div>
                <div className="text-sm text-gray-500">
                  {session.messages.length} messages
                </div>
                <div className="text-xs text-gray-400">
                  {session.createdAt.toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{activeSession.title}</h3>
              <p className="text-sm text-gray-600">
                {activeSession.messages.length} messages
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeSession.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                      {message.confidence && (
                        <span className="ml-2">
                          Confidence: {Math.round(message.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    
                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <div className="text-xs font-medium mb-2">Sources:</div>
                        {message.sources.map((source, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            📄 {source.filename} ({Math.round(source.relevanceScore * 100)}% relevant)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your trips, expenses, or travel..."
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              
              {/* Quick Questions */}
              <div className="mt-3">
                <div className="text-sm text-gray-600 mb-2">Quick questions:</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "What are my total expenses this month?",
                    "Show me my upcoming trips",
                    "Any optimization opportunities?",
                    "What's my spending breakdown?"
                  ].map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(question)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No chat selected</h3>
              <p className="mt-1 text-sm text-gray-500">Start a new conversation or select an existing chat.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
