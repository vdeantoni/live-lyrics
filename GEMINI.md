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

#### Unit & Integration Tests (Vitest)
- `cd client && pnpm test`: Run Vitest tests once
- `cd client && pnpm test:watch`: Run Vitest tests in watch mode
- `cd client && pnpm test:ui`: Open Vitest UI
- `cd client && pnpm test:coverage`: Generate coverage reports

**Running Single Tests**:
- Run specific test file: `cd client && npx vitest tests/unit/Player.test.tsx`
- Run tests matching pattern: `cd client && npx vitest --reporter=verbose --run Player`
- Run with coverage for specific file: `cd client && npx vitest --coverage tests/unit/utils.test.ts`

#### End-to-End Tests (Playwright)
- `cd client && pnpm test:e2e`: Run all Playwright E2E tests
- `cd client && pnpm test:e2e:ui`: Run Playwright tests with UI mode
- `cd client && pnpm test:e2e:debug`: Run Playwright tests in debug mode
- `cd client && pnpm test:e2e:install`: Install all Playwright browsers with dependencies
- `cd client && pnpm test:e2e:install:ci`: Install Chromium only for CI (performance optimized)
- `cd client && pnpm test:e2e:visual`: Run visual regression tests that generate Lost Pixel screenshots
- `cd client && pnpm test:e2e:functional`: Run functional E2E tests (app behavior, component interactions)

**Running Single E2E Tests**:
- Run specific test file: `cd client && npx playwright test tests/e2e/functional/player.spec.ts`
- Run specific test by name: `cd client && npx playwright test --grep "should display song information"`
- Run tests for specific browser: `cd client && npx playwright test --project=chromium`
- Run in headed mode: `cd client && npx playwright test --headed tests/e2e/functional/lyrics.spec.ts`

#### Visual Regression Testing
- Visual regression testing in CI/CD is handled by Lost Pixel (not suitable for local development)
- Local visual test validation can be done with `cd client && pnpm test:e2e:visual`

## Architecture

### Monorepo Structure

- **Root**: Turborepo configuration with optimized caching based on Git-tracked files
- **client/**: React + Vite frontend application
- **server/**: Node.js + Hono backend server

### Build System

Both client and server compile to `dist/` directories:
- **Client**: Vite builds to `client/dist/` (static assets)
- **Server**: TypeScript compiles to `server/dist/` (Node.js modules)
- **Caching**: Turbo cache based on Git-tracked file patterns for optimal performance

**Turborepo Task Configuration**:
- **build**: Includes `src/**`, `public/**`, `index.html`, package files, and configs
- **lint**: Tracks `src/**`, package.json, ESLint configs, and TypeScript configs
- **test**: Monitors `src/**`, `tests/**`, and all test-related configuration files
- **format**: Watches source files, JSON, CSS, MD files, and Prettier configuration

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
  - Global keyboard shortcuts for playback control and navigation
  - Smooth iOS-style settings panel animations

### Component Architecture

- **LyricsVisualizer/**: Main lyrics display component hierarchy
  - `LyricsVisualizer.tsx`: Root container with layout orchestration
  - `LyricsProvider.tsx`: Data fetching, state management, and lyrics processing
  - `LyricsDisplay.tsx`: Visual effects wrapper and background rendering
  - `LyricsContent.tsx`: Actual lyrics rendering with synchronization
  - `Player.tsx`: Music playback controls with animated song name
  - `AnimatedSongName.tsx`: Framer Motion component for scrolling song titles
- **ui/**: Reusable UI components (buttons, sliders, skeletons)

### User Interaction Features

**Global Keyboard Shortcuts**:
- **Space**: Play/Pause toggle
- **← →**: Seek backward/forward (5 seconds)
- **Shift + ← →**: Fast seek backward/forward (15 seconds)
- **C**: Toggle settings screen

**Settings Panel Animation**:
- Smooth slide-from-bottom transition (300ms duration)
- iOS-style easing curve `[0.25, 0.1, 0.25, 1]`
- Lyrics screen remains static while settings overlay slides over
- Gear button morphs to close button when settings open
- Smart input field detection prevents keyboard shortcut conflicts

### Data Flow

1. Server polls macOS Music app via AppleScript every request
2. Client queries server every 300ms using React Query
3. Client fetches additional data (artwork, lyrics) from external APIs
4. React Query provides caching and persistence across sessions
5. Components render synchronized lyrics with current playback position

### Music Source Architecture

**Source Abstraction System**:
The app uses a pluggable source architecture with multiple music providers:

**Available Sources**:
- **Server Source** (`HttpMusicSource`): Connects to local server for real Apple Music integration
- **Local Source** (`SimulatedMusicSource`): In-memory demo player with classic songs playlist

**Source Management**:
- Configurable via `sourceAtoms.ts` with Jotai state management
- UI source switcher allows runtime switching between sources
- Each source implements `MusicSource` interface for consistent API

**Provider Ecosystem**:
- **Lyrics Providers**: `HttpLyricsProvider` (local + LrcLib API), `SimulatedLyricsProvider`
- **Artwork Providers**: `ITunesArtworkProvider` for album cover fetching
- Sources can combine multiple providers for comprehensive functionality

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

**Test Organization**:
Tests are organized in structured directories:
- `client/tests/unit/`: Unit tests for individual components and utilities
- `client/tests/integration/`: Integration tests for component interactions
- `client/tests/e2e/functional/`: Playwright functional E2E tests by feature
- `client/tests/e2e/visual/`: Playwright visual regression tests for Lost Pixel
- `client/tests/setup/`: Test configuration and setup files

**Unit & Integration Tests (Vitest)**:
- Run with `pnpm test` or workspace-specific `cd client && pnpm test`
- Configuration: `vitest.config.ts` with test includes/excludes
- Setup: `client/tests/setup/setup.ts` with global mocks and testing library imports
- Uses jsdom environment with React Testing Library
- Excludes E2E tests via configuration to avoid conflicts
- Supports coverage reporting and interactive UI mode

**E2E Tests (Playwright)**:
- **Performance Optimization**: CI uses Chromium-only (`test:e2e:install:ci`), local development supports all browsers
- **Local Development Timeouts**: Environment-aware configuration with faster timeouts locally (5s test, 3s action) vs CI (30s test, 5s action)
- **Test Structure**:
  - `tests/e2e/functional/app.spec.ts` - Application layout and responsiveness
  - `tests/e2e/functional/lyrics.spec.ts` - Lyrics display and synchronization
  - `tests/e2e/functional/player.spec.ts` - Player controls and interactions
  - `tests/e2e/functional/settings.spec.ts` - Settings screen functionality and provider management
  - `tests/e2e/functional/playlist.spec.ts` - Playlist navigation and song seeking
  - `tests/e2e/functional/error-handling.spec.ts` - Error scenarios and graceful degradation
  - `tests/e2e/functional/accessibility.spec.ts` - Keyboard navigation and WCAG compliance
  - `tests/e2e/visual/visual.spec.ts` - Visual regression screenshot generation
- **Configuration**: `playwright.config.ts` with CI-optimized settings and multiple browser support
- **Test Directory**: `./tests/e2e` (configured in Playwright config)
- **Environment**: Runs against preview server (port 5173) with simulated player data
- **Selectors**: Uses `[data-testid="..."]` attributes for reliable element targeting, with specific support for Radix UI components

**Visual Regression (Lost Pixel)**:
- **Configuration**: `client/lostpixel.config.ts` defines custom shots path and project settings
- **Approach**: Playwright visual tests generate screenshots in `./client/lost-pixel/`
- **Workflow**: CI copies config to root before running Lost Pixel analysis
- **Project ID**: `cmg2v3o380sw0zhcswscbcr96` with API key authentication
- **Viewports**: Supports multiple device orientations (portrait/landscape)
- **CI/CD Only**: Not designed for local development use

### TypeScript Configuration

Both workspaces use consistent TypeScript setup:
- **Server**: Compiles `src/` → `dist/` with `rootDir` and `outDir`
- **Client**: Uses Vite's TypeScript handling
- **Shared**: `tsconfig*.json` patterns tracked in Turbo inputs

### CI/CD Workflow

**Three-Workflow Architecture** for optimized performance and separation of concerns:

1. **PR Workflow** (`.github/workflows/pr.yml`):
   - **Trigger**: On pull request
   - **Purpose**: Fast feedback with essential quality checks
   - **Jobs**: Three parallel jobs (format, lint, test) for faster execution
   - **Performance**: Lightweight to reduce PR friction and provide quick feedback

2. **CI Workflow** (`.github/workflows/ci.yml`):
   - **Trigger**: On push to main branch
   - **Purpose**: Comprehensive testing after code integration
   - **Jobs**:
     - Unit/integration tests across all workspaces
     - Functional E2E testing with Playwright
   - **Optimization**: Uses Chromium-only for faster E2E execution
   - **Infrastructure**: Runs on Ubuntu with Node.js 20 and pnpm

3. **Visual Regression Testing** (`.github/workflows/vrt.yml`):
   - **Trigger**: On pull request (separate from main CI for isolation)
   - **Purpose**: Visual regression testing with Lost Pixel
   - **Workflow**:
     - Builds client and starts preview server
     - Runs Playwright visual tests to generate screenshots
     - Copies Lost Pixel config from client to root directory
     - Executes Lost Pixel comparison against cloud baselines
   - **Authentication**: Uses `LOST_PIXEL_API_KEY` secret for cloud service

4. **Cache Cleanup** (`.github/workflows/cache-cleanup.yml`):
   - **Trigger**: Weekly on Sundays at 2:00 UTC (also manual via workflow_dispatch)
   - **Purpose**: Automated cleanup of old GitHub Actions caches
   - **Logic**: Deletes caches older than 7 days to prevent storage bloat

### Composite Actions

**Reusable Setup Actions** (`.github/actions/`):
- **setup-node-pnpm**: Base setup with Node.js, pnpm, dependency installation, and Turbo caching
- **setup-with-playwright**: Extended setup including Playwright browser caching and installation
- **Benefits**: 46% reduction in workflow lines, 100% elimination of setup duplication

**Performance Optimizations**:
- **Browser Optimization**: CI uses `test:e2e:install:ci` (Chromium-only) vs local `test:e2e:install` (all browsers)
- **Workflow Separation**: Visual tests isolated to prevent blocking PRs on screenshot differences
- **Caching Strategy**: Leverages Turborepo caching and GitHub Actions cache for dependencies and Playwright browsers
- **Browser Caching**: Playwright browsers cached using pnpm-lock.yaml hash for cache invalidation
- **Composite Actions**: Reusable setup actions eliminate workflow duplication (46% reduction)
- **Path Filters**: Skip workflows for docs-only changes to save CI resources
- **Automated Cache Cleanup**: Weekly cleanup workflow prevents storage bloat
- **Parallel Execution**: Jobs run in parallel where possible for faster feedback

### macOS Development

- **Required**: macOS with Music app for AppleScript integration
- **Node.js**: Version 20+ recommended (tested with v24.8.0)
- **Package Manager**: pnpm v9.6.0+ required for workspace management
- **Server Development**: Uses `ts-node-dev` for hot reloading TypeScript
- **Client Development**: Uses Vite's HMR for instant updates

### Technology Stack

**Frontend Dependencies**:
- React 19.1.0 with TypeScript
- Tailwind CSS v4.1.11 with Vite plugin
- Framer Motion 12.23+ for animations
- TanStack React Query 5.83+ for server state management
- Jotai 2.15+ for local state management
- Radix UI primitives for accessible components
- Lucide React for consistent iconography
- Liricle 4.2.0 for LRC lyrics parsing

**Backend Dependencies**:
- Hono 4.8+ (lightweight web framework)
- @hono/node-server 1.15+ for Node.js integration
- Node.js with TypeScript compilation
- AppleScript integration via `osascript` system calls

**Development Tools**:
- Vite 7.0+ for frontend build tooling
- Vitest 3.2+ for unit testing with coverage support
- Playwright 1.55+ for E2E testing
- Lost Pixel 3.22+ for visual regression testing
- ESLint 9.30+ with TypeScript support
- Prettier 3.6+ with Tailwind CSS plugin
- Husky 9.1+ for Git hooks
- Turborepo 2.0+ for monorepo management

**Package Management**:
- pnpm 9.6+ as package manager
- Node.js 20+ (tested with v24.8.0)

## User Interface & Interaction

### Keyboard Shortcuts
The application supports global keyboard shortcuts implemented via the `useKeyboardShortcuts` hook:
- Shortcuts work when the page is focused and user is not typing in input fields
- Hook automatically detects input contexts to prevent conflicts
- Provides intuitive media player controls without mouse interaction

### Animation System
Settings panel uses Framer Motion with optimized transitions:
- **Performance**: 300ms duration prevents lag while feeling responsive
- **Easing**: iOS-native curve provides familiar, polished feel
- **Layout**: Non-destructive overlay preserves lyrics view context
- **Accessibility**: Respects user motion preferences and keyboard navigation

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one, UNLESS there are benefits to creating a new file (like better organization or performance).
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
snb=Go back to the main branch, fetch the latest changes from the remotes and reset --hard origin/main. Make sure the branch is clean and ready to go.
itf=Go ahead and implement the fix.
rcc=Review all changes (any obvious mistakes? any logical mistakes? do we really need all this code for this change? are the better ways to do it? are there any performance issues? are there any security vulnerabilities? are there any accessibility issues?), check tests (are the tests up to date? can we remove any test that is not useful? do we need to add more tests?) and commit (use separate commits if it makes logical sense). And finally update README.me if necessary as well as CLAUDE.md. Make sure no files are left in the working directory.
ppr=prepare for pr, checkout to a new branch (pick a name that follows git best practices) and give me the url to create a pr and also a gh command to create a pr based on the current branch against main that I can copy and run.
