# PauseShop 🛒

Ever paused Netflix and thought "I NEED that lamp"? We got you covered! 🛋️✨

PauseShop is a Chrome extension that turns your streaming addiction into a shopping opportunity. Pause any video, and we'll magically find those products on Amazon for you (or hopefully something similar).

## How it works 🪄

1. **Pause** your show (we know you were going to anyway)
2. **Screenshot** gets taken automatically 📸
3. **AI** figures out what stuff is in the scene 🤖
4. **Amazon** search results appear like magic ✨
5. **Shop** till you drop (or until you resume the show)

## What it supports 📺

- Netflix
- YouTube
- ~~Hulu~~
- ~~Prime Video~~
- ~~Disney+~~
- ~~HBO Max~~

Basically everywhere you procrastinate.

_Disclaimer: We are not responsible for your impulse purchases or explaining to your partner why you bought a $200 throw pillow because you saw it in Bridgerton._

## Setup Instructions 🚀

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Chrome browser** (for loading the extension)

### 1. Install Dependencies

Clone the repository and install all dependencies:

```bash
git clone https://github.com/jorgenwh/pauseshop
cd pauseshop
npm install
```

This will install dependencies for both the extension and server workspaces.

### 2. Environment Configuration

#### Server Environment Setup

1. Copy the example environment file:
   ```bash
   cp server/.env.example server/.env
   ```

2. Edit `server/.env` and configure Gemini (required for image analysis):

   ```env
   ANALYSIS_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash-preview-05-20
   ```

   **Getting a Gemini API Key:**
   1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   2. Sign in with your Google account
   3. Click "Create API Key"
   4. Copy the generated key and paste it in your `.env` file

3. Optionally configure the server port (default is 3000):
   ```env
   PORT=3000
   NODE_ENV=development
   ```

### 3. Build the Extension

Build the Chrome extension for production:

```bash
npm run build:extension
```

Or for development with file watching:

```bash
npm run dev
```

This creates a `dist` folder in the `extension` directory with all the built files.

### 4. Build and Run the Server

#### Build the Server

```bash
npm run build:server
```

#### Run the Server

For development (with auto-restart):
```bash
npm run dev:server
```

For production:
```bash
npm run start --workspace=server
```

The server will start on `http://localhost:3000` (or your configured PORT).

### 5. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `extension/dist` folder from your project directory
5. The PauseShop extension should now appear in your extensions list

### 6. Verify Setup

1. Make sure the server is running (`npm run dev:server`)
2. Open a supported video site (Netflix, YouTube)
3. Play a video and pause it
4. The PauseShop sidebar should appear with product suggestions

## Development Commands 🛠️

### Root Level Commands

```bash
# Build everything
npm run build

# Build extension only
npm run build:extension

# Build server only
npm run build:server

# Run extension in development mode (with file watching)
npm run dev

# Run server in development mode (with auto-restart)
npm run dev:server

# Run tests for both extension and server
npm run test

# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format all code
npm run format

# Clean build artifacts
npm run clean
```

### Extension-Specific Commands

```bash
# From the extension directory
cd extension

# Build for production
npm run build

# Build for development with watching
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Clean build artifacts
npm run clean
```

### Server-Specific Commands

```bash
# From the server directory
cd server

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run in production mode
npm run start

# Run tests
npm run test

# Clean build artifacts
npm run clean
```

## Troubleshooting 🔧

### Extension Not Loading
- Make sure you built the extension (`npm run build:extension`)
- Check that the `extension/dist` folder exists and contains files
- Verify Developer mode is enabled in Chrome extensions

### Server Connection Issues
- Ensure the server is running on the correct port
- Check your `.env` file configuration
- Verify your Gemini API key is valid and has proper permissions

### Image Analysis Not Working
- Check that your `ANALYSIS_PROVIDER=gemini` in the `.env` file
- Verify your Gemini API key is correct and active
- Make sure you have sufficient API quota remaining

### Build Errors
- Make sure you have the correct Node.js and npm versions
- Try deleting `node_modules` and running `npm install` again
- Check for any TypeScript compilation errors

## Bugs and missing features 🪲

https://docs.google.com/spreadsheets/d/1yV6rFRURZqth7h1-V6_pPQ3C8T4gTP0z7h4sA56xFCw/edit?usp=sharing
