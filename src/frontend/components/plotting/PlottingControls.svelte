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
    }

    updatePlotParam(name, processedValue);
  }

  function handleRangeInput(rangeName, index, event) {
    const value = parseFloat(event.target.value) || 0;
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
    { value: 'cutoff_rate', label: $_('plotting.cutoffRate') }
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

  <!-- Parameter Reference Box -->
  <ParameterReference
    onNavigateToParams={onNavigateToParams}
    xVar={$plotParams.xVar}
    xVar2={$plotParams.xVar2}
    yVar={$plotParams.yVar}
    plotType={$plotParams.plotType}
  />

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

    <!-- Variable Selection -->
    <div class="form-section">
      <h4>{$_('plotting.variables')}</h4>

      <div class="form-row">
        {#if $plotParams.plotType !== 'rawData'}
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
        {/if}

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
      </div>

      {#if $plotParams.plotType === 'contour' || $plotParams.plotType === 'surface'}
        <div class="form-row">
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
        </div>
      {/if}
    </div>

    <!-- Distribution Settings (hidden when using custom constellation) -->
    {#if !$useCustomConstellation}
      <div class="form-section compact-section">
        <h4>{$_('plotting.distribution')}</h4>
        <select
          id="distribution"
          name="distribution"
          value={$plotParams.distribution || 'uniform'}
          on:change={handleInputChange}
        >
          <option value="uniform">{$_('plotting.uniform')}</option>
          <option value="maxwell-boltzmann" disabled={isBetaOnX}>{$_('plotting.maxwellBoltzmann')}</option>
        </select>
      </div>

      {#if ($plotParams.distribution || 'uniform') === 'maxwell-boltzmann'}
        <div class="form-section">
          <div class="form-group inline">
            <label for="shaping_param">{$_('plotting.beta')}:</label>
            <input
              type="number"
              id="shaping_param"
              name="shaping_param"
              value={$plotParams.shaping_param || 0}
              min="0"
              max="10"
              step="0.1"
              on:input={handleInputChange}
            />
          </div>
          <p class="form-help-text">
            💡 {$_('plotting.mbDescription')}
          </p>
        </div>
      {/if}
    {/if}

    <!-- Range and Points -->
    <div class="form-section range-resolution-section">
      <h4>{$_('plotting.rangeResolution')}</h4>

      <!-- SNR Unit Selector (appears when SNR is selected) -->
      {#if $plotParams.xVar === 'SNR' || (($plotParams.plotType === 'contour' || $plotParams.plotType === 'surface') && $plotParams.xVar2 === 'SNR')}
        <div class="form-group inline">
          <label for="snrUnit">{$_('plotting.snrUnit')}:</label>
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

      <div class="form-group inline">
        <label>
          {#if $plotParams.xVar === 'SNR'}
            {xVarAcronym} {$_('plotting.rangeLabel')} ({$plotParams.snrUnit === 'dB' ? 'dB' : $_('plotting.linear').toLowerCase()}):
          {:else}
            {xVarAcronym} {$_('plotting.rangeLabel')}:
          {/if}
        </label>
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

      <div class="form-group inline">
        <label for="points">
          {#if $plotParams.plotType === 'contour'}
            {$_('plotting.levels')}:
          {:else if $plotParams.plotType === 'surface'}
            {xVarAcronym} {$_('plotting.pointsLabel')}:
          {:else}
            {xVarAcronym} {$_('plotting.pointsLabel')}:
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

      {#if $plotParams.plotType === 'contour' || $plotParams.plotType === 'surface'}
        <div class="form-group inline">
          <label>
            {#if $plotParams.xVar2 === 'SNR'}
              {xVar2Acronym} {$_('plotting.rangeLabel')} ({$plotParams.snrUnit === 'dB' ? 'dB' : $_('plotting.linear').toLowerCase()}):
            {:else}
              {xVar2Acronym} {$_('plotting.rangeLabel')}:
            {/if}
          </label>
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

        <div class="form-group inline">
          <label for="points2">{xVar2Acronym} {$_('plotting.pointsLabel')}:</label>
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
      {/if}
    </div>

    <!-- Styling Options -->
    {#if $plotParams.plotType === 'lineLog'}
      <div class="form-section">
        <h4>{$_('plotting.styling')}</h4>

        <div class="form-row">
          <div class="form-group inline">
            <label for="lineColor">{$_('plotting.color')}:</label>
            <select
              id="lineColor"
              name="lineColor"
              value={$plotParams.lineColor}
              on:change={handleInputChange}
            >
              {#each colorOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>

          <div class="form-group inline">
            <label for="lineType">{$_('plotting.lineType')}:</label>
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
        </div>
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
      <div class="divider">
        <span class="divider-text">{$_('plotting.or')}</span>
      </div>

      <button type="button" class="import-button" on:click={openModal} disabled={disabled}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {$_('plotting.importData')}
      </button>

      <p class="import-help-text">
        {$_('plotting.importHelp')}
      </p>
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
    gap: var(--spacing-lg);
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

  /* Compact section: title and dropdown on same line with 1:2 ratio */
  .form-section.compact-section {
    display: grid;
    grid-template-columns: 1fr 2fr;
    align-items: center;
    gap: 8px;
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .form-section.compact-section h4 {
    margin: 0;
    min-width: 0;
    /* Allow wrapping for long translations */
    white-space: normal;
    word-wrap: break-word;
    line-height: 1.3;
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
    border-top: 1px solid var(--border-color);
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
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .divider {
    width: 100%;
    position: relative;
    text-align: center;
    margin: var(--spacing-sm) 0;
  }

  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--border-color);
  }

  .divider-text {
    position: relative;
    display: inline-block;
    padding: 0 var(--spacing-sm);
    background: var(--plot-background);
    color: var(--text-color-secondary);
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .import-button {
    background: var(--input-background);
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

  .import-help-text {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    text-align: center;
    font-style: italic;
    max-width: 320px;
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
