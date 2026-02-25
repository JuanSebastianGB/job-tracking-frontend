# JobTracker - Frontend

A React-based job application tracking dashboard for managing your job search process.

## Overview

JobTracker helps you organize, track, and analyze your job applications in one place. Built with React 19, TypeScript, and Tailwind CSS.

## Features

- **Dashboard** - Visual overview with application statistics and charts
- **Job List** - Browse all applications with filtering and sorting
- **Job Form** - Add new applications with AI-powered job extraction
- **AI Integration** - Extract job details from text or screenshots using Google Gemini

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Form Handling | React Hook Form |
| Animations | Motion |
| Icons | Lucide React |
| AI | Google Gemini |

## Prerequisites

- Node.js 18+
- pnpm (recommended)

## Installation

```bash
cd job-tracker
pnpm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Add your Google Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

## Running the App

```bash
# Development (frontend only)
pnpm dev

# Full stack with Express server (legacy)
pnpm dev:all

# Production build
pnpm build

# Preview production build
pnpm preview
```

### Ports

| Service | Port |
|---------|------|
| Frontend (Vite) | 5173 |
| Express Server | 3000 |

## API Integration

The frontend expects a backend API at `/api/jobs`. Configure the proxy in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
```

## Project Structure

```
job-tracker/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx    # Stats and charts
│   │   ├── JobList.tsx      # Application list
│   │   └── JobForm.tsx     # Add/edit form
│   ├── services/
│   │   └── geminiService.ts # AI extraction
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── server.ts                # Express server (legacy)
├── vite.config.ts           # Vite configuration
└── package.json
```

## Job Data Model

```typescript
interface Job {
  id: number;
  title: string;
  company: string;
  url?: string;
  date_applied: string;
  status: 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'Withdrawn';
  work_model?: 'Remote' | 'Hybrid' | 'On-site';
  salary_range?: string;
  salary_frequency?: 'Hourly' | 'Monthly' | 'Yearly';
  tech_stack?: string[];
  notes?: string;
  screenshot_url?: string;
  resume_url?: string;
  cover_letter_url?: string;
  created_at: string;
  updated_at: string;
}
```

## AI Job Extraction

Use Google Gemini to extract job details from text or screenshots:

```typescript
import { parseJobWithAI } from './services/geminiService';

// From text
const job = await parseJobWithAI({
  text: "Senior React Developer at Acme Corp. Remote. $120k-150k/year."
});

// From file (screenshot)
const job = await parseJobWithAI({
  file: uploadedFile
});
```

## Troubleshooting

### Port already in use
```bash
# Find process using port 5173
lsof -i :5173

# Or run on different port
pnpm dev -- --port 5174
```

### CORS errors
Ensure the backend is running and the proxy in `vite.config.ts` is configured correctly.

### Database issues
The app uses SQLite. Ensure `jobs.db` exists in the job-tracker directory or the backend is running with database access.

## Related Projects

- [Backend](./backend/) - FastAPI REST API (recommended for production)
