<script>
  import { createEventDispatcher } from 'svelte';
  import { parseManualData } from '../../utils/clipboardParser.js';

  const dispatch = createEventDispatcher();

  // Initialize with 10 empty rows
  let rows = Array.from({ length: 10 }, () => ({ x: '', y: '' }));
  let error = '';

  // Update preview whenever rows change
  $: {
    try {
      // Filter out completely empty rows
      const filledRows = rows.filter(row => row.x !== '' || row.y !== '');

      if (filledRows.length > 0) {
        const parsed = parseManualData(filledRows);
        dispatch('data', parsed);
        error = '';
      } else {
        dispatch('data', null);
        error = '';
      }
    } catch (e) {
      dispatch('data', null);
      error = e.message;
      dispatch('error', e.message);
    }
  }

  function addRow() {
    rows = [...rows, { x: '', y: '' }];
  }

  function deleteRow(index) {
    if (rows.length > 1) {
      rows = rows.filter((_, i) => i !== index);
    }
  }

  function handleKeyDown(e, index, field) {
    if (e.key === 'Enter') {
      e.preventDefault();

      // If this is the last row and it has data, add a new row
      if (index === rows.length - 1 && (rows[index].x || rows[index].y)) {
        addRow();

        // Focus on the first cell of new row after a short delay
        setTimeout(() => {
          const newIndex = rows.length - 1;
          const input = document.querySelector(`input[data-row="${newIndex}"][data-field="x"]`);
          if (input) input.focus();
        }, 0);
      } else {
        // Move to next row, same field
        const nextInput = document.querySelector(`input[data-row="${index + 1}"][data-field="${field}"]`);
        if (nextInput) nextInput.focus();
      }
    } else if (e.key === 'Tab') {
      // Tab handling is default, but we can enhance it
      if (!e.shiftKey && field === 'y' && index === rows.length - 1) {
        // Tab from last Y cell adds new row
        e.preventDefault();
        addRow();
        setTimeout(() => {
          const newIndex = rows.length - 1;
          const input = document.querySelector(`input[data-row="${newIndex}"][data-field="x"]`);
          if (input) input.focus();
        }, 0);
      }
    }
  }

  function clearAll() {
    rows = Array.from({ length: 10 }, () => ({ x: '', y: '' }));
  }

  function fillExample() {
    // Fill with simple example data
    rows = [
      { x: '0', y: '1.0' },
      { x: '1', y: '0.5' },
      { x: '2', y: '0.25' },
      { x: '3', y: '0.125' },
      { x: '4', y: '0.0625' },
      ...Array.from({ length: 5 }, () => ({ x: '', y: '' }))
    ];
  }
</script>

<div class="manual-entry-tab">
  <div class="table-header">
    <div class="header-left">
      <span class="header-title">Manual Data Entry</span>
      <span class="header-hint">Enter data point by point, press Enter or Tab to navigate</span>
    </div>
    <div class="header-actions">
      <button type="button" class="action-btn" on:click={fillExample} title="Fill with example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        Example
      </button>
      <button type="button" class="action-btn" on:click={clearAll} title="Clear all">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Clear
      </button>
    </div>
  </div>

  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th class="row-num">#</th>
          <th>X</th>
          <th>Y</th>
          <th class="actions-col"></th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row, i}
          <tr>
            <td class="row-num">{i + 1}</td>
            <td>
              <input
                type="text"
                bind:value={row.x}
                data-row={i}
                data-field="x"
                placeholder="x value"
                on:keydown={(e) => handleKeyDown(e, i, 'x')}
              />
            </td>
            <td>
              <input
                type="text"
                bind:value={row.y}
                data-row={i}
                data-field="y"
                placeholder="y value"
                on:keydown={(e) => handleKeyDown(e, i, 'y')}
              />
            </td>
            <td class="actions-col">
              <button
                type="button"
                class="delete-btn"
                on:click={() => deleteRow(i)}
                disabled={rows.length === 1}
                title="Delete row"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="table-footer">
    <button type="button" class="add-row-btn" on:click={addRow}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Add Row
    </button>

    {#if error}
      <span class="error-message">{error}</span>
    {/if}
  </div>
</div>

<style>
  .manual-entry-tab {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .table-header {
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

  .action-btn:hover {
    background: var(--result-background);
    border-color: var(--primary-color);
  }

  .table-container {
    overflow: auto;
    max-height: 400px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .data-table thead {
    position: sticky;
    top: 0;
    background: var(--result-background);
    z-index: 1;
  }

  .data-table th {
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid var(--border-color);
    color: var(--text-color);
  }

  .data-table td {
    padding: 4px 8px;
    border-bottom: 1px solid #f0f0f0;
  }

  .data-table tbody tr:hover {
    background: #fafafa;
  }

  .row-num {
    width: 50px;
    text-align: center;
    color: #999;
    font-weight: 500;
  }

  .actions-col {
    width: 50px;
    text-align: center;
  }

  .data-table input {
    width: 100%;
    padding: 8px;
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: var(--font-size-sm);
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    transition: all var(--transition-fast);
  }

  .data-table input:hover {
    border-color: var(--border-color);
    background: white;
  }

  .data-table input:focus {
    outline: none;
    border-color: var(--primary-color);
    background: white;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .delete-btn {
    padding: 4px;
    background: none;
    border: none;
    cursor: pointer;
    color: #999;
    transition: color var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delete-btn:hover:not(:disabled) {
    color: #dc2626;
  }

  .delete-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
  }

  .add-row-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--primary-color);
  }

  .add-row-btn:hover {
    background: var(--result-background);
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }

  .error-message {
    color: #dc2626;
    font-size: var(--font-size-sm);
  }
</style>
