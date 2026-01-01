<script>
  import { createEventDispatcher } from 'svelte';
  import { importPlotData } from '../../stores/plotting.js';
  import { getExampleList, getExampleData } from '../../utils/exampleDatasets.js';

  import UploadTab from './UploadTab.svelte';
  import ManualEntryTab from './ManualEntryTab.svelte';
  import PasteTab from './PasteTab.svelte';
  import DataPreview from './DataPreview.svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  // Tab state
  let activeTab = 'upload'; // 'upload' | 'manual' | 'paste'

  // Data state
  let parsedData = null; // { x: [], y: [], xLabel: 'X', yLabel: 'Y', pointCount: N }
  let error = '';
  let isProcessing = false;

  // Settings state
  let xLabel = '';
  let yLabel = '';
  let title = '';
  let autoDetect = true;

  // Example datasets
  const examples = getExampleList();
  let selectedExample = '';

  // Update labels when data changes
  $: if (parsedData && autoDetect) {
    xLabel = parsedData.xLabel || 'X';
    yLabel = parsedData.yLabel || 'Y';
    title = parsedData.title || '';
  }

  // Valid data check
  $: hasValidData = parsedData && parsedData.x && parsedData.y && parsedData.x.length > 0;
  $: canImport = hasValidData && !error && !isProcessing;

  function switchTab(tab) {
    activeTab = tab;
    // Clear error when switching tabs
    error = '';
  }

  function handleTabData(event) {
    parsedData = event.detail;
    error = '';
  }

  function handleTabError(event) {
    error = event.detail;
  }

  function handleProcessing(event) {
    isProcessing = event.detail;
  }

  function loadExample() {
    if (!selectedExample) return;

    try {
      const exampleData = getExampleData(selectedExample);

      // Set data for preview
      parsedData = {
        x: exampleData.x,
        y: exampleData.y,
        xLabel: exampleData.xLabel,
        yLabel: exampleData.yLabel,
        title: exampleData.title,
        pointCount: exampleData.x.length
      };

      error = '';

      // Reset dropdown
      selectedExample = '';
    } catch (e) {
      error = `Failed to load example: ${e.message}`;
    }
  }

  function handleImport() {
    if (!canImport) return;

    try {
      // Prepare data with user-edited labels
      const finalData = {
        ...parsedData,
        xLabel: xLabel || parsedData.xLabel || 'X',
        yLabel: yLabel || parsedData.yLabel || 'Y',
        title: title || parsedData.title || 'Imported Data'
      };

      // Import using existing function
      importPlotData(finalData);

      // Close modal and dispatch success
      dispatch('success');
      handleClose();
    } catch (e) {
      error = `Import failed: ${e.message}`;
    }
  }

  function handleClose() {
    isOpen = false;
    // Reset state
    activeTab = 'upload';
    parsedData = null;
    error = '';
    xLabel = '';
    yLabel = '';
    title = '';
    selectedExample = '';
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick} role="presentation">
    <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <!-- Header -->
      <div class="modal-header">
        <h2 id="modal-title">Import Plot Data</h2>
        <button type="button" class="close-btn" on:click={handleClose} title="Close (Esc)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          type="button"
          class="tab"
          class:active={activeTab === 'upload'}
          on:click={() => switchTab('upload')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload File
        </button>
        <button
          type="button"
          class="tab"
          class:active={activeTab === 'manual'}
          on:click={() => switchTab('manual')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Manual Entry
        </button>
        <button
          type="button"
          class="tab"
          class:active={activeTab === 'paste'}
          on:click={() => switchTab('paste')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          Paste Data
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        {#if activeTab === 'upload'}
          <UploadTab
            on:data={handleTabData}
            on:error={handleTabError}
            on:processing={handleProcessing}
          />
        {:else if activeTab === 'manual'}
          <ManualEntryTab
            on:data={handleTabData}
            on:error={handleTabError}
          />
        {:else if activeTab === 'paste'}
          <PasteTab
            on:data={handleTabData}
            on:error={handleTabError}
          />
        {/if}
      </div>

      <!-- Preview Section -->
      <div class="preview-section">
        <DataPreview data={parsedData} maxRows={10} />
      </div>

      <!-- Settings Section -->
      <div class="settings-section">
        <div class="settings-row">
          <div class="input-group">
            <label for="x-label">X Axis Label</label>
            <input
              id="x-label"
              type="text"
              bind:value={xLabel}
              placeholder="X"
              disabled={!hasValidData}
            />
          </div>
          <div class="input-group">
            <label for="y-label">Y Axis Label</label>
            <input
              id="y-label"
              type="text"
              bind:value={yLabel}
              placeholder="Y"
              disabled={!hasValidData}
            />
          </div>
        </div>
        <div class="settings-row">
          <div class="input-group full-width">
            <label for="title">Plot Title (optional)</label>
            <input
              id="title"
              type="text"
              bind:value={title}
              placeholder="Imported Data"
              disabled={!hasValidData}
            />
          </div>
        </div>
        <div class="settings-row">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={autoDetect} />
            <span>Auto-detect variable types from labels</span>
          </label>
        </div>
      </div>

      <!-- Error Display -->
      {#if error}
        <div class="error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      {/if}

      <!-- Footer -->
      <div class="modal-footer">
        <div class="footer-left">
          <select bind:value={selectedExample} on:change={loadExample} class="example-select">
            <option value="">Load Example Dataset...</option>
            {#each examples as example}
              <option value={example.id}>{example.name}</option>
            {/each}
          </select>
        </div>
        <div class="footer-actions">
          <button type="button" class="btn btn-secondary" on:click={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            on:click={handleImport}
            disabled={!canImport}
          >
            Import
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
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-container {
    background: white;
    border-radius: 8px;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h2 {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text-color);
  }

  .close-btn {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: #999;
    transition: color var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }

  .close-btn:hover {
    color: var(--text-color);
    background: var(--result-background);
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    background: var(--result-background);
  }

  .tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: var(--font-size-base);
    font-weight: 500;
    color: #666;
    transition: all var(--transition-fast);
  }

  .tab:hover {
    color: var(--text-color);
    background: rgba(59, 130, 246, 0.05);
  }

  .tab.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    background: white;
  }

  .tab svg {
    flex-shrink: 0;
  }

  .tab-content {
    overflow-y: auto;
    max-height: 500px;
  }

  .preview-section {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    background: var(--result-background);
  }

  .settings-section {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .settings-row {
    display: flex;
    gap: 12px;
  }

  .input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .input-group.full-width {
    flex: 1 1 100%;
  }

  .input-group label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-color);
  }

  .input-group input {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: var(--font-size-sm);
    transition: all var(--transition-fast);
  }

  .input-group input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .input-group input:disabled {
    background: #f5f5f5;
    color: #999;
    cursor: not-allowed;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--font-size-sm);
    color: var(--text-color);
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .error-banner {
    margin: 0 24px;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #dc2626;
    font-size: var(--font-size-sm);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .error-banner svg {
    flex-shrink: 0;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    background: var(--result-background);
  }

  .footer-left {
    flex: 1;
  }

  .example-select {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: var(--font-size-sm);
    background: white;
    cursor: pointer;
    max-width: 300px;
  }

  .example-select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .footer-actions {
    display: flex;
    gap: 12px;
  }

  .btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: var(--font-size-base);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    border: none;
  }

  .btn-secondary {
    background: white;
    border: 1px solid var(--border-color);
    color: var(--text-color);
  }

  .btn-secondary:hover {
    background: var(--result-background);
    border-color: var(--primary-color);
  }

  .btn-primary {
    background: var(--primary-color);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .modal-container {
      max-width: 100%;
      max-height: 95vh;
      margin: 10px;
    }

    .tabs {
      flex-direction: column;
    }

    .settings-row {
      flex-direction: column;
    }

    .modal-footer {
      flex-direction: column;
      gap: 12px;
    }

    .footer-left {
      width: 100%;
    }

    .example-select {
      max-width: 100%;
      width: 100%;
    }

    .footer-actions {
      width: 100%;
      justify-content: stretch;
    }

    .btn {
      flex: 1;
    }
  }
</style>
