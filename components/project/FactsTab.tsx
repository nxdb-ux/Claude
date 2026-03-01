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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Facts Bank</h3>
          <p className="text-sm text-gray-600 mt-1">{facts.length} fact{facts.length !== 1 ? 's' : ''} in total</p>
        </div>
        <button
          onClick={handleExtractFromSources}
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
              Extract from Sources
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-2">
          {(['all', 'approved', 'unapproved'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setApprovedFilter(filter)
                setSelectedFacts(new Set())
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                approvedFilter === filter
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? 'All' : filter === 'approved' ? '✓ Approved' : '○ Unapproved'}
            </button>
          ))}
        </div>

        {selectedFacts.size > 0 && (
          <button
            onClick={handleBulkApprove}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
          >
            Approve Selected ({selectedFacts.size})
          </button>
        )}
      </div>

      {filteredFacts.length > 0 ? (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredFacts.map((fact) => (
            <div
              key={fact.id}
              className="flex items-start gap-4 p-4 border border-gray-200 bg-white rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200"
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
                className="mt-1.5 w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-medium leading-relaxed">{fact.claim}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {fact.topicTag && (
                    <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      {fact.topicTag}
                    </span>
                  )}
                  {fact.proofCluster && (
                    <span className="inline-flex px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      {fact.proofCluster}
                    </span>
                  )}
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      fact.confidence === 'high'
                        ? 'bg-green-100 text-green-700'
                        : fact.confidence === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {fact.confidence === 'high' ? '★ High' : fact.confidence === 'medium' ? '◐ Medium' : '○ Low'} confidence
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleToggleApproval(fact.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  fact.approved
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {fact.approved ? '✓ Approved' : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6H6m0 0H0" />
          </svg>
          <p className="text-gray-600 font-medium">No facts found</p>
          <p className="text-gray-500 text-sm mt-2">Upload documents or fetch sources to extract facts</p>
        </div>
      )}
    </div>
  )
}
