import { writable } from 'svelte/store';

// Documentation panel state
export const documentationPanel = writable({
  active: false,
  docKey: null,
  targetRect: null,  // Bounding rect of the hovered element
  preferredPosition: 'right'  // right, left, bottom, top
});

// Show documentation for a specific key
export function showDocumentation(docKey, targetElement, preferredPosition = 'right') {
  console.log('[documentation] showDocumentation called with key:', docKey);
  console.log('[documentation] Content exists:', !!documentationContent[docKey]);

  const rect = targetElement.getBoundingClientRect();
  const newState = {
    active: true,
    docKey,
    targetRect: {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    },
    preferredPosition
  };
  console.log('[documentation] Setting state:', newState);
  documentationPanel.set(newState);
}

// Hide documentation panel
export function hideDocumentation() {
  documentationPanel.set({
    active: false,
    docKey: null,
    targetRect: null,
    preferredPosition: 'right'
  });
}

// Documentation content database
// Keys should match the data-doc attribute on buttons
export const documentationContent = {
  // Axis scale buttons
  'scale-linear-x': {
    title: 'Linear X Scale',
    category: 'Plot Controls',
    description: 'Displays the X-axis using a linear scale where equal distances represent equal value differences.',
    theory: 'Linear scales are intuitive for comparing absolute differences. Use when the data range is relatively small or when you want to see the true shape of the curve.',
    behavior: 'Click to switch to logarithmic X scale.',
    learnMoreUrl: '#/learn/concepts/plot-controls',
    learnMoreSection: 'linear-x'
  },
  'scale-log-x': {
    title: 'Logarithmic X Scale',
    category: 'Plot Controls',
    description: 'Displays the X-axis using a logarithmic (log₁₀) scale where equal distances represent equal ratios.',
    theory: 'Logarithmic scales compress large ranges and reveal patterns in data spanning multiple orders of magnitude. Essential for viewing exponential decay or growth.',
    behavior: 'Click to switch to linear X scale.',
    learnMoreUrl: '#/learn/concepts/plot-controls',
    learnMoreSection: 'log-x'
  },
  'scale-linear-y': {
    title: 'Linear Y Scale',
    category: 'Plot Controls',
    description: 'Displays the Y-axis using a linear scale.',
    theory: 'Best for data with a narrow range. Shows the true proportional differences between values.',
    behavior: 'Click to switch to logarithmic Y scale.',
    learnMoreUrl: '#/learn/concepts/plot-controls',
    learnMoreSection: 'linear-y'
  },
  'scale-log-y': {
    title: 'Logarithmic Y Scale',
    category: 'Plot Controls',
    description: 'Displays the Y-axis using a logarithmic (log₁₀) scale.',
    theory: 'Error probabilities often span many orders of magnitude (e.g., 10⁻¹ to 10⁻¹⁰). Log scale makes these differences visible and reveals the linear relationship between SNR and error exponent.',
    behavior: 'Click to switch to linear Y scale.',
    learnMoreUrl: '#/learn/concepts/plot-controls',
    learnMoreSection: 'log-y'
  },
  'snr-db': {
    title: 'SNR in dB',
    category: 'Units',
    description: 'Signal-to-Noise Ratio expressed in decibels: SNR(dB) = 10·log₁₀(SNR)',
    theory: 'Decibels are a logarithmic unit that compress large ratios into manageable numbers. A 3 dB increase doubles the SNR. Common in communications engineering because gains/losses add linearly in dB.',
    behavior: 'Click to switch to linear SNR units.',
    learnMoreUrl: '#/learn/concepts/awgn-channel',
    learnMoreSection: 'snr'
  },
  'snr-linear': {
    title: 'SNR (Linear)',
    category: 'Units',
    description: 'Signal-to-Noise Ratio as a direct power ratio: SNR = P_signal / P_noise',
    theory: 'Linear SNR shows the actual power ratio. SNR=10 means signal power is 10× noise power. Useful for theoretical analysis but spans large ranges in practice.',
    behavior: 'Click to switch to dB units.',
    learnMoreUrl: '#/learn/concepts/plot-controls',
    learnMoreSection: 'snr-units'
  },
  // Transpose button
  'transpose': {
    title: 'Transpose Axes',
    category: 'Plot Controls',
    description: 'Swaps the X and Y axes of the plot.',
    theory: 'Different perspectives reveal different insights. Swapping axes can make trends more apparent or match conventions from literature.',
    behavior: 'Click to swap X↔Y (for line plots) or X1↔X2 (for contour plots).',
    learnMoreUrl: '#/learn/concepts/plot-controls',
    learnMoreSection: 'transpose'
  },
  // Export button
  'export': {
    title: 'Export Plot',
    category: 'Data Export',
    description: 'Save the current plot in various formats.',
    formats: [
      { name: 'PNG', desc: 'Raster image, good for presentations' },
      { name: 'SVG', desc: 'Vector image, scalable for publications' },
      { name: 'CSV', desc: 'Raw data for analysis in other tools' },
      { name: 'JSON', desc: 'Full data with metadata, re-importable' }
    ],
    behavior: 'Click to open the export menu with format options.',
    learnMoreUrl: '#/learn/tutorials/exporting'
  },
  // Remove button
  'remove': {
    title: 'Remove Plot',
    category: 'Plot Management',
    description: 'Removes this plot from the workspace.',
    behavior: 'Click to delete. The plot can be regenerated by running the same parameters again.'
  },
  // Compute button
  'compute': {
    title: 'Compute Error Probability',
    category: 'Computation',
    description: 'Calculates the error probability bound for the current parameters.',
    theory: 'Uses Gallager\'s random coding bound with Hermite-Gauss quadrature for numerical integration. Optimizes over the parameter ρ ∈ [0,1] to find the tightest bound.',
    behavior: 'Click to start computation. Results appear in the panel on the right.',
    learnMoreUrl: '#/learn/concepts/error-exponent',
    learnMoreSection: 'computable-form'
  },
  // Generate plot button
  'generate-plot': {
    title: 'Generate Plot',
    category: 'Plotting',
    description: 'Creates a new plot with the current settings.',
    theory: 'Computes error probability at multiple points across the specified range, then renders an interactive visualization.',
    behavior: 'Click to generate. If a compatible plot exists, you\'ll be asked to merge or create new.',
    learnMoreUrl: '#/learn/tutorials/line-plots',
    learnMoreSection: 'setup'
  },
  // Modulation type
  'modulation-pam': {
    title: 'PAM (Pulse Amplitude Modulation)',
    category: 'Modulation',
    description: 'One-dimensional modulation with M amplitude levels.',
    theory: 'PAM uses M equally-spaced amplitude levels on a single axis. M-PAM has log₂(M) bits per symbol. Simple but less power-efficient than 2D modulations.',
    example: '2-PAM = BPSK, 4-PAM has levels {-3, -1, +1, +3}',
    learnMoreUrl: '#/learn/concepts/modulation',
    learnMoreSection: 'pam'
  },
  'modulation-psk': {
    title: 'PSK (Phase Shift Keying)',
    category: 'Modulation',
    description: 'Two-dimensional modulation with M phases on a circle.',
    theory: 'All constellation points have equal energy (lie on a circle). Good for non-linear channels. Phase differences of 2π/M between adjacent symbols.',
    example: '2-PSK = BPSK, 4-PSK = QPSK, 8-PSK',
    learnMoreUrl: '#/learn/concepts/modulation',
    learnMoreSection: 'psk'
  },
  'modulation-qam': {
    title: 'QAM (Quadrature Amplitude Modulation)',
    category: 'Modulation',
    description: 'Two-dimensional modulation combining amplitude and phase.',
    theory: 'Points arranged in a square grid. Most spectrally efficient for AWGN channels. Higher M increases throughput but requires higher SNR.',
    example: '4-QAM = QPSK, 16-QAM (4×4 grid), 64-QAM (8×8 grid)',
    learnMoreUrl: '#/learn/concepts/modulation',
    learnMoreSection: 'qam'
  },
  // Distribution buttons
  'distribution-uniform': {
    title: 'Uniform Distribution',
    category: 'Probabilistic Shaping',
    description: 'All constellation points are transmitted with equal probability.',
    theory: 'Standard approach in most systems. Simple but not capacity-achieving. Each symbol carries exactly log₂(M) bits of information.',
    behavior: 'Click to use uniform (equal) symbol probabilities.',
    learnMoreUrl: '#/learn/concepts/probabilistic-shaping',
    learnMoreSection: 'uniform'
  },
  'distribution-maxwell': {
    title: 'Maxwell-Boltzmann Distribution',
    category: 'Probabilistic Shaping',
    description: 'Symbol probabilities follow P(x) ∝ exp(-β|x|²), favoring lower-energy symbols.',
    theory: 'Probabilistic shaping can approach channel capacity by making the transmitted distribution more Gaussian-like. The parameter β controls the "temperature" - higher β means stronger shaping.',
    behavior: 'Click to enable Maxwell-Boltzmann shaping. Adjust β parameter to control shaping strength.',
    learnMoreUrl: '#/learn/concepts/probabilistic-shaping',
    learnMoreSection: 'maxwell-boltzmann'
  },
  // Y-axis variable buttons
  'yvar-error-prob': {
    title: 'Error Probability (Pe)',
    category: 'Output Variables',
    description: 'The probability that a codeword is decoded incorrectly.',
    theory: 'Bounded by Pe ≤ exp(-n·E(R)) where E(R) is the error exponent and n is the code length. This is the ultimate metric for system reliability.',
    formula: 'P_e \\leq \\exp(-n \\cdot E(R))',
    learnMoreUrl: '#/learn/concepts/error-exponent',
    learnMoreSection: 'error-probability'
  },
  'yvar-error-exp': {
    title: 'Error Exponent E(R)',
    category: 'Output Variables',
    description: 'The rate of exponential decay of error probability with code length.',
    theory: 'A fundamental quantity in information theory. Higher E(R) means error probability decreases faster with code length. E(R) > 0 for rates R < C (channel capacity).',
    formula: 'E(R) = \\max_{\\rho \\in [0,1]} \\left[ E_0(\\rho) - \\rho R \\right]',
    learnMoreUrl: '#/learn/concepts/error-exponent',
    learnMoreSection: 'computable-form'
  },
  'yvar-rho': {
    title: 'Optimal ρ',
    category: 'Output Variables',
    description: 'The optimization parameter that maximizes the error exponent bound.',
    theory: 'Gallager\'s bound involves optimizing over ρ ∈ [0,1]. The optimal ρ depends on the rate R and channel conditions. At capacity, optimal ρ → 0.',
    formula: '\\rho^* = \\arg\\max_{\\rho \\in [0,1]} \\left[ E_0(\\rho) - \\rho R \\right]',
    learnMoreUrl: '#/learn/concepts/error-exponent',
    learnMoreSection: 'rho'
  },
  // Plot type buttons
  'plot-line': {
    title: 'Line Plot',
    category: 'Plot Types',
    description: '2D plot showing Y variable vs one X variable.',
    theory: 'Best for showing trends and comparing curves. Multiple series can be overlaid for comparison.',
    behavior: 'Creates a standard X-Y plot with the selected variables.',
    learnMoreUrl: '#/learn/tutorials/line-plots'
  },
  'plot-contour': {
    title: 'Contour Plot',
    category: 'Plot Types',
    description: '3D visualization showing Z variable vs two X variables.',
    theory: 'Contour lines connect points of equal value. Color indicates magnitude. Essential for understanding how error probability depends on two parameters simultaneously.',
    behavior: 'Creates a 2D heatmap (or 3D surface) with two independent variables.',
    learnMoreUrl: '#/learn/tutorials/contour-plots'
  },
  'plot-table': {
    title: 'Data Table',
    category: 'Plot Types',
    description: 'Raw numerical data in tabular format.',
    theory: 'Useful when exact values are needed or for export to other analysis tools.',
    behavior: 'Displays computed values in a scrollable table format.',
    learnMoreUrl: '#/learn/tutorials/table-mode'
  },
  // Custom Constellation buttons
  'constellation-lucky': {
    title: "I'm Feeling Lucky",
    category: 'Random Generation',
    description: 'Generates interesting random constellation patterns inspired by real modulation schemes.',
    theory: 'Creates diverse patterns probabilistically: Ring (PSK-like, ~35%), Grid (QAM-like, ~20% if square count), Multi-Ring (APSK-like, ~15%), Clustered (~15%), and Scattered (~15%). All constellations are automatically normalized to unit energy and probability sum = 1.',
    patterns: [
      { name: 'Ring/PSK', desc: 'Points evenly distributed on a circle with random rotation' },
      { name: 'Grid/QAM', desc: 'Rectangular arrangement with optional rotation (requires square point count)' },
      { name: 'Multi-Ring/APSK', desc: 'Concentric rings with different radii, like 16-APSK' },
      { name: 'Clustered', desc: 'Points grouped into 2-4 clusters around a ring' },
      { name: 'Scattered', desc: 'Uniformly random positions using polar coordinates for better coverage' }
    ],
    behavior: 'Click to generate a new random constellation. Each click produces a different pattern type with random parameters (rotation, spacing, perturbation). The result is always valid and ready for simulation.',
    learnMoreUrl: '#/learn/tutorials/custom-constellation',
    learnMoreSection: 'random'
  },
  'constellation-hide-table': {
    title: 'Toggle Table View',
    category: 'Display',
    description: 'Shows or hides the numerical table for precise point editing.',
    theory: 'The table allows exact coordinate and probability entry. The plot provides visual feedback and drag-to-edit capability.',
    behavior: 'Click to show/hide the points table. The constellation plot remains visible.',
    learnMoreUrl: '#/learn/tutorials/custom-constellation',
    learnMoreSection: 'table-controls'
  },

  // Clear all button
  'clear-all': {
    title: 'Clear All Plots',
    category: 'Plot Management',
    description: 'Removes all plots from the workspace.',
    behavior: 'Click to delete all generated plots. This action cannot be undone.'
  },
  // Download all button
  'download-all': {
    title: 'Download All Plots',
    category: 'Data Export',
    description: 'Exports all plots as PNG images.',
    behavior: 'Click to download each plot as a separate PNG file.',
    learnMoreUrl: '#/learn/tutorials/exporting'
  },
  // Reset defaults
  'reset-defaults': {
    title: 'Reset to Defaults',
    category: 'Parameters',
    description: 'Restores all parameters to their default values.',
    behavior: 'Click to reset M, SNR, R, n, and all other parameters to defaults.'
  },
  // Theme toggle
  'theme-toggle': {
    title: 'Toggle Dark/Light Mode',
    category: 'Display',
    description: 'Switches between dark and light color themes.',
    behavior: 'Click to toggle. Your preference is saved for future visits.'
  },
  // Language selector
  'language-select': {
    title: 'Language Selection',
    category: 'Localization',
    description: 'Changes the interface language.',
    behavior: 'Select from available languages. Translations cover all UI elements.'
  },

  // ===== X-AXIS VARIABLES =====
  'xvar-M': {
    title: 'Modulation Order (M)',
    category: 'X-Axis Variables',
    description: 'Number of symbols in the constellation.',
    theory: 'M determines spectral efficiency: log₂(M) bits per symbol. Higher M = more bits/symbol but requires higher SNR. Common values: 2, 4, 8, 16, 64, 256.',
    formula: '\\eta = \\log_2(M) \\text{ bits/symbol}',
    learnMoreUrl: '#/learn/concepts/modulation'
  },
  'xvar-SNR': {
    title: 'Signal-to-Noise Ratio',
    category: 'X-Axis Variables',
    description: 'Ratio of signal power to noise power.',
    theory: 'SNR = Es/N₀ where Es is symbol energy and N₀ is noise spectral density. Higher SNR → lower error probability. Often expressed in dB: SNR_dB = 10·log₁₀(SNR).',
    formula: '\\text{SNR} = \\frac{E_s}{N_0} = \\frac{E_b}{N_0} \\cdot \\log_2(M)',
    learnMoreUrl: '#/learn/concepts/awgn-channel',
    learnMoreSection: 'snr'
  },
  'xvar-R': {
    title: 'Code Rate (R)',
    category: 'X-Axis Variables',
    description: 'Ratio of information bits to total coded bits.',
    theory: 'R = k/n where k = info bits, n = codeword length. Lower R = more redundancy = better error correction but lower throughput. R must be below channel capacity for reliable communication.',
    formula: 'R = \\frac{k}{n}, \\quad 0 < R \\leq 1',
    learnMoreUrl: '#/learn/concepts/error-exponent',
    learnMoreSection: 'code-rate'
  },
  'xvar-n': {
    title: 'Code Length (n)',
    category: 'X-Axis Variables',
    description: 'Number of symbols in a codeword.',
    theory: 'Longer codes achieve lower error probability: Pe ≤ exp(-n·E(R)). However, longer codes mean more latency and complexity. The error exponent E(R) determines how fast Pe decreases with n.',
    formula: 'P_e \\leq \\exp(-n \\cdot E(R))',
    learnMoreUrl: '#/learn/concepts/error-exponent',
    learnMoreSection: 'code-length'
  },
  'xvar-N': {
    title: 'Quadrature Points (N)',
    category: 'X-Axis Variables',
    description: 'Number of points for Gauss-Hermite numerical integration.',
    theory: 'Higher N = more accurate integration but slower computation. The integral ∫f(x)e^(-x²)dx is approximated by Σwᵢf(xᵢ). N=50-100 is typically sufficient.',
    formula: '\\int f(x) e^{-x^2} dx \\approx \\sum_{i} w_i \\cdot f(x_i)',
    learnMoreUrl: '#/learn/concepts/plot-controls',
    learnMoreSection: 'quadrature'
  },
  'xvar-beta': {
    title: 'Shaping Parameter (β)',
    category: 'X-Axis Variables',
    description: 'Controls the strength of Maxwell-Boltzmann probabilistic shaping.',
    theory: 'P(x) ∝ exp(-β|x|²). β=0 gives uniform distribution. Higher β favors low-energy symbols, approaching Gaussian distribution and channel capacity.',
    formula: 'P(x_i) = \\frac{\\exp(-\\beta |x_i|^2)}{\\sum_j \\exp(-\\beta |x_j|^2)}',
    learnMoreUrl: '#/learn/concepts/probabilistic-shaping',
    learnMoreSection: 'maxwell-boltzmann'
  },

  // ===== Y-AXIS VARIABLES =====
  'yvar-mutual-info': {
    title: 'Mutual Information I(X;Y)',
    category: 'Output Variables',
    description: 'Maximum achievable rate for reliable communication.',
    theory: 'I(X;Y) = H(Y) - H(Y|X) measures how much information Y reveals about X. Channel capacity C = max_P(x) I(X;Y). Reliable communication possible iff R < I(X;Y).',
    formula: 'I(X;Y) = H(Y) - H(Y|X)',
    learnMoreUrl: '#/learn/concepts/mutual-information',
    learnMoreSection: 'mutual-info'
  },
  'yvar-cutoff-rate': {
    title: 'Cutoff Rate R₀',
    category: 'Output Variables',
    description: 'Rate above which sequential decoding becomes impractical.',
    theory: 'R₀ = E₀(1) is the error exponent at ρ=1. Historically important as the computational cutoff for sequential decoding. Always R₀ ≤ C (capacity).',
    formula: 'R_0 = -\\log_2 \\left[ \\sum_i \\sqrt{P(y_i|x_1) P(y_i|x_2)} \\right]',
    learnMoreUrl: '#/learn/concepts/mutual-information',
    learnMoreSection: 'cutoff-rate'
  },

  // ===== SIMULATION PARAMETERS (for ParameterReference) =====
  'param-M': {
    title: 'Modulation Order (M)',
    category: 'Simulation Parameters',
    description: 'Current constellation size.',
    theory: 'M-ary modulation uses M distinct symbols. Spectral efficiency = log₂(M) bits/symbol. Trade-off: higher M gives more bits but needs better SNR.',
    formula: '\\text{Bits per symbol} = \\log_2(M)',
    learnMoreUrl: '#/learn/concepts/modulation'
  },
  'param-type-PAM': {
    title: 'PAM (Pulse Amplitude Modulation)',
    category: 'Modulation Type',
    description: 'One-dimensional modulation using amplitude levels.',
    theory: 'M-PAM uses a one-dimensional constellation where symbols differ only in amplitude. M equally-spaced points are placed on a line.',
    formula: 'x_k = (2k - 1 - M) \\cdot d, \\quad k = 1, 2, \\ldots, M',
    example: '2-PAM (BPSK): two points at -1, +1. 4-PAM: four amplitude levels.',
    learnMoreUrl: '#/learn/concepts/modulation',
    learnMoreSection: 'pam'
  },
  'param-type-PSK': {
    title: 'PSK (Phase Shift Keying)',
    category: 'Modulation Type',
    description: 'Two-dimensional modulation with constant amplitude.',
    theory: 'M-PSK places symbols on a circle (constant amplitude), differing only in phase angle. Points are equally spaced around the unit circle.',
    formula: 'x_k = e^{j \\cdot 2\\pi k / M}, \\quad k = 0, 1, \\ldots, M-1',
    example: 'BPSK (2-PSK): 0° and 180°. QPSK (4-PSK): 45°, 135°, 225°, 315°.',
    learnMoreUrl: '#/learn/concepts/modulation',
    learnMoreSection: 'psk'
  },
  'param-type-QAM': {
    title: 'QAM (Quadrature Amplitude Modulation)',
    category: 'Modulation Type',
    description: 'Two-dimensional grid modulation.',
    theory: 'QAM combines amplitude and phase modulation, placing points on a 2D grid. This allows more bits per symbol but requires higher SNR.',
    formula: 'x_k = a_k + j \\cdot b_k, \\quad a_k, b_k \\in \\{\\pm 1, \\pm 3, \\ldots\\}',
    example: '4-QAM ≡ QPSK. 16-QAM: 4×4 grid (4 bits/symbol). 64-QAM: 8×8 grid.',
    learnMoreUrl: '#/learn/concepts/modulation',
    learnMoreSection: 'qam'
  },
  'param-SNR': {
    title: 'Signal-to-Noise Ratio',
    category: 'Simulation Parameters',
    description: 'Current SNR value for computation.',
    theory: 'The SNR γ measures how much stronger the signal is compared to noise. Higher SNR exponentially reduces error probability.',
    formula: '\\gamma = \\frac{E_s}{N_0}',
    example: 'dB conversion: $\\text{SNR}_{\\text{dB}} = 10 \\log_{10}(\\gamma)$',
    learnMoreUrl: '#/learn/concepts/awgn-channel',
    learnMoreSection: 'snr'
  },
  'param-R': {
    title: 'Code Rate',
    category: 'Simulation Parameters',
    description: 'Current code rate for error exponent computation.',
    theory: 'The code rate R = k/n is the ratio of information bits (k) to total coded bits (n). Reliable communication requires R < C (capacity).',
    formula: 'R = \\frac{k}{n}, \\quad 0 < R \\leq C',
    learnMoreUrl: '#/learn/concepts/error-exponent',
    learnMoreSection: 'code-rate'
  },
  'param-n': {
    title: 'Code Length',
    category: 'Simulation Parameters',
    description: 'Codeword length for error probability computation.',
    theory: 'Longer codes achieve better error performance. Doubling n roughly squares the reliability (in log scale, the exponent doubles). However, longer codes increase latency and decoding complexity.',
    formula: 'P_e \\leq 2^{-n \\cdot E(R)}',
    learnMoreUrl: '#/learn/concepts/error-exponent',
    learnMoreSection: 'code-length'
  },
  'param-N': {
    title: 'Quadrature Points (N)',
    category: 'Simulation Parameters',
    description: 'Number of points for Gauss-Hermite numerical integration.',
    theory: 'The nodes are roots of the physicist\'s Hermite polynomial H_n(z). With n nodes, Gauss-Hermite exactly integrates polynomials of degree up to 2n-1.',
    formula: 'w_z = \\frac{2^{n-1} \\cdot n! \\cdot \\sqrt{\\pi}}{n^2 \\cdot [H_{n-1}(z)]^2}',
    behavior: 'Recommended: N=20 for exploration, N=50 for default, N=100+ for high precision.',
    learnMoreUrl: '#/learn/concepts/numerical-methods',
    learnMoreSection: 'hermite'
  },
  'param-threshold': {
    title: 'Weight Threshold (τ)',
    category: 'Simulation Parameters',
    description: 'Threshold for skipping negligible quadrature nodes.',
    theory: 'The 2D quadrature grid has n² nodes, but corner points have tiny weights. Thresholding keeps only significant nodes, reducing computation by ~21% with negligible accuracy loss.',
    formula: '\\mathcal{F} = \\{z \\in \\mathcal{D} \\mid W(z) \\leq \\theta\\}',
    example: 'Default threshold: $\\theta = \\max(\\mathcal{W}) - \\min(\\mathcal{W})$',
    learnMoreUrl: '#/learn/concepts/numerical-methods',
    learnMoreSection: 'thresholding'
  },
  // Plotting controls
  'plot-type': {
    title: 'Plot Type',
    category: 'Plotting Controls',
    description: 'Choose how to visualize your computation results.',
    patterns: [
      { name: 'Line Plot', desc: 'Shows how a metric varies along one parameter axis' },
      { name: 'Contour Plot', desc: 'Heat map showing metric values across two parameters' },
      { name: '3D Surface', desc: 'Interactive 3D visualization of two-parameter sweeps' },
      { name: 'Raw Data', desc: 'Export numerical data as a table' }
    ],
    learnMoreUrl: '#/learn/tutorials/line-plots',
    learnMoreSection: 'what-line-plots-show'
  },
  'plot-yVar': {
    title: 'Y-Axis Variable',
    category: 'Plotting Controls',
    description: 'Select the output metric to compute and display.',
    patterns: [
      { name: 'Error Exponent E(R)', desc: 'Rate of exponential decay of error probability' },
      { name: 'Error Probability Pe', desc: 'Upper bound on decoding error probability' },
      { name: 'Optimal ρ', desc: 'The ρ value that maximizes E₀(ρ) - ρR' },
      { name: 'Mutual Information I', desc: 'Channel capacity metric in bits/channel use' },
      { name: 'Cutoff Rate R₀', desc: 'Rate threshold for reliable communication' },
      { name: 'Critical Rate Rcrit', desc: 'Rate where exponent changes character' }
    ],
    learnMoreUrl: '#/learn/concepts/error-exponent',
    learnMoreSection: 'special-values'
  },
  // X-Axis Variable entries (one per variable type)
  // Formulas match those in the referenced Learn More article sections
  'plot-xVar-M': {
    title: 'Sweep: Modulation Size (M)',
    category: 'X-Axis Variable',
    description: 'Vary the number of constellation points from 2 to 512.',
    theory: 'Sweeping M reveals how constellation size affects performance. For M-PAM, symbols are placed at equally-spaced amplitude levels. Larger M increases spectral efficiency but requires higher SNR.',
    formula: 'x_k = (2k - 1 - M) \\cdot d, \\quad k = 1, 2, \\ldots, M',
    example: 'Compare 4-PAM vs 16-PAM vs 64-PAM performance curves',
    learnMoreUrl: '#/learn/concepts/modulation',
    learnMoreSection: 'pam'
  },
  'plot-xVar-SNR': {
    title: 'Sweep: Signal-to-Noise Ratio',
    category: 'X-Axis Variable',
    description: 'Vary SNR to see how channel quality affects performance.',
    theory: 'The SNR γ measures signal strength relative to noise. Error exponent increases with SNR, showing diminishing returns at high values. The slope reveals how efficiently the modulation uses power.',
    formula: '\\gamma = \\frac{E_s}{N_0}',
    example: 'Sweep 0-20 dB to see the full performance curve',
    learnMoreUrl: '#/learn/concepts/awgn-channel',
    learnMoreSection: 'snr'
  },
  'plot-xVar-R': {
    title: 'Sweep: Code Rate (R)',
    category: 'X-Axis Variable',
    description: 'Vary the code rate to explore the rate-reliability tradeoff.',
    theory: 'Code rate R = k/n is the ratio of information bits to coded bits. Reliable communication requires R < C (capacity). The error exponent E(R) determines how quickly errors decrease.',
    formula: 'R = \\frac{k}{n}, \\quad 0 < R \\leq C',
    example: 'Sweep R from 0 to capacity to see the exponent curve',
    learnMoreUrl: '#/learn/concepts/error-exponent',
    learnMoreSection: 'code-rate'
  },
  'plot-xVar-N': {
    title: 'Sweep: Quadrature Points (N)',
    category: 'X-Axis Variable',
    description: 'Vary N to analyze numerical integration accuracy.',
    theory: 'Gauss-Hermite quadrature uses N weighted nodes from Hermite polynomial roots. With N nodes, it exactly integrates polynomials of degree 2N-1. Results typically stabilize around N=20-50.',
    formula: 'w_z = \\frac{2^{n-1} \\cdot n! \\cdot \\sqrt{\\pi}}{n^2 \\cdot [H_{n-1}(z)]^2}',
    example: 'Sweep N from 5 to 40 to find convergence point',
    learnMoreUrl: '#/learn/concepts/numerical-methods',
    learnMoreSection: 'hermite'
  },
  'plot-xVar-n': {
    title: 'Sweep: Code Length (n)',
    category: 'X-Axis Variable',
    description: 'Vary codeword length to see error probability decay.',
    theory: 'Error probability decreases exponentially with code length n. Doubling n roughly squares the reliability. Only available when Y-axis is Error Probability.',
    formula: 'P_e \\leq 2^{-n \\cdot E(R)}',
    example: 'Sweep n from 100 to 10000 to see exponential decay',
    learnMoreUrl: '#/learn/concepts/error-exponent',
    learnMoreSection: 'code-length'
  },
  'plot-xVar-threshold': {
    title: 'Sweep: Convergence Threshold (τ)',
    category: 'X-Axis Variable',
    description: 'Vary the weight threshold for quadrature optimization.',
    theory: 'EPCalculator uses thresholding to skip nodes with negligibly small weights, reducing computation while maintaining accuracy. The threshold determines which nodes to include.',
    formula: '\\mathcal{F} = \\{z \\in \\mathcal{D} \\mid W(z) \\leq \\theta\\}',
    example: 'Sweep τ from 10⁻³ to 10⁻¹² to find accuracy plateau',
    learnMoreUrl: '#/learn/concepts/numerical-methods',
    learnMoreSection: 'thresholding'
  },
  'plot-xVar-shaping_param': {
    title: 'Sweep: Shaping Parameter (λ)',
    category: 'X-Axis Variable',
    description: 'Vary the Maxwell-Boltzmann distribution parameter.',
    theory: 'The parameter λ controls how probability mass concentrates on inner constellation points. λ=0 gives uniform distribution. Higher λ reduces average energy while maintaining minimum distance.',
    formula: 'P(x_k) = \\frac{e^{-\\lambda |x_k|^2}}{\\sum_j e^{-\\lambda |x_j|^2}}',
    example: 'Sweep λ from 0 to 2 to find optimal shaping gain',
    learnMoreUrl: '#/learn/concepts/probabilistic-shaping',
    learnMoreSection: 'maxwell-boltzmann'
  },
  'plot-points': {
    title: 'Number of Points',
    category: 'Plotting Controls',
    description: 'How many computation points along the X-axis.',
    theory: 'More points give smoother curves but take longer to compute. For line plots, 20-50 points typically provide good visual quality. For contour/surface plots, 10-30 points per axis is common.',
    behavior: 'Integer between 1 and 101. Higher values increase computation time linearly.',
    learnMoreUrl: '#/learn/tutorials/line-plots',
    learnMoreSection: 'setup'
  },
  'plot-generate': {
    title: 'Generate Plot',
    category: 'Plotting Controls',
    description: 'Compute results and render the visualization.',
    theory: 'This will sweep the X-axis parameter(s) through the specified range, computing the selected metric at each point using the base parameters from the Simulation panel.',
    behavior: 'Disabled when validation errors exist or a computation is in progress.',
    learnMoreUrl: '#/learn/tutorials/line-plots',
    learnMoreSection: 'setup'
  },
  'plot-import': {
    title: 'Import Data',
    category: 'Plotting Controls',
    description: 'Import external data to overlay on your plots.',
    theory: 'Compare your computed results against simulation data, experimental measurements, or reference curves from literature.',
    formats: [
      { name: 'CSV', desc: 'Comma-separated values with headers' },
      { name: 'JSON', desc: 'Array of {x, y} objects' },
      { name: 'TXT', desc: 'Space or tab-separated columns' }
    ],
    learnMoreUrl: '#/learn/tutorials/import-data',
    learnMoreSection: 'accessing'
  }
};
