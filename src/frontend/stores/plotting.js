// Plotting state management
import { writable, derived } from 'svelte/store';

// Global color management following original EPCalculator logic
const defaultColors = ["black", "#C8102E", "steelblue", "#FF8C00", "purple", "seagreen", "goldenrod",
  "#FF1493", "royalblue", "orchid", "darkcyan", "tomato"];
let colorIndex = 0;


// Plot parameters
export const plotParams = writable({
  plotType: 'lineLog', // 'lineLog', 'contour', 'surface', or 'rawData'
  yVar: 'error_exponent',
  xVar: 'n',
  xVar2: 'SNR', // For contour plots (changed from 'snr' to 'SNR')
  xRange: [1, 100],
  xRange2: [1, 10], // For contour plots
  points: 5,
  points2: 5, // For contour plots
  contourMode: '2d', // '2d' or '3d' - for contour plots
  contourLevels: 10, // Number of contour levels for 2D contours
  snrUnit: 'dB', // 'dB' or 'linear' - for SNR plots
  distribution: 'uniform', // 'uniform' or 'maxwell-boltzmann'
  shaping_param: 0, // Shaping parameter (beta) for Maxwell-Boltzmann
  // Additional parameters
  lineType: 'solid',
  lineColor: 'emphasis'
});

// Active plots array - stores plot data and metadata
export const activePlots = writable([]);

// Plot scale type - now per-plot
export const plotScales = writable(new Map()); // plotId -> 'linear' | 'logX' | 'logY' | 'logLog'

// Z-axis scale for 3D contour plots
export const plotScalesZ = writable(new Map()); // plotId -> 'linear' | 'log'

// SNR unit type - now per-plot
export const plotSnrUnits = writable(new Map()); // plotId -> 'dB' | 'linear'

// Show frame (box) around plot - per-plot setting
export const plotShowFrame = writable(new Map()); // plotId -> boolean (default true)

// Global preference for default frame visibility (applies to new plots)
export const defaultShowFrame = writable(true);

// UI state
export const showAdditionalParams = writable(false);
export const isPlotting = writable(false);

// Plot legend management
export const plotLegendVisible = writable(true);

// Comparison state
export const comparisonState = writable({
  selectedPlot1Id: '',
  selectedPlot2Id: '',
  comparisonData: null,
  comparisonMetadata: null
});

// Contour plot selection state (for inline comparison feature)
export const selectedContourPlots = writable(new Set());

// Pending merge state - when a compatible plot is found, store info here for user decision
export const pendingMerge = writable(null);
// Structure: { newPlotData, existingPlot, mergeType: 'exactMatch' | 'rangeExtension' | 'compatibleAxes' }

// Derived store: count of contour plots
export const contourPlotCount = derived(
  activePlots,
  ($plots) => $plots.filter(plot => plot.type === 'contour' && !plot.metadata?.comparisonType).length
);

// Derived store: show selection UI when 2+ contour plots exist
export const showContourSelection = derived(
  contourPlotCount,
  ($count) => $count >= 2
);

// Axis labels mapping
export const axisLabels = {
  M: 'Modulation size',
  SNR: 'SNR',  // Dynamic label based on unit
  R: 'Rate',
  N: 'Quadrature',
  n: 'Code length',
  threshold: 'Threshold',
  shaping_param: 'Shaping Parameter (β)',
  error_probability: 'Error Probability',
  error_exponent: 'Error Exponent',
  rho: 'Optimal ρ'
};

// Get axis label
export function getAxisLabel(varName, snrUnit = 'dB') {
  if (varName === 'SNR') {
    return snrUnit === 'dB' ? 'SNR (dB)' : 'SNR (linear)';
  }
  return axisLabels[varName] || varName;
}

// Plot validation
export const plotValidation = derived(
  plotParams,
  ($params) => {
    const errors = {};

    // Validate x range
    if ($params.xRange.length !== 2 || $params.xRange[0] >= $params.xRange[1]) {
      errors.xRange = 'validation.xRangeInvalid';
    }

    // Validate points
    if ($params.points < 1 || $params.points > 101) {
      errors.points = 'validation.pointsRange';
    }

    // Contour/surface plot specific validation
    if ($params.plotType === 'contour' || $params.plotType === 'surface') {
      if ($params.xRange2.length !== 2 || $params.xRange2[0] >= $params.xRange2[1]) {
        errors.xRange2 = 'validation.x2RangeInvalid';
      }

      if ($params.points2 < 1 || $params.points2 > 101) {
        errors.points2 = 'validation.x2PointsRange';
      }
    }

    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  }
);

// Helper functions
export function updatePlotParam(key, value) {
  plotParams.update(params => ({
    ...params,
    [key]: value
  }));
}

// Helper function to check if two distributions are equivalent
// Treats MB with beta=0 as equivalent to uniform
function areDistributionsEquivalent(dist1, beta1, dist2, beta2) {
  const normalizedDist1 = (dist1 === 'maxwell-boltzmann' && beta1 === 0) ? 'uniform' : dist1;
  const normalizedDist2 = (dist2 === 'maxwell-boltzmann' && beta2 === 0) ? 'uniform' : dist2;

  if (normalizedDist1 !== normalizedDist2) {
    return false;
  }

  // If both are MB (and beta != 0), check if beta values match
  if (normalizedDist1 === 'maxwell-boltzmann') {
    return beta1 === beta2;
  }

  return true;
}

// Check if a plot with identical parameters already exists and return the plot ID to scroll to
export function findExistingPlot(newPlotData, plotParams, simulationParams) {
  let existingPlotId = null;
  activePlots.subscribe(plots => {
    // Check all plots and their series
    for (const plot of plots) {
      const plotsToCheck = plot.isMultiSeries && plot.series ? plot.series : [plot];

      for (const plotToCheck of plotsToCheck) {
        if (areParametersIdentical(plotToCheck, newPlotData, plotParams, simulationParams)) {
          existingPlotId = plot.plotId; // Return the container plot ID
          return;
        }
      }
    }
  })();
  return existingPlotId;
}

// Check if a plot with identical DATA parameters exists but styling may differ
// Returns: { plotId, seriesIndex, stylingDiffers, existingPlot } or null
export function findExistingPlotWithStyling(newPlotData, plotParams, simulationParams, constellationInfo = null) {
  let result = null;
  activePlots.subscribe(plots => {
    for (const plot of plots) {
      const plotsToCheck = plot.isMultiSeries && plot.series ? plot.series : [plot];

      for (let i = 0; i < plotsToCheck.length; i++) {
        const plotToCheck = plotsToCheck[i];
        if (areParametersIdentical(plotToCheck, newPlotData, plotParams, simulationParams, constellationInfo)) {
          // Check if styling differs
          const existingLineType = plotToCheck.metadata?.lineType || plotToCheck.plotParams?.lineType || 'solid';
          const existingLineColor = plotToCheck.metadata?.lineColor || plotToCheck.plotParams?.lineColor || 'emphasis';
          const newLineType = plotParams.lineType || 'solid';
          const newLineColor = plotParams.lineColor || 'emphasis';

          const stylingDiffers = existingLineType !== newLineType || existingLineColor !== newLineColor;

          result = {
            plotId: plot.plotId,
            seriesIndex: plot.isMultiSeries ? i : -1,
            stylingDiffers,
            existingPlot: plot,
            existingSeries: plotToCheck
          };
          return;
        }
      }
    }
  })();
  return result;
}

// Update styling of an existing plot/series without recomputing data
export function updatePlotStyling(plotId, seriesIndex, newLineType, newLineColor) {
  activePlots.update(plots => {
    return plots.map(plot => {
      if (plot.plotId !== plotId) return plot;

      if (plot.isMultiSeries && plot.series && seriesIndex >= 0) {
        // Update specific series in multi-series plot
        const updatedSeries = plot.series.map((series, idx) => {
          if (idx !== seriesIndex) return series;
          return {
            ...series,
            metadata: {
              ...series.metadata,
              lineType: newLineType,
              lineColor: newLineColor
            },
            plotParams: {
              ...series.plotParams,
              lineType: newLineType,
              lineColor: newLineColor
            }
          };
        });
        return { ...plot, series: updatedSeries };
      } else {
        // Update single plot
        return {
          ...plot,
          metadata: {
            ...plot.metadata,
            lineType: newLineType,
            lineColor: newLineColor
          },
          plotParams: {
            ...plot.plotParams,
            lineType: newLineType,
            lineColor: newLineColor
          }
        };
      }
    });
  });
}

function areParametersIdentical(existingPlot, newPlotData, plotParams, simulationParams, constellationInfo = null) {
  // Compare plot parameters
  const existingPlotParams = existingPlot.plotParams || {};
  const newPlotParams = plotParams;

  // Special handling for distribution comparison: MB with beta=0 equals uniform
  const existingDist = existingPlotParams.distribution || 'uniform';
  const newDist = newPlotParams.distribution || 'uniform';
  const existingBeta = existingPlotParams.shaping_param || 0;
  const newBeta = newPlotParams.shaping_param || 0;

  // Normalize distributions: treat MB with beta=0 as uniform
  const existingNormalizedDist = (existingDist === 'maxwell-boltzmann' && existingBeta === 0) ? 'uniform' : existingDist;
  const newNormalizedDist = (newDist === 'maxwell-boltzmann' && newBeta === 0) ? 'uniform' : newDist;

  // If normalized distributions differ, not identical
  if (existingNormalizedDist !== newNormalizedDist) {
    return false;
  }

  // If both are MB (and beta != 0 since we normalized), compare beta values
  if (existingNormalizedDist === 'maxwell-boltzmann' && newNormalizedDist === 'maxwell-boltzmann') {
    if (existingBeta !== newBeta) {
      return false;
    }
  }

  // Compare other plot parameters (excluding distribution and shaping_param which we handled above)
  const plotParamKeys = ['plotType', 'yVar', 'xVar', 'xVar2', 'xRange', 'xRange2', 'points', 'points2', 'snrUnit', 'contourMode'];
  for (const key of plotParamKeys) {
    if (JSON.stringify(existingPlotParams[key]) !== JSON.stringify(newPlotParams[key])) {
      return false;
    }
  }

  // Compare simulation parameters
  const existingSimParams = existingPlot.simulationParams || {};
  const newSimParams = simulationParams;

  const simParamKeys = ['M', 'typeModulation', 'SNR', 'SNRUnit', 'R', 'n', 'N', 'threshold'];
  for (const key of simParamKeys) {
    if (existingSimParams[key] !== newSimParams[key]) {
      return false;
    }
  }

  // Compare constellation info for custom constellations
  const existingConstellationInfo = existingPlot.constellationInfo;
  const newConstellationInfo = constellationInfo;

  // Check if one is custom and the other isn't
  const existingIsCustom = existingSimParams.typeModulation === 'Custom';
  const newIsCustom = newSimParams.typeModulation === 'Custom';

  console.log('[areParametersIdentical] Constellation comparison:', {
    existingIsCustom,
    newIsCustom,
    existingConstellationInfo,
    newConstellationInfo
  });

  if (existingIsCustom || newIsCustom) {
    // If both are custom, compare constellation IDs
    if (existingIsCustom && newIsCustom) {
      const existingId = existingConstellationInfo?.constellationId;
      const newId = newConstellationInfo?.constellationId;

      console.log('[areParametersIdentical] Comparing IDs:', { existingId, newId });

      // If IDs are different, not identical
      if (existingId !== newId) {
        console.log('[areParametersIdentical] IDs differ, returning false');
        return false;
      }

      // If no IDs but have names, compare names
      if (!existingId && !newId) {
        const existingName = existingConstellationInfo?.constellationName;
        const newName = newConstellationInfo?.constellationName;
        console.log('[areParametersIdentical] No IDs, comparing names:', { existingName, newName });
        if (existingName !== newName) {
          return false;
        }
      }
    }
    // If only one is custom, they're already different (typeModulation differs)
  }

  // Legacy check: Compare custom constellation points if present in simulationParams
  const existingCustomConst = existingSimParams.customConstellation;
  const newCustomConst = newSimParams.customConstellation;

  if ((existingCustomConst && !newCustomConst) || (!existingCustomConst && newCustomConst)) {
    return false;
  }

  if (existingCustomConst && newCustomConst) {
    if (JSON.stringify(existingCustomConst.points) !== JSON.stringify(newCustomConst.points)) {
      return false;
    }
  }

  return true;
}

// Analyze the relationship between two X ranges
function analyzeRangeRelationship(existingRange, newRange) {
  const [existingMin, existingMax] = existingRange;
  const [newMin, newMax] = newRange;

  // Calculate overlaps and gaps
  const overlapMin = Math.max(existingMin, newMin);
  const overlapMax = Math.min(existingMax, newMax);
  const hasOverlap = overlapMin < overlapMax;

  // Calculate total span if merged
  const mergedMin = Math.min(existingMin, newMin);
  const mergedMax = Math.max(existingMax, newMax);
  const mergedSpan = mergedMax - mergedMin;

  // Calculate gap size
  let gapSize = 0;
  if (!hasOverlap) {
    if (newMin > existingMax) {
      gapSize = newMin - existingMax;
    } else {
      gapSize = existingMin - newMax;
    }
  }

  // Determine relationship type
  const gapThreshold = mergedSpan * 0.1; // 10% of total span

  if (hasOverlap) {
    return { type: 'overlapping', gapSize: 0, mergedRange: [mergedMin, mergedMax] };
  } else if (gapSize <= gapThreshold) {
    return { type: 'adjacent', gapSize, mergedRange: [mergedMin, mergedMax] };
  } else {
    return { type: 'separate', gapSize, mergedRange: [mergedMin, mergedMax] };
  }
}

// Information-theoretic Y variables that can be merged together on the same plot
// These are all derived from E0(rho) and represent related channel capacity metrics:
// - mutual_information = E0'(0) = I(X;Y) - channel capacity
// - cutoff_rate = E0(1) = R0 - maximum rate for zero-error exponent
// - critical_rate = E0'(1) = R_crit - rate where exponent slope changes
const INFO_THEORETIC_Y_VARS = ['mutual_information', 'cutoff_rate', 'critical_rate'];

// Check if two Y variables are compatible for merging on the same plot
// Returns true if they are the same, or both are info-theoretic variables
function areYVarsCompatible(yVar1, yVar2) {
  if (yVar1 === yVar2) return true;

  // Info-theoretic Y variables can be merged together since they share the same scale
  if (INFO_THEORETIC_Y_VARS.includes(yVar1) && INFO_THEORETIC_Y_VARS.includes(yVar2)) {
    return true;
  }

  return false;
}

// Check if all simulation and plot parameters match between two plots
// (excluding xRange, points which can differ for range extension)
function checkAllParamsMatch(existingPlot, newPlotData) {
  const plotParams = existingPlot.plotParams || {};
  const newParams = newPlotData.plotParams || {};
  const plotSimParams = existingPlot.simulationParams || {};
  const newSimParams = newPlotData.simulationParams || {};

  console.log('[checkAllParamsMatch] Comparing:', {
    existingPlotParams: plotParams,
    newPlotParams: newParams,
    existingSimParams: plotSimParams,
    newSimParams: newSimParams
  });

  // Check distribution equivalence
  const plotDist = plotParams.distribution || 'uniform';
  const newDist = newParams.distribution || 'uniform';
  const plotBeta = plotParams.shaping_param || 0;
  const newBeta = newParams.shaping_param || 0;

  if (!areDistributionsEquivalent(plotDist, plotBeta, newDist, newBeta)) {
    console.log('[checkAllParamsMatch] Distribution mismatch:', { plotDist, plotBeta, newDist, newBeta });
    return false;
  }

  // Compare plot parameters (excluding xRange, points)
  const plotParamKeys = ['plotType', 'yVar', 'xVar', 'xVar2', 'xRange2', 'snrUnit'];
  for (const key of plotParamKeys) {
    if (JSON.stringify(plotParams[key]) !== JSON.stringify(newParams[key])) {
      console.log(`[checkAllParamsMatch] plotParam mismatch for ${key}:`, plotParams[key], 'vs', newParams[key]);
      return false;
    }
  }

  // Compare simulation parameters
  const simParamKeys = ['M', 'typeModulation', 'SNR', 'SNRUnit', 'R', 'n', 'N', 'threshold'];
  for (const key of simParamKeys) {
    if (plotSimParams[key] !== newSimParams[key]) {
      console.log(`[checkAllParamsMatch] simParam mismatch for ${key}:`, plotSimParams[key], '('+typeof plotSimParams[key]+') vs', newSimParams[key], '('+typeof newSimParams[key]+')');
      return false;
    }
  }

  // Check constellation info for custom constellations
  const plotIsCustom = plotSimParams.typeModulation === 'Custom';
  const newIsCustom = newSimParams.typeModulation === 'Custom';

  if (plotIsCustom !== newIsCustom) {
    return false;
  }

  if (plotIsCustom && newIsCustom) {
    const plotConstellationInfo = existingPlot.constellationInfo;
    const newConstellationInfo = newPlotData.constellationInfo;

    const plotId = plotConstellationInfo?.constellationId;
    const newId = newConstellationInfo?.constellationId;

    if (plotId !== newId) {
      return false;
    }

    if (!plotId && !newId) {
      const plotName = plotConstellationInfo?.constellationName;
      const newName = newConstellationInfo?.constellationName;
      if (plotName !== newName) {
        return false;
      }
    }
  }

  return true;
}

// Find a plot with identical params except xRange (for range extension)
function findRangeExtensionPlot(plots, newPlotData) {
  if (newPlotData.type !== 'line' && newPlotData.type !== 'rawData') return null;

  const newParams = newPlotData.plotParams || {};
  const newSimParams = newPlotData.simulationParams || {};
  const newXRange = newParams.xRange;

  if (!newXRange || newXRange.length !== 2) return null;

  for (const plot of plots) {
    // Skip multi-series plots
    if (plot.isMultiSeries) continue;

    // Only consider line plots and tables, and must match type
    if (plot.type !== 'line' && plot.type !== 'rawData') continue;
    if (plot.type !== newPlotData.type) continue;

    // Check if all params match except xRange
    const plotParams = plot.plotParams || {};
    const plotSimParams = plot.simulationParams || {};

    // Check distribution equivalence
    const plotDist = plotParams.distribution || 'uniform';
    const newDist = newParams.distribution || 'uniform';
    const plotBeta = plotParams.shaping_param || 0;
    const newBeta = newParams.shaping_param || 0;

    if (!areDistributionsEquivalent(plotDist, plotBeta, newDist, newBeta)) {
      continue;
    }

    // Compare plot parameters (excluding xRange, points, distribution, and shaping_param which we handled)
    // points/points2 are excluded because user may want different sampling density
    const plotParamKeys = ['plotType', 'yVar', 'xVar', 'xVar2', 'xRange2', 'snrUnit', 'contourMode'];
    let paramsMatch = true;
    for (const key of plotParamKeys) {
      if (JSON.stringify(plotParams[key]) !== JSON.stringify(newParams[key])) {
        paramsMatch = false;
        break;
      }
    }

    if (!paramsMatch) continue;

    // Compare simulation parameters
    const simParamKeys = ['M', 'typeModulation', 'SNR', 'SNRUnit', 'R', 'n', 'N', 'threshold'];
    let simParamsMatch = true;
    for (const key of simParamKeys) {
      if (plotSimParams[key] !== newSimParams[key]) {
        simParamsMatch = false;
        break;
      }
    }

    if (!simParamsMatch) continue;

    // Check constellation info for custom constellations
    const plotIsCustom = plotSimParams.typeModulation === 'Custom';
    const newIsCustom = newSimParams.typeModulation === 'Custom';

    if (plotIsCustom || newIsCustom) {
      if (plotIsCustom && newIsCustom) {
        // Both are custom - compare constellation IDs
        const plotConstellationInfo = plot.constellationInfo;
        const newConstellationInfo = newPlotData.constellationInfo;

        const plotId = plotConstellationInfo?.constellationId;
        const newId = newConstellationInfo?.constellationId;

        // If IDs differ, not a match
        if (plotId !== newId) {
          continue;
        }

        // If no IDs, compare names
        if (!plotId && !newId) {
          const plotName = plotConstellationInfo?.constellationName;
          const newName = newConstellationInfo?.constellationName;
          if (plotName !== newName) {
            continue;
          }
        }
      }
      // If only one is custom, typeModulation already differs so simParamsMatch would be false
    }

    // Legacy check: custom constellation in simulationParams
    const plotCustomConst = plotSimParams.customConstellation;
    const newCustomConst = newSimParams.customConstellation;

    if ((plotCustomConst && !newCustomConst) || (!plotCustomConst && newCustomConst)) {
      continue;
    }

    if (plotCustomConst && newCustomConst) {
      if (JSON.stringify(plotCustomConst.points) !== JSON.stringify(newCustomConst.points)) {
        continue;
      }
    }

    // All params match except xRange - analyze range relationship
    const existingXRange = plotParams.xRange;
    if (existingXRange && existingXRange.length === 2) {
      const relationship = analyzeRangeRelationship(existingXRange, newXRange);

      // When all other parameters match exactly, always treat as range extension
      // regardless of whether ranges are overlapping, adjacent, or separate.
      // This ensures the data is merged into a single series, not multiple series.
      return { plot, relationship };
    }
  }

  return null;
}

// Find plot with ALL parameters exactly matching (including xRange)
// Only difference allowed is the number of points (sampling density)
function findExactMatchPlot(plots, newPlotData) {
  const newParams = newPlotData.plotParams || {};
  const newSimParams = newPlotData.simulationParams || {};

  for (const plot of plots) {
    // Skip multi-series plots for exact matching
    if (plot.isMultiSeries) continue;

    // Only consider line plots and tables, and must match type
    if (plot.type !== 'line' && plot.type !== 'rawData') continue;
    if (plot.type !== newPlotData.type) continue;

    const plotParams = plot.plotParams || {};
    const plotSimParams = plot.simulationParams || {};

    // Check distribution equivalence
    const plotDist = plotParams.distribution || 'uniform';
    const newDist = newParams.distribution || 'uniform';
    const plotBeta = plotParams.shaping_param || 0;
    const newBeta = newParams.shaping_param || 0;

    if (!areDistributionsEquivalent(plotDist, plotBeta, newDist, newBeta)) {
      continue;
    }

    // Compare plot parameters (INCLUDING xRange, but EXCLUDING points/points2, distribution, and shaping_param)
    // points/points2 represent sampling density, user wants to merge even if different
    const plotParamKeys = ['plotType', 'yVar', 'xVar', 'xVar2', 'xRange', 'xRange2', 'snrUnit'];
    let paramsMatch = true;
    for (const key of plotParamKeys) {
      if (JSON.stringify(plotParams[key]) !== JSON.stringify(newParams[key])) {
        paramsMatch = false;
        break;
      }
    }

    if (!paramsMatch) continue;

    // Compare simulation parameters
    const simParamKeys = ['M', 'typeModulation', 'SNR', 'SNRUnit', 'R', 'n', 'N', 'threshold'];
    let simParamsMatch = true;
    for (const key of simParamKeys) {
      if (plotSimParams[key] !== newSimParams[key]) {
        simParamsMatch = false;
        break;
      }
    }

    if (!simParamsMatch) continue;

    // Check constellation info for custom constellations
    const plotIsCustom = plotSimParams.typeModulation === 'Custom';
    const newIsCustom = newSimParams.typeModulation === 'Custom';

    console.log('[findExactMatchPlot] Constellation check:', {
      plotIsCustom,
      newIsCustom,
      plotConstellationInfo: plot.constellationInfo,
      newConstellationInfo: newPlotData.constellationInfo
    });

    if (plotIsCustom || newIsCustom) {
      if (plotIsCustom && newIsCustom) {
        // Both are custom - compare constellation IDs
        const plotConstellationInfo = plot.constellationInfo;
        const newConstellationInfo = newPlotData.constellationInfo;

        const plotId = plotConstellationInfo?.constellationId;
        const newId = newConstellationInfo?.constellationId;

        console.log('[findExactMatchPlot] Comparing constellation IDs:', { plotId, newId });

        // If IDs differ, not a match
        if (plotId !== newId) {
          console.log('[findExactMatchPlot] IDs differ, skipping this plot');
          continue;
        }

        // If no IDs, compare names
        if (!plotId && !newId) {
          const plotName = plotConstellationInfo?.constellationName;
          const newName = newConstellationInfo?.constellationName;
          console.log('[findExactMatchPlot] No IDs, comparing names:', { plotName, newName });
          if (plotName !== newName) {
            continue;
          }
        }
      }
      // If only one is custom, typeModulation already differs so simParamsMatch would be false
    }

    // Legacy check: custom constellation in simulationParams
    const plotCustomConst = plotSimParams.customConstellation;
    const newCustomConst = newSimParams.customConstellation;

    if ((plotCustomConst && !newCustomConst) || (!plotCustomConst && newCustomConst)) {
      continue;
    }

    if (plotCustomConst && newCustomConst) {
      if (JSON.stringify(plotCustomConst.points) !== JSON.stringify(newCustomConst.points)) {
        continue;
      }
    }

    // All params match exactly (except points) - found exact match
    return plot;
  }

  return null;
}

// Merge data from two ranges, handling overlaps and sorting
function mergeRangeData(existingData, newData) {
  // Combine data arrays
  const combined = [...existingData, ...newData];

  // Create a map to deduplicate by X coordinate (keep first occurrence)
  const dataMap = new Map();
  for (const point of combined) {
    if (!dataMap.has(point.x)) {
      dataMap.set(point.x, point);
    }
  }

  // Convert back to array and sort by X
  const merged = Array.from(dataMap.values()).sort((a, b) => a.x - b.x);

  return merged;
}

// Extract Y values from plot data (handles both single and multi-series)
function extractYValues(plotData) {
  const yValues = [];

  // Multi-series plot
  if (plotData.series && Array.isArray(plotData.series)) {
    plotData.series.forEach(series => {
      if (series.data && Array.isArray(series.data)) {
        series.data.forEach(point => {
          if (point.y !== undefined && point.y !== null) {
            yValues.push(point.y);
          }
        });
      }
    });
  }
  // Single-series plot
  else if (plotData.data && Array.isArray(plotData.data)) {
    plotData.data.forEach(point => {
      if (point.y !== undefined && point.y !== null) {
        yValues.push(point.y);
      }
    });
  }

  return yValues;
}

// Determine if Y-axis should use logarithmic scale
// Based on magnitude threshold analysis
function shouldUseLogY(plotData) {
  // Extract Y values for numerical analysis
  const yValues = extractYValues(plotData);

  // Filter positive values only (log scale requires positive values)
  const positiveY = yValues.filter(y => y > 0);

  // Need at least 2 positive values to determine scale
  if (positiveY.length < 2) {
    return false;
  }

  const maxY = Math.max(...positiveY);
  const minY = Math.min(...positiveY);

  // Avoid division by zero
  if (minY === 0 || maxY === 0) {
    return false;
  }

  // Calculate orders of magnitude span
  const orderSpan = Math.log10(maxY) - Math.log10(minY);

  // Threshold: 3 orders of magnitude (1000x ratio) for conservative auto-log
  const threshold = 3.0;

  if (orderSpan >= threshold) {
    console.log(`Auto-log Y: Data spans ${orderSpan.toFixed(2)} orders of magnitude (${(maxY/minY).toFixed(0)}x ratio)`);
    return true;
  }

  return false;
}

// Helper function to transpose data array (swap x and y)
function transposeDataArray(data) {
  if (!data || !Array.isArray(data)) return data;
  return data.map(point => ({ x: point.y, y: point.x }));
}

// Helper function to transpose contour axes (X1 ↔ X2, keep Z unchanged)
function transposeContourDataArray(data, transposeType = 'x1x2') {
  if (!data || !Array.isArray(data)) return data;

  switch(transposeType) {
    case 'x1x2':
      // Swap X1 and X2, keep Z the same
      return data.map(point => ({
        x1: point.x2,
        x2: point.x1,
        z: point.z
      }));
    case 'x1z':
      // Swap X1 and Z, keep X2 the same
      return data.map(point => ({
        x1: point.z,
        x2: point.x2,
        z: point.x1
      }));
    case 'x2z':
      // Swap X2 and Z, keep X1 the same
      return data.map(point => ({
        x1: point.x1,
        x2: point.z,
        z: point.x2
      }));
    default:
      return data;
  }
}

// Helper function to transpose scale (swap logX and logY)
function transposeScale(scale) {
  switch(scale) {
    case 'linear': return 'linear';
    case 'logX': return 'logY';
    case 'logY': return 'logX';
    case 'logLog': return 'logLog';
    default: return 'linear';
  }
}

// Transpose plot axes (swap X and Y)
export function transposePlot(plotId, transposeType = 'x1x2') {
  activePlots.update(plots => {
    return plots.map(plot => {
      if (plot.plotId !== plotId && (!plot.series || !plot.series.find(s => s.plotId === plotId))) {
        return plot;
      }

      // Check if this is a contour plot
      if (plot.type === 'contour') {
        // Transpose contour axes based on transposeType
        const transposedData = transposeContourDataArray(plot.data, transposeType);

        let transposedMetadata, transposedParams;

        if (transposeType === 'x1x2') {
          // Swap X1 and X2 metadata, keep Z unchanged
          transposedMetadata = {
            ...plot.metadata,
            xVar: plot.metadata.x2Var || plot.metadata.xVar2,
            x2Var: plot.metadata.xVar || plot.metadata.x1Var,
            x1Var: plot.metadata.x2Var || plot.metadata.xVar2,
            xLabel: plot.metadata.x2Label || 'X2',
            x1Label: plot.metadata.x2Label || 'X2',
            x2Label: plot.metadata.xLabel || plot.metadata.x1Label || 'X1'
          };
          transposedParams = {
            ...plot.plotParams,
            xVar: plot.plotParams?.xVar2,
            xVar2: plot.plotParams?.xVar,
            xRange: plot.plotParams?.xRange2 || plot.plotParams?.xRange,
            xRange2: plot.plotParams?.xRange
          };
        } else if (transposeType === 'x1z') {
          // Swap X1 and Z metadata, keep X2 unchanged
          transposedMetadata = {
            ...plot.metadata,
            xVar: plot.metadata.zVar || plot.metadata.yVar,    // X1 ← Z
            zVar: plot.metadata.xVar || plot.metadata.x1Var,   // Z ← X1
            yVar: plot.metadata.xVar || plot.metadata.x1Var,   // yVar also tracks Z
            xLabel: plot.metadata.zLabel || 'Z',
            x1Label: plot.metadata.zLabel || 'Z',
            zLabel: plot.metadata.xLabel || plot.metadata.x1Label || 'X1'
          };
          transposedParams = {
            ...plot.plotParams,
            xVar: plot.plotParams?.yVar,    // X1 ← Z (Z is stored as yVar)
            yVar: plot.plotParams?.xVar     // Z ← X1
          };
        } else if (transposeType === 'x2z') {
          // Swap X2 and Z metadata, keep X1 unchanged
          transposedMetadata = {
            ...plot.metadata,
            xVar2: plot.metadata.zVar || plot.metadata.yVar,   // X2 ← Z
            x2Var: plot.metadata.zVar || plot.metadata.yVar,
            zVar: plot.metadata.xVar2 || plot.metadata.x2Var,  // Z ← X2
            yVar: plot.metadata.xVar2 || plot.metadata.x2Var,  // yVar also tracks Z
            x2Label: plot.metadata.zLabel || 'Z',
            zLabel: plot.metadata.x2Label || 'X2'
          };
          transposedParams = {
            ...plot.plotParams,
            xVar2: plot.plotParams?.yVar,   // X2 ← Z (Z is stored as yVar)
            yVar: plot.plotParams?.xVar2    // Z ← X2
          };
        }

        console.log(`Transposing contour plot ${plotId}: ${transposeType.toUpperCase()}`);

        return {
          ...plot,
          data: transposedData,
          metadata: transposedMetadata,
          plotParams: transposedParams,
          timestamp: Date.now()
        };
      } else {
        // Regular 2D plot transpose (X ↔ Y)
        const transposedData = transposeDataArray(plot.data);

        // Transpose series if multi-series
        const transposedSeries = plot.series?.map(s => ({
          ...s,
          data: transposeDataArray(s.data)
        }));

        // Swap metadata
        const transposedMetadata = {
          ...plot.metadata,
          xVar: plot.metadata.yVar,
          yVar: plot.metadata.xVar,
          xLabel: plot.metadata.yLabel,
          yLabel: plot.metadata.xLabel,
          // Update title: "Y vs X" becomes "X vs Y"
          title: plot.metadata.title ?
            `${plot.metadata.xLabel || 'X'} vs ${plot.metadata.yLabel || 'Y'}` :
            undefined
        };

        // Swap plot params
        const transposedParams = {
          ...plot.plotParams,
          xVar: plot.plotParams?.yVar,
          yVar: plot.plotParams?.xVar,
          xRange: plot.plotParams?.yRange || plot.plotParams?.xRange,
          yRange: plot.plotParams?.xRange
        };

        const transposedPlot = {
          ...plot,
          data: transposedData,
          series: transposedSeries,
          metadata: transposedMetadata,
          plotParams: transposedParams,
          timestamp: Date.now()
        };

        // Re-analyze scale recommendation based on transposed data
        const newRecommendedScale = shouldUseLogY(transposedPlot) ? 'logY' : 'linear';
        transposedPlot.recommendedScale = newRecommendedScale;

        console.log(`Transposing plot ${plotId}: X↔Y, new recommended scale: ${newRecommendedScale}`);

        return transposedPlot;
      }
    });
  });

  // Transpose current scale (logX ↔ logY) - only for regular plots
  plotScales.update(scales => {
    const newScales = new Map(scales);
    const currentScale = newScales.get(plotId) || 'linear';
    const transposedScale = transposeScale(currentScale);
    newScales.set(plotId, transposedScale);
    console.log(`Transposing scale for ${plotId}: ${currentScale} → ${transposedScale}`);
    return newScales;
  });
}

export function addPlot(plotData) {
  let targetPlotId = null;

  // Auto-detect recommended Y-axis scale based on data
  const useLogY = shouldUseLogY(plotData);
  const recommendedScale = useLogY ? 'logY' : 'linear';

  // Store recommendation in plot data for PlotContainer to use
  plotData.recommendedScale = recommendedScale;

  // Get current plots to check for compatible ones
  let currentPlots = [];
  activePlots.subscribe(p => currentPlots = p)();

  // For line plots and tables, check if there's a compatible plot and prompt user
  if (plotData.type === 'line' || plotData.type === 'rawData') {
    // FIRST: Check for exact parameter match
    const exactMatch = findExactMatchPlot(currentPlots, plotData);
    if (exactMatch) {
      console.log(`Exact parameter match detected - prompting user for merge decision`);
      pendingMerge.set({
        newPlotData: plotData,
        existingPlot: exactMatch,
        mergeType: 'exactMatch'
      });
      return null; // Return null to indicate pending decision
    }

    // SECOND: Check for range extension
    const rangeExtension = findRangeExtensionPlot(currentPlots, plotData);
    if (rangeExtension) {
      console.log(`Range extension detected - prompting user for merge decision`);
      pendingMerge.set({
        newPlotData: plotData,
        existingPlot: rangeExtension.plot,
        mergeType: 'rangeExtension',
        relationship: rangeExtension.relationship
      });
      return null; // Return null to indicate pending decision
    }

    // THIRD: Check for compatible axes
    const compatiblePlot = findCompatiblePlot(currentPlots, plotData);
    if (compatiblePlot) {
      console.log(`Compatible axes detected - prompting user for merge decision`);
      console.log('[addPlot] Found compatible plot:', {
        plotId: compatiblePlot.plotId,
        simulationParams: compatiblePlot.simulationParams,
        plotParams: compatiblePlot.plotParams
      });
      console.log('[addPlot] New plot data:', {
        simulationParams: plotData.simulationParams,
        plotParams: plotData.plotParams
      });
      console.log('[addPlot] All current plots:', currentPlots.map(p => ({
        plotId: p.plotId,
        M: p.simulationParams?.M,
        xRange: p.plotParams?.xRange
      })));
      pendingMerge.set({
        newPlotData: plotData,
        existingPlot: compatiblePlot,
        mergeType: 'compatibleAxes'
      });
      return null; // Return null to indicate pending decision
    }
  }

  // No compatible plot found, add as new plot directly
  targetPlotId = addPlotDirect(plotData);
  return targetPlotId;
}

// Add plot without checking for compatibility (used when user confirms new figure)
export function addPlotDirect(plotData) {
  let targetPlotId = null;

  // Auto-detect recommended Y-axis scale based on data
  const useLogY = shouldUseLogY(plotData);
  const recommendedScale = useLogY ? 'logY' : 'linear';
  plotData.recommendedScale = recommendedScale;

  activePlots.update(plots => {
    const newPlotId = `plot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    targetPlotId = newPlotId;

    return [
      ...plots,
      {
        ...plotData,
        plotId: newPlotId,
        timestamp: Date.now()
      }
    ];
  });

  return targetPlotId;
}

// Confirm merge - called when user chooses to merge
export function confirmMerge() {
  let pending = null;
  pendingMerge.subscribe(p => pending = p)();

  if (!pending) {
    console.warn('confirmMerge called but no pending merge');
    return null;
  }

  const { newPlotData, existingPlot, mergeType, relationship } = pending;
  let targetPlotId = existingPlot.plotId;

  activePlots.update(plots => {
    return plots.map(plot => {
      if (plot.plotId !== existingPlot.plotId) return plot;

      if (mergeType === 'exactMatch' || mergeType === 'rangeExtension') {
        // Merge data points
        const mergedData = mergeRangeData(plot.data, newPlotData.data);
        const mergedPlotData = { ...plot, data: mergedData };
        const mergedUseLogY = shouldUseLogY(mergedPlotData);
        const mergedRecommendedScale = mergedUseLogY ? 'logY' : 'linear';

        updatePlotScale(existingPlot.plotId, mergedRecommendedScale);
        console.log(`Merged data into existing plot (${mergeType})`);

        const updatedPlot = {
          ...plot,
          data: mergedData,
          recommendedScale: mergedRecommendedScale,
          timestamp: Date.now()
        };

        // For range extension, also update the xRange
        if (mergeType === 'rangeExtension' && relationship?.mergedRange) {
          updatedPlot.plotParams = {
            ...plot.plotParams,
            xRange: relationship.mergedRange
          };
        }

        return updatedPlot;
      } else if (mergeType === 'compatibleAxes') {
        // FIRST: Check if all parameters actually match (except range/points)
        // If so, this should be treated as a range extension, not multi-series
        console.log('[confirmMerge] compatibleAxes - checking if all params match');
        console.log('[confirmMerge] existingPlot:', {
          plotParams: plot.plotParams,
          simulationParams: plot.simulationParams,
          isMultiSeries: plot.isMultiSeries
        });
        console.log('[confirmMerge] newPlotData:', {
          plotParams: newPlotData.plotParams,
          simulationParams: newPlotData.simulationParams
        });
        const allParamsMatch = checkAllParamsMatch(plot, newPlotData);
        console.log('[confirmMerge] allParamsMatch:', allParamsMatch);

        if (allParamsMatch && !plot.isMultiSeries) {
          // All params match - merge as single series (like rangeExtension)
          const mergedData = mergeRangeData(plot.data, newPlotData.data);
          const mergedPlotData = { ...plot, data: mergedData };
          const mergedUseLogY = shouldUseLogY(mergedPlotData);
          const mergedRecommendedScale = mergedUseLogY ? 'logY' : 'linear';

          updatePlotScale(existingPlot.plotId, mergedRecommendedScale);
          console.log(`Compatible axes but all params match - merging as single series`);

          // Update xRange to cover both ranges
          const existingXRange = plot.plotParams?.xRange || [];
          const newXRange = newPlotData.plotParams?.xRange || [];
          let mergedXRange = existingXRange;
          if (existingXRange.length === 2 && newXRange.length === 2) {
            mergedXRange = [
              Math.min(existingXRange[0], newXRange[0]),
              Math.max(existingXRange[1], newXRange[1])
            ];
          }

          return {
            ...plot,
            data: mergedData,
            plotParams: {
              ...plot.plotParams,
              xRange: mergedXRange
            },
            recommendedScale: mergedRecommendedScale,
            timestamp: Date.now()
          };
        }

        // For tables (rawData), handle differently - use parameter columns instead of series legend
        if (plot.type === 'rawData') {
          // Find differing parameters between existing and new data
          const existingSeriesForComparison = plot.series ? plot.series[0] : plot;
          const differingParams = findDifferingParams(existingSeriesForComparison, newPlotData);

          // Create series array (for storing multiple data sets)
          const existingSeries = plot.series || [{
            ...plot,
            plotId: `series_${plot.plotId}_0`,
            timestamp: plot.timestamp,
            data: plot.data,
            metadata: { ...plot.metadata },
            plotParams: plot.plotParams,
            simulationParams: plot.simulationParams,
            constellationInfo: plot.constellationInfo
          }];

          const newSeriesData = {
            ...newPlotData,
            plotId: `plot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            metadata: { ...newPlotData.metadata }
          };

          console.log(`Adding table data with parameter columns:`, differingParams);

          // Build differingParams that includes ALL series
          // We need to rebuild it to include all series, not just comparison of two
          const allSeries = [...existingSeries, newSeriesData];
          const allDifferingParams = {};

          // For each parameter, check if it varies across all series
          const simParamKeys = ['M', 'typeModulation', 'SNR', 'R', 'n', 'N', 'threshold'];
          const xVar = plot.plotParams?.xVar || plot.metadata?.xVar;

          for (const key of simParamKeys) {
            if (key === xVar) continue;

            if (key === 'typeModulation') {
              // Special handling: treat different custom constellations as different types
              // Use constellation name/ID as the effective value when typeModulation is 'Custom'
              const effectiveValues = allSeries.map(s => {
                const type = s.simulationParams?.typeModulation;
                if (type === 'Custom') {
                  // Use constellation name or ID to distinguish different custom constellations
                  return `Custom:${s.constellationInfo?.constellationName || s.constellationInfo?.constellationId || 'unknown'}`;
                }
                return type;
              });
              const uniqueValues = [...new Set(effectiveValues)];
              if (uniqueValues.length > 1) {
                allDifferingParams[key] = true;
              }
            } else {
              const values = allSeries.map(s => s.simulationParams?.[key]);
              const uniqueValues = [...new Set(values)];
              if (uniqueValues.length > 1) {
                allDifferingParams[key] = true;
              }
            }
          }

          // Check distribution
          const distributions = allSeries.map(s => {
            const dist = s.plotParams?.distribution || 'uniform';
            const beta = s.plotParams?.shaping_param || 0;
            return (dist === 'maxwell-boltzmann' && beta === 0) ? 'uniform' : dist;
          });
          if ([...new Set(distributions)].length > 1) {
            allDifferingParams.distribution = true;
          }

          // Check shaping_param (for MB distributions)
          const betas = allSeries.map(s => s.plotParams?.shaping_param || 0);
          if ([...new Set(betas)].length > 1 && distributions.some(d => d === 'maxwell-boltzmann')) {
            allDifferingParams.shaping_param = true;
          }

          // Note: We don't add a separate 'constellation' column because when typeModulation
          // is 'Custom', the Type column already shows the constellation name via formatParamValue

          const multiSeriesTable = {
            ...plot,
            series: allSeries,
            isMultiSeries: true,
            metadata: {
              ...plot.metadata,
              differingParams: allDifferingParams  // Store which params differ across series
            }
          };

          return {
            ...multiSeriesTable,
            timestamp: Date.now()
          };
        }

        // For line plots, use the existing series/legend approach
        // For multi-series, don't pre-assign colors - let PlotContainer resolve them
        // based on series index and current theme color (to avoid color collisions)
        // IMPORTANT: First series must have a DIFFERENT plotId than the container
        // to allow individual series removal without removing the entire plot
        const existingSeries = plot.series || [{
          ...plot,
          plotId: `series_${plot.plotId}_0`,  // Unique ID for first series
          timestamp: plot.timestamp,
          data: plot.data,
          metadata: {
            ...plot.metadata,
            // Keep 'emphasis' for first series, otherwise undefined (will use index-based color)
            lineColor: plot.metadata.lineColor === 'emphasis' ? 'emphasis' : undefined
          },
          plotParams: plot.plotParams,
          simulationParams: plot.simulationParams
        }];

        // Don't assign a specific color - let PlotContainer handle it based on index
        const newSeriesData = {
          ...newPlotData,
          plotId: `plot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          metadata: {
            ...newPlotData.metadata,
            lineColor: undefined // Will be resolved by PlotContainer based on index
          }
        };

        console.log(`Adding as new series (color will be assigned by PlotContainer)`);

        const multiSeriesPlot = {
          ...plot,
          series: [...existingSeries, newSeriesData],
          isMultiSeries: true
        };

        const multiSeriesUseLogY = shouldUseLogY(multiSeriesPlot);
        const multiSeriesRecommendedScale = multiSeriesUseLogY ? 'logY' : 'linear';
        updatePlotScale(existingPlot.plotId, multiSeriesRecommendedScale);

        return {
          ...multiSeriesPlot,
          recommendedScale: multiSeriesRecommendedScale,
          timestamp: Date.now()
        };
      }

      return plot;
    });
  });

  // Clear pending merge
  pendingMerge.set(null);
  return targetPlotId;
}

// Confirm new figure - called when user chooses to create separate plot
export function confirmNewFigure() {
  let pending = null;
  pendingMerge.subscribe(p => pending = p)();

  if (!pending) {
    console.warn('confirmNewFigure called but no pending merge');
    return null;
  }

  const { newPlotData } = pending;

  // Clear pending merge first
  pendingMerge.set(null);

  // Add as new plot
  return addPlotDirect(newPlotData);
}

// Cancel pending merge
export function cancelPendingMerge() {
  pendingMerge.set(null);
}

// Find differing parameters between two plots (for table merging)
// Returns an object with parameter names as keys and their differing values
function findDifferingParams(plot1, plot2) {
  const differing = {};
  const sim1 = plot1.simulationParams || {};
  const sim2 = plot2.simulationParams || {};
  const plot1Params = plot1.plotParams || {};
  const plot2Params = plot2.plotParams || {};

  // Skip the X variable from comparison (it's what we're iterating over)
  const xVar = plot1Params.xVar || plot1.metadata?.xVar;

  // Simulation parameters to check
  const simParamKeys = ['M', 'typeModulation', 'SNR', 'R', 'n', 'N', 'threshold'];
  for (const key of simParamKeys) {
    // Skip the X variable
    if (key === xVar) continue;
    if (sim1[key] !== sim2[key]) {
      differing[key] = { val1: sim1[key], val2: sim2[key] };
    }
  }

  // Also check SNR unit (special case)
  if (sim1.SNRUnit !== sim2.SNRUnit && xVar !== 'SNR') {
    differing.SNRUnit = { val1: sim1.SNRUnit, val2: sim2.SNRUnit };
  }

  // Check distribution and shaping_param
  const dist1 = plot1Params.distribution || 'uniform';
  const dist2 = plot2Params.distribution || 'uniform';
  const beta1 = plot1Params.shaping_param || 0;
  const beta2 = plot2Params.shaping_param || 0;

  // Normalize: MB with beta=0 is same as uniform
  const normDist1 = (dist1 === 'maxwell-boltzmann' && beta1 === 0) ? 'uniform' : dist1;
  const normDist2 = (dist2 === 'maxwell-boltzmann' && beta2 === 0) ? 'uniform' : dist2;

  if (normDist1 !== normDist2) {
    differing.distribution = { val1: dist1, val2: dist2 };
  }
  if (normDist1 === 'maxwell-boltzmann' && normDist2 === 'maxwell-boltzmann' && beta1 !== beta2) {
    differing.shaping_param = { val1: beta1, val2: beta2 };
  }

  // Note: We don't check constellation separately - it's shown via typeModulation='Custom'

  return differing;
}

function findCompatiblePlot(plots, newPlotData) {
  if (newPlotData.type !== 'line' && newPlotData.type !== 'rawData') return null;

  return plots.find(plot => {
    // Only line plots and tables can be combined, and must match type
    if (plot.type !== 'line' && plot.type !== 'rawData') return false;
    if (plot.type !== newPlotData.type) return false;

    // Check if axes match (x and y variables)
    const existingXVar = plot.plotParams?.xVar || plot.metadata?.xVar;
    const existingYVar = plot.plotParams?.yVar || plot.metadata?.yVar;
    const newXVar = newPlotData.plotParams?.xVar || newPlotData.metadata?.xVar;
    const newYVar = newPlotData.plotParams?.yVar || newPlotData.metadata?.yVar;

    // For tables (rawData), only xVar needs to match (tables show all Y variables)
    if (newPlotData.type === 'rawData') {
      return existingXVar === newXVar;
    }

    // Group plots with same X variable and compatible Y variables
    // Y variables are compatible if they are the same, or both are info-theoretic metrics
    // (mutual_information, cutoff_rate, critical_rate can be plotted together)
    // SNR plots with different units (dB/linear) can also merge since backend returns linear values
    return existingXVar === newXVar && areYVarsCompatible(existingYVar, newYVar);
  });
}

export function removePlot(plotId) {
  activePlots.update(plots => {
    return plots.map(plot => {
      // If removing by container plotId, remove entire plot
      if (plot.plotId === plotId) {
        return null;
      }

      // If this is a multi-series plot, check if we're removing an individual series
      if (plot.isMultiSeries && plot.series) {
        const remainingSeries = plot.series.filter(s => s.plotId !== plotId);

        // Check if any series was actually removed
        if (remainingSeries.length < plot.series.length) {
          if (remainingSeries.length === 0) {
            // No series left, remove the entire plot
            return null;
          } else if (remainingSeries.length === 1) {
            // Only one series left, convert back to single plot
            const lastSeries = remainingSeries[0];
            return {
              ...lastSeries,
              isMultiSeries: false,
              series: undefined
            };
          } else {
            // Multiple series remain
            return {
              ...plot,
              series: remainingSeries
            };
          }
        }
      }

      return plot;
    }).filter(Boolean); // Remove null entries
  });

  // Clean up scale and SNR unit for removed plot
  plotScales.update(scales => {
    const newScales = new Map(scales);
    newScales.delete(plotId);
    return newScales;
  });

  plotSnrUnits.update(units => {
    const newUnits = new Map(units);
    newUnits.delete(plotId);
    return newUnits;
  });

  // Remove from selection if selected
  selectedContourPlots.update(selected => {
    const newSelected = new Set(selected);
    newSelected.delete(plotId);
    return newSelected;
  });
}

export function clearAllPlots() {
  activePlots.set([]);
  plotScales.set(new Map()); // Clear all scales
  plotSnrUnits.set(new Map()); // Clear all SNR units
  selectedContourPlots.set(new Set()); // Clear all selections
  colorIndex = 0; // Reset color index when clearing all plots
}

export function highlightPlot(plotId, highlight = true) {
  // This will be handled by the plot components
  // We can emit a custom event or use a separate store if needed
}

// Update scale for a specific plot
export function updatePlotScale(plotId, scale) {
  plotScales.update(scales => {
    const newScales = new Map(scales);
    newScales.set(plotId, scale);
    return newScales;
  });
}

// Update Z-axis scale for 3D contour plots
export function updatePlotScaleZ(plotId, scale) {
  plotScalesZ.update(scales => {
    const newScales = new Map(scales);
    newScales.set(plotId, scale);
    return newScales;
  });
}

// Get scale for a specific plot (default to 'linear')
export function getPlotScale(plotId, defaultScale = 'linear') {
  let scale = defaultScale;
  plotScales.subscribe(scales => {
    scale = scales.get(plotId) || defaultScale;
  })();
  return scale;
}

// Initialize scale for a new plot
export function initPlotScale(plotId, initialScale = 'linear') {
  plotScales.update(scales => {
    const newScales = new Map(scales);
    if (!newScales.has(plotId)) {
      newScales.set(plotId, initialScale);
    }
    return newScales;
  });
}

// Update SNR unit for a specific plot
export function updatePlotSnrUnit(plotId, unit) {
  plotSnrUnits.update(units => {
    const newUnits = new Map(units);
    newUnits.set(plotId, unit);
    return newUnits;
  });
}

// Get SNR unit for a specific plot (default to 'dB')
export function getPlotSnrUnit(plotId, defaultUnit = 'dB') {
  let unit = defaultUnit;
  plotSnrUnits.subscribe(units => {
    unit = units.get(plotId) || defaultUnit;
  })();
  return unit;
}

// Initialize SNR unit for a new plot
export function initPlotSnrUnit(plotId, initialUnit = 'dB') {
  plotSnrUnits.update(units => {
    const newUnits = new Map(units);
    if (!newUnits.has(plotId)) {
      newUnits.set(plotId, initialUnit);
    }
    return newUnits;
  });
}

// Plot data formatting helpers
export function formatPlotData(rawData, metadata) {
  // Check both the metadata passed and the rawData's metadata for SNR unit
  const snrUnit = metadata.snrUnit || rawData.metadata?.snr_unit || 'dB';
  return {
    type: 'line',
    x: rawData.x_values || rawData.x,
    y: rawData.y_values || rawData.y,
    metadata: {
      xLabel: getAxisLabel(metadata.xVar, snrUnit),
      yLabel: getAxisLabel(metadata.yVar, snrUnit),
      ...metadata,
      snrUnit: snrUnit  // Preserve the SNR unit in metadata
    }
  };
}

export function formatContourData(rawData, metadata) {
  const snrUnit = metadata.snrUnit || 'linear';
  return {
    type: 'contour',
    x1: rawData.x1,
    x2: rawData.x2,
    z: rawData.z,
    metadata: {
      x1Label: getAxisLabel(metadata.x1Var, snrUnit),
      x2Label: getAxisLabel(metadata.x2Var, snrUnit),
      zLabel: getAxisLabel(metadata.yVar, snrUnit),
      ...metadata
    }
  };
}

/**
 * Import plot data from uploaded file
 * @param {Object} parsedData - Data from dataParser.js
 * @param {Array} parsedData.x - X values
 * @param {Array} parsedData.y - Y values
 * @param {string} parsedData.xLabel - X axis label
 * @param {string} parsedData.yLabel - Y axis label
 * @param {string} parsedData.title - Optional title
 * @returns {string} plotId - ID of the added plot
 */
export function importPlotData(parsedData) {
  // Check if multi-series import
  if (parsedData.isMultiSeries && parsedData.series) {
    return importMultiSeriesData(parsedData);
  }

  // Single-series import (original behavior)
  return importSingleSeriesData(parsedData);
}

/**
 * Import single-series data
 */
function importSingleSeriesData(parsedData) {
  // Import detection function (inline to avoid circular dependency)
  function detectVariableType(label) {
    const normalized = label.toLowerCase().trim();

    if (normalized.includes('snr') || (normalized.includes('signal') && normalized.includes('noise'))) {
      return {
        varType: 'SNR',
        detectedUnit: normalized.includes('db') ? 'dB' : 'linear'
      };
    }
    if (normalized.includes('code length') || normalized === 'n' || normalized.includes('block length')) {
      return { varType: 'n', detectedUnit: null };
    }
    if ((normalized.includes('rate') || normalized === 'r') && !normalized.includes('error')) {
      return { varType: 'R', detectedUnit: null };
    }
    if (normalized.includes('modulation size') || normalized === 'm') {
      return { varType: 'M', detectedUnit: null };
    }
    if (normalized.includes('error prob') || normalized.includes('probability of error') || normalized === 'pe') {
      return { varType: 'error_probability', detectedUnit: null };
    }
    if (normalized.includes('error exponent') || (normalized.includes('exponent') && normalized.includes('error'))) {
      return { varType: 'error_exponent', detectedUnit: null };
    }
    if (normalized.includes('rho') || normalized === 'ρ') {
      return { varType: 'rho', detectedUnit: null };
    }
    if (normalized.includes('beta') || normalized === 'β' || normalized.includes('shaping')) {
      return { varType: 'shaping_param', detectedUnit: null };
    }
    return { varType: null, detectedUnit: null };
  }

  // Detect variable types from labels
  const xDetection = detectVariableType(parsedData.xLabel || 'X');
  const yDetection = detectVariableType(parsedData.yLabel || 'Y');

  // Use detected variable types or fall back to generic
  const xVar = xDetection.varType || 'imported_x';
  const yVar = yDetection.varType || 'imported_y';
  const snrUnit = xDetection.detectedUnit || yDetection.detectedUnit || 'linear';

  // Assign automatic color for imported data
  const colorIdx = colorIndex % defaultColors.length;
  const assignedColor = defaultColors[colorIdx];
  colorIndex++;

  // Format data to internal structure
  const plotData = {
    type: 'line',
    data: parsedData.x.map((x, i) => ({ x, y: parsedData.y[i] })),
    metadata: {
      xLabel: parsedData.xLabel || 'X',
      yLabel: parsedData.yLabel || 'Y',
      title: parsedData.title || 'Imported Data',
      xVar: xVar,
      yVar: yVar,
      lineColor: assignedColor,
      lineType: parsedData.metadata?.lineColor ? parsedData.metadata.lineColor : 'solid',
      snrUnit: snrUnit
    },
    plotParams: {
      plotType: 'lineLog',
      xVar: xVar,
      yVar: yVar,
      distribution: parsedData.plotParams?.distribution || 'uniform',
      snrUnit: snrUnit,
      ...(parsedData.plotParams || {})
    },
    simulationParams: {
      isImported: true,
      SNRUnit: xVar === 'SNR' ? snrUnit : undefined,
      // Preserve any simulation params from exported JSON (fixes "undefined" issue)
      ...(parsedData.simulationParams || {})
    }
  };

  // Add to plots using existing function (will auto-detect log scale)
  const plotId = addPlot(plotData);

  console.log(`Imported ${parsedData.x.length} data points with color ${assignedColor}, xVar=${xVar}, yVar=${yVar}, snrUnit=${snrUnit}`);

  return plotId;
}

/**
 * Import multi-series data
 */
function importMultiSeriesData(parsedData) {
  function detectVariableType(label) {
    const normalized = label.toLowerCase().trim();

    if (normalized.includes('snr') || (normalized.includes('signal') && normalized.includes('noise'))) {
      return {
        varType: 'SNR',
        detectedUnit: normalized.includes('db') ? 'dB' : 'linear'
      };
    }
    if (normalized.includes('code length') || normalized === 'n' || normalized.includes('block length')) {
      return { varType: 'n', detectedUnit: null };
    }
    if ((normalized.includes('rate') || normalized === 'r') && !normalized.includes('error')) {
      return { varType: 'R', detectedUnit: null };
    }
    if (normalized.includes('modulation size') || normalized === 'm') {
      return { varType: 'M', detectedUnit: null };
    }
    if (normalized.includes('error prob') || normalized.includes('probability of error') || normalized === 'pe') {
      return { varType: 'error_probability', detectedUnit: null };
    }
    if (normalized.includes('error exponent') || (normalized.includes('exponent') && normalized.includes('error'))) {
      return { varType: 'error_exponent', detectedUnit: null };
    }
    if (normalized.includes('rho') || normalized === 'ρ') {
      return { varType: 'rho', detectedUnit: null };
    }
    if (normalized.includes('beta') || normalized === 'β' || normalized.includes('shaping')) {
      return { varType: 'shaping_param', detectedUnit: null };
    }
    return { varType: null, detectedUnit: null };
  }

  // Detect variable types from global labels
  const xDetection = detectVariableType(parsedData.xLabel || 'X');
  const yDetection = detectVariableType(parsedData.yLabel || 'Y');

  const xVar = xDetection.varType || 'imported_x';
  const yVar = yDetection.varType || 'imported_y';
  const snrUnit = xDetection.detectedUnit || yDetection.detectedUnit || 'linear';

  // Import each series as a separate plot, they will auto-merge if axes match
  const plotIds = [];

  parsedData.series.forEach((seriesData, i) => {
    const colorIdx = colorIndex % defaultColors.length;
    const assignedColor = seriesData.metadata?.lineColor || defaultColors[colorIdx];
    colorIndex++;

    const plotData = {
      type: 'line',
      data: seriesData.x.map((x, j) => ({ x, y: seriesData.y[j] })),
      metadata: {
        xLabel: parsedData.xLabel || 'X',
        yLabel: seriesData.yLabel || parsedData.yLabel || 'Y',
        title: seriesData.yLabel || `Series ${i + 1}`,
        xVar: seriesData.metadata?.xVar || xVar,
        yVar: seriesData.metadata?.yVar || yVar,
        lineColor: assignedColor,
        lineType: seriesData.metadata?.lineType || 'solid',
        snrUnit: snrUnit
      },
      plotParams: {
        plotType: 'lineLog',
        xVar: xVar,
        yVar: yVar,
        distribution: seriesData.plotParams?.distribution || 'uniform',
        snrUnit: snrUnit,
        ...(seriesData.plotParams || {})
      },
      simulationParams: {
        isImported: true,
        SNRUnit: xVar === 'SNR' ? snrUnit : undefined,
        // Preserve simulation params from each series (fixes "undefined" issue)
        ...(seriesData.simulationParams || {})
      }
    };

    const plotId = addPlot(plotData);
    plotIds.push(plotId);

    console.log(`Imported series ${i + 1}: ${seriesData.pointCount} points with color ${assignedColor}`);
  });

  console.log(`Imported ${parsedData.series.length} series with total ${parsedData.totalPoints} points`);

  // Return the first plot ID (they may have merged into single multi-series plot)
  return plotIds[0];
}

// ============================================================================
// Contour Plot Selection Functions (for inline comparison feature)
// ============================================================================

// Toggle plot selection
export function togglePlotSelection(plotId) {
  selectedContourPlots.update(selected => {
    const newSelected = new Set(selected);
    if (newSelected.has(plotId)) {
      newSelected.delete(plotId);
    } else {
      newSelected.add(plotId);
    }
    return newSelected;
  });
}

// Clear all plot selections
export function clearPlotSelection() {
  selectedContourPlots.set(new Set());
}

// Check if a plot is selected
export function isPlotSelected(plotId, $selectedPlots) {
  return $selectedPlots.has(plotId);
}

// Get selected contour plot objects
export function getSelectedContourPlots($activePlots, $selectedPlots) {
  return $activePlots.filter(plot =>
    plot.type === 'contour' &&
    $selectedPlots.has(plot.plotId)
  );
}