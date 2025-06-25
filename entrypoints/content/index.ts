export default defineContentScript({
  matches: [
    'https://*.youtube.com/*'
  ],
  runAt: 'document_end',
  main() {
    // Import and execute your existing content script logic
    import('../../src/content/main-content');
  },
});