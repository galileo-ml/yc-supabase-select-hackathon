# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a YC Supabase Select Hackathon project focused on building a phishing simulation and security awareness training platform. The application simulates the complete lifecycle of security awareness campaigns, from target discovery through email generation to engagement tracking.

## Architecture

### Frontend Structure
- **Next.js 15.5.4** with React 19 and TypeScript
- **App Router** architecture with components in `/frontend/app/`
- **Tailwind CSS v4** for styling with shadcn/ui components
- **Component Library**: shadcn/ui with lucide-react icons
- **Turbopack** for faster development and builds

### Key Components
- `page.tsx` - Main orchestrator handling campaign workflow phases
- `campaign-creation.tsx` - Campaign configuration modal
- `dashboard.tsx` - Results and analytics display
- Loading animations for each phase: `database-searching-loading.tsx`, `mail-creation-loading.tsx`, `mail-sending-loading.tsx`
- UI components in `/frontend/components/ui/` using class-variance-authority pattern

### Application Flow
The app follows a sequential phase progression:
1. **idle** → **searching** → **generating** → **sending** → **dashboard**
2. Each phase has dedicated UI components and animations
3. Campaign state is managed through React hooks with automatic progression timers
4. Historical campaigns are stored in component state

## Development Commands

All commands should be run from the `/frontend` directory:

```bash
# Development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Code Conventions

- **TypeScript**: Strict typing with proper interface definitions
- **Component Structure**: Functional components with hooks
- **Styling**: Tailwind classes with shadcn/ui component patterns
- **State Management**: React hooks (useState, useEffect) for local state
- **File Organization**: Co-located components in app directory, shared UI components in components/ui
- **Import Aliases**: Uses `@/` prefix for component and utility imports

## Key Dependencies

- **UI Framework**: shadcn/ui with Tailwind CSS v4
- **Icons**: lucide-react
- **Utilities**: clsx, tailwind-merge, class-variance-authority
- **Fonts**: Geist family (sans and mono)

## Security Focus

This is a defensive security training application that simulates phishing campaigns for educational purposes. The codebase includes realistic email generation patterns and engagement tracking to help organizations improve their security awareness training programs.