<script>
  import { _ } from 'svelte-i18n';
  import { onMount, onDestroy } from 'svelte';
  import { spotlightTutorial, nextSpotlightStep, endSpotlightTutorial, tutorialState } from '../../stores/tutorial.js';

  // Callback to mark tutorial as seen (defaults to plot tutorial for backwards compatibility)
  export let onComplete = null;

  let spotlightRects = []; // Array of {x, y, width, height} for each highlight
  let tooltipStyle = '';
  let tooltipPosition = 'bottom'; // bottom, top, left, right
  let viewportWidth = 0;
  let viewportHeight = 0;

  // Update spotlight position when step changes
  $: if ($spotlightTutorial.active && $spotlightTutorial.steps.length > 0) {
    updateSpotlight($spotlightTutorial.steps[$spotlightTutorial.currentStep]);
  }

  function updateSpotlight(step) {
    if (!step || (!step.selector && !step.selectors)) return;

    // Support both single selector and array of selectors
    const selectors = step.selectors || [step.selector];
    const elements = [];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        elements.push(element);
      }
    }

    if (elements.length === 0) {
      console.warn(`Tutorial: No elements found for selectors`, selectors);
      // Skip to next step if no elements found
      nextSpotlightStep();
      return;
    }

    const padding = step.padding || 8;
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;

    // Calculate individual rectangles for each element
    spotlightRects = elements.map(el => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - padding,
        y: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
      };
    });

    // Calculate combined bounding box for tooltip positioning
    const rects = elements.map(el => el.getBoundingClientRect());
    const combinedRect = {
      left: Math.min(...rects.map(r => r.left)),
      top: Math.min(...rects.map(r => r.top)),
      right: Math.max(...rects.map(r => r.right)),
      bottom: Math.max(...rects.map(r => r.bottom))
    };
    combinedRect.width = combinedRect.right - combinedRect.left;
    combinedRect.height = combinedRect.bottom - combinedRect.top;

    // Calculate tooltip position based on combined rect
    calculateTooltipPosition(combinedRect, step.preferredPosition);
  }

  function calculateTooltipPosition(rect, preferred) {
    const tooltipWidth = 320;
    const tooltipHeight = 150; // approximate
    const margin = 16;

    // Determine best position
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;

    // Default to preferred, fallback to best available
    let position = preferred || 'bottom';

    if (position === 'bottom' && spaceBelow < tooltipHeight + margin) {
      position = spaceAbove > spaceBelow ? 'top' : 'right';
    } else if (position === 'top' && spaceAbove < tooltipHeight + margin) {
      position = spaceBelow > spaceAbove ? 'bottom' : 'right';
    }

    tooltipPosition = position;

    let left, top;

    switch (position) {
      case 'bottom':
        left = Math.max(margin, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - margin));
        top = rect.bottom + margin;
        break;
      case 'top':
        left = Math.max(margin, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - margin));
        top = rect.top - tooltipHeight - margin;
        break;
      case 'right':
        left = Math.min(rect.right + margin, viewportWidth - tooltipWidth - margin);
        top = Math.max(margin, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, viewportHeight - tooltipHeight - margin));
        break;
      case 'left':
        left = Math.max(margin, rect.left - tooltipWidth - margin);
        top = Math.max(margin, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, viewportHeight - tooltipHeight - margin));
        break;
    }

    tooltipStyle = `left: ${left}px; top: ${top}px;`;
  }

  function handleNext() {
    const isLastStep = $spotlightTutorial.currentStep >= $spotlightTutorial.steps.length - 1;
    if (isLastStep) {
      if (onComplete) {
        onComplete();
      } else {
        // Default to plot tutorial for backwards compatibility
        tutorialState.markPlotTutorialSeen();
      }
    }
    nextSpotlightStep();
  }

  function handleSkip() {
    if (onComplete) {
      onComplete();
    } else {
      // Default to plot tutorial for backwards compatibility
      tutorialState.markPlotTutorialSeen();
    }
    endSpotlightTutorial();
  }

  function handleKeydown(event) {
    if (!$spotlightTutorial.active) return;

    if (event.key === 'Escape') {
      handleSkip();
    } else if (event.key === 'Enter' || event.key === 'ArrowRight' || event.key === ' ') {
      event.preventDefault();
      handleNext();
    }
  }

  // Recalculate on resize
  function handleResize() {
    if ($spotlightTutorial.active && $spotlightTutorial.steps.length > 0) {
      updateSpotlight($spotlightTutorial.steps[$spotlightTutorial.currentStep]);
    }
  }

  onMount(() => {
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
  });

  $: currentStep = $spotlightTutorial.steps[$spotlightTutorial.currentStep];
  $: stepNumber = $spotlightTutorial.currentStep + 1;
  $: totalSteps = $spotlightTutorial.steps.length;
  $: isLastStep = $spotlightTutorial.currentStep >= $spotlightTutorial.steps.length - 1;
  $: isInteractive = currentStep?.interactive || false;
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $spotlightTutorial.active && currentStep}
  <div class="spotlight-overlay">
    <!-- SVG overlay with cutouts for each spotlight -->
    <svg class="spotlight-svg" class:interactive={isInteractive} on:click={isInteractive ? null : handleSkip}>
      <defs>
        <mask id="spotlight-mask">
          <!-- White = visible (dark overlay), Black = hidden (cutout) -->
          <rect x="0" y="0" width="100%" height="100%" fill="white"/>
          {#each spotlightRects as rect}
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx="8"
              fill="black"
            />
          {/each}
        </mask>
      </defs>
      <!-- Dark overlay with mask applied -->
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        class="overlay-rect"
        mask="url(#spotlight-mask)"
      />
    </svg>

    <!-- Border highlights for each spotlight area -->
    {#each spotlightRects as rect}
      <div
        class="spotlight-highlight"
        style="left: {rect.x}px; top: {rect.y}px; width: {rect.width}px; height: {rect.height}px;"
      ></div>
    {/each}

    <!-- Tooltip -->
    <div class="spotlight-tooltip" class:position-top={tooltipPosition === 'top'} style={tooltipStyle}>
      <div class="tooltip-header">
        <span class="tooltip-step">{stepNumber} / {totalSteps}</span>
        <button class="tooltip-skip" on:click={handleSkip}>
          {$_('tutorial.skip')}
        </button>
      </div>

      <div class="tooltip-content">
        <h4>{currentStep.title}</h4>
        <p>{@html currentStep.description}</p>
      </div>

      <div class="tooltip-footer">
        <div class="tooltip-progress">
          {#each $spotlightTutorial.steps as _, i}
            <span class="progress-dot" class:active={i === $spotlightTutorial.currentStep} class:completed={i < $spotlightTutorial.currentStep}></span>
          {/each}
        </div>
        <button class="button-primary tooltip-next" on:click={handleNext}>
          {isLastStep ? $_('tutorial.done') : $_('tutorial.next')}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .spotlight-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3000;
    pointer-events: none;
  }

  .spotlight-svg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: auto;
    cursor: pointer;
  }

  .spotlight-svg.interactive {
    pointer-events: none;
  }

  .overlay-rect {
    fill: rgba(0, 0, 0, 0.75);
  }

  /* Reduce darkness in dark mode since background is already dark */
  :global([data-theme="dark"]) .overlay-rect {
    fill: rgba(0, 0, 0, 0.2);
  }

  .spotlight-highlight {
    position: fixed;
    border-radius: 8px;
    border: 4px solid var(--primary-color);
    pointer-events: none;
    transition: all 0.3s ease;
    z-index: 3001;
    box-sizing: border-box;
  }

  .spotlight-tooltip {
    position: fixed;
    width: 320px;
    background: var(--card-background);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
    pointer-events: auto;
    z-index: 3002;
    animation: tooltipIn 0.3s ease;
  }

  @keyframes tooltipIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .spotlight-tooltip.position-top {
    animation: tooltipInTop 0.3s ease;
  }

  @keyframes tooltipInTop {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    background: var(--surface-color);
    border-radius: 12px 12px 0 0;
  }

  .tooltip-step {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .tooltip-skip {
    font-size: var(--font-size-xs);
    color: var(--text-color-secondary);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .tooltip-skip:hover {
    background: var(--hover-background);
    color: var(--text-color);
  }

  .tooltip-content {
    padding: var(--spacing-md);
  }

  .tooltip-content h4 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-color);
  }

  .tooltip-content p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    line-height: 1.5;
  }

  .tooltip-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    border-top: 1px solid var(--border-color);
    background: var(--surface-color);
    border-radius: 0 0 12px 12px;
  }

  .tooltip-progress {
    display: flex;
    gap: 6px;
  }

  .progress-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border-color);
    transition: all 0.2s ease;
  }

  .progress-dot.active {
    background: var(--primary-color);
    transform: scale(1.2);
  }

  .progress-dot.completed {
    background: color-mix(in srgb, var(--primary-color) 50%, var(--border-color));
  }

  .tooltip-next {
    padding: 8px 16px;
    font-size: var(--font-size-sm);
    min-width: 80px;
  }

  @media (max-width: 480px) {
    .spotlight-tooltip {
      width: calc(100% - 32px);
      left: 16px !important;
    }
  }
</style>
