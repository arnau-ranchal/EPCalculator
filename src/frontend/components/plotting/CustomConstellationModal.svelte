<script>
  import { _ } from 'svelte-i18n';
  import { createEventDispatcher, tick, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { customConstellation, useCustomConstellation, updateParam, simulationParams, generateStandardConstellation, customConstellationCounter, saveCustomConstellation } from '../../stores/simulation.js';
  import { get } from 'svelte/store';
  import { shouldShowConstellationTutorial, startSpotlightTutorial, tutorialState, spotlightTutorial } from '../../stores/tutorial.js';
  import { showDocumentation } from '../../stores/documentation.js';
  import CustomConstellation from '../simulation/CustomConstellation.svelte';
  import SpotlightTutorial from '../tutorial/SpotlightTutorial.svelte';
  import DocumentationPanel from '../documentation/DocumentationPanel.svelte';

  export let isOpen = false;
  export let originalModulationType = null;

  const dispatch = createEventDispatcher();

  let localPoints = [];
  let isValid = false;
  let showTable = true;
  let showPlot = true;
  let wasDragging = false;
  let constellationComponent;
  let plotMode = 'cartesian';
  let isTransitioning = false;
  let transitionTimeout = null;

  // Lucky button configuration
  let showLuckyDropdown = false;
  let luckyOptions = {
    randomizeNumPoints: true,
    randomizeMean: true,
    randomizePositions: true,
    numPointsMin: 2,
    numPointsMax: 16
  };

  // Compute current constellation stats for fixed value inputs
  $: currentNumPoints = localPoints.length || 4;
  $: currentMeanReal = localPoints.length > 0
    ? Math.round((localPoints.reduce((s, p) => s + p.real, 0) / localPoints.length) * 100) / 100
    : 0;
  $: currentMeanImag = localPoints.length > 0
    ? Math.round((localPoints.reduce((s, p) => s + p.imag, 0) / localPoints.length) * 100) / 100
    : 0;

  // Fixed values that can be overridden by user (initialized from current)
  let fixedNumPointsOverride = null;
  let fixedMeanRealOverride = null;
  let fixedMeanImagOverride = null;

  // Use override if set, otherwise use current values
  $: fixedNumPoints = fixedNumPointsOverride ?? currentNumPoints;
  $: fixedMeanReal = fixedMeanRealOverride ?? currentMeanReal;
  $: fixedMeanImag = fixedMeanImagOverride ?? currentMeanImag;

  // Track original points when modal opens
  let originalPoints = null;
  let wasOpenLastFrame = false;

  // Naming prompt state
  let showNamingPrompt = false;
  let constellationName = '';
  let pendingSavePoints = null;

  // Initialize local points from store when modal opens
  $: if (isOpen && $customConstellation.points) {
    localPoints = JSON.parse(JSON.stringify($customConstellation.points));
    // Reset overrides when modal opens
    fixedNumPointsOverride = null;
    fixedMeanRealOverride = null;
    fixedMeanImagOverride = null;
  }

  // Capture original points only on the transition from closed to open
  $: {
    if (isOpen && !wasOpenLastFrame) {
      // Modal just opened - capture original points
      originalPoints = JSON.parse(JSON.stringify($customConstellation.points));
    }
    wasOpenLastFrame = isOpen;
  }

  // Trigger constellation tutorial when modal opens for the first time
  $: {
    if (isOpen && $shouldShowConstellationTutorial) {
      triggerTutorial();
    }
  }

  // Track layout transitions to disable scroll-to-row during expansion/collapse
  $: {
    // This block runs when showTable or showPlot changes
    showTable; showPlot;
    if (transitionTimeout) clearTimeout(transitionTimeout);
    isTransitioning = true;
    transitionTimeout = setTimeout(() => {
      isTransitioning = false;
    }, 400); // Match modal transition duration
  }

  async function triggerTutorial() {
    // Mark as seen immediately so it won't trigger again
    tutorialState.markConstellationTutorialSeen();

    await tick(); // Wait for DOM to render

    // Add a slight delay before showing the tutorial
    await new Promise(resolve => setTimeout(resolve, 600));

    const tutorialSteps = [
      {
        selector: '.visualization svg',
        title: $_('tutorial.stepConstellation'),
        description: $_('tutorial.stepConstellationDesc'),
        padding: 12,
        preferredPosition: 'right',
        interactive: true // Allow user to drag points and hover
      },
      {
        selector: '.points-table-container',
        title: $_('tutorial.stepConstellationTable'),
        description: $_('tutorial.stepConstellationTableDesc'),
        padding: 8,
        preferredPosition: 'left',
        interactive: true // Allow user to edit values
      }
    ];
    startSpotlightTutorial(tutorialSteps);
  }

  function handleTutorialComplete() {
    // Tutorial already marked as seen when triggered
  }

  function handleConstellationChange(event) {
    localPoints = event.detail.points;
    isValid = event.detail.isValid;
  }

  function handleDragStart() {
    wasDragging = true;
  }

  function handleDragEnd() {
    // Keep wasDragging true briefly to block the click event that follows mouseup
    setTimeout(() => {
      wasDragging = false;
    }, 100);
  }

  // Check if two constellations are equivalent (same points within tolerance)
  function constellationsMatch(points1, points2) {
    if (points1.length !== points2.length) return false;

    const tolerance = 0.01;

    // Sort both by real then imag for comparison
    const sort = (pts) => [...pts].sort((a, b) => {
      if (Math.abs(a.real - b.real) > tolerance) return a.real - b.real;
      return a.imag - b.imag;
    });

    const sorted1 = sort(points1);
    const sorted2 = sort(points2);

    for (let i = 0; i < sorted1.length; i++) {
      if (Math.abs(sorted1[i].real - sorted2[i].real) > tolerance) return false;
      if (Math.abs(sorted1[i].imag - sorted2[i].imag) > tolerance) return false;
      if (Math.abs(sorted1[i].prob - sorted2[i].prob) > tolerance) return false;
    }
    return true;
  }

  function handleSave() {
    if (!isValid) {
      return;
    }

    const M = localPoints.length;

    // Check if points match the original modulation type's standard constellation
    if (originalModulationType && originalModulationType !== 'Custom') {
      const standardPoints = generateStandardConstellation(M, originalModulationType);
      const match = constellationsMatch(localPoints, standardPoints);
      if (match) {
        // Points match the original type - keep it as standard modulation
        customConstellation.set({
          points: localPoints,
          isValid: true,
          name: null
        });
        updateParam('M', M);
        updateParam('typeModulation', originalModulationType);
        useCustomConstellation.set(false);
        dispatch('save');
        isOpen = false;
        return;
      }
    }

    // Points were modified - check if they match any standard type
    let matchedType = null;

    for (const type of ['PAM', 'PSK', 'QAM']) {
      // Skip QAM if M is not a perfect square
      if (type === 'QAM' && Math.sqrt(M) !== Math.floor(Math.sqrt(M))) continue;

      const standardPoints = generateStandardConstellation(M, type);
      if (constellationsMatch(localPoints, standardPoints)) {
        matchedType = type;
        break;
      }
    }

    if (matchedType) {
      // Matches a standard type - not custom
      customConstellation.set({
        points: localPoints,
        isValid: true,
        name: null
      });
      updateParam('M', M);
      updateParam('typeModulation', matchedType);
      useCustomConstellation.set(false);
      dispatch('save');
      isOpen = false;
    } else {
      // Truly custom constellation - prompt for name
      pendingSavePoints = localPoints;
      // Generate default name
      const counter = get(customConstellationCounter) + 1;
      constellationName = `Custom ${counter}`;
      showNamingPrompt = true;
    }
  }

  function confirmCustomName() {
    if (!pendingSavePoints) return;

    const M = pendingSavePoints.length;
    const finalName = constellationName.trim() || `Custom ${get(customConstellationCounter) + 1}`;

    // Increment counter
    customConstellationCounter.update(n => n + 1);

    // Save to the collection and get ID
    const id = saveCustomConstellation(finalName, pendingSavePoints);

    // Update the store with the name and ID
    customConstellation.set({
      points: pendingSavePoints,
      isValid: true,
      name: finalName,
      id: id
    });

    updateParam('M', M);
    updateParam('typeModulation', 'Custom');
    useCustomConstellation.set(true);

    // Reset naming prompt state
    showNamingPrompt = false;
    pendingSavePoints = null;
    constellationName = '';

    dispatch('save');
    isOpen = false;
  }

  function cancelCustomName() {
    showNamingPrompt = false;
    pendingSavePoints = null;
    constellationName = '';
  }

  function handleNameKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmCustomName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelCustomName();
    }
  }

  function handleCancel() {
    dispatch('cancel');
    isOpen = false;
  }

  function handleBackdropClick(event) {
    // Don't close modal during tutorial
    if (event.target === event.currentTarget && !wasDragging && !$spotlightTutorial.active) {
      handleCancel();
    }
  }

  function handleKeydown(event) {
    // Don't close modal during tutorial
    if (event.key === 'Escape' && !$spotlightTutorial.active) {
      handleCancel();
    }
  }

  // Documentation hover with delay
  let docHoverTimeout = null;
  const DOC_HOVER_DELAY = 1500; // 1.5 seconds

  function handleDocHover(docKey, event) {
    if (docHoverTimeout) clearTimeout(docHoverTimeout);
    const targetElement = event.currentTarget;
    docHoverTimeout = setTimeout(() => {
      if (targetElement) {
        showDocumentation(docKey, targetElement, 'top');
      }
    }, DOC_HOVER_DELAY);
  }

  function handleDocLeave() {
    if (docHoverTimeout) {
      clearTimeout(docHoverTimeout);
      docHoverTimeout = null;
    }
  }

  function handleLuckyClick() {
    // Cancel any pending documentation hover
    if (docHoverTimeout) {
      clearTimeout(docHoverTimeout);
      docHoverTimeout = null;
    }
    constellationComponent?.doGenerateRandom({
      ...luckyOptions,
      fixedNumPoints,
      fixedMeanReal,
      fixedMeanImag
    });
  }

  function toggleLuckyDropdown(event) {
    event.stopPropagation();
    // Cancel any pending documentation hover
    if (docHoverTimeout) {
      clearTimeout(docHoverTimeout);
      docHoverTimeout = null;
    }
    showLuckyDropdown = !showLuckyDropdown;
  }

  function closeLuckyDropdown() {
    showLuckyDropdown = false;
  }

  onDestroy(() => {
    if (docHoverTimeout) clearTimeout(docHoverTimeout);
    if (transitionTimeout) clearTimeout(transitionTimeout);
  });
</script>

<svelte:window on:keydown={handleKeydown} on:click={closeLuckyDropdown} />

<SpotlightTutorial onComplete={handleTutorialComplete} />
<DocumentationPanel />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-container" class:compact={!showTable || !showPlot}>
      <div class="modal-header">
        <h3>{$_('constellation.title')}</h3>
        <div class="header-actions">
          <button type="button" class="close-button" on:click={handleCancel}>
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M1 1L9 9M9 1L1 9"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="modal-body">
        <CustomConstellation
          bind:this={constellationComponent}
          points={localPoints}
          bind:showTable={showTable}
          bind:showPlot={showPlot}
          bind:plotMode={plotMode}
          showHeader={false}
          {isTransitioning}
          on:change={handleConstellationChange}
          on:dragstart={handleDragStart}
          on:dragend={handleDragEnd}
        />
      </div>

      <div class="modal-footer">
        <div class="button-group">
          <button type="button" class="button-secondary" on:click={handleCancel}>
            {$_('dataImport.cancel')}
          </button>
          <div class="lucky-container">
            <button
              type="button"
              class="button-secondary lucky-btn"
              on:click={handleLuckyClick}
              on:mouseenter={(e) => handleDocHover('constellation-lucky', e)}
              on:mouseleave={handleDocLeave}
            >
              <span class="lucky-text">
                {$_('constellation.feelingLucky')}
              </span>
              <span
                class="lucky-gear"
                on:click|stopPropagation={toggleLuckyDropdown}
                title={$_('constellation.luckyOptions') || 'Options'}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                </svg>
              </span>
            </button>
            {#if showLuckyDropdown}
              <div class="lucky-dropdown lucky-dropdown-footer" on:click|stopPropagation>
                <div class="lucky-option-row">
                  <label class="lucky-option">
                    <input type="checkbox" bind:checked={luckyOptions.randomizeNumPoints} />
                    <span>{$_('constellation.randomNumPoints') || 'Random number of points'}</span>
                  </label>
                  {#if luckyOptions.randomizeNumPoints}
                    <div class="lucky-fixed-input range-inputs">
                      <input
                        type="number"
                        min="2"
                        max="49"
                        value={luckyOptions.numPointsMin}
                        on:blur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            luckyOptions.numPointsMin = Math.max(2, Math.min(49, Math.min(val, luckyOptions.numPointsMax - 1)));
                          }
                          e.target.value = luckyOptions.numPointsMin;
                        }}
                        on:click|stopPropagation
                      />
                      <span class="input-label">to</span>
                      <input
                        type="number"
                        min="3"
                        max="50"
                        value={luckyOptions.numPointsMax}
                        on:blur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            luckyOptions.numPointsMax = Math.max(3, Math.min(50, Math.max(val, luckyOptions.numPointsMin + 1)));
                          }
                          e.target.value = luckyOptions.numPointsMax;
                        }}
                        on:click|stopPropagation
                      />
                    </div>
                  {:else}
                    <div class="lucky-fixed-input">
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={fixedNumPoints}
                        on:blur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            fixedNumPointsOverride = Math.max(2, Math.min(50, val));
                          }
                          e.target.value = fixedNumPointsOverride ?? fixedNumPoints;
                        }}
                        on:click|stopPropagation
                      />
                      <span class="input-label">{$_('constellation.points') || 'points'}</span>
                    </div>
                  {/if}
                </div>
                <div class="lucky-option-row">
                  <label class="lucky-option">
                    <input type="checkbox" bind:checked={luckyOptions.randomizeMean} />
                    <span>{$_('constellation.randomMean') || 'Random mean position'}</span>
                  </label>
                  {#if !luckyOptions.randomizeMean}
                    <div class="lucky-fixed-input mean-inputs">
                      <label>
                        <span>Re:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={fixedMeanReal}
                          on:input={(e) => fixedMeanRealOverride = parseFloat(e.target.value) || 0}
                          on:click|stopPropagation
                        />
                      </label>
                      <label>
                        <span>Im:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={fixedMeanImag}
                          on:input={(e) => fixedMeanImagOverride = parseFloat(e.target.value) || 0}
                          on:click|stopPropagation
                        />
                      </label>
                    </div>
                  {/if}
                </div>
                <div class="lucky-option-row">
                  <label class="lucky-option">
                    <input type="checkbox" bind:checked={luckyOptions.randomizePositions} />
                    <span>{$_('constellation.randomPositions') || 'Random point positions'}</span>
                  </label>
                </div>
              </div>
            {/if}
          </div>
          <button
            type="button"
            class:button-secondary={!isValid}
            class:button-primary={isValid}
            class="action-btn"
            title={!isValid ? `⚠ ${$_('constellation.sumWarning')}` : ''}
            on:click={() => {
              if (isValid) {
                handleSave();
              } else {
                constellationComponent?.doNormalize();
              }
            }}
          >
            {isValid ? $_('constellation.use') : $_('constellation.normalize')}
          </button>
        </div>
      </div>
    </div>

    <!-- Naming Prompt Overlay -->
    {#if showNamingPrompt}
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
      <div class="naming-overlay" on:click|stopPropagation>
        <div class="naming-dialog">
          <h4>{$_('constellation.nameTitle') || 'Name Your Constellation'}</h4>
          <p>{$_('constellation.nameDescription') || 'This constellation doesn\'t match any standard type (PAM, PSK, QAM). Give it a name for easy identification.'}</p>
          <input
            type="text"
            bind:value={constellationName}
            placeholder={$_('constellation.namePlaceholder') || 'e.g., My Custom 8-QAM'}
            on:keydown={handleNameKeydown}
            autofocus
          />
          <div class="naming-buttons">
            <button type="button" class="button-secondary" on:click={cancelCustomName}>
              {$_('dataImport.cancel')}
            </button>
            <button type="button" class="button-primary" on:click={confirmCustomName}>
              {$_('constellation.use')}
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--spacing-lg);
    overflow: hidden;
  }

  .modal-container {
    position: relative;
    background: var(--card-background);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    width: 740px;
    max-width: 95vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--border-color);
    transition: width 0.4s ease-out;
    overflow-x: hidden;
  }

  .modal-container.compact {
    width: 390px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    background: var(--surface-color);
    flex-wrap: nowrap;
    min-width: 0;
  }

  .modal-header h3 {
    margin: 0;
    color: var(--primary-color);
    font-weight: 600;
    font-size: 1.25rem;
    white-space: nowrap;
  }

  .close-button {
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 6px 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    min-height: 32px;
    color: var(--text-color);
  }

  .close-button:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
    flex-shrink: 0;
  }

  .lucky-container {
    position: relative;
    display: flex;
  }

  .lucky-btn {
    display: flex;
    align-items: center;
    gap: 0;
    transition: gap 0.15s ease;
  }

  .lucky-btn:hover {
    gap: 6px;
  }

  .lucky-gear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0;
    overflow: hidden;
    opacity: 0;
    transition: width 0.15s ease, opacity 0.15s ease;
    cursor: pointer;
    border-radius: 3px;
    padding: 3px 0;
    margin: -3px 0;
  }

  .lucky-btn:hover .lucky-gear {
    width: 20px;
    padding: 3px;
    opacity: 1;
  }

  .lucky-gear:hover {
    background: var(--hover-background);
  }

  .lucky-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
    min-width: 200px;
    padding: 8px 0;
  }

  .lucky-dropdown-footer {
    top: auto;
    bottom: 100%;
    margin-top: 0;
    margin-bottom: 4px;
  }

  .lucky-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-color);
    transition: background 0.15s;
  }

  .lucky-option:hover {
    background: var(--hover-background);
  }

  .lucky-option input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: var(--primary-color);
  }

  .lucky-option span {
    white-space: nowrap;
  }

  .lucky-option-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .lucky-fixed-input {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 4px 12px 8px 12px;
    font-size: 12px;
  }

  .lucky-fixed-input input[type="number"] {
    width: 60px;
    padding: 4px 6px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--surface-color);
    color: var(--text-color);
    font-size: 12px;
    text-align: center;
    -moz-appearance: textfield;
  }

  .lucky-fixed-input input[type="number"]::-webkit-outer-spin-button,
  .lucky-fixed-input input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .lucky-fixed-input input[type="number"]:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .lucky-fixed-input .input-label {
    color: var(--text-color-secondary);
    font-size: 11px;
  }

  .lucky-fixed-input.range-inputs {
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  .lucky-fixed-input.range-inputs input[type="number"] {
    width: 50px;
  }

  .lucky-fixed-input.mean-inputs {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .lucky-fixed-input.mean-inputs label {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .lucky-fixed-input.mean-inputs span {
    color: var(--text-color-secondary);
    font-size: 11px;
  }

  .lucky-fixed-input.mean-inputs input[type="number"] {
    width: 50px;
  }

  .modal-body {
    padding: 0 var(--spacing-sm);
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: var(--spacing-lg);
    background: var(--surface-color);
    gap: var(--spacing-md);
  }

  .button-group {
    display: flex;
    gap: var(--spacing-sm);
  }

  .button-primary,
  .button-secondary {
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-primary {
    background: var(--primary-color);
    color: white;
    border: none;
  }

  .button-primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--primary-color) 85%, black);
  }

  .button-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-secondary {
    background: var(--surface-color);
    color: var(--text-color);
    border: 1px solid var(--border-color);
  }

  .button-secondary:hover {
    background: var(--hover-background);
    border-color: var(--text-color-secondary);
  }

  /* Naming prompt overlay */
  .naming-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 12px;
  }

  .naming-dialog {
    background: var(--card-background);
    border-radius: 8px;
    padding: var(--spacing-lg);
    max-width: 360px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-color);
  }

  .naming-dialog h4 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--primary-color);
    font-weight: 600;
    font-size: 1.1rem;
  }

  .naming-dialog p {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--text-color-secondary);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .naming-dialog input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--input-background);
    color: var(--text-color);
    font-size: 1rem;
    margin-bottom: var(--spacing-md);
    box-sizing: border-box;
  }

  .naming-dialog input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(200, 16, 46, 0.1);
  }

  .naming-buttons {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-end;
  }

  .naming-buttons button {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    .modal-backdrop {
      padding: var(--spacing-sm);
    }

    .modal-container {
      max-height: 95vh;
    }

    .modal-footer {
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .button-group {
      width: 100%;
      justify-content: stretch;
    }

    .button-group button {
      flex: 1;
    }
  }
</style>
