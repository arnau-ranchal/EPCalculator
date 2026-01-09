<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { currentColorTheme } from '../../stores/theme.js';

  // Color resolution helpers (same as PlottingPanel/PlotContainer)
  function hexToHsl(hex) {
    let r, g, b;
    if (hex.startsWith('#')) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        r = parseInt(result[1], 16) / 255;
        g = parseInt(result[2], 16) / 255;
        b = parseInt(result[3], 16) / 255;
      } else {
        return { h: 0, s: 0, l: 0.5 };
      }
    } else {
      const namedColorHues = {
        'black': { h: 0, s: 0, l: 0 },
        'steelblue': { h: 207, s: 0.44, l: 0.49 },
        'purple': { h: 300, s: 1, l: 0.25 },
        'seagreen': { h: 146, s: 0.5, l: 0.36 },
        'goldenrod': { h: 43, s: 0.74, l: 0.49 },
        'royalblue': { h: 225, s: 0.73, l: 0.57 },
        'orchid': { h: 302, s: 0.59, l: 0.65 },
        'darkcyan': { h: 180, s: 1, l: 0.27 },
        'teal': { h: 180, s: 1, l: 0.25 },
        'navy': { h: 240, s: 1, l: 0.25 },
        'forestgreen': { h: 120, s: 0.61, l: 0.34 },
        'darkorange': { h: 33, s: 1, l: 0.5 },
        'chocolate': { h: 25, s: 0.75, l: 0.47 },
        'darkslateblue': { h: 248, s: 0.39, l: 0.39 },
        'olive': { h: 60, s: 1, l: 0.25 }
      };
      return namedColorHues[hex.toLowerCase()] || { h: 0, s: 0, l: 0.5 };
    }

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
      h *= 360;
    }
    return { h, s, l };
  }

  function areColorsSimilar(color1, color2, hueThreshold = 35) {
    const hsl1 = hexToHsl(color1);
    const hsl2 = hexToHsl(color2);

    if ((hsl1.l < 0.15 || hsl1.s < 0.1) && (hsl2.l < 0.15 || hsl2.s < 0.1)) {
      return true;
    }

    let hueDiff = Math.abs(hsl1.h - hsl2.h);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;

    return hueDiff < hueThreshold;
  }

  const basePalette = [
    "black", "steelblue", "#FF8C00", "purple", "seagreen", "goldenrod",
    "royalblue", "orchid", "darkcyan", "teal", "navy", "forestgreen",
    "darkorange", "chocolate", "darkslateblue", "olive"
  ];

  // Get series color - matches PlotContainer/PlottingPanel logic
  function getSeriesColor(series, index) {
    const emphasisColorValue = $currentColorTheme?.primary || '#C8102E';

    // If series has explicit color, resolve it
    if (series?.metadata?.lineColor) {
      if (series.metadata.lineColor === 'emphasis') {
        return emphasisColorValue;
      }
      return series.metadata.lineColor;
    }
    // Otherwise use filtered palette based on emphasis color
    const filteredPalette = basePalette.filter(color => !areColorsSimilar(color, emphasisColorValue));
    return filteredPalette[index % filteredPalette.length];
  }

  export let plotElement = null;
  export let plotId = '';
  export let metadata = {};
  export let plotTitle = '';  // Title for export (e.g., "Error Probability vs SNR (dB)")
  export let globalParams = [];  // Global params array (e.g., ["M=16", "QAM", "R=0.5"])
  export let seriesData = null;  // Series data for multi-series plots (for legend)

  const dispatch = createEventDispatcher();

  let showExportMenu = false;
  let isExporting = false;

  function toggleExportMenu(event) {
    event.stopPropagation(); // Prevent handleClickOutside from firing
    showExportMenu = !showExportMenu;
  }

  function closeExportMenu() {
    showExportMenu = false;
  }

  // Generate descriptive filename based on axes and ALL global parameters
  function generateDescriptiveFilename() {
    const parts = [];

    // Add Y variable (clean up label)
    const yVar = (metadata.yLabel || 'Y').replace(/[^a-zA-Z0-9]/g, '');
    parts.push(yVar);

    // Add "vs" separator
    parts.push('vs');

    // Add X variable (clean up label)
    const xVar = (metadata.xLabel || 'X').replace(/[^a-zA-Z0-9]/g, '');
    parts.push(xVar);

    // Add ALL global parameters (no limit)
    if (globalParams && globalParams.length > 0) {
      // Clean and simplify param strings, preserve units
      const cleanParams = globalParams.map(param => {
        // Remove special characters except alphanumeric, =, -, and common units (dB)
        return param.replace(/[^a-zA-Z0-9=.-]/g, '').replace(/\s/g, '');
      });
      parts.push(...cleanParams);
    }

    // Join with underscores
    return parts.join('_');
  }

  async function exportPlot(format) {
    if (!plotElement) {
      console.error('No plot element available for export');
      return;
    }

    isExporting = true;
    closeExportMenu();

    try {
      let exportData;
      // Generate descriptive filename with axis names and key parameters
      const descriptiveName = generateDescriptiveFilename();
      // Add timestamp for uniqueness
      const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
      const filename = `${descriptiveName}_${timestamp}`;

      if (format === 'svg') {
        exportData = await exportSVG(filename);
      } else if (format === 'png') {
        exportData = await exportPNG(filename);
      } else if (format === 'csv') {
        exportData = await exportCSV(filename);
      } else if (format === 'json') {
        exportData = await exportJSON(filename);
      }

      if (exportData) {
        dispatch('export-complete', {
          format,
          filename: exportData.filename,
          success: true
        });
      }

    } catch (error) {
      console.error('Export failed:', error);
      dispatch('export-complete', {
        format,
        success: false,
        error: error.message
      });
    } finally {
      isExporting = false;
    }
  }

  async function exportSVG(filename) {
    console.log('[SVG Export] Starting SVG export with title, params, and legend...');

    // Check if this is a Plotly 3D plot
    const isPlotly3D = metadata.contourMode === '3d' && metadata.type === 'contour';

    if (isPlotly3D) {
      // For Plotly 3D plots, we need to convert to PNG then embed in SVG with title/params
      // (Plotly's SVG export doesn't capture WebGL 3D properly)
      const Plotly = (await import('plotly.js-dist-min')).default;

      try {
        // Get the 3D plot as PNG data URL (WebGL doesn't export well to SVG)
        const plotImageDataUrl = await Plotly.toImage(plotElement, {
          format: 'png',
          width: 900,
          height: 675
        });

        // Create SVG wrapper with title, params, and embedded PNG
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const plotWidth = img.width;
            const plotHeight = img.height;

            const padding = 20;
            const titleHeight = plotTitle ? 50 : 0;
            const subtitleHeight = (globalParams && globalParams.length > 0) ? 40 : 0;

            const totalWidth = plotWidth + (padding * 2);
            const totalHeight = plotHeight + titleHeight + subtitleHeight + (padding * 2);

            let yOffset = padding;

            // Create SVG with embedded image
            let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <rect width="${totalWidth}" height="${totalHeight}" fill="white"/>
`;

            // Add title
            if (plotTitle) {
              svgContent += `  <text x="${totalWidth / 2}" y="${yOffset + 30}"
                    font-family="Inter, Arial, sans-serif" font-size="24" font-weight="bold"
                    text-anchor="middle" fill="black">${plotTitle}</text>\n`;
              yOffset += titleHeight;
            }

            // Add params
            if (globalParams && globalParams.length > 0) {
              const subtitleText = globalParams.join(' • ');
              svgContent += `  <text x="${totalWidth / 2}" y="${yOffset + 25}"
                    font-family="Inter, Arial, sans-serif" font-size="18"
                    text-anchor="middle" fill="#666">${subtitleText}</text>\n`;
              yOffset += subtitleHeight;
            }

            // Embed the PNG image
            svgContent += `  <image x="${padding}" y="${yOffset}" width="${plotWidth}" height="${plotHeight}"
                   xlink:href="${plotImageDataUrl}"/>\n`;
            svgContent += `</svg>`;

            // Convert to blob and download
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            resolve({ filename: `${filename}.svg` });
          };
          img.onerror = () => reject(new Error('Failed to load 3D plot image'));
          img.src = plotImageDataUrl;
        });
      } catch (error) {
        console.error('Plotly SVG export failed:', error);
        throw new Error('Failed to export 3D plot as SVG');
      }
    }

    // Observable Plot export
    // Find the main plot SVG
    const allSvgs = plotElement ? plotElement.querySelectorAll('svg') : [];
    let mainSvg = null;
    let maxArea = 0;

    allSvgs.forEach((svg) => {
      const width = parseFloat(svg.getAttribute('width')) || 0;
      const height = parseFloat(svg.getAttribute('height')) || 0;
      const area = width * height;
      if (area > maxArea) {
        maxArea = area;
        mainSvg = svg;
      }
    });

    if (!mainSvg) {
      throw new Error('No SVG element found in plot');
    }

    const plotWidth = parseFloat(mainSvg.getAttribute('width'));
    const plotHeight = parseFloat(mainSvg.getAttribute('height'));

    // Check if we have series data for legend
    const hasLegend = seriesData && seriesData.length > 1;

    // Calculate dimensions
    const padding = 20;
    const titleHeight = plotTitle ? 40 : 0;
    const subtitleHeight = (globalParams && globalParams.length > 0) ? 30 : 0;
    const legendHeight = hasLegend ? 50 : 0;

    const totalWidth = plotWidth + (padding * 2);
    const totalHeight = plotHeight + titleHeight + subtitleHeight + legendHeight + (padding * 3);

    // Create composite SVG
    const compositeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    compositeSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    compositeSvg.setAttribute('width', totalWidth);
    compositeSvg.setAttribute('height', totalHeight);
    compositeSvg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

    // Add white background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', 'white');
    compositeSvg.appendChild(background);

    let yOffset = padding;

    // Add title
    if (plotTitle) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      title.setAttribute('x', totalWidth / 2);
      title.setAttribute('y', yOffset + 20);
      title.setAttribute('text-anchor', 'middle');
      title.setAttribute('font-family', 'Inter, Arial, sans-serif');
      title.setAttribute('font-size', '18');
      title.setAttribute('font-weight', 'bold');
      title.setAttribute('fill', 'black');
      title.textContent = plotTitle;
      compositeSvg.appendChild(title);
      yOffset += titleHeight;
    }

    // Add global params
    if (globalParams && globalParams.length > 0) {
      const subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      subtitle.setAttribute('x', totalWidth / 2);
      subtitle.setAttribute('y', yOffset + 15);
      subtitle.setAttribute('text-anchor', 'middle');
      subtitle.setAttribute('font-family', 'Inter, Arial, sans-serif');
      subtitle.setAttribute('font-size', '14');
      subtitle.setAttribute('fill', '#666');
      subtitle.textContent = globalParams.join(' • ');
      compositeSvg.appendChild(subtitle);
      yOffset += subtitleHeight;
    }

    // Add legend
    if (hasLegend && seriesData) {
      const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const legendY = yOffset + 10;

      // Calculate positions for centered legend
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.font = '12px Inter, Arial, sans-serif';

      let totalLegendWidth = 0;
      const legendItems = [];

      seriesData.forEach((series, index) => {
        const color = getSeriesColor(series, index);
        const label = series.metadata?.seriesLabel || 'Series';
        const itemWidth = 15 + 5 + tempCtx.measureText(label).width + 20;
        legendItems.push({ color, label, width: itemWidth });
        totalLegendWidth += itemWidth;
      });

      let legendX = (totalWidth - totalLegendWidth) / 2;

      legendItems.forEach((item) => {
        // Color square
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', legendX);
        rect.setAttribute('y', legendY);
        rect.setAttribute('width', '15');
        rect.setAttribute('height', '15');
        rect.setAttribute('fill', item.color);
        legendGroup.appendChild(rect);

        // Label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', legendX + 20);
        text.setAttribute('y', legendY + 12);
        text.setAttribute('font-family', 'Inter, Arial, sans-serif');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', 'black');
        text.textContent = item.label;
        legendGroup.appendChild(text);

        legendX += item.width;
      });

      compositeSvg.appendChild(legendGroup);
      yOffset += legendHeight;
    }

    // Clone and embed the main plot SVG
    const clonedPlot = mainSvg.cloneNode(true);

    // Convert to light mode for export (always white background, black text)
    // embedFontData=false for SVG (can use @import which works when opened in browser)
    await convertSvgToLightMode(clonedPlot, false);

    const plotGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    plotGroup.setAttribute('transform', `translate(${padding}, ${yOffset})`);

    // Copy all children from cloned SVG to group
    while (clonedPlot.firstChild) {
      plotGroup.appendChild(clonedPlot.firstChild);
    }

    compositeSvg.appendChild(plotGroup);

    // Add metadata as comment
    const comment = document.createComment(`
      EPCalculator v2 Plot Export
      Generated: ${new Date().toISOString()}
      Plot ID: ${plotId}
      Type: ${metadata.type || 'line'}
    `);
    compositeSvg.insertBefore(comment, compositeSvg.firstChild);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(compositeSvg);

    downloadFile(svgString, `${filename}.svg`, 'image/svg+xml');
    return { filename: `${filename}.svg` };
  }

  async function exportPNG(filename) {
    console.log('[PNG Export] Starting PNG export with full plot composite...');
    console.log('[PNG Export] plotElement:', plotElement);
    console.log('[PNG Export] metadata:', metadata);

    // Check if this is a Plotly 3D plot
    const isPlotly3D = metadata.contourMode === '3d' && metadata.type === 'contour';
    console.log('[PNG Export] isPlotly3D:', isPlotly3D);

    if (isPlotly3D) {
      // For Plotly 3D plots, capture with toImage then add title/params
      const Plotly = (await import('plotly.js-dist-min')).default;
      console.log('[PNG Export] Using Plotly 3D export path');

      try {
        console.log('[PNG Export] Calling Plotly.toImage...');
        // Get the 3D plot as data URL
        const plotImageDataUrl = await Plotly.toImage(plotElement, {
          format: 'png',
          width: 900,
          height: 675
        });
        console.log('[PNG Export] Got image data URL, length:', plotImageDataUrl.length);

        // Create composite canvas with title and params
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const plotWidth = img.width;
            const plotHeight = img.height;

            const padding = 20;
            const titleHeight = plotTitle ? 50 : 0;
            const subtitleHeight = (globalParams && globalParams.length > 0) ? 40 : 0;

            const totalWidth = plotWidth + (padding * 2);
            const totalHeight = plotHeight + titleHeight + subtitleHeight + (padding * 2);

            const canvas = document.createElement('canvas');
            canvas.width = totalWidth;
            canvas.height = totalHeight;

            const ctx = canvas.getContext('2d');

            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, totalWidth, totalHeight);

            let yOffset = padding;

            // Draw title
            if (plotTitle) {
              ctx.font = 'bold 24px Inter, Arial, sans-serif';
              ctx.fillStyle = 'black';
              ctx.textAlign = 'center';
              ctx.fillText(plotTitle, totalWidth / 2, yOffset + 30);
              yOffset += titleHeight;
            }

            // Draw params
            if (globalParams && globalParams.length > 0) {
              ctx.font = '18px Inter, Arial, sans-serif';
              ctx.fillStyle = '#666';
              ctx.textAlign = 'center';
              const subtitleText = globalParams.join(' • ');
              ctx.fillText(subtitleText, totalWidth / 2, yOffset + 25);
              yOffset += subtitleHeight;
            }

            // Draw the 3D plot image
            ctx.drawImage(img, padding, yOffset, plotWidth, plotHeight);

            // Convert to blob and download
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${filename}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              resolve({ filename: `${filename}.png` });
            }, 'image/png');
          };
          img.onerror = () => reject(new Error('Failed to load 3D plot image'));
          img.src = plotImageDataUrl;
        });
      } catch (error) {
        console.error('Plotly PNG export failed:', error);
        throw new Error('Failed to export 3D plot as PNG');
      }
    }

    // Observable Plot export
    // Find the plot SVG element - look for largest SVG
    const allSvgs = plotElement ? plotElement.querySelectorAll('svg') : [];
    let mainSvg = null;
    let maxArea = 0;

    allSvgs.forEach((svg) => {
      const width = parseFloat(svg.getAttribute('width')) || 0;
      const height = parseFloat(svg.getAttribute('height')) || 0;
      const area = width * height;
      if (area > maxArea) {
        maxArea = area;
        mainSvg = svg;
      }
    });

    if (!mainSvg) {
      throw new Error('No main SVG plot found');
    }

    const plotWidth = parseFloat(mainSvg.getAttribute('width'));
    const plotHeight = parseFloat(mainSvg.getAttribute('height'));

    // Check if we have series data for legend
    const hasLegend = seriesData && seriesData.length > 1;

    console.log(`[PNG Export] Found plot: ${plotWidth}x${plotHeight}`);
    console.log(`[PNG Export] Title: "${plotTitle}", Params: ${globalParams.length > 0 ? globalParams.join(' • ') : 'none'}, Legend: ${hasLegend ? 'YES' : 'NO'}`);

    return new Promise(async (resolve, reject) => {
      try {
        // Create composite canvas with extra space for title, subtitle (global params), and legend
        const padding = 20;
        const titleHeight = plotTitle ? 40 : 0;
        const subtitleHeight = (globalParams && globalParams.length > 0) ? 30 : 0;
        const legendHeight = hasLegend ? 50 : 0;

        const totalWidth = plotWidth + (padding * 2);
        const totalHeight = plotHeight + titleHeight + subtitleHeight + legendHeight + (padding * 3);

        const scale = 2; // High resolution
        const canvas = document.createElement('canvas');
        canvas.width = totalWidth * scale;
        canvas.height = totalHeight * scale;

        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        let yOffset = padding;

        // Draw title (from prop)
        if (plotTitle) {
          ctx.font = 'bold 18px Inter, Arial, sans-serif';
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.fillText(plotTitle, totalWidth / 2, yOffset + 20);
          yOffset += titleHeight;
        }

        // Draw subtitle with global params (from prop)
        if (globalParams && globalParams.length > 0) {
          ctx.font = '14px Inter, Arial, sans-serif';
          ctx.fillStyle = '#666';
          ctx.textAlign = 'center';

          // Join params with bullet separator
          const subtitleText = globalParams.join(' • ');
          const maxWidth = totalWidth - (padding * 4);

          // Split into multiple lines if too long
          const words = globalParams;  // Already split by param
          const lines = [];
          let currentLine = words[0];

          for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' • ' + words[i];
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth) {
              lines.push(currentLine);
              currentLine = words[i];
            } else {
              currentLine = testLine;
            }
          }
          lines.push(currentLine);

          // Draw each line
          const lineHeight = 18;
          lines.forEach((line, index) => {
            ctx.fillText(line, totalWidth / 2, yOffset + 15 + (index * lineHeight));
          });

          // Adjust offset based on number of lines
          yOffset += subtitleHeight + ((lines.length - 1) * lineHeight);
        }

        // Draw legend from series data
        if (hasLegend && seriesData) {
          const legendY = yOffset + 10;
          ctx.font = '12px Inter, Arial, sans-serif';
          ctx.textAlign = 'left';

          // Calculate total width needed for legend to center it
          let totalLegendWidth = 0;
          const legendItems = [];

          seriesData.forEach((series, index) => {
            const color = getSeriesColor(series, index);
            const label = series.metadata?.seriesLabel || 'Series';
            const itemWidth = 15 + 5 + ctx.measureText(label).width + 20; // box + gap + text + spacing
            legendItems.push({ color, label, width: itemWidth });
            totalLegendWidth += itemWidth;
          });

          // Center the legend
          let legendX = (totalWidth - totalLegendWidth) / 2;

          legendItems.forEach((item) => {
            // Draw color square
            ctx.fillStyle = item.color;
            ctx.fillRect(legendX, legendY, 15, 15);

            // Draw label
            ctx.fillStyle = 'black';
            ctx.fillText(item.label, legendX + 20, legendY + 12);

            legendX += item.width;
          });

          yOffset += legendHeight;
        }

        // Now draw the main SVG plot
        const clonedSvg = mainSvg.cloneNode(true);
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Inline styles for SVG elements
        function inlineStyles(original, cloned) {
          const computedStyle = window.getComputedStyle(original);
          const props = ['font-family', 'font-size', 'font-weight', 'font-style',
            'fill', 'stroke', 'stroke-width', 'opacity', 'text-anchor'];

          let styles = '';
          props.forEach(prop => {
            const value = computedStyle.getPropertyValue(prop);
            if (value && value !== '' && value !== 'none') {
              styles += `${prop}:${value};`;
            }
          });

          if (styles) {
            cloned.setAttribute('style', (cloned.getAttribute('style') || '') + styles);
          }

          for (let i = 0; i < original.children.length; i++) {
            if (cloned.children[i]) {
              inlineStyles(original.children[i], cloned.children[i]);
            }
          }
        }

        inlineStyles(mainSvg, clonedSvg);

        // Convert SVG to light mode for export (always export with white background, black text)
        // embedFontData=true to embed Inter font as base64 for isolated blob rendering
        await convertSvgToLightMode(clonedSvg, true);

        // Convert SVG to image and draw on canvas
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();

        img.onload = () => {
          URL.revokeObjectURL(url);

          // Draw SVG plot at calculated position
          ctx.drawImage(img, padding, yOffset, plotWidth, plotHeight);

          // Export canvas as PNG
          canvas.toBlob((blob) => {
            if (blob) {
              console.log(`[PNG Export] Created composite PNG: ${blob.size} bytes`);
              const pngUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = pngUrl;
              a.download = `${filename}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(pngUrl);
              resolve({ filename: `${filename}.png` });
            } else {
              reject(new Error('Failed to create PNG blob'));
            }
          }, 'image/png', 0.95);
        };

        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load SVG image'));
        };

        img.src = url;

      } catch (error) {
        console.error('[PNG Export] Error:', error);
        reject(error);
      }
    });
  }

  async function exportCSV(filename) {
    // Export plot data as CSV
    if (metadata.type === 'contour') {
      // Contour data export - use long format (one row per data point)
      const plotData = metadata.data || [];
      if (plotData.length === 0) {
        throw new Error('No data available for CSV export');
      }

      // Get axis labels
      const x1Label = metadata.xLabel || 'X1';
      const x2Label = metadata.x2Label || 'X2';
      const zLabel = metadata.zLabel || 'Z';

      let csvContent = `${x1Label},${x2Label},${zLabel}\n`;
      plotData.forEach(point => {
        csvContent += `${point.x1},${point.x2},${point.z}\n`;
      });

      downloadFile(csvContent, `${filename}.csv`, 'text/csv');
      return { filename: `${filename}.csv` };
    }

    // Line plot data export - check for multi-series
    const hasMultipleSeries = seriesData && seriesData.length > 1;

    if (hasMultipleSeries) {
      // Multi-series CSV export (wide format)
      return exportMultiSeriesCSV(filename);
    } else {
      // Single-series CSV export
      const plotData = metadata.data || [];
      if (plotData.length === 0) {
        throw new Error('No data available for CSV export');
      }

      let csvContent = `${metadata.xLabel || 'X'},${metadata.yLabel || 'Y'}\n`;
      plotData.forEach(point => {
        csvContent += `${point.x},${point.y}\n`;
      });

      downloadFile(csvContent, `${filename}.csv`, 'text/csv');
      return { filename: `${filename}.csv` };
    }
  }

  function exportMultiSeriesCSV(filename) {
    // Export multi-series plot as stacked-section CSV
    // Format:
    // # EPCalculator v2.0
    // X_Label,Y_Label
    // # [Series1_Label]
    // x1,y1
    // x2,y2
    //
    // # [Series2_Label]
    // x1,y1
    // ...

    if (!seriesData || seriesData.length === 0) {
      throw new Error('No series data available for export');
    }

    const xLabel = metadata.xLabel || 'X';
    const yLabel = metadata.yLabel || 'Y';

    // Start with marker
    let csvContent = '# EPCalculator v2.0\n';

    // Add column headers once at top
    csvContent += `${xLabel},${yLabel}\n`;

    // Export each series as a separate section
    seriesData.forEach((series, i) => {
      // Get series label (unique parameters)
      const seriesLabel = series.metadata?.seriesLabel || series.metadata?.title || `Series ${i + 1}`;

      // Add section header with brackets
      csvContent += `# [${seriesLabel}]\n`;

      // Add data points for this series
      series.data.forEach(point => {
        csvContent += `${point.x},${point.y}\n`;
      });

      // Add blank line between sections (except after last one)
      if (i < seriesData.length - 1) {
        csvContent += '\n';
      }
    });

    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    return { filename: `${filename}.csv` };
  }

  async function exportJSON(filename) {
    // Export complete plot data and metadata as JSON
    const hasMultipleSeries = seriesData && seriesData.length > 1;
    const isContour = metadata.type === 'contour';

    const exportData = {
      version: '2.0',  // Format version for future compatibility
      exportTimestamp: new Date().toISOString(),
      plotId: plotId,
      generator: 'EPCalculator v2',
      plot: {
        type: metadata.type || 'line',
        xLabel: metadata.xLabel || 'X',
        yLabel: metadata.yLabel || 'Y',
        x2Label: isContour ? (metadata.x2Label || 'X2') : null,
        zLabel: isContour ? (metadata.zLabel || 'Z') : null,
        contourMode: isContour ? (metadata.contourMode || '2d') : null,
        title: plotTitle || null
      }
    };

    if (isContour) {
      // Contour plot export
      exportData.isContour = true;
      exportData.data = {
        x1: (metadata.data || []).map(p => p.x1),
        x2: (metadata.data || []).map(p => p.x2),
        z: (metadata.data || []).map(p => p.z)
      };
      exportData.metadata = {
        xVar: metadata.xVar,
        x2Var: metadata.xVar2,
        yVar: metadata.yVar
      };
      if (metadata.simulationParams) {
        exportData.simulationParams = metadata.simulationParams;
      }
      if (metadata.plotParams) {
        exportData.plotParams = metadata.plotParams;
      }
    } else if (hasMultipleSeries) {
      // Multi-series JSON export with full metadata
      exportData.isMultiSeries = true;
      exportData.globalParams = globalParams || [];
      exportData.series = seriesData.map((series, i) => {
        const seriesLabel = series.metadata?.seriesLabel || series.metadata?.title || `Series ${i + 1}`;

        // Extract unique parameters from series label
        // Format: "M=16" or "M=16, R=0.5" or "SNR: 10 dB"
        const uniqueParams = {};
        if (seriesLabel) {
          // Try to parse key=value pairs
          const paramMatches = seriesLabel.matchAll(/(\w+)\s*[=:]\s*([^\s,]+(?:\s+\w+)?)/g);
          for (const match of paramMatches) {
            const key = match[1];
            const value = match[2];
            // Try to parse as number, otherwise keep as string
            const numValue = parseFloat(value);
            uniqueParams[key] = isNaN(numValue) ? value : numValue;
          }
        }

        return {
          name: seriesLabel,
          uniqueParams: uniqueParams,  // New field for easy parsing on import
          data: {
            x: series.data.map(p => p.x),
            y: series.data.map(p => p.y)
          },
          metadata: {
            xVar: series.metadata?.xVar,
            yVar: series.metadata?.yVar,
            lineColor: series.metadata?.lineColor,
            lineType: series.metadata?.lineType
          },
          simulationParams: series.simulationParams || {},
          plotParams: series.plotParams || {}
        };
      });
    } else {
      // Single-series JSON export (backward compatible)
      exportData.isMultiSeries = false;
      exportData.data = {
        x: (metadata.data || []).map(p => p.x),
        y: (metadata.data || []).map(p => p.y)
      };
      exportData.metadata = {
        xVar: metadata.xVar,
        yVar: metadata.yVar,
        lineColor: metadata.lineColor,
        lineType: metadata.lineType
      };
      // Include simulation params if available (fixes "undefined" on re-import)
      if (metadata.simulationParams) {
        exportData.simulationParams = metadata.simulationParams;
      }
      if (metadata.plotParams) {
        exportData.plotParams = metadata.plotParams;
      }
    }

    const jsonString = JSON.stringify(exportData, null, 2);
    downloadFile(jsonString, `${filename}.json`, 'application/json');
    return { filename: `${filename}.json` };
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Close menu when clicking outside
  function handleClickOutside(event) {
    if (showExportMenu && !event.target.closest('.export-menu-container')) {
      closeExportMenu();
    }
  }

  // Redraw SVG text labels on canvas with proper Inter font
  // This is needed because SVG rendered as blob can't access web fonts
  function redrawTextLabelsOnCanvas(ctx, svg, offsetX, offsetY) {
    const textElements = svg.querySelectorAll('text');

    textElements.forEach(text => {
      const content = text.textContent;
      if (!content || content.trim() === '') return;

      // Get position from transform or x/y attributes
      let x = parseFloat(text.getAttribute('x')) || 0;
      let y = parseFloat(text.getAttribute('y')) || 0;

      // Check for transform attribute
      const transform = text.getAttribute('transform');
      if (transform) {
        const translateMatch = transform.match(/translate\(([^,]+),?\s*([^)]*)\)/);
        if (translateMatch) {
          x += parseFloat(translateMatch[1]) || 0;
          y += parseFloat(translateMatch[2]) || 0;
        }
        // Handle rotation for axis labels
        const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
        if (rotateMatch) {
          // Skip rotated text for now - it's complex to handle
          // The y-axis label will use system font but that's acceptable
        }
      }

      // Check parent g elements for transforms
      let parent = text.parentElement;
      while (parent && parent.tagName === 'g') {
        const parentTransform = parent.getAttribute('transform');
        if (parentTransform) {
          const translateMatch = parentTransform.match(/translate\(([^,]+),?\s*([^)]*)\)/);
          if (translateMatch) {
            x += parseFloat(translateMatch[1]) || 0;
            y += parseFloat(translateMatch[2]) || 0;
          }
        }
        parent = parent.parentElement;
      }

      // Get text styling
      const textAnchor = text.getAttribute('text-anchor') || 'start';
      const fontSize = parseFloat(text.getAttribute('font-size')) || 12;

      // Set canvas text properties
      ctx.font = `300 ${fontSize}px 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;
      ctx.fillStyle = 'black';

      // Set text alignment based on text-anchor
      if (textAnchor === 'middle') {
        ctx.textAlign = 'center';
      } else if (textAnchor === 'end') {
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'left';
      }
      ctx.textBaseline = 'middle';

      // Draw a white rectangle behind the text to cover the SVG text
      const metrics = ctx.measureText(content);
      const textWidth = metrics.width;
      const textHeight = fontSize * 1.2;

      let bgX = x + offsetX;
      if (textAnchor === 'middle') bgX -= textWidth / 2;
      else if (textAnchor === 'end') bgX -= textWidth;

      ctx.fillStyle = 'white';
      ctx.fillRect(bgX - 2, y + offsetY - textHeight / 2 - 1, textWidth + 4, textHeight + 2);

      // Draw the text
      ctx.fillStyle = 'black';
      ctx.fillText(content, x + offsetX, y + offsetY);
    });
  }

  // Embed Inter font in SVG for consistent export rendering
  // For PNG export, we need to embed the actual font data since blob rendering is isolated
  async function embedInterFontInSvg(svg, embedFontData = false) {
    // Create a defs element if it doesn't exist
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.setAttribute('type', 'text/css');

    if (embedFontData) {
      // For PNG export: Fetch the Inter font and embed as base64
      try {
        console.log('[Export] Fetching Inter font for embedding...');
        const response = await fetch('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2');

        if (!response.ok) {
          throw new Error(`Font fetch failed: ${response.status}`);
        }

        const fontBuffer = await response.arrayBuffer();
        console.log('[Export] Font fetched, size:', fontBuffer.byteLength);

        // Convert to base64
        const uint8Array = new Uint8Array(fontBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Font = btoa(binary);
        console.log('[Export] Font encoded, base64 length:', base64Font.length);

        style.textContent = `
          @font-face {
            font-family: 'InterEmbed';
            font-style: normal;
            font-weight: 100 900;
            src: url(data:font/woff2;base64,${base64Font}) format('woff2-variations'), url(data:font/woff2;base64,${base64Font}) format('woff2');
          }
          text {
            font-family: 'InterEmbed', 'Inter', Arial, sans-serif !important;
            font-weight: 100 !important;
            font-variation-settings: 'wght' 100 !important;
          }
        `;
        console.log('[Export] Font embedded in SVG style');
      } catch (e) {
        console.warn('[Export] Could not embed font:', e);
        style.textContent = `text { font-family: Arial, sans-serif !important; }`;
      }
    } else {
      // For SVG export: Use @import (works when opened in browser)
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        text {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important;
        }
      `;
    }

    defs.appendChild(style);
  }

  // Convert SVG to light mode colors for export (always white background, black text)
  // Also restore hidden text elements (hidden by HTML overlay system in PlotContainer)
  // and apply the same font styling as the HTML overlays for consistent appearance
  // embedFontData: true for PNG (needs embedded font), false for SVG (can use @import)
  async function convertSvgToLightMode(svg, embedFontData = false) {
    // Embed Inter font for consistent rendering in exported files
    await embedInterFontInSvg(svg, embedFontData);

    // Apply font styling to all text elements
    // Use 'InterEmbed' when font is embedded (PNG), or 'Inter' with fallbacks (SVG)
    const fontFamily = embedFontData
      ? "'InterEmbed', Arial, sans-serif"
      : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";

    const textElements = svg.querySelectorAll('text');
    const fontWeight = embedFontData ? '100' : '300';
    console.log(`[Export] Applying font-weight: ${fontWeight} to ${textElements.length} text elements`);

    textElements.forEach((text, i) => {
      // Get current style and rebuild it with our font overrides
      const currentStyle = text.getAttribute('style') || '';

      // Remove any existing font properties from the style string
      const cleanedStyle = currentStyle
        .replace(/font-family\s*:[^;]+;?/gi, '')
        .replace(/font-size\s*:[^;]+;?/gi, '')
        .replace(/font-weight\s*:[^;]+;?/gi, '');

      // Check if this is an axis label (contains arrows ↑ or →) - use Arial for consistent arrows
      const textContent = text.textContent || '';
      const isAxisLabel = textContent.includes('↑') || textContent.includes('→');
      const effectiveFontFamily = isAxisLabel ? 'Arial, sans-serif' : fontFamily;

      // For axis labels, enlarge arrows by wrapping them in tspan FIRST (before setting styles)
      if (isAxisLabel) {
        console.log('[Export] Found axis label with arrow:', textContent);
        // Clear and rebuild with tspans for larger arrows
        while (text.firstChild) {
          text.removeChild(text.firstChild);
        }
        const parts = textContent.split(/(↑|→)/);
        console.log('[Export] Split into parts:', parts);
        parts.forEach(part => {
          const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.textContent = part;
          if (part === '↑' || part === '→') {
            tspan.setAttribute('style', 'font-size: 16px; font-family: Arial, sans-serif;');
            console.log('[Export] Created arrow tspan with larger font');
          }
          text.appendChild(tspan);
        });
      }

      // Apply our font styling with visibility restored
      const newStyle = `${cleanedStyle}; visibility: visible; font-family: ${effectiveFontFamily}; font-size: 12px; font-weight: ${fontWeight};`;
      text.setAttribute('style', newStyle);

      // Also set attributes as backup (some SVG renderers prefer attributes over style)
      text.setAttribute('font-family', effectiveFontFamily);
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', fontWeight);

      // Debug: log first text element's final style
      if (i === 0) {
        console.log('[Export] First text element style:', text.getAttribute('style'));
      }
    });

    // Dark mode colors to replace
    const darkColors = {
      'transparent': 'white',  // transparent background -> white
      '#1A1A1A': 'white',      // dark background -> white
      '#1a1a1a': 'white',
      'rgb(26, 26, 26)': 'white',
      '#E8E8E8': 'black',      // light text -> black
      '#e8e8e8': 'black',
      'rgb(232, 232, 232)': 'black',
      '#888888': '#666',       // secondary text -> darker gray
      'rgb(136, 136, 136)': '#666',
      '#333333': '#e0e0e0',    // dark grid -> light grid
      'rgb(51, 51, 51)': '#e0e0e0',
      '#666666': '#999',       // dark axis -> gray axis
      'rgb(102, 102, 102)': '#999'
    };

    // Replace background color in style attribute
    const style = svg.getAttribute('style') || '';
    let newStyle = style;
    for (const [dark, light] of Object.entries(darkColors)) {
      newStyle = newStyle.replace(new RegExp(dark.replace(/[()]/g, '\\$&'), 'gi'), light);
    }
    svg.setAttribute('style', newStyle);

    // Recursively process all child elements
    function processElement(el) {
      // Check and replace fill attribute
      const fill = el.getAttribute('fill');
      if (fill && darkColors[fill.toLowerCase()]) {
        el.setAttribute('fill', darkColors[fill.toLowerCase()]);
      }

      // Check and replace stroke attribute
      const stroke = el.getAttribute('stroke');
      if (stroke && darkColors[stroke.toLowerCase()]) {
        el.setAttribute('stroke', darkColors[stroke.toLowerCase()]);
      }

      // Check and replace style attribute
      const elStyle = el.getAttribute('style');
      if (elStyle) {
        let newElStyle = elStyle;
        for (const [dark, light] of Object.entries(darkColors)) {
          newElStyle = newElStyle.replace(new RegExp(dark.replace(/[()]/g, '\\$&'), 'gi'), light);
        }
        el.setAttribute('style', newElStyle);
      }

      // Process children
      Array.from(el.children).forEach(processElement);
    }

    Array.from(svg.children).forEach(processElement);
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="plot-exporter">
  <button
    type="button"
    class="export-trigger"
    class:active={showExportMenu}
    on:click={toggleExportMenu}
    disabled={isExporting}
    title={$_('export.tooltip')}
  >
    {#if isExporting}
      <span class="export-spinner"></span>
    {:else}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 1V10M8 10L5 7M8 10L11 7"/>
        <path d="M2 13H14"/>
      </svg>
    {/if}
  </button>

  {#if showExportMenu}
    <div class="export-menu-container">
      <div class="export-menu">
        <div class="export-header">
          <h4>{$_('export.title')}</h4>
          <button type="button" class="close-button" on:click={closeExportMenu}>×</button>
        </div>

        <div class="export-options">
          {#if metadata.type !== 'rawData'}
            <div class="export-section">
              <h5>{$_('export.imageFormats')}</h5>
              <button type="button" class="export-option" on:click={() => exportPlot('svg')}>
                <span class="option-icon">🎨</span>
                <div class="option-details">
                  <strong>SVG</strong>
                  <small>{$_('export.svgDesc')}</small>
                </div>
              </button>

              <button type="button" class="export-option" on:click={() => exportPlot('png')}>
                <span class="option-icon">🖼️</span>
                <div class="option-details">
                  <strong>PNG</strong>
                  <small>{$_('export.pngDesc')}</small>
                </div>
              </button>
            </div>
          {/if}

          <div class="export-section">
            <h5>{$_('export.dataFormats')}</h5>
            <button type="button" class="export-option" on:click={() => exportPlot('csv')}>
              <span class="option-icon">📊</span>
              <div class="option-details">
                <strong>CSV</strong>
                <small>{$_('export.csvDesc')}</small>
              </div>
            </button>

            <button type="button" class="export-option" on:click={() => exportPlot('json')}>
              <span class="option-icon">📋</span>
              <div class="option-details">
                <strong>JSON</strong>
                <small>{$_('export.jsonDesc')}</small>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .plot-exporter {
    position: relative;
  }

  .export-trigger {
    background: var(--surface-color);
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
    color: var(--text-color);
  }

  .export-trigger:hover {
    background: var(--hover-background);
    transform: translateY(-1px);
  }

  .export-trigger.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }

  .export-trigger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .export-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .export-menu-container {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 1000;
    margin-top: 4px;
  }

  .export-menu {
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    min-width: 280px;
    max-width: 320px;
  }

  .export-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
  }

  .export-header h4 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-color);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.2em;
    cursor: pointer;
    color: var(--text-color-secondary);
    padding: 4px;
    border-radius: 4px;
    transition: all var(--transition-fast);
  }

  .close-button:hover {
    background: var(--hover-background);
    color: var(--text-color);
  }

  .export-options {
    padding: var(--spacing-md);
  }

  .export-section {
    margin-bottom: var(--spacing-md);
  }

  .export-section:last-child {
    margin-bottom: 0;
  }

  .export-section h5 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .export-option {
    width: 100%;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: var(--spacing-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: 6px;
    text-align: left;
  }

  .export-option:last-child {
    margin-bottom: 0;
  }

  .export-option:hover {
    background: var(--result-background);
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }

  .option-icon {
    font-size: 1.2em;
    flex-shrink: 0;
  }

  .option-details {
    flex: 1;
  }

  .option-details strong {
    display: block;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 2px;
  }

  .option-details small {
    color: var(--text-color-secondary);
    font-size: 0.85em;
  }

  @media (max-width: 768px) {
    .export-menu-container {
      right: auto;
      left: 0;
    }

    .export-menu {
      min-width: 260px;
    }
  }
</style>