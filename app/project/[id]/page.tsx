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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Project not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <a href="/" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
            ← Back to Projects
          </a>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 mt-2">{project.description}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
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
