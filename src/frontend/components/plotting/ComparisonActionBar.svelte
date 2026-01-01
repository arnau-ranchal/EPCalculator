<script>
  export let selectedCount = 0;
  export let canCompare = false; // Exactly 2 plots with matching axes
  export let canBenchmark = false; // 2+ plots with matching axes
  export let comparisonErrorMsg = ''; // Error message for comparison validation
  export let benchmarkErrorMsg = ''; // Error message for benchmark validation
  export let showSelectAll = false; // Show "Select All Compatible" button
  export let onComparison = () => {};
  export let onBenchmark = () => {};
  export let onClear = () => {};
  export let onSelectAll = () => {};
</script>

<div class="action-bar" class:visible={selectedCount >= 1}>
  <div class="action-bar-content">
    <div class="selection-info">
      <span class="selection-count">{selectedCount}</span>
      <span class="selection-text">{selectedCount === 1 ? 'plot' : 'plots'} selected</span>
    </div>

    <div class="action-buttons">
      <button
        type="button"
        class="action-btn comparison-btn"
        disabled={!canCompare}
        on:click={onComparison}
        title={comparisonErrorMsg || 'Create 2D difference comparison plot'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M2 12h20"/>
        </svg>
        Comparison
      </button>

      <button
        type="button"
        class="action-btn benchmark-btn"
        disabled={!canBenchmark}
        on:click={onBenchmark}
        title={benchmarkErrorMsg || 'Create 3D overlay benchmark plot'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18"/>
          <path d="M7 16l4-4 4 4 6-6"/>
        </svg>
        Benchmark
      </button>

      {#if showSelectAll}
        <button
          type="button"
          class="action-btn select-all-btn"
          on:click={onSelectAll}
          title="Select all plots with matching axes"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          Select All Compatible
        </button>
      {/if}

      <button
        type="button"
        class="action-btn clear-btn"
        on:click={onClear}
        title="Clear selection"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        Clear
      </button>
    </div>
  </div>
</div>

<style>
  .action-bar {
    position: fixed;
    bottom: -100px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 16px 24px;
    z-index: 1000;
    transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 90vw;
  }

  .action-bar.visible {
    bottom: 32px;
  }

  .action-bar-content {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .selection-info {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding-right: 24px;
    border-right: 1px solid var(--border-color);
  }

  .selection-count {
    font-size: 24px;
    font-weight: 700;
    color: var(--primary-color);
    line-height: 1;
  }

  .selection-text {
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    border: none;
    outline: none;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .comparison-btn {
    background: var(--primary-color);
    color: white;
  }

  .comparison-btn:hover:not(:disabled) {
    background: #a60d26;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(200, 16, 46, 0.3);
  }

  .comparison-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .benchmark-btn {
    background: #0066cc;
    color: white;
  }

  .benchmark-btn:hover:not(:disabled) {
    background: #0052a3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
  }

  .benchmark-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .select-all-btn {
    background: #16a34a;
    color: white;
  }

  .select-all-btn:hover {
    background: #15803d;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
  }

  .select-all-btn:active {
    transform: translateY(0);
  }

  .clear-btn {
    background: #f5f5f5;
    color: #666;
    border: 1px solid var(--border-color);
  }

  .clear-btn:hover {
    background: #e8e8e8;
    color: #333;
  }

  .action-btn svg {
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .action-bar {
      bottom: -120px;
      padding: 12px 16px;
    }

    .action-bar.visible {
      bottom: 16px;
    }

    .action-bar-content {
      flex-direction: column;
      gap: 12px;
    }

    .selection-info {
      padding-right: 0;
      border-right: none;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .action-buttons {
      flex-wrap: wrap;
      justify-content: center;
    }

    .action-btn {
      font-size: 13px;
      padding: 8px 14px;
    }
  }
</style>
