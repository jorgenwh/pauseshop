import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  dev: {
    server: {
      port: 3001,
    },
  },
  vite: () => ({
    define: {
      'process.env.SERVER_ENV': JSON.stringify(process.env.SERVER_ENV || 'remote'),
    },
  }),
  manifest: {
    name: "PauseShop",
    version: "0.1.0",
    version_name: "0.1.0 Beta",
    description: "Discover products from paused videos and find them on Amazon",
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src * data:"
    },
    permissions: [
      "storage"
    ],
    icons: {
      "16": "icons/icon-128-trim-color.png",
      "32": "icons/icon-128-trim-color.png", 
      "64": "icons/icon-128-trim-color.png",
      "128": "icons/icon-128-trim-color.png"
    },
    host_permissions: [
      "https://*.amazon.com/*",
      "https://*.amazon.co.uk/*",
      "https://*.amazon.de/*",
      "https://*.amazon.fr/*",
      "https://*.amazon.it/*",
      "https://*.amazon.es/*",
      "https://*.amazon.ca/*",
      "https://*.amazon.com.au/*",
      "https://*.amazon.co.jp/*"
    ],
    web_accessible_resources: [
      {
        resources: [
          "ui/*",
          "content-scripts/content.css",
          "icons/*",
          "fonts/*"
        ],
        matches: [
          "https://*.youtube.com/*"
        ]
      }
    ],
    action: {
      default_popup: "popup/index.html",
      default_title: "PauseShop"
    }
  }
});