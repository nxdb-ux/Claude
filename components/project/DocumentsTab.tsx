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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
            className="cursor-pointer"
          >
            <div className="text-gray-600">
              <p className="font-medium mb-1">Drag and drop files or click to select</p>
              <p className="text-sm text-gray-500">Supported: PDF, DOCX, TXT</p>
            </div>
          </label>
          {uploading && <p className="text-sm text-blue-600 mt-2">Uploading...</p>}
        </div>
      </div>

      {documents.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents ({documents.length})</h3>
            <button
              onClick={handleExtractFacts}
              disabled={extracting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
            >
              {extracting ? 'Extracting...' : 'Extract Facts from All Docs'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedDocId === doc.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{doc.filename}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>

            {selectedDoc && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Preview: {selectedDoc.filename}</h4>
                <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto text-sm text-gray-700">
                  {selectedDoc.extractedText ? (
                    <p>{selectedDoc.extractedText.substring(0, 1000)}...</p>
                  ) : (
                    <p className="text-gray-500">No text extracted yet. Click "Extract Facts from All Docs" to process this document.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && documents.length === 0 && (
        <p className="text-gray-500 text-center py-8">No documents uploaded yet.</p>
      )}
    </div>
  )
}
