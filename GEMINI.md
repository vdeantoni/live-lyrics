# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Live Lyrics

This project is a web-based application that displays the lyrics of the song currently playing on the user's Apple Music application. It features a client-server architecture, where the server retrieves the song information and the client presents it in a visually appealing way.

## Commands

This is a [Turborepo](https://turbo.build/) monorepo project. Use these commands:

- `pnpm dev`: Starts the development server for both the client and the server
- `pnpm build`: Builds the client and the server
- `pnpm lint`: Lints the client and the server
- `pnpm format`: Formats code with Prettier across all workspaces
- `pnpm test`: Runs tests across all workspaces

### Individual workspace commands:

- Client: `cd client && pnpm dev` (Vite dev server on port 5173)
- Server: `cd server && pnpm dev` (Node.js server on port 4000)

### Testing commands:

- `cd client && pnpm test`: Run Vitest tests once
- `cd client && pnpm test:watch`: Run Vitest tests in watch mode
- `cd client && pnpm test:ui`: Open Vitest UI
- `cd client && pnpm test:coverage`: Generate coverage reports
- Visual regression testing in CI/CD is handled by Lost Pixel (not suitable for local use)
- Legacy Playwright test files exist in `client/tests/` but are not currently functional

## Architecture

### Monorepo Structure

- **Root**: Turborepo configuration with shared scripts and optimized caching
- **client/**: React + Vite frontend application
- **server/**: Node.js + Hono backend server

### Server (server/)

- **Framework**: Hono (lightweight web framework)
- **Runtime**: Node.js with TypeScript
- **Apple Music Integration**: Uses AppleScript via `osascript` to query macOS Music app
- **API Endpoints**:
  - `GET /music`: Returns current song info (name, artist, album, currentTime, duration, playerState)
  - `POST /music`: Controls playback (play/pause, seek)
- **Build**: Uses `tsc` for TypeScript compilation
- **Dev**: Uses `ts-node-dev` for hot reloading

### Client (client/)

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 with custom CSS animations
- **Animations**: Framer Motion for complex animations (song name scrolling)
- **State Management**: @tanstack/react-query with persistent localStorage cache
- **Icons**: Lucide React for consistent iconography
- **UI Components**: Radix UI primitives (slider, aspect-ratio, button)
- **Key Features**:
  - Real-time music data fetching (300ms intervals)
  - Lyrics integration with external APIs (iTunes artwork, Lrclib lyrics)
  - Visual lyrics display with synchronized highlighting
  - Responsive design with landscape mode optimizations
  - Animated song name scrolling with hover pause/resume

### Component Architecture

- **LyricsVisualizer/**: Main lyrics display component hierarchy
  - `LyricsVisualizer.tsx`: Root container with layout orchestration
  - `LyricsProvider.tsx`: Data fetching, state management, and lyrics processing
  - `LyricsDisplay.tsx`: Visual effects wrapper and background rendering
  - `LyricsContent.tsx`: Actual lyrics rendering with synchronization
  - `Player.tsx`: Music playback controls with animated song name
  - `AnimatedSongName.tsx`: Framer Motion component for scrolling song titles
- **ui/**: Reusable UI components (buttons, sliders, skeletons)

### Data Flow

1. Server polls macOS Music app via AppleScript every request
2. Client queries server every 300ms using React Query
3. Client fetches additional data (artwork, lyrics) from external APIs
4. React Query provides caching and persistence across sessions
5. Components render synchronized lyrics with current playback position

## Development Notes

- **macOS Only**: Server requires macOS and the Music app for AppleScript integration
- **TypeScript**: Both client and server use TypeScript
- **Linting**: ESLint configured for client workspace only
- **Formatting**: Prettier for code formatting with Tailwind CSS plugin
- **Hot Reloading**: Available in both client (Vite) and server (ts-node-dev)
- **Testing**: Vitest for unit testing, Lost Pixel for visual regression testing in CI/CD only
- **State Management**: Uses Jotai atoms for local state management and React Query for server state
- **Pre-commit Hooks**: Husky runs `format`, `lint`, and `test` before each commit
- **Turborepo Caching**: Optimized task pipeline with proper input/output tracking for faster builds

## Visual Regression Testing Workflow

This project uses **Lost Pixel** for visual regression testing in CI/CD to prevent unintended UI changes.

### CI/CD Testing (Lost Pixel)

- **Configuration**: `lostpixel.config.ts` in the root defines test pages and viewports
- **Baselines**: Managed automatically by Lost Pixel cloud service
- **Workflow**: `.github/workflows/vrt.yml` runs Lost Pixel tests on every push/PR
- **Results**: Visual diffs and reports are available in the Lost Pixel dashboard

### Test Configuration

- **Portrait Mode**: 768x1024 viewport testing mobile layout
- **Landscape Mode**: 1024x768 viewport testing desktop layout
- **Base URL**: Tests run against preview server (port 4173)
- **Test Pages**: Currently tests the home page in both orientations

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
