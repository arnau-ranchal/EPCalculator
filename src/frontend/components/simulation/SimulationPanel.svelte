<script>
  import { _ } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { simulationParams, simulationResults, isComputing, getSNRLinear, useCustomConstellation, customConstellation } from '../../stores/simulation.js';
  import { computeExponents, formatSimulationResponse, handleApiError, mapSimulationParams } from '../../utils/api.js';
  import { getCachedSimulation, setCachedSimulation, performanceMonitor } from '../../utils/cache.js';
  import ParameterForm from './ParameterForm.svelte';
  import ResultsDisplay from './ResultsDisplay.svelte';

  let errorMessage = '';

  async function handleCompute(params) {
    try {
      errorMessage = '';
      isComputing.set(true);

      // Convert SNR to linear for backend
      const paramsForBackend = {
        ...params,
        SNR: getSNRLinear(params)
      };

      // Check if using custom constellation (use get() to read current store values)
      const isUsingCustom = get(useCustomConstellation);
      const customConst = isUsingCustom ? get(customConstellation) : null;

      // Debug: Log constellation data
      if (isUsingCustom && customConst) {
        console.log('Custom constellation points:', JSON.stringify(customConst.points.map(p => ({
          r: p.real.toFixed(4),
          i: p.imag.toFixed(4),
          p: p.prob.toFixed(4)
        }))));
      }

      // Map parameters with custom constellation if applicable
      const apiParams = mapSimulationParams(paramsForBackend, customConst);

      // Debug: Log cache key components
      console.log('Cache key includes custom:', !!apiParams.customConstellation, 'SNR:', apiParams.SNR);
      if (apiParams.customConstellation) {
        console.log('Cache key constellation hash:', JSON.stringify(apiParams.customConstellation).substring(0, 100));
      }

      // Check cache first (use apiParams which includes custom constellation for cache key)
      const cachedResult = getCachedSimulation(apiParams);
      if (cachedResult) {
        console.log('Using cached simulation result');
        simulationResults.set({
          ...cachedResult,
          cached: true,
          computationTime: 0
        });
        return;
      }

      console.log('No cache hit - computing new result');

      // Start performance monitoring
      performanceMonitor.start('simulation');

      const startTime = performance.now();
      const rawResponse = await computeExponents(apiParams);
      const endTime = performance.now();

      const formattedResults = formatSimulationResponse(rawResponse);
      formattedResults.computationTime = endTime - startTime;
      formattedResults.cached = false;

      // Cache the result (use apiParams to include custom constellation in cache key)
      setCachedSimulation(apiParams, formattedResults);

      simulationResults.set(formattedResults);

      // End performance monitoring
      const duration = performanceMonitor.end('simulation');
      console.log(`Simulation completed in ${duration?.toFixed(2)}ms`);

    } catch (error) {
      const errorInfo = handleApiError(error, 'Failed to compute error probability');
      errorMessage = errorInfo.message;
      console.error('Simulation error:', error);
    } finally {
      isComputing.set(false);
    }
  }

  function clearError() {
    errorMessage = '';
  }
</script>

<div class="simulation-panel">
  {#if errorMessage}
    <div class="error-banner">
      <div class="error-content">
        <strong>{$_('simulation.computationError')}:</strong>
        {errorMessage}
      </div>
      <button type="button" class="error-close" on:click={clearError}>×</button>
    </div>
  {/if}

  <div class="panel-content">
    <div class="simulation-section">
      <ParameterForm
        onCompute={handleCompute}
        disabled={$isComputing}
      />
    </div>

    <div class="results-section">
      <ResultsDisplay
        results={$simulationResults}
        computing={$isComputing}
      />
    </div>
  </div>
</div>

<style>
  .simulation-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    padding-top: var(--spacing-md);
  }

  .panel-intro {
    text-align: center;
    margin: 0;
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--text-color-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.5;
    max-width: 700px;
    margin: 0 auto;
  }

  .error-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: var(--spacing-md);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .error-content {
    flex: 1;
    color: #dc2626;
    font-size: var(--font-size-sm);
    line-height: 1.4;
  }

  .error-content strong {
    font-weight: 600;
  }

  .error-close {
    background: none;
    border: none;
    color: #dc2626;
    font-size: 1.2em;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color var(--transition-fast);
  }

  .error-close:hover {
    background: rgba(220, 38, 38, 0.1);
  }

  .panel-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);
    align-items: start;
  }

  .simulation-section,
  .results-section {
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 1100px) {
    .panel-content {
      grid-template-columns: 1fr;
    }

    .simulation-section {
      order: 1;
    }

    .results-section {
      order: 2;
    }
  }

  @media (max-width: 768px) {
    .panel-intro {
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: var(--font-size-xs);
    }
  }
</style>