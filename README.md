# FreezeFrame 🛒

Ever paused a video and thought "I NEED that sweater"? We got you covered! 🛋️✨

FreezeFrame is a Chrome extension that turns your streaming addiction into a shopping opportunity. Pause any video, and we'll magically find those products on Amazon for you (or hopefully something similar).

## How it works 🪄

1. **Pause** your show (we know you were going to anyway)
2. **Screenshot** gets taken automatically 📸
3. **AI** figures out what stuff is in the scene 🤖
4. **Amazon** search results appear like magic ✨
5. **Shop** till you drop (or until you resume the show)

_Disclaimer: We are not responsible for your impulse purchases or explaining to your partner why you bought a $200 throw pillow because you saw it in Bridgerton._

## Supported sites

We currently support YouTube videos and shorts, with plans to expand to Instagram and TikTok.

## Setup Instructions 🚀

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Chrome browser** (for loading the extension)

### 1. Install and build

Clone the repository and install dependencies

```bash
git clone https://github.com/jorgenwh/freezeframe
cd freezeframe
npm install
```

Build the Chrome extension:

```bash
# Production build with production server
npm run build

# Production build with development server
npm run build:dev

# Production build with local server
npm run build:local

# Development build with local server (with watch mode)
npm run dev

# Development build with production server (with watch mode)
npm run dev:prod

# Development build with development server (with watch mode)
npm run dev:dev
```

### 5. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `dist` folder from your project directory
5. The FreezeFrame extension should now appear in your extensions list

## Bugs and missing features 🪲

https://docs.google.com/spreadsheets/d/1yV6rFRURZqth7h1-V6_pPQ3C8T4gTP0z7h4sA56xFCw/edit?usp=sharing
