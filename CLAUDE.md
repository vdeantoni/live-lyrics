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

### Running Commands from Root Directory

You can run any pnpm command from the root directory by using the `--filter` option to target specific packages:

- `pnpm --filter=client run dev`: Start client dev server
- `pnpm --filter=server run dev`: Start server dev server
- `pnpm --filter=client run test`: Run client tests
- `pnpm --filter=client run test:e2e`: Run client E2E tests
- `pnpm --filter=client run test:e2e:visual`: Run visual regression tests
- `pnpm --filter=client run lint`: Lint client code
- `pnpm --filter=server run build`: Build server

### Individual workspace commands:

- Client: `cd client && pnpm dev` (Vite dev server on port 5173)
- Server: `cd server && pnpm dev` (Node.js server on port 4000)

### Testing commands:

#### Server Unit Tests (Vitest)
- `cd server && pnpm test`: Run Vitest tests once
- `cd server && pnpm test:watch`: Run Vitest tests in watch mode
- `cd server && pnpm test:coverage`: Generate coverage reports
- `pnpm --filter=server run test`: Run server tests from root

**Running Single Tests**:
- Run specific test file: `cd server && npx vitest tests/unit/routes.test.ts`
- Run tests matching pattern: `cd server && npx vitest --reporter=verbose --run routes`
- Run with coverage: `cd server && npx vitest --coverage`

#### Client Unit & Integration Tests (Vitest)
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
- **WebSocket Server**: Real-time communication using JSON-RPC 2.0 protocol
  - `song.update`: Broadcasts song info only on state changes (song change, play/pause, significant time drift from seeking)
  - Server polls Apple Music every 300ms but only broadcasts when meaningful changes occur
  - `queue.changed`: Notifies clients when playlist queue changes
  - `history.changed`: Notifies clients when playback history updates
  - Player control methods: `player.play`, `player.pause`, `player.seek`, `player.next`, `player.previous`
  - Server method: `server.ping` for health checks
- **API Endpoints**:
  - `GET /`: Health check endpoint (used by isAvailable())
- **Build**: TypeScript compiles `src/` → `dist/` with `rootDir` and `outDir` configuration
- **Testing**: Vitest with mocked `execFile` for unit testing WebSocket logic and utilities

### Client (client/)

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 with custom CSS animations
- **Animations**: Framer Motion for complex animations (song name scrolling)
- **State Management**: @tanstack/react-query with persistent localStorage cache + Jotai atoms
- **Icons**: Lucide React for consistent iconography
- **UI Components**: Radix UI primitives (slider, aspect-ratio, button)
- **Key Features**:
  - Real-time music data with client-side time tracking (smooth 100ms updates)
  - Server polls Apple Music every 300ms, broadcasts only on state changes
  - Lyrics integration with external APIs (iTunes artwork, Lrclib lyrics)
  - Visual lyrics display with synchronized highlighting
  - Responsive design with landscape mode optimizations
  - Animated song name scrolling with hover pause/resume
  - Global keyboard shortcuts for playback control and navigation
  - Smooth iOS-style settings panel animations
  - Animated loading screen with smooth transitions during app bootstrap

### Component Architecture

- **LyricsVisualizer/**: Main lyrics display component hierarchy
  - `LyricsVisualizer.tsx`: Root container with layout orchestration
  - `LyricsManager.tsx`: Data fetching, state management, and lyrics processing (formerly LyricsProvider)
  - `LyricsDisplay.tsx`: Visual effects wrapper and background rendering
  - `LyricsContent.tsx`: Actual lyrics rendering with synchronization and word-level highlighting
  - `Player.tsx`: Music playback controls with animated song name
  - `AnimatedSongName.tsx`: Framer Motion component for scrolling song titles
  - `SilenceIndicator.tsx`: Animated silence detection with cubic easing fade effects (first block fades in/out, middle blocks 1s fade in/out, last block 1s fade in then out)
  - `NoLyricsFound.tsx`: Empty state component for missing lyrics
- **Player/**: Main application screens and loading states
  - `MainScreen.tsx`: Root screen component with overlay management
  - `LoadingScreen.tsx`: Animated loading screen with rotating vinyl record and gradient background
  - `LyricsScreen.tsx`: Main lyrics display screen
  - `SearchScreen.tsx`: Lyrics search interface with debounced multi-provider search, result deduplication, song selection, and dedicated close button
  - `PlaylistsScreen.tsx`: Responsive playlists/queue/history screen with conditional rendering (3 layouts: mobile tabs, tablet 2-column, desktop 3-column) using `useMediaQuery` for optimal DOM performance, with dedicated close button
  - `PlaylistsColumn.tsx`: Playlist management UI with expand/collapse, play all, and delete functionality
  - `QueueColumn.tsx`: Player queue display with song list
  - `HistoryColumn.tsx`: Playback history display
  - `PlayerControls.tsx`: Playback controls with progress slider, play/pause button, previous/next navigation buttons, settings button, and quick action buttons
- **Settings/**: Comprehensive settings system with drag-and-drop provider management
  - `SettingsScreen.tsx`: Main settings panel with smooth slide animations and dedicated close button
  - `PlayerSection.tsx`: Music player selection (Local/Remote) with player-specific settings (auto-play toggle, lyrics sync time offset)
  - `LyricsProviderSection.tsx`: Lyrics provider management with drag-and-drop reordering
  - `ArtworkProviderSection.tsx`: Artwork provider management with drag-and-drop reordering
  - `ProviderSection.tsx`: Reusable drag-and-drop provider list with @dnd-kit integration
  - `SortableProviderItem.tsx`: Individual draggable provider items with status icons and loading states
  - `ClearAppDataSection.tsx`: App data management with clear functionality
- **ui/**: Reusable UI components (buttons, sliders, inputs, skeletons)

### User Interaction Features

**Global Keyboard Shortcuts**:
- **Space**: Play/Pause toggle
- **← →**: Seek backward/forward (5 seconds)
- **Shift + ← →**: Fast seek backward/forward (15 seconds)
- **C**: Toggle settings screen
- **S**: Toggle search screen
- **P**: Toggle playlists screen
- **A**: Open add-to-playlist dialog

**Settings Panel Animation**:
- Smooth slide-from-bottom transition (300ms duration)
- iOS-style easing curve `[0.25, 0.1, 0.25, 1]`
- Lyrics screen remains static while overlays slide over
- Settings button remains visible in PlayerControls and highlights when active
- Each overlay screen (settings, search, playlists) has its own dedicated close button
- Smart input field detection prevents keyboard shortcut conflicts
- Mutual exclusivity between search, settings, and playlists screens

**Search Screen**:
- Debounced search input (300ms delay) to minimize API calls
- Multi-provider search across all enabled lyrics providers
- Result deduplication by track ID
- Provider badge on each result showing source
- Click result to load song into player
- Smooth slide-in/out animations matching settings screen
- Auto-focus input after animation completes (350ms delay)

**Provider Management**:
- Drag-and-drop reordering using @dnd-kit with closestCenter collision detection
- Individual provider availability checks with loading spinners
- Toggle-based provider enabling/disabling
- Priority-based provider fallback system
- Real-time UI feedback during drag operations
- Per-item loading states replacing section-wide Suspense boundaries

### Data Flow

1. Server polls macOS Music app via AppleScript every 300ms
2. Server broadcasts song updates via WebSocket only on meaningful state changes (song change, play/pause, time drift >500ms)
3. Client maintains smooth time progression with internal 100ms clock when playing
4. Client fetches additional data (artwork, lyrics) from external APIs
5. React Query provides caching and persistence across sessions
6. Components render synchronized lyrics with client-tracked playback position

### State Management Architecture

**Jotai Atom Organization** (`client/src/atoms/`):

The app uses a centralized, well-organized Jotai atom system divided into two main files:

**`appState.ts`** - Application-wide state:
- **Core atoms**: `coreAppStateAtom` (bootstrap state), `appProvidersAtom` (provider registry), `settingsOpenAtom`, `searchOpenAtom` (UI state)
- **Settings atoms**: Separate atoms (`playersSettingsAtom`, `lyricsSettingsAtom`, `artworkSettingsAtom`) with custom localStorage serialization for Map types to prevent cross-contamination
- **Computed atoms**: `effectiveLyricsProvidersAtom`, `effectiveArtworkProvidersAtom`, `effectivePlayersAtom`, `selectedPlayerAtom`, `enabledLyricsProvidersAtom` (combine configs with user overrides)
- **UI control atoms**: `toggleSettingsAtom`, `toggleSearchAtom`, `togglePlaylistsAtom` for managing UI state
- **Helper factory**: `createProviderSettingsAtom()` eliminates duplicate localStorage serialization code

**`playerAtoms.ts`** - Music player state:
- **Read atoms**: `playerStateAtom` (current song), `lyricsContentAtom`, `lyricsDataAtom`, `activeLineAtom`, `activeWordAtom`, `artworkUrlsAtom`, loading states
- **UI state atom**: `playerUIStateAtom` (isDragging, isUserSeeking)

**Event-Driven Services** (`client/src/core/services/`):

The app follows an event-driven architecture pattern for state mutations:

**SettingsService** (`SettingsService.ts`):
- Singleton service handling all settings-related business logic
- Methods: `setProviderEnabled()`, `toggleProvider()`, `reorderProviders()`, `resetProviderSettings()`, `clearAllSettings()`, `getPlayerSettings()`, `setPlayerSettings()`
- Each method updates localStorage and emits `settings.changed` or `player.settings.changed` events
- Events are handled by `useEventSync()` which updates Jotai atoms
- Components use `useSettings()` hook to access service methods
- Player settings stored per-player (local/remote): `{ playOnAdd: boolean, timeOffsetInMs: number }`

**PlayerService** (`PlayerService.ts`):
- Singleton service for player control (play, pause, seek)
- Emits `player.state.changed` events after each action
- Components use `usePlayerControls()` hook

**Event Synchronization**:
- `useEventSync()` hook bridges events → Jotai atoms
- Listens to `settings.changed`, `player.state.changed` events
- Updates appropriate atoms when events are emitted
- Ensures components reactively update via atom subscriptions

**Design Patterns**:
- **Separation of concerns**: App-wide state vs player state
- **Event-driven architecture**: Services emit events → useEventSync updates atoms → components react
- **Computed atoms**: Efficient derived state with granular subscriptions
- **Service layer**: Business logic centralized in services, not in atoms
- **React hooks**: Clean component interface via `useSettings()`, `usePlayerControls()`
- **Factory functions**: DRY code for repeated patterns (storage serialization)

**React Adapters Organization** (`client/src/adapters/react/`):
The React integration layer is organized into specialized subdirectories:
- **`hooks/`**: Custom React hooks for component integration (`useSettings.ts`, `usePlayerControls.ts`, `useProviderStatus.ts`)
- **`sync/`**: Event synchronization hooks that bridge services to React state (`useEventSync.ts`)
- This separation clarifies the distinction between component-facing hooks and internal sync mechanisms

**Timing Constants** (`client/src/constants/timing.ts`):
- `POLLING_INTERVALS.SONG_SYNC` (300ms)
- `POLLING_INTERVALS.LYRICS_FETCH_POLL` (50ms)
- `UI_DELAYS.NO_LYRICS_DISPLAY` (500ms)
- `UI_DELAYS.SEEK_END_TIMEOUT` (1000ms)
- `LYRICS_SILENCE.DETECTION_THRESHOLD` (15s) - Minimum gap to trigger silence indicator
- `LYRICS_SILENCE.INDICATOR_DELAY` (5s) - Delay after lyric before showing indicator

### Lyrics Normalization System

The application uses a centralized normalization layer to ensure all lyrics are in Enhanced LRC format internally:

**Format Detection**:
- **Enhanced LRC**: Contains word-level timing markers `<00:10.50>` or multiple timestamps per line
- **Normal LRC**: Contains only line-level timestamps `[00:10.00]`
- **Plain Text**: No timing information

**Normalization Strategy** (`client/src/utils/lyricsNormalizer.ts`):
1. **Enhanced LRC** → Pass through unchanged
2. **Normal LRC** → Add word-level timestamp for each word: `[00:10.00]Hello world` becomes `[00:10.00]<00:10.00>Hello <00:10.00>world`
3. **Plain Text** → Add synthetic timestamps at 2-second intervals with word-level timing

**Benefits**:
- Single source of truth for format detection (`isEnhancedLrc()`, `isNormalLrc()`)
- Components simplified to check data presence (`line.words`) instead of format flags
- Normalization happens once in `useLyricsSync` before storing in `lyricsContentAtom`
- All downstream consumers (Liricle parser, display components) work with consistent format

**Test Coverage**: 34 comprehensive unit tests covering edge cases, Unicode, emojis, and performance scenarios

### Music Source Architecture

**Atom-Based Provider System**:
The app uses a centralized configuration-based architecture with multiple providers:

**Available Players**:
- **Remote Player** (`RemotePlayer`): Singleton instance that connects to local server via WebSocket for real Apple Music integration, with client-side time tracking (100ms updates), queue and history tracking, and persistent settings via SettingsService
- **Local Player** (`LocalPlayer`): Singleton instance with in-memory player, client-side time tracking, classic songs playlist, and persistent settings via SettingsService

**Provider Management**:
- Centralized configuration via `/src/config/providers.ts` with lazy loading
- Settings management through Jotai atoms in `settingsAtoms.ts`
- Dynamic provider loading eliminates side-effect imports
- Each provider implements respective interfaces (`Player`, `LyricsProvider`, `ArtworkProvider`)
- Individual provider availability checks with loading states
- Custom localStorage serialization for Set types in settings
- Priority-based provider fallback with drag-and-drop reordering

**Provider Ecosystem**:
- **Players**: `RemotePlayer` (Apple Music), `LocalPlayer` (simulated)
- **Lyrics Providers**: `LrclibLyricsProvider`, `LocalServerLyricsProvider`, `SimulatedLyricsProvider`
- **Artwork Providers**: `ITunesArtworkProvider` for album cover fetching
- Providers are loaded dynamically using `loadPlayer()`, `loadLyricsProvider()`, `loadArtworkProvider()`

**Provider Directory Structure** (`client/src/providers/`):
Providers are organized into categorized subdirectories for better maintainability:
- **`players/`**: Player implementations (`RemotePlayer.ts`, `LocalPlayer.ts`)
- **`lyrics/`**: Lyrics provider implementations (`LrclibLyricsProvider.ts`, `LocalServerLyricsProvider.ts`, `SimulatedLyricsProvider.ts`)
- **`artwork/`**: Artwork provider implementations (`ITunesArtworkProvider.ts`)
- This structure improves code organization and makes it easier to locate provider implementations

**Enhanced LrcLib Provider**:
The `LrclibLyricsProvider` features sophisticated track selection with intelligent matching:

- **Priority-Based Selection**: Enhanced LRC (word-level timing) → Regular LRC → Plain text
- **Smart Tiebreakers**: Closest duration match → Most lyric lines for better sync accuracy
- **Enhanced LRC Detection**: Recognizes `<00:10.50>` word timing and multiple timestamps per line
- **Metadata Filtering**: Excludes `[ar:Artist]`, `[ti:Title]` tags from line counts for precise matching
- **Comprehensive Error Handling**: Graceful fallback through all available tracks
- **Performance Optimized**: Efficient algorithms with minimal API calls

**Benefits of Atom-Based System**:
- Eliminates registry side-effect imports (`import "@/registries/registerProviders"`)
- Single source of truth for provider configuration
- Better code splitting with dynamic imports
- Cleaner separation between configuration and runtime instances

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
- `server/tests/unit/`: Unit tests for server routes and utilities
- `server/tests/setup/`: Server test configuration and setup files

**Server Unit Tests (Vitest)**:
- Run with `pnpm test` or workspace-specific `cd server && pnpm test`
- Configuration: `server/vitest.config.ts` with Node.js environment
- Setup: `server/tests/setup/setup.ts` with console mocks
- Uses node environment (not jsdom like client)
- Mocks `child_process.execFile` to avoid calling real AppleScript
- Tests cover:
  - getSongInfo parsing logic
  - Queue utilities (getQueueFromPlaylist, getCurrentPlaylistId)
  - Error handling and edge cases

**Client Unit & Integration Tests (Vitest)**:
- Run with `pnpm test` or workspace-specific `cd client && pnpm test`
- Configuration: `vitest.config.ts` with test includes/excludes
- Setup: `client/tests/setup/setup.ts` with global mocks and testing library imports
- Uses jsdom environment with React Testing Library
- Excludes E2E tests via configuration to avoid conflicts
- Supports coverage reporting and interactive UI mode
- **Key Test Files**:
  - `useKeyboardShortcuts.test.ts`: Comprehensive 40-test suite covering all keyboard shortcuts, error handling, and edge cases
  - `IndexedDBCache.test.ts`: Cache layer testing
  - `jsonRpcWebSocket.test.ts`: WebSocket client testing

**Test Utilities System** (`client/tests/helpers/`):
The test infrastructure includes a sophisticated utility system for provider registry testing:

- **`renderWithProviders(ui, options)`**: Main render function that automatically handles bootstrap and loading states
  ```typescript
  await renderWithProviders(<MyComponent />);
  // Automatically waits for bootstrap completion
  ```
- **`renderWithProvidersOnly(ui, options)`**: Render without waiting, for testing loading states manually
- **`createTestRegistry()`**: Factory function providing consistent mock data for all provider types
- **`testRegistryFactory`**: Centralized factory for creating both unit test and E2E test registries
- **`injectTestRegistry()`**: E2E helper for injecting test registry into browser window
- **`TestProvider`**: React wrapper that handles Jotai state and bootstrap initialization

**Provider Registry Testing**:
- **Deterministic Test Data**: LrcLib, Local Server, Simulated (lyrics); iTunes (artwork); Local, Remote (player sources)
- **Isolated State**: Each test gets fresh provider registry to prevent cross-test pollution
- **Mock Implementations**: All providers return `isAvailable: true` without network calls
- **Custom Scenarios**: Easy modification of provider states for specific test cases
- **Bootstrap Integration**: Automatic handling of app initialization and loading states

**Usage Examples**:
```typescript
// Basic component test
await renderWithProviders(<SettingsScreen />);
expect(screen.getByText("LrcLib")).toBeInTheDocument();

// Custom provider state
const customRegistry = createTestRegistry();
customRegistry.get("lrclib")!.status.isAvailable = false;
await renderWithProviders(<Component />, { testRegistry: customRegistry });
```

**E2E Tests (Playwright)**:
- **Performance Optimization**: CI uses Chromium-only (`test:e2e:install:ci`), local development supports all browsers
- **Local Development Timeouts**: Environment-aware configuration with faster timeouts locally (5s test, 3s action) vs CI (30s test, 5s action)
- **Test Structure**:
  - `tests/e2e/functional/app.spec.ts` - Application layout and responsiveness
  - `tests/e2e/functional/lyrics.spec.ts` - Lyrics display and synchronization
  - `tests/e2e/functional/player.spec.ts` - Player controls and interactions
  - `tests/e2e/functional/settings.spec.ts` - Settings screen functionality, drag-and-drop provider management, and individual loading states
  - `tests/e2e/functional/playlist.spec.ts` - Playlist navigation and song seeking
  - `tests/e2e/functional/error-handling.spec.ts` - Error scenarios and graceful degradation
  - `tests/e2e/functional/accessibility.spec.ts` - Keyboard navigation and WCAG compliance
  - `tests/e2e/functional/loading.spec.ts` - Loading screen animations and bootstrap delay simulation
  - `tests/e2e/visual/visual.spec.ts` - Visual regression screenshot generation
- **Configuration**: `playwright.config.ts` with CI-optimized settings and multiple browser support
- **Test Directory**: `./tests/e2e` (configured in Playwright config)
- **Environment**: Runs against preview server (port 5173) with simulated player data
- **Test Registry System**: Uses `injectTestRegistry()` helper to inject mock providers instead of HTTP mocking for more reliable tests
- **Selectors**: Uses `[data-testid="..."]` attributes for reliable element targeting, with specific support for Radix UI components

**Visual Regression (Lost Pixel)**:
- **Configuration**: `client/lostpixel.config.ts` defines custom shots path and project settings
- **Approach**: Playwright visual tests generate screenshots in `./client/lost-pixel/`
- **Workflow**: CI copies config to root before running Lost Pixel analysis
- **Project ID**: `cmg2v3o380sw0zhcswscbcr96` with API key authentication
- **Viewports**: Supports multiple device orientations (portrait/landscape)
- **Background Loading**: Visual tests include robust background image loading detection to handle iTunes API CORS issues and network failures gracefully
- **API Mocking**: Tests mock external APIs (iTunes artwork) to ensure consistent results regardless of network conditions
- **Artwork Preloading**: LyricsScreen component preloads images before setting as background to prevent timing-based visual instability
- **Enhanced Waiting**: Visual tests wait for both image loading completion and CSS transition completion (1200ms) for stable screenshots
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

### IDE Configuration

**IntelliJ IDEA / WebStorm**:
- Root `tsconfig.json` provides monorepo-wide TypeScript context
- Project references enable cross-workspace type checking
- Workspace configs have `composite: true` for proper incremental builds
- After setup: Restart IDE and "Invalidate Caches > Invalidate and Restart" if needed
- TypeScript service path: Settings → Languages & Frameworks → TypeScript → Use from `project node_modules`

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
- **Error Handling**: All async player operations (play, pause, seek) are wrapped in try-catch blocks
- Failed operations log to console.error instead of throwing unhandled promise rejections
- Defensive programming with optional chaining and default values for safe state access

### Animation System
Settings panel uses Framer Motion with optimized transitions:
- **Performance**: 300ms duration prevents lag while feeling responsive
- **Easing**: iOS-native curve provides familiar, polished feel
- **Layout**: Non-destructive overlay preserves lyrics view context
- **Accessibility**: Respects user motion preferences and keyboard navigation

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER change the working directory, TRY TO find a way to run commands from the current directory.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one, UNLESS there are benefits to creating a new file (like better organization or performance).
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
snb=Go back to the main branch, fetch the latest changes from the remotes and reset --hard origin/main. Make sure the branch is clean and ready to go.
itf=Go ahead and implement the fix.
rcc=Review all changes (any obvious mistakes? any logical mistakes? do we really need all this code for this change? are the better ways to do it? are there any performance issues? are there any security vulnerabilities? are there any accessibility issues?), look at the test files (are the tests up to date? can we remove any test that is not useful? do we need to add more tests?) and commit (use separate commits if it makes logical sense). And finally update README.me if necessary as well as CLAUDE.md. Make sure no files are left in the working directory.
ppr=prepare for pr, fetch origin/main and rebase, checkout to a new branch (pick a name that follows git best practices) and give me the url to create a pr and also a gh command to create a pr based on the current branch against main that I can copy and run.
