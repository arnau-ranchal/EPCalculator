<script>
  import { createEventDispatcher } from 'svelte';
  import { parseClipboardData } from '../../utils/clipboardParser.js';

  const dispatch = createEventDispatcher();

  let textValue = '';
  let detectedFormat = '';
  let error = '';

  // Update preview when text changes
  $: {
    if (textValue.trim()) {
      try {
        const parsed = parseClipboardData(textValue);
        dispatch('data', parsed);
        detectedFormat = `Detected: ${parsed.delimiter}-separated, ${parsed.pointCount} points`;
        error = '';
      } catch (e) {
        dispatch('data', null);
        error = e.message;
        dispatch('error', e.message);
        detectedFormat = '';
      }
    } else {
      dispatch('data', null);
      error = '';
      detectedFormat = '';
    }
  }

  function clearText() {
    textValue = '';
  }

  function pasteExample() {
    // TSV format (Excel-style)
    textValue = `SNR (dB)\tError Probability
0\t0.5
2\t0.316
4\t0.158
6\t0.079
8\t0.0316
10\t0.01
12\t0.00316
14\t0.001
16\t0.000316
18\t0.0001
20\t0.0000316`;
  }
</script>

<div class="paste-tab">
  <div class="paste-header">
    <div class="header-left">
      <span class="header-title">Paste Data from Clipboard</span>
      <span class="header-hint">Copy from Excel, MATLAB, or any text source</span>
    </div>
    <div class="header-actions">
      <button type="button" class="action-btn" on:click={pasteExample} title="Paste example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        Example
      </button>
      <button type="button" class="action-btn" on:click={clearText} disabled={!textValue} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Clear
      </button>
    </div>
  </div>

  <div class="paste-container">
    <textarea
      bind:value={textValue}
      placeholder="Paste your data here...

Supported formats:
• Tab-separated (from Excel): SNR(dB)    Error
• Comma-separated (CSV):     SNR(dB),Error
• Space-separated (MATLAB):  SNR(dB) Error

With or without headers. First column = X, Second column = Y"
      spellcheck="false"
    ></textarea>
  </div>

  <div class="paste-footer">
    {#if detectedFormat}
      <span class="format-indicator">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {detectedFormat}
      </span>
    {/if}

    {#if error}
      <span class="error-message">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {error}
      </span>
    {/if}
  </div>

  <div class="format-help">
    <h4>Tips:</h4>
    <ul>
      <li><strong>Excel:</strong> Select two columns → Copy (Ctrl+C) → Paste here (Ctrl+V)</li>
      <li><strong>MATLAB:</strong> Copy console output directly → Paste here</li>
      <li><strong>CSV files:</strong> Open in text editor → Copy all → Paste here</li>
      <li><strong>Comments:</strong> Lines starting with # are ignored</li>
    </ul>
  </div>
</div>

<style>
  .paste-tab {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .paste-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .header-title {
    font-weight: 600;
    font-size: var(--font-size-base);
    color: var(--text-color);
  }

  .header-hint {
    font-size: var(--font-size-sm);
    color: #666;
    font-style: italic;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .action-btn:hover:not(:disabled) {
    background: var(--result-background);
    border-color: var(--primary-color);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .paste-container {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    overflow: hidden;
  }

  textarea {
    width: 100%;
    height: 280px;
    padding: 12px;
    border: none;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    font-size: var(--font-size-sm);
    line-height: 1.5;
    resize: vertical;
    background: #fafafa;
  }

  textarea:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
    background: white;
  }

  textarea::placeholder {
    color: #999;
    font-style: italic;
  }

  .paste-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 24px;
    padding: 0 4px;
  }

  .format-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-size-sm);
    color: #16a34a;
    font-weight: 500;
  }

  .format-indicator svg {
    flex-shrink: 0;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-size-sm);
    color: #dc2626;
  }

  .error-message svg {
    flex-shrink: 0;
  }

  .format-help {
    padding: 12px;
    background: #f5f8ff;
    border: 1px solid #e0e7ff;
    border-radius: 6px;
    margin-top: 8px;
  }

  .format-help h4 {
    margin: 0 0 8px 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-color);
  }

  .format-help ul {
    margin: 0;
    padding-left: 20px;
  }

  .format-help li {
    font-size: var(--font-size-sm);
    color: #666;
    line-height: 1.6;
    margin: 4px 0;
  }

  .format-help strong {
    color: var(--text-color);
    font-weight: 600;
  }
</style>
