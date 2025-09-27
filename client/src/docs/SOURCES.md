# Music Source System

The Live Lyrics app now supports multiple music sources through a flexible interface system.

## Architecture

### MusicSource Interface

All music sources implement the `MusicSource` interface:

```typescript
interface MusicSource {
  getSong(): Promise<Song>     // Get current song info
  play(): Promise<void>        // Start/resume playback
  pause(): Promise<void>       // Pause playback
  seek(time: number): Promise<void>  // Seek to position
  getId(): string              // Unique identifier
  getName(): string            // Human-readable name
  isAvailable(): Promise<boolean>    // Check availability
}
```

## Available Sources

### HTTP Source (`HttpMusicSource`)
- Connects to the real server at `http://127.0.0.1:4000`
- Controls actual Apple Music playback
- Best for production use

### Simulated Source (`SimulatedMusicSource`)
- In-memory player with internal clock
- Demo playlist with classic songs
- Perfect for development and testing
- Features:
  - Auto-advance to next song
  - Realistic timing simulation
  - No external dependencies

## Usage

### Source Switching
Use the source switcher UI at the top of the app to toggle between:
- **Local Server** (HTTP) - Real Apple Music control
- **Simulated Player** - Demo mode

### Adding New Sources
1. Implement the `MusicSource` interface
2. Add to `availableSources` in `sourceAtoms.ts`
3. Update `createMusicSource` factory function

## Benefits

- **Flexibility**: Easy to add new music services
- **Testing**: Simulated source for reliable development
- **Abstraction**: UI code doesn't need to know about specific sources
- **Extensibility**: Foundation for Spotify, YouTube Music, etc.

## Example: Custom Source

```typescript
class SpotifyMusicSource implements MusicSource {
  async getSong(): Promise<Song> {
    // Spotify Web API integration
  }

  async play(): Promise<void> {
    // Spotify play command
  }

  // ... implement other methods
}
```