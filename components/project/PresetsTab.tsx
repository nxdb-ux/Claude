'use client'

import { useState, useEffect } from 'react'

interface EnginePreset {
  id: string
  name: string
  skeletonType: string
  primaryFunction: string
  secondaryFunction: string
  investorTension: string
  cashtagRelationship: string
  openingMechanic: string
  proofCluster: string
  blueprintMode: string
  toneDial: string
  closingPosition: string
  createdAt: string
}

interface PresetsTabProps {
  projectId: string
}

const ENGINE_MATRIX = {
  skeletonType: ['Origin Story', 'Price Action', 'Institutional Trend', 'Developer Update', 'Community Milestone'],
  primaryFunction: ['Education', 'Hype', 'Utility', 'Value Proposition', 'Risk Assessment'],
  secondaryFunction: ['FOMO', 'Credibility', 'Scarcity', 'Adoption', 'Security'],
  investorTension: ['Bullish', 'Bearish', 'Neutral', 'Uncertain', 'Opportunistic'],
  cashtagRelationship: ['Comparison', 'Hierarchy', 'Synergy', 'Contrast', 'Partnership'],
  openingMechanic: ['Question', 'Statement', 'Data', 'Story', 'Paradox'],
  proofCluster: ['On-chain', 'Community', 'Developer', 'Market', 'Adoption'],
  blueprintMode: ['Technical', 'Narrative', 'Psychological', 'Social', 'Economic'],
  toneDial: ['Casual', 'Professional', 'Optimistic', 'Critical', 'Neutral'],
  closingPosition: ['Call to Action', 'Reflection', 'Prediction', 'Affirmation', 'Question'],
}

export default function PresetsTab({ projectId }: PresetsTabProps) {
  const [presets, setPresets] = useState<EnginePreset[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<Partial<EnginePreset>>({})

  useEffect(() => {
    fetchPresets()
  }, [projectId])

  const fetchPresets = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/presets`)
      if (res.ok) {
        const data = await res.json()
        setPresets(data)
      }
    } catch (error) {
      console.error('Error fetching presets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePresets = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })

      if (res.ok) {
        await fetchPresets()
      }
    } catch (error) {
      console.error('Error generating presets:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleRandomize = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/presets/randomize`, {
        method: 'POST',
      })

      if (res.ok) {
        await fetchPresets()
      }
    } catch (error) {
      console.error('Error randomizing preset:', error)
    }
  }

  const handleSaveEdits = async (preset: EnginePreset) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/presets/${preset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingValues),
      })

      if (res.ok) {
        setEditingId(null)
        setEditingValues({})
        await fetchPresets()
      }
    } catch (error) {
      console.error('Error saving preset:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGeneratePresets}
          disabled={generating}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6H6m0 0H0" />
              </svg>
              Generate 10-20 Presets
            </>
          )}
        </button>
        <button
          onClick={handleRandomize}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Random Preset
        </button>
      </div>

      {presets.length > 0 ? (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {presets.map((preset) => (
            <div key={preset.id} className="border border-gray-200 bg-white rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{preset.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">Created on {new Date(preset.createdAt).toLocaleDateString()}</p>
                </div>
                {editingId !== preset.id && (
                  <button
                    onClick={() => {
                      setEditingId(preset.id)
                      setEditingValues(preset)
                    }}
                    className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editingId === preset.id ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {Object.entries(ENGINE_MATRIX).map(([key, options]) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <select
                        value={editingValues[key as keyof EnginePreset] || ''}
                        onChange={(e) =>
                          setEditingValues({
                            ...editingValues,
                            [key]: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="font-semibold text-gray-700">Skeleton:</span> <span className="text-gray-600">{preset.skeletonType}</span></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="font-semibold text-gray-700">Primary:</span> <span className="text-gray-600">{preset.primaryFunction}</span></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="font-semibold text-gray-700">Secondary:</span> <span className="text-gray-600">{preset.secondaryFunction}</span></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="font-semibold text-gray-700">Tension:</span> <span className="text-gray-600">{preset.investorTension}</span></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="font-semibold text-gray-700">Cashtag:</span> <span className="text-gray-600">{preset.cashtagRelationship}</span></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="font-semibold text-gray-700">Opening:</span> <span className="text-gray-600">{preset.openingMechanic}</span></div>
                </div>
              )}

              {editingId === preset.id && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleSaveEdits(preset)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null)
                      setEditingValues({})
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-gray-600 font-medium">No presets yet</p>
          <p className="text-gray-500 text-sm mt-2">Click "Generate Presets" to create engine presets</p>
        </div>
      )}
    </div>
  )
}
