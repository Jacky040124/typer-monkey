# Typer Monkey Game 🐵

A web-based typing game where a monkey randomly types on the keyboard, and valid English words are automatically detected and added to a collection in real-time.

## Features

- 🐵 Random monkey typing simulation
- 📝 Real-time word detection from typing stream
- 📚 Automatic collection of valid English words
- 🎨 Clean, minimal UI
- ⏯️ Start/stop controls
- 🗑️ Clear functionality

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

1. Click **Start** to begin the monkey typing simulation
2. The monkey randomly types characters (letters, spaces, punctuation)
3. As valid English words are detected in real-time, they're automatically added to your collection
4. Watch your collection grow as the monkey continues typing!

## Project Structure

```
typing-monkey/
├── src/
│   ├── components/
│   │   ├── Monkey.tsx       # Monkey typing simulation
│   │   └── Collection.tsx   # Collection display component
│   ├── utils/
│   │   └── wordDetector.ts  # Word detection logic
│   ├── assets/
│   │   └── words.json       # English dictionary
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
└── package.json
```

## Technologies Used

- React + TypeScript
- Vite
- CSS3

## License

MIT