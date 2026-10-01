# Code Archaeology

**Historical intelligence for software repositories.**

GitHub tells developers what changed. Code Archaeology helps developers understand the story behind those changes.

## Overview

Code Archaeology is a production-quality web application that helps developers investigate unfamiliar or mature GitHub repositories by providing:

- **Repository Overview**: Metadata, contributors, commit history, and statistics
- **Relationship Graph**: Interactive 2D visualization of issues → PRs → commits → files
- **Timeline Analysis**: Chronological view of releases, major PRs, issues, and architectural changes
- **File Archaeology**: Historical stats, creation, modifications, and "why does this file exist?"
- **PR Archaeology**: Lifecycle, reviews, changes, and evidence-backed answers to "why was this merged?"
- **Issue Investigation**: Timeline, resolution chain, and connected artifacts
- **Contributor Footprint**: Contribution analysis without leaderboards
- **Architecture Evolution**: Observable historical phases with evidence
- **Repository Story**: Evidence-backed historical narrative
- **Ask Repository**: Chat interface for natural language questions about repository history

## Design Philosophy

### Evidence-First Architecture

The AI is **never** the source of truth. GitHub data is the source of truth.

```
GitHub API
    ↓
Data Ingestion
    ↓
Normalization
    ↓
Relationship Extraction
    ↓
Evidence Indexing
    ↓
Relevant Evidence Retrieval
    ↓
Evidence Pack
    ↓
Groq AI Reasoning
    ↓
Structured Explanation
    ↓
Evidence-Backed UI
```

### Facts vs Inference vs Unknown

Every explanation distinguishes:

- **OBSERVED FACT**: Information directly from GitHub (PR #481 was merged, file was modified)
- **INFERENCE**: Interpretation supported by multiple evidence pieces (available history suggests...)
- **UNKNOWN**: When evidence does not establish an explanation (available GitHub history does not establish...)

### No Fabrication Policy

We **never**:
- Invent developer intentions
- Hallucinate GitHub activity
- Make unsupported claims about why changes happened
- Claim certainty without evidence

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database
- GitHub personal access token (for API access)
- Groq API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/code-archaeology.git
cd code-archaeology
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# GitHub API (for public repos, this is optional)
GITHUB_TOKEN=ghp_your_token_here

# Groq API for AI analysis
GROQ_API_KEY=your_groq_key_here
GROQ_ANALYSIS_MODEL=openai/gpt-oss-120b
GROQ_FAST_MODEL=openai/gpt-oss-20b

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/code_archaeology

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up the database:
```bash
npx prisma migrate dev --name init
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technology Stack

### Frontend
- **Next.js 14**: React framework with SSR and API routes
- **TypeScript**: Type-safe code
- **Tailwind CSS**: Utility-first styling with dark mode
- **shadcn/ui**: High-quality component library
- **Lucide Icons**: Clean icon set
- **Framer Motion**: Smooth animations
- **@xyflow/react**: Interactive relationship graph visualization

### Backend
- **Next.js API Routes**: Server-side business logic
- **TypeScript**: Type safety
- **Prisma ORM**: Database abstraction and migrations
- **Octokit**: GitHub API client
- **Zod**: Runtime schema validation

### AI
- **Groq API**: Fast LLM inference
- **OpenAI-compatible interface**: Flexible model selection

### Database
- **PostgreSQL**: Production-grade relational database

## Project Structure

```
app/
  ├── (auth)/            # Authentication routes (future)
  ├── (app)/             # Main application
  ├── api/               # API route handlers
  │   ├── repositories/  # Repository analysis endpoints
  │   ├── entities/      # Entity detail endpoints
  │   └── ai/            # AI analysis endpoints
  ├── layout.tsx         # Root layout
  └── page.tsx           # Landing page

lib/
  ├── github/            # GitHub API service layer
  │   ├── client.ts      # Octokit initialization
  │   ├── repositories.ts
  │   ├── commits.ts
  │   ├── pulls.ts
  │   ├── issues.ts
  │   ├── files.ts
  │   ├── compare.ts
  │   └── types.ts
  ├── ai/                # AI/ML logic
  │   ├── evidence-pack.ts  # Evidence building
  │   ├── prompts.ts     # Groq prompts
  │   └── analyzer.ts    # Analysis engine
  ├── db.ts              # Prisma client
  ├── validation.ts      # Zod schemas
  └── utils/             # Utility functions

components/
  ├── ui/                # Base UI components
  ├── layout/            # Layout components
  ├── graph/             # Graph visualization
  └── analysis/          # Analysis views

styles/
  └── globals.css        # Global styles

prisma/
  └── schema.prisma      # Database schema

public/                  # Static assets
```

## Key Features

### 1. Repository Analysis
- Automatic indexing of public GitHub repositories
- Metadata collection (languages, contributors, commits, PRs, issues)
- Historical statistics and trends
- Configurable indexing depth (QUICK, STANDARD, DEEP)

### 2. Relationship Graph
- Interactive 2D visualization using React Flow
- Multiple view modes (Historical Flow, Relationship Map, Architecture, Investigation Path)
- Custom nodes for issues, PRs, commits, files, contributors, releases
- Semantic edge labels (linked to, modified, reviewed by, etc.)
- Zoom, pan, search, and filtering controls

### 3. Temporal Analysis
- Chronological timeline with zoom and pan
- Event filtering (releases, commits, PRs, issues)
- Identification of major milestones and architectural changes
- Interactive event details

### 4. Evidence-Based AI
- Two-tier analysis pipeline (fast summaries, deep archaeology)
- Structured JSON responses with facts, inferences, unknowns
- Citation system with links to source GitHub entities
- Chat interface with conversation memory
- Investigation paths with animated evidence chains

### 5. Entity Details
- **Files**: Creation, history, contributors, modifications, "why does this exist?"
- **Commits**: What changed, why, related issues/PRs, historical impact
- **PRs**: Lifecycle, reviews, comments, "why was this merged?", "why was this closed?"
- **Issues**: Timeline, resolution chain, related artifacts
- **Contributors**: Contribution footprint without leaderboards

## API Endpoints

### Repository Analysis
- `POST /api/repositories/analyze` - Analyze a GitHub repository
- `GET /api/repositories/:id` - Get repository metadata
- `GET /api/repositories/:id/timeline` - Get repository timeline
- `GET /api/repositories/:id/graph` - Get relationship graph data
- `GET /api/repositories/:id/commits` - List commits
- `GET /api/repositories/:id/pulls` - List pull requests
- `GET /api/repositories/:id/issues` - List issues
- `GET /api/repositories/:id/files` - List files
- `GET /api/repositories/:id/people` - List contributors
- `GET /api/repositories/:id/architecture` - Get architecture analysis

### Entity Details
- `GET /api/entities/:type/:id` - Get entity details
- `GET /api/entities/:type/:id/evidence` - Get evidence chain

### AI Analysis
- `POST /api/ai/analyze` - Analyze a repository aspect
- `POST /api/ai/ask` - Ask repository a question
- `POST /api/ai/investigate` - Investigate a specific entity

## Configuration

### Environment Variables

**Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `GROQ_API_KEY`: API key for Groq

**Recommended:**
- `GITHUB_TOKEN`: GitHub personal access token (increases rate limits)

**Optional:**
- `GROQ_ANALYSIS_MODEL`: Model for detailed analysis (default: openai/gpt-oss-120b)
- `GROQ_FAST_MODEL`: Model for quick summaries (default: openai/gpt-oss-20b)
- `NEXT_PUBLIC_APP_URL`: Application URL for external links

### Database Setup

Code Archaeology requires PostgreSQL. Set up with:

```bash
# Create database
createdb code_archaeology

# Run migrations
npx prisma migrate dev
```

## Development

### Run Development Server
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

### Build for Production
```bash
npm run build
npm start
```

## Design Principles

### 1. Premium Developer Tool Aesthetic
- Deep charcoal/near-black background
- Neutral surfaces with restrained accent color
- High contrast typography
- Subtle borders and compact cards
- Technical data visualization and timeline markers
- Clean icons, monospace typography where appropriate
- Smooth purposeful motion

### 2. Evidence-Driven Analysis
- Every claim backed by GitHub data
- Clear distinction between facts, inferences, and unknowns
- No hallucinated events or developer intentions
- Transparent about evidence limitations

### 3. Performance First
- Lazy-load large graph data
- Virtualize long lists
- Paginate commits/issues/PRs
- Cache analysis results
- Batch API requests
- Server-side data fetching
- Stream AI responses

### 4. Security
- Server-side GitHub and Groq access
- Environment-based secret management
- No API key exposure to browser
- Input validation and SSRF protection
- GitHub host validation
- Rate-limit handling
- Structured error responses

## Contributing

This is a reference implementation for Code Archaeology. Contributions welcome!

## License

MIT

## References

### GitHub API Documentation
- https://docs.github.com/en/rest
- https://docs.github.com/en/graphql

### Libraries
- https://github.com/octokit/octokit.js
- https://www.prisma.io/
- https://groq.com/
- https://xyflow.com/

---

**Built with ❤️ for developers who want to understand the story behind their code.**
