# Live Lyrics

This project is a web-based application that displays the lyrics of the song currently playing on the user's Apple Music application. It features a client-server architecture, where the server retrieves the song information and the client presents it in a visually appealing way.

This is a [Turborepo](https://turbo.build/) project. You can use the following commands to run the application:

- `pnpm dev`: Starts the development server for both the client and the server.
- `pnpm build`: Builds the client and the server.
- `pnpm lint`: Lints the client and the server.

## Project Overview

The application is composed of two main parts: a server and a client. The server is responsible for obtaining the real-time song information from the Apple Music application, while the client is in charge of displaying this information to the user.

The server is built using Node.js and Hono, a lightweight web framework. It exposes a RESTful API that provides the following endpoints:

- `GET /music`: Returns the current song's information, such as the song name, artist, album, and current playback time.
- `POST /music`: Allows controlling the music playback, such as playing, pausing, and seeking.

The client is a React application built with Vite. It uses the following technologies:

- **React**: For building the user interface.
- **Tailwind CSS**: For styling the application.
- **@tanstack/react-query**: For fetching and caching data from the server.

The client fetches the song information from the server every 300 milliseconds and updates the user interface accordingly. It also fetches the song's artwork from the iTunes API and the lyrics from the Lrclib API.

## Getting Started

To run the application, you need to have Node.js and pnpm installed on your machine.

```bash
pnpm install
pnpm dev
```

The client will be available at http://localhost:5173 and the server at http://localhost:4000.

## Development Conventions

The project uses Prettier for code formatting and ESLint for linting. Please make sure to run the following commands before committing your changes:

```bash
pnpm lint
```

The project also uses TypeScript for both the client and the server. Please make sure to follow the TypeScript best practices when writing your code.