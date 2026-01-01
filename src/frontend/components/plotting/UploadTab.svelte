<script>
  import { createEventDispatcher } from 'svelte';
  import { parseDataFile, readFileAsText } from '../../utils/dataParser.js';

  const dispatch = createEventDispatcher();

  let fileInput;
  let isDragging = false;
  let isProcessing = false;

  function handleDragEnter(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e) {
    e.preventDefault();
    // Only set to false if leaving the drop zone itself
    if (e.target.classList.contains('drop-zone')) {
      isDragging = false;
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  function handleBrowseClick() {
    fileInput.click();
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  }

  async function processFile(file) {
    isProcessing = true;
    dispatch('processing', true);

    try {
      const content = await readFileAsText(file);
      const parsedData = parseDataFile(file.name, content);

      dispatch('data', parsedData);
      dispatch('processing', false);
      isProcessing = false;

      // Reset file input
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      dispatch('error', error.message);
      dispatch('processing', false);
      isProcessing = false;
    }
  }
</script>

<div class="upload-tab">
  <input
    type="file"
    accept=".csv,.json,.txt"
    bind:this={fileInput}
    on:change={handleFileSelect}
    style="display: none;"
  />

  <div
    class="drop-zone"
    class:dragging={isDragging}
    class:processing={isProcessing}
    on:dragenter={handleDragEnter}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    role="button"
    tabindex="0"
    on:click={handleBrowseClick}
    on:keydown={(e) => e.key === 'Enter' && handleBrowseClick()}
  >
    {#if isProcessing}
      <div class="processing-indicator">
        <div class="spinner"></div>
        <p class="processing-text">Processing file...</p>
      </div>
    {:else}
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>

      <h3>Drag & Drop file here</h3>
      <p>or click to browse</p>

      <div class="file-info">
        <p>Supported formats: CSV, JSON, TXT</p>
        <p class="limits">Max size: 5MB • Max points: 10,000</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .upload-tab {
    padding: 16px;
  }

  .drop-zone {
    border: 2px dashed var(--border-color);
    border-radius: 8px;
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-fast);
    background: #fafafa;
    min-height: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .drop-zone:hover {
    border-color: var(--primary-color);
    background: #f5f8ff;
  }

  .drop-zone.dragging {
    border-color: var(--primary-color);
    background: #e8f0ff;
    border-style: solid;
    transform: scale(1.02);
  }

  .drop-zone.processing {
    cursor: default;
    border-color: var(--border-color);
    background: #fafafa;
  }

  .drop-zone svg {
    color: var(--primary-color);
    margin-bottom: 16px;
    opacity: 0.7;
  }

  .drop-zone.dragging svg {
    opacity: 1;
    animation: bounce 0.6s ease-in-out infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .drop-zone h3 {
    margin: 0 0 8px 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-color);
  }

  .drop-zone p {
    margin: 0 0 24px 0;
    color: #666;
    font-size: var(--font-size-base);
  }

  .file-info {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid var(--border-color);
  }

  .file-info p {
    margin: 4px 0;
    font-size: var(--font-size-sm);
    color: #999;
  }

  .limits {
    font-size: var(--font-size-sm);
    color: #bbb;
  }

  .processing-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .processing-text {
    font-size: var(--font-size-base);
    color: var(--text-color);
    font-weight: 500;
    margin: 0;
  }
</style>
