import { useState, useRef } from 'react'
import { User } from '../utils/api'

interface DocumentUploadProps {
  user: User
}

interface UploadProgress {
  documentId: string
  filename: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  currentStep: string
  steps: Array<{
    step: string
    status: 'pending' | 'in_progress' | 'completed' | 'error'
    completedAt?: string
  }>
}

export default function DocumentUpload({ user }: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        alert('Please upload only PDF or image files')
        continue
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        continue
      }

      const documentId = `doc_${Date.now()}_${i}`
      
      // Create initial upload progress
      const uploadProgress: UploadProgress = {
        documentId,
        filename: file.name,
        progress: 0,
        status: 'uploading',
        currentStep: 'uploading',
        steps: [
          { step: 'virus_scan', status: 'pending' },
          { step: 'file_validation', status: 'pending' },
          { step: 'extracting_data', status: 'pending' },
          { step: 'classification', status: 'pending' },
          { step: 'embedding_generation', status: 'pending' }
        ]
      }

      setUploads(prev => [...prev, uploadProgress])

      // Simulate upload and processing
      await simulateUpload(uploadProgress)
    }
    
    setUploading(false)
  }

  const simulateUpload = async (uploadProgress: UploadProgress) => {
    const steps = [
      { name: 'uploading', duration: 1000 },
      { name: 'virus_scan', duration: 2000 },
      { name: 'file_validation', duration: 1500 },
      { name: 'extracting_data', duration: 3000 },
      { name: 'classification', duration: 2000 },
      { name: 'embedding_generation', duration: 2500 }
    ]

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      
      // Update current step
      setUploads(prev => prev.map(upload => 
        upload.documentId === uploadProgress.documentId 
          ? { 
              ...upload, 
              currentStep: step.name,
              progress: ((i + 1) / steps.length) * 100,
              steps: upload.steps.map((s, index) => 
                index === i 
                  ? { ...s, status: 'in_progress' }
                  : index < i 
                    ? { ...s, status: 'completed', completedAt: new Date().toISOString() }
                    : s
              )
            }
          : upload
      ))

      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, step.duration))

      // Mark step as completed
      setUploads(prev => prev.map(upload => 
        upload.documentId === uploadProgress.documentId 
          ? { 
              ...upload, 
              status: i === steps.length - 1 ? 'completed' : 'processing',
              steps: upload.steps.map((s, index) => 
                index === i 
                  ? { ...s, status: 'completed', completedAt: new Date().toISOString() }
                  : s
              )
            }
          : upload
      ))
    }
  }

  const removeUpload = (documentId: string) => {
    setUploads(prev => prev.filter(upload => upload.documentId !== documentId))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-600">
          Upload your travel documents (PDF invoices, receipts, booking confirmations) for AI processing and optimization.
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-4">
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-gray-600">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Supports PDF, JPG, PNG files up to 10MB each
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Progress</h3>
          <div className="space-y-4">
            {uploads.map((upload) => (
              <div key={upload.documentId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      upload.status === 'completed' ? 'bg-green-400' :
                      upload.status === 'error' ? 'bg-red-400' :
                      'bg-blue-400 animate-pulse'
                    }`}></div>
                    <span className="font-medium text-gray-900">{upload.filename}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{Math.round(upload.progress)}%</span>
                    <button
                      onClick={() => removeUpload(upload.documentId)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      upload.status === 'completed' ? 'bg-green-500' :
                      upload.status === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${upload.progress}%` }}
                  ></div>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  {upload.steps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-100' :
                        step.status === 'in_progress' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        {step.status === 'completed' ? (
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : step.status === 'in_progress' ? (
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        )}
                      </div>
                      <span className={`${
                        step.status === 'completed' ? 'text-green-700' :
                        step.status === 'in_progress' ? 'text-blue-700' :
                        'text-gray-500'
                      }`}>
                        {step.step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {step.completedAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(step.completedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Current Status */}
                <div className="mt-3 text-sm text-gray-600">
                  Current: {upload.currentStep.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Upload Tips</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Ensure documents are clear and readable for better AI processing</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Supported formats: PDF invoices, JPG/PNG receipts, booking confirmations</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Documents are automatically scanned for viruses and validated</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>AI will extract data, classify documents, and generate embeddings for search</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
