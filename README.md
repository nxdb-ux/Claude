# CMC Content Generator MVP

An internal tool for CoinMarketCap Community content generation with AI-powered research, fact extraction, and QA validation.

## Features

- **Project Management**: Create and manage projects with different content strategies
- **Document Processing**: Upload DOCX, PDF, or TXT files and extract key facts
- **Research & Sources**: Fetch content from URLs and extract relevant information
- **Facts Bank**: Centralized management of verified facts with approval workflow
- **Engine Presets**: Generate randomized content engine presets based on a strategic matrix
- **Post Generation**: AI-powered post generation using approved facts and engine presets
- **QA Checker**: Deterministic validation of generated content against CoinMarketCap rules
- **Auto-Fix Loop**: Automatic correction of QA violations with up to 2 retry attempts

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes with server actions
- **Database**: SQLite with Prisma ORM
- **AI**: OpenAI API for content generation and fact extraction
- **Testing**: Jest for unit tests

### Data Models
- **Project**: Configuration and settings for content strategy
- **Document**: Uploaded files with extracted text
- **Source**: Fetched web content with raw text
- **Fact**: Extracted claims with confidence levels and approval status
- **EnginePreset**: Randomized content generation configurations
- **Generation**: Generated posts with QA reports
- **Job**: Background job queue for async processing

## Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key (optional, but required for generation)

### Installation

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Create .env.local file
cp .env.local.example .env.local
# Add your OPENAI_API_KEY if you have one
```

### Running the App

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test
```

## Usage

### Workflow

1. **Create a Project**
   - Give it a name and optional description
   - Configure tone profile and CMC rules if needed

2. **Upload Documents**
   - Upload DOCX, PDF, or TXT files containing strategy docs
   - Extract facts automatically using OpenAI

3. **Fetch Sources**
   - Paste URLs of relevant articles, news, or documentation
   - System fetches and extracts text for fact mining

4. **Build Facts Bank**
   - Review extracted facts
   - Approve facts for use in generation
   - View facts with confidence levels and topic tags

5. **Generate Engine Presets**
   - Create 10-20 random presets combining elements from:
     - Skeleton Type, Primary/Secondary Functions
     - Investor Tension, Cashtag Relationship
     - Opening Mechanic, Proof Cluster
     - Blueprint Mode, Tone Dial, Closing Position

6. **Generate Posts**
   - Select mode (1=short, 2=medium, 3=long)
   - Choose cashtag pair
   - Select engine preset or randomize
   - Auto-select approved facts or manually choose
   - System generates and QA checks post
   - Auto-fix violations (up to 2 attempts)

7. **Export Results**
   - Copy to clipboard
   - Download as CSV

## QA Checker Rules

The deterministic QA checker validates:

1. **Exactly 2 different external cashtags** ($BTC, $ETH, etc.)
2. **First occurrence within first 5 lines**
3. **Maximum 2 occurrences per cashtag**
4. **Cashtags in full sentences** (heuristic: 6+ words)
5. **No stacked cashtags** (lines with only cashtags)
6. **No punctuation after cashtag** ($BTC, not $BTC,)
7. **No forbidden phrases** ("this matters because", "now x comes into play")
8. **No hyphens** in entire post
9. **Last 2 lines must mention project** (e.g., "HOOLI") and contain no cashtags
10. **Different copy and thumbnail hooks** with shared keywords

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details

### Documents
- `GET /api/projects/{id}/documents` - List documents
- `POST /api/projects/{id}/documents` - Upload document

### Sources
- `GET /api/projects/{id}/sources` - List sources
- `POST /api/projects/{id}/sources` - Fetch sources from URLs

### Facts
- `GET /api/projects/{id}/facts` - List facts
- `PATCH /api/projects/{id}/facts/{factId}` - Approve/unapprove fact
- `PATCH /api/projects/{id}/facts/bulk-approve` - Bulk approve facts
- `POST /api/projects/{id}/extract-facts-from-documents` - Extract from docs
- `POST /api/projects/{id}/extract-facts-from-sources` - Extract from sources

### Engine Presets
- `GET /api/projects/{id}/presets` - List presets
- `POST /api/projects/{id}/presets` - Generate presets
- `POST /api/projects/{id}/presets/randomize` - Create random preset
- `PATCH /api/projects/{id}/presets/{presetId}` - Update preset

### Generations
- `GET /api/projects/{id}/generations` - List generated posts
- `POST /api/projects/{id}/generations` - Generate new post

## Testing

```bash
# Run all tests
npm test

# QA Checker tests
npm test -- lib/qa-checker.test.ts

# Watch mode
npm test:watch
```

Current test coverage:
- 13 unit tests for QA checker
- All tests passing ✓

## Environment Variables

```
DATABASE_URL=file:./prisma/dev.db
OPENAI_API_KEY=your-key-here (optional)
```

## File Structure

```
├── app/
│   ├── api/                 # API routes
│   ├── project/             # Project detail pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   └── project/             # Project tab components
├── lib/
│   ├── db.ts                # Prisma client
│   ├── openai.ts            # OpenAI integration
│   ├── qa-checker.ts        # QA validation logic
│   └── qa-checker.test.ts   # QA tests
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── dev.db               # SQLite database (local)
├── data/
│   └── uploads/             # Document uploads
└── package.json             # Dependencies

## Limitations & Future Enhancements

**Current MVP Limitations:**
- Single-user, local-only deployment
- No authentication
- Background jobs run in-process
- No rate limiting on API calls
- Limited fact extraction prompt tuning

**Future Enhancements:**
- Persistent background job queue (Redis)
- Multi-user with authentication
- Fact source attribution and citations
- A/B testing framework
- Analytics and performance tracking
- Custom QA rule configuration
- Integration with Twitter/social media APIs
- Batch generation and scheduling

## License

Internal use only - CoinMarketCap Community Team
