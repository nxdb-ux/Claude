'use client'

import { useState, useEffect } from 'react'

interface Source {
  id: string
  url: string
  title: string | null
  status: string
  fetchedAt: string
}

interface ResearchTabProps {
  projectId: string
}

export default function ResearchTab({ projectId }: ResearchTabProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [urls, setUrls] = useState('')

  useEffect(() => {
    fetchSources()
  }, [projectId])

  const fetchSources = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/sources`)
      if (res.ok) {
        const data = await res.json()
        setSources(data)
      }
    } catch (error) {
      console.error('Error fetching sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchSources = async () => {
    if (!urls.trim()) return

    setFetching(true)
    try {
      const urlList = urls
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0)

      const res = await fetch(`/api/projects/${projectId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      })

      if (res.ok) {
        setUrls('')
        await fetchSources()
      }
    } catch (error) {
      console.error('Error fetching sources:', error)
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fetch Sources</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URLs to fetch (one per line)
            </label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="https://example.com/article1&#10;https://example.com/article2"
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
          <button
            onClick={handleFetchSources}
            disabled={fetching || !urls.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {fetching ? 'Fetching...' : 'Fetch Sources'}
          </button>
        </div>
      </div>

      {sources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fetched Sources ({sources.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Fetched</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{source.title || source.url}</p>
                      <p className="text-sm text-gray-500">{source.url}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          source.status === 'fetched'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {source.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(source.fetchedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && sources.length === 0 && (
        <p className="text-gray-500 text-center py-8">No sources fetched yet.</p>
      )}
    </div>
  )
}
