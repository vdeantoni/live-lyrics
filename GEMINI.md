# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Live Lyrics

This project is a web-based application that displays the lyrics of the song currently playing on the user's Apple Music application. It features a client-server architecture, where the server retrieves the song information and the client presents it in a visually appealing way.

## Commands

This is a [Turborepo](https://turbo.build/) monorepo project. Use these commands:

- `pnpm dev`: Starts the development server for both the client and the server
- `pnpm build`: Builds the client and the server (optimized with Turbo cache)
- `pnpm lint`: Applies linting fixes automatically
- `pnpm lint:check`: Checks linting without applying fixes (used in pre-commit)
- `pnpm format`: Applies code formatting with Prettier
- `pnpm format:check`: Checks formatting without applying fixes (used in pre-commit)
- `pnpm test`: Runs tests across all workspaces

### Individual workspace commands:

- Client: `cd client && pnpm dev` (Vite dev server on port 5173)
- Server: `cd server && pnpm dev` (Node.js server on port 4000)

### Testing commands:

- `cd client && pnpm test`: Run Vitest tests once
- `cd client && pnpm test:watch`: Run Vitest tests in watch mode
- `cd client && pnpm test:ui`: Open Vitest UI
- `cd client && pnpm test:coverage`: Generate coverage reports
- `cd client && pnpm test:e2e:install:ci`: Install Chromium for CI (optimized for performance)
- `cd client && pnpm test:e2e:visual`: Run visual regression tests with Playwright
- `cd client && pnpm test:e2e:functional`: Run functional E2E tests (app, lyrics, player components)
- Visual regression testing in CI/CD is handled by Lost Pixel (not suitable for local use)
- Legacy Playwright test files exist in `client/tests/` but are not currently functional

## Architecture

### Monorepo Structure

- **Root**: Turborepo configuration with optimized caching based on Git-tracked files
- **client/**: React + Vite frontend application
- **server/**: Node.js + Hono backend server

### Build System

Both client and server compile to `dist/` directories:
- **Client**: Vite builds to `client/dist/` (static assets)
- **Server**: TypeScript compiles to `server/dist/` (Node.js modules)
- **Caching**: Turbo cache based on actual Git-tracked file patterns for optimal performance

### Server (server/)

- **Framework**: Hono (lightweight web framework)
- **Runtime**: Node.js with TypeScript
- **Apple Music Integration**: Uses AppleScript via `osascript` to query macOS Music app
- **API Endpoints**:
  - `GET /music`: Returns current song info (name, artist, album, currentTime, duration, playerState)
  - `POST /music`: Controls playback (play/pause, seek)
- **Build**: TypeScript compiles `src/` → `dist/` with `rootDir` and `outDir` configuration

### Client (client/)

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 with custom CSS animations
- **Animations**: Framer Motion for complex animations (song name scrolling)
- **State Management**: @tanstack/react-query with persistent localStorage cache + Jotai atoms
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

## Development & Troubleshooting

### Pre-commit Hooks

Husky runs these checks before each commit (will **fail** the commit if issues exist):
- `format:check`: Ensures code is properly formatted
- `lint:check`: Ensures no linting errors
- `test`: Ensures all tests pass

Use `pnpm format` and `pnpm lint` during development to auto-fix issues.

### Turborepo Cache Optimization

The `turbo.json` configuration uses Git-tracked file patterns as inputs for optimal cache performance:

**Cache Performance**:
- ✅ Good: Builds cached when no relevant files changed (35ms builds)
- ❌ Bad: Builds always run when files outside inputs change constantly

**⚠️ Critical**: When adding new config files (e.g., `tailwind.config.js`, `postcss.config.js`), update the relevant `inputs` arrays in `turbo.json`. Otherwise, Turbo uses stale cache when these configs change.

**Example**: Adding `tailwind.config.js`:
```json
"build": {
  "inputs": [
    "src/**",
    "package.json",
    "tsconfig*.json",
    "vite.config.*",
    "tailwind.config.*"  // Add this
  ]
}
```

**Common Cache Issues**:
- Generated files in `src/` (should be in `dist/` instead)
- Using `**/*` patterns (too broad, includes temp files)
- Missing config dependencies in inputs

### Testing Infrastructure

**Unit Tests (Vitest)**:
- Located in `client/src/test/`
- Run with `pnpm test`
- Configured to exclude Playwright tests via `vitest.config.ts`

**E2E Tests (Playwright)**:
- **Performance Optimization**: CI uses Chromium-only (`test:e2e:install:ci`), local development uses all browsers
- **Test Categories**:
  - Visual: `test:e2e:visual` - Generates screenshots for Lost Pixel
  - Functional: `test:e2e:functional` - Tests app behavior and interactions
- **Configuration**: `playwright.config.ts` with CI-optimized settings
- **Selectors**: Uses `[data-testid="..."]` for reliable element targeting
- **Environment**: Configured for simulated player with mocked lyrics API

**Visual Regression (Lost Pixel)**:
- **Approach**: Custom shots generated by Playwright tests in `./lost-pixel/`
- **Configuration**: `lostpixel.config.ts` with custom shots path
- **Viewports**: Portrait (768x1024) and landscape (1024x768)
- **CI/CD Only**: Not suitable for local development
- **Project ID**: Configured with Lost Pixel cloud service

### TypeScript Configuration

Both workspaces use consistent TypeScript setup:
- **Server**: Compiles `src/` → `dist/` with `rootDir` and `outDir`
- **Client**: Uses Vite's TypeScript handling
- **Shared**: `tsconfig*.json` patterns tracked in Turbo inputs

### CI/CD Workflow

**Three-Workflow Approach** for optimized performance:

1. **PR Workflow** (`.github/workflows/pr.yml`):
   - Quality checks: format:check, lint:check
   - Fast feedback on pull requests
   - No heavy testing to reduce PR friction

2. **CI Workflow** (`.github/workflows/ci.yml`):
   - Functional testing: unit tests and E2E functional tests
   - Runs on push to main and PR merge
   - Uses Chromium-only for faster execution

3. **Visual Regression Testing** (`.github/workflows/vrt.yml`):
   - Lost Pixel visual regression testing
   - Separate workflow to isolate visual testing concerns
   - Generates and compares screenshots

**Performance Optimizations**:
- CI uses `test:e2e:install:ci` (Chromium-only) vs local development (all browsers)
- Separate workflows prevent blocking PRs on visual test failures
- Optimized caching for dependencies and build artifacts

### macOS Development

- **Required**: macOS with Music app for AppleScript integration
- **Server Development**: Uses `ts-node-dev` for hot reloading TypeScript
- **Client Development**: Uses Vite's HMR for instant updates

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.