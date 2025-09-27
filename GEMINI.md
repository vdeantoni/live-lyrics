# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Live Lyrics

This project is a web-based application that displays the lyrics of the song currently playing on the user's Apple Music application. It features a client-server architecture, where the server retrieves the song information and the client presents it in a visually appealing way.

## Commands

This is a [Turborepo](https://turbo.build/) monorepo project. Use these commands:

- `pnpm dev`: Starts the development server for both the client and the server
- `pnpm build`: Builds the client and the server
- `pnpm lint`: Lints the client and the server

### Individual workspace commands:
- Client: `cd client && pnpm dev` (Vite dev server on port 5173)
- Server: `cd server && pnpm dev` (Node.js server on port 4000)

## Architecture

### Monorepo Structure
- **Root**: Turborepo configuration with shared scripts
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
- **Linting**: ESLint configured for both workspaces
- **Formatting**: Prettier for code formatting
- **Hot Reloading**: Available in both client (Vite) and server (ts-node-dev)