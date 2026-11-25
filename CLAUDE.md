# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Lint

- `npm run dev` - Start Vite dev server (frontend only; use `base44 dev` for full stack)
- `npm run build` - Build production bundle with Vite
- `npm run lint` - Run ESLint on source files
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking with tsc

## Code Style

- Use ES module imports: `import X from 'y'` or `import { X } from 'y'`
- Group imports: external libs first, then `@/`-prefixed paths, then relative
- Component filenames PascalCase (e.g., `Button.jsx`), utilities camelCase (e.g., `useSize.js`)
- State/props use camelCase; constants use UPPER_SNAKE_CASE
- ESLint is configured in `eslint.config.js`; `no-unused-vars` is globally off but enforced per-file
- Tailwind classes merged with `tailwind-merge`; ALWAYS use `cn()` helper
- All components must accept and pass through `className` prop
- Error boundaries should use `Sonner` toasts for user feedback

## Testing

- No test framework configured yet; add Vitest/Jest if needed
- Run any existing tests with `npx vitest run` or `npm test`

## Conventions from this codebase

- Base44 SDK client: `src/api/base44Client.js`
- Entity definitions in `base44/entities/` and functions in `base44/functions/`
- Hooks in `src/hooks/`, utils in `src/lib/`
- Use `base44 dev` for local development (runs backend + frontend)
- Fresh clones need `base44 link` then `base44 dev`