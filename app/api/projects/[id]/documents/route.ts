import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'
import { randomBytes } from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')

export async function GET(
  __request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documents = await prisma.document.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true })

    const filename = `${randomBytes(8).toString('hex')}-${file.name}`
    const filepath = path.join(UPLOAD_DIR, filename)

    // Save file
    const buffer = await file.arrayBuffer()
    await fs.writeFile(filepath, Buffer.from(buffer))

    // Extract text based on file type
    let extractedText = ''
    const mimeType = file.type
    const nodeBuffer = Buffer.from(buffer)

    if (mimeType === 'text/plain') {
      extractedText = nodeBuffer.toString('utf-8')
    } else if (mimeType === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse')
        const data = await pdfParse(nodeBuffer)
        extractedText = data.text
      } catch (e) {
        console.error('Error parsing PDF:', e)
        extractedText = '[PDF parsing failed]'
      }
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const mammoth = require('mammoth')
        const result = await mammoth.extractRawText({ buffer: nodeBuffer })
        extractedText = result.value
      } catch (e) {
        console.error('Error parsing DOCX:', e)
        extractedText = '[DOCX parsing failed]'
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const document = await prisma.document.create({
      data: {
        projectId: params.id,
        filename: file.name,
        mimeType,
        path: filepath,
        extractedText,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}
