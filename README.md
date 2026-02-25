# JobTracker - Frontend

> A beautiful React-based job application tracking dashboard to manage your entire job search in one place.

![JobTracker Dashboard](https://github.com/user-attachments/assets/e37fcf61-54d2-4010-b61c-9d97ceafcca8)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwind-css)](https://tailwindcss.com)

## What This Does

JobTracker helps you organize, track, and analyze your job applications with a beautiful visual dashboard. It uses AI (Google Gemini) to automatically extract job details from text or screenshots, making it effortless to add new applications.

## Features

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Visual overview with application statistics and interactive charts |
| 📋 **Job List** | Browse all applications with powerful filtering and sorting |
| ✨ **AI Extraction** | Extract job details from text or screenshots using Google Gemini |
| 🎯 **Smart Tracking** | Track status (Applied → Interviewing → Offer/Rejected) |
| 💰 **Salary Tracking** | Record salary ranges with frequency (Hourly/Monthly/Yearly) |
| 🏠 **Work Model** | Track Remote, Hybrid, or On-site positions |

## Quick Start

```bash
# Clone and navigate to the project
cd job-tracking-frontend

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start development server
pnpm dev
```

That's it! The app will be running at **http://localhost:5173**

> ⚠️ **Note**: The frontend requires the backend to be running. See [Backend Setup](#backend-setup) below.

## Backend Setup

The frontend needs the FastAPI backend running to store data:

```bash
# Navigate to backend (in another terminal)
cd job-tracking-backend

# Create virtual environment
python -m venv .venv

# Activate it
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload --port 3000
```

## Configuration

Create a `.env` file in `job-tracking-frontend/` with your API keys:

```env
# Required for AI job extraction
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Project Structure

```
job-tracking-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Dashboard.tsx   # Stats & charts
│   │   ├── JobList.tsx      # Application list
│   │   └── JobForm.tsx      # Add/edit form
│   ├── services/            # API & external services
│   │   └── geminiService.ts # AI job extraction
│   ├── hooks/               # Custom React hooks
│   ├── types/                # TypeScript definitions
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
├── vite.config.ts           # Vite configuration
└── package.json
```

## Tech Stack

| Category | Technology | Why |
|----------|------------|-----|
| Framework | React 19 | Modern hooks & concurrent features |
| Language | TypeScript | Type safety & better DX |
| Build Tool | Vite 6 | Lightning fast HMR |
| Styling | Tailwind CSS 4 | Utility-first, responsive |
| Charts | Recharts | Composable React charts |
| Forms | React Hook Form | Performant form handling |
| Animations | Motion | Smooth, declarative animations |
| Icons | Lucide React | Beautiful, consistent icons |
| AI | Google Gemini | Advanced job extraction |

## API Integration

The frontend communicates with the backend via a proxy configured in `vite.config.ts`:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
```

### Job Data Model

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

One of JobTracker's most powerful features is AI-powered job extraction:

```typescript
import { parseJobWithAI } from './services/geminiService';

// Extract from text
const job = await parseJobWithAI({
  text: "Senior React Developer at Acme Corp. Remote. $120k-150k/year."
});

// Extract from screenshot
const job = await parseJobWithAI({
  file: uploadedFile
});
```

The AI automatically extracts:
- Job title & company
- Work model (Remote/Hybrid/On-site)
- Salary range & frequency
- Tech stack

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (port 5173) |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm typecheck` | Run TypeScript type checking |

## Troubleshooting

### Port already in use
```bash
# Find process using port 5173
lsof -i :5173

# Or run on a different port
pnpm dev -- --port 5174
```

### CORS errors
- Ensure the backend is running on port 3000
- Check the proxy configuration in `vite.config.ts`

### Database connection issues
- Verify the backend is running and connected to Neon PostgreSQL
- Check your `.env` file has the correct `DATABASE_URL`

### AI extraction not working
- Verify `GEMINI_API_KEY` is set in your `.env` file
- Check API quota in Google AI Studio

## License

Personal project. Built for learning and personal use.

---

<p align="center">
  Built with 💙 using React & FastAPI
</p>
