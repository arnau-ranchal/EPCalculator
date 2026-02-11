/**
 * Learn Store - Manages the documentation hub navigation state
 *
 * This store keeps track of:
 * - Which documentation page/article the user is viewing
 * - Navigation history (for back/forward)
 * - Sidebar state (expanded/collapsed sections)
 */

import { writable, derived } from 'svelte/store';

// =============================================================================
// MAIN ROUTE STORE
// =============================================================================

/**
 * The current route within the learn section.
 *
 * Examples:
 *   ''                        → Landing page (/#/learn)
 *   'concepts'                → Concepts index
 *   'concepts/error-exponent' → Specific article
 *   'tutorials/line-plots'    → Tutorial article
 *   'api'                     → API reference page
 *
 * We use writable() to create a store that components can both read and write.
 */
export const learnRoute = writable('');

/**
 * Parse the current route into its parts.
 *
 * This is a "derived" store - it automatically updates when learnRoute changes.
 * Think of it as a computed value that depends on another value.
 *
 * Example: 'concepts/error-exponent' becomes:
 *   { section: 'concepts', article: 'error-exponent', isIndex: false }
 */
export const routeParts = derived(learnRoute, ($route) => {
  const parts = $route.split('/').filter(p => p.length > 0);

  return {
    section: parts[0] || '',           // 'concepts', 'tutorials', 'api', or ''
    article: parts[1] || '',           // 'error-exponent', 'plotting', etc.
    isIndex: parts.length <= 1,        // true if viewing section index, not article
    isHome: parts.length === 0,        // true if on landing page
    full: $route                       // the complete route string
  };
});

// =============================================================================
// SIDEBAR STATE
// =============================================================================

/**
 * Tracks which sidebar sections are expanded.
 *
 * Structure: { 'concepts': true, 'tutorials': false, 'api': true }
 * - true = section is expanded (showing its children)
 * - false = section is collapsed
 */
export const sidebarExpanded = writable({
  concepts: false,
  tutorials: false,
  api: false
});

/**
 * Toggle a sidebar section open/closed.
 *
 * @param {string} section - The section to toggle ('concepts', 'tutorials', 'api')
 */
export function toggleSection(section) {
  sidebarExpanded.update(state => ({
    ...state,
    [section]: !state[section]
  }));
}

/**
 * Expand a specific section (used when navigating from landing page).
 *
 * @param {string} section - The section to expand ('concepts', 'tutorials', 'api')
 */
export function expandSection(section) {
  sidebarExpanded.update(state => ({
    ...state,
    [section]: true
  }));
}

// =============================================================================
// SCROLL TARGET (for deep linking to sections within articles)
// =============================================================================

/**
 * The target section to scroll to after navigation.
 *
 * When navigating from a hover doc to an article section, we:
 * 1. Set this to the section ID (e.g., 'pam')
 * 2. Navigate to the article
 * 3. LearnArticle reads this, scrolls to the element, then clears it
 *
 * This solves the problem that we can't use URL anchors (#section)
 * because # is already used for our routing (#/learn/...).
 */
export const scrollTarget = writable(null);

/**
 * Clear the scroll target after scrolling is complete.
 */
export function clearScrollTarget() {
  scrollTarget.set(null);
}

// =============================================================================
// NAVIGATION FUNCTIONS
// =============================================================================

/**
 * Navigate to a learn page by updating the URL hash and the store.
 *
 * @param {string} route - The route to navigate to (e.g., 'concepts/snr')
 * @param {string} [scrollTo] - Optional section ID to scroll to after navigation
 *
 * @example
 * // Navigate to modulation article
 * navigateToLearn('concepts/modulation');
 *
 * // Navigate to modulation article and scroll to PAM section
 * navigateToLearn('concepts/modulation', 'pam');
 */
export function navigateToLearn(route = '', scrollTo = null) {
  // Set scroll target BEFORE navigation so LearnArticle can pick it up
  if (scrollTo) {
    scrollTarget.set(scrollTo);
  }

  // Update the browser URL
  const hash = route ? `#/learn/${route}` : '#/learn';
  window.location.hash = hash;

  // Update our store (this will trigger all subscribed components to re-render)
  learnRoute.set(route);
}

/**
 * Navigate back to the calculator (exit learn mode).
 */
export function exitLearn() {
  window.location.hash = '';
  learnRoute.set('');
}

/**
 * Navigate to calculator with pre-filled parameters.
 * This is used by "Try it" buttons in documentation.
 *
 * @param {object} params - Parameters to pre-fill (e.g., { SNR: 10, M: 16 })
 */
export function tryInCalculator(params = {}) {
  // Store params for the calculator to pick up
  sessionStorage.setItem('tryItParams', JSON.stringify(params));

  // Navigate to calculator
  window.location.hash = '';
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the learn store from the current URL.
 * This is called when the app loads to sync the store with the URL.
 *
 * Supports section deep-linking via query param: #/learn/concepts/modulation?section=pam
 */
export function initializeFromHash() {
  const hash = window.location.hash;

  // Check if we're in learn mode: hash starts with #/learn
  if (hash.startsWith('#/learn')) {
    // Extract the route part after #/learn/
    let route = hash.replace('#/learn/', '').replace('#/learn', '');

    // Check for section parameter: ?section=xxx
    const sectionMatch = route.match(/\?section=([^&]+)/);
    if (sectionMatch) {
      const section = sectionMatch[1];
      scrollTarget.set(section);
      // Remove the query string from route
      route = route.replace(/\?section=[^&]+/, '');
    }

    learnRoute.set(route);
    return true; // We are in learn mode
  }

  return false; // We are not in learn mode
}

// =============================================================================
// CONTENT INDEX (what articles exist)
// =============================================================================

/**
 * The structure of our documentation.
 * This defines what sections and articles exist.
 */
export const contentIndex = {
  concepts: {
    title: 'Mathematical Concepts',
    icon: '📐',
    articles: [
      { id: 'awgn-channel', title: 'AWGN Channel & SNR' },
      { id: 'modulation', title: 'Modulation Schemes (PAM, PSK, QAM)' },
      { id: 'error-exponent', title: 'Error Probability & Exponents' },
      { id: 'mutual-information', title: 'Mutual Information & Cutoff Rate' },
      { id: 'probabilistic-shaping', title: 'Probabilistic Shaping' },
      { id: 'plot-controls', title: 'Plot Controls & Visualization' },
      { id: 'numerical-methods', title: 'Numerical Methods: Gauss-Hermite Quadrature' },
      { id: 'optimization-algorithms', title: 'Optimization Algorithms' }
    ]
  },
  tutorials: {
    title: 'Tutorials',
    icon: '📖',
    articles: [
      { id: 'getting-started', title: 'Getting Started' },
      { id: 'single-point', title: 'Single Point Computation' },
      { id: 'line-plots', title: 'Line Plots' },
      { id: 'contour-plots', title: 'Contour Plots' },
      { id: '3d-surfaces', title: '3D Surface Plots' },
      { id: 'table-mode', title: 'Table Mode' },
      { id: 'custom-constellation', title: 'Custom Constellations' },
      { id: 'import-data', title: 'Importing Data' },
      { id: 'exporting', title: 'Citing EPCalculator' }
    ]
  },
  api: {
    title: 'API Reference',
    icon: '⚡',
    articles: [
      { id: 'overview', title: 'API Overview' },
      { id: 'parameters', title: 'Parameter Formats' },
      { id: 'standard', title: 'Standard Modulation Endpoint' },
      { id: 'custom', title: 'Custom Constellation Endpoint' },
      { id: 'examples', title: 'Practical Examples' }
    ]
  }
};
