'use client'

import { useState, useEffect } from 'react'

interface Fact {
  id: string
  claim: string
  topicTag: string | null
  proofCluster: string | null
  confidence: string
  approved: boolean
  createdAt: string
}

interface FactsTabProps {
  projectId: string
}

export default function FactsTab({ projectId }: FactsTabProps) {
  const [facts, setFacts] = useState<Fact[]>([])
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [approvedFilter, setApprovedFilter] = useState<'all' | 'approved' | 'unapproved'>('all')
  const [selectedFacts, setSelectedFacts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFacts()
  }, [projectId])

  const fetchFacts = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/facts`)
      if (res.ok) {
        const data = await res.json()
        setFacts(data)
      }
    } catch (error) {
      console.error('Error fetching facts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleApproval = async (factId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/facts/${factId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: !facts.find((f) => f.id === factId)?.approved }),
      })

      if (res.ok) {
        await fetchFacts()
      }
    } catch (error) {
      console.error('Error updating fact:', error)
    }
  }

  const handleExtractFromSources = async () => {
    setExtracting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/extract-facts-from-sources`, {
        method: 'POST',
      })

      if (res.ok) {
        await fetchFacts()
      }
    } catch (error) {
      console.error('Error extracting facts:', error)
    } finally {
      setExtracting(false)
    }
  }

  const handleBulkApprove = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/facts/bulk-approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factIds: Array.from(selectedFacts) }),
      })

      if (res.ok) {
        await fetchFacts()
        setSelectedFacts(new Set())
      }
    } catch (error) {
      console.error('Error bulk approving facts:', error)
    }
  }

  const filteredFacts = facts.filter((fact) => {
    if (approvedFilter === 'approved') return fact.approved
    if (approvedFilter === 'unapproved') return !fact.approved
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Facts Bank ({facts.length})</h3>
        <button
          onClick={handleExtractFromSources}
          disabled={extracting}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
        >
          {extracting ? 'Extracting...' : 'Extract from Sources'}
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          {(['all', 'approved', 'unapproved'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setApprovedFilter(filter)
                setSelectedFacts(new Set())
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                approvedFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {filter === 'all' ? 'All' : filter === 'approved' ? 'Approved' : 'Unapproved'}
            </button>
          ))}
        </div>

        {selectedFacts.size > 0 && (
          <button
            onClick={handleBulkApprove}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Approve Selected ({selectedFacts.size})
          </button>
        )}
      </div>

      {filteredFacts.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredFacts.map((fact) => (
            <div
              key={fact.id}
              className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedFacts.has(fact.id)}
                onChange={(e) => {
                  const newSet = new Set(selectedFacts)
                  if (e.target.checked) {
                    newSet.add(fact.id)
                  } else {
                    newSet.delete(fact.id)
                  }
                  setSelectedFacts(newSet)
                }}
                className="mt-1 rounded"
              />
              <div className="flex-1">
                <p className="text-gray-900">{fact.claim}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {fact.topicTag && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {fact.topicTag}
                    </span>
                  )}
                  {fact.proofCluster && (
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      {fact.proofCluster}
                    </span>
                  )}
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded ${
                      fact.confidence === 'high'
                        ? 'bg-green-100 text-green-800'
                        : fact.confidence === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {fact.confidence}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleToggleApproval(fact.id)}
                className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                  fact.approved
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {fact.approved ? '✓ Approved' : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No facts found. Upload documents or fetch sources to extract facts.
        </p>
      )}
    </div>
  )
}
