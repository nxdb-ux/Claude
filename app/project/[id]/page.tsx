'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import DocumentsTab from '@/components/project/DocumentsTab'
import ResearchTab from '@/components/project/ResearchTab'
import FactsTab from '@/components/project/FactsTab'
import PresetsTab from '@/components/project/PresetsTab'
import GenerateTab from '@/components/project/GenerateTab'

type TabType = 'documents' | 'research' | 'facts' | 'presets' | 'generate'

interface Project {
  id: string
  name: string
  description: string | null
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'documents', label: 'Documents' },
  { id: 'research', label: 'Research' },
  { id: 'facts', label: 'Facts Bank' },
  { id: 'presets', label: 'Engine Presets' },
  { id: 'generate', label: 'Generate Posts' },
]

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  const [activeTab, setActiveTab] = useState<TabType>('documents')
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M12 3a9 9 0 110 18 9 9 0 010-18z" />
          </svg>
          <p className="text-gray-600 text-lg mb-6">Project not found</p>
          <a href="/" className="text-blue-600 hover:text-blue-800 font-semibold">← Back to Projects</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-semibold mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 text-lg">{project.description}</p>
          )}
        </div>

        {/* Tabs Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50/50">
            <nav className="flex overflow-x-auto px-6 scrollbar-hide" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'documents' && <DocumentsTab projectId={projectId} />}
            {activeTab === 'research' && <ResearchTab projectId={projectId} />}
            {activeTab === 'facts' && <FactsTab projectId={projectId} />}
            {activeTab === 'presets' && <PresetsTab projectId={projectId} />}
            {activeTab === 'generate' && <GenerateTab projectId={projectId} />}
          </div>
        </div>
      </div>
    </div>
  )
}
