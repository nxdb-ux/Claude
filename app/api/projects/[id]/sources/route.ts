import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sources = await prisma.source.findMany({
      where: { projectId: id },
      orderBy: { fetchedAt: 'desc' },
    })

    return NextResponse.json(sources)
  } catch (error) {
    console.error('Error fetching sources:', error)
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { urls } = await request.json() as { urls: string[] }

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array required' }, { status: 400 })
    }

    const sources = []

    for (const url of urls) {
      try {
        // Fetch the URL
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CMC Content Generator)',
          },
        })

        const rawText = response.data
        let title = new URL(url).hostname

        // Try to extract title from HTML
        const titleMatch = rawText.match(/<title[^>]*>([^<]+)<\/title>/i)
        if (titleMatch) {
          title = titleMatch[1]
        }

        const source = await prisma.source.create({
          data: {
            projectId: id,
            url,
            title,
            rawText: rawText.substring(0, 100000), // Limit to 100k chars
            status: 'fetched',
          },
        })

        sources.push(source)
      } catch (error) {
        console.error(`Error fetching ${url}:`, error)

        const source = await prisma.source.create({
          data: {
            projectId: id,
            url,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        sources.push(source)
      }
    }

    return NextResponse.json(sources)
  } catch (error) {
    console.error('Error creating sources:', error)
    return NextResponse.json({ error: 'Failed to create sources' }, { status: 500 })
  }
}
