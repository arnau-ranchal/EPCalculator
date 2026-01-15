<script>
  import { _ } from 'svelte-i18n';
  import { createEventDispatcher } from 'svelte';

  export let show = false;
  export let existingPlotInfo = null; // { title, xAxis, yAxis, seriesCount, type }
  export let newPlotInfo = null;      // { title, xAxis, yAxis, type }

  // Determine if this is a table merge based on plot type
  $: isTableMerge = existingPlotInfo?.type === 'rawData' || newPlotInfo?.type === 'rawData';

  const dispatch = createEventDispatcher();

  function handleMerge() {
    dispatch('merge');
    show = false;
  }

  function handleNewFigure() {
    dispatch('newFigure');
    show = false;
  }

  function handleCancel() {
    dispatch('cancel');
    show = false;
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      handleCancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <div class="modal-backdrop" on:click={handleBackdropClick} role="dialog" aria-modal="true">
    <div class="modal-container">
      <div class="modal-header">
        <h3>{isTableMerge
          ? ($_('plotting.mergeOrNewTitleTable') || 'Compatible Table Detected')
          : ($_('plotting.mergeOrNewTitle') || 'Compatible Plot Detected')}</h3>
        <button class="close-button" on:click={handleCancel} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 1l12 12M13 1L1 13"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <p class="description">
          {isTableMerge
            ? ($_('plotting.mergeOrNewDescriptionTable') || 'A table with the same X axis already exists. Would you like to merge the new data or create a separate table?')
            : ($_('plotting.mergeOrNewDescription') || 'A plot with the same axes already exists. Would you like to merge the new data or create a separate figure?')}
        </p>

        {#if existingPlotInfo}
          <div class="plot-info existing">
            <span class="label">{$_('plotting.existingPlot') || 'Existing plot'}:</span>
            <span class="value">{existingPlotInfo.title || `${existingPlotInfo.yAxis} vs ${existingPlotInfo.xAxis}`}</span>
            {#if existingPlotInfo.seriesCount > 1}
              <span class="series-count">({existingPlotInfo.seriesCount} {$_('plotting.series') || 'series'})</span>
            {/if}
          </div>
        {/if}

        {#if newPlotInfo}
          <div class="plot-info new">
            <span class="label">{$_('plotting.newData') || 'New data'}:</span>
            <span class="value">{newPlotInfo.title || `${newPlotInfo.yAxis} vs ${newPlotInfo.xAxis}`}</span>
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={handleCancel}>
          {$_('common.cancel') || 'Cancel'}
        </button>
        <button class="btn btn-secondary" on:click={handleNewFigure}>
          {$_('plotting.newFigure') || 'New Figure'}
        </button>
        <button class="btn btn-primary" on:click={handleMerge}>
          {$_('plotting.mergePlots') || 'Merge'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
  }

  .modal-container {
    background: var(--card-background);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    max-width: 480px;
    width: 90%;
    overflow: hidden;
    border: 1px solid var(--border-color);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    background: var(--surface-color);
  }

  .modal-header h3 {
    margin: 0;
    color: var(--primary-color);
    font-weight: 600;
    font-size: 1.25rem;
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

  .modal-body {
    padding: var(--spacing-lg);
  }

  .description {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--text-color);
    line-height: 1.5;
    font-size: 0.95rem;
  }

  .plot-info {
    padding: 12px 14px;
    border-radius: 8px;
    margin-bottom: 10px;
    font-size: 0.9rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .plot-info.existing {
    background: var(--primary-color-light);
    border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
  }

  /* Force dark text in existing plot info since background is always light */
  .plot-info.existing .label {
    color: #555;
  }

  .plot-info.existing .value {
    color: #222;
  }

  .plot-info.existing .series-count {
    color: #666;
  }

  .plot-info.new {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
  }

  .plot-info .label {
    font-weight: 600;
    color: var(--text-color-secondary);
  }

  .plot-info .value {
    color: var(--text-color);
    font-weight: 500;
  }

  .plot-info .series-count {
    color: var(--text-color-secondary);
    font-size: 0.85rem;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: var(--spacing-lg);
    border-top: 1px solid var(--border-color);
    background: var(--surface-color);
  }

  .btn {
    padding: 10px 18px;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    font-family: inherit;
  }

  .btn:hover {
    transform: translateY(-1px);
  }

  .btn:active {
    transform: translateY(0);
  }

  .btn-secondary {
    background: var(--surface-color);
    color: var(--text-color);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background: var(--hover-background);
    border-color: var(--text-color-secondary);
  }

  .btn-primary {
    background: var(--primary-color);
    color: white;
    border: 1px solid var(--primary-color);
  }

  .btn-primary:hover {
    background: var(--primary-color-dark);
    border-color: var(--primary-color-dark);
  }
</style>
