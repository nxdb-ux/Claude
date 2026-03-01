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
      <div className="flex gap-4">
        <button
          onClick={handleGeneratePresets}
          disabled={generating}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {generating ? 'Generating...' : 'Generate 10-20 Presets'}
        </button>
        <button
          onClick={handleRandomize}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Random Preset
        </button>
      </div>

      {presets.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {presets.map((preset) => (
            <div key={preset.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{preset.name}</h4>
                {editingId !== preset.id && (
                  <button
                    onClick={() => {
                      setEditingId(preset.id)
                      setEditingValues(preset)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editingId === preset.id ? (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {Object.entries(ENGINE_MATRIX).map(([key, options]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {key}
                      </label>
                      <select
                        value={editingValues[key as keyof EnginePreset] || ''}
                        onChange={(e) =>
                          setEditingValues({
                            ...editingValues,
                            [key]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div><span className="font-medium">Skeleton:</span> {preset.skeletonType}</div>
                  <div><span className="font-medium">Primary:</span> {preset.primaryFunction}</div>
                  <div><span className="font-medium">Secondary:</span> {preset.secondaryFunction}</div>
                  <div><span className="font-medium">Tension:</span> {preset.investorTension}</div>
                  <div><span className="font-medium">Cashtag:</span> {preset.cashtagRelationship}</div>
                  <div><span className="font-medium">Opening:</span> {preset.openingMechanic}</div>
                </div>
              )}

              {editingId === preset.id && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleSaveEdits(preset)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null)
                      setEditingValues({})
                    }}
                    className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No presets yet. Click "Generate Presets" to create some.</p>
      )}
    </div>
  )
}
