nimport;
'./styles/global.css';
n;
n; // Service Worker registration for PWA support\nif ('serviceWorker' in navigator && import.meta.env.PROD) {\n  window.addEventListener('load', () => {\n    navigator.serviceWorker.register('/sw.js')\n      .then((registration) => {\n        console.log('✅ SW registered: ', registration)\n      })\n      .catch((registrationError) => {\n        console.log('❌ SW registration failed: ', registrationError)\n      })\n  })\n}\n\n// Initialize the Svelte app\nconst app = new App({\n  target: document.getElementById('app')!\n})\n\n// Hot module replacement for development\nif (import.meta.hot) {\n  import.meta.hot.accept()\n}\n\n// Global error handling\nwindow.addEventListener('error', (event) => {\n  console.error('Global error:', event.error)\n})\n\nwindow.addEventListener('unhandledrejection', (event) => {\n  console.error('Unhandled promise rejection:', event.reason)\n})\n\nexport default app
export {};
