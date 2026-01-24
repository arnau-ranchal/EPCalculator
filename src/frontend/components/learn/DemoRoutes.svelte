<script>
  /**
   * DemoRoutes.svelte
   *
   * Renders REAL UI components in isolation for screenshot capture.
   * These routes are accessed via /#/demo/[component-name]
   *
   * Playwright captures these routes to generate tutorial screenshots.
   * The screenshots are REAL - they show the actual components with real styling.
   */

  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  // Import REAL components from the app
  import ParameterForm from '../simulation/ParameterForm.svelte';
  import CustomConstellation from '../simulation/CustomConstellation.svelte';
  import PlottingControls from '../plotting/PlottingControls.svelte';
  import ThemeSelector from '../layout/ThemeSelector.svelte';
  import LanguageSelector from '../layout/LanguageSelector.svelte';

  // Import stores to control component state
  import {
    simulationParams,
    updateParam,
    useCustomConstellation,
    customConstellation
  } from '../../stores/simulation.js';

  export let demoName = '';
  export let variant = 'default';

  // Parse query params for customization
  let queryParams = {};
  let isReady = false;

  onMount(() => {
    // Parse URL query string for demo customization
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    if (queryIndex !== -1) {
      const queryString = hash.slice(queryIndex + 1);
      const params = new URLSearchParams(queryString);
      for (const [key, value] of params) {
        queryParams[key] = value;
      }
    }

    // Apply query params to simulation state
    if (queryParams.M) updateParam('M', parseInt(queryParams.M));
    if (queryParams.type) updateParam('typeModulation', queryParams.type);
    if (queryParams.SNR) updateParam('SNR', parseFloat(queryParams.SNR));

    // Signal that component is ready (after a small delay for i18n)
    setTimeout(() => {
      isReady = true;
    }, 100);
  });

  // Dummy handlers for components that need them
  function handleCompute() {
    console.log('Demo compute clicked');
  }

  function handleConstellationChange(e) {
    console.log('Constellation changed', e.detail);
  }
</script>

<div class="demo-container" data-demo={demoName} data-variant={variant} data-ready={isReady}>
  {#if demoName === 'parameter-form'}
    <!-- Full parameter form -->
    <div class="demo-wrapper parameter-form-demo">
      <ParameterForm onCompute={handleCompute} />
    </div>

  {:else if demoName === 'modulation-selector'}
    <!-- Just the modulation selectors (M and type) -->
    <div class="demo-wrapper modulation-demo">
      <div class="form-section">
        <h4>{$_('params.basic')}</h4>
        <div class="form-row">
          <div class="form-group inline">
            <label for="M">{$_('params.modulationSize')}:</label>
            <select id="M" bind:value={$simulationParams.M}>
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={16}>16</option>
              <option value={32}>32</option>
              <option value={64}>64</option>
            </select>
          </div>
          <div class="form-group inline">
            <label for="typeModulation">{$_('params.modulationType')}:</label>
            <select id="typeModulation" bind:value={$simulationParams.typeModulation}>
              <option value="PAM">PAM</option>
              <option value="PSK">PSK</option>
              <option value="QAM">QAM</option>
            </select>
          </div>
        </div>
      </div>
    </div>

  {:else if demoName === 'snr-input'}
    <!-- SNR input with unit selector -->
    <div class="demo-wrapper snr-demo">
      <div class="form-group">
        <label for="SNR">{$_('params.snr')}:</label>
        <div class="input-with-unit">
          <input
            type="number"
            id="SNR"
            bind:value={$simulationParams.SNR}
            min="0"
            max="100"
            step="0.1"
          />
          <select bind:value={$simulationParams.SNRUnit} class="unit-selector">
            <option value="linear">{$_('params.snrLinear')}</option>
            <option value="dB">{$_('params.snrDb')}</option>
          </select>
        </div>
      </div>
    </div>

  {:else if demoName === 'custom-constellation'}
    <!-- Custom constellation editor -->
    <div class="demo-wrapper constellation-demo">
      <CustomConstellation on:change={handleConstellationChange} />
    </div>

  {:else if demoName === 'plotting-controls'}
    <!-- Plotting configuration panel -->
    <div class="demo-wrapper plotting-demo">
      <PlottingControls />
    </div>

  {:else if demoName === 'theme-language'}
    <!-- Theme and language selectors -->
    <div class="demo-wrapper settings-demo">
      <div class="settings-row">
        <ThemeSelector />
        <LanguageSelector />
      </div>
    </div>

  {:else if demoName === 'compute-button'}
    <!-- Compute button isolated -->
    <div class="demo-wrapper button-demo">
      <button type="button" class="button-primary" on:click={handleCompute}>
        {$_('simulation.compute')}
      </button>
    </div>

  {:else}
    <!-- Unknown demo -->
    <div class="demo-wrapper error-demo">
      <p>Unknown demo: {demoName}</p>
      <p>Available demos:</p>
      <ul>
        <li>parameter-form</li>
        <li>modulation-selector</li>
        <li>snr-input</li>
        <li>custom-constellation</li>
        <li>plotting-controls</li>
        <li>theme-language</li>
        <li>compute-button</li>
      </ul>
    </div>
  {/if}
</div>

<style>
  .demo-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg, 24px);
    background: var(--background-color, #f5f5f5);
  }

  .demo-wrapper {
    background: var(--card-background, white);
    border-radius: 12px;
    padding: var(--spacing-lg, 24px);
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1));
    max-width: 600px;
    width: 100%;
  }

  /* Match real app styles */
  .form-section h4 {
    margin: 0 0 var(--spacing-md, 16px) 0;
    color: var(--text-color, #333);
    font-size: var(--font-size-base, 1rem);
  }

  .form-row {
    display: flex;
    gap: var(--spacing-lg, 24px);
    flex-wrap: wrap;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs, 4px);
  }

  .form-group.inline {
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-sm, 8px);
  }

  label {
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color, #333);
    font-weight: 500;
  }

  select, input {
    padding: 8px 12px;
    border: 1px solid var(--border-color, #dee2e6);
    border-radius: 6px;
    background: var(--card-background, white);
    color: var(--text-color, #333);
    font-size: var(--font-size-sm, 0.875rem);
  }

  select:focus, input:focus {
    outline: none;
    border-color: var(--primary-color, #C8102E);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color, #C8102E) 20%, transparent);
  }

  .input-with-unit {
    display: flex;
    gap: 4px;
  }

  .input-with-unit input {
    width: 100px;
  }

  .unit-selector {
    padding: 8px;
    font-size: var(--font-size-xs, 0.75rem);
  }

  .button-primary {
    background: var(--primary-color, #C8102E);
    color: white;
    border: none;
    border-radius: 8px;
    padding: var(--spacing-sm, 8px) var(--spacing-lg, 24px);
    font-size: var(--font-size-base, 1rem);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .button-primary:hover {
    background: var(--primary-color-dark, #a00d25);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.15));
  }

  .settings-row {
    display: flex;
    gap: var(--spacing-lg, 24px);
    align-items: center;
  }

  .error-demo {
    color: var(--text-color-secondary, #666);
  }

  .error-demo ul {
    margin-top: var(--spacing-sm, 8px);
    padding-left: var(--spacing-lg, 24px);
  }

  .error-demo li {
    font-family: 'Fira Code', monospace;
    font-size: var(--font-size-sm, 0.875rem);
  }
</style>
