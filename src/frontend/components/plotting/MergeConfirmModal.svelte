<script>
  import { _ } from 'svelte-i18n';
  import { createEventDispatcher } from 'svelte';

  export let show = false;
  export let existingPlotInfo = null; // { title, xAxis, yAxis, seriesCount }
  export let newPlotInfo = null;      // { title, xAxis, yAxis }

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
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content">
      <div class="modal-header">
        <h3>{$_('plotting.mergeOrNewTitle') || 'Compatible Plot Detected'}</h3>
        <button class="close-btn" on:click={handleCancel}>×</button>
      </div>

      <div class="modal-body">
        <p class="description">
          {$_('plotting.mergeOrNewDescription') || 'A plot with the same axes already exists. Would you like to merge the new data or create a separate figure?'}
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
        <button class="btn btn-primary" on:click={handleNewFigure}>
          {$_('plotting.newFigure') || 'New Figure'}
        </button>
        <button class="btn btn-success" on:click={handleMerge}>
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
  }

  .modal-content {
    background: var(--bg-primary, white);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 450px;
    width: 90%;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    background: var(--bg-secondary, #f5f5f5);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text-primary, #333);
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary, #666);
    padding: 0;
    line-height: 1;
  }

  .close-btn:hover {
    color: var(--text-primary, #333);
  }

  .modal-body {
    padding: 20px;
  }

  .description {
    margin: 0 0 16px 0;
    color: var(--text-primary, #333);
    line-height: 1.5;
  }

  .plot-info {
    padding: 10px 12px;
    border-radius: 6px;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }

  .plot-info.existing {
    background: var(--info-bg, #e3f2fd);
    border: 1px solid var(--info-border, #90caf9);
  }

  .plot-info.new {
    background: var(--success-bg, #e8f5e9);
    border: 1px solid var(--success-border, #a5d6a7);
  }

  .plot-info .label {
    font-weight: 600;
    color: var(--text-secondary, #666);
    margin-right: 6px;
  }

  .plot-info .value {
    color: var(--text-primary, #333);
  }

  .plot-info .series-count {
    color: var(--text-secondary, #666);
    font-size: 0.85rem;
    margin-left: 6px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 20px;
    border-top: 1px solid var(--border-color, #e0e0e0);
    background: var(--bg-secondary, #f5f5f5);
  }

  .btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: background 0.2s, transform 0.1s;
  }

  .btn:hover {
    transform: translateY(-1px);
  }

  .btn:active {
    transform: translateY(0);
  }

  .btn-secondary {
    background: var(--btn-secondary-bg, #e0e0e0);
    color: var(--btn-secondary-text, #333);
  }

  .btn-secondary:hover {
    background: var(--btn-secondary-hover, #d0d0d0);
  }

  .btn-primary {
    background: var(--btn-primary-bg, #1976d2);
    color: white;
  }

  .btn-primary:hover {
    background: var(--btn-primary-hover, #1565c0);
  }

  .btn-success {
    background: var(--btn-success-bg, #388e3c);
    color: white;
  }

  .btn-success:hover {
    background: var(--btn-success-hover, #2e7d32);
  }
</style>
