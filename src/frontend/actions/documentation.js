import { showDocumentation, hideDocumentation } from '../stores/documentation.js';

/**
 * Svelte action for hover documentation
 * Usage: <button use:docHover={{ key: 'scale-log-x', position: 'right' }}>
 *
 * Shows documentation panel after hovering for 2 seconds
 */
export function docHover(node, options = {}) {
  let currentKey = options.key;
  let currentPosition = options.position || 'right';
  const delay = options.delay || 1500;  // 1.5 seconds default

  let hoverTimeout = null;
  let isShowing = false;

  function handleMouseEnter() {
    if (!currentKey) {
      console.warn('[docHover] No key provided');
      return;
    }

    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Start new timeout
    hoverTimeout = setTimeout(() => {
      console.log('[docHover] Showing documentation for:', currentKey);
      showDocumentation(currentKey, node, currentPosition);
      isShowing = true;
    }, delay);
  }

  function handleMouseLeave() {
    // Clear timeout if we leave before it fires
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Don't hide on mouse leave - let the panel stay open
    // User will close it by clicking outside or pressing Esc
  }

  function handleClick() {
    // Clear timeout on click (user is interacting, don't show docs)
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Hide documentation when user clicks the button (they're taking action)
    hideDocumentation();
    isShowing = false;
  }

  // Add event listeners
  node.addEventListener('mouseenter', handleMouseEnter);
  node.addEventListener('mouseleave', handleMouseLeave);
  node.addEventListener('click', handleClick);

  return {
    update(newOptions) {
      // Update options dynamically if needed
      currentKey = newOptions.key;
      currentPosition = newOptions.position || 'right';
    },
    destroy() {
      // Cleanup
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      if (isShowing) {
        hideDocumentation();
      }
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
      node.removeEventListener('click', handleClick);
    }
  };
}
