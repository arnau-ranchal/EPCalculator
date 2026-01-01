// EPCalculator v2 Frontend Entry Point
import { setupI18n } from './i18n/i18n.js';
import App from './App.svelte';

// Initialize i18n BEFORE creating the App
setupI18n();

// Initialize the Svelte app
const app = new App({
  target: document.body,
});

// Export the app instance for HMR (Hot Module Replacement)
export default app;

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  // You could also send this to a logging service
});

// Handle global errors
window.addEventListener('error', event => {
  console.error('Global error:', event.error);
  // You could also send this to a logging service
});