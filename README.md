# Live Lyrics 🎵

Ever wanted to have a karaoke session with any Music? Now you can. This project syncs lyrics with your currently playing song.

[![CI Tests](https://github.com/vdeantoni/live-lyrics/actions/workflows/ci.yml/badge.svg)](https://github.com/vdeantoni/live-lyrics/actions/workflows/ci.yml)
![Live Lyrics Demo](https://img.shields.io/badge/Platform-macOS-blue?logo=apple)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853d?logo=node.js&logoColor=white)

## ✨ Features

*   **Real-time Sync**: Lyrics that *actually* keep up with you.
*   **Pretty UI**: Album art so you don't have to stare at a wall of text.
*   **Responsive**: Works on your phone, so you can sing in the shower.
*   **Playback Controls**: For when you need to pause and catch your breath.
*   **Lyrics Search**: Find lyrics for that song stuck in your head.
*   **Keyboard Shortcuts**: Because clicking is too much work.

## 🚀 Getting Started

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/vdeantoni/live-lyrics.git
    cd live-lyrics
    pnpm install
    ```

2.  **Run it**:
    ```bash
    pnpm dev
    ```
    *   Client: `http://localhost:5173`
    *   Server: `http://localhost:4000`

3.  **Play a song** on Apple Music and open the client URL.

## 🛠️ Development

This is a [Turborepo](https://turbo.build/) monorepo. Here are the most common commands you'll need:

| Command             | Description                                         |
| ------------------- | --------------------------------------------------- |
| `pnpm dev`          | Starts the development server for client and server |
| `pnpm build`        | Builds the client and the server                    |
| `pnpm test`         | Runs all tests (unit, integration)                  |
| `pnpm lint`         | Lints and fixes code                                |
| `pnpm format`       | Formats code with Prettier                          |
| `pnpm --filter=...` | Run commands in a specific workspace (e.g., `client` or `server`) |

### Testing

*   **Unit & Integration (Vitest)**: `pnpm test`
*   **E2E (Playwright)**: `cd client && pnpm test:e2e`
*   **Visual Regression (Lost Pixel)**: `cd client && pnpm test:e2e:visual`

For more detailed testing commands, check out the `CLAUDE.md` file.

## 🤔 Troubleshooting

*   **"I don't see any lyrics!"**
    *   Make sure you are on **macOS**. This won't work on Windows or Linux.
    *   Make sure the **Apple Music app is running** and a song is playing.
    *   Check the server logs for any AppleScript errors (`pnpm --filter=server dev`).

*   **"Installation failed!"**
    *   Make sure you have **Node.js v20+** and **pnpm v9+** installed.

*   **"It's still not working!"**
    *   Open an issue and we'll try to help.

## 🤝 Contributing

Got an idea? Found a bug? Contributions are welcome!

1.  Fork the repo.
2.  Create a new branch.
3.  Make your changes.
4.  Make sure the tests pass (`pnpm test`).
5.  Open a pull request.

---

**Made with ❤️ for music lovers who want to sing along!**
