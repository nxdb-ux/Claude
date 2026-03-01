import { prisma } from '@/lib/db'
import { extractFactsFromText } from '@/lib/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get all documents for this project
    const documents = await prisma.document.findMany({
      where: { projectId: params.id },
    })

    const allFacts = []

    for (const doc of documents) {
      if (!doc.extractedText) continue

      // Extract facts from document
      const facts = await extractFactsFromText(
        doc.extractedText,
        `From document: ${doc.filename}`
      )

      // Save extracted facts
      for (const fact of facts) {
        const savedFact = await prisma.fact.create({
          data: {
            projectId: params.id,
            claim: fact.claim || '',
            topicTag: fact.topicTag || null,
            proofCluster: fact.proofCluster || null,
            confidence: fact.confidence || 'medium',
            date: fact.date ? new Date(fact.date) : null,
            approved: false,
          },
        })
        allFacts.push(savedFact)
      }
    }

    return NextResponse.json({
      success: true,
      factsExtracted: allFacts.length,
      facts: allFacts,
    })
  } catch (error) {
    console.error('Error extracting facts from documents:', error)
    return NextResponse.json(
      { error: 'Failed to extract facts from documents' },
      { status: 500 }
    )
  }
}
