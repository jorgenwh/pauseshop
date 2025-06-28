# PauseShop Chrome Extension

## Project Overview
PauseShop is a Chrome extension that transforms video streaming into a shopping opportunity. When users pause videos on supported platforms (currently YouTube), the extension automatically captures a screenshot, analyzes it using AI to identify products, and displays relevant Amazon search results in a sleek sidebar interface.

## Core Functionality
- **Automatic Screenshot Capture**: Detects video pause events and captures the current frame
- **AI-Powered Product Recognition**: Sends screenshots to a backend server that uses Google's Gemini API to identify clothing, electronics, furniture, accessories, and other products
- **Amazon Product Search**: Automatically searches Amazon for identified products and displays results
- **Smart UI Integration**: Non-intrusive sidebar that adapts to different video platforms (YouTube, YouTube Shorts)
- **Real-time Streaming**: Products appear progressively as the AI analysis completes

## Technical Architecture

### Frontend (Chrome Extension)
- **Framework**: React 19 with TypeScript, built using WXT framework
- **Styling**: TailwindCSS with custom CSS components
- **Animation**: Motion library for smooth UI transitions
- **Content Scripts**: Inject into YouTube pages to detect video elements and capture frames
- **Background Service Worker**: Handles communication with backend API and manages analysis workflow

### Key Components
- **Video Detection**: Monitors video elements for pause/play state changes
- **Frame Capture**: Uses dom-to-image library to capture video screenshots
- **UI Manager**: Manages sidebar positioning and content display
- **Amazon Integration**: Constructs search URLs and scrapes product results
- **Site Handlers**: Modular system for different video platforms (YouTube, YouTube Shorts)

### Backend Integration
- **API Communication**: RESTful communication with separate Node.js backend server
- **Image Analysis**: Sends base64-encoded screenshots to Google Gemini Vision API
- **Product Parsing**: Receives structured JSON responses with product categories, descriptions, and search terms
- **Amazon Scraping**: Fetches and parses Amazon search results for identified products

## Supported Platforms
- **YouTube**: Standard video player
- **YouTube Shorts**: Mobile-style vertical videos with specialized positioning
- **Planned**: Instagram, TikTok, Netflix, Hulu (mentioned in goals)

## Project Structure
```
├── entrypoints/          # WXT entry points (background, content, popup)
├── src/
│   ├── amazon/          # Amazon search and scraping logic
│   ├── background/      # Service worker and API communication
│   ├── content/         # Content script injection and video detection
│   ├── popup/           # Extension popup interface
│   ├── types/           # TypeScript type definitions
│   └── ui/              # React components and styling
│       ├── components/  # Reusable UI components
│       │   └── sidebar/ # Main sidebar interface
│       └── css/         # Component-specific styles
```

## Development Features
- **Environment Configuration**: Supports local, development, and production server environments
- **Hot Reload**: Development mode with automatic rebuilding
- **Type Safety**: Comprehensive TypeScript coverage
- **Modular Architecture**: Clean separation of concerns with dependency injection
- **Error Handling**: Robust error handling with graceful fallbacks
- **Performance Optimization**: Lazy loading, image compression, and efficient DOM manipulation

## Future Enhancements
- **AI-Powered Visual Ranking**: Planned feature to rank Amazon products by visual similarity to original video frame
- **Multi-platform Support**: Expansion to additional streaming services
- **Enhanced Product Categories**: Support for more product types and better categorization
- **User Preferences**: Customizable settings for search behavior and UI appearance

## Build System
- **WXT Framework**: Modern web extension development framework
- **Vite**: Fast build tool with hot module replacement
- **PostCSS**: CSS processing with TailwindCSS integration
- **ESLint/Prettier**: Code quality and formatting tools

This extension represents a novel approach to e-commerce discovery, bridging the gap between entertainment content and product purchasing through intelligent computer vision and seamless user experience design.