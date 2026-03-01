'use client'

import { useState, useEffect } from 'react'

interface Document {
  id: string
  filename: string
  mimeType: string
  extractedText: string | null
  createdAt: string
}

interface DocumentsTabProps {
  projectId: string
}

export default function DocumentsTab({ projectId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [projectId])

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch(`/api/projects/${projectId}/documents`, {
          method: 'POST',
          body: formData,
        })

        if (res.ok) {
          const newDoc = await res.json()
          setDocuments([...documents, newDoc])
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleExtractFacts = async () => {
    setExtracting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/extract-facts-from-documents`, {
        method: 'POST',
      })

      if (res.ok) {
        // Trigger a refresh of documents and facts
        fetchDocuments()
      }
    } catch (error) {
      console.error('Error extracting facts:', error)
    } finally {
      setExtracting(false)
    }
  }

  const selectedDoc = documents.find((d) => d.id === selectedDocId)

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Upload Documents</h3>
        <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer block"
          >
            <svg className="w-12 h-12 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="font-semibold text-gray-900 mb-1">Drag and drop files here or click to select</p>
            <p className="text-sm text-gray-600">Supported formats: PDF, DOCX, TXT</p>
          </label>
          {uploading && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-sm text-blue-600 font-medium">Uploading...</p>
            </div>
          )}
        </div>
      </div>

      {documents.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Uploaded Documents</h3>
              <p className="text-sm text-gray-600 mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''} uploaded</p>
            </div>
            <button
              onClick={handleExtractFacts}
              disabled={extracting}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {extracting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Extracting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Extract Facts from All Docs
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedDocId === doc.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{doc.filename}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(doc.createdAt).toLocaleDateString()} at {new Date(doc.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedDoc && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900">Preview</h4>
                  <p className="text-sm text-gray-600 mt-1 truncate">{selectedDoc.filename}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto text-sm text-gray-700 border border-gray-200">
                  {selectedDoc.extractedText ? (
                    <p className="whitespace-pre-wrap">{selectedDoc.extractedText.substring(0, 1000)}{selectedDoc.extractedText.length > 1000 ? '...' : ''}</p>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-600 font-medium">No text extracted yet</p>
                      <p className="text-gray-500 text-xs mt-2">Click "Extract Facts from All Docs" to process this document</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 font-medium">No documents uploaded yet</p>
          <p className="text-gray-500 text-sm mt-2">Upload your first document using the form above</p>
        </div>
      )}
    </div>
  )
}
