<script>
  import { _ } from 'svelte-i18n';
  import { createEventDispatcher, tick, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { customConstellation, useCustomConstellation, updateParam } from '../../stores/simulation.js';
  import { shouldShowConstellationTutorial, startSpotlightTutorial, tutorialState, spotlightTutorial } from '../../stores/tutorial.js';
  import { showDocumentation } from '../../stores/documentation.js';
  import CustomConstellation from '../simulation/CustomConstellation.svelte';
  import SpotlightTutorial from '../tutorial/SpotlightTutorial.svelte';
  import DocumentationPanel from '../documentation/DocumentationPanel.svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let localPoints = [];
  let isValid = false;
  let showTable = true;
  let showTableButtons = true; // Delayed version of showTable for buttons
  let tableButtonsTimeout = null;
  let wasDragging = false;
  let constellationComponent;
  let plotMode = 'cartesian';

  function toggleTable() {
    if (tableButtonsTimeout) clearTimeout(tableButtonsTimeout);

    if (!showTable) {
      // About to show table - hide buttons first, show them after transition
      showTableButtons = false;
      showTable = true;
      tableButtonsTimeout = setTimeout(() => {
        showTableButtons = true;
      }, 175);
    } else {
      // About to hide table - fade out buttons and collapse simultaneously
      showTableButtons = false;
      showTable = false;
    }
  }

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

  // Initialize local points from store when modal opens
  $: if (isOpen && $customConstellation.points) {
    localPoints = JSON.parse(JSON.stringify($customConstellation.points));
    // Reset overrides when modal opens
    fixedNumPointsOverride = null;
    fixedMeanRealOverride = null;
    fixedMeanImagOverride = null;
  }

  // Trigger constellation tutorial when modal opens for the first time
  // DEBUG: Temporarily reset tutorial state on each modal open to test
  $: {
    console.log('[CustomConstellationModal] isOpen:', isOpen, 'shouldShowConstellationTutorial:', $shouldShowConstellationTutorial);
    if (isOpen) {
      // Temporarily force tutorial to show every time for debugging
      // TODO: Remove this debug override and use: if (isOpen && $shouldShowConstellationTutorial)
      triggerTutorial();
    }
  }

  async function triggerTutorial() {
    console.log('[CustomConstellationModal] triggerTutorial called');
    // Mark as seen immediately so it won't trigger again
    tutorialState.markConstellationTutorialSeen();

    await tick(); // Wait for DOM to render

    // Add a slight delay before showing the tutorial
    await new Promise(resolve => setTimeout(resolve, 600));

    // Debug: Check if elements exist
    console.log('[CustomConstellationModal] Looking for .visualization svg:', document.querySelector('.visualization svg'));
    console.log('[CustomConstellationModal] Looking for .points-table-container:', document.querySelector('.points-table-container'));

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

  function handleSave() {
    if (!isValid) {
      return;
    }

    // Update the store
    customConstellation.set({
      points: localPoints,
      isValid: true
    });
    useCustomConstellation.set(true);
    // Update M to match the number of constellation points
    updateParam('M', localPoints.length);

    dispatch('save');
    isOpen = false;
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
        showDocumentation(docKey, targetElement, 'bottom');
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
    constellationComponent?.doGenerateRandom({
      ...luckyOptions,
      fixedNumPoints,
      fixedMeanReal,
      fixedMeanImag
    });
  }

  function toggleLuckyDropdown(event) {
    event.stopPropagation();
    showLuckyDropdown = !showLuckyDropdown;
  }

  function closeLuckyDropdown() {
    showLuckyDropdown = false;
  }

  onDestroy(() => {
    if (docHoverTimeout) clearTimeout(docHoverTimeout);
  });
</script>

<svelte:window on:keydown={handleKeydown} on:click={closeLuckyDropdown} />

<SpotlightTutorial onComplete={handleTutorialComplete} />
<DocumentationPanel />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-container" class:compact={!showTable}>
      <div class="modal-header">
        <h3>{$_('constellation.title')}</h3>
        <div class="header-actions">
          {#if showTableButtons}
            <div class="lucky-container" in:fade={{ duration: 350 }} out:fade={{ duration: 50 }}>
              <button
                type="button"
                class="lucky-btn"
                on:click={(e) => { handleDocLeave(); handleLuckyClick(); }}
                on:mouseenter={(e) => handleDocHover('constellation-lucky', e)}
                on:mouseleave={handleDocLeave}
              >
                {$_('constellation.feelingLucky')}
              </button>
              <button
                type="button"
                class="lucky-dropdown-toggle"
                on:click={toggleLuckyDropdown}
                title={$_('constellation.luckyOptions') || 'Options'}
              >
                ▾
              </button>
              {#if showLuckyDropdown}
                <div class="lucky-dropdown" on:click|stopPropagation>
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
            <div class="select-container" in:fade={{ duration: 350 }} out:fade={{ duration: 50 }}>
              <select on:change={(e) => { constellationComponent?.doLoadPreset(e.target.value); e.target.value = ''; }}>
                <option value="">{$_('constellation.loadPreset')}</option>
                <option value="bpsk">BPSK (2 {$_('constellation.points')})</option>
                <option value="qpsk">QPSK (4 {$_('constellation.points')})</option>
                <option value="4pam">4-PAM</option>
                <option value="8psk">8-PSK</option>
                <option value="16qam">16-QAM</option>
              </select>
            </div>
          {/if}
          <button
            type="button"
            class="toggle-table-btn"
            on:click={toggleTable}
            on:mouseenter={(e) => handleDocHover('constellation-hide-table', e)}
            on:mouseleave={handleDocLeave}
          >
            {showTable ? $_('constellation.hideTable') : $_('constellation.showTable')}
          </button>
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
          bind:plotMode={plotMode}
          showHeader={false}
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
            {isValid ? $_('constellation.useConstellation') : $_('constellation.normalize')}
          </button>
        </div>
      </div>
    </div>
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
    background: var(--card-background);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--border-color);
    transition: max-width 0.4s ease-out;
    overflow-x: hidden;
  }

  .modal-container.compact {
    max-width: 390px;
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

  .header-actions select {
    background-color: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-color);
    cursor: pointer;
    min-height: 32px;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M3 5l3 3 3-3'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 6px center;
    padding-right: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }

  .header-actions select:hover {
    border-color: var(--text-color-secondary);
    background-color: var(--hover-background);
  }

  .lucky-container {
    position: relative;
    display: flex;
  }

  .select-container {
    display: flex;
  }

  .lucky-btn {
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 4px 0 0 4px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    min-height: 32px;
    white-space: nowrap;
    border-right: none;
  }

  .lucky-btn:hover {
    border-color: var(--text-color-secondary);
    background: var(--hover-background);
  }

  .lucky-dropdown-toggle {
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 0 4px 4px 0;
    padding: 0 6px;
    font-size: 10px;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    min-height: 32px;
  }

  .lucky-dropdown-toggle:hover {
    border-color: var(--text-color-secondary);
    background: var(--hover-background);
    color: var(--text-color);
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

  .toggle-table-btn {
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    white-space: nowrap;
  }

  .toggle-table-btn:hover {
    background: var(--hover-background);
    border-color: var(--text-color-secondary);
  }

  .modal-body {
    padding: 0 var(--spacing-sm);
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
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
