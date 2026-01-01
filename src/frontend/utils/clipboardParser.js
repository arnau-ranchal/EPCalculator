// Clipboard data parser for paste functionality
// Supports various formats: TSV (Excel), CSV, space-separated (MATLAB)

/**
 * Detects the delimiter used in pasted text
 * @param {string} text - First few lines of pasted text
 * @returns {string} Detected delimiter: '\t', ',', or ' '
 */
function detectDelimiter(text) {
  const lines = text.trim().split('\n').slice(0, 3); // Check first 3 lines

  // Count occurrences of each delimiter
  let tabCount = 0;
  let commaCount = 0;
  let spaceCount = 0;

  for (const line of lines) {
    if (line.includes('\t')) tabCount++;
    if (line.includes(',')) commaCount++;
    // Count multiple consecutive spaces as one delimiter
    if (/\s{2,}/.test(line) || /\S\s\S/.test(line)) spaceCount++;
  }

  // Tab (TSV/Excel) has highest priority
  if (tabCount >= 2) return '\t';
  // Comma (CSV) second priority
  if (commaCount >= 2) return ',';
  // Space-separated (MATLAB console) lowest priority
  if (spaceCount >= 2) return ' ';

  // Default to tab (most common from Excel)
  return '\t';
}

/**
 * Parses pasted text data
 * Supports TSV (Excel), CSV, space-separated (MATLAB console output)
 * Detects and handles multi-column data (multi-series)
 *
 * @param {string} text - Pasted text content
 * @returns {object} Parsed data with x, y arrays and labels (or multi-series data)
 */
export function parseClipboardData(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Pasted data is empty');
  }

  const lines = text.trim().split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith('#');
  });

  if (lines.length === 0) {
    throw new Error('No valid data found in pasted text');
  }

  // Detect delimiter
  const delimiter = detectDelimiter(text);

  // Parse first line to check for headers and column count
  const firstLine = lines[0].split(delimiter).map(s => s.trim()).filter(s => s.length > 0);
  const firstIsHeader = firstLine.some(val => isNaN(parseFloat(val)) && val.length > 0);

  // Check if multi-column (3+ columns means multi-series)
  if (firstLine.length >= 3) {
    return parseMultiColumnClipboard(lines, delimiter, firstIsHeader);
  }

  // Single-series parsing (original behavior)
  let xLabel = 'X';
  let yLabel = 'Y';
  let dataLines = lines;

  if (firstIsHeader) {
    xLabel = firstLine[0] || 'X';
    yLabel = firstLine[1] || 'Y';
    dataLines = lines.slice(1);
  }

  // Parse data lines
  const xValues = [];
  const yValues = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    // Split by delimiter and filter empty strings (for space-separated data)
    const parts = line.split(delimiter)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (parts.length < 2) {
      throw new Error(`Line ${i + 1}: Expected at least 2 columns, got ${parts.length}`);
    }

    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);

    if (isNaN(x) || isNaN(y)) {
      throw new Error(`Line ${i + 1}: Invalid numeric values (x=${parts[0]}, y=${parts[1]})`);
    }

    if (!isFinite(x) || !isFinite(y)) {
      throw new Error(`Line ${i + 1}: Values must be finite (no Infinity or NaN)`);
    }

    xValues.push(x);
    yValues.push(y);
  }

  if (xValues.length === 0) {
    throw new Error('No valid data points found in pasted text');
  }

  // Validate point count
  const maxPoints = 10000;
  if (xValues.length > maxPoints) {
    throw new Error(`Too many data points (${xValues.length}). Maximum is ${maxPoints}`);
  }

  return {
    x: xValues,
    y: yValues,
    xLabel,
    yLabel,
    pointCount: xValues.length,
    delimiter: delimiter === '\t' ? 'tab' : delimiter === ',' ? 'comma' : 'space'
  };
}

/**
 * Parse multi-column clipboard data (3+ columns)
 * Format: X, Series1, Series2, Series3, ...
 */
function parseMultiColumnClipboard(lines, delimiter, hasHeader) {
  const headers = lines[0].split(delimiter).map(s => s.trim()).filter(s => s.length > 0);

  const xLabel = hasHeader ? headers[0] : 'X';
  const seriesLabels = hasHeader ? headers.slice(1) : headers.slice(1).map((_, i) => `Series ${i + 1}`);

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const xValues = [];
  const seriesValues = seriesLabels.map(() => []);

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    const parts = line.split(delimiter).map(s => s.trim()).filter(s => s.length > 0);

    if (parts.length < headers.length) {
      throw new Error(`Line ${i + (hasHeader ? 2 : 1)}: Expected ${headers.length} columns, got ${parts.length}`);
    }

    const x = parseFloat(parts[0]);
    if (isNaN(x) || !isFinite(x)) {
      throw new Error(`Line ${i + (hasHeader ? 2 : 1)}: Invalid X value (${parts[0]})`);
    }

    xValues.push(x);

    // Parse each series column
    for (let j = 1; j < parts.length; j++) {
      const y = parts[j].trim() === '' ? null : parseFloat(parts[j]);

      if (y !== null && (isNaN(y) || !isFinite(y))) {
        throw new Error(`Line ${i + (hasHeader ? 2 : 1)}, Column ${j + 1}: Invalid value (${parts[j]})`);
      }

      seriesValues[j - 1].push(y);
    }
  }

  if (xValues.length === 0) {
    throw new Error('No valid data points found');
  }

  // Build series array
  const series = seriesLabels.map((label, i) => {
    const validPoints = [];
    for (let j = 0; j < xValues.length; j++) {
      if (seriesValues[i][j] !== null) {
        validPoints.push({ x: xValues[j], y: seriesValues[i][j] });
      }
    }

    return {
      x: validPoints.map(p => p.x),
      y: validPoints.map(p => p.y),
      yLabel: label,
      pointCount: validPoints.length
    };
  });

  return {
    xLabel,
    series,
    isMultiSeries: true,
    totalPoints: xValues.length,
    delimiter: delimiter === '\t' ? 'tab' : delimiter === ',' ? 'comma' : 'space'
  };
}

/**
 * Parse manual table data (array of row objects)
 * @param {Array} rows - Array of {x, y} objects from manual entry table
 * @returns {object} Parsed data with x, y arrays
 */
export function parseManualData(rows) {
  if (!rows || rows.length === 0) {
    throw new Error('No data entered');
  }

  const xValues = [];
  const yValues = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (row.x === '' && row.y === '') {
      continue;
    }

    const x = parseFloat(row.x);
    const y = parseFloat(row.y);

    if (isNaN(x) || isNaN(y)) {
      throw new Error(`Row ${i + 1}: Invalid numeric values (x=${row.x}, y=${row.y})`);
    }

    if (!isFinite(x) || !isFinite(y)) {
      throw new Error(`Row ${i + 1}: Values must be finite (no Infinity or NaN)`);
    }

    xValues.push(x);
    yValues.push(y);
  }

  if (xValues.length === 0) {
    throw new Error('No valid data points entered');
  }

  return {
    x: xValues,
    y: yValues,
    xLabel: 'X',
    yLabel: 'Y',
    pointCount: xValues.length
  };
}
