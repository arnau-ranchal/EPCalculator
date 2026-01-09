<script>
  import { _ } from 'svelte-i18n';
  import { createEventDispatcher } from 'svelte';
  import { simulationParams, updateParam, showAdvancedParams, useCustomConstellation as useCustomConstellationStore, customConstellation, generateStandardConstellation, savedCustomConstellations, loadSavedConstellation } from '../../stores/simulation.js';
  import { docHover } from '../../actions/documentation.js';
  import CustomConstellationModal from './CustomConstellationModal.svelte';

  const dispatch = createEventDispatcher();

  export let onNavigateToParams = () => {};
  export let xVar = 'n';
  export let xVar2 = 'snr';
  export let yVar = 'error_exponent';
  export let plotType = 'lineLog';
  export let distribution = 'uniform';
  export let shapingParam = 0;
  export let isBetaOnX = false;
  export let useCustomConstellation = false;

  // Modal state
  let isModalOpen = false;

  // Track if user was in custom mode before opening modal (for cancel handling)
  let wasCustomBeforeModal = false;

  // Computed select value - reactive to store changes
  // Show the actual typeModulation value (PAM/PSK/QAM/Custom)
  $: selectModulationType = $simulationParams.typeModulation;

  // Display name for custom constellation in dropdown
  $: customDisplayName = $customConstellation.name || $_('paramRef.custom');

  // Select value: use constellation ID if custom with an ID, otherwise modulation type
  $: selectDropdownValue = (useCustomConstellation && $customConstellation.id) ? $customConstellation.id : selectModulationType;

  // Determine which parameters are used in axes
  $: usedParams = new Set([
    xVar,
    (plotType === 'contour' || plotType === 'surface') ? xVar2 : null,
    // yVar is always error_exponent/error_probability/rho, never a base param
  ].filter(Boolean));

  // Helper to check if a parameter should be shown
  $: shouldShow = (param) => !usedParams.has(param);

  // Minimum values for each parameter
  const paramMinValues = {
    M: 2,
    SNR: 0,  // For linear; dB mode allows negative
    R: 0,
    N: 2,
    n: 1,
    threshold: 1e-15,
    shaping_param: 0
  };

  // Valid M values based on modulation type
  // PAM/PSK: any power of 2
  // QAM: only perfect squares (4, 16, 64, 256)
  const allMValues = [2, 4, 8, 16, 32, 64, 128, 256, 512];
  const qamMValues = [4, 16, 64, 256]; // Perfect squares that are powers of 2

  $: validMValues = $simulationParams.typeModulation === 'QAM' ? qamMValues : allMValues;

  // Auto-correct M if switching to QAM with invalid M
  $: if ($simulationParams.typeModulation === 'QAM' && !qamMValues.includes($simulationParams.M)) {
    // Find nearest valid QAM M value
    const nearestValid = qamMValues.reduce((prev, curr) =>
      Math.abs(curr - $simulationParams.M) < Math.abs(prev - $simulationParams.M) ? curr : prev
    );
    updateParam('M', nearestValid);
  }

  function handleInputChange(event) {
    const { name, value, type } = event.target;
    let processedValue = value;

    if (type === 'number') {
      // Check if SNR in dB (allows negative)
      const isSnrDb = name === 'SNR' && $simulationParams.SNRUnit === 'dB';

      // Handle empty input - for number inputs, '-' also appears as empty
      if (value === '') {
        // For SNR in dB, allow empty (user might be typing negative)
        if (isSnrDb) {
          return;
        }
        // Reset to minimum for this parameter
        const minValue = paramMinValues[name] ?? 0;
        event.target.value = minValue;
        processedValue = minValue;
      } else {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
          return;
        }

        // For SNR in linear mode, must be > 0 (or at least >= a small positive value)
        // Negative linear SNR is physically meaningless and will break calculations
        const isSnrLinear = name === 'SNR' && $simulationParams.SNRUnit !== 'dB';
        const minValue = isSnrDb ? -30 : (isSnrLinear ? 0.001 : (paramMinValues[name] ?? 0));

        if (parsed < minValue) {
          event.target.value = minValue;
          processedValue = minValue;
        } else {
          processedValue = parsed;
        }
      }
    } else if (type === 'select-one' && name === 'M') {
      processedValue = parseInt(value, 10);
    } else if (type === 'text' && name === 'threshold') {
      // For threshold, parse scientific notation
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        return; // Don't update if invalid
      }
      const minValue = paramMinValues.threshold;
      if (parsed < minValue) {
        event.target.value = formatThreshold(minValue);
        processedValue = minValue;
      } else {
        processedValue = parsed;
      }
    } else if (type === 'select-one' && name === 'SNRUnit') {
      // When switching SNR unit, convert the value
      const currentSNR = $simulationParams.SNR || 0;
      const currentUnit = $simulationParams.SNRUnit || 'linear';

      if (value === 'dB' && currentUnit === 'linear') {
        // Converting from linear to dB: dB = 10 * log10(linear)
        // Linear must be > 0 for valid conversion
        if (currentSNR > 0) {
          const snrDb = 10 * Math.log10(currentSNR);
          // Round to 1 decimal place for cleaner display
          updateParam('SNR', Math.round(snrDb * 10) / 10);
        } else {
          // If linear is 0 or negative, default to 0 dB
          updateParam('SNR', 0);
        }
      } else if (value === 'linear' && currentUnit === 'dB') {
        // Converting from dB to linear: linear = 10^(dB/10)
        const snrLinear = Math.pow(10, currentSNR / 10);
        // Round to reasonable precision
        updateParam('SNR', Math.round(snrLinear * 1000) / 1000);
      }
    }

    updateParam(name, processedValue);
  }

  function handleModulationTypeChange(event) {
    const value = event.target.value;

    if (value === 'Custom') {
      // Track current state before opening modal
      wasCustomBeforeModal = useCustomConstellation;
      // Set custom mode immediately so edit button appears
      useCustomConstellationStore.set(true);
      // Open the custom constellation modal
      isModalOpen = true;
    } else if (value.startsWith('custom_')) {
      // Load a saved custom constellation by ID
      loadSavedConstellation(value);
      updateParam('M', $customConstellation.points?.length || 4);
      updateParam('typeModulation', 'Custom');
    } else {
      // Switch to standard modulation
      useCustomConstellationStore.set(false);
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

  function handleDistributionChange(event) {
    dispatch('distributionChange', event.target.value);
  }

  function handleShapingParamChange(event) {
    dispatch('shapingParamChange', parseFloat(event.target.value) || 0);
  }

  function handleConstellationSave() {
    // Modal handles setting useCustomConstellation appropriately
  }

  function handleConstellationCancel() {
    // Restore the state before opening the modal
    if (!wasCustomBeforeModal) {
      useCustomConstellationStore.set(false);
    }
  }

  // Track the modulation type when opening the editor
  let openedWithModulationType = null;

  function openConstellationEditor() {
    // Capture state before opening
    openedWithModulationType = $simulationParams.typeModulation;
    wasCustomBeforeModal = useCustomConstellation;

    // If not already in custom mode, generate the standard constellation first
    if (!useCustomConstellation) {
      const points = generateStandardConstellation($simulationParams.M, $simulationParams.typeModulation);
      customConstellation.set({ points, isValid: true });
    }
    isModalOpen = true;
  }

  function toggleAdvanced() {
    showAdvancedParams.update(show => !show);
  }

  // Format threshold value - use scientific notation for small values
  function formatThreshold(value) {
    if (value < 0.001) {
      return value.toExponential();
    }
    return value.toString();
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

  <!-- Constellation Parameters Block -->
  <div class="param-block">
    <div class="param-block-title">{$_('paramRef.constellationParams')}</div>

    {#if shouldShow('M') && !useCustomConstellation}
      <div class="param-row" use:docHover={{ key: 'param-M', position: 'bottom' }}>
        <label for="ref-M">{$_('params.modulationSize')}:</label>
        {#key $simulationParams.typeModulation}
          <select
            id="ref-M"
            name="M"
            value={$simulationParams.M}
            on:change={handleInputChange}
          >
            {#each validMValues as mVal (mVal)}
              <option value={mVal}>{mVal}</option>
            {/each}
          </select>
        {/key}
      </div>
    {/if}

    <div class="param-row modulation-type-row">
      <label for="ref-type">{$_('params.modulationType')}:</label>
      <div class="modulation-with-edit">
        <select
          id="ref-type"
          name="typeModulation"
          value={selectDropdownValue}
          on:change={handleModulationTypeChange}
          title={useCustomConstellation ? `${$customConstellation.points?.length || 0} ${$_('constellation.points')}` : ''}
          use:docHover={{ key: `param-type-${selectModulationType}`, position: 'bottom' }}
        >
          <option value="PAM">PAM</option>
          <option value="PSK">PSK</option>
          <option value="QAM">QAM</option>
          {#if $savedCustomConstellations.length > 0}
            <optgroup label={$_('paramRef.savedConstellations') || 'Saved Constellations'}>
              {#each $savedCustomConstellations as saved (saved.id)}
                <option value={saved.id}>{saved.name} ({saved.points.length})</option>
              {/each}
            </optgroup>
          {/if}
          <option value="Custom">{$_('paramRef.newCustom') || '+ New Custom...'}</option>
        </select>
        <button
          type="button"
          class="edit-constellation-btn"
          on:click={openConstellationEditor}
          title={$_('paramRef.editConstellation')}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.166 2.5L17.5 5.833L6.25 17.083H2.917V13.75L14.166 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Distribution Type (only when not using custom constellation) -->
    {#if !useCustomConstellation}
      <div class="param-row">
        <label for="ref-distribution">{$_('plotting.distribution')}:</label>
        <select
          id="ref-distribution"
          name="distribution"
          value={distribution}
          on:change={handleDistributionChange}
          disabled={isBetaOnX}
        >
          <option value="uniform">{$_('plotting.uniform')}</option>
          <option value="maxwell-boltzmann">{$_('plotting.maxwellBoltzmann')}</option>
        </select>
      </div>
      {#if distribution === 'maxwell-boltzmann' && !isBetaOnX}
        <div class="param-row sub-option">
          <label for="ref-beta">{$_('paramRef.shapingBeta')}:</label>
          <input
            type="number"
            id="ref-beta"
            name="shaping_param"
            value={shapingParam}
            min="0"
            max="10"
            step="0.1"
            on:input={handleShapingParamChange}
          />
        </div>
      {/if}
    {/if}
  </div>

  <!-- Code Parameters Block -->
  {#if shouldShow('SNR') || shouldShow('R') || shouldShow('n')}
    <div class="param-block">
      <div class="param-block-title">{$_('paramRef.codeParams')}</div>

      {#if shouldShow('SNR')}
        <div class="param-row" use:docHover={{ key: 'param-SNR', position: 'bottom' }}>
          <label for="ref-snr">{$_('params.snr')}:</label>
          <div class="snr-with-unit">
            <input
              type="number"
              id="ref-snr"
              name="SNR"
              value={$simulationParams.SNR}
              min={$simulationParams.SNRUnit === 'dB' ? -30 : 0.001}
              max={$simulationParams.SNRUnit === 'dB' ? 30 : 1000}
              step={$simulationParams.SNRUnit === 'dB' ? 0.1 : 0.001}
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
        </div>
      {/if}

      {#if shouldShow('R')}
        <div class="param-row" use:docHover={{ key: 'param-R', position: 'bottom' }}>
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
        <div class="param-row" use:docHover={{ key: 'param-n', position: 'bottom' }}>
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
  {/if}

  <!-- Advanced Parameters Block -->
  {#if $showAdvancedParams && (shouldShow('N') || shouldShow('threshold'))}
    <div class="param-block">
      <div class="param-block-title">{$_('paramRef.advancedParams')}</div>

      {#if shouldShow('N')}
        <div class="param-row">
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
        <div class="param-row">
          <label for="ref-threshold">{$_('params.threshold')}:</label>
          <input
            type="text"
            id="ref-threshold"
            name="threshold"
            value={formatThreshold($simulationParams.threshold)}
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
  originalModulationType={openedWithModulationType}
  on:save={handleConstellationSave}
  on:cancel={handleConstellationCancel}
/>

<style>
  .param-reference {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: var(--spacing-md);
    background: var(--card-background);
    width: 100%;
    box-sizing: border-box;
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

  /* Parameter blocks - matching .variable-block style from PlottingControls */
  .param-block {
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: var(--spacing-sm);
    margin-top: var(--spacing-sm);
    background: var(--surface-color, var(--input-background));
  }

  .param-block:first-of-type {
    margin-top: 0;
  }

  .param-block-title {
    font-weight: 600;
    color: var(--text-color);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-sm);
  }

  /* Parameter rows - matching .form-group.inline style */
  .param-row {
    display: grid;
    grid-template-columns: 70px 1fr;
    align-items: center;
    gap: 8px;
    margin-bottom: var(--spacing-sm);
  }

  .param-row:last-child {
    margin-bottom: 0;
  }

  .param-row.sub-option label {
    padding-left: 10px;
  }

  .param-row label {
    font-weight: 600;
    color: var(--text-color);
    font-size: var(--font-size-sm);
    white-space: nowrap;
  }

  .param-row input,
  .param-row select {
    background: var(--input-background);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 8px 11px;
    font-size: 0.9em;
    transition: border-color var(--transition-fast);
    outline: none;
    width: 100%;
    box-sizing: border-box;
  }

  .param-row input:focus,
  .param-row select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(200, 16, 46, 0.1);
  }

  /* Modulation type row with edit button */
  .modulation-with-edit {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .modulation-with-edit select {
    flex: 1;
  }

  .edit-constellation-btn {
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 7px 8px;
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

  /* SNR with unit selector */
  .snr-with-unit {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .snr-with-unit input {
    flex: 1;
    min-width: 0;
  }

  .snr-with-unit .unit-selector {
    width: auto;
    min-width: 70px;
    flex-shrink: 0;
  }

  /* Advanced toggle button */
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

  @media (max-width: 600px) {
    .param-reference {
      padding: var(--spacing-sm);
    }

    .param-block {
      padding: var(--spacing-xs);
    }

    .param-row {
      grid-template-columns: 60px 1fr;
      gap: 6px;
    }
  }
</style>
