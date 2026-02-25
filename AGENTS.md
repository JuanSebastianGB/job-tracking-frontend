# Job Tracker Frontend - AI Agent Ruleset

> **Skills Reference**: For detailed patterns, use these skills:
> - [`frontend-design`](../.agents/skills/frontend-design/SKILL.md) - Creative React/HTML/CSS interfaces
> - [`ui-ux-pro-max`](../.agents/skills/ui-ux-pro-max/SKILL.md) - UI/UX design intelligence
> - [`vercel-react-best-practices`](../.agents/skills/vercel-react-best-practices/SKILL.md) - React performance optimization
> - [`frontend-testing`](../.agents/skills/frontend-testing/SKILL.md) - Vitest + React Testing Library
> - [`git-commit`](../.agents/skills/git-commit/SKILL.md) - Professional commit conventions

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
| ------ | ----- |
| Create React components | `frontend-design` |
| Build new UI pages | `frontend-design` |
| Design UI with advanced patterns | `ui-ux-pro-max` |
| Optimize React performance | `vercel-react-best-practices` |
| Write frontend tests | `frontend-testing` |
| Create git commit | `git-commit` |
| Refactoring code | `frontend-testing` |
| Fixing bug | `frontend-testing` |

---

## CRITICAL RULES - NON-NEGOTIABLE

### React Components

- **ALWAYS**: Use functional components with hooks
- **ALWAYS**: Define prop types with TypeScript interfaces
- **ALWAYS**: Handle loading, error, and empty states
- **NEVER**: Use class components

### TypeScript

- **ALWAYS**: Use explicit interfaces for props
- **ALWAYS**: Define return types for functions
- **NEVER**: Use `any` - use `unknown` if type is truly unknown

### State Management

- **ALWAYS**: Use `useState` for local component state
- **CONSIDER**: Context API for shared state across multiple components
- **AVOID**: Over-engineering - don't add Redux/Zustand unless needed

### UI/UX

- **ALWAYS**: Handle loading states (spinner, skeleton)
- **ALWAYS**: Handle error states (error message, retry button)
- **ALWAYS**: Handle empty states (empty list, no results)
- **ALWAYS**: Make components accessible (ARIA labels, keyboard navigation)

---

## DECISION TREES

### Component Placement

```
New component? → Put in src/components/
                  └── Or src/features/{feature}/ if feature-specific

Needs shared state? → Consider Context API
                    → Or lift state to parent
```

### Code Location

```
Types (shared 2+) → src/types/ | Types (local 1) → {component}/types.ts
Utils (shared 2+) → src/lib/ | Utils (local 1) → {component}/utils.ts
Hooks (shared 2+) → src/hooks/ | Hooks (local 1) → {component}/hooks.ts
Services (API) → src/services/
```

---

## PATTERNS

### Component with State

```typescript
import { useState, useEffect } from "react";

interface Props {
  initialData?: DataType;
  onSave: (data: DataType) => void;
}

export function MyComponent({ initialData, onSave }: Props) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSave(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={handleSave} />;
  
  return (
    <div>
      {/* component JSX */}
    </div>
  );
}
```

### API Service Call

```typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchJobs(): Promise<ApiResponse<Job[]>> {
  try {
    const response = await fetch("/api/jobs");
    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }
    const data = await response.json();
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error" };
  }
}
```

---

## TECH STACK

React 18.2.0 | TypeScript 5.x | Vite 5.x | CSS Modules

> **Note**: This is a Vite + React project (NOT Next.js). Use client-side patterns only.

---

## PROJECT STRUCTURE

```
job-tracking-frontend/
├── src/
│   ├── components/        # Shared UI components
│   │   ├── JobCard.tsx
│   │   ├── JobForm.tsx
│   │   └── ...
│   ├── services/          # API calls
│   │   ├── api.ts        # Generic fetch wrapper
│   │   └── geminiService.ts  # AI job extraction
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── index.html
├── package.json
└── vite.config.ts
```

---

## COMMANDS

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev          # Frontend on port 5173
# FastAPI backend: cd ../job-tracking-backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Build
pnpm build
pnpm preview

# Type checking
pnpm typecheck    # If available
```

---

## QA CHECKLIST BEFORE COMMIT

- [ ] TypeScript compiles without errors
- [ ] All components have proper prop interfaces
- [ ] Loading, error, and empty states handled
- [ ] No hardcoded API URLs (use environment variables)
- [ ] No secrets in code (use `.env` files)
- [ ] Error messages are user-friendly
- [ ] Components are accessible (ARIA labels where needed)
