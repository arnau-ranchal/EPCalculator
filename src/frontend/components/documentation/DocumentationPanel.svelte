<script>
  import { _ } from 'svelte-i18n';
  import { documentationPanel, hideDocumentation, documentationContent } from '../../stores/documentation.js';
  import { navigateToLearn } from '../../stores/learn.js';
  import { onMount, onDestroy } from 'svelte';
  import katex from 'katex';
  import 'katex/dist/katex.min.css';

  /**
   * Handle "Learn More" button click.
   * Opens the documentation article in a new tab.
   *
   * @param {string} url - The learnMoreUrl (e.g., '#/learn/concepts/modulation')
   * @param {string} [section] - Optional section ID to scroll to (e.g., 'pam')
   */
  function handleLearnMore(url, section) {
    // Build full URL with optional section query parameter
    // Using ?section=xxx instead of #xxx because hash-based routing can't have two #
    let fullUrl = url;
    if (section) {
      fullUrl += `?section=${section}`;
    }

    // Open in new tab
    window.open(fullUrl, '_blank', 'noopener');

    // Close the documentation panel
    hideDocumentation();
  }

  // Render LaTeX formula to HTML
  function renderLatex(formula) {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: true
      });
    } catch (e) {
      console.warn('KaTeX render error:', e);
      return formula;
    }
  }

  // Render inline LaTeX (for examples)
  function renderInlineLatex(text) {
    try {
      // Replace $...$ patterns with rendered LaTeX
      return text.replace(/\$([^$]+)\$/g, (match, latex) => {
        return katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false
        });
      });
    } catch (e) {
      console.warn('KaTeX inline render error:', e);
      return text;
    }
  }

  let panelStyle = '';
  let panelPosition = 'right';

  // Calculate panel position when target changes
  $: if ($documentationPanel.active && $documentationPanel.targetRect) {
    calculatePosition($documentationPanel.targetRect, $documentationPanel.preferredPosition);
  }

  function calculatePosition(targetRect, preferred) {
    const panelWidth = 340;
    const panelHeight = 280; // approximate
    const margin = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate available space in each direction
    const spaceRight = viewportWidth - targetRect.right;
    const spaceLeft = targetRect.left;
    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    // Determine best position
    let position = preferred;

    if (position === 'right' && spaceRight < panelWidth + margin) {
      position = spaceLeft > spaceRight ? 'left' : 'bottom';
    } else if (position === 'left' && spaceLeft < panelWidth + margin) {
      position = spaceRight > spaceLeft ? 'right' : 'bottom';
    } else if (position === 'bottom' && spaceBelow < panelHeight + margin) {
      position = spaceAbove > spaceBelow ? 'top' : 'right';
    } else if (position === 'top' && spaceAbove < panelHeight + margin) {
      position = spaceBelow > spaceAbove ? 'bottom' : 'right';
    }

    panelPosition = position;

    let left, top;

    switch (position) {
      case 'right':
        left = targetRect.right + margin;
        top = Math.max(margin, Math.min(
          targetRect.top + targetRect.height / 2 - panelHeight / 2,
          viewportHeight - panelHeight - margin
        ));
        panelStyle = `left: ${left}px; top: ${top}px;`;
        break;
      case 'left':
        left = targetRect.left - panelWidth - margin;
        top = Math.max(margin, Math.min(
          targetRect.top + targetRect.height / 2 - panelHeight / 2,
          viewportHeight - panelHeight - margin
        ));
        panelStyle = `left: ${left}px; top: ${top}px;`;
        break;
      case 'bottom':
        left = Math.max(margin, Math.min(
          targetRect.left + targetRect.width / 2 - panelWidth / 2,
          viewportWidth - panelWidth - margin
        ));
        top = targetRect.bottom + margin;
        panelStyle = `left: ${left}px; top: ${top}px;`;
        break;
      case 'top':
        // Use bottom positioning so panel grows upward and bottom edge stays above button
        left = Math.max(margin, Math.min(
          targetRect.left + targetRect.width / 2 - panelWidth / 2,
          viewportWidth - panelWidth - margin
        ));
        const bottom = viewportHeight - targetRect.top + margin;
        panelStyle = `left: ${left}px; bottom: ${bottom}px;`;
        break;
    }
  }

  function handleKeydown(event) {
    if ($documentationPanel.active && event.key === 'Escape') {
      hideDocumentation();
    }
  }

  $: content = $documentationPanel.docKey ? documentationContent[$documentationPanel.docKey] : null;

  // Debug logging
  $: console.log('[DocumentationPanel] Store state:', $documentationPanel);
  $: console.log('[DocumentationPanel] Content:', content);
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $documentationPanel.active && content}
  <!-- Invisible click catcher to close on outside click -->
  <div class="doc-panel-backdrop" on:click={hideDocumentation}></div>
  <div
    class="doc-panel"
    class:position-left={panelPosition === 'left'}
    class:position-top={panelPosition === 'top'}
    style={panelStyle}
  >
      <div class="doc-header">
        <div class="doc-category">{content.category || 'Documentation'}</div>
        <button class="doc-close" on:click={hideDocumentation}>×</button>
      </div>

      <div class="doc-content">
        <h3 class="doc-title">{content.title}</h3>

        <p class="doc-description">{content.description}</p>

        {#if content.theory}
          <div class="doc-section">
            <h4>Theory</h4>
            <p>{content.theory}</p>
          </div>
        {/if}

        {#if content.formula}
          <div class="doc-formula">
            {@html renderLatex(content.formula)}
          </div>
        {/if}

        {#if content.example}
          <div class="doc-section">
            <h4>Examples</h4>
            <p class="doc-example">{@html renderInlineLatex(content.example)}</p>
          </div>
        {/if}

        {#if content.formats}
          <div class="doc-section">
            <h4>Available Formats</h4>
            <ul class="doc-formats">
              {#each content.formats as format}
                <li><strong>{format.name}</strong>: {format.desc}</li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if content.patterns}
          <div class="doc-section">
            <h4>Pattern Types</h4>
            <ul class="doc-patterns">
              {#each content.patterns as pattern}
                <li><strong>{pattern.name}</strong>: {pattern.desc}</li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if content.behavior}
          <div class="doc-behavior">
            <span class="behavior-label">Behavior:</span> {content.behavior}
          </div>
        {/if}
      </div>

      <div class="doc-footer">
        {#if content.learnMoreUrl}
          <button
            class="learn-more-link"
            on:click={() => handleLearnMore(content.learnMoreUrl, content.learnMoreSection)}
          >
            <svg class="learn-more-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <span>Learn More</span>
            <svg class="learn-more-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        {/if}
        <span class="doc-hint">Press Esc or click outside to close</span>
      </div>
  </div>
{/if}

<style>
  .doc-panel-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2499;
    /* Transparent - just catches clicks outside the panel */
  }

  .doc-panel {
    position: fixed;
    width: 340px;
    max-height: 400px;
    background: var(--card-background);
    border-radius: 12px;
    box-shadow: var(--shadow-lg), 0 0 0 1px var(--border-color);
    overflow: hidden;
    animation: docPanelIn 0.2s ease;
    display: flex;
    flex-direction: column;
    z-index: 2500;
  }

  @keyframes docPanelIn {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .doc-panel.position-left {
    animation: docPanelInLeft 0.2s ease;
  }

  @keyframes docPanelInLeft {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .doc-panel.position-top {
    animation: docPanelInTop 0.2s ease;
  }

  @keyframes docPanelInTop {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background: linear-gradient(135deg,
      color-mix(in srgb, var(--primary-color) 15%, var(--surface-color)),
      var(--surface-color)
    );
    border-bottom: 1px solid var(--border-color);
  }

  .doc-category {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--primary-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .doc-close {
    background: none;
    border: none;
    font-size: 1.4em;
    color: var(--text-color-secondary);
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1;
    transition: all 0.15s ease;
  }

  .doc-close:hover {
    background: var(--hover-background);
    color: var(--text-color);
  }

  .doc-content {
    padding: var(--spacing-md);
    overflow-y: auto;
    flex: 1;
  }

  .doc-title {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-color);
  }

  .doc-description {
    margin: 0 0 var(--spacing-md) 0;
    font-size: var(--font-size-sm);
    color: var(--text-color);
    line-height: 1.5;
  }

  .doc-section {
    margin-bottom: var(--spacing-md);
  }

  .doc-section h4 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--primary-color);
  }

  .doc-section p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    line-height: 1.5;
  }

  .doc-formula {
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: var(--spacing-lg) var(--spacing-md);
    margin-bottom: var(--spacing-md);
    text-align: center;
    overflow-x: auto;
  }

  .doc-formula :global(.katex) {
    color: black;
    font-size: 1.4em;
  }

  :global(.dark-mode) .doc-formula :global(.katex) {
    color: var(--text-color);
  }

  .doc-example {
    color: var(--text-color-secondary);
  }

  .doc-example :global(.katex) {
    color: var(--text-color);
  }

  .doc-formats,
  .doc-patterns {
    margin: 0;
    padding-left: var(--spacing-md);
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
  }

  .doc-formats li,
  .doc-patterns li {
    margin-bottom: 4px;
  }

  .doc-formats strong,
  .doc-patterns strong {
    color: var(--text-color);
  }

  .doc-behavior {
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    border-left: 3px solid var(--primary-color);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: 0 6px 6px 0;
    font-size: var(--font-size-sm);
    color: var(--text-color);
  }

  .behavior-label {
    font-weight: 600;
    color: var(--primary-color);
  }

  .doc-footer {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--surface-color);
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .learn-more-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    border: none;
    border-radius: 6px;
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .learn-more-link:hover {
    background: var(--primary-color-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(200, 16, 46, 0.3);
  }

  .learn-more-link:hover .learn-more-arrow {
    transform: translateX(3px);
  }

  .learn-more-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .learn-more-arrow {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    margin-left: auto;
    transition: transform 0.2s ease;
  }

  .doc-hint {
    font-size: var(--font-size-xs);
    color: var(--text-color-secondary);
    opacity: 0.7;
  }

  @media (max-width: 480px) {
    .doc-panel {
      width: calc(100% - 32px);
      max-width: 340px;
      left: 16px !important;
      right: 16px;
    }
  }
</style>
