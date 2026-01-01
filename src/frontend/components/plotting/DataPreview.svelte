<script>
  export let data = null; // { x: [], y: [], xLabel: 'X', yLabel: 'Y' }
  export let maxRows = 10; // Maximum rows to show in preview

  $: previewRows = data ? Math.min(data.x.length, maxRows) : 0;
  $: hasMore = data && data.x.length > maxRows;
  $: totalPoints = data ? data.x.length : 0;
</script>

<div class="preview-container">
  {#if data && data.x && data.y}
    <div class="preview-header">
      <span class="preview-title">Preview</span>
      <span class="preview-count">
        {#if hasMore}
          Showing first {previewRows} of {totalPoints} points
        {:else}
          {totalPoints} {totalPoints === 1 ? 'point' : 'points'}
        {/if}
      </span>
    </div>

    <div class="preview-table-wrapper">
      <table class="preview-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{data.xLabel || 'X'}</th>
            <th>{data.yLabel || 'Y'}</th>
          </tr>
        </thead>
        <tbody>
          {#each Array(previewRows) as _, i}
            <tr>
              <td class="row-number">{i + 1}</td>
              <td class="data-cell">{data.x[i]}</td>
              <td class="data-cell">{data.y[i]}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if hasMore}
      <div class="preview-footer">
        <span class="more-indicator">... and {totalPoints - previewRows} more points</span>
      </div>
    {/if}
  {:else}
    <div class="preview-placeholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
      <p>No data to preview</p>
      <p class="placeholder-hint">Upload, enter, or paste data to see preview</p>
    </div>
  {/if}
</div>

<style>
  .preview-container {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    overflow: hidden;
    background: white;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: var(--result-background);
    border-bottom: 1px solid var(--border-color);
  }

  .preview-title {
    font-weight: 600;
    font-size: var(--font-size-sm);
    color: var(--text-color);
  }

  .preview-count {
    font-size: var(--font-size-sm);
    color: #666;
  }

  .preview-table-wrapper {
    overflow-x: auto;
    max-height: 300px;
    overflow-y: auto;
  }

  .preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .preview-table thead {
    position: sticky;
    top: 0;
    background: white;
    z-index: 1;
  }

  .preview-table th {
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    color: var(--text-color);
    border-bottom: 2px solid var(--border-color);
    background: white;
  }

  .preview-table th:first-child {
    width: 50px;
    text-align: center;
  }

  .preview-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .preview-table tr:last-child td {
    border-bottom: none;
  }

  .preview-table tbody tr:hover {
    background: #fafafa;
  }

  .row-number {
    text-align: center;
    color: #999;
    font-weight: 500;
  }

  .data-cell {
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    color: var(--text-color);
  }

  .preview-footer {
    padding: 8px 12px;
    background: var(--result-background);
    border-top: 1px solid var(--border-color);
    text-align: center;
  }

  .more-indicator {
    font-size: var(--font-size-sm);
    color: #666;
    font-style: italic;
  }

  .preview-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    color: #999;
  }

  .preview-placeholder svg {
    margin-bottom: 16px;
    opacity: 0.3;
  }

  .preview-placeholder p {
    margin: 4px 0;
    font-size: var(--font-size-base);
  }

  .placeholder-hint {
    font-size: var(--font-size-sm);
    color: #bbb;
  }
</style>
