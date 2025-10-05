import type { Playlist } from "@/types";

/**
 * Default playlists pre-installed with the application
 * These are loaded as the initial value in playlistsAtom
 */
export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: "default-classic-hits",
    name: "Classic Hits",
    description: "A collection of timeless classics",
    songs: [
      {
        id: "song_bohemian_rhapsody",
        name: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        duration: 355,
        order: 0,
      },
      {
        id: "song_stairway_to_heaven",
        name: "Stairway to Heaven",
        artist: "Led Zeppelin",
        album: "Led Zeppelin IV",
        duration: 482,
        order: 1,
      },
      {
        id: "song_hotel_california",
        name: "Hotel California",
        artist: "Eagles",
        album: "Hotel California",
        duration: 391,
        order: 2,
      },
      {
        id: "song_imagine",
        name: "Imagine",
        artist: "John Lennon",
        album: "Imagine",
        duration: 183,
        order: 3,
      },
      {
        id: "song_sweet_child_o_mine",
        name: "Sweet Child O' Mine",
        artist: "Guns N' Roses",
        album: "Appetite for Destruction",
        duration: 356,
        order: 4,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
