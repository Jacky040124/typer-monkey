# Typer Monkey Experience 🐵

An immersive Three.js scene paired with a lightweight React overlay. The project recreates the Typer Monkey desk setup complete with ambient music and quick-access UI controls.

## Features

- 🎮 Three.js-powered scene management with `SceneManager` and custom objects
- 🖥️ Minimal React overlay (music player, GitHub star button, Dev Mode toggle)
- 🎵 Ambient music player with play/pause UI and track metadata
- 🧪 Dev Mode toggle surfaced through the overlay for quick scene debugging
- ⭐ GitHub Star button with live star-count formatting

## Getting Started

### Prerequisites

- Node.js (v20.19.0 or higher recommended)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

## How It Works

1. `main.tsx` boots the Three.js scene (`getThreeApp`) alongside the React overlay.
2. The Three scene mounts into dedicated DOM containers managed by `ThreeApp`.
3. The React `App` component shows persistent controls such as the music player, GitHub button, and dev-mode toggle.
4. Toggling Dev Mode calls straight into the shared `ThreeApp` instance so the renderer can update camera controls/UI hints.

## Project Structure

```
typing-monkey/
├── src/
│   ├── components/
│   │   ├── MusicPlayer.tsx
│   │   └── profile/GitHubStarButton.tsx
│   ├── lib/
│   │   ├── ThreeApp.tsx
│   │   ├── SceneManager.ts
│   │   └── objects/
│   ├── models/
│   │   └── typing.ts
│   ├── utils/
│   │   └── numberFormatter.ts
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## Technologies Used

- React + TypeScript
- Vite
- CSS3

## License

MIT