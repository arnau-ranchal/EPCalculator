<script>
  import { activePlots, isPlotting, comparisonState } from '../../stores/plotting.js';
  import PlotContainer from '../plotting/PlotContainer.svelte';

  // Use store for state persistence across tab switches
  let isComparing = false;
  let errorMessage = '';
  let comparisonMode = '2d'; // '2d' for difference, '3d' for overlay
  let previousMode = '2d'; // Track previous mode to detect actual changes
  let lastGeneratedMode = null; // Track what mode the current comparison was generated in

  // Reactive assignments from store
  $: selectedPlot1Id = $comparisonState.selectedPlot1Id;
  $: selectedPlot2Id = $comparisonState.selectedPlot2Id;
  $: comparisonData = $comparisonState.comparisonData;
  $: comparisonMetadata = $comparisonState.comparisonMetadata;

  // Update store when selections change
  function updateSelectedPlot1(value) {
    comparisonState.update(state => ({ ...state, selectedPlot1Id: value }));
  }

  function updateSelectedPlot2(value) {
    comparisonState.update(state => ({ ...state, selectedPlot2Id: value }));
  }

  // Filter to only show contour plots
  $: contourPlots = $activePlots.filter(plot => plot.type === 'contour');

  // Auto-regenerate comparison when mode changes (if comparison already exists)
  $: if (comparisonMode !== previousMode && selectedPlot1Id && selectedPlot2Id && (comparisonData || comparisonMetadata)) {
    // Only regenerate if the mode actually changed and we already have a comparison
    regenerateComparison();
    previousMode = comparisonMode;
  }

  function regenerateComparison() {
    // Don't regenerate if no plots are selected
    if (!selectedPlot1Id || !selectedPlot2Id) return;

    const plot1 = $activePlots.find(p => p.plotId === selectedPlot1Id);
    const plot2 = $activePlots.find(p => p.plotId === selectedPlot2Id);

    if (!plot1 || !plot2) return;

    try {
      const comparison = comparisonMode === '3d'
        ? computeOverlayComparison(plot1, plot2)
        : computeComparison(plot1, plot2);

      comparisonState.update(state => ({
        ...state,
        comparisonData: comparison.data,
        comparisonMetadata: comparison.metadata
      }));

      // Track what mode this comparison was generated in
      lastGeneratedMode = comparisonMode;
    } catch (error) {
      console.error('Auto-regeneration error:', error);
    }
  }

  // Get plot title for dropdown
  function getPlotTitle(plot) {
    const yLabel = plot.metadata.yLabel || plot.metadata.zLabel || 'Y';
    const x1Label = plot.metadata.x1Label || 'X1';
    const x2Label = plot.metadata.x2Label || 'X2';

    // Add parameters to differentiate plots
    const params = [];
    if (plot.simulationParams?.M && plot.simulationParams?.typeModulation) {
      params.push(`${plot.simulationParams.M}-${plot.simulationParams.typeModulation}`);
    }
    if (plot.simulationParams?.R !== undefined) {
      params.push(`R=${plot.simulationParams.R}`);
    }
    if (plot.simulationParams?.n !== undefined) {
      params.push(`n=${plot.simulationParams.n}`);
    }

    const paramStr = params.length > 0 ? ` (${params.join(', ')})` : '';
    return `${yLabel} vs ${x1Label} vs ${x2Label}${paramStr}`;
  }

  // Check if two plots are compatible for comparison
  function arePlotsCompatible(plot1, plot2) {
    if (!plot1 || !plot2) return false;

    // Check if axes variables match
    const p1x1 = plot1.metadata.xVar || plot1.plotParams?.xVar;
    const p1x2 = plot1.metadata.xVar2 || plot1.metadata.x2Var || plot1.plotParams?.xVar2;
    const p2x1 = plot2.metadata.xVar || plot2.plotParams?.xVar;
    const p2x2 = plot2.metadata.xVar2 || plot2.metadata.x2Var || plot2.plotParams?.xVar2;

    return p1x1 === p2x1 && p1x2 === p2x2;
  }

  // Generate comparison
  async function generateComparison() {
    if (!selectedPlot1Id || !selectedPlot2Id) {
      errorMessage = 'Please select two plots to compare';
      return;
    }

    if (selectedPlot1Id === selectedPlot2Id) {
      errorMessage = 'Please select two different plots';
      return;
    }

    const plot1 = $activePlots.find(p => p.plotId === selectedPlot1Id);
    const plot2 = $activePlots.find(p => p.plotId === selectedPlot2Id);

    if (!plot1 || !plot2) {
      errorMessage = 'Selected plots not found';
      return;
    }

    if (!arePlotsCompatible(plot1, plot2)) {
      errorMessage = 'Selected plots have incompatible axes and cannot be compared';
      return;
    }

    isComparing = true;
    errorMessage = '';

    try {
      // Create comparison data based on selected mode
      const comparison = comparisonMode === '3d'
        ? computeOverlayComparison(plot1, plot2)
        : computeComparison(plot1, plot2);

      // Save to store for persistence
      comparisonState.update(state => ({
        ...state,
        comparisonData: comparison.data,
        comparisonMetadata: comparison.metadata
      }));

      // Track what mode this comparison was generated in
      lastGeneratedMode = comparisonMode;
    } catch (error) {
      errorMessage = error.message || 'Failed to generate comparison';
      console.error('Comparison error:', error);
    } finally {
      isComparing = false;
    }
  }

  // Compute comparison between two plots
  function computeComparison(plot1, plot2) {
    // Extract data arrays
    const data1 = plot1.data;
    const data2 = plot2.data;

    // Build lookup maps for fast access
    const map1 = new Map();
    const map2 = new Map();

    data1.forEach(point => {
      const key = `${point.x1.toFixed(6)},${point.x2.toFixed(6)}`;
      map1.set(key, point.z);
    });

    data2.forEach(point => {
      const key = `${point.x1.toFixed(6)},${point.x2.toFixed(6)}`;
      map2.set(key, point.z);
    });

    // Compute difference at each point
    const comparisonPoints = [];
    data1.forEach(point => {
      const key = `${point.x1.toFixed(6)},${point.x2.toFixed(6)}`;
      const z1 = map1.get(key);
      const z2 = map2.get(key);

      if (z1 !== undefined && z2 !== undefined) {
        // Positive difference means plot1 is higher
        const diff = z1 - z2;
        comparisonPoints.push({
          x1: point.x1,
          x2: point.x2,
          z: diff,
          plot1Value: z1,
          plot2Value: z2
        });
      }
    });

    // Create metadata
    const metadata = {
      type: 'contour',
      x1Label: plot1.metadata.x1Label || 'X1',
      x2Label: plot1.metadata.x2Label || 'X2',
      zLabel: `Difference (${plot1.metadata.yLabel || 'Plot 1'} - ${plot2.metadata.yLabel || 'Plot 2'})`,
      xVar: plot1.metadata.xVar,
      xVar2: plot1.metadata.xVar2 || plot1.metadata.x2Var,
      yVar: 'difference',
      plot1Title: getPlotTitle(plot1),
      plot2Title: getPlotTitle(plot2),
      contourMode: plot1.metadata.contourMode || plot1.plotParams?.contourMode || '2d',
      isDivergingColorScheme: true, // Use red-blue diverging colors
    };

    return { data: comparisonPoints, metadata };
  }

  // Compute 3D overlay comparison (both plots on same axes)
  function computeOverlayComparison(plot1, plot2) {
    const data1 = plot1.data;
    const data2 = plot2.data;

    // Combine both datasets with labels
    const overlayData = [
      ...data1.map(point => ({
        x1: point.x1,
        x2: point.x2,
        z: point.z,
        plotSource: 'plot1'
      })),
      ...data2.map(point => ({
        x1: point.x1,
        x2: point.x2,
        z: point.z,
        plotSource: 'plot2'
      }))
    ];

    // Create metadata for 3D overlay
    const metadata = {
      type: 'contour',
      x1Label: plot1.metadata.x1Label || 'X1',
      x2Label: plot1.metadata.x2Label || 'X2',
      zLabel: plot1.metadata.yLabel || plot1.metadata.zLabel || 'Z',
      xVar: plot1.metadata.xVar,
      xVar2: plot1.metadata.xVar2 || plot1.metadata.x2Var,
      yVar: plot1.metadata.yVar,
      plot1Title: getPlotTitle(plot1),
      plot2Title: getPlotTitle(plot2),
      contourMode: '3d', // Force 3D for overlay
      isOverlayComparison: true, // Flag to indicate this is an overlay
      plot1Data: data1,
      plot2Data: data2
    };

    return { data: overlayData, metadata };
  }

  function clearError() {
    errorMessage = '';
  }
</script>

<div class="comparison-panel">
  <div class="panel-header">
    <h2>Plot Comparison</h2>
    <p class="panel-description">
      Select two contour plots to compare and visualize which one has higher Y-axis values across different regions.
    </p>
  </div>

  {#if errorMessage}
    <div class="error-banner">
      <div class="error-content">
        <strong>Comparison Error:</strong>
        {errorMessage}
      </div>
      <button type="button" class="error-close" on:click={clearError}>×</button>
    </div>
  {/if}

  {#if contourPlots.length < 2}
    <div class="warning-box">
      <div class="warning-icon">⚠️</div>
      <div class="warning-content">
        <strong>Not Enough Plots</strong>
        <p>You need at least 2 contour plots to use the comparison feature. Go to the "Plotting & Visualization" tab to generate contour plots.</p>
      </div>
    </div>
  {:else}
    <div class="comparison-controls">
      <div class="selector-grid">
        <div class="form-group">
          <label for="plot1-select">Plot 1 (Red regions when higher)</label>
          <select
            id="plot1-select"
            value={selectedPlot1Id}
            on:change={(e) => updateSelectedPlot1(e.target.value)}
          >
            <option value="">Select a contour plot...</option>
            {#each contourPlots as plot}
              <option value={plot.plotId}>
                {getPlotTitle(plot)}
              </option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="plot2-select">Plot 2 (Blue regions when higher)</label>
          <select
            id="plot2-select"
            value={selectedPlot2Id}
            on:change={(e) => updateSelectedPlot2(e.target.value)}
          >
            <option value="">Select a contour plot...</option>
            {#each contourPlots as plot}
              <option value={plot.plotId}>
                {getPlotTitle(plot)}
              </option>
            {/each}
          </select>
        </div>
      </div>

      <div class="comparison-mode-toggle">
        <label class="mode-label">Comparison Mode:</label>
        <div class="toggle-buttons">
          <button
            type="button"
            class="mode-button"
            class:active={comparisonMode === '2d'}
            on:click={() => comparisonMode = '2d'}
          >
            2D Difference
          </button>
          <button
            type="button"
            class="mode-button"
            class:active={comparisonMode === '3d'}
            on:click={() => comparisonMode = '3d'}
          >
            3D Overlay
          </button>
        </div>
      </div>

      <button
        type="button"
        class="button-primary compare-button"
        on:click={generateComparison}
        disabled={!selectedPlot1Id || !selectedPlot2Id || isComparing}
      >
        {isComparing ? 'Generating Comparison...' : 'Generate Comparison →'}
      </button>
    </div>

    <div class="comparison-result">
      {#if isComparing}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Generating comparison...</p>
          <small>Computing differences between plots</small>
        </div>
      {:else if comparisonData && comparisonMetadata}
        <div class="result-header">
          <h3>Comparison Result</h3>
          <div class="comparison-info">
            <div class="info-item">
              <span class="info-label">Plot 1:</span>
              <span class="info-value">{comparisonMetadata.plot1Title}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Plot 2:</span>
              <span class="info-value">{comparisonMetadata.plot2Title}</span>
            </div>
          </div>
        </div>

        <div class="comparison-plot-wrapper" class:overlay-mode={lastGeneratedMode === '3d'}>
          <PlotContainer
            data={comparisonData}
            metadata={comparisonMetadata}
            plotId="comparison-{selectedPlot1Id}-{selectedPlot2Id}"
          />
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon">⚖️</div>
          <h3>No Comparison Generated</h3>
          <p>Select two contour plots above and click "Generate Comparison" to visualize the differences between them.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .comparison-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .panel-header {
    text-align: center;
    padding: var(--spacing-lg);
    background: linear-gradient(135deg, var(--comparison-background) 0%, white 100%);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .panel-header h2 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--primary-color);
    font-weight: 700;
  }

  .panel-description {
    margin: 0;
    color: #666;
    font-size: var(--font-size-sm);
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.5;
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
    box-shadow: none;
    transform: none;
  }

  .error-close:hover {
    background: rgba(220, 38, 38, 0.1);
    transform: none;
  }

  .warning-box {
    background: var(--result-background);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: var(--spacing-lg);
    display: flex;
    gap: var(--spacing-md);
    align-items: flex-start;
  }

  .warning-icon {
    font-size: 2em;
    line-height: 1;
    opacity: 0.5;
  }

  .warning-content {
    flex: 1;
  }

  .warning-content strong {
    display: block;
    font-size: var(--font-size-lg);
    color: var(--text-color);
    margin-bottom: var(--spacing-xs);
    font-weight: 600;
  }

  .warning-content p {
    margin: 0;
    color: #666;
    font-size: var(--font-size-sm);
    line-height: 1.5;
  }

  .comparison-controls {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-sm);
  }

  .selector-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: #555;
  }

  .comparison-mode-toggle {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: var(--spacing-md);
  }

  .mode-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: #555;
  }

  .toggle-buttons {
    display: flex;
    gap: 8px;
  }

  .mode-button {
    flex: 1;
    padding: 10px 16px;
    border: 2px solid var(--border-color);
    background: white;
    color: #666;
    border-radius: 6px;
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .mode-button:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .mode-button.active {
    border-color: var(--primary-color);
    background: var(--primary-color);
    color: white;
    font-weight: 600;
  }

  .compare-button {
    width: 100%;
    font-size: var(--font-size-base);
  }

  .comparison-result {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-sm);
    min-height: 400px;
  }

  .comparison-plot-wrapper {
    width: 100%;
  }

  .comparison-plot-wrapper.overlay-mode {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Center the plot container and its contents when in overlay mode */
  .comparison-plot-wrapper.overlay-mode :global(.plot-container) {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .comparison-plot-wrapper.overlay-mode :global(.plotly-content) {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }

  .result-header {
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 2px solid var(--border-color);
  }

  .result-header h3 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--text-color);
    font-weight: 600;
  }

  .comparison-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .info-item {
    display: flex;
    gap: 8px;
    font-size: var(--font-size-sm);
  }

  .info-label {
    font-weight: 600;
    color: #666;
  }

  .info-value {
    color: var(--text-color);
  }

  .legend-box {
    background: linear-gradient(135deg, #f8f4f5 0%, #f2eeef 100%);
    border: 1px solid #e0d5d7;
    border-radius: 8px;
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .legend-box h4 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--text-color);
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: var(--font-size-sm);
    color: var(--text-color);
  }

  .legend-color {
    width: 30px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
  }

  .legend-color.red {
    background: linear-gradient(to right, #fee2e2, #dc2626);
  }

  .legend-color.blue {
    background: linear-gradient(to right, #dbeafe, #2563eb);
  }

  .legend-color.neutral {
    background: linear-gradient(to right, #f5f5f5, #e5e5e5);
  }

  .legend-color.orange {
    background: linear-gradient(to right, #fef3c7, #ea580c);
  }

  .legend-color.cyan {
    background: linear-gradient(to right, #ccfbf1, #14b8a6);
  }

  .legend-note {
    margin-top: 4px;
    font-size: 0.85em;
    color: #666;
    font-style: italic;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    gap: var(--spacing-md);
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
    color: #666;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    gap: var(--spacing-md);
    text-align: center;
  }

  .empty-icon {
    font-size: 4em;
    opacity: 0.3;
  }

  .empty-state h3 {
    margin: 0;
    color: var(--text-color);
    font-weight: 600;
  }

  .empty-state p {
    margin: 0;
    color: #666;
    max-width: 500px;
    line-height: 1.6;
    font-size: var(--font-size-sm);
  }

  @media (max-width: 768px) {
    .selector-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
