/**
 * Unit tests for dataParser.js
 * Run with: npm test
 */
import { describe, it, expect } from 'vitest';
import {
  parseFilenameParams,
  parseCSV,
  parseCSVMultiSeries,
  parseJSON,
  parseDataFile,
  detectVariableType,
  detectEPCalculatorFile
} from './dataParser.js';

// ============================================================================
// parseFilenameParams tests
// ============================================================================
describe('parseFilenameParams', () => {
  it('extracts modulation type and M from filename', () => {
    const result = parseFilenameParams('BER_vs_SNR_M=16_QAM_14-23-45.csv');
    expect(result.M).toBe(16);
    expect(result.typeModulation).toBe('QAM');
  });

  it('extracts SNR with dB unit', () => {
    const result = parseFilenameParams('Pe_vs_n_SNR=10dB_R=0.5_14-23-45.csv');
    expect(result.SNR).toBe(10);
    expect(result.SNRUnit).toBe('dB');
    expect(result.R).toBe(0.5);
  });

  it('extracts SNR with linear unit (no suffix)', () => {
    const result = parseFilenameParams('Pe_vs_n_SNR=5_14-23-45.csv');
    expect(result.SNR).toBe(5);
    expect(result.SNRUnit).toBe('linear');
  });

  it('extracts distribution type', () => {
    const result = parseFilenameParams('Rho_vs_beta_Uniform_14-23-45.csv');
    expect(result.distribution).toBe('uniform');
  });

  it('extracts Maxwell-Boltzmann distribution', () => {
    const result = parseFilenameParams('E_vs_SNR_MB_14-23-45.csv');
    expect(result.distribution).toBe('maxwell-boltzmann');
  });

  it('handles modulation-constellation pair format (16-QAM)', () => {
    const result = parseFilenameParams('BER_vs_SNR_16-QAM_14-23-45.csv');
    expect(result.M).toBe(16);
    expect(result.typeModulation).toBe('QAM');
  });

  it('handles PSK modulation', () => {
    const result = parseFilenameParams('BER_vs_SNR_PSK_M=8_14-23-45.csv');
    expect(result.typeModulation).toBe('PSK');
    expect(result.M).toBe(8);
  });

  it('handles PAM modulation', () => {
    const result = parseFilenameParams('BER_vs_SNR_PAM_M=4_14-23-45.csv');
    expect(result.typeModulation).toBe('PAM');
    expect(result.M).toBe(4);
  });

  it('handles beta/shaping parameter', () => {
    const result = parseFilenameParams('E_vs_SNR_beta=0.5_14-23-45.csv');
    expect(result.shaping_param).toBe(0.5);
  });

  it('handles .json extension', () => {
    const result = parseFilenameParams('BER_vs_SNR_M=16_QAM.json');
    expect(result.M).toBe(16);
    expect(result.typeModulation).toBe('QAM');
  });

  it('handles .txt extension', () => {
    const result = parseFilenameParams('BER_vs_SNR_M=16_QAM.txt');
    expect(result.M).toBe(16);
    expect(result.typeModulation).toBe('QAM');
  });

  it('returns empty object for simple filename', () => {
    const result = parseFilenameParams('data.csv');
    expect(Object.keys(result).length).toBe(0);
  });

  it('skips timestamp at end', () => {
    const result = parseFilenameParams('BER_vs_SNR_M=16_14-23-45.csv');
    expect(result.M).toBe(16);
    expect(result['14-23-45']).toBeUndefined();
  });
});

// ============================================================================
// parseCSV tests
// ============================================================================
describe('parseCSV', () => {
  it('parses simple CSV with headers', () => {
    const csv = `x,y
0,0.1
1,0.05
2,0.025`;
    const result = parseCSV(csv);
    expect(result.x).toEqual([0, 1, 2]);
    expect(result.y).toEqual([0.1, 0.05, 0.025]);
    expect(result.xLabel).toBe('x');
    expect(result.yLabel).toBe('y');
    expect(result.pointCount).toBe(3);
  });

  it('parses CSV without headers (numeric first line)', () => {
    const csv = `0,0.1
1,0.05
2,0.025`;
    const result = parseCSV(csv);
    expect(result.x).toEqual([0, 1, 2]);
    expect(result.y).toEqual([0.1, 0.05, 0.025]);
    expect(result.xLabel).toBe('X');
    expect(result.yLabel).toBe('Y');
  });

  it('handles custom axis labels', () => {
    const csv = `SNR (dB),Error Probability
0,0.5
5,0.1`;
    const result = parseCSV(csv);
    expect(result.xLabel).toBe('SNR (dB)');
    expect(result.yLabel).toBe('Error Probability');
  });

  it('skips comment lines', () => {
    const csv = `# This is a comment
x,y
# Another comment
0,0.1
1,0.05`;
    const result = parseCSV(csv);
    expect(result.pointCount).toBe(2);
  });

  it('skips empty lines', () => {
    const csv = `x,y

0,0.1

1,0.05`;
    const result = parseCSV(csv);
    expect(result.pointCount).toBe(2);
  });

  it('throws on empty CSV', () => {
    expect(() => parseCSV('')).toThrow('CSV file is empty');
  });

  it('throws on invalid numeric values', () => {
    const csv = `x,y
0,abc`;
    expect(() => parseCSV(csv)).toThrow('Invalid numeric values');
  });

  it('throws on insufficient columns', () => {
    const csv = `x,y
0`;
    expect(() => parseCSV(csv)).toThrow('Expected at least 2 columns');
  });

  it('handles scientific notation', () => {
    const csv = `x,y
1,1e-5
2,2.5e-10`;
    const result = parseCSV(csv);
    expect(result.y[0]).toBe(1e-5);
    expect(result.y[1]).toBe(2.5e-10);
  });

  it('handles negative values', () => {
    const csv = `x,y
-5,0.5
0,0.1
5,-0.1`;
    const result = parseCSV(csv);
    expect(result.x).toEqual([-5, 0, 5]);
    expect(result.y[2]).toBe(-0.1);
  });
});

// ============================================================================
// parseCSVMultiSeries tests
// ============================================================================
describe('parseCSVMultiSeries', () => {
  it('parses wide-format CSV with multiple columns', () => {
    const csv = `X,M=4,M=8,M=16
0,0.5,0.4,0.3
5,0.1,0.08,0.06`;
    const result = parseCSVMultiSeries(csv);
    expect(result.isMultiSeries).toBe(true);
    expect(result.xLabel).toBe('X');
    expect(result.series.length).toBe(3);
    expect(result.series[0].yLabel).toBe('M=4');
    expect(result.series[1].yLabel).toBe('M=8');
    expect(result.series[2].yLabel).toBe('M=16');
  });

  it('returns null for 2-column CSV (not multi-series)', () => {
    const csv = `x,y
0,0.1
1,0.05`;
    const result = parseCSVMultiSeries(csv);
    expect(result).toBeNull();
  });

  it('handles empty cells', () => {
    const csv = `X,A,B
0,0.5,
1,0.4,0.3
2,,0.2`;
    const result = parseCSVMultiSeries(csv);
    expect(result.series[0].pointCount).toBe(2); // Missing one point
    expect(result.series[1].pointCount).toBe(2); // Missing one point
  });
});

// ============================================================================
// parseJSON tests
// ============================================================================
describe('parseJSON', () => {
  it('parses simple JSON with x/y arrays', () => {
    const json = JSON.stringify({
      x: [0, 1, 2],
      y: [0.1, 0.05, 0.025]
    });
    const result = parseJSON(json);
    expect(result.x).toEqual([0, 1, 2]);
    expect(result.y).toEqual([0.1, 0.05, 0.025]);
    expect(result.pointCount).toBe(3);
  });

  it('parses JSON with metadata', () => {
    const json = JSON.stringify({
      x: [0, 1],
      y: [0.1, 0.05],
      xLabel: 'SNR (dB)',
      yLabel: 'Error Rate',
      title: 'My Plot'
    });
    const result = parseJSON(json);
    expect(result.xLabel).toBe('SNR (dB)');
    expect(result.yLabel).toBe('Error Rate');
    expect(result.title).toBe('My Plot');
  });

  it('parses nested data structure', () => {
    const json = JSON.stringify({
      data: { x: [0, 1], y: [0.1, 0.05] },
      metadata: { xLabel: 'X', yLabel: 'Y' }
    });
    const result = parseJSON(json);
    expect(result.x).toEqual([0, 1]);
    expect(result.xLabel).toBe('X');
  });

  it('throws on missing x array', () => {
    const json = JSON.stringify({ y: [0.1, 0.05] });
    expect(() => parseJSON(json)).toThrow('must contain "x" and "y" arrays');
  });

  it('throws on array length mismatch', () => {
    const json = JSON.stringify({ x: [0, 1, 2], y: [0.1, 0.05] });
    expect(() => parseJSON(json)).toThrow('Array length mismatch');
  });

  it('throws on non-array x/y', () => {
    const json = JSON.stringify({ x: 'not an array', y: [0.1] });
    expect(() => parseJSON(json)).toThrow('"x" and "y" must be arrays');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJSON('not valid json')).toThrow('Invalid JSON format');
  });
});

// ============================================================================
// parseStackedCSV tests
// ============================================================================
describe('parseStackedCSV (via parseDataFile)', () => {
  it('parses multi-series stacked CSV with # comments', () => {
    const csv = `X,Y

# M=4
1,0.5
2,0.4

# M=8
1,0.3
2,0.2`;
    const result = parseDataFile('multi.csv', csv);
    expect(result.isMultiSeries).toBe(true);
    expect(result.series.length).toBe(2);
    expect(result.series[0].yLabel).toBe('M=4');
    expect(result.series[0].uniqueParams.M).toBe(4);
    expect(result.series[1].yLabel).toBe('M=8');
    expect(result.series[1].uniqueParams.M).toBe(8);
  });

  it('parses MATLAB-style with % comments', () => {
    const csv = `% X,Y

% M=16
100,0.45
200,0.38

% M=32
100,0.42`;
    const result = parseDataFile('matlab.csv', csv);
    expect(result.isMultiSeries).toBe(true);
    expect(result.series.length).toBe(2);
    expect(result.series[0].uniqueParams.M).toBe(16);
    expect(result.series[1].uniqueParams.M).toBe(32);
  });

  it('handles data without any header (edge case fix)', () => {
    const csv = `1,0.5
2,0.4
3,0.3`;
    const result = parseDataFile('noheader.csv', csv);
    expect(result.x).toEqual([1, 2, 3]);
    expect(result.y).toEqual([0.5, 0.4, 0.3]);
  });
});

// ============================================================================
// detectVariableType tests
// ============================================================================
describe('detectVariableType', () => {
  it('detects SNR with dB unit', () => {
    const result = detectVariableType('SNR (dB)');
    expect(result.varType).toBe('SNR');
    expect(result.detectedUnit).toBe('dB');
  });

  it('detects SNR with linear unit', () => {
    const result = detectVariableType('SNR');
    expect(result.varType).toBe('SNR');
    expect(result.detectedUnit).toBe('linear');
  });

  it('detects code length', () => {
    expect(detectVariableType('Code Length (n)').varType).toBe('n');
    expect(detectVariableType('n').varType).toBe('n');
    expect(detectVariableType('Block Length').varType).toBe('n');
  });

  it('detects rate', () => {
    expect(detectVariableType('Rate').varType).toBe('R');
    expect(detectVariableType('R').varType).toBe('R');
    expect(detectVariableType('Coding Rate').varType).toBe('R');
  });

  it('detects error probability', () => {
    expect(detectVariableType('Error Probability').varType).toBe('error_probability');
    expect(detectVariableType('Pe').varType).toBe('error_probability');
  });

  it('detects error exponent', () => {
    expect(detectVariableType('Error Exponent').varType).toBe('error_exponent');
  });

  it('detects rho', () => {
    expect(detectVariableType('Optimal Rho').varType).toBe('rho');
    expect(detectVariableType('ρ').varType).toBe('rho');
  });

  it('detects shaping parameter', () => {
    expect(detectVariableType('Beta').varType).toBe('shaping_param');
    expect(detectVariableType('β').varType).toBe('shaping_param');
    expect(detectVariableType('Shaping Parameter').varType).toBe('shaping_param');
  });

  it('returns null for unknown labels', () => {
    expect(detectVariableType('Some Random Label').varType).toBeNull();
  });
});

// ============================================================================
// detectEPCalculatorFile tests
// ============================================================================
describe('detectEPCalculatorFile', () => {
  it('detects EPCalculator CSV by marker', () => {
    const csv = '# EPCalculator v2.0\nX,Y\n0,0.1';
    expect(detectEPCalculatorFile(csv, 'csv')).toBe(true);
  });

  it('returns false for non-EPCalculator CSV', () => {
    const csv = 'X,Y\n0,0.1';
    expect(detectEPCalculatorFile(csv, 'csv')).toBe(false);
  });

  it('detects EPCalculator JSON by generator field', () => {
    const json = { generator: 'EPCalculator v2', x: [], y: [] };
    expect(detectEPCalculatorFile(json, 'json')).toBe(true);
  });

  it('returns false for non-EPCalculator JSON', () => {
    const json = { x: [], y: [] };
    expect(detectEPCalculatorFile(json, 'json')).toBe(false);
  });
});

// ============================================================================
// parseDataFile integration tests
// ============================================================================
describe('parseDataFile', () => {
  it('parses CSV file and extracts filename params', () => {
    const csv = `SNR (dB),Error Probability
0,0.5
5,0.1`;
    const result = parseDataFile('BER_vs_SNR_M=16_QAM_14-23-45.csv', csv);
    expect(result.filenameParams).toBeDefined();
    expect(result.filenameParams.M).toBe(16);
    expect(result.filenameParams.typeModulation).toBe('QAM');
  });

  it('sets title from filename when not in data', () => {
    const csv = `x,y
0,0.1`;
    const result = parseDataFile('my_data.csv', csv);
    expect(result.title).toBe('my_data');
  });

  it('throws on oversized file', () => {
    const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
    expect(() => parseDataFile('huge.csv', largeContent)).toThrow('File too large');
  });

  it('auto-detects JSON format', () => {
    const json = JSON.stringify({ x: [0, 1], y: [0.1, 0.05] });
    const result = parseDataFile('data.xyz', json); // Unknown extension
    expect(result.x).toEqual([0, 1]);
  });

  it('auto-detects CSV format', () => {
    const csv = `x,y
0,0.1`;
    const result = parseDataFile('data.xyz', csv); // Unknown extension
    expect(result.x).toEqual([0]);
  });
});
