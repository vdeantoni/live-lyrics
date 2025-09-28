# Live Lyrics 🎵

A beautiful web application that displays synchronized lyrics for songs currently playing in your Apple Music app on macOS. Features real-time lyric synchronization, visual effects, and a responsive design that works great on both mobile and desktop.

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
- **Multiple Lyrics Sources**: Integrates with external APIs for comprehensive lyrics coverage

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion
- **Backend**: Node.js, Hono framework, AppleScript integration
- **State Management**: TanStack React Query, Jotai
- **Build System**: Turborepo monorepo with optimized caching
- **Testing**: Vitest (unit), Playwright (E2E), Lost Pixel (visual regression)

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
# Run all unit tests
pnpm test

# Run with coverage
cd client && pnpm test:coverage

# Interactive test UI
cd client && pnpm test:ui
```

### End-to-End Tests
```bash
# Install browser dependencies (Chromium for CI optimization)
cd client && pnpm test:e2e:install:ci

# Run visual regression tests
cd client && pnpm test:e2e:visual

# Run functional tests
cd client && pnpm test:e2e:functional
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
│   │   │   └── ui/         # Reusable UI components
│   │   └── test/           # Unit tests
│   └── tests/              # E2E tests (Playwright)
├── server/                 # Node.js backend API
│   └── src/
│       └── index.ts        # Hono server with AppleScript integration
├── lost-pixel/             # Visual regression test screenshots
└── .github/workflows/      # CI/CD workflows
```

## 🏗 Architecture

### Client-Server Communication
1. **Server** polls macOS Music app via AppleScript every request
2. **Client** queries server every 300ms using React Query
3. **External APIs** provide lyrics and album artwork
4. **React Query** handles caching and persistence across sessions

### Key Components
- **LyricsVisualizer**: Main container orchestrating layout
- **LyricsProvider**: Data fetching and state management
- **LyricsDisplay**: Visual effects and background rendering
- **LyricsContent**: Synchronized lyrics rendering
- **Player**: Music controls with animated song information

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
- **Format check**: Ensures code is properly formatted
- **Lint check**: Ensures no linting errors
- **Test**: Ensures all tests pass

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
- Visual regression tests run automatically in CI/CD
- Use `[data-testid="..."]` attributes for test selectors

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Apple Music for the music playback API
- [Lrclib](https://lrclib.net/) for lyrics data
- [Lost Pixel](https://lost-pixel.com/) for visual regression testing
- All contributors who help make this project better

---

**Made with ❤️ for music lovers who want to sing along!**