<script>
  import { _ } from 'svelte-i18n';
  import { simulationParams, updateParam, showAdvancedParams, useCustomConstellation, customConstellation } from '../../stores/simulation.js';
  import { docHover } from '../../actions/documentation.js';
  import CustomConstellationModal from './CustomConstellationModal.svelte';

  export let onNavigateToParams = () => {};
  export let xVar = 'n';
  export let xVar2 = 'snr';
  export let yVar = 'error_exponent';
  export let plotType = 'lineLog';

  // Modal state
  let isModalOpen = false;

  // Track if user was in custom mode before opening modal (for cancel handling)
  let wasCustomBeforeModal = false;

  // Computed select value - reactive to store changes
  $: selectModulationType = $useCustomConstellation ? 'Custom' : $simulationParams.typeModulation;

  // Determine which parameters are used in axes
  $: usedParams = new Set([
    xVar,
    (plotType === 'contour' || plotType === 'surface') ? xVar2 : null,
    // yVar is always error_exponent/error_probability/rho, never a base param
  ].filter(Boolean));

  // Helper to check if a parameter should be shown
  $: shouldShow = (param) => !usedParams.has(param);

  function handleInputChange(event) {
    const { name, value, type } = event.target;
    let processedValue = value;

    if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (type === 'select-one' && name === 'M') {
      processedValue = parseInt(value, 10);
    } else if (type === 'text' && name === 'threshold') {
      // For threshold, parse scientific notation
      const parsed = parseFloat(value);
      processedValue = isNaN(parsed) ? value : parsed;
    } else if (type === 'select-one' && name === 'SNRUnit') {
      // When switching SNR unit, clamp the value if needed
      const currentSNR = $simulationParams.SNR || 0;
      if (value === 'dB' && currentSNR > 30) {
        // Switching to dB with a high linear value - clamp to 30 dB
        updateParam('SNR', 30);
      }
    }

    updateParam(name, processedValue);
  }

  function handleModulationTypeChange(event) {
    const value = event.target.value;

    if (value === 'Custom') {
      // Track current state before opening modal
      wasCustomBeforeModal = $useCustomConstellation;
      // Set custom mode immediately so edit button appears
      useCustomConstellation.set(true);
      // Open the custom constellation modal
      isModalOpen = true;
    } else {
      // Switch to standard modulation
      useCustomConstellation.set(false);
      updateParam('typeModulation', value);

      // Reset M to valid power of 2 if current value is not valid
      const validMValues = [2, 4, 8, 16, 32, 64, 128, 256, 512];
      const currentM = $simulationParams.M;
      if (!validMValues.includes(currentM)) {
        // Find nearest valid M value
        const nearestValid = validMValues.reduce((prev, curr) =>
          Math.abs(curr - currentM) < Math.abs(prev - currentM) ? curr : prev
        );
        updateParam('M', nearestValid);
      }
    }
  }

  function handleConstellationSave() {
    // Custom constellation is saved - modal closes itself
    // useCustomConstellation is already set to true by the modal
  }

  function handleConstellationCancel() {
    // Keep custom mode - user selected Custom from dropdown
    // They can switch back to PAM/PSK/QAM explicitly if they want
    // The edit button will remain visible so they can configure the constellation later
  }

  function openConstellationEditor() {
    isModalOpen = true;
  }

  function toggleAdvanced() {
    showAdvancedParams.update(show => !show);
  }
</script>

<div class="param-reference">
  <div class="param-header">
    <h4>{$_('paramRef.title')}</h4>
    <button
      type="button"
      class="advanced-toggle"
      on:click={toggleAdvanced}
    >
      {$showAdvancedParams ? $_('params.hideAdvanced') : $_('params.showAdvanced')}
    </button>
  </div>

  <div class="param-grid">
    <div class="modulation-row">
      {#if shouldShow('M')}
        <div class="param-group m-selector-group" use:docHover={{ key: 'param-M', position: 'bottom' }}>
          <label for="ref-M">{$_('params.modulationSize')}:</label>
          {#if $useCustomConstellation}
            <input
              type="text"
              id="ref-M"
              value={$simulationParams.M}
              readonly
              class="m-display-readonly"
              title={$_('params.customConstellationHelp')}
            />
          {:else}
            <select
              id="ref-M"
              name="M"
              value={$simulationParams.M}
              on:change={handleInputChange}
              class="m-selector"
            >
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={16}>16</option>
              <option value={32}>32</option>
              <option value={64}>64</option>
              <option value={128}>128</option>
              <option value={256}>256</option>
              <option value={512}>512</option>
            </select>
          {/if}
        </div>
      {/if}

      <div class="param-group modulation-type-group">
        <label for="ref-type">{$_('params.modulationType')}:</label>
        <select
          id="ref-type"
          name="typeModulation"
          value={selectModulationType}
          on:change={handleModulationTypeChange}
          use:docHover={{ key: `param-type-${selectModulationType}`, position: 'bottom' }}
        >
          <option value="PAM">PAM</option>
          <option value="PSK">PSK</option>
          <option value="QAM">QAM</option>
          <option value="Custom">{$_('paramRef.custom')}</option>
        </select>
        {#if $useCustomConstellation}
          <button
            type="button"
            class="edit-constellation-btn"
            on:click={openConstellationEditor}
            title={$_('paramRef.editParams')}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.166 2.5L17.5 5.833L6.25 17.083H2.917V13.75L14.166 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        {/if}
      </div>
    </div>

    {#if shouldShow('SNR')}
      <div class="param-group snr-group" use:docHover={{ key: 'param-SNR', position: 'bottom' }}>
        <label for="ref-snr">{$_('params.snr')}:</label>
        <input
          type="number"
          id="ref-snr"
          name="SNR"
          value={$simulationParams.SNR}
          min="0"
          max={$simulationParams.SNRUnit === 'dB' ? 30 : 1000}
          step="0.1"
          on:input={handleInputChange}
        />
        <select
          name="SNRUnit"
          value={$simulationParams.SNRUnit}
          on:change={handleInputChange}
          class="unit-selector"
        >
          <option value="linear">{$_('params.snrLinear')}</option>
          <option value="dB">{$_('params.snrDb')}</option>
        </select>
      </div>
    {/if}

    {#if shouldShow('R')}
      <div class="param-group rate-group" use:docHover={{ key: 'param-R', position: 'bottom' }}>
        <label for="ref-R">{$_('params.codeRate')}:</label>
        <input
          type="number"
          id="ref-R"
          name="R"
          value={$simulationParams.R}
          min="0"
          max="10"
          step="0.001"
          on:input={handleInputChange}
        />
      </div>
    {/if}

    {#if shouldShow('n')}
      <div class="param-group" use:docHover={{ key: 'param-n', position: 'bottom' }}>
        <label for="ref-n">{$_('params.codeLength')}:</label>
        <input
          type="number"
          id="ref-n"
          name="n"
          value={$simulationParams.n}
          min="1"
          max="1000000"
          step="1"
          on:input={handleInputChange}
        />
      </div>
    {/if}
  </div>

  <!-- Advanced Parameters -->
  {#if $showAdvancedParams}
    <div class="param-grid advanced-grid">
      {#if shouldShow('N')}
        <div class="param-group">
          <label for="ref-N">{$_('params.quadraturePoints')}:</label>
          <input
            type="number"
            id="ref-N"
            name="N"
            value={$simulationParams.N}
            min="2"
            max="40"
            step="1"
            on:input={handleInputChange}
          />
        </div>
      {/if}

      {#if shouldShow('threshold')}
        <div class="param-group">
          <label for="ref-threshold">{$_('params.threshold')}:</label>
          <input
            type="text"
            id="ref-threshold"
            name="threshold"
            value={$simulationParams.threshold}
            placeholder="e.g., 1e-6"
            on:input={handleInputChange}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Custom Constellation Modal -->
<CustomConstellationModal
  bind:isOpen={isModalOpen}
  on:save={handleConstellationSave}
  on:cancel={handleConstellationCancel}
/>

<style>
  .param-reference {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: var(--spacing-md);
    background: var(--card-background);
    margin-bottom: var(--spacing-lg);
  }

  .param-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }

  .param-reference h4 {
    margin: 0;
    color: var(--text-color);
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  .param-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
    align-items: center;
  }

  .param-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .modulation-row {
    display: flex;
    align-items: center;
    gap: 12px;
    grid-column: 1 / -1;
  }

  .modulation-row .m-selector-group {
    flex-shrink: 0;
  }

  .modulation-row .modulation-type-group {
    flex: 1;
    min-width: 0;
  }

  .param-group.snr-group {
    grid-column: span 2;
  }

  .param-group.rate-group {
    grid-column: span 1;
  }

  .param-group label {
    font-weight: 600;
    color: var(--text-color);
    font-size: var(--font-size-sm);
    white-space: nowrap;
    min-width: fit-content;
  }

  .param-group input,
  .param-group select {
    background: var(--input-background);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 0.85em;
    transition: border-color var(--transition-fast);
    outline: none;
    width: 100%;
  }

  .param-group input:focus,
  .param-group select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(200, 16, 46, 0.1);
  }

  .param-group .unit-selector {
    width: auto;
    min-width: 60px;
    flex-shrink: 0;
  }

  .m-selector-group .m-selector {
    width: auto;
    max-width: 70px;
    min-width: 55px;
  }

  .m-display-readonly {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 6px 8px;
    font-weight: 500;
    color: var(--text-color-secondary);
    width: 55px;
    min-width: 55px;
    max-width: 55px;
    text-align: center;
    cursor: not-allowed;
    font-size: 0.85em;
    box-sizing: border-box;
  }

  .modulation-type-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .modulation-type-group select {
    min-width: 80px;
    flex: 1;
  }

  .edit-constellation-btn {
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 5px 6px;
    cursor: pointer;
    color: var(--text-color-secondary);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .edit-constellation-btn:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
  }

  .advanced-toggle {
    background: none;
    border: none;
    padding: 0;
    color: var(--text-color);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    transition: color var(--transition-fast);
    box-shadow: none;
    outline: none;
  }

  .advanced-toggle:hover {
    color: var(--primary-color);
    box-shadow: none;
  }

  .advanced-toggle:focus {
    outline: none;
    box-shadow: none;
  }

  .advanced-toggle:active {
    box-shadow: none;
  }

  .advanced-grid {
    margin-top: var(--spacing-sm);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--border-color);
  }

  @media (max-width: 600px) {
    .param-reference {
      padding: var(--spacing-sm);
    }

    .param-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .param-group {
      gap: 4px;
    }

    .modulation-row {
      flex-wrap: wrap;
      gap: 8px;
    }

    .modulation-row .modulation-type-group {
      flex-basis: 100%;
    }
  }
</style>
