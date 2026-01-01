<script>
  import { parseDataFile, readFileAsText } from '../../utils/dataParser.js';
  import { importPlotData } from '../../stores/plotting.js';

  export let disabled = false;

  let fileInput;
  let isProcessing = false;
  let errorMessage = '';
  let successMessage = '';

  function handleButtonClick() {
    errorMessage = '';
    successMessage = '';
    fileInput.click();
  }

  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    isProcessing = true;
    errorMessage = '';
    successMessage = '';

    try {
      // Read file content
      const content = await readFileAsText(file);

      // Parse file
      const parsedData = parseDataFile(file.name, content);

      // Import to plotting system
      const plotId = importPlotData(parsedData);

      // Show success message
      successMessage = `✓ Imported ${parsedData.pointCount} data points from ${file.name}`;

      // Clear after 3 seconds
      setTimeout(() => {
        successMessage = '';
      }, 3000);

      // Clear file input so same file can be re-selected
      event.target.value = '';

    } catch (error) {
      console.error('Import error:', error);
      errorMessage = error.message;
    } finally {
      isProcessing = false;
    }
  }
</script>

<div class="data-import">
  <input
    type="file"
    accept=".csv,.json,.txt"
    bind:this={fileInput}
    on:change={handleFileSelect}
    style="display: none;"
  />

  <button
    type="button"
    class="import-button"
    on:click={handleButtonClick}
    disabled={disabled || isProcessing}
  >
    {#if isProcessing}
      <span class="spinner"></span>
      Processing...
    {:else}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 15V6M8 6L5 9M8 6L11 9"/>
        <path d="M2 3H14"/>
      </svg>
      Upload CSV/JSON
    {/if}
  </button>

  {#if errorMessage}
    <div class="message error-message">
      ⚠️ {errorMessage}
    </div>
  {/if}

  {#if successMessage}
    <div class="message success-message">
      {successMessage}
    </div>
  {/if}
</div>

<style>
  .data-import {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .import-button {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 10px 16px;
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-color);
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .import-button:hover:not(:disabled) {
    background: var(--result-background);
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }

  .import-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top: 2px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .message {
    padding: 8px 12px;
    border-radius: 4px;
    font-size: var(--font-size-sm);
    line-height: 1.4;
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }

  .success-message {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
  }
</style>
