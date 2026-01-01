<script>
  import { _, locale } from 'svelte-i18n';
  import { activePlots, isPlotting, addPlot, removePlot, clearAllPlots, formatPlotData, formatContourData, findExistingPlot, plotScales, plotScalesZ, updatePlotScale, updatePlotScaleZ, plotSnrUnits, updatePlotSnrUnit, plotShowFrame, transposePlot, selectedContourPlots, showContourSelection, togglePlotSelection, clearPlotSelection, isPlotSelected, getSelectedContourPlots, pendingMerge, confirmMerge, confirmNewFigure, cancelPendingMerge } from '../../stores/plotting.js';
  import { getPlotData, getContourData, mapPlotParams, handleApiError, computeExponents } from '../../utils/api.js';
  import { shouldShowPlotTutorial, shouldShowContourComparisonTutorial, startSpotlightTutorial, tutorialState } from '../../stores/tutorial.js';
  import { currentColorTheme } from '../../stores/theme.js';
  import { docHover } from '../../actions/documentation.js';
  import PlottingControls from './PlottingControls.svelte';
  import PlotContainer from './PlotContainer.svelte';
  import PlotExporter from './PlotExporter.svelte';
  import ComparisonActionBar from './ComparisonActionBar.svelte';
  import MergeConfirmModal from './MergeConfirmModal.svelte';

  export let onNavigateToParams = () => {};

  // Reactive translated axis labels - these update when locale changes
  $: axisLabels = {
    M: $_('plotAxis.modulationSize'),
    SNR_dB: $_('plotAxis.snrDb'),
    SNR_linear: $_('plotAxis.snrLinear'),
    R: $_('plotAxis.rate'),
    n: $_('plotAxis.codeLength'),
    N: $_('plotAxis.quadrature'),
    threshold: $_('plotAxis.threshold'),
    shaping_param: $_('plotAxis.shapingParam'),
    error_probability: $_('plotAxis.errorProbability'),
    error_exponent: $_('plotAxis.errorExponent'),
    rho: $_('plotAxis.optimalRho'),
    mutual_information: $_('plotAxis.mutualInformation'),
    cutoff_rate: $_('plotAxis.cutoffRate')
  };

  // Helper function to get translated axis label (accepts labels param for reactivity)
  function getTranslatedAxisLabel(varName, snrUnit = 'dB', labels = axisLabels) {
    if (!varName) return varName;
    if (varName === 'SNR') {
      return snrUnit === 'dB' ? labels.SNR_dB : labels.SNR_linear;
    }
    return labels[varName] || varName;
  }

  // Helper function to generate translated plot title (accepts labels param for reactivity)
  function getTranslatedPlotTitle(plot, labels = axisLabels) {
    const snrUnit = plot.plotParams?.snrUnit || plot.metadata?.snrUnit || 'dB';

    if (plot.type === 'contour') {
      const zVar = plot.metadata.zVar || plot.metadata.yVar || plot.plotParams?.yVar;
      const x1Var = plot.metadata.xVar || plot.plotParams?.xVar;
      const x2Var = plot.metadata.xVar2 || plot.metadata.x2Var || plot.plotParams?.xVar2;
      return `${getTranslatedAxisLabel(zVar, snrUnit, labels)} vs ${getTranslatedAxisLabel(x1Var, snrUnit, labels)} vs ${getTranslatedAxisLabel(x2Var, snrUnit, labels)}`;
    } else {
      const yVar = plot.metadata.yVar || plot.plotParams?.yVar;
      const xVar = plot.metadata.xVar || plot.plotParams?.xVar;
      return `${getTranslatedAxisLabel(yVar, snrUnit, labels)} vs ${getTranslatedAxisLabel(xVar, snrUnit, labels)}`;
    }
  }

  let errorMessage = '';
  let lastAddedPlotId = null;
  let plotElementRefs = new Map(); // Store plot element references by plotId
  let hoveredSeries = new Map(); // Track hovered series by plotId -> seriesIndex
  let transposeDropdownOpen = new Map(); // Track which transpose dropdowns are open

  // Sticky header tracking
  let plotsHeaderEl = null;
  let controlsSectionEl = null;
  let plotsSectionEl = null;
  let isHeaderSticky = false;
  let headerOriginalTop = -1;
  let headerHeight = 0;
  let headerWidth = 0;
  let headerLeft = 0;
  let headerMarginBottom = 0;

  // Reactive computation for selected contour plots
  $: selectedPlots = getSelectedContourPlots($activePlots, $selectedContourPlots);
  $: selectedCount = selectedPlots.length;

  // Track previous value of showContourSelection to detect when it becomes true
  let prevShowContourSelection = false;
  $: {
    if ($showContourSelection && !prevShowContourSelection && $shouldShowContourComparisonTutorial) {
      // Delay to let the UI update first
      setTimeout(() => triggerContourComparisonTutorial(), 500);
    }
    prevShowContourSelection = $showContourSelection;
  }

  // Reactive: show merge modal when pendingMerge is set
  $: showMergeModal = $pendingMerge !== null;
  $: existingPlotInfo = $pendingMerge ? getPlotInfo($pendingMerge.existingPlot) : null;
  $: newPlotInfo = $pendingMerge ? getPlotInfo($pendingMerge.newPlotData) : null;

  // Helper to resolve 'emphasis' color to the actual CSS variable value
  function resolveColor(color) {
    if (color === 'emphasis') {
      return $currentColorTheme?.primary || '#C8102E';
    }
    return color;
  }

  // Helper to extract plot info for modal display
  function getPlotInfo(plotData) {
    if (!plotData) return null;
    const xAxis = plotData.plotParams?.xVar || plotData.metadata?.xVar || 'X';
    const yAxis = plotData.plotParams?.yVar || plotData.metadata?.yVar || 'Y';
    const title = plotData.metadata?.title || `${yAxis} vs ${xAxis}`;
    const seriesCount = plotData.series?.length || 1;
    return { title, xAxis, yAxis, seriesCount };
  }

  // Handle merge modal decisions
  function handleMerge() {
    const targetId = confirmMerge();
    if (targetId) {
      lastAddedPlotId = targetId;
      scrollToPlot(targetId);
    }
  }

  function handleNewFigure() {
    const targetId = confirmNewFigure();
    if (targetId) {
      lastAddedPlotId = targetId;
      scrollToPlot(targetId);
    }
  }

  function handleCancelMerge() {
    cancelPendingMerge();
  }

  // Get the reference plot (first selected) to determine compatible axes
  $: referencePlot = selectedPlots.length > 0 ? selectedPlots[0] : null;

  // Validation for comparison (exactly 2 plots with matching axes)
  $: canCompare = selectedCount === 2 && arePlotsCompatible(selectedPlots[0], selectedPlots[1]);
  $: comparisonErrorMsg = selectedCount !== 2
    ? $_('plotItem.selectExactly2')
    : !canCompare
      ? $_('plotItem.incompatibleAxes')
      : '';

  // Validation for benchmark (2+ plots with ALL matching axes)
  $: allAxesMatch = selectedCount >= 2 && selectedPlots.every(plot =>
    arePlotsCompatible(selectedPlots[0], plot)
  );
  $: canBenchmark = selectedCount >= 2 && allAxesMatch;
  $: benchmarkErrorMsg = selectedCount < 2
    ? $_('plotItem.select2OrMore')
    : !allAxesMatch
      ? $_('plotItem.allAxesMustMatch')
      : '';

  // Check if a plot is compatible with the reference plot (for disabling checkboxes)
  function isPlotCompatibleWithReference(plot) {
    if (!referencePlot) return true; // No reference, all compatible
    return arePlotsCompatible(referencePlot, plot);
  }

  // Get all contour plots compatible with the reference plot
  function getCompatibleContourPlots() {
    if (!referencePlot) return [];
    return $activePlots.filter(plot =>
      plot.type === 'contour' &&
      !plot.metadata?.comparisonType &&
      arePlotsCompatible(referencePlot, plot)
    );
  }

  // Select all compatible contour plots
  function selectAllCompatible() {
    const compatible = getCompatibleContourPlots();
    selectedContourPlots.set(new Set(compatible.map(p => p.plotId)));
  }

  // Generate Table data with all 3 Y variables
  async function getTableData(plotParams, simulationParams) {
    const [xMin, xMax] = plotParams.xRange;
    const numPoints = plotParams.points;
    const xVar = plotParams.xVar;

    // Generate X values
    const xValues = [];
    const step = (xMax - xMin) / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
      let xVal = xMin + i * step;
      // Round to integer if n (code length) is on X axis
      if (xVar === 'n') {
        xVal = Math.round(xVal);
      }
      xValues.push(xVal);
    }

    // Make API calls for each X value and collect all 3 Y values
    const tableData = [];
    for (let i = 0; i < xValues.length; i++) {
      const xVal = xValues[i];

      // Build params with X variable set
      const params = {
        M: simulationParams.M,
        typeModulation: simulationParams.typeModulation,
        SNR: simulationParams.SNR,
        R: simulationParams.R,
        N: simulationParams.N,
        n: simulationParams.n,
        threshold: simulationParams.threshold,
        distribution: plotParams.distribution || 'uniform',
        shaping_param: plotParams.shaping_param || 0
      };

      // Override the X variable with the current value
      if (xVar === 'SNR') {
        // Convert from dB to linear if using dB units
        if (plotParams.snrUnit === 'dB') {
          params.SNR = Math.pow(10, xVal / 10);
        } else {
          params.SNR = xVal;
        }
      } else if (xVar === 'M') {
        params.M = xVal;
      } else if (xVar === 'R') {
        params.R = xVal;
      } else if (xVar === 'n') {
        params.n = Math.round(xVal);
      } else if (xVar === 'N') {
        params.N = xVal;
      } else if (xVar === 'threshold') {
        params.threshold = xVal;
      } else if (xVar === 'shaping_param') {
        params.shaping_param = xVal;
      }

      const result = await computeExponents(params);

      tableData.push({
        x: xVal,
        error_exponent: parseFloat(result.error_exponent),
        error_probability: parseFloat(result.error_probability),
        rho: parseFloat(result.optimal_rho),
        mutual_information: parseFloat(result.mutual_information),
        cutoff_rate: parseFloat(result.cutoff_rate)
      });
    }

    return tableData;
  }

  // Generate SNR (dB) plot with points equispaced in dB
  async function getPlotDataSNR_dB(plotParams, simulationParams) {
    const [minDB, maxDB] = plotParams.xRange;
    const numPoints = plotParams.points;

    // Generate points equispaced in dB
    const dbValues = [];
    const step = (maxDB - minDB) / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
      dbValues.push(minDB + i * step);
    }

    // Convert dB to linear for API calls
    const linearValues = dbValues.map(db => Math.pow(10, db / 10));

    // Make API calls for each SNR value
    const yValues = [];
    for (let i = 0; i < linearValues.length; i++) {
      const params = {
        M: simulationParams.M,
        typeModulation: simulationParams.typeModulation,
        SNR: linearValues[i],
        R: simulationParams.R,
        N: simulationParams.N,
        n: simulationParams.n,
        threshold: simulationParams.threshold,
        distribution: plotParams.distribution || 'uniform',
        shaping_param: plotParams.shaping_param || 0
      };

      const result = await computeExponents(params);

      // Extract the appropriate y value based on plotParams.yVar
      let yValue;
      if (plotParams.yVar === 'error_probability') {
        yValue = parseFloat(result.error_probability);
      } else if (plotParams.yVar === 'error_exponent') {
        yValue = parseFloat(result.error_exponent);
      } else if (plotParams.yVar === 'rho') {
        yValue = parseFloat(result.optimal_rho);
      } else {
        yValue = 0;
      }

      yValues.push(yValue);
    }

    // Return data with dB x-values
    return {
      x_values: dbValues,
      y_values: yValues
    };
  }

  async function handlePlot(plotParams, simulationParams) {
    try {
      errorMessage = '';

      // Check if plot with identical parameters already exists
      const existingPlotId = findExistingPlot(null, plotParams, simulationParams);
      if (existingPlotId) {
        // Instead of showing error, scroll to existing plot
        scrollToPlot(existingPlotId);
        return;
      }

      isPlotting.set(true);

      let rawData, formattedData;

      if (plotParams.plotType === 'contour' || plotParams.plotType === 'surface') {
        const mappedParams = mapPlotParams(plotParams, simulationParams);
        rawData = await getContourData(mappedParams);
        // Set contourMode based on plotType: 'contour' = 2D, 'surface' = 3D
        const contourMode = plotParams.plotType === 'surface' ? '3d' : '2d';
        formattedData = formatContourData(rawData, {
          x1Var: plotParams.xVar,
          x2Var: plotParams.xVar2,
          yVar: plotParams.yVar,
          snrUnit: plotParams.snrUnit || 'dB',
          contourMode: contourMode
        });
      } else if (plotParams.plotType === 'rawData') {
        // Table mode - fetch all 3 Y variables
        const tableData = await getTableData(plotParams, simulationParams);

        // Get X label based on xVar
        const xLabels = {
          'M': 'M',
          'SNR': plotParams.snrUnit === 'dB' ? 'SNR (dB)' : 'SNR (linear)',
          'R': 'R',
          'n': 'n',
          'N': 'N',
          'threshold': $_('plotting.threshold'),
          'shaping_param': 'β'
        };

        formattedData = {
          type: 'rawData',
          metadata: {
            type: 'rawData',
            xVar: plotParams.xVar,
            xLabel: xLabels[plotParams.xVar] || plotParams.xVar,
            snrUnit: plotParams.snrUnit || 'linear',  // Pass SNR unit for table display
            isMultiY: true,  // Flag to indicate this has all Y variables
            // Translated table column headers
            tableHeaders: {
              errorExponent: $_('plotting.errorExponent'),
              errorProbability: $_('plotting.errorProbability'),
              optimalRho: $_('plotting.optimalRho'),
              mutualInformation: $_('plotting.mutualInformation'),
              cutoffRate: $_('plotting.cutoffRate')
            }
          }
        };
        rawData = { tableData };  // Store as tableData for later conversion
      } else {
        // Standard line plot - backend handles SNR spacing based on snrUnit
        const mappedParams = mapPlotParams(plotParams, simulationParams);
        rawData = await getPlotData(mappedParams);

        formattedData = formatPlotData(rawData, {
          xVar: plotParams.xVar,
          yVar: plotParams.yVar,
          lineColor: plotParams.lineColor,
          lineType: plotParams.lineType,
          snrUnit: plotParams.snrUnit || 'dB'
        });
      }

      // Create plot data with converted arrays
      const convertedData = convertToPlotData(rawData, plotParams.plotType);

      console.log('[PlottingPanel] Plot data prepared:', {
        plotType: plotParams.plotType,
        rawDataKeys: Object.keys(rawData),
        convertedDataLength: convertedData?.length,
        convertedDataSample: convertedData?.slice(0, 3),
        formattedMetadata: formattedData.metadata
      });

      const plotData = {
        ...formattedData,
        data: convertedData,
        plotParams: { ...plotParams },
        simulationParams: { ...simulationParams },
        timestamp: Date.now()
      };

      console.log('[PlottingPanel] Final plotData being stored:', {
        type: plotData.type,
        metadataType: plotData.metadata?.type,
        hasData: !!plotData.data,
        dataLength: plotData.data?.length
      });

      const targetPlotId = addPlot(plotData);

      // Auto-scroll to the newly added or updated plot
      if (targetPlotId) {
        lastAddedPlotId = targetPlotId;
        scrollToPlot(lastAddedPlotId);

        // Trigger tutorial for first-time users after their first plot
        triggerPlotTutorial(targetPlotId);
      }

    } catch (error) {
      const errorInfo = handleApiError(error, 'Failed to generate plot');
      errorMessage = errorInfo.message;
      console.error('Plotting error:', error);
    } finally {
      isPlotting.set(false);
    }
  }

  function convertToPlotData(rawData, plotType) {
    if (plotType === 'contour' || plotType === 'surface') {
      // Convert contour/surface data to array of points
      const points = [];
      const x1Values = rawData.x1 || [];
      const x2Values = rawData.x2 || [];
      const zValues = rawData.z || [];

      // Assuming z is a 2D array [x1_index][x2_index]
      for (let i = 0; i < x1Values.length; i++) {
        for (let j = 0; j < x2Values.length; j++) {
          points.push({
            x1: x1Values[i],
            x2: x2Values[j],
            z: zValues[i] ? zValues[i][j] : 0
          });
        }
      }
      return points;
    } else if (plotType === 'rawData' && rawData.tableData) {
      // Table mode with all 3 Y variables
      return rawData.tableData;
    } else {
      // Convert line plot data
      const xValues = rawData.x_values || rawData.x || [];
      const yValues = rawData.y_values || rawData.y || [];

      return xValues.map((x, i) => ({
        x: x,
        y: yValues[i] || 0
      }));
    }
  }

  function handleRemovePlot(plotId) {
    removePlot(plotId);
  }

  function clearError() {
    errorMessage = '';
  }

  function scrollToPlot(plotId) {
    if (!plotId) return;

    // Use a slight delay to ensure DOM has updated
    setTimeout(() => {
      const plotElement = document.querySelector(`[data-plot-id="${plotId}"]`);
      if (plotElement) {
        plotElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        // Briefly highlight the plot
        plotElement.classList.add('plot-highlight');

        setTimeout(() => {
          plotElement.classList.remove('plot-highlight');
        }, 2000);
      }
    }, 200);
  }

  // Trigger the plot controls tutorial for first-time users
  function triggerPlotTutorial(plotId) {
    if (!$shouldShowPlotTutorial) return;

    // Wait for the plot to be rendered and scrolled
    setTimeout(() => {
      const tutorialSteps = [
        {
          // Highlight both X and Y scale buttons together (without transpose in between)
          selectors: [
            `[data-plot-id="${plotId}"] [data-tutorial="scale-x"]`,
            `[data-plot-id="${plotId}"] [data-tutorial="scale-y"]`
          ],
          title: $_('tutorial.stepAxisScales'),
          description: $_('tutorial.stepAxisScalesDesc'),
          padding: 6
        },
        {
          selector: `[data-plot-id="${plotId}"] [data-tutorial="transpose"]`,
          title: $_('tutorial.stepTranspose'),
          description: $_('tutorial.stepTransposeDesc'),
          padding: 6
        },
        {
          selector: `[data-plot-id="${plotId}"] [data-tutorial="export"]`,
          title: $_('tutorial.stepExport'),
          description: $_('tutorial.stepExportDesc'),
          padding: 6
        },
        {
          selector: `[data-plot-id="${plotId}"] [data-tutorial="remove"]`,
          title: $_('tutorial.stepRemove'),
          description: $_('tutorial.stepRemoveDesc'),
          padding: 6
        }
      ];

      startSpotlightTutorial(tutorialSteps);
    }, 1500); // Wait for scroll animation and render
  }

  // Trigger the contour comparison tutorial when selection boxes appear
  function triggerContourComparisonTutorial() {
    if (!$shouldShowContourComparisonTutorial) return;

    // Find the checkbox elements
    const checkboxes = document.querySelectorAll('[data-tutorial="contour-checkbox"]');
    if (checkboxes.length < 2) return; // Need at least 2 checkboxes

    // Get the first two contour plots and select them for the tutorial demo
    const contourPlots = $activePlots.filter(p => p.type === 'contour' && !p.metadata?.comparisonType);
    if (contourPlots.length >= 2) {
      // Select first two contour plots to show checkmarks in tutorial
      if (!$selectedContourPlots.has(contourPlots[0].plotId)) {
        togglePlotSelection(contourPlots[0].plotId);
      }
      if (!$selectedContourPlots.has(contourPlots[1].plotId)) {
        togglePlotSelection(contourPlots[1].plotId);
      }
    }

    // Get selectors for the first two checkboxes (from different plots)
    const tutorialSteps = [
      {
        selectors: Array.from(checkboxes).slice(0, 2).map((_, i) => `[data-tutorial="contour-checkbox"]:nth-of-type(${i + 1})`),
        selector: '[data-tutorial="contour-checkbox"]', // Fallback to first one
        title: $_('tutorial.stepContourComparison'),
        description: $_('tutorial.stepContourComparisonDesc'),
        padding: 8,
        preferredPosition: 'right'
      }
    ];

    tutorialState.markContourComparisonTutorialSeen();
    startSpotlightTutorial(tutorialSteps);
  }

  function exportPlot(plot, format = 'svg') {
    console.log('🎯 Initiating export for plot:', plot.plotId, 'Format:', format);
    // Export functionality is now handled directly by PlotExporter component
  }

  // Get dynamic X label based on SNR unit (for SNR plots)
  function getDynamicXLabel(plot) {
    const xVar = plot.metadata.xVar || plot.plotParams?.xVar;

    if (xVar === 'SNR') {
      // For multi-series plots, check if all series have the same SNR unit
      if (plot.isMultiSeries && plot.series) {
        const units = plot.series.map(s => s.plotParams?.snrUnit || s.metadata?.snrUnit || 'dB');
        const allSameUnit = units.every(u => u === units[0]);

        if (allSameUnit) {
          return units[0] === 'dB' ? 'SNR (dB)' : 'SNR (linear)';
        } else {
          // Mixed units - just show "SNR" since backend returns linear values for both
          return 'SNR';
        }
      }

      // Single series - use its unit
      const snrUnit = plot.plotParams?.snrUnit || plot.metadata?.snrUnit || 'dB';
      return snrUnit === 'dB' ? 'SNR (dB)' : 'SNR (linear)';
    }

    return plot.metadata.xLabel || 'X';
  }

  // Generate series labels matching the plot legend (same logic as PlotContainer)
  // Extract global parameters for a plot
  function getGlobalParams(plot) {
    if (!plot) return [];

    const parts = [];
    // For contour plots, exclude all three axes (X1, X2, and Z/Y)
    const excludedParams = new Set([
      plot.metadata?.xVar,
      plot.metadata?.yVar,
      plot.metadata?.xVar2,
      plot.metadata?.x2Var,
      plot.metadata?.zVar
    ]);

    let M, typeModulation, SNR, R, n, N, threshold, snrUnit;

    // For multi-series, get common params
    if (plot.isMultiSeries && plot.series) {
      // Get common M
      const MValues = plot.series.map(s => s.simulationParams?.M);
      const uniqueM = [...new Set(MValues)];
      if (uniqueM.length === 1 && uniqueM[0] !== undefined && !excludedParams.has('M')) {
        M = uniqueM[0];
      }

      // Get common typeModulation
      const typeValues = plot.series.map(s => s.simulationParams?.typeModulation);
      const uniqueType = [...new Set(typeValues)];
      if (uniqueType.length === 1 && uniqueType[0] !== undefined && !excludedParams.has('typeModulation')) {
        typeModulation = uniqueType[0];
      }

      // Get common SNR value AND unit (must both be common to show in global params)
      // SNR=10 dB and SNR=10 linear are DIFFERENT values, so check both together
      const SNRValues = plot.series.map(s => s.simulationParams?.SNR);
      const snrUnitValues = plot.series.map(s => s.simulationParams?.SNRUnit);
      const uniqueSNR = [...new Set(SNRValues)];
      const uniqueSnrUnit = [...new Set(snrUnitValues)];

      // Only consider SNR "common" if BOTH value and unit are the same across all series
      if (uniqueSNR.length === 1 && uniqueSNR[0] !== undefined &&
          uniqueSnrUnit.length === 1 && uniqueSnrUnit[0] !== undefined &&
          !excludedParams.has('SNR')) {
        SNR = uniqueSNR[0];
        snrUnit = uniqueSnrUnit[0];
      }

      // Get common R
      const RValues = plot.series.map(s => s.simulationParams?.R);
      const uniqueR = [...new Set(RValues)];
      if (uniqueR.length === 1 && uniqueR[0] !== undefined && !excludedParams.has('R')) {
        R = uniqueR[0];
      }

      // Get common n
      const nValues = plot.series.map(s => s.simulationParams?.n);
      const uniqueN = [...new Set(nValues)];
      if (uniqueN.length === 1 && uniqueN[0] !== undefined && !excludedParams.has('n')) {
        n = uniqueN[0];
      }

      // Check distribution
      const distributions = plot.series.map(s => s.plotParams?.distribution);
      const uniqueDist = [...new Set(distributions)];
      if (uniqueDist.length === 1 && uniqueDist[0] && uniqueDist[0] !== 'uniform') {
        parts.push(uniqueDist[0] === 'maxwell-boltzmann' ? 'MB' : uniqueDist[0]);

        if (uniqueDist[0] === 'maxwell-boltzmann') {
          const shapingParams = plot.series.map(s => s.plotParams?.shaping_param);
          const uniqueShaping = [...new Set(shapingParams)];
          if (uniqueShaping.length === 1 && uniqueShaping[0] !== undefined) {
            parts.push(`β=${uniqueShaping[0].toFixed(1)}`);
          }
        }
      }
    } else {
      // Single series
      const simParams = plot.simulationParams || {};
      const plotParams = plot.plotParams || {};

      if (!excludedParams.has('M')) M = simParams.M;
      if (!excludedParams.has('typeModulation')) typeModulation = simParams.typeModulation;
      if (!excludedParams.has('SNR')) SNR = simParams.SNR;
      if (!excludedParams.has('R')) R = simParams.R;
      if (!excludedParams.has('n')) n = simParams.n;
      // Use simulation SNRUnit (not plot snrUnit) when SNR is a fixed parameter
      snrUnit = simParams.SNRUnit || plot.metadata?.SNRUnit;

      if (plotParams.distribution && plotParams.distribution !== 'uniform') {
        parts.push(plotParams.distribution === 'maxwell-boltzmann' ? 'MB' : plotParams.distribution);
        if (plotParams.distribution === 'maxwell-boltzmann' && plotParams.shaping_param !== undefined) {
          parts.push(`β=${plotParams.shaping_param.toFixed(1)}`);
        }
      }
    }

    // Format: "N-MOD" (e.g., "16-PAM")
    if (M !== undefined && typeModulation !== undefined) {
      parts.unshift(`${M}-${typeModulation}`);
    } else if (M !== undefined) {
      parts.unshift(`M=${M}`);
    } else if (typeModulation !== undefined) {
      parts.unshift(typeModulation);
    }

    // Format: "SNR: X dB" or "SNR: X"
    if (SNR !== undefined) {
      const snrLabel = snrUnit === 'dB' ? `SNR: ${SNR} dB` : `SNR: ${SNR}`;
      parts.push(snrLabel);
    }

    // Format: "R=X" with decimals matching precision
    if (R !== undefined) {
      // Determine number of decimal places
      const rStr = R.toString();
      const decimalIndex = rStr.indexOf('.');
      const decimals = decimalIndex >= 0 ? rStr.length - decimalIndex - 1 : 0;
      parts.push(`R=${R.toFixed(Math.max(decimals, 1))}`);
    }

    // Add n if present
    if (n !== undefined) {
      parts.push(`n=${n}`);
    }

    // Add comparison type indicator if this is a comparison/benchmark plot
    if (plot.metadata?.comparisonType) {
      const typeLabel = plot.metadata.comparisonType === 'comparison'
        ? $_('plottingPanel.comparisonPlot')
        : $_('plottingPanel.benchmarkPlot');
      parts.push(typeLabel);
    }

    return parts;
  }

  function getSeriesLabel(seriesData, index, xVar, yVar) {
    if (!seriesData || seriesData.length === 0) return `${$_('plotItem.series')} ${index + 1}`;

    const basicSimulationParams = ['M', 'typeModulation', 'SNR', 'R', 'n'];
    const basicPlotParams = ['distribution', 'shaping_param', 'snrUnit'];
    const excludedParams = new Set([xVar, yVar]);

    const availableSimParams = basicSimulationParams.filter(key => !excludedParams.has(key));
    const availablePlotParams = basicPlotParams.filter(key => !excludedParams.has(key));

    // Find parameters that vary
    const varyingParams = [];

    // Special handling for SNR: check if SNR value OR SNRUnit varies
    // If either varies, we need to show SNR with unit in legend
    const snrIncluded = availableSimParams.includes('SNR');
    if (snrIncluded) {
      const snrValues = seriesData.map(s => s.simulationParams?.SNR);
      const snrUnits = seriesData.map(s => s.simulationParams?.SNRUnit);
      const uniqueSNR = [...new Set(snrValues)];
      const uniqueUnits = [...new Set(snrUnits)];

      // If either SNR value or unit varies, add SNR as varying (we'll format it with unit)
      if (uniqueSNR.length > 1 || uniqueUnits.length > 1) {
        varyingParams.push({ source: 'sim', key: 'SNR' });
      }
    }

    // Check other simulation params (excluding SNR which we handled above)
    for (const key of availableSimParams) {
      if (key === 'SNR') continue; // Already handled above
      const values = seriesData.map(s => s.simulationParams?.[key]);
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length > 1) {
        varyingParams.push({ source: 'sim', key });
      }
    }

    // Check for mixed distributions
    const allDistributions = seriesData.map(s => s.plotParams?.distribution);
    const uniqueDistributions = [...new Set(allDistributions)];
    const hasMixedDistributions = uniqueDistributions.length > 1;
    const hasMB = allDistributions.some(dist => dist === 'maxwell-boltzmann');

    // Check plot params (excluding snrUnit which we handled with SNR above)
    for (const key of availablePlotParams) {
      if (key === 'snrUnit') continue; // Already handled with SNR above
      const values = seriesData.map(s => s.plotParams?.[key]);
      const uniqueValues = [...new Set(values)];

      if (key === 'shaping_param' && hasMixedDistributions && hasMB) {
        varyingParams.push({ source: 'plot', key });
        continue;
      }

      if (uniqueValues.length > 1) {
        varyingParams.push({ source: 'plot', key });
      }
    }

    if (varyingParams.length === 0) {
      const advancedParams = ['N', 'threshold'];
      const availableAdvanced = advancedParams.filter(key => !excludedParams.has(key));

      for (const key of availableAdvanced) {
        const values = seriesData.map(s => s.simulationParams?.[key]);
        const uniqueValues = [...new Set(values)];
        if (uniqueValues.length > 1) {
          varyingParams.push({ source: 'sim', key });
          break;
        }
      }
    }

    const paramDisplayNames = {
      M: 'M', typeModulation: 'Type', SNR: 'SNR', R: 'Rate', n: 'n',
      N: 'N', threshold: 'Threshold', distribution: 'Dist',
      shaping_param: 'β', snrUnit: 'SNR Unit'
    };

    if (varyingParams.length > 0) {
      const series = seriesData[index];
      const seriesDistribution = series.plotParams?.distribution;
      const labelParts = [];

      for (const param of varyingParams) {
        if (param.key === 'shaping_param' && seriesDistribution === 'uniform') {
          continue;
        }

        // Special handling for SNR: show with unit
        if (param.key === 'SNR') {
          const snrValue = series.simulationParams?.SNR;
          const snrUnit = series.simulationParams?.SNRUnit || 'dB';
          const snrLabel = snrUnit === 'dB' ? `SNR: ${snrValue} dB` : `SNR: ${snrValue}`;
          labelParts.push(snrLabel);
          continue;
        }

        const value = param.source === 'plot'
          ? series.plotParams?.[param.key]
          : series.simulationParams?.[param.key];
        const displayName = paramDisplayNames[param.key] || param.key;

        let formattedValue = value;
        if (param.key === 'threshold' && typeof value === 'number') {
          formattedValue = value.toExponential(0);
        } else if (param.key === 'shaping_param' && typeof value === 'number') {
          formattedValue = value.toFixed(1);
        } else if (param.key === 'distribution' && value === 'maxwell-boltzmann') {
          formattedValue = 'MB';
        } else if (typeof value === 'number' && value % 1 !== 0) {
          formattedValue = value.toPrecision(3);
        }

        labelParts.push(`${displayName}=${formattedValue}`);
      }

      return labelParts.join(', ');
    }

    return `${$_('plotItem.series')} ${index + 1}`;
  }

  // Handle plot element ready callback
  function handlePlotElementReady(plotId) {
    return (plotElement) => {
      plotElementRefs.set(plotId, plotElement);
      // Trigger reactive update
      plotElementRefs = plotElementRefs;
    };
  }

  // ============================================================================
  // Comparison Functions (migrated from ComparisonPanel)
  // ============================================================================

  // Get plot title for comparison
  function getComparisonPlotTitle(plot) {
    const yLabel = plot.metadata.yLabel || plot.metadata.zLabel || 'Y';
    const x1Label = plot.metadata.x1Label || 'X1';
    const x2Label = plot.metadata.x2Label || 'X2';

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

    const p1x1 = plot1.metadata.xVar || plot1.plotParams?.xVar;
    const p1x2 = plot1.metadata.xVar2 || plot1.metadata.x2Var || plot1.plotParams?.xVar2;
    const p2x1 = plot2.metadata.xVar || plot2.plotParams?.xVar;
    const p2x2 = plot2.metadata.xVar2 || plot2.metadata.x2Var || plot2.plotParams?.xVar2;

    return p1x1 === p2x1 && p1x2 === p2x2;
  }

  // Compute 2D difference comparison between two plots
  function computeDifferenceComparison(plot1, plot2) {
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
        const diff = z1 - z2; // Positive = plot1 higher
        comparisonPoints.push({
          x1: point.x1,
          x2: point.x2,
          z: diff,
          plot1Value: z1,
          plot2Value: z2
        });
      }
    });

    const metadata = {
      type: 'contour',
      x1Label: plot1.metadata.x1Label || 'X1',
      x2Label: plot1.metadata.x2Label || 'X2',
      zLabel: `Difference (${plot1.metadata.yLabel || 'Plot 1'} - ${plot2.metadata.yLabel || 'Plot 2'})`,
      xVar: plot1.metadata.xVar,
      xVar2: plot1.metadata.xVar2 || plot1.metadata.x2Var,
      yVar: 'difference',
      plot1Title: getComparisonPlotTitle(plot1),
      plot2Title: getComparisonPlotTitle(plot2),
      contourMode: plot1.metadata.contourMode || plot1.plotParams?.contourMode || '2d',
      isDivergingColorScheme: true,
      comparisonType: 'comparison' // Mark as comparison plot
    };

    return { data: comparisonPoints, metadata };
  }

  // Compute 3D overlay benchmark (2 or more plots)
  function computeBenchmarkComparison(plots) {
    if (plots.length === 2) {
      // 2-plot benchmark: use existing dual-surface logic
      return computeDualSurfaceBenchmark(plots[0], plots[1]);
    } else {
      // 3+ plots: create multi-surface benchmark
      return computeMultiSurfaceBenchmark(plots);
    }
  }

  // 2-plot benchmark
  function computeDualSurfaceBenchmark(plot1, plot2) {
    const overlayData = [
      ...plot1.data.map(point => ({ ...point, plotSource: 'plot1' })),
      ...plot2.data.map(point => ({ ...point, plotSource: 'plot2' }))
    ];

    const metadata = {
      type: 'contour',
      x1Label: plot1.metadata.x1Label || 'X1',
      x2Label: plot1.metadata.x2Label || 'X2',
      zLabel: plot1.metadata.yLabel || plot1.metadata.zLabel || 'Z',
      xVar: plot1.metadata.xVar,
      xVar2: plot1.metadata.xVar2 || plot1.metadata.x2Var,
      yVar: plot1.metadata.yVar,
      plot1Title: getComparisonPlotTitle(plot1),
      plot2Title: getComparisonPlotTitle(plot2),
      contourMode: '3d',
      isOverlayComparison: true,
      plot1Data: plot1.data,
      plot2Data: plot2.data,
      comparisonType: 'benchmark' // Mark as benchmark plot
    };

    return { data: overlayData, metadata };
  }

  // 3+ plot benchmark
  function computeMultiSurfaceBenchmark(plots) {
    const overlayData = [];
    const plotDataArrays = {};

    plots.forEach((plot, index) => {
      const sourceId = `plot${index + 1}`;
      plotDataArrays[`${sourceId}Data`] = plot.data;
      plotDataArrays[`${sourceId}Title`] = getComparisonPlotTitle(plot);

      overlayData.push(...plot.data.map(point => ({
        ...point,
        plotSource: sourceId
      })));
    });

    const firstPlot = plots[0];
    const metadata = {
      type: 'contour',
      x1Label: firstPlot.metadata.x1Label || 'X1',
      x2Label: firstPlot.metadata.x2Label || 'X2',
      zLabel: firstPlot.metadata.yLabel || firstPlot.metadata.zLabel || 'Z',
      xVar: firstPlot.metadata.xVar,
      xVar2: firstPlot.metadata.xVar2 || firstPlot.metadata.x2Var,
      yVar: firstPlot.metadata.yVar,
      contourMode: '3d',
      isOverlayComparison: true,
      isMultiSurfaceBenchmark: true, // Flag for 3+ surfaces
      plotCount: plots.length,
      ...plotDataArrays, // plot1Data, plot1Title, plot2Data, plot2Title, etc.
      comparisonType: 'benchmark'
    };

    return { data: overlayData, metadata };
  }

  // Handler for creating comparison plot
  function handleCreateComparison() {
    if (!canCompare) {
      errorMessage = comparisonErrorMsg;
      return;
    }

    try {
      const comparison = computeDifferenceComparison(selectedPlots[0], selectedPlots[1]);

      // Create plot data
      const plotData = {
        type: 'contour',
        data: comparison.data,
        metadata: comparison.metadata,
        plotParams: { ...selectedPlots[0].plotParams, contourMode: comparison.metadata.contourMode },
        simulationParams: { ...selectedPlots[0].simulationParams },
        timestamp: Date.now()
      };

      addPlot(plotData);
      clearPlotSelection();
      errorMessage = '';
    } catch (error) {
      errorMessage = error.message || 'Failed to create comparison';
      console.error('Comparison error:', error);
    }
  }

  // Handler for creating benchmark plot
  function handleCreateBenchmark() {
    if (!canBenchmark) {
      errorMessage = 'Select 2 or more plots for benchmark';
      return;
    }

    try {
      const benchmark = computeBenchmarkComparison(selectedPlots);

      const plotData = {
        type: 'contour',
        data: benchmark.data,
        metadata: benchmark.metadata,
        plotParams: { ...selectedPlots[0].plotParams, contourMode: '3d' },
        simulationParams: { ...selectedPlots[0].simulationParams },
        timestamp: Date.now()
      };

      addPlot(plotData);
      clearPlotSelection();
      errorMessage = '';
    } catch (error) {
      errorMessage = error.message || 'Failed to create benchmark';
      console.error('Benchmark error:', error);
    }
  }

  // Close all transpose dropdowns when clicking outside
  function handleClickOutside() {
    transposeDropdownOpen.forEach((value, key) => {
      if (value) {
        transposeDropdownOpen.set(key, false);
      }
    });
    transposeDropdownOpen = transposeDropdownOpen;
  }

  // Select all contour plots (or all compatible ones if reference exists)
  function handleSelectAll() {
    if (referencePlot) {
      // If there's a reference plot, select all compatible plots
      selectAllCompatible();
    } else {
      // Otherwise, select all contour plots that aren't comparison plots
      const allContourPlots = $activePlots.filter(plot =>
        plot.type === 'contour' && !plot.metadata?.comparisonType
      );
      selectedContourPlots.set(new Set(allContourPlots.map(p => p.plotId)));
    }
  }

  // Download all plots as PNG images
  async function handleDownloadAll() {
    for (let i = 0; i < $activePlots.length; i++) {
      const plot = $activePlots[i];
      await downloadPlot(plot, i);
      // Add delay between downloads to avoid browser blocking
      if (i < $activePlots.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }

  // Download a single plot as PNG
  async function downloadPlot(plot, index) {
    try {
      const plotElement = document.querySelector(`[data-plot-id="${plot.plotId}"] .plot-container`);
      if (!plotElement) {
        console.error('Plot element not found for', plot.plotId);
        return;
      }

      // Dynamic import of html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(plotElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const plotType = plot.type === 'contour' ? 'contour' : 'line';
      const filename = `EPCalculator_${plotType}_${index + 1}_${timestamp}.png`;

      // Download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Failed to download plot:', error);
    }
  }

  // Update header measurements
  function updateHeaderMeasurements() {
    if (!plotsHeaderEl) return;
    const rect = plotsHeaderEl.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(plotsHeaderEl);
    headerOriginalTop = rect.top + window.scrollY;
    headerHeight = rect.height;

    // Calculate sticky width: from right of controls-section to right of plots-section
    if (controlsSectionEl && plotsSectionEl) {
      const controlsRect = controlsSectionEl.getBoundingClientRect();
      const plotsRect = plotsSectionEl.getBoundingClientRect();
      headerLeft = plotsRect.left;
      headerWidth = plotsRect.right - plotsRect.left;
    } else {
      // Fallback to original behavior
      headerWidth = rect.width;
      headerLeft = rect.left;
    }

    headerMarginBottom = parseFloat(computedStyle.marginBottom) || 0;
  }

  // Sticky header scroll handler
  function handleScroll() {
    if (!plotsHeaderEl) return;

    // Get the original position, dimensions on first scroll
    if (headerOriginalTop < 0) {
      updateHeaderMeasurements();
    }

    // Check if we've scrolled past the bottom of the original header
    const scrollTop = window.scrollY;
    const headerBottom = headerOriginalTop + headerHeight;
    const shouldBeSticky = scrollTop > headerBottom;

    if (shouldBeSticky !== isHeaderSticky) {
      isHeaderSticky = shouldBeSticky;
    }
  }

  // Update original position and dimensions when plots change or element mounts
  $: if (plotsHeaderEl && controlsSectionEl && plotsSectionEl) {
    setTimeout(() => {
      updateHeaderMeasurements();
    }, 0);
  }

  // Compute the content padding style (header height + original margin-bottom)
  $: contentPaddingStyle = isHeaderSticky ? `padding-top: ${headerHeight + headerMarginBottom}px;` : '';

  // Handle window resize to update sticky header dimensions
  function handleResize() {
    if (isHeaderSticky) {
      updateHeaderMeasurements();
    }
  }
</script>

<svelte:window on:click={handleClickOutside} on:scroll={handleScroll} on:resize={handleResize} />

<div class="plotting-panel">
  {#if errorMessage}
    <div class="error-banner">
      <div class="error-content">
        <strong>{$_('plottingPanel.plottingError')}:</strong>
        {errorMessage}
      </div>
      <button type="button" class="error-close" on:click={clearError}>×</button>
    </div>
  {/if}

  <div class="panel-content">
    <!-- Plotting Controls -->
    <div class="controls-section" bind:this={controlsSectionEl}>
      <PlottingControls
        onPlot={handlePlot}
        disabled={$isPlotting}
        onNavigateToParams={onNavigateToParams}
      />
    </div>

    <!-- Plots Display -->
    <div class="plots-section" bind:this={plotsSectionEl}>
      {#if $activePlots.length > 0}
        <!-- Placeholder to maintain layout when header is fixed -->
        {#if isHeaderSticky}
          <div class="plots-header-placeholder" style="height: {headerHeight}px;"></div>
        {/if}

        <div
          class="plots-header"
          class:sticky={isHeaderSticky}
          bind:this={plotsHeaderEl}
          style={isHeaderSticky ? `width: ${headerWidth}px; left: ${headerLeft}px;` : ''}
        >
          <h3>{$_('plottingPanel.generatedPlots')}</h3>
          <div class="plots-actions">
            {#if $showContourSelection}
              <button
                type="button"
                class="button-secondary"
                on:click={handleSelectAll}
                title={$_('plotting.selectAll')}
              >
                {$_('plotting.selectAll')}
              </button>
            {/if}
            <button
              type="button"
              class="button-secondary"
              use:docHover={{ key: 'download-all', position: 'bottom' }}
              on:click={handleDownloadAll}
              title={$_('plotting.downloadAll')}
            >
              {$_('plotting.downloadAll')}
            </button>
            <button
              type="button"
              class="button-secondary"
              use:docHover={{ key: 'clear-all', position: 'bottom' }}
              on:click={clearAllPlots}
            >
              {$_('plottingPanel.clearAll')}
            </button>
          </div>
        </div>
      {/if}

      <div class="plots-content" style={contentPaddingStyle}>
        {#if $isPlotting}
          <div class="loading-state">
            <div class="spinner"></div>
            <p>{$_('plottingPanel.generatingPlot')}</p>
            <small>{$_('plottingPanel.generatingHint')}</small>
          </div>
        {:else if $activePlots.length > 0}
          <div class="plots-grid">
            {#each $activePlots as plot (plot.plotId)}
              <div class="plot-item" data-plot-id={plot.plotId} class:selected={$selectedContourPlots.has(plot.plotId)}>
                <div class="plot-header">
                  <div class="plot-info">
                    <h4 class="plot-title">
                      {getTranslatedPlotTitle(plot, axisLabels)}
                    </h4>
                    {#if getGlobalParams(plot).length > 0}
                      <div class="plot-params-line">
                        {#if $showContourSelection && plot.type === 'contour' && !plot.metadata?.comparisonType}
                          {@const isCompatible = isPlotCompatibleWithReference(plot)}
                          {@const isDisabled = !isCompatible && referencePlot !== null}
                          <label
                            class="plot-select-label-inline"
                            class:disabled={isDisabled}
                            title={isDisabled ? $_('plotItem.incompatibleWithSelected') : $_('plotItem.selectForComparison')}
                            data-tutorial="contour-checkbox"
                          >
                            <input
                              type="checkbox"
                              class="plot-select-checkbox"
                              checked={$selectedContourPlots.has(plot.plotId)}
                              disabled={isDisabled}
                              on:change={() => togglePlotSelection(plot.plotId)}
                            />
                            <span class="checkbox-icon-inline">
                              {#if $selectedContourPlots.has(plot.plotId)}
                                ✓
                              {/if}
                            </span>
                          </label>
                        {/if}
                        {getGlobalParams(plot).join(' • ')}
                      </div>
                    {/if}
                  </div>
                  <div class="plot-controls-header">
                    {#if true}
                      {@const currentScale = $plotScales.get(plot.plotId) || 'linear'}
                      {@const currentScaleZ = $plotScalesZ.get(plot.plotId) || 'linear'}
                      {@const currentSnrUnit = $plotSnrUnits.get(plot.plotId) || 'dB'}
                      {@const isLogX = currentScale === 'logX' || currentScale === 'logLog'}
                      {@const isLogY = currentScale === 'logY' || currentScale === 'logLog'}
                      {@const isLogZ = currentScaleZ === 'log'}
                      {@const isContour = plot.type === 'contour'}

                      <!-- For line plots: check xVar and yVar -->
                      {@const xVar = plot.metadata.xVar || plot.plotParams?.xVar}
                      {@const yVar = plot.metadata.yVar || plot.plotParams?.yVar}
                      {@const isSNRonX = xVar === 'SNR'}
                      {@const isSNRonY = yVar === 'SNR'}

                      <!-- For contour plots: X1 is stored as xVar, X2 is stored as xVar2/x2Var, Z is stored as zVar/yVar -->
                      {@const x1Var = plot.metadata.xVar || plot.plotParams?.xVar}
                      {@const x2Var = plot.metadata.xVar2 || plot.metadata.x2Var || plot.plotParams?.xVar2}
                      {@const zVar = plot.metadata.zVar || plot.metadata.yVar || plot.plotParams?.yVar}
                      {@const isSNRonX1 = x1Var === 'SNR'}
                      {@const isSNRonX2 = x2Var === 'SNR'}
                      {@const isSNRonZ = zVar === 'SNR'}
                      {@const is3DContour = isContour && (plot.metadata.contourMode === '3d' || plot.plotParams?.contourMode === '3d')}
                      {@const hasSNR = isContour ? (isSNRonX1 || isSNRonX2 || (is3DContour && isSNRonZ)) : (isSNRonX || isSNRonY)}

                      {#if !isContour}
                        <!-- Regular plot controls -->
                        <button
                          type="button"
                          class="button-secondary log-toggle"
                          data-tutorial="scale-x"
                          use:docHover={{ key: isSNRonX ? (currentSnrUnit === 'dB' ? 'snr-linear' : 'snr-db') : (isLogX ? 'scale-linear-x' : 'scale-log-x'), position: 'bottom' }}
                          on:click={() => {
                            if (isSNRonX) {
                              const newUnit = currentSnrUnit === 'dB' ? 'linear' : 'dB';
                              updatePlotSnrUnit(plot.plotId, newUnit);
                            } else {
                              let newScale;
                              if (isLogX && isLogY) {
                                newScale = 'logY';
                              } else if (isLogX) {
                                newScale = 'linear';
                              } else if (isLogY) {
                                newScale = 'logLog';
                              } else {
                                newScale = 'logX';
                              }
                              updatePlotScale(plot.plotId, newScale);
                            }
                          }}
                          title={isSNRonX ? $_('plotItem.toggleSnrUnit') : $_('plotItem.toggleLogX')}
                        >
                          {isSNRonX ? (currentSnrUnit === 'dB' ? $_('plotItem.linearX') : $_('plotItem.dbX')) : (isLogX ? $_('plotItem.linearX') : $_('plotItem.logXBtn'))}
                        </button>
                      {:else if !is3DContour}
                        <!-- 2D Contour plot controls - EXACT COPY of line plot logic with X→X1, Y→X2 -->
                        <button
                          type="button"
                          class="button-secondary log-toggle"
                          data-tutorial="scale-x"
                          on:click={() => {
                            if (isSNRonX1) {
                              const newUnit = currentSnrUnit === 'dB' ? 'linear' : 'dB';
                              updatePlotSnrUnit(plot.plotId, newUnit);
                            } else {
                              let newScale;
                              if (isLogX && isLogY) {
                                newScale = 'logY';
                              } else if (isLogX) {
                                newScale = 'linear';
                              } else if (isLogY) {
                                newScale = 'logLog';
                              } else {
                                newScale = 'logX';
                              }
                              updatePlotScale(plot.plotId, newScale);
                            }
                          }}
                          title={isSNRonX1 ? $_('plotItem.toggleSnrUnit') : $_('plotItem.toggleLogX1')}
                        >
                          {isSNRonX1 ? (currentSnrUnit === 'dB' ? $_('plotItem.linearX1') : $_('plotItem.dbX1')) : (isLogX ? $_('plotItem.linearX1') : $_('plotItem.logX1Btn'))}
                        </button>
                      {:else}
                        <!-- 3D Contour: X1 axis control -->
                        <button
                          type="button"
                          class="button-secondary log-toggle"
                          data-tutorial="scale-x"
                          on:click={() => {
                            if (isSNRonX1) {
                              const newUnit = currentSnrUnit === 'dB' ? 'linear' : 'dB';
                              updatePlotSnrUnit(plot.plotId, newUnit);
                            } else {
                              let newScale;
                              if (isLogX && isLogY) {
                                newScale = 'logY';
                              } else if (isLogX) {
                                newScale = 'linear';
                              } else if (isLogY) {
                                newScale = 'logLog';
                              } else {
                                newScale = 'logX';
                              }
                              updatePlotScale(plot.plotId, newScale);
                            }
                          }}
                          title={isSNRonX1 ? $_('plotItem.toggleSnrUnit') : $_('plotItem.toggleLogX1')}
                        >
                          {isSNRonX1 ? (currentSnrUnit === 'dB' ? $_('plotItem.linearX1') : $_('plotItem.dbX1')) : (isLogX ? $_('plotItem.linearX1') : $_('plotItem.logX1Btn'))}
                        </button>
                      {/if}

                      <!-- Transpose button - positioned after first axis control -->
                      {#if !is3DContour}
                        <!-- 2D transpose: single button for X1↔X2 -->
                        <button
                          type="button"
                          class="button-secondary log-toggle transpose-button"
                          data-tutorial="transpose"
                          use:docHover={{ key: 'transpose', position: 'bottom' }}
                          on:click={() => transposePlot(plot.plotId, 'x1x2')}
                          title={plot.type === 'contour' ? $_('plotItem.transposeX1X2') : $_('plotItem.transposeXY')}
                        >
                          ⇄
                        </button>
                      {/if}

                      {#if plot.type !== 'contour'}
                        <!-- Line plot: SNR/Log toggle for Y -->
                        <button
                          type="button"
                          class="button-secondary log-toggle"
                          data-tutorial="scale-y"
                          use:docHover={{ key: isSNRonY ? (currentSnrUnit === 'dB' ? 'snr-linear' : 'snr-db') : (isLogY ? 'scale-linear-y' : 'scale-log-y'), position: 'bottom' }}
                          on:click={() => {
                            if (isSNRonY) {
                              const newUnit = currentSnrUnit === 'dB' ? 'linear' : 'dB';
                              updatePlotSnrUnit(plot.plotId, newUnit);
                            } else {
                              let newScale;
                              if (isLogX && isLogY) {
                                newScale = 'logX';
                              } else if (isLogY) {
                                newScale = 'linear';
                              } else if (isLogX) {
                                newScale = 'logLog';
                              } else {
                                newScale = 'logY';
                              }
                              updatePlotScale(plot.plotId, newScale);
                            }
                          }}
                          title={isSNRonY ? $_('plotItem.toggleSnrUnit') : $_('plotItem.toggleLogY')}
                        >
                          {isSNRonY ? (currentSnrUnit === 'dB' ? $_('plotItem.linearY') : $_('plotItem.dbY')) : (isLogY ? $_('plotItem.linearY') : $_('plotItem.logYBtn'))}
                        </button>
                      {:else if !is3DContour}
                        <!-- 2D Contour: SNR/Log toggle for X2 -->
                        <button
                          type="button"
                          class="button-secondary log-toggle"
                          data-tutorial="scale-y"
                          on:click={() => {
                            if (isSNRonX2) {
                              const newUnit = currentSnrUnit === 'dB' ? 'linear' : 'dB';
                              updatePlotSnrUnit(plot.plotId, newUnit);
                            } else {
                              let newScale;
                              if (isLogX && isLogY) {
                                newScale = 'logX';
                              } else if (isLogY) {
                                newScale = 'linear';
                              } else if (isLogX) {
                                newScale = 'logLog';
                              } else {
                                newScale = 'logY';
                              }
                              updatePlotScale(plot.plotId, newScale);
                            }
                          }}
                          title={isSNRonX2 ? $_('plotItem.toggleSnrUnit') : $_('plotItem.toggleLogX2')}
                        >
                          {isSNRonX2 ? (currentSnrUnit === 'dB' ? $_('plotItem.linearX2') : $_('plotItem.dbX2')) : (isLogY ? $_('plotItem.linearX2') : $_('plotItem.logX2Btn'))}
                        </button>
                      {:else}
                        <!-- 3D Contour: X2 axis control -->
                        <button
                          type="button"
                          class="button-secondary log-toggle"
                          data-tutorial="scale-y"
                          on:click={() => {
                            if (isSNRonX2) {
                              const newUnit = currentSnrUnit === 'dB' ? 'linear' : 'dB';
                              updatePlotSnrUnit(plot.plotId, newUnit);
                            } else {
                              let newScale;
                              if (isLogX && isLogY) {
                                newScale = 'logX';
                              } else if (isLogY) {
                                newScale = 'linear';
                              } else if (isLogX) {
                                newScale = 'logLog';
                              } else {
                                newScale = 'logY';
                              }
                              updatePlotScale(plot.plotId, newScale);
                            }
                          }}
                          title={isSNRonX2 ? $_('plotItem.toggleSnrUnit') : $_('plotItem.toggleLogX2')}
                        >
                          {isSNRonX2 ? (currentSnrUnit === 'dB' ? $_('plotItem.linearX2') : $_('plotItem.dbX2')) : (isLogY ? $_('plotItem.linearX2') : $_('plotItem.logX2Btn'))}
                        </button>

                        <!-- 3D Contour: Z axis control -->
                        <button
                          type="button"
                          class="button-secondary log-toggle"
                          on:click={() => {
                            if (isSNRonZ) {
                              const newUnit = currentSnrUnit === 'dB' ? 'linear' : 'dB';
                              updatePlotSnrUnit(plot.plotId, newUnit);
                            } else {
                              const newScaleZ = isLogZ ? 'linear' : 'log';
                              updatePlotScaleZ(plot.plotId, newScaleZ);
                            }
                          }}
                          title={isSNRonZ ? $_('plotItem.toggleSnrUnit') : $_('plotItem.toggleLogZ')}
                        >
                          {isSNRonZ ? (currentSnrUnit === 'dB' ? $_('plotItem.linearZ') : $_('plotItem.dbZ')) : (isLogZ ? $_('plotItem.linearZ') : $_('plotItem.logZBtn'))}
                        </button>

                        <!-- 3D transpose: single button for X1↔X2 only -->
                        <button
                          type="button"
                          class="button-secondary log-toggle transpose-button"
                          on:click={() => transposePlot(plot.plotId, 'x1x2')}
                          title={$_('plotItem.transposeX1X2')}
                        >
                          ⇄
                        </button>
                      {/if}

                      <!-- Frame toggle button -->
                      {@const showFrame = $plotShowFrame.get(plot.plotId) !== false}
                      <button
                        type="button"
                        class="button-secondary log-toggle"
                        class:active={showFrame}
                        on:click={() => {
                          plotShowFrame.update(map => {
                            const newMap = new Map(map);
                            newMap.set(plot.plotId, !showFrame);
                            return newMap;
                          });
                        }}
                        title={showFrame ? $_('plotItem.hideFrame') : $_('plotItem.showFrame')}
                      >
                        ☐
                      </button>
                    {/if}

                    <div class="plot-actions-group">
                      <span data-tutorial="export" use:docHover={{ key: 'export', position: 'bottom' }}>
                        <PlotExporter
                          plotElement={plotElementRefs.get(plot.plotId)}
                          plotId={plot.plotId}
                          metadata={{...plot.metadata, data: plot.data, type: plot.type, contourMode: plot.metadata.contourMode || plot.plotParams?.contourMode}}
                          plotTitle={getTranslatedPlotTitle(plot, axisLabels)}
                          globalParams={getGlobalParams(plot)}
                          seriesData={plot.isMultiSeries ? plot.series?.map((s, i) => ({
                            ...s,
                            metadata: {
                              ...s.metadata,
                              seriesLabel: getSeriesLabel(plot.series, i, plot.metadata?.xVar || plot.plotParams?.xVar, plot.metadata?.yVar || plot.plotParams?.yVar)
                            }
                          })) : null}
                        />
                      </span>
                      <button
                        type="button"
                        class="action-button danger"
                        data-tutorial="remove"
                        use:docHover={{ key: 'remove', position: 'bottom' }}
                        on:click={() => handleRemovePlot(plot.plotId)}
                        title={$_('plottingPanel.removePlot')}
                      >
                        <svg width="12" height="12" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                          <path d="M1 1L9 9M9 1L1 9"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {#if plot.isMultiSeries && plot.series}
                  <div class="series-list">
                    <div class="series-items">
                      {#each plot.series as series, index (series.plotId)}
                        <div
                          class="series-item"
                          on:mouseenter={() => {
                            hoveredSeries.set(plot.plotId, index);
                            hoveredSeries = hoveredSeries;
                          }}
                          on:mouseleave={() => {
                            hoveredSeries.delete(plot.plotId);
                            hoveredSeries = hoveredSeries;
                          }}
                        >
                          <div class="series-indicator" style="background-color: {resolveColor(series.metadata?.lineColor) || 'steelblue'}"></div>
                          <div class="series-info">
                            <span class="series-label">
                              {getSeriesLabel(plot.series, index, plot.metadata?.xVar || plot.plotParams?.xVar, plot.metadata?.yVar || plot.plotParams?.yVar)}
                            </span>
                          </div>
                          <button
                            type="button"
                            class="series-remove-button"
                            on:click={() => handleRemovePlot(series.plotId)}
                            title={$_('plottingPanel.removeThisSeries')}
                          >
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                              <path d="M1 1L9 9M9 1L1 9"/>
                            </svg>
                          </button>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                <PlotContainer
                  data={plot.data}
                  metadata={{
                    type: plot.type,
                    ...plot.metadata,
                    ...plot.simulationParams,
                    distribution: plot.plotParams?.distribution,
                    shaping_param: plot.plotParams?.shaping_param,
                    contourMode: plot.metadata?.contourMode || plot.plotParams?.contourMode,
                    contourLevels: plot.plotParams?.contourLevels || plot.plotParams?.points,
                    recommendedScale: plot.recommendedScale
                  }}
                  plotId={plot.plotId}
                  series={plot.series}
                  isMultiSeries={plot.isMultiSeries}
                  hoveredSeriesIndex={hoveredSeries.get(plot.plotId)}
                  showFrame={$plotShowFrame.get(plot.plotId) !== false}
                  onPlotElementReady={handlePlotElementReady(plot.plotId)}
                />
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-state">
            <h4>{$_('plottingPanel.noPlots')}</h4>
            <p>{$_('plottingPanel.noPlotsHint')}</p>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Comparison Action Bar (floating) -->
  <ComparisonActionBar
    selectedCount={selectedCount}
    canCompare={canCompare}
    canBenchmark={canBenchmark}
    comparisonErrorMsg={comparisonErrorMsg}
    benchmarkErrorMsg={benchmarkErrorMsg}
    showSelectAll={referencePlot !== null && getCompatibleContourPlots().length > selectedCount}
    onComparison={handleCreateComparison}
    onBenchmark={handleCreateBenchmark}
    onClear={clearPlotSelection}
    onSelectAll={selectAllCompatible}
  />

  <!-- Merge Confirmation Modal -->
  <MergeConfirmModal
    show={showMergeModal}
    existingPlotInfo={existingPlotInfo}
    newPlotInfo={newPlotInfo}
    on:merge={handleMerge}
    on:newFigure={handleNewFigure}
    on:cancel={handleCancelMerge}
  />
</div>

<style>
  .plotting-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    padding-top: var(--spacing-md);
  }

  /* Highlight effect for newly created plots */
  :global(.plot-highlight) {
    box-shadow: 0 0 20px color-mix(in srgb, var(--primary-color) 50%, transparent) !important;
    transition: box-shadow 0.3s ease;
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
    grid-template-columns: 350px 1fr;
    gap: var(--spacing-lg);
    align-items: start;
  }

  .controls-section,
  .plots-section {
    display: flex;
    flex-direction: column;
  }

  .plots-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    background: var(--card-background);
    transition: all 0.2s ease;
  }

  .plots-header.sticky {
    position: fixed;
    top: 0;
    z-index: 100;
    padding: var(--spacing-md);
    margin-bottom: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid var(--border-color);
  }

  .plots-header-placeholder {
    margin-bottom: var(--spacing-lg);
  }

  .plots-header h3 {
    margin: 0;
    color: var(--text-color);
    font-weight: 600;
  }

  .plots-actions button {
    font-size: var(--font-size-sm);
    padding: 6px 12px;
  }

  .plots-content {
    min-height: 400px;
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

  .plots-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .plot-item {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    background: var(--card-background);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-fast);
  }

  .plot-item.selected {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(200, 16, 46, 0.2), var(--shadow-sm);
  }

  .plot-select-label-inline {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);
    vertical-align: middle;
  }

  .plot-select-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .checkbox-icon-inline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    background: var(--input-background);
    transition: all var(--transition-fast);
    font-size: 13px;
    font-weight: bold;
    color: white;
    padding: 0;
    vertical-align: middle;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .plot-select-checkbox:checked + .checkbox-icon-inline {
    background: var(--primary-color);
    border-color: var(--primary-color);
    box-shadow: 0 2px 4px rgba(200, 16, 46, 0.3);
  }

  .plot-select-label-inline:hover .checkbox-icon-inline {
    border-color: var(--primary-color);
    background: #fef2f2;
    transform: scale(1.08);
    box-shadow: 0 2px 6px rgba(200, 16, 46, 0.15);
  }

  .plot-select-checkbox:checked + .checkbox-icon-inline:hover {
    background: #a60d26;
    box-shadow: 0 3px 8px rgba(200, 16, 46, 0.4);
  }

  .plot-select-label-inline.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .plot-select-label-inline.disabled .checkbox-icon-inline {
    cursor: not-allowed;
    background: var(--surface-color);
  }

  .plot-select-label-inline.disabled:hover .checkbox-icon-inline {
    border-color: var(--border-color);
    background: var(--surface-color);
    transform: none;
  }

  .params-separator {
    margin: 0 4px;
    color: var(--text-color-secondary);
  }

  .plot-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
    justify-content: center;
  }

  .plot-header {
    padding: var(--spacing-md);
    background: var(--card-background);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .plot-controls-header {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .plot-controls-header .log-toggle {
    background: #6b6b6b;
    border: 1px solid #6b6b6b;
    border-radius: 4px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 1em;
    transition: all var(--transition-fast);
    color: white;
    min-width: 32px;
    min-height: 32px;
  }

  .plot-controls-header .log-toggle:hover {
    background: #7a7a7a;
    transform: translateY(-1px);
  }

  .plot-controls-header .transpose-button {
    min-width: 32px;
    min-height: 32px;
  }

  /* 3D Transpose dropdown styling */
  .transpose-dropdown-container {
    position: relative;
    display: inline-block;
  }

  .transpose-dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    box-shadow: var(--shadow-md);
    z-index: 1000;
    min-width: 120px;
    overflow: hidden;
  }

  .transpose-option {
    display: block;
    width: 100%;
    padding: 8px 12px;
    background: var(--card-background);
    border: none;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
    cursor: pointer;
    font-size: 0.9em;
    color: var(--text-color);
    transition: background-color 0.15s;
  }

  .transpose-option:last-child {
    border-bottom: none;
  }

  .transpose-option:hover {
    background: var(--hover-background);
  }

  .transpose-option:active {
    background: var(--surface-color);
  }

  .plot-actions-group {
    display: flex;
    gap: 8px;
    margin-left: 8px;
  }

  .plot-info {
    flex: 1;
  }

  .plot-title {
    margin: 0;
    font-size: var(--font-size-lg);
    color: var(--text-color);
    font-weight: 600;
    display: flex;
    align-items: baseline;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    line-height: 1.3;
  }

  .plot-params-line {
    margin: 2px 0 0 0;
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    font-weight: 400;
    line-height: 1.3;
  }

  .plot-details {
    display: flex;
    gap: var(--spacing-sm);
    font-size: 0.75rem;
    color: #999;
    margin-top: var(--spacing-sm);
    padding: var(--spacing-sm);
    justify-content: center;
    text-align: center;
  }

  .plot-type {
    font-weight: 400;
  }


  .action-button {
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 1em;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    min-height: 32px;
  }

  .action-button:hover {
    background: var(--result-background);
    transform: translateY(-1px);
  }

  .action-button.danger:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
  }

  .series-list {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--card-background);
  }

  .series-items {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    align-items: center;
  }

  .series-count-inline {
    font-size: 0.9em;
    color: var(--text-color-secondary);
    font-weight: 400;
    margin-left: 2px;
  }

  .series-item {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px 7px 10px;
    background: var(--surface-color);
    border-radius: 4px;
    border: 1px solid var(--border-color);
    transition: all var(--transition-fast);
  }

  .series-item:hover {
    background: var(--hover-background);
    border-color: var(--border-color);
  }

  .series-indicator {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .series-info {
    display: flex;
    align-items: center;
    margin-left: 6px;
  }

  .series-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-color);
    line-height: 1;
  }

  .series-remove-button {
    background: none;
    border: none;
    outline: none;
    box-shadow: none;
    color: var(--text-color-secondary);
    cursor: pointer;
    padding: 0;
    margin: 0 0 0 6px;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .series-remove-button svg {
    display: block;
  }

  .series-remove-button:hover {
    background: var(--primary-color);
    color: white;
  }

  .series-remove-button:focus {
    outline: none;
    box-shadow: none;
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

  @media (max-width: 1100px) {
    .panel-content {
      grid-template-columns: 1fr;
    }

    .controls-section {
      order: 1;
    }

    .plots-section {
      order: 2;
    }
  }

  @media (max-width: 768px) {
    .panel-intro {
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: var(--font-size-xs);
    }

    .plots-header {
      flex-direction: column;
      align-items: stretch;
    }

    .plot-header {
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .plot-controls-header {
      justify-content: center;
    }
  }
</style>