<script>
  import { _ } from 'svelte-i18n';
  import { simulationParams, paramValidation, updateParam, showAdvancedParams, useCustomConstellation, customConstellation } from '../../stores/simulation.js';
  import { debounce } from '../../utils/cache.js';
  import CustomConstellation from './CustomConstellation.svelte';

  export let onCompute = () => {};
  export let disabled = false;

  let form;

  function handleSubmit(event) {
    event.preventDefault();
    if ($paramValidation.isValid && !disabled) {
      onCompute($simulationParams);
    }
  }

  // Debounced input handling for better performance
  const debouncedUpdateParam = debounce((name, value) => {
    updateParam(name, value);
  }, 300);

  function handleInputChange(event) {
    const { name, value, type } = event.target;
    let processedValue = value;

    // Convert to number for numeric parameters
    if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (type === 'text' && (name === 'threshold')) {
      // For threshold, parse scientific notation (e.g., "1e-6")
      const parsed = parseFloat(value);
      processedValue = isNaN(parsed) ? value : parsed;
    } else if (type === 'select-one' && name === 'M') {
      // For modulation size, convert string to number
      processedValue = parseInt(value, 10);
    }

    // For immediate UI feedback, update immediately for selects
    if (type === 'select-one') {
      updateParam(name, processedValue);
    } else {
      // For number inputs, use debounced updates
      debouncedUpdateParam(name, processedValue);
    }
  }

  function toggleAdvanced() {
    showAdvancedParams.update(show => !show);
  }

  function resetToDefaults() {
    updateParam('M', 16);
    updateParam('typeModulation', 'PAM');
    updateParam('SNR', 7);
    updateParam('R', 0.5);
    updateParam('n', 100);
    updateParam('N', 20);
    updateParam('threshold', 1e-6);
    useCustomConstellation.set(false);
  }

  function handleCustomConstellationChange(event) {
    const pointCount = event.detail.points.length;
    console.log('CustomConstellation changed, updating store with', pointCount, 'points');
    customConstellation.set({
      points: event.detail.points,
      isValid: event.detail.isValid
    });
    // Update M to match the number of constellation points
    updateParam('M', pointCount);
  }

  function toggleCustomConstellation() {
    useCustomConstellation.update(v => {
      if (!v) {
        // Enabling custom constellation - update M to match point count
        const currentConstellation = $customConstellation;
        if (currentConstellation && currentConstellation.points) {
          updateParam('M', currentConstellation.points.length);
        }
      } else {
        // Disabling custom constellation - reset M to valid power of 2 if needed
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
      return !v;
    });
  }
</script>

<div class="parameter-form">
  <div class="form-header">
    <h3>{$_('params.title')}</h3>
    <div class="form-actions">
      <button type="button" class="button-secondary" on:click={resetToDefaults}>
        {$_('params.resetDefaults')}
      </button>
      <button type="button" class="button-secondary" on:click={toggleAdvanced}>
        {$showAdvancedParams ? $_('params.hideAdvanced') : $_('params.showAdvanced')}
      </button>
    </div>
  </div>

  <form bind:this={form} on:submit={handleSubmit} class="form">
    <!-- Basic Parameters -->
    <div class="form-section">
      <h4>{$_('params.basic')}</h4>

      <!-- Custom Constellation Toggle -->
      <div class="form-row">
        <div class="form-group constellation-toggle-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={$useCustomConstellation}
              on:change={toggleCustomConstellation}
            />
            <span>{$_('params.useCustomConstellation')}</span>
          </label>
          <small class="help-text">
            {$_('params.customConstellationHelp')}
          </small>
        </div>
      </div>

      {#if !$useCustomConstellation}
        <div class="form-row">
          <div class="form-group inline">
            <label for="M">{$_('params.modulationSize')}:</label>
            <select
              id="M"
              name="M"
              value={$simulationParams.M}
              on:change={handleInputChange}
              class:error={$paramValidation.errors.M}
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
            {#if $paramValidation.errors.M}
              <span class="error-message">{$paramValidation.errors.M}</span>
            {/if}
          </div>

          <div class="form-group inline">
            <label for="typeModulation">{$_('params.modulationType')}:</label>
            <select
              id="typeModulation"
              name="typeModulation"
              value={$simulationParams.typeModulation}
              on:change={handleInputChange}
            >
              <option value="PAM">PAM</option>
              <option value="PSK">PSK</option>
              <option value="QAM">QAM</option>
            </select>
          </div>
        </div>
      {:else}
        <!-- Show M as read-only when using custom constellation -->
        <div class="form-row">
          <div class="form-group inline">
            <label for="M-display">{$_('params.modulationSize')}:</label>
            <input
              type="text"
              id="M-display"
              value={$simulationParams.M}
              readonly
              class="m-display-readonly"
              title={$_('params.customConstellationHelp')}
            />
          </div>
        </div>
        <CustomConstellation
          on:change={handleCustomConstellationChange}
        />
        {#if $paramValidation.errors.customConstellation}
          <span class="error-message">{$paramValidation.errors.customConstellation}</span>
        {/if}
      {/if}

      <div class="form-row">
        <div class="form-group inline">
          <label for="SNR">{$_('params.snr')}:</label>
          <div class="input-with-unit">
            <input
              type="number"
              id="SNR"
              name="SNR"
              value={$simulationParams.SNR}
              min="0"
              max="100"
              step="0.1"
              on:input={handleInputChange}
              class:error={$paramValidation.errors.SNR}
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
          {#if $paramValidation.errors.SNR}
            <span class="error-message">{$paramValidation.errors.SNR}</span>
          {/if}
        </div>

        <div class="form-group inline">
          <label for="R">{$_('params.codeRate')}:</label>
          <input
            type="number"
            id="R"
            name="R"
            value={$simulationParams.R}
            min="0"
            max="10"
            step="0.001"
            on:input={handleInputChange}
            class:error={$paramValidation.errors.R}
          />
          {#if $paramValidation.errors.R}
            <span class="error-message">{$paramValidation.errors.R}</span>
          {/if}
        </div>
      </div>

      <div class="form-row">
        <div class="form-group inline">
          <label for="n">{$_('params.codeLength')}:</label>
          <input
            type="number"
            id="n"
            name="n"
            value={$simulationParams.n}
            min="1"
            max="1000000"
            step="1"
            on:input={handleInputChange}
            class:error={$paramValidation.errors.n}
          />
          {#if $paramValidation.errors.n}
            <span class="error-message">{$paramValidation.errors.n}</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Advanced Parameters -->
    {#if $showAdvancedParams}
      <div class="form-section advanced">
        <h4>{$_('params.advanced')}</h4>

        <div class="form-row">
          <div class="form-group inline">
            <label for="N">{$_('params.quadraturePoints')}:</label>
            <input
              type="number"
              id="N"
              name="N"
              value={$simulationParams.N}
              min="2"
              max="40"
              step="1"
              on:input={handleInputChange}
              class:error={$paramValidation.errors.N}
            />
            {#if $paramValidation.errors.N}
              <span class="error-message">{$paramValidation.errors.N}</span>
            {/if}
            <small>{$_('params.quadraturePointsHelp')}</small>
          </div>

          <div class="form-group inline">
            <label for="threshold">{$_('params.threshold')}:</label>
            <input
              type="text"
              id="threshold"
              name="threshold"
              value={$simulationParams.threshold}
              placeholder="e.g., 1e-6"
              on:input={handleInputChange}
              class:error={$paramValidation.errors.threshold}
            />
            {#if $paramValidation.errors.threshold}
              <span class="error-message">{$paramValidation.errors.threshold}</span>
            {/if}
            <small>{$_('params.thresholdHelp')}</small>
          </div>
        </div>
      </div>
    {/if}

    <!-- Submit Button -->
    <div class="form-submit">
      <button
        type="submit"
        class="button-primary compute-button"
        disabled={!$paramValidation.isValid || disabled}
      >
        {disabled ? $_('params.computing') : $_('params.compute')}
      </button>

      {#if !$paramValidation.isValid}
        <p class="validation-summary">
          {$_('params.fixErrors')}
        </p>
      {/if}
    </div>
  </form>
</div>

<style>
  .parameter-form {
    background: var(--simulation-background);
    border-radius: 8px;
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .form-header h3 {
    margin: 0;
    color: var(--text-color);
    font-weight: 600;
  }

  .form-actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .form-actions button {
    font-size: var(--font-size-sm);
    padding: 6px 12px;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .form-section {
    border: 1px solid color-mix(in srgb, var(--primary-color) 15%, transparent);
    border-radius: 6px;
    padding: var(--spacing-md);
    background: var(--card-background);
  }

  .form-section.advanced {
    border-color: var(--border-color);
    background: var(--surface-color);
  }

  .form-section h4 {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--primary-color);
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

  .form-group.inline {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .form-group label {
    font-weight: 600;
    color: var(--text-color);
    font-size: var(--font-size-sm);
  }

  .form-group.inline label {
    min-width: fit-content;
    margin: 0;
    white-space: nowrap;
  }

  .form-group small {
    color: var(--text-color-secondary);
    font-size: 0.8em;
    margin-top: 2px;
  }

  .form-group input,
  .form-group select {
    background: var(--input-background);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 8px 11px;
    transition: border-color var(--transition-fast);
    outline: none;
    color: var(--text-color);
  }

  .form-group input:focus,
  .form-group select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 15%, transparent);
  }

  .form-group input.error {
    border-color: #dc2626;
    box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
  }

  .input-with-unit {
    display: flex;
    gap: 4px;
  }

  .input-with-unit input {
    flex: 1;
  }

  .unit-selector {
    background: var(--input-background);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 8px;
    font-size: var(--font-size-sm);
    width: 90px;
    flex-shrink: 0;
    cursor: pointer;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.8em;
    font-weight: 500;
  }

  .form-submit {
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .compute-button {
    min-width: 240px;
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

  .constellation-toggle-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--text-color);
    cursor: pointer;
    user-select: none;
  }

  .checkbox-label input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .help-text {
    color: var(--text-color-secondary);
    font-size: 0.85em;
    margin: 0;
    font-style: italic;
  }

  .m-display-readonly {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 8px 11px;
    font-weight: 500;
    color: var(--text-color-secondary);
    width: 70px;
    min-width: 70px;
    max-width: 70px;
    text-align: center;
    cursor: not-allowed;
    box-sizing: border-box;
  }

  @media (max-width: 768px) {
    .form-header {
      flex-direction: column;
      align-items: stretch;
    }

    .form-actions {
      justify-content: center;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .compute-button {
      min-width: auto;
      width: 100%;
    }
  }
</style>
