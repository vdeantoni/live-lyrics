import type { Song } from '@/lib/api'
import type { MusicSource, LyricsProvider, ArtworkProvider } from '@/types/musicSource'
import { HttpLyricsProvider } from '@/providers/httpLyricsProvider'

/**
 * HTTP-based music source that communicates with a real server
 */
export class HttpMusicSource implements MusicSource {
  private baseUrl: string
  private lyricsProvider: LyricsProvider

  constructor(baseUrl: string = 'http://127.0.0.1:4000') {
    this.baseUrl = baseUrl
    this.lyricsProvider = new HttpLyricsProvider()
  }

  async getSong(): Promise<Song> {
    const response = await fetch(`${this.baseUrl}/music`)

    if (!response.ok) {
      throw new Error(`Failed to fetch song: ${response.status}`)
    }

    const json = await response.json()

    return {
      name: json.name || 'Unknown Track',
      artist: json.artist || 'Unknown Artist',
      album: json.album || 'Unknown Album',
      duration: json.duration || 0,
      currentTime: parseFloat(json.currentTime || 0),
      isPlaying: json.playerState === 'playing',
    }
  }

  async play(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/music`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'play' }),
    })

    if (!response.ok) {
      throw new Error(`Failed to play: ${response.status}`)
    }
  }

  async pause(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/music`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' }),
    })

    if (!response.ok) {
      throw new Error(`Failed to pause: ${response.status}`)
    }
  }

  async seek(time: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/music`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seek', time }),
    })

    if (!response.ok) {
      throw new Error(`Failed to seek: ${response.status}`)
    }
  }

  getId(): string {
    return `http-${this.baseUrl.replace(/[^a-zA-Z0-9]/g, '-')}`
  }

  getName(): string {
    return `HTTP Server (${this.baseUrl})`
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/music`, {
        method: 'GET',
      })
      return response.ok
    } catch {
      return false
    }
  }

  getLyricsProvider(): LyricsProvider | null {
    return this.lyricsProvider
  }

  getArtworkProvider(): ArtworkProvider | null {
    // For now, HTTP source doesn't provide artwork directly
    // Could implement iTunes API artwork provider here
    return null
  }
}