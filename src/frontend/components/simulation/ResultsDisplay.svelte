<script>
  import { _ } from 'svelte-i18n';
  import { simulationResults, isComputing } from '../../stores/simulation.js';

  export let results = null;
  export let computing = false;

  $: displayResults = results || $simulationResults;
  $: isLoading = computing || $isComputing;

  function formatNumber(num, precision = 6) {
    if (num === null || num === undefined) return 'N/A';
    if (typeof num !== 'number') return String(num);

    if (num === 0) return '0';

    // Use scientific notation for very small or very large numbers
    if (Math.abs(num) < 1e-3 || Math.abs(num) > 1e6) {
      return num.toExponential(precision);
    }

    return num.toPrecision(precision);
  }

  function formatTime(timeMs) {
    if (timeMs < 1000) return `${timeMs.toFixed(1)} ms`;
    return `${(timeMs / 1000).toFixed(2)} s`;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  }
</script>

<div class="results-display">
  <div class="results-header">
    <h3>{$_('results.title')}</h3>
    {#if displayResults}
      <div class="results-actions">
        <button
          type="button"
          class="button-secondary"
          on:click={() => copyToClipboard(JSON.stringify(displayResults, null, 2))}
        >
          {$_('results.copyResults')}
        </button>
      </div>
    {/if}
  </div>

  <div class="results-content">
    {#if isLoading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>{$_('results.computing')}</p>
        <small>{$_('results.computingHint')}</small>
      </div>
    {:else if displayResults}
      <div class="results-grid">
        <!-- Error Probability -->
        <div class="result-card primary">
          <div class="result-label">{$_('results.errorProbability')}</div>
          <div class="result-value">
            {formatNumber(displayResults.errorProbability)}
          </div>
          <div class="result-description">
            {$_('results.errorProbabilityDesc')}
          </div>
        </div>

        <!-- Error Exponent -->
        <div class="result-card">
          <div class="result-label">{$_('results.errorExponent')}</div>
          <div class="result-value">
            {formatNumber(displayResults.errorExponent)}
          </div>
          <div class="result-description">
            {$_('results.errorExponentDesc')}
          </div>
        </div>

        <!-- Optimal Rho -->
        <div class="result-card">
          <div class="result-label">{$_('results.optimalRho')}</div>
          <div class="result-value">
            {formatNumber(displayResults.optimalRho)}
          </div>
          <div class="result-description">
            {$_('results.optimalRhoDesc')}
          </div>
        </div>

        <!-- Computation Time -->
        <div class="result-card secondary">
          <div class="result-label">{$_('results.computationTime')}</div>
          <div class="result-value">
            {formatTime(displayResults.computationTime || 0)}
          </div>
          <div class="result-description">
            {$_('results.computationTimeDesc')}
            {#if displayResults.cached}
              <span class="cached-indicator">({$_('results.cached')})</span>
            {/if}
          </div>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="additional-info">
        <h4>{$_('results.technicalDetails')}</h4>
        <div class="info-grid">
          <div class="info-item">
            <strong>{$_('results.algorithm')}:</strong> {$_('results.algorithmValue')}
          </div>
          <div class="info-item">
            <strong>{$_('results.integration')}:</strong> {$_('results.integrationValue')}
          </div>
          <div class="info-item">
            <strong>{$_('results.optimization')}:</strong> {$_('results.optimizationValue')}
          </div>
          <div class="info-item">
            <strong>{$_('results.precision')}:</strong> {$_('results.precisionValue')}
          </div>
        </div>
      </div>
    {:else}
      <div class="empty-state">
        <h4>{$_('results.noResults')}</h4>
        <p>{$_('results.noResultsHint')}</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .results-display {
    background: var(--result-background);
    border-radius: 8px;
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .results-header h3 {
    margin: 0;
    color: var(--text-color);
    font-weight: 600;
  }

  .results-actions button {
    font-size: var(--font-size-sm);
    padding: 6px 12px;
  }

  .results-content {
    min-height: 200px;
    display: flex;
    flex-direction: column;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: var(--spacing-md);
    padding: var(--spacing-xl);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-state p {
    margin: 0;
    font-weight: 600;
    color: var(--text-color);
  }

  .loading-state small {
    color: var(--text-color-secondary);
    text-align: center;
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
  }

  .result-card {
    background: var(--card-background);
    border-radius: 8px;
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
    transition: transform var(--transition-fast);
  }

  .result-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .result-card.primary {
    border-color: var(--primary-color);
    background: linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 5%, var(--card-background)) 0%, var(--card-background) 100%);
  }

  .result-card.secondary {
    border-color: var(--border-color);
    background: linear-gradient(135deg, var(--surface-color) 0%, var(--card-background) 100%);
  }

  .result-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .result-value {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: var(--spacing-sm);
    word-break: break-all;
    font-family: 'Courier New', monospace;
  }

  .result-card.primary .result-value {
    color: var(--primary-color);
  }

  .result-description {
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    line-height: 1.4;
  }

  .cached-indicator {
    color: var(--primary-color);
    font-weight: 600;
  }

  .additional-info {
    border-top: 1px solid var(--border-color);
    padding-top: var(--spacing-lg);
  }

  .additional-info h4 {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--text-color);
    font-weight: 600;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-sm);
  }

  .info-item {
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    line-height: 1.4;
  }

  .info-item strong {
    color: var(--text-color);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: var(--spacing-md);
    padding: var(--spacing-xl);
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  .empty-state h4 {
    margin: 0;
    color: var(--text-color);
    font-weight: 600;
  }

  .empty-state p {
    margin: 0;
    color: var(--text-color-secondary);
    max-width: 400px;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    .results-header {
      flex-direction: column;
      align-items: stretch;
    }

    .results-grid {
      grid-template-columns: 1fr;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .result-value {
      font-size: var(--font-size-lg);
    }
  }
</style>
