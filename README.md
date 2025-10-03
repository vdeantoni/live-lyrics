# Live Lyrics 🎵

A beautiful web application that displays synchronized lyrics for songs currently playing in your Apple Music app on macOS. Features real-time lyric synchronization, visual effects, and a responsive design that works great on both mobile and desktop.

[![CI Tests](https://github.com/vdeantoni/live-lyrics/actions/workflows/ci.yml/badge.svg)](https://github.com/vdeantoni/live-lyrics/actions/workflows/ci.yml)
![Live Lyrics Demo](https://img.shields.io/badge/Platform-macOS-blue?logo=apple)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853d?logo=node.js&logoColor=white)

## ✨ Features

- **Real-time Lyrics Sync**: Displays lyrics synchronized with your current Apple Music playback
- **Visual Effects**: Beautiful background effects using album artwork
- **Responsive Design**: Optimized layouts for both portrait (mobile) and landscape (desktop) orientations
- **Animated Song Information**: Smooth scrolling song names and artist information
- **Playback Controls**: Control your music directly from the web interface
- **Lyrics Search**: Search for any song across all lyrics providers with debounced multi-provider search
- **Keyboard Shortcuts**: Global shortcuts for playback control (Space, ←/→ seek) and navigation (C for settings, S for search)
- **Multiple Provider Management**: Drag-and-drop provider reordering with priority-based fallback system
- **Comprehensive Settings**: Full settings panel with player switching and provider configuration
- **Multiple Lyrics Sources**: Integrates with external APIs for comprehensive lyrics coverage with intelligent provider selection and quality-based matching
- **Silence Detection**: Animated timer and begin/end silence indicators for instrumental breaks

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, @dnd-kit
- **Backend**: Node.js, Hono framework, AppleScript integration
- **State Management**: TanStack React Query, Jotai
- **Build System**: Turborepo monorepo with optimized task pipeline and caching
- **Testing**: Vitest (unit/integration), Playwright (E2E functional), Lost Pixel (visual regression)
- **CI/CD**: GitHub Actions with advanced caching for dependencies and browsers

## 📋 Requirements

- **macOS** (required for Apple Music integration via AppleScript)
- **Apple Music app** installed and configured
- **Node.js 18+** and **pnpm**

## 🚀 Quick Start

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/live-lyrics.git
   cd live-lyrics
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development servers**
   ```bash
   pnpm dev
   ```

This will start:
- Client (React app): http://localhost:5173
- Server (API): http://localhost:4000

### Usage

1. Open Apple Music and play a song
2. Navigate to http://localhost:5173 in your browser
3. Enjoy synchronized lyrics with beautiful visual effects!

## 🧪 Testing

### Unit Tests
```bash
# Run all unit tests (client + server)
pnpm test

# Run client tests with coverage
cd client && pnpm test:coverage

# Run server tests with coverage
cd server && pnpm test:coverage

# Interactive test UI (client only)
cd client && pnpm test:ui
```

**Client Tests**: The unit tests use a sophisticated test utilities system (`client/tests/helpers/`) that provides:
- **`renderWithProviders()`**: Automated component rendering with provider registry setup
- **`createTestRegistry()`**: Consistent mock data for all provider types
- **Isolated State**: Each test gets fresh provider state to prevent cross-test pollution
- **Bootstrap Integration**: Automatic handling of app initialization and loading states

**Server Tests**: API endpoint tests with mocked `execFile` to avoid AppleScript dependencies:
- GET /music endpoint tests (playing/paused states, error handling)
- POST /music endpoint tests (play/pause/seek actions, legacy format support)
- getSongInfo parsing logic tests

### End-to-End Tests
```bash
# Install all browsers (local development)
cd client && pnpm test:e2e:install

# Install Chromium only (CI optimization)
cd client && pnpm test:e2e:install:ci

# Run all E2E tests
cd client && pnpm test:e2e

# Run visual regression tests only
cd client && pnpm test:e2e:visual

# Run functional tests only
cd client && pnpm test:e2e:functional

# Interactive test debugging
cd client && pnpm test:e2e:ui
cd client && pnpm test:e2e:debug
```

### Code Quality
```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Check formatting and linting (used in CI)
pnpm format:check
pnpm lint:check
```

## 📁 Project Structure

```
live-lyrics/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── LyricsVisualizer/  # Main lyrics display components
│   │   │   ├── Player/     # Player controls, search, and screen management
│   │   │   ├── Settings/   # Modular settings components with drag-and-drop
│   │   │   └── ui/         # Reusable UI components
│   │   ├── atoms/          # Jotai state atoms (appState.ts, playerAtoms.ts)
│   │   ├── hooks/          # React hooks (useKeyboardShortcuts, etc.)
│   │   ├── config/         # Provider configurations and lazy loading
│   │   └── types/          # TypeScript type definitions
│   └── tests/              # Test suites (organized by type)
│       ├── unit/           # Unit tests (Vitest)
│       ├── integration/    # Integration tests (Vitest)
│       ├── helpers/        # Test utilities (renderWithProviders, createTestRegistry)
│       └── e2e/            # End-to-end tests (Playwright)
│           ├── functional/ # Functional E2E tests
│           ├── visual/     # Visual regression tests
│           └── helpers/    # E2E test utilities
├── server/                 # Node.js backend API
│   ├── src/
│   │   └── index.ts        # Hono server with AppleScript integration
│   └── tests/              # Test suites
│       ├── unit/           # Unit tests (Vitest)
│       └── setup/          # Test configuration
├── lost-pixel/             # Visual regression test screenshots
└── .github/                # CI/CD configuration
    ├── actions/            # Reusable composite actions
    └── workflows/          # GitHub Actions workflows (CI, PR, VRT, cache cleanup)
```

## 🏗 Architecture

### Client-Server Communication
1. **Server** polls macOS Music app via AppleScript every request
2. **Client** queries server every 300ms using React Query
3. **External APIs** provide lyrics and album artwork
4. **React Query** handles caching and persistence across sessions

### Key Components
- **LyricsVisualizer**: Main container orchestrating layout
- **LyricsManager**: Data fetching and state management (formerly LyricsProvider)
- **LyricsDisplay**: Visual effects and background rendering
- **LyricsContent**: Synchronized lyrics rendering with word-level highlighting
- **Player**: Music controls with animated song information
- **SearchScreen**: Multi-provider lyrics search with debounced input and result deduplication
- **SettingsScreen**: Comprehensive settings panel with drag-and-drop provider management
- **Settings Components**: Modular components for player, lyrics, and artwork provider configuration
- **SilenceIndicator**: Animated silence detection with configurable timing thresholds

## 🔧 Development

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers (client + server) |
| `pnpm build` | Build for production |
| `pnpm test` | Run all tests |
| `pnpm lint` | Fix linting issues |
| `pnpm format` | Format code with Prettier |

### Workspace Commands

| Workspace | Command | Description |
|-----------|---------|-------------|
| Client | `cd client && pnpm dev` | Vite dev server (port 5173) |
| Server | `cd server && pnpm dev` | Node.js server (port 4000) |

### Pre-commit Hooks

The project uses Husky to run quality checks before each commit:
- **Format check**: Ensures code is properly formatted (`pnpm format:check`)
- **Lint check**: Ensures no linting errors (`pnpm lint:check`)
- **Test**: Ensures all tests pass (`pnpm test`)

These checks leverage Turborepo's caching system for faster execution.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and quality checks (`pnpm test && pnpm lint:check && pnpm format:check`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Tips

- The app requires macOS and Apple Music for full functionality
- Tests use a simulated player environment for cross-platform compatibility
- Visual regression tests run automatically in CI/CD via Lost Pixel with robust background image loading detection
- Visual tests include API mocking to handle external service failures gracefully
- Use `[data-testid="..."]` attributes for test selectors
- GitHub Actions include advanced caching for faster CI/CD builds:
  - pnpm store caching for dependencies
  - Playwright browser caching for E2E tests
  - Turborepo task caching for optimized builds

## 🚀 CI/CD Workflows

The project includes three GitHub Actions workflows:

### Main CI (`ci.yml`)
Runs on pushes to main branch:
- **Tests Job**: Unit and integration tests with Turborepo caching
- **E2E Job**: Functional Playwright tests with browser caching
- **Artifacts**: Playwright reports uploaded for 30 days

### Pull Request CI (`pr.yml`)
Runs on pull requests for quick feedback

### Visual Regression Testing (`vrt.yml`)
Runs on pull requests:
- **Lost Pixel Integration**: Automated visual regression detection
- **Screenshot Comparison**: Compares UI changes against baselines
- **Background Loading**: Robust handling of artwork loading with preloading and enhanced waiting
- **API Mocking**: Consistent test results with mocked external services (iTunes, LrcLib)
- **Timing Stability**: Images preloaded before display to prevent visual inconsistencies
- **Artifacts**: Visual test results and Playwright reports
- **Cloud Integration**: Results available in Lost Pixel dashboard

### Caching Strategy
All workflows implement multi-level caching:
- **Dependencies**: pnpm store cached by lockfile hash
- **Browsers**: Playwright browsers cached by package.json hash
- **Build Outputs**: Turborepo handles task-level caching

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Apple Music for the music playback API
- [Lrclib](https://lrclib.net/) for lyrics data
- [Lost Pixel](https://lost-pixel.com/) for visual regression testing
- All contributors who help make this project better

---

**Made with ❤️ for music lovers who want to sing along!**