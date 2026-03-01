'use client'

import { useState, useEffect } from 'react'

interface Generation {
  id: string
  copyHook: string
  thumbnailHook: string
  bodyText: string
  qaPassed: boolean
  qaReport: any
  mode: string
  cashtagA: string
  cashtagB: string
}

interface GenerateTabProps {
  projectId: string
}

export default function GenerateTab({ projectId }: GenerateTabProps) {
  const [mode, setMode] = useState<'1' | '2' | '3'>('1')
  const [cashtagA, setCashtagA] = useState('BTC')
  const [cashtagB, setCashtagB] = useState('ETH')
  const [presetId, setPresetId] = useState('')
  const [presets, setPresets] = useState<any[]>([])
  const [approvedFacts, setApprovedFacts] = useState<any[]>([])
  const [selectedFacts, setSelectedFacts] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [useAutoFacts, setUseAutoFacts] = useState(true)

  useEffect(() => {
    fetchPresets()
    fetchApprovedFacts()
    fetchGenerations()
  }, [projectId])

  const fetchPresets = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/presets`)
      if (res.ok) {
        const data = await res.json()
        setPresets(data)
        if (data.length > 0) {
          setPresetId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching presets:', error)
    }
  }

  const fetchApprovedFacts = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/facts?approved=true`)
      if (res.ok) {
        const data = await res.json()
        setApprovedFacts(data)
      }
    } catch (error) {
      console.error('Error fetching facts:', error)
    }
  }

  const fetchGenerations = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/generations`)
      if (res.ok) {
        const data = await res.json()
        setGenerations(data)
      }
    } catch (error) {
      console.error('Error fetching generations:', error)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const factIds = useAutoFacts
        ? approvedFacts.slice(0, 12).map((f) => f.id)
        : Array.from(selectedFacts)

      const res = await fetch(`/api/projects/${projectId}/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          cashtagA,
          cashtagB,
          enginePresetId: presetId || undefined,
          factIds,
        }),
      })

      if (res.ok) {
        const generation = await res.json()
        setCurrentGeneration(generation)
        await fetchGenerations()
      }
    } catch (error) {
      console.error('Error generating post:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = () => {
    if (!currentGeneration) return

    const csv = [
      ['Copy Hook', 'Thumbnail Hook', 'Body', 'QA Passed'],
      [
        currentGeneration.copyHook,
        currentGeneration.thumbnailHook,
        currentGeneration.bodyText,
        currentGeneration.qaPassed ? 'Yes' : 'No',
      ],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `generation-${currentGeneration.id}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 space-y-5">
        <h3 className="text-xl font-bold text-gray-900">Generate Content</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Content Length</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as '1' | '2' | '3')}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">Mode 1 (Short)</option>
              <option value="2">Mode 2 (Medium)</option>
              <option value="3">Mode 3 (Long)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Engine Preset</label>
            <select
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Random</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cashtag A</label>
            <input
              type="text"
              value={cashtagA}
              onChange={(e) => setCashtagA(e.target.value.toUpperCase())}
              placeholder="BTC"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cashtag B</label>
            <input
              type="text"
              value={cashtagB}
              onChange={(e) => setCashtagB(e.target.value.toUpperCase())}
              placeholder="ETH"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 cursor-pointer hover:border-blue-400 transition-colors">
            <input
              type="checkbox"
              checked={useAutoFacts}
              onChange={(e) => setUseAutoFacts(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded cursor-pointer"
            />
            <span className="font-semibold text-gray-700">Auto-select approved facts</span>
          </label>
          {!useAutoFacts && (
            <div className="mt-3 max-h-48 overflow-y-auto border-2 border-gray-300 rounded-lg p-3 space-y-2 bg-white">
              {approvedFacts.map((fact) => (
                <label key={fact.id} className="flex items-start gap-2 p-2 rounded hover:bg-blue-50 cursor-pointer transition-colors">
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
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-0.5 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">{fact.claim.substring(0, 60)}...</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Post
            </>
          )}
        </button>
      </div>

      {/* Current Generation Result */}
      {currentGeneration && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Generated Post</h3>
              <p className="text-sm text-gray-600 mt-1">${currentGeneration.cashtagA} + ${currentGeneration.cashtagB} • Mode {currentGeneration.mode}</p>
            </div>
            <span
              className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${
                currentGeneration.qaPassed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {currentGeneration.qaPassed ? '✓ QA Passed' : '⚠ Needs Review'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Copy Hook</h4>
              <p className="bg-gray-50 p-4 rounded-lg text-gray-700 border border-gray-200">{currentGeneration.copyHook}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Thumbnail Hook</h4>
              <p className="bg-gray-50 p-4 rounded-lg text-gray-700 border border-gray-200">{currentGeneration.thumbnailHook}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Body Text</h4>
              <p className="bg-gray-50 p-4 rounded-lg text-gray-700 border border-gray-200 whitespace-pre-wrap text-sm">{currentGeneration.bodyText}</p>
            </div>
          </div>

          {currentGeneration.qaReport && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">QA Report</h4>
              <div className="space-y-3">
                {currentGeneration.qaReport.violations?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-900 mb-2">🚫 Violations:</p>
                    <ul className="space-y-1">
                      {currentGeneration.qaReport.violations.map((v: string, i: number) => (
                        <li key={i} className="text-red-800 text-sm">• {v}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {currentGeneration.qaReport.warnings?.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-semibold text-yellow-900 mb-2">⚠️ Warnings:</p>
                    <ul className="space-y-1">
                      {currentGeneration.qaReport.warnings.map((w: string, i: number) => (
                        <li key={i} className="text-yellow-800 text-sm">• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${currentGeneration.copyHook}\n\n${currentGeneration.thumbnailHook}\n\n${currentGeneration.bodyText}`
                )
              }}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to Clipboard
            </button>
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Recent Generations */}
      {generations.length > 0 && !currentGeneration && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Generations</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {generations.map((gen) => (
              <button
                key={gen.id}
                onClick={() => setCurrentGeneration(gen)}
                className="w-full text-left p-4 border border-gray-200 bg-white rounded-lg hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900">${gen.cashtagA} + ${gen.cashtagB}</p>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Mode {gen.mode}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-1">{gen.copyHook}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
