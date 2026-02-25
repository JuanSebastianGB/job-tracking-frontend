# AGENTS.md

## The Role

This file describes rules, patterns, and conventions for AI agents working on the job-tracking frontend. It also maps actions to specialized skills that should be invoked for specific tasks.

> **IMPORTANT**: If you encounter something surprising or non-obvious in this codebase, alert the developer and document it in this file to help future agents.

---

## Skills Mapping

### Available Skills

| Skill | Description | Location |
| ----- | ----------- | -------- |
| `frontend-design` | Creative React/HTML/CSS interfaces | `.agents/skills/frontend-design/SKILL.md` |
| `ui-ux-pro-max` | UI/UX design intelligence | `.agents/skills/ui-ux-pro-max/SKILL.md` |
| `vercel-react-best-practices` | React performance optimization | `.agents/skills/vercel-react-best-practices/SKILL.md` |
| `frontend-testing` | Vitest + React Testing Library | `.agents/skills/frontend-testing/SKILL.md` |
| `git-commit` | Professional commit conventions | `~/.opencode/skills/git-commit/SKILL.md` |
| `crafting-effective-readmes` | README templates | `.agents/skills/crafting-effective-readmes/SKILL.md` |
| `fast-typecheck` | Incremental TypeScript checking | `.opencode/skills/fast-typecheck/SKILL.md` |

### Action-to-Skill Mappings

| Action | Skill |
| ------ | ----- |
| Create React components | `frontend-design` |
| Build new UI pages | `frontend-design` |
| Design UI with advanced patterns | `ui-ux-pro-max` |
| Optimize React performance | `vercel-react-best-practices` |
| Write frontend tests | `frontend-testing` |
| Refactoring code | `frontend-testing` |
| Fixing bugs | `frontend-testing` |
| Create git commit | `git-commit` |
| TypeScript type checking | `fast-typecheck` |
| Write or update README | `crafting-effective-readmes` |
