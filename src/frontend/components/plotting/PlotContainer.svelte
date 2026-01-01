<script>
  import * as Plot from '@observablehq/plot';
  import Plotly from 'plotly.js-dist-min';
  import { onMount, afterUpdate, onDestroy } from 'svelte';
  import { _, locale } from 'svelte-i18n';
  import { plotScales, plotScalesZ, updatePlotScale, updatePlotScaleZ, initPlotScale, plotSnrUnits, updatePlotSnrUnit, initPlotSnrUnit, transposePlot } from '../../stores/plotting.js';
  import { theme } from '../../stores/theme.js';
  import PlotExporter from './PlotExporter.svelte';

  // Theme-aware plot colors
  $: isDarkMode = $theme.darkMode;
  $: plotColors = {
    background: isDarkMode ? 'transparent' : 'white',
    text: isDarkMode ? '#E8E8E8' : 'black',
    textSecondary: isDarkMode ? '#888888' : '#666',
    grid: isDarkMode ? '#333333' : '#e0e0e0',
    axis: isDarkMode ? '#666666' : '#999'
  };

  // Helper to get translated strings
  $: seriesLabel = $_('plotLegend.series');
  $: noDataAvailableText = $_('plotItem.noDataAvailable');
  $: noDataToDisplayText = $_('plotItem.noDataToDisplay');
  $: plotErrorText = $_('plotItem.plotError');

  // Translated axis labels - reactive to language changes
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

  // Translated legend labels - reactive to language changes
  $: legendLabels = {
    M: $_('plotLegend.modulation'),
    typeModulation: $_('plotLegend.type'),
    SNR: $_('plotLegend.snr'),
    R: $_('plotLegend.rate'),
    n: $_('plotLegend.codeLength'),
    N: $_('plotLegend.quadrature'),
    threshold: $_('plotLegend.threshold'),
    distribution: $_('plotLegend.distribution'),
    shaping_param: $_('plotLegend.shapingParam'),
    snrUnit: $_('plotLegend.snrUnit')
  };

  // Translated distribution names
  $: distLabels = {
    uniform: $_('plotLegend.uniform'),
    'maxwell-boltzmann': $_('plotLegend.maxwellBoltzmann')
  };

  // Helper function to get translated axis label
  function getTranslatedAxisLabel(varName, snrUnit = 'dB') {
    if (varName === 'SNR') {
      return snrUnit === 'dB' ? axisLabels.SNR_dB : axisLabels.SNR_linear;
    }
    return axisLabels[varName] || varName;
  }

  // Helper to resolve 'emphasis' color to the actual CSS variable value
  function resolveColor(color) {
    if (color === 'emphasis') {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#C8102E';
    }
    return color;
  }

  export let data = [];
  export let metadata = {};
  export let plotId = null;
  export let series = null; // For multi-series plots
  export let isMultiSeries = false;
  export let hoveredSeriesIndex = undefined; // Index of hovered series
  export let showFrame = true; // Show frame/box around plot
  export let onParamsExtracted = null; // Callback to pass global params to parent
  export let onPlotElementReady = null; // Callback to pass plot element to parent

  let container;
  let plotElement;
  let plotlyContainer;
  let is3DPlot = false;

  // Determine initial scale and SNR unit based on metadata
  $: {
    if (plotId && metadata) {
      const xVar = metadata.xVar || (series && series[0]?.plotParams?.xVar);
      const snrUnit = metadata.snrUnit || (series && series[0]?.metadata?.snrUnit) || (series && series[0]?.plotParams?.snrUnit) || 'dB';
      // Use recommended scale from auto-detection, or default to linear
      const defaultScale = metadata.recommendedScale || 'linear';
      initPlotScale(plotId, defaultScale);
      initPlotSnrUnit(plotId, snrUnit);
    }
  }

  // Get current scale and SNR unit for this plot
  $: currentScale = $plotScales.get(plotId) || 'linear';
  $: currentScaleZ = $plotScalesZ.get(plotId) || 'linear';
  $: currentSnrUnit = $plotSnrUnits.get(plotId) || metadata.snrUnit || 'dB';

  // Parse scale into independent X and Y components
  $: isLogX = currentScale === 'logX' || currentScale === 'logLog';
  $: isLogY = currentScale === 'logY' || currentScale === 'logLog';
  $: isLogZ = currentScaleZ === 'log';

  // Detect if X-axis is SNR
  $: xVar = metadata.xVar || (series && series[0]?.plotParams?.xVar);
  $: isSNRonX = xVar === 'SNR';

  // Extract global params and notify parent
  $: globalParams = extractGlobalParams(metadata, series, isMultiSeries);

  // Notify parent component of extracted params
  $: if (onParamsExtracted && globalParams) {
    onParamsExtracted(globalParams);
  }

  // Include $locale, axisLabels, and showFrame as dependencies to re-render when they change
  $: plotOptions = createPlotOptions(data, metadata, currentScale, currentSnrUnit, series, isMultiSeries, hoveredSeriesIndex, plotColors, $locale, axisLabels, showFrame);

  // Custom tick formatter for base-10 exponential notation with caret notation
  function formatBase10Tick(value) {
    if (value === 0) return '0';

    // Handle very small numbers
    if (Math.abs(value) < 1e-100) return '0';

    // For numbers up to 10^4, show regular notation
    if (Math.abs(value) <= 10000) {
      // Remove unnecessary decimals
      if (Number.isInteger(value)) {
        return String(value);
      }
      // For non-integers, format with minimal decimal places
      return value.toPrecision(2);
    }

    // For numbers above 10^4, use scientific notation with caret
    const exponent = Math.floor(Math.log10(Math.abs(value)));
    const coefficient = value / Math.pow(10, exponent);

    // If coefficient is close to 1 or -1, just show ±10^exponent
    const absCoeff = Math.abs(coefficient);
    if (Math.abs(absCoeff - 1) < 0.01) {
      const sign = coefficient < 0 ? '-' : '';
      return `${sign}10^${exponent}`;
    }

    // Otherwise show coefficient × 10^exponent
    return `${coefficient.toPrecision(2)}×10^${exponent}`;
  }

  function extractGlobalParams(meta, seriesData, multiSeries) {
    if (multiSeries && seriesData) {
      const xVar = meta.xVar || seriesData[0]?.plotParams?.xVar;
      const yVar = meta.yVar || seriesData[0]?.plotParams?.yVar;
      return generateGlobalParameters(seriesData, xVar, yVar);
    } else if (meta) {
      return generateSinglePlotParameters(meta);
    }
    return [];
  }

  function createPlotOptions(plotData, meta, scale, snrUnit, seriesData, multiSeries, hoveredIndex, colors, currentLocale, translatedLabels, frameVisible) {
    // currentLocale, translatedLabels, and frameVisible are passed to trigger reactivity on change
    if ((!plotData || plotData.length === 0) && (!multiSeries || !seriesData)) {
      return createEmptyPlot(colors);
    }

    // Determine X variable for SNR special handling
    const xVar = meta.xVar || (multiSeries && seriesData && seriesData[0]?.plotParams?.xVar);

    // Dynamic label computation based on plot type - use translated labels
    let xLabel, yLabel;

    if (meta.type === 'contour') {
      // For contour plots: X=x1, Y=x2, Z=value
      const x1Var = meta.xVar || meta.x1Var;
      const x2Var = meta.xVar2 || meta.x2Var;
      const zVar = meta.zVar || meta.yVar;  // Z variable (often stored as yVar)

      // Use translated labels with current SNR unit
      xLabel = getTranslatedAxisLabel(x1Var, currentSnrUnit);
      yLabel = getTranslatedAxisLabel(x2Var, currentSnrUnit);

      // Z axis label (for 3D plots)
      let zLabel = getTranslatedAxisLabel(zVar, currentSnrUnit);
    } else {
      // For regular plots: X=xVar, Y=yVar - use translated labels
      const yVar = meta.yVar;
      xLabel = getTranslatedAxisLabel(xVar, snrUnit);
      yLabel = getTranslatedAxisLabel(yVar, snrUnit);
    }

    // Transform data from linear to dB if needed
    // Backend should send LINEAR SNR values, convert to dB if unit is dB
    if (meta.type === 'contour' && currentSnrUnit === 'dB') {
      // For contour plots, check all three axes (x1, x2, z)
      const x1Var = meta.xVar || meta.x1Var;
      const x2Var = meta.xVar2 || meta.x2Var;
      const zVar = meta.zVar || meta.yVar;

      if (plotData) {
        plotData = plotData.map(point => {
          const newPoint = { ...point };
          // Convert x1 if it's SNR (only if value is positive, indicating linear form)
          // Linear SNR is always positive; negative values indicate already in dB
          if (x1Var === 'SNR') {
            if (point.x1 > 0) {
              newPoint.x1 = 10 * Math.log10(point.x1);
            } else if (point.x1 < 0) {
              // Negative value suggests already in dB, keep as-is
              newPoint.x1 = point.x1;
            } else {
              // Zero or undefined - set to very small dB value
              newPoint.x1 = -100;
            }
          }
          // Convert x2 if it's SNR
          if (x2Var === 'SNR') {
            if (point.x2 > 0) {
              newPoint.x2 = 10 * Math.log10(point.x2);
            } else if (point.x2 < 0) {
              newPoint.x2 = point.x2;
            } else {
              newPoint.x2 = -100;
            }
          }
          // Convert z if it's SNR (for 3D plots)
          if (zVar === 'SNR') {
            if (point.z > 0) {
              newPoint.z = 10 * Math.log10(point.z);
            } else if (point.z < 0) {
              newPoint.z = point.z;
            } else {
              newPoint.z = -100;
            }
          }
          return newPoint;
        });
      }
    } else if (xVar === 'SNR' && currentSnrUnit === 'dB' && meta.type !== 'rawData') {
      // For regular line plots (NOT tables - tables already have values in user's chosen unit)
      // Backend returns LINEAR SNR values, so we convert to dB here for display
      if (multiSeries && seriesData) {
        // Transform multi-series data
        seriesData = seriesData.map(series => ({
          ...series,
          data: series.data.map(point => ({
            ...point,
            x: 10 * Math.log10(point.x)  // Convert linear to dB
          }))
        }));
      } else if (plotData) {
        // Transform single-series data
        plotData = plotData.map(point => ({
          ...point,
          x: 10 * Math.log10(point.x)  // Convert linear to dB
        }));
      }
    }

    const options = {
      // Title removed - will be shown separately outside plot
      width: 600,
      height: 400,
      marginLeft: 80,
      marginRight: 40,
      marginTop: 40,  // Reduced since no title
      marginBottom: 64,
      grid: true,
      style: {
        background: colors.background,
        fontSize: '12px',
        fontFamily: "'Inter', Arial, sans-serif",
        color: colors.text
      },
      // Pass colors for tooltips and other elements
      colors: colors
    };

    // Configure X axis based on scale type
    // Use nice: true so grid lines extend to nice round numbers
    if (scale === 'logX' || scale === 'logLog') {
      // Log scale (data is already transformed if SNR in dB)
      options.x = {
        type: 'log',
        label: xLabel,
        labelOffset: 50,
        tickFormat: formatBase10Tick,  // Use base-10 format with superscripts
        nice: true
      };
    } else {
      // Linear scale (data is already transformed if SNR in dB)
      options.x = {
        label: xLabel,
        labelOffset: 50,
        nice: true
      };
    }

    // Configure Y axis based on scale type
    if (scale === 'logY' || scale === 'logLog') {
      options.y = {
        type: 'log',
        label: yLabel,
        labelOffset: 35,
        tickFormat: formatBase10Tick,  // Use base-10 format with superscripts
        nice: true
      };
    } else {
      options.y = {
        label: yLabel,
        labelOffset: 35,
        nice: true
      };
    }

    // Handle different plot types
    if (meta.type === 'rawData') {
      return createRawDataTable(plotData, meta, xLabel, yLabel, scale);
    } else if (meta.type === 'contour') {
      // Get translated zLabel
      const zVar = meta.zVar || meta.yVar;
      const zLabel = getTranslatedAxisLabel(zVar, snrUnit);
      return createContourPlot(plotData, meta, options, xLabel, yLabel, zLabel, frameVisible);
    } else if (multiSeries && seriesData) {
      return createMultiSeriesLinePlot(seriesData, meta, options, hoveredIndex, frameVisible);
    } else {
      return createLinePlot(plotData, meta, options, frameVisible);
    }
  }

  // Wrap subtitle text to multiple lines when it exceeds max character width
  function wrapSubtitle(params, maxCharsPerLine = 45) {
    if (params.length === 0) return '';

    const lines = [];
    let currentLine = [];
    let currentLength = 0;

    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      const separator = i === 0 ? '' : ' • ';
      const segmentLength = separator.length + param.length;

      // Check if adding this param would exceed the line limit
      if (currentLength + segmentLength > maxCharsPerLine && currentLine.length > 0) {
        // Finish current line and start new one
        lines.push(currentLine.join(' • '));
        currentLine = [param];
        currentLength = param.length;
      } else {
        // Add to current line
        currentLine.push(param);
        currentLength += segmentLength;
      }
    }

    // Add remaining line
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' • '));
    }

    return lines.join('\n');
  }

  function createSinglePointCards(point, xLabel, yLabel, formatNumber) {
    // Create container matching Single Point Computation style
    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      max-width: 800px;
    `;

    // Create grid for cards
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 15px;
    `;

    // Helper to create a card
    const createCard = (label, value, isPrimary = false) => {
      const card = document.createElement('div');
      const borderColor = isPrimary ? '#C8102E' : '#DCDCDC';
      const bgGradient = isPrimary
        ? 'linear-gradient(135deg, rgba(200, 16, 46, 0.02) 0%, white 100%)'
        : 'white';

      card.style.cssText = `
        background: ${bgGradient};
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: 1px solid ${borderColor};
        transition: transform 0.15s ease;
      `;

      // Add hover effect
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      });
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      });

      // Label
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      labelEl.style.cssText = `
        font-size: 0.85em;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      `;

      // Value
      const valueEl = document.createElement('div');
      valueEl.textContent = formatNumber(value);
      valueEl.style.cssText = `
        font-size: 1.5em;
        font-weight: 700;
        color: ${isPrimary ? '#C8102E' : '#222222'};
        margin-bottom: 10px;
        word-break: break-all;
        font-family: 'Courier New', monospace;
      `;

      card.appendChild(labelEl);
      card.appendChild(valueEl);
      return card;
    };

    // Create cards for X and Y values
    grid.appendChild(createCard(xLabel, point.x, false));
    grid.appendChild(createCard(yLabel, point.y, true));

    container.appendChild(grid);
    return container;
  }

  function createRawDataTable(plotData, meta, xLabel, yLabel, scale) {
    // Smart number formatter: use regular notation for small exponents, scientific for large
    function formatNumber(num) {
      if (typeof num !== 'number' || !isFinite(num)) return String(num);

      // Handle zero and near-zero values
      if (num === 0 || Math.abs(num) < 1e-10) return '0';

      const absNum = Math.abs(num);

      // For numbers between 0.001 and 10000, use regular decimal notation
      if (absNum >= 0.001 && absNum < 10000) {
        // Use toPrecision to limit significant figures, then remove trailing zeros
        return parseFloat(num.toPrecision(6)).toString();
      }

      // For very small or very large numbers, use scientific notation
      return num.toExponential(6);
    }

    // Check if this is multi-Y table mode (all 3 Y variables)
    const isMultiY = meta.isMultiY === true;

    // Get CSS variables for consistent styling
    const computedStyles = getComputedStyle(document.documentElement);
    const borderColor = computedStyles.getPropertyValue('--border-color') || '#DCDCDC';

    // Create main container - minimal wrapper
    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      max-width: ${isMultiY ? '1000px' : '800px'};
    `;

    // Create scrollable wrapper - shows ~10 rows at a time
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      max-height: 440px;
      overflow: auto;
      border: 1px solid ${borderColor};
      border-radius: 6px;
    `;

    // Create table with app theme styling
    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse; font-family: Inter, Arial, sans-serif; font-size: 12px; background: white;';

    // Create thead with sticky header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.cssText = 'background: #fdf5f6;';

    // Define headers based on mode
    let headers;
    if (isMultiY) {
      // Multi-Y mode: X, Error Exponent, Error Probability, Optimal ρ
      // Use translated headers from metadata if available
      const th = meta.tableHeaders || {};
      headers = [
        xLabel,
        th.errorExponent || 'Error Exponent',
        th.errorProbability || 'Error Probability',
        th.optimalRho || 'Optimal ρ',
        th.mutualInformation || 'Mutual Information',
        th.cutoffRate || 'Cutoff Rate (R₀)'
      ];
    } else {
      // Legacy single-Y mode
      const isLogX = scale === 'logX' || scale === 'logLog';
      const isLogY = scale === 'logY' || scale === 'logLog';
      const finalXLabel = isLogX ? `log₁₀(${xLabel})` : xLabel;
      const finalYLabel = isLogY ? `log₁₀(${yLabel})` : yLabel;
      headers = ['#', finalXLabel, finalYLabel];
    }

    headers.forEach((text) => {
      const th = document.createElement('th');
      th.textContent = text;
      th.style.cssText = `
        padding: 10px 12px;
        border: 1px solid ${borderColor};
        text-align: right;
        font-weight: 600;
        position: sticky;
        top: 0;
        background: #fdf5f6;
        color: #374151;
        font-size: 1.2em;
        letter-spacing: 0.3px;
        z-index: 10;
      `;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create tbody with alternating row colors
    const tbody = document.createElement('tbody');

    if (isMultiY) {
      // Multi-Y mode: each row has x, error_exponent, error_probability, rho
      plotData.forEach((point, index) => {
        const row = document.createElement('tr');
        const bgColor = index % 2 === 0 ? 'white' : '#fafafa';
        row.style.cssText = `background: ${bgColor}; transition: background-color 0.15s;`;

        row.addEventListener('mouseenter', function() {
          this.style.background = 'rgba(200, 16, 46, 0.03)';
        });
        row.addEventListener('mouseleave', function() {
          this.style.background = bgColor;
        });

        // X value
        const td1 = document.createElement('td');
        td1.textContent = formatNumber(point.x);
        td1.style.cssText = `padding: 8px 12px; border: 1px solid ${borderColor}; text-align: right; font-family: "Courier New", monospace; color: #374151;`;
        row.appendChild(td1);

        // Error Exponent
        const td2 = document.createElement('td');
        td2.textContent = formatNumber(point.error_exponent);
        td2.style.cssText = `padding: 8px 12px; border: 1px solid ${borderColor}; text-align: right; font-family: "Courier New", monospace; color: #374151;`;
        row.appendChild(td2);

        // Error Probability
        const td3 = document.createElement('td');
        td3.textContent = formatNumber(point.error_probability);
        td3.style.cssText = `padding: 8px 12px; border: 1px solid ${borderColor}; text-align: right; font-family: "Courier New", monospace; color: #374151;`;
        row.appendChild(td3);

        // Optimal ρ
        const td4 = document.createElement('td');
        td4.textContent = formatNumber(point.rho);
        td4.style.cssText = `padding: 8px 12px; border: 1px solid ${borderColor}; text-align: right; font-family: "Courier New", monospace; color: #374151;`;
        row.appendChild(td4);

        // Mutual Information I(X;Y) = E0'(0)
        const td5 = document.createElement('td');
        td5.textContent = formatNumber(point.mutual_information);
        td5.style.cssText = `padding: 8px 12px; border: 1px solid ${borderColor}; text-align: right; font-family: "Courier New", monospace; color: #374151;`;
        row.appendChild(td5);

        // Cutoff Rate R₀ = E0(1)
        const td6 = document.createElement('td');
        td6.textContent = formatNumber(point.cutoff_rate);
        td6.style.cssText = `padding: 8px 12px; border: 1px solid ${borderColor}; text-align: right; font-family: "Courier New", monospace; color: #374151;`;
        row.appendChild(td6);

        tbody.appendChild(row);
      });
    } else {
      // Legacy single-Y mode
      const isLogX = scale === 'logX' || scale === 'logLog';
      const isLogY = scale === 'logY' || scale === 'logLog';

      plotData.forEach((point, index) => {
        const row = document.createElement('tr');
        const bgColor = index % 2 === 0 ? 'white' : '#fafafa';
        row.style.cssText = `background: ${bgColor}; transition: background-color 0.15s;`;

        row.addEventListener('mouseenter', function() {
          this.style.background = 'rgba(200, 16, 46, 0.03)';
        });
        row.addEventListener('mouseleave', function() {
          this.style.background = bgColor;
        });

        // Row number
        const td1 = document.createElement('td');
        td1.textContent = (index + 1).toString();
        td1.style.cssText = `padding: 8px 12px; border: 1px solid ${borderColor}; text-align: right; color: #9ca3af; font-size: 11px;`;
        row.appendChild(td1);

        // X value
        const td2 = document.createElement('td');
        const xVal = isLogX && point.x > 0 ? Math.log10(point.x) : point.x;
        td2.textContent = formatNumber(xVal);
        td2.style.cssText = `padding: 8px 12px; border: 1px solid ${borderColor}; text-align: right; font-family: "Courier New", monospace; color: #374151;`;
        row.appendChild(td2);

        // Y value
        const td3 = document.createElement('td');
        const yVal = isLogY && point.y > 0 ? Math.log10(point.y) : point.y;
        td3.textContent = formatNumber(yVal);
        td3.style.cssText = `padding: 8px 12px; border: 1px solid ${borderColor}; text-align: right; font-family: "Courier New", monospace; color: #374151;`;
        row.appendChild(td3);

        tbody.appendChild(row);
      });
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);

    return container;
  }

  function createLinePlot(plotData, meta, baseOptions, frameVisible) {
    const marks = [];

    // Add frame (box around plot area) for scientific paper style
    if (frameVisible) {
      marks.push(Plot.frame({ stroke: baseOptions.colors?.text || 'currentColor', strokeOpacity: 0.3, strokeWidth: 1.5 }));
    }

    // Add line mark
    marks.push(
      Plot.line(plotData, {
        x: 'x',
        y: 'y',
        stroke: resolveColor(meta.lineColor) || 'steelblue',
        strokeWidth: 2,
        strokeDasharray: meta.lineType === 'dashed' ? '5,5' : null
      })
    );

    // Add dots for data points
    marks.push(
      Plot.dot(plotData, {
        x: 'x',
        y: 'y',
        fill: resolveColor(meta.lineColor) || 'steelblue',
        r: 3,
        opacity: 0.7
      })
    );

    // Add tooltip for hover values with theme-aware colors
    const tipColors = baseOptions.colors || { background: 'white', text: 'black' };
    // Use translated labels from baseOptions instead of raw meta labels
    const tooltipXLabel = baseOptions.x?.label || meta.xLabel || 'X';
    const tooltipYLabel = baseOptions.y?.label || meta.yLabel || 'Y';
    marks.push(
      Plot.tip(plotData, Plot.pointerX({
        x: 'x',
        y: 'y',
        fill: tipColors.background === 'transparent' ? '#1C1C1C' : tipColors.background,
        stroke: tipColors.grid,
        textFill: tipColors.text,
        title: (d) => `${tooltipXLabel}: ${d.x?.toExponential ? d.x.toExponential(3) : d.x}\n${tooltipYLabel}: ${d.y?.toExponential ? d.y.toExponential(3) : d.y}`
      }))
    );

    // Global parameters removed - will be shown separately outside plot
    const plotOptions = {
      ...baseOptions,
      marks
    };

    // No subtitle - parameters displayed externally
    return plotOptions;
  }

  function createMultiSeriesLinePlot(seriesData, meta, baseOptions, hoveredIndex, frameVisible) {
    const marks = [];

    // Add frame (box around plot area) for scientific paper style
    if (frameVisible) {
      marks.push(Plot.frame({ stroke: baseOptions.colors?.text || 'currentColor', strokeOpacity: 0.3, strokeWidth: 1.5 }));
    }

    // Use the original EPCalculator color scheme with more distinct colors
    const defaultColors = ["black", "#C8102E", "steelblue", "#FF8C00", "purple", "seagreen", "goldenrod",
      "#FF1493", "royalblue", "orchid", "darkcyan", "tomato"];

    // Generate intelligent series labels and global parameters
    const xVar = meta.xVar || seriesData[0]?.plotParams?.xVar || 'x';
    const yVar = meta.yVar || seriesData[0]?.plotParams?.yVar || 'y';
    const seriesLabels = generateSeriesLabels(seriesData, xVar, yVar);
    const globalParams = generateGlobalParameters(seriesData, xVar, yVar);

    // Prepare data with series labels for legend
    const plotDataWithLabels = [];

    // Create marks for each series
    seriesData.forEach((series, index) => {
      const color = resolveColor(series.metadata?.lineColor) || defaultColors[index % defaultColors.length];
      const lineType = series.metadata?.lineType || 'solid';
      const seriesLabelText = seriesLabels[index] || `${seriesLabel} ${index + 1}`;

      // Determine opacity based on hover state
      const isHovered = hoveredIndex === index;
      const isSomethingHovered = hoveredIndex !== undefined;
      const lineOpacity = isSomethingHovered ? (isHovered ? 1 : 0.2) : 1;
      const dotOpacity = isSomethingHovered ? (isHovered ? 0.7 : 0.15) : 0.7;

      console.log(`Series ${index}: color=${color}, label=${seriesLabelText}`);

      // Add series label to each data point for legend grouping
      const dataWithLabel = series.data.map(point => ({
        ...point,
        series: seriesLabelText
      }));

      plotDataWithLabels.push(...dataWithLabel);

      // Add line mark for this series
      marks.push(
        Plot.line(dataWithLabel, {
          x: 'x',
          y: 'y',
          stroke: color,
          strokeWidth: isHovered ? 3 : 2,
          strokeDasharray: lineType === 'dashed' ? '5,5' : null,
          opacity: lineOpacity
        })
      );

      // Add dots for data points for this series
      marks.push(
        Plot.dot(dataWithLabel, {
          x: 'x',
          y: 'y',
          fill: color,
          r: isHovered ? 4 : 3,
          opacity: dotOpacity
        })
      );
    });

    // Add tooltip for all series combined with theme-aware colors
    const tipColors = baseOptions.colors || { background: 'white', text: 'black', grid: '#e0e0e0' };
    // Use translated labels from baseOptions instead of raw meta labels
    const tooltipXLabel = baseOptions.x?.label || meta.xLabel || 'X';
    const tooltipYLabel = baseOptions.y?.label || meta.yLabel || 'Y';
    marks.push(
      Plot.tip(plotDataWithLabels, Plot.pointerX({
        x: 'x',
        y: 'y',
        fill: tipColors.background === 'transparent' ? '#1C1C1C' : tipColors.background,
        stroke: tipColors.grid,
        textFill: tipColors.text,
        title: (d) => `${d.series}\n${tooltipXLabel}: ${d.x?.toExponential ? d.x.toExponential(3) : d.x}\n${tooltipYLabel}: ${d.y?.toExponential ? d.y.toExponential(3) : d.y}`
      }))
    );

    // Legend and global parameters removed - will be shown separately outside plot
    const plotOptions = {
      ...baseOptions,
      marks,
      color: {
        legend: false,  // Legend shown in series list, not in plot
        domain: seriesLabels,
        range: seriesLabels.map((_, index) =>
          resolveColor(seriesData[index]?.metadata?.lineColor) || defaultColors[index % defaultColors.length]
        )
      }
    };

    // No subtitle - parameters displayed externally

    // Create color scale for legend
    const colorScale = {};
    seriesLabels.forEach((label, index) => {
      const color = resolveColor(seriesData[index]?.metadata?.lineColor) || defaultColors[index % defaultColors.length];
      colorScale[label] = color;
    });

    return plotOptions;
  }

  function generateSinglePlotParameters(meta) {
    // Extract parameters from metadata with compact format
    const params = [];

    // Get excluded params (those on axes)
    // For contour plots, also exclude xVar2/x2Var (second X axis) and zVar (Z axis)
    const excludedParams = new Set([
      meta.xVar,
      meta.yVar,
      meta.xVar2,
      meta.x2Var,
      meta.zVar
    ]);

    // Collect all available parameters from metadata
    const availableParams = ['M', 'typeModulation', 'SNR', 'R', 'n', 'N', 'threshold'];

    for (const key of availableParams) {
      if (excludedParams.has(key)) continue;

      const value = meta[key];
      if (value !== undefined && value !== null) {
        let formattedValue = value;

        if (key === 'threshold' && typeof value === 'number') {
          formattedValue = value.toExponential(0);
        } else if (typeof value === 'number' && value % 1 !== 0) {
          formattedValue = value.toPrecision(3);
        }

        // Compact formatting
        if (key === 'typeModulation') {
          params.push(formattedValue); // Just "PAM" or "QAM"
        } else if (key === 'M') {
          params.push(`M=${formattedValue}`);
        } else if (key === 'SNR' && meta.SNRUnit) {
          // Only show unit when it's dB, omit unit for linear
          // Read from simulation parameters (SNRUnit with capital letters)
          params.push(meta.SNRUnit === 'dB' ? `SNR=${formattedValue} dB` : `SNR=${formattedValue}`);
        } else if (key === 'R') {
          params.push(`R=${formattedValue}`);
        } else if (key === 'n') {
          params.push(`n=${formattedValue}`);
        } else if (key === 'N') {
          params.push(`N=${formattedValue}`);
        } else if (key === 'threshold') {
          params.push(`Thr=${formattedValue}`); // Abbreviated
        }
      }
    }

    // Check distribution and shaping_param with compact format - use translated labels
    if (meta.distribution && meta.distribution !== 'uniform') {
      const distValue = distLabels[meta.distribution] || meta.distribution;
      params.push(distValue); // Just translated distribution name

      // Only add shaping_param for Maxwell-Boltzmann
      if (meta.distribution === 'maxwell-boltzmann' && meta.shaping_param !== undefined) {
        params.push(`β=${meta.shaping_param.toFixed(1)}`);
      }
    } else if (meta.distribution === 'uniform') {
      params.push(distLabels.uniform);
    }

    return params;
  }

  function generateSeriesLabels(seriesData, xVar, yVar) {
    if (!seriesData || seriesData.length === 0) return [];

    // Find which parameters vary between series
    const firstSeries = seriesData[0];
    if (!firstSeries?.simulationParams && !firstSeries?.plotParams) {
      return seriesData.map((_, index) => `${seriesLabel} ${index + 1}`);
    }

    // Define basic parameters (excluding advanced ones)
    const basicSimulationParams = ['M', 'typeModulation', 'SNR', 'R', 'n'];
    const basicPlotParams = ['distribution', 'shaping_param', 'snrUnit'];

    // Exclude X and Y axis parameters from labeling
    const excludedParams = new Set([xVar, yVar]);

    const availableSimParams = basicSimulationParams.filter(key => !excludedParams.has(key));
    const availablePlotParams = basicPlotParams.filter(key => !excludedParams.has(key));

    // Find parameters that vary between series
    const varyingParams = [];

    // Check simulation parameters
    for (const key of availableSimParams) {
      const values = seriesData.map(series => series.simulationParams?.[key]);
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length > 1) {
        varyingParams.push({ source: 'sim', key });
      }
    }

    // Check if there's a mix of distributions
    const allDistributions = seriesData.map(series => series.plotParams?.distribution);
    const uniqueDistributions = [...new Set(allDistributions)];
    const hasMixedDistributions = uniqueDistributions.length > 1;
    const hasMB = allDistributions.some(dist => dist === 'maxwell-boltzmann');

    // Check plot parameters (distribution, shaping_param, snrUnit)
    for (const key of availablePlotParams) {
      const values = seriesData.map(series => series.plotParams?.[key]);
      const uniqueValues = [...new Set(values)];

      // Always include shaping_param if there's a mix of distributions and at least one MB
      if (key === 'shaping_param' && hasMixedDistributions && hasMB) {
        varyingParams.push({ source: 'plot', key });
        continue;
      }

      if (uniqueValues.length > 1) {
        varyingParams.push({ source: 'plot', key });
      }
    }

    if (varyingParams.length === 0) {
      // If no basic parameters vary, check advanced parameters
      const advancedParams = ['N', 'threshold'];
      const availableAdvanced = advancedParams.filter(key => !excludedParams.has(key));

      for (const key of availableAdvanced) {
        const values = seriesData.map(series => series.simulationParams?.[key]);
        const uniqueValues = [...new Set(values)];
        if (uniqueValues.length > 1) {
          varyingParams.push({ source: 'sim', key });
          break; // Only use first varying advanced parameter
        }
      }
    }

    // Use translated legend labels
    const paramDisplayNames = legendLabels;

    if (varyingParams.length > 0) {
      return seriesData.map(series => {
        const labelParts = [];
        const seriesDistribution = series.plotParams?.distribution;

        for (const param of varyingParams) {
          // Skip shaping_param for this specific series if it has uniform distribution
          if (param.key === 'shaping_param' && seriesDistribution === 'uniform') {
            continue;
          }

          const value = param.source === 'plot'
            ? series.plotParams?.[param.key]
            : series.simulationParams?.[param.key];

          // Skip undefined/null values (fixes "M=undefined" issue for imported data)
          if (value === undefined || value === null) {
            continue;
          }

          const displayName = paramDisplayNames[param.key] || param.key;

          // Format the value appropriately
          let formattedValue = value;
          if (param.key === 'threshold' && typeof value === 'number') {
            formattedValue = value.toExponential(0);
          } else if (param.key === 'shaping_param' && typeof value === 'number') {
            formattedValue = value.toFixed(1);
          } else if (param.key === 'snrUnit') {
            // Format SNR unit as "dB" or "linear"
            formattedValue = value === 'dB' ? 'dB' : 'linear';
          } else if (param.key === 'distribution') {
            formattedValue = distLabels[value] || value;
          } else if (typeof value === 'number' && value % 1 !== 0) {
            formattedValue = value.toPrecision(3);
          }

          labelParts.push(`${displayName}=${formattedValue}`);
        }

        return labelParts.join(', ');
      });
    }

    // If no varying parameters found, use generic labels
    return seriesData.map((_, index) => `${seriesLabel} ${index + 1}`);
  }

  function generateGlobalParameters(seriesData, xVar, yVar) {
    if (!seriesData || seriesData.length === 0) return [];

    const firstSeries = seriesData[0];
    if (!firstSeries?.simulationParams && !firstSeries?.plotParams) {
      return [];
    }

    // Define all parameters
    const allSimulationKeys = ['M', 'typeModulation', 'SNR', 'R', 'n', 'N', 'threshold'];
    const allPlotKeys = ['distribution', 'shaping_param', 'snrUnit'];

    // Exclude X and Y axis parameters
    const excludedParams = new Set([xVar, yVar]);
    const availableSimParams = allSimulationKeys.filter(key => !excludedParams.has(key));
    const availablePlotParams = allPlotKeys.filter(key => !excludedParams.has(key));

    // Check if shaping_param (beta) is on x-axis
    const isBetaOnXAxis = xVar === 'shaping_param' || yVar === 'shaping_param';

    // Check distribution types across all series
    const allDistributions = seriesData.map(series => series.plotParams?.distribution);
    const allMaxwellBoltzmann = allDistributions.every(dist => dist === 'maxwell-boltzmann');

    // Find parameters that are common (don't vary) between series
    const globalParams = [];

    // Get SNR unit if it's common across all series (for appending to SNR value)
    // Read from simulation parameters (SNRUnit) not plot parameters (snrUnit)
    const snrUnits = seriesData.map(series => series.simulationParams?.SNRUnit);
    const uniqueSnrUnits = [...new Set(snrUnits)];
    const commonSnrUnit = uniqueSnrUnits.length === 1 ? uniqueSnrUnits[0] : null;

    // Check simulation parameters
    for (const key of availableSimParams) {
      const values = seriesData.map(series => series.simulationParams?.[key]);
      const uniqueValues = [...new Set(values)];
      // Skip undefined values (fixes "M=undefined" for imported data)
      if (uniqueValues.length === 1 && uniqueValues[0] !== undefined && uniqueValues[0] !== null) {
        globalParams.push({
          source: 'sim',
          key,
          value: uniqueValues[0],
          snrUnit: commonSnrUnit  // Pass SNR unit for formatting
        });
      }
    }

    // Check plot parameters
    for (const key of availablePlotParams) {
      // Skip shaping_param when it's on the x-axis (varying parameter)
      if (key === 'shaping_param' && isBetaOnXAxis) {
        continue;
      }

      // Only include shaping_param if ALL series use Maxwell-Boltzmann distribution
      if (key === 'shaping_param' && !allMaxwellBoltzmann) {
        continue;
      }

      // Skip distribution when beta is on x-axis (implied Maxwell-Boltzmann)
      if (key === 'distribution' && isBetaOnXAxis) {
        continue;
      }

      // Always skip snrUnit - it will be appended to SNR value instead
      if (key === 'snrUnit') {
        continue;
      }

      const values = seriesData.map(series => series.plotParams?.[key]);
      const uniqueValues = [...new Set(values)];
      // Skip undefined/null values (fixes "undefined" for imported data)
      if (uniqueValues.length === 1 && uniqueValues[0] !== undefined && uniqueValues[0] !== null) {
        globalParams.push({
          source: 'plot',
          key,
          value: uniqueValues[0],
          snrUnit: commonSnrUnit
        });
      }
    }

    // Compact format with abbreviations for reduced redundancy
    return globalParams.map(param => {
      // Format the value appropriately
      let formattedValue = param.value;
      if (param.key === 'threshold' && typeof param.value === 'number') {
        formattedValue = param.value.toExponential(0);
      } else if (param.key === 'shaping_param' && typeof param.value === 'number') {
        formattedValue = param.value.toFixed(1);
      } else if (param.key === 'distribution') {
        formattedValue = distLabels[param.value] || param.value;
      } else if (typeof param.value === 'number' && param.value % 1 !== 0) {
        formattedValue = param.value.toPrecision(3);
      }

      // Compact formatting based on parameter type
      if (param.key === 'typeModulation') {
        return formattedValue; // Just "PAM" or "QAM", no label
      } else if (param.key === 'M') {
        return `M=${formattedValue}`; // M=16
      } else if (param.key === 'SNR' && param.snrUnit) {
        // Only show unit when it's dB, omit unit for linear
        return param.snrUnit === 'dB' ? `SNR=${formattedValue} dB` : `SNR=${formattedValue}`;
      } else if (param.key === 'R') {
        return `R=${formattedValue}`; // R=0.5
      } else if (param.key === 'n') {
        return `n=${formattedValue}`;
      } else if (param.key === 'N') {
        return `N=${formattedValue}`;
      } else if (param.key === 'threshold') {
        return `Thr=${formattedValue}`; // Abbreviated to "Thr"
      } else if (param.key === 'shaping_param') {
        return `β=${formattedValue}`;
      } else if (param.key === 'distribution') {
        return formattedValue; // Just "Uniform" or "MB"
      }

      return `${param.key}=${formattedValue}`;
    });
  }

  function createContourPlot(plotData, meta, baseOptions, xLabel, yLabel, zLabel, frameVisible) {
    // Check if this is a comparison plot (diverging color scheme)
    const isComparison = meta.isDivergingColorScheme === true;

    // Force 2D mode for comparison plots
    const contourMode = isComparison ? '2d' : (meta.contourMode || '2d');
    const contourLevels = meta.contourLevels || 10;

    console.log('[ContourPlot] Creating contour plot:', {
      mode: contourMode,
      isComparison,
      levels: contourLevels,
      dataPoints: plotData?.length,
      sampleData: plotData?.slice(0, 5),
      metadata: {
        x1Label: meta.x1Label,
        x2Label: meta.x2Label,
        zLabel: meta.zLabel,
        type: meta.type
      },
      baseOptions
    });

    // Transform Z values to log space if logarithmic scale is selected for 2D contours
    // Skip log transformation for comparison plots (they show differences which can be negative)
    if (contourMode === '2d' && isLogZ && plotData && !isComparison) {
      plotData = plotData.map(point => ({
        ...point,
        z: point.z > 0 ? Math.log10(point.z) : -10
      }));
    }

    if (contourMode === '3d') {
      // Return a special marker for 3D plots - will be handled by Plotly in updatePlot
      is3DPlot = true;
      return {
        is3D: true,
        plotData: plotData,
        metadata: {
          ...meta,
          // Override with dynamic labels for SNR
          x1Label: xLabel,
          x2Label: yLabel,
          zLabel: zLabel
        }
      };
    }

    // 2D contour plot using Observable Plot
    is3DPlot = false;
    const marks = [];

    // Add frame (box around plot area) for scientific paper style
    if (frameVisible) {
      marks.push(Plot.frame({ stroke: baseOptions.colors?.text || 'currentColor', strokeOpacity: 0.3, strokeWidth: 1.5 }));
    }

    // Create 2D contour plot with specified number of levels
    marks.push(
      Plot.contour(plotData, {
        x: 'x1',
        y: 'x2',
        z: 'z',
        fill: 'z',
        stroke: 'white',
        strokeWidth: 0.5,
        thresholds: contourLevels // Number of contour levels
      })
    );

    // Configure color scheme based on plot type
    // Use the translated zLabel parameter instead of raw meta labels
    const translatedZLabel = zLabel || meta.yLabel || meta.zLabel || 'Z';
    let colorConfig;
    if (isComparison) {
      // Diverging color scheme for comparison plots
      // RdBu = Red (positive/Plot1 higher) to Blue (negative/Plot2 higher)
      colorConfig = {
        legend: true,
        label: translatedZLabel,
        scheme: 'RdBu',
        reverse: true,  // Reverse so blue = negative (Plot 2 higher), red = positive (Plot 1 higher)
        symmetric: true,  // Center the color scale at zero
        type: 'diverging'
      };
    } else {
      // Regular sequential color scheme for normal contour plots
      colorConfig = {
        legend: true,
        label: isLogZ ? `log₁₀(${translatedZLabel})` : translatedZLabel,
        // Use a red-based scheme to match website theme (primary color: #C8102E)
        scheme: 'reds',
        reverse: false
      };
    }

    const result = {
      ...baseOptions,
      // Override x and y labels for contour plots - use dynamic labels for SNR
      x: {
        ...baseOptions.x,
        label: xLabel || meta.x1Label || 'X1'
      },
      y: {
        ...baseOptions.y,
        label: yLabel || meta.x2Label || 'X2'
      },
      marks,
      color: colorConfig
    };

    console.log('[ContourPlot] Final plot options:', result);
    return result;
  }

  function createEmptyPlot(colors) {
    return {
      title: noDataAvailableText,
      width: 600,
      height: 400,
      marginLeft: 80,
      marginRight: 40,
      marginTop: 60,
      marginBottom: 60,
      x: { label: 'X' },
      y: { label: 'Y' },
      style: {
        background: colors?.background || 'white',
        color: colors?.text || 'black'
      },
      marks: [
        Plot.text([{ x: 0, y: 0, text: noDataToDisplayText }], {
          x: 'x',
          y: 'y',
          text: 'text',
          fontSize: 16,
          fill: colors?.textSecondary || '#999'
        })
      ]
    };
  }

  function updatePlot() {
    if (!container && !plotlyContainer) return;

    // Remove existing Observable Plot
    if (plotElement) {
      plotElement.remove();
      plotElement = null;
    }

    try {
      // Check if this is a 3D plot
      if (plotOptions.is3D) {
        // Hide Observable Plot container, show Plotly container
        if (container) container.style.display = 'none';
        if (plotlyContainer) {
          plotlyContainer.style.display = 'block';
          render3DPlot(plotOptions.plotData, plotOptions.metadata);
        }
      } else {
        // Show Observable Plot container, hide Plotly container
        if (container) container.style.display = 'flex';
        if (plotlyContainer) plotlyContainer.style.display = 'none';

        // Check if plotOptions is already a DOM element (for rawData type)
        if (plotOptions instanceof HTMLElement) {
          // It's already a DOM element, just append it
          plotElement = plotOptions;
          container.appendChild(plotElement);
        } else {
          // Create new 2D plot with Observable Plot
          console.log('[PlotContainer] Creating Observable Plot');
          plotElement = Plot.plot(plotOptions);
          plotElement.style.overflow = 'hidden';
          container.appendChild(plotElement);

          // Replace SVG axis tick labels with HTML overlays for consistent font rendering
          // Observable Plot returns a figure element containing the SVG
          const svg = plotElement.tagName === 'svg' ? plotElement : plotElement.querySelector('svg');
          console.log('[PlotContainer] plotElement tag:', plotElement.tagName, 'Found SVG:', !!svg);
          if (svg) {
            replaceAxisLabelsWithHtml(plotElement, svg);
          } else {
            console.log('[PlotContainer] No SVG found. plotElement innerHTML preview:', plotElement.innerHTML?.substring(0, 200));
          }
        }

        // Notify parent that plot element is ready (for export)
        if (onPlotElementReady) {
          onPlotElementReady(container);
        }
      }
    } catch (error) {
      console.error('Error creating plot:', error);

      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 400px;
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 6px;
          flex-direction: column;
          gap: 10px;
        ">
          <div style="font-size: 2rem;">⚠️</div>
          <div style="font-weight: 600; color: #666;">${plotErrorText}</div>
          <div style="font-size: 0.9em; color: #999;">${error.message}</div>
        </div>
      `;
      if (container) {
        container.appendChild(errorDiv);
      }
    }
  }

  function render3DPlot(plotData, meta) {
    if (!plotlyContainer) return;

    // Check if this is an overlay comparison
    const isOverlay = meta.isOverlayComparison === true;

    // Determine axis variables for SNR unit handling
    const x1Var = meta.xVar || meta.x1Var;
    const x2Var = meta.xVar2 || meta.x2Var;
    const zVar = meta.zVar || meta.yVar;

    // Generate dynamic translated labels based on SNR unit
    let x1Label = getTranslatedAxisLabel(x1Var, currentSnrUnit);
    let x2Label = getTranslatedAxisLabel(x2Var, currentSnrUnit);
    let zLabel = getTranslatedAxisLabel(zVar, currentSnrUnit);

    let data;

    if (isOverlay && (meta.plot1Data || meta.isMultiSurfaceBenchmark)) {
      // Helper function to create a surface
      const createSurface = (sourceData, colorscale, name, colorbarIndex) => {
        const x1Values = [...new Set(sourceData.map(p => p.x1))].sort((a, b) => a - b);
        const x2Values = [...new Set(sourceData.map(p => p.x2))].sort((a, b) => a - b);

        const zMatrix = [];
        for (let i = 0; i < x2Values.length; i++) {
          const row = [];
          for (let j = 0; j < x1Values.length; j++) {
            const point = sourceData.find(p => p.x1 === x1Values[j] && p.x2 === x2Values[i]);
            let zValue = point ? point.z : 0;

            if (isLogZ && zValue > 0) {
              zValue = Math.log10(zValue);
            } else if (isLogZ && zValue <= 0) {
              zValue = -10;
            }

            row.push(zValue);
          }
          zMatrix.push(row);
        }

        // Position colorbars dynamically: 1.02, 1.14, 1.26, 1.38, ...
        const xPosition = 1.02 + (colorbarIndex * 0.12);

        return {
          type: 'surface',
          x: x1Values,
          y: x2Values,
          z: zMatrix,
          name: name,
          colorscale: colorscale,
          showscale: true,
          opacity: 0.85,
          colorbar: {
            title: {
              text: name,
              side: 'right'
            },
            titleside: 'right',
            titlefont: {
              family: 'Inter, Arial, sans-serif',
              size: 11,
              color: '#333'
            },
            tickfont: {
              family: 'Inter, Arial, sans-serif',
              size: 9,
              color: '#666'
            },
            x: xPosition,
            xpad: 0,
            len: 0.9,
            thickness: 15
          }
        };
      };

      // Define colorscales for multiple surfaces
      const colorScales = [
        // Purple (Plot 1)
        [
          [0, '#faf5ff'], [0.2, '#f3e8ff'], [0.4, '#d8b4fe'],
          [0.6, '#c084fc'], [0.8, '#a855f7'], [1, '#9333ea']
        ],
        // Yellow (Plot 2)
        [
          [0, '#fefce8'], [0.2, '#fef9c3'], [0.4, '#fde047'],
          [0.6, '#facc15'], [0.8, '#eab308'], [1, '#ca8a04']
        ],
        // Green (Plot 3)
        [
          [0, '#f0fdf4'], [0.2, '#dcfce7'], [0.4, '#86efac'],
          [0.6, '#4ade80'], [0.8, '#22c55e'], [1, '#15803d']
        ],
        // Orange (Plot 4)
        [
          [0, '#fff7ed'], [0.2, '#ffedd5'], [0.4, '#fdba74'],
          [0.6, '#fb923c'], [0.8, '#f97316'], [1, '#c2410c']
        ],
        // Cyan (Plot 5)
        [
          [0, '#ecfeff'], [0.2, '#cffafe'], [0.4, '#67e8f9'],
          [0.6, '#22d3ee'], [0.8, '#06b6d4'], [1, '#0e7490']
        ],
        // Pink (Plot 6)
        [
          [0, '#fdf2f8'], [0.2, '#fce7f3'], [0.4, '#f9a8d4'],
          [0.6, '#f472b6'], [0.8, '#ec4899'], [1, '#be185d']
        ]
      ];

      if (meta.isMultiSurfaceBenchmark) {
        // Multi-surface benchmark (3+ plots)
        const plotCount = meta.plotCount || 2;
        data = [];

        for (let i = 0; i < plotCount; i++) {
          const plotNum = i + 1;
          const plotData = meta[`plot${plotNum}Data`];
          const plotTitle = meta[`plot${plotNum}Title`] || `Plot ${plotNum}`;
          const colorScale = colorScales[i % colorScales.length]; // Cycle through colors

          if (plotData) {
            data.push(createSurface(plotData, colorScale, plotTitle, i));
          }
        }
      } else {
        // Dual-surface benchmark (2 plots) - backward compatibility
        data = [
          createSurface(meta.plot1Data, colorScales[0], meta.plot1Title || 'Plot 1', 0),
          createSurface(meta.plot2Data, colorScales[1], meta.plot2Title || 'Plot 2', 1)
        ];
      }
    } else {
      // Standard single surface rendering
      const x1Values = [...new Set(plotData.map(p => p.x1))].sort((a, b) => a - b);
      const x2Values = [...new Set(plotData.map(p => p.x2))].sort((a, b) => a - b);

      const zMatrix = [];
      for (let i = 0; i < x2Values.length; i++) {
        const row = [];
        for (let j = 0; j < x1Values.length; j++) {
          const point = plotData.find(p => p.x1 === x1Values[j] && p.x2 === x2Values[i]);
          let zValue = point ? point.z : 0;

          if (isLogZ && zValue > 0) {
            zValue = Math.log10(zValue);
          } else if (isLogZ && zValue <= 0) {
            zValue = -10;
          }

          row.push(zValue);
        }
        zMatrix.push(row);
      }

      data = [{
        type: 'surface',
        x: x1Values,
        y: x2Values,
        z: zMatrix,
        colorscale: [
          [0, '#fff5f5'],
          [0.2, '#fecaca'],
          [0.4, '#f87171'],
          [0.6, '#dc2626'],
          [0.8, '#C8102E'],
          [1, '#7f1d1d']
        ],
        colorbar: {
          title: zLabel || meta.zLabel || 'Z',
          titleside: 'right',
          titlefont: {
            family: 'Inter, Arial, sans-serif',
            size: 12,
            color: '#333'
          },
          tickfont: {
            family: 'Inter, Arial, sans-serif',
            size: 10,
            color: '#666'
          }
        }
      }];
    }

    const layout = {
      autosize: true,
      width: 650,
      height: 500,
      margin: {
        l: 0,
        r: 0,
        b: 0,
        t: 40
      },
      scene: {
        xaxis: {
          title: {
            text: x1Label,
            font: {
              family: 'Inter, Arial, sans-serif',
              size: 14,
              color: '#333'
            }
          },
          tickfont: {
            family: 'Inter, Arial, sans-serif',
            size: 12,
            color: '#666'
          },
          type: isLogX ? 'log' : 'linear',
          showgrid: true,
          gridcolor: '#e0e0e0'
        },
        yaxis: {
          title: {
            text: x2Label,
            font: {
              family: 'Inter, Arial, sans-serif',
              size: 14,
              color: '#333'
            }
          },
          tickfont: {
            family: 'Inter, Arial, sans-serif',
            size: 12,
            color: '#666'
          },
          type: isLogY ? 'log' : 'linear',
          showgrid: true,
          gridcolor: '#e0e0e0'
        },
        zaxis: {
          title: {
            text: isLogZ ? `log₁₀(${zLabel})` : zLabel,
            font: {
              family: 'Inter, Arial, sans-serif',
              size: 14,
              color: '#333'
            }
          },
          tickfont: {
            family: 'Inter, Arial, sans-serif',
            size: 12,
            color: '#666'
          },
          // Use linear type because data is already transformed to log space
          type: 'linear',
          showgrid: true,
          gridcolor: '#e0e0e0'
        },
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.3 }
        }
      },
      paper_bgcolor: 'white',
      plot_bgcolor: 'white',
      font: {
        family: 'Inter, Arial, sans-serif',
        size: 12
      }
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d']
    };

    Plotly.newPlot(plotlyContainer, data, layout, config);

    // Notify parent for export
    if (onPlotElementReady) {
      onPlotElementReady(plotlyContainer);
    }
  }

  onDestroy(() => {
    // Clean up Plotly
    if (plotlyContainer) {
      Plotly.purge(plotlyContainer);
    }
  });

  // Replace SVG axis tick labels with HTML elements for consistent font rendering
  function replaceAxisLabelsWithHtml(plotElement, svg) {
    console.log('[PlotContainer] replaceAxisLabelsWithHtml called');

    // Find the parent container where we'll append the HTML labels
    const parentContainer = svg.parentElement || plotElement.parentElement;
    if (!parentContainer) return;

    // Remove any existing HTML labels container (important for re-renders)
    const existingLabels = parentContainer.querySelector('.html-axis-labels');
    if (existingLabels) {
      existingLabels.remove();
    }

    // Create a container for HTML labels
    const labelsContainer = document.createElement('div');
    labelsContainer.className = 'html-axis-labels';
    labelsContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible;';

    // Get parent container position for offset calculations
    const containerRect = parentContainer.getBoundingClientRect();

    // For FIGURE elements, we need to search within the plotElement, not just the first SVG
    // Observable Plot may create multiple SVGs or nest things differently for contour plots
    const searchRoot = plotElement.tagName === 'FIGURE' ? plotElement : svg;

    // Find all axis tick label text elements (covers line plots, contour plots, and any other types)
    // Observable Plot uses aria-label attributes like "x-axis tick label", "y-axis tick label" etc.
    const tickLabels = searchRoot.querySelectorAll('g[aria-label*="tick label"] text');

    tickLabels.forEach(textEl => {
      const text = textEl.textContent;

      // Use getBoundingClientRect to get actual screen position
      const textRect = textEl.getBoundingClientRect();

      // Calculate position relative to parent container
      const x = textRect.left - containerRect.left + textRect.width / 2;
      const y = textRect.top - containerRect.top + textRect.height / 2;

      // Get text-anchor for alignment
      const textAnchor = textEl.getAttribute('text-anchor') || 'middle';

      // Create HTML label
      const label = document.createElement('span');
      label.textContent = text;
      label.className = 'html-tick-label';

      // Determine alignment based on text-anchor
      let translateX = '-50%';
      if (textAnchor === 'end') {
        translateX = '-100%';
      } else if (textAnchor === 'start') {
        translateX = '0';
      }

      label.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        transform: translate(${translateX}, -50%);
        font-family: 'Inter', Arial, sans-serif;
        font-size: 12px;
        font-weight: 300;
        color: var(--text-color, black);
        white-space: nowrap;
      `;

      labelsContainer.appendChild(label);

      // Hide the original SVG text
      textEl.style.visibility = 'hidden';
    });

    // Make parent position relative and append labels
    parentContainer.style.position = 'relative';
    parentContainer.appendChild(labelsContainer);
    console.log('[PlotContainer] Created', labelsContainer.children.length, 'HTML labels, appended to:', parentContainer.tagName);
  }

  onMount(() => {
    updatePlot();
  });

  afterUpdate(() => {
    updatePlot();
  });

  function handleExportComplete(event) {
    const { format, filename, success, error } = event.detail;

    if (success) {
      console.log(`Plot exported successfully as ${format}: ${filename}`);
    } else {
      console.error(`Export failed:`, error);
    }
  }
</script>

<div class="plot-container">
  <!-- Observable Plot content (2D) -->
  <div bind:this={container} class="plot-content"></div>

  <!-- Plotly content (3D) -->
  <div bind:this={plotlyContainer} class="plotly-content"></div>

  {#if metadata.title}
    <div class="plot-caption">
      {metadata.title}
    </div>
  {/if}
</div>

<style>
  .plot-container {
    background: var(--card-background);
    border-radius: 0 0 8px 8px;
    padding: var(--spacing-md);
    transition: all var(--transition-normal);
    overflow: visible;
  }

  .plot-content {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow: visible;
  }

  .plotly-content {
    display: none;
    justify-content: center;
    align-items: center;
    min-height: 500px;
    width: 100%;
  }

  .plot-caption {
    text-align: center;
    margin-top: var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    font-weight: 500;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .plot-container {
      padding: var(--spacing-sm);
    }

    :global(.plot-content svg) {
      max-width: 100%;
      height: auto;
    }
  }

  /* Format plot elements to match PNG export style EXACTLY */

  /* Ensure plot content is centered */
  .plot-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* Center figure elements (Observable Plot wraps SVG + legend in figure) */
  :global(.plot-content figure) {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  /* Title: bold 18px Inter/Arial, black, centered */
  :global(.plot-content svg g[aria-label="title"] text),
  :global(.plot-content h2) {
    fill: black !important;
    color: black !important;
    font-weight: bold !important;
    font-size: 18px !important;
    font-family: Inter, Arial, sans-serif !important;
    text-anchor: middle !important;
    text-align: center !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Subtitle: 14px Inter/Arial, grey (#666), centered */
  :global(.plot-content svg g[aria-label="subtitle"] text),
  :global(.plot-content h3) {
    fill: #666 !important;
    color: #666 !important;
    font-size: 14px !important;
    font-weight: normal !important;
    font-family: Inter, Arial, sans-serif !important;
    text-anchor: middle !important;
    text-align: center !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Legend container: centered, proper spacing */
  :global(.plot-content div[class*="swatches"]) {
    font-family: Inter, Arial, sans-serif !important;
    font-size: 12px !important;
    color: black !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    flex-wrap: wrap !important;
    gap: 20px !important;
    margin: 10px auto !important;
    padding: 0 !important;
    width: 100% !important;
    text-align: center !important;
  }

  /* Legend items: 12px, black, inline */
  :global(.plot-content div[class*="swatch"]) {
    display: inline-flex !important;
    align-items: center !important;
    gap: 5px !important;
    font-family: Inter, Arial, sans-serif !important;
    font-size: 12px !important;
    color: black !important;
  }

  /* Legend color squares: exactly 15x15 */
  :global(.plot-content div[class*="swatch"] svg) {
    width: 15px !important;
    height: 15px !important;
    min-width: 15px !important;
    min-height: 15px !important;
    margin-right: 5px !important;
  }

  /* Force Inter font on SVG plot elements to match plot-params-line */
  :global(.plot-svg-inter-font),
  :global(.plot-svg-inter-font text),
  :global(.plot-svg-inter-font tspan),
  :global(.plot-svg-inter-font *) {
    font-family: 'Inter', Arial, sans-serif !important;
    font-weight: 400 !important;
    -webkit-font-smoothing: subpixel-antialiased !important;
    -moz-osx-font-smoothing: auto !important;
    text-rendering: geometricPrecision !important;
    font-synthesis: none !important;
    font-optical-sizing: auto !important;
  }

  :global(.plot-svg-inter-font text) {
    stroke: none !important;
    paint-order: fill !important;
  }

  /* Print styles */
  @media print {
    .plot-container {
      break-inside: avoid;
      box-shadow: none;
      border: 1px solid #ccc;
    }
  }
</style>