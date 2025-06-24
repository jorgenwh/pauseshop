# Migration to WXT

This branch migrates the PauseShop extension from Webpack to WXT (Web Extension Toolkit).

## What Changed

### Build System
- **Replaced Webpack** with WXT for better extension development experience
- **New build outputs**: `.output/chrome-mv3-dev/` (development) and `.output/chrome-mv3/` (production)
- **Automatic manifest generation** from `wxt.config.ts`
- **Hot reloading** during development

### File Structure Changes
- **New `entrypoints/` directory** contains WXT-compatible entry points:
  - `entrypoints/background.ts` - Background script
  - `entrypoints/content/index.ts` - Content script
  - `entrypoints/content/style.css` - Content script CSS
  - `entrypoints/popup/` - Popup files
- **New `public/` directory** for static assets (icons, etc.)
- **New `wxt.config.ts`** replaces manifest.json configuration

### Scripts Changed
- `npm run dev` - Start WXT development server with remote server (default)
- `npm run dev:local` - Start WXT development server with local server
- `npm run dev:remote` - Start WXT development server with remote server
- `npm run build` - Build production extension with remote server (default)
- `npm run build:local` - Build production extension with local server
- `npm run build:remote` - Build production extension with remote server
- `npm run zip` - Create extension zip file for store submission
- `npm run compile` - TypeScript type checking

## Setup Instructions for Team Members

### 1. Checkout and Install
```bash
git checkout wxt-migration  # or whatever you name the branch
npm install
```

### 2. Initial Setup
```bash
npm run postinstall  # This runs 'wxt prepare' to generate .wxt/ directory
```

### 3. Development
```bash
# With remote server (default)
npm run dev

# With local server
npm run dev:local
```
This starts the WXT development server. The extension will be built to `.output/chrome-mv3-dev/`.

### 4. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to your project folder and select `.output/chrome-mv3-dev/`
5. Click "Select Folder"

**For WSL users**: Access the folder via `\\wsl$\Ubuntu\home\username\project\.output\chrome-mv3-dev\`

### 5. Production Build
```bash
# With remote server (default)
npm run build

# With local server
npm run build:local
```
This creates a production build in `.output/chrome-mv3/`.

## Environment Variables

The extension now supports environment variables through WXT:
- `SERVER_ENV=local` - Use local development server
- `SERVER_ENV=remote` - Use production server (default)

Example:
```bash
SERVER_ENV=local npm run dev
```

## Key Benefits

1. **Faster Development**: Hot reloading and better error messages
2. **Modern Tooling**: Built on Vite for faster builds
3. **Better TypeScript Support**: Automatic type generation for extension APIs
4. **Simplified Configuration**: Single config file instead of webpack + manifest
5. **Cross-browser Support**: Easy Firefox builds with `npm run build:firefox`

## Troubleshooting

### Common Issues

1. **"Process is not defined" error**: 
   - This should be fixed in the migration
   - If you see this, check that `wxt.config.ts` has the proper `vite.define` configuration

2. **Extension not loading**:
   - Make sure you're loading from `.output/chrome-mv3-dev/` (dev) or `.output/chrome-mv3/` (prod)
   - Check Chrome's extension console for errors

3. **CSS not loading**:
   - CSS is now bundled automatically via `entrypoints/content/style.css`
   - No manual CSS injection needed

### WSL Users

If you see "Cannot open browser when using WSL", this is normal. Just manually load the extension as described above.

## Migration Notes

- **Legacy files removed**: Cleaned up `webpack.config.js`, old `manifest.json`, and webpack dependencies
- **Dependencies**: Added WXT, removed webpack-related dependencies
- **Assets organized**: Moved demo images and logos to `docs/assets/`
- **No breaking changes**: All existing functionality should work the same
- **Environment handling**: Now uses WXT's environment variable system

## Cleanup Completed

✅ **Removed legacy files:**
- `webpack.config.js`
- `manifest.json` (replaced by `wxt.config.ts`)
- `postcss.config.js`

✅ **Removed webpack dependencies:**
- `copy-webpack-plugin`
- `css-loader`
- `mini-css-extract-plugin`
- `postcss-loader`
- `ts-loader`
- `webpack`
- `webpack-cli`

✅ **Organized assets:**
- Moved demo images and logos to `docs/assets/`

✅ **Updated scripts:**
- `npm run clean` now cleans `.output/` instead of `dist/`