<script>
  import { _ } from 'svelte-i18n';
  import { plotParams, plotValidation, updatePlotParam } from '../../stores/plotting.js';
  import { simulationParams, useCustomConstellation } from '../../stores/simulation.js';
  import { currentColorTheme } from '../../stores/theme.js';
  import DataImportModal from './DataImportModal.svelte';
  import ParameterReference from './ParameterReference.svelte';

  export let onPlot = () => {};
  export let disabled = false;
  export let onNavigateToParams = () => {};

  // Modal state
  let isModalOpen = false;

  function openModal() {
    isModalOpen = true;
  }

  function handleImportSuccess() {
    isModalOpen = false;
  }

  function handleInputChange(event) {
    const { name, value, type } = event.target;
    let processedValue = value;

    if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (name === 'xRange' || name === 'xRange2') {
      // Handle range inputs
      const rangeValues = value.split(',').map(v => parseFloat(v.trim()) || 0);
      processedValue = rangeValues.length === 2 ? rangeValues : [0, 100];
    } else if (name === 'snrUnit') {
      // When switching SNR unit, clamp range values if needed
      if (value === 'linear') {
        // Switching to linear - clamp negative values to 0
        const xRange = $plotParams.xRange;
        const xRange2 = $plotParams.xRange2;

        if ($plotParams.xVar === 'SNR' && (xRange[0] < 0 || xRange[1] < 0)) {
          updatePlotParam('xRange', [Math.max(0, xRange[0]), Math.max(0, xRange[1])]);
        }
        if ($plotParams.xVar2 === 'SNR' && (xRange2[0] < 0 || xRange2[1] < 0)) {
          updatePlotParam('xRange2', [Math.max(0, xRange2[0]), Math.max(0, xRange2[1])]);
        }
      }
    }

    updatePlotParam(name, processedValue);
  }

  // Minimum values for each variable
  const variableMinValues = {
    M: 2,
    SNR: 0,  // For linear; dB mode allows negative
    R: 0,
    N: 2,
    n: 1,
    threshold: 1e-15,
    shaping_param: 0
  };

  function handleRangeInput(rangeName, index, event) {
    const inputValue = event.target.value;
    const inputElement = event.target;

    // Determine which variable this range is for
    const xVar = rangeName === 'xRange' ? $plotParams.xVar : $plotParams.xVar2;

    // Check if this is SNR in dB mode (allows negative values)
    const isSnrDb = xVar === 'SNR' && $plotParams.snrUnit === 'dB';

    // Get minimum value for this variable
    const minValue = isSnrDb ? -Infinity : (variableMinValues[xVar] ?? 0);

    // Allow empty input while typing
    if (inputValue === '') {
      return;
    }

    // Handle partial negative input
    if (inputValue === '-') {
      if (isSnrDb) {
        return; // Allow typing negative for SNR dB
      } else {
        // Don't allow negative for other quantities - reset to min
        inputElement.value = minValue;
        return;
      }
    }

    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      return; // Invalid input, don't update
    }

    // Reject values below minimum and reset the input to min
    if (value < minValue) {
      inputElement.value = minValue;
      const currentRange = $plotParams[rangeName];
      const newRange = [...currentRange];
      newRange[index] = minValue;
      updatePlotParam(rangeName, newRange);
      return;
    }

    const currentRange = $plotParams[rangeName];
    const newRange = [...currentRange];
    newRange[index] = value;
    updatePlotParam(rangeName, newRange);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if ($plotValidation.isValid && !disabled) {
      onPlot($plotParams, $simulationParams);
    }
  }

  function resetPlotParams() {
    updatePlotParam('plotType', 'lineLog');
    updatePlotParam('yVar', 'error_exponent');
    updatePlotParam('xVar', 'n');
    updatePlotParam('xVar2', 'snr');
    updatePlotParam('xRange', [1, 100]);
    updatePlotParam('xRange2', [1, 10]);
    updatePlotParam('points', 5);
    updatePlotParam('points2', 5);
    updatePlotParam('contourMode', '2d');
    updatePlotParam('contourLevels', 10);
    updatePlotParam('lineType', 'solid');
    updatePlotParam('lineColor', 'emphasis');
  }

  // Reactive variable options using translation keys
  // Code length (n) only makes sense for Error Probability plots (Pe = 2^(-n*E))
  // M is not available when using custom constellation
  $: variableOptions = [
    ...($useCustomConstellation ? [] : [{ value: 'M', label: $_('plotting.modulationSize'), acronym: 'M' }]),
    { value: 'SNR', label: $_('plotting.snr'), acronym: 'SNR' },
    { value: 'R', label: $_('plotting.rate'), acronym: 'R' },
    { value: 'N', label: $_('plotting.quadrature'), acronym: 'N' },
    // Only include n when Y-axis is error_probability
    ...($plotParams.yVar === 'error_probability' ? [{ value: 'n', label: $_('plotting.codeLength'), acronym: 'n' }] : []),
    { value: 'threshold', label: $_('plotting.threshold') + ' (τ)', acronym: 'τ' },
    { value: 'shaping_param', label: $_('plotting.shapingParam'), acronym: 'β' }
  ];

  // Check if n is on any axis (to enforce integer values)
  $: isNOnAxis = $plotParams.xVar === 'n' || (($plotParams.plotType === 'contour' || $plotParams.plotType === 'surface') && $plotParams.xVar2 === 'n');

  // Auto-reset xVar if n is selected but yVar is not error_probability
  $: if ($plotParams.xVar === 'n' && $plotParams.yVar !== 'error_probability') {
    updatePlotParam('xVar', 'SNR');
  }
  $: if (($plotParams.plotType === 'contour' || $plotParams.plotType === 'surface') && $plotParams.xVar2 === 'n' && $plotParams.yVar !== 'error_probability') {
    updatePlotParam('xVar2', 'R');
  }

  // Auto-reset xVar if M is selected but custom constellation is enabled
  $: if ($plotParams.xVar === 'M' && $useCustomConstellation) {
    updatePlotParam('xVar', 'SNR');
  }
  $: if (($plotParams.plotType === 'contour' || $plotParams.plotType === 'surface') && $plotParams.xVar2 === 'M' && $useCustomConstellation) {
    updatePlotParam('xVar2', 'R');
  }

  // Ensure X1 and X2 are different for contour/surface plots
  $: if (($plotParams.plotType === 'contour' || $plotParams.plotType === 'surface') && $plotParams.xVar === $plotParams.xVar2) {
    // If X1 and X2 are the same, change X2 to a different variable
    const alternatives = ['R', 'SNR', 'n', 'M', 'N'].filter(v => v !== $plotParams.xVar);
    // For n, only use if yVar is error_probability
    const validAlternatives = alternatives.filter(v => v !== 'n' || $plotParams.yVar === 'error_probability');
    if (validAlternatives.length > 0) {
      updatePlotParam('xVar2', validAlternatives[0]);
    }
  }

  // Reactive statement to detect when beta is selected as X variable
  $: isBetaOnX = $plotParams.xVar === 'shaping_param' ||
                 (($plotParams.plotType === 'contour' || $plotParams.plotType === 'surface') && $plotParams.xVar2 === 'shaping_param');

  // Auto-switch to Maxwell-Boltzmann distribution when beta is selected as X variable
  $: if (isBetaOnX && $plotParams.distribution !== 'maxwell-boltzmann') {
    updatePlotParam('distribution', 'maxwell-boltzmann');
  }

  $: yVariableOptions = [
    { value: 'error_exponent', label: $_('plotting.errorExponent') },
    { value: 'error_probability', label: $_('plotting.errorProbability') },
    { value: 'rho', label: $_('plotting.optimalRho') },
    { value: 'mutual_information', label: $_('plotting.mutualInformation') },
    { value: 'cutoff_rate', label: $_('plotting.cutoffRate') },
    { value: 'critical_rate', label: $_('plotting.criticalRate') }
  ];

  $: colorOptions = [
    { value: 'emphasis', label: $currentColorTheme?.name || $_('plotting.emphasis') },
    { value: 'steelblue', label: $_('plotting.steelBlue') },
    { value: '#2E8B57', label: $_('plotting.seaGreen') },
    { value: '#FF6347', label: $_('plotting.tomato') },
    { value: '#4169E1', label: $_('plotting.royalBlue') },
    { value: '#8A2BE2', label: $_('plotting.blueViolet') }
  ];

  // Helper to get variable acronym from value
  function getVarAcronym(varValue) {
    const option = variableOptions.find(opt => opt.value === varValue);
    return option ? option.acronym : varValue;
  }

  // Reactive acronyms for range/points labels
  $: xVarAcronym = getVarAcronym($plotParams.xVar);
  $: xVar2Acronym = getVarAcronym($plotParams.xVar2);
</script>

<div class="plotting-controls">
  <div class="controls-header">
    <h3>{$_('plotting.title')}</h3>
    <div class="header-actions">
      <button type="button" class="button-secondary" on:click={resetPlotParams}>
        {$_('plotting.reset')}
      </button>
    </div>
  </div>

  <form on:submit={handleSubmit} class="controls-form">
    <!-- Output Type Selection -->
    <div class="form-section compact-section">
      <h4>{$_('plotting.outputType')}</h4>
      <select
        id="plotType"
        name="plotType"
        value={$plotParams.plotType}
        on:change={handleInputChange}
      >
        <option value="lineLog">{$_('plotting.linePlot')}</option>
        <option value="contour">{$_('plotting.contourPlot')}</option>
        <option value="surface">{$_('plotting.surface3d')}</option>
        <option value="rawData">{$_('plotting.rawData')}</option>
      </select>
    </div>

    <!-- Variables with Range & Resolution merged -->
    <div class="form-section">
      <h4>{$_('plotting.variables')}</h4>

      <!-- Y-Axis Selection (output variable) -->
      {#if $plotParams.plotType !== 'rawData'}
        <div class="variable-block">
          <div class="form-group inline">
            <label for="yVar">{$_('plotting.yAxis')}:</label>
            <select
              id="yVar"
              name="yVar"
              value={$plotParams.yVar}
              on:change={handleInputChange}
            >
              {#each yVariableOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}

      <!-- X-Axis Variable with its Range and Points -->
      <div class="variable-block">
        <div class="form-group inline">
          <label for="xVar">{($plotParams.plotType === 'contour' || $plotParams.plotType === 'surface') ? $_('plotting.x1Axis') : $_('plotting.xAxis')}:</label>
          <select
            id="xVar"
            name="xVar"
            value={$plotParams.xVar}
            on:change={handleInputChange}
          >
            {#each variableOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <!-- SNR Unit Selector (appears when SNR is selected for X) -->
        {#if $plotParams.xVar === 'SNR'}
          <div class="form-group inline sub-option">
            <label for="snrUnit">{$_('plotting.unit')}:</label>
            <select
              id="snrUnit"
              name="snrUnit"
              value={$plotParams.snrUnit || 'dB'}
              on:change={handleInputChange}
              title={$_('plotting.affectsDistribution')}
            >
              <option value="dB">{$_('plotting.dbLogSpaced')}</option>
              <option value="linear">{$_('plotting.linear')}</option>
            </select>
          </div>
        {/if}

        <div class="form-group inline sub-option">
          <label>{$_('plotting.rangeLabel')}:</label>
          <div class="range-inputs">
            <input
              type="number"
              placeholder={$_('plotting.min')}
              value={$plotParams.xRange[0]}
              on:input={(e) => handleRangeInput('xRange', 0, e)}
              step={$plotParams.xVar === 'n' ? '1' : 'any'}
            />
            <span class="range-separator">{$_('plotting.to')}</span>
            <input
              type="number"
              placeholder={$_('plotting.max')}
              value={$plotParams.xRange[1]}
              on:input={(e) => handleRangeInput('xRange', 1, e)}
              step={$plotParams.xVar === 'n' ? '1' : 'any'}
            />
          </div>
          {#if $plotValidation.errors.xRange}
            <span class="error-message">{$_($plotValidation.errors.xRange)}</span>
          {/if}
        </div>

        <div class="form-group inline sub-option">
          <label for="points">
            {#if $plotParams.plotType === 'contour'}
              {$_('plotting.levels')}:
            {:else}
              {$_('plotting.pointsLabel')}:
            {/if}
          </label>
          <input
            type="number"
            id="points"
            name="points"
            value={$plotParams.points}
            min="1"
            max="101"
            step="1"
            on:input={handleInputChange}
            class:error={$plotValidation.errors.points}
          />
          {#if $plotValidation.errors.points}
            <span class="error-message">{$_($plotValidation.errors.points)}</span>
          {/if}
        </div>
      </div>

      <!-- X2-Axis Variable with its Range and Points (for contour/surface) -->
      {#if $plotParams.plotType === 'contour' || $plotParams.plotType === 'surface'}
        <div class="variable-block">
          <div class="form-group inline">
            <label for="xVar2">{$_('plotting.x2Axis')}:</label>
            <select
              id="xVar2"
              name="xVar2"
              value={$plotParams.xVar2}
              on:change={handleInputChange}
            >
              {#each variableOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>

          <!-- SNR Unit info for X2 (uses same unit as X) -->
          {#if $plotParams.xVar2 === 'SNR' && $plotParams.xVar !== 'SNR'}
            <div class="form-group inline sub-option">
              <label for="snrUnit2">{$_('plotting.unit')}:</label>
              <select
                id="snrUnit2"
                name="snrUnit"
                value={$plotParams.snrUnit || 'dB'}
                on:change={handleInputChange}
                title={$_('plotting.affectsDistribution')}
              >
                <option value="dB">{$_('plotting.dbLogSpaced')}</option>
                <option value="linear">{$_('plotting.linear')}</option>
              </select>
            </div>
          {/if}

          <div class="form-group inline sub-option">
            <label>{$_('plotting.rangeLabel')}:</label>
            <div class="range-inputs">
              <input
                type="number"
                placeholder={$_('plotting.min')}
                value={$plotParams.xRange2[0]}
                on:input={(e) => handleRangeInput('xRange2', 0, e)}
                step={$plotParams.xVar2 === 'n' ? '1' : 'any'}
              />
              <span class="range-separator">{$_('plotting.to')}</span>
              <input
                type="number"
                placeholder={$_('plotting.max')}
                value={$plotParams.xRange2[1]}
                on:input={(e) => handleRangeInput('xRange2', 1, e)}
                step={$plotParams.xVar2 === 'n' ? '1' : 'any'}
              />
            </div>
            {#if $plotValidation.errors.xRange2}
              <span class="error-message">{$_($plotValidation.errors.xRange2)}</span>
            {/if}
          </div>

          <div class="form-group inline sub-option">
            <label for="points2">{$_('plotting.pointsLabel')}:</label>
            <input
              type="number"
              id="points2"
              name="points2"
              value={$plotParams.points2}
              min="1"
              max="101"
              step="1"
              on:input={handleInputChange}
              class:error={$plotValidation.errors.points2}
            />
            {#if $plotValidation.errors.points2}
              <span class="error-message">{$_($plotValidation.errors.points2)}</span>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Parameter Reference Box (Current Base Parameters) - moved after variables -->
    <ParameterReference
      onNavigateToParams={onNavigateToParams}
      xVar={$plotParams.xVar}
      xVar2={$plotParams.xVar2}
      yVar={$plotParams.yVar}
      plotType={$plotParams.plotType}
      distribution={$plotParams.distribution || 'uniform'}
      shapingParam={$plotParams.shaping_param || 0}
      isBetaOnX={isBetaOnX}
      useCustomConstellation={$useCustomConstellation}
      on:distributionChange={(e) => updatePlotParam('distribution', e.detail)}
      on:shapingParamChange={(e) => updatePlotParam('shaping_param', e.detail)}
    />

    <!-- Styling Options (Type only, Color removed) -->
    {#if $plotParams.plotType === 'lineLog'}
      <div class="form-section compact-section">
        <h4>{$_('plotting.styling')}</h4>
        <select
          id="lineType"
          name="lineType"
          value={$plotParams.lineType}
          on:change={handleInputChange}
        >
          <option value="solid">{$_('plotting.solid')}</option>
          <option value="dashed">{$_('plotting.dashed')}</option>
        </select>
      </div>
    {/if}

    <!-- Submit Button -->
    <div class="form-submit">
      <button
        type="submit"
        class="button-primary plot-button"
        disabled={!$plotValidation.isValid || disabled}
      >
        {#if disabled}
          {$plotParams.plotType === 'rawData' ? $_('plotting.generatingData') : $_('plotting.generating')}
        {:else}
          {$plotParams.plotType === 'rawData' ? $_('plotting.generateData') : $_('plotting.generate')}
        {/if}
      </button>

      {#if !$plotValidation.isValid}
        <p class="validation-summary">
          {$_('plotting.fixErrors')}
        </p>
      {/if}
    </div>

    <!-- Data Import Section -->
    <div class="import-section">
      <button type="button" class="button-secondary import-button" on:click={openModal} disabled={disabled}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {$_('plotting.importData')}
      </button>
    </div>
  </form>

  <!-- Import Modal -->
  <DataImportModal bind:isOpen={isModalOpen} on:success={handleImportSuccess} />
</div>

<style>
  .plotting-controls {
    background: var(--plot-background);
    border-radius: 8px;
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
  }

  .controls-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .controls-header h3 {
    margin: 0;
    color: var(--text-color);
    font-weight: 600;
  }

  .header-actions button {
    font-size: var(--font-size-sm);
    padding: 6px 12px;
  }

  .controls-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .form-section {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: var(--spacing-md);
    background: var(--card-background);
  }

  .form-section h4 {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--text-color);
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  /* Compact section: title and dropdown on same line */
  .form-section.compact-section {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .form-section.compact-section h4 {
    margin: 0;
    min-width: 70px;
    width: 70px;
    flex-shrink: 0;
    /* Allow wrapping for long translations */
    white-space: normal;
    word-wrap: break-word;
    line-height: 1.3;
    /* Align with Variables title */
    margin-left: 0;
  }

  .form-section.compact-section select {
    flex: 1;
    /* Offset to align with variable-block dropdowns */
    margin-left: var(--spacing-sm);
  }

  /* Variable block: groups a variable with its range and points */
  .variable-block {
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: var(--spacing-sm);
    margin-top: var(--spacing-sm);
    background: var(--surface-color, var(--input-background));
  }

  .variable-block .form-group.inline {
    margin-bottom: var(--spacing-sm);
  }

  .variable-block .form-group.inline:last-child {
    margin-bottom: 0;
  }


  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .form-row:last-child {
    margin-bottom: 0;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* Vertical spacing for form-groups that are direct children of form-section */
  .form-section > .form-group {
    margin-bottom: var(--spacing-md);
  }

  .form-section > .form-group:last-child {
    margin-bottom: 0;
  }

  .form-group.inline {
    display: grid;
    grid-template-columns: 1fr 2fr;
    align-items: center;
    gap: 8px;
  }

  /* Within variable-block, use fixed label width, dropdown expands to fill */
  .variable-block .form-group.inline {
    grid-template-columns: 70px 1fr;
  }

  /* Sub-options: indent the label text, not the whole row */
  .variable-block .form-group.inline.sub-option label {
    padding-left: 10px;
  }

  /* Standalone form-group: dropdown aligned with inline dropdowns (1:2 ratio = 2/3 width) */
  .form-group.standalone {
    flex-direction: row;
    justify-content: flex-end;
  }

  .form-group.standalone select,
  .form-group.standalone input {
    width: 66.67%;
  }

  .form-group.inline-with-help {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .form-group label {
    font-weight: 600;
    color: var(--text-color);
    font-size: var(--font-size-sm);
  }

  .form-group.inline label,
  .form-group.inline-with-help label {
    margin: 0;
    white-space: nowrap;
  }

  /* Labels in inline form-groups */
  .form-section .form-group.inline > label {
    min-width: 0;
    text-align: left;
  }

  .form-group input,
  .form-group select {
    background: var(--input-background);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 8px 11px;
    transition: border-color var(--transition-fast);
    outline: none;
  }

  .form-group input:focus,
  .form-group select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(200, 16, 46, 0.1);
  }

  .form-group input.error {
    border-color: #dc2626;
    box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
  }

  .range-inputs {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 8px;
    align-items: center;
  }

  .range-separator {
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    text-align: center;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.8em;
    font-weight: 500;
  }

  .form-help-text {
    margin: var(--spacing-sm) 0 0 0;
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    font-style: italic;
  }

  .form-submit {
    padding-top: var(--spacing-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .plot-button {
    min-width: 200px;
    padding: 12px 24px;
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  .validation-summary {
    color: #dc2626;
    font-size: var(--font-size-sm);
    text-align: center;
    margin: 0;
  }

  .import-section {
    margin-top: var(--spacing-xs);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
  }

  .divider {
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }

  .divider-text {
    color: var(--text-color-secondary);
    font-size: var(--font-size-sm);
    font-weight: 500;
    padding: 0 var(--spacing-xs);
  }

  .import-button {
    min-width: 200px;
    padding: 12px 24px;
    font-size: var(--font-size-base);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  @media (max-width: 768px) {
    .controls-header {
      flex-direction: column;
      align-items: stretch;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .plot-button {
      min-width: auto;
      width: 100%;
    }
  }
</style>
