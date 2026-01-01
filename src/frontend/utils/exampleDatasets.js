// Built-in example datasets for quick testing and demonstration

export const exampleDatasets = {
  snr_error_db: {
    name: 'SNR vs Error Probability (dB)',
    description: 'Typical error probability curve with SNR in dB',
    data: {
      x: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
      y: [0.5, 0.316, 0.158, 0.079, 0.0316, 0.01, 0.00316, 0.001, 0.000316, 0.0001, 0.0000316],
      xLabel: 'SNR (dB)',
      yLabel: 'Error Probability',
      title: 'Example: SNR vs Error Probability'
    }
  },

  code_length_exponent: {
    name: 'Code Length vs Error Exponent',
    description: 'Error exponent increasing with code length',
    data: {
      x: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      y: [0.01, 0.05, 0.12, 0.22, 0.35, 0.50, 0.67, 0.85, 1.04, 1.25],
      xLabel: 'Code Length (n)',
      yLabel: 'Error Exponent',
      title: 'Example: Error Exponent Growth'
    }
  },

  rate_capacity: {
    name: 'Rate vs Capacity',
    description: 'Channel capacity as function of rate',
    data: {
      x: [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4],
      y: [5.0, 4.5, 3.8, 3.0, 2.1, 1.2, 0.5, 0.1],
      xLabel: 'Rate (R)',
      yLabel: 'Required SNR (dB)',
      title: 'Example: Rate vs Required SNR'
    }
  },

  exponential_decay: {
    name: 'Simple Exponential Decay',
    description: 'Classic exponential decay curve',
    data: {
      x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      y: [1.0, 0.8187, 0.6703, 0.5488, 0.4493, 0.3679, 0.3012, 0.2466, 0.2019, 0.1653, 0.1353, 0.1108, 0.0907, 0.0743, 0.0608, 0.0498, 0.0408, 0.0334, 0.0273, 0.0224, 0.0183],
      xLabel: 'Time (s)',
      yLabel: 'Amplitude',
      title: 'Example: Exponential Decay'
    }
  },

  modulation_comparison: {
    name: 'Modulation Size vs Error Rate',
    description: 'Error rate increasing with modulation size',
    data: {
      x: [2, 4, 8, 16, 32, 64, 128, 256],
      y: [0.001, 0.005, 0.015, 0.035, 0.070, 0.120, 0.180, 0.250],
      xLabel: 'Modulation Size (M)',
      yLabel: 'Error Probability',
      title: 'Example: Modulation Size vs Error'
    }
  },

  snr_linear: {
    name: 'SNR vs Error Probability (Linear)',
    description: 'Error probability with SNR in linear scale',
    data: {
      x: [1, 1.58, 2.51, 3.98, 6.31, 10, 15.85, 25.12, 39.81, 63.10, 100],
      y: [0.5, 0.316, 0.158, 0.079, 0.0316, 0.01, 0.00316, 0.001, 0.000316, 0.0001, 0.0000316],
      xLabel: 'SNR (linear)',
      yLabel: 'Error Probability',
      title: 'Example: SNR (linear) vs Error'
    }
  }
};

/**
 * Get list of example dataset names for dropdown
 * @returns {Array} Array of {id, name, description}
 */
export function getExampleList() {
  return Object.keys(exampleDatasets).map(id => ({
    id,
    name: exampleDatasets[id].name,
    description: exampleDatasets[id].description
  }));
}

/**
 * Get example dataset by ID
 * @param {string} id - Example dataset ID
 * @returns {object} Dataset with x, y, labels
 */
export function getExampleData(id) {
  const example = exampleDatasets[id];
  if (!example) {
    throw new Error(`Example dataset '${id}' not found`);
  }
  return { ...example.data };
}

/**
 * Format example data as CSV string for download/copy
 * @param {string} id - Example dataset ID
 * @returns {string} CSV formatted string
 */
export function formatExampleAsCSV(id) {
  const data = getExampleData(id);
  let csv = `${data.xLabel},${data.yLabel}\n`;

  for (let i = 0; i < data.x.length; i++) {
    csv += `${data.x[i]},${data.y[i]}\n`;
  }

  return csv;
}

/**
 * Format example data as TSV string for paste (Excel-compatible)
 * @param {string} id - Example dataset ID
 * @returns {string} TSV formatted string
 */
export function formatExampleAsTSV(id) {
  const data = getExampleData(id);
  let tsv = `${data.xLabel}\t${data.yLabel}\n`;

  for (let i = 0; i < data.x.length; i++) {
    tsv += `${data.x[i]}\t${data.y[i]}\n`;
  }

  return tsv;
}
