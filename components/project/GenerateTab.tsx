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
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as '1' | '2' | '3')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="1">Mode 1 (Short)</option>
              <option value="2">Mode 2 (Medium)</option>
              <option value="3">Mode 3 (Long)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Engine Preset</label>
            <select
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cashtag A</label>
            <input
              type="text"
              value={cashtagA}
              onChange={(e) => setCashtagA(e.target.value)}
              placeholder="BTC"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cashtag B</label>
            <input
              type="text"
              value={cashtagB}
              onChange={(e) => setCashtagB(e.target.value)}
              placeholder="ETH"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={useAutoFacts}
              onChange={(e) => setUseAutoFacts(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Auto-select approved facts</span>
          </label>
          {!useAutoFacts && (
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 space-y-1">
              {approvedFacts.map((fact) => (
                <label key={fact.id} className="flex items-center gap-2 text-sm">
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
                    className="rounded"
                  />
                  <span>{fact.claim.substring(0, 50)}...</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {generating ? 'Generating...' : 'Generate Post'}
        </button>
      </div>

      {/* Current Generation Result */}
      {currentGeneration && (
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Post</h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                currentGeneration.qaPassed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {currentGeneration.qaPassed ? '✓ QA Passed' : '⚠ QA Review'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Copy Hook</h4>
              <p className="bg-gray-50 p-3 rounded text-gray-700">{currentGeneration.copyHook}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Thumbnail Hook</h4>
              <p className="bg-gray-50 p-3 rounded text-gray-700">{currentGeneration.thumbnailHook}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Body</h4>
              <p className="bg-gray-50 p-3 rounded text-gray-700 whitespace-pre-wrap">{currentGeneration.bodyText}</p>
            </div>
          </div>

          {currentGeneration.qaReport && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-2">QA Report</h4>
              <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                {currentGeneration.qaReport.violations?.length > 0 && (
                  <div>
                    <p className="font-medium text-red-800">Violations:</p>
                    <ul className="list-disc list-inside text-red-700">
                      {currentGeneration.qaReport.violations.map((v: string, i: number) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {currentGeneration.qaReport.warnings?.length > 0 && (
                  <div>
                    <p className="font-medium text-yellow-800">Warnings:</p>
                    <ul className="list-disc list-inside text-yellow-700">
                      {currentGeneration.qaReport.warnings.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${currentGeneration.copyHook}\n\n${currentGeneration.thumbnailHook}\n\n${currentGeneration.bodyText}`
                )
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Recent Generations */}
      {generations.length > 0 && !currentGeneration && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Generations</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {generations.map((gen) => (
              <button
                key={gen.id}
                onClick={() => setCurrentGeneration(gen)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium text-gray-900">${gen.cashtagA} + ${gen.cashtagB} (Mode {gen.mode})</p>
                <p className="text-sm text-gray-600 line-clamp-1">{gen.copyHook}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
