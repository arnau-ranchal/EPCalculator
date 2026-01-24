/**
 * Documentation Articles Content
 *
 * Each article is structured with:
 * - title: Main heading
 * - subtitle: Optional secondary description
 * - sections: Array of content blocks (see types below)
 *
 * Section types:
 * - heading: { type: 'heading', text: '...' }
 * - paragraph: { type: 'paragraph', text: '...' }  (supports $latex$)
 * - formula: { type: 'formula', latex: '...', label: '...' }
 * - list: { type: 'list', items: ['...'] }
 * - numbered-list: { type: 'numbered-list', items: ['...'] }
 * - code: { type: 'code', language: '...', code: '...' }
 * - note: { type: 'note', text: '...', variant: 'info'|'warning' }
 * - try-it: { type: 'try-it', params: {...}, label: '...', description: '...' }
 * - definitions: { type: 'definitions', items: [{term, definition}] }
 * - image: { type: 'image', src: '...', alt: '...', caption: '...' }
 */

export const articles = {
  // ==========================================================================
  // CONCEPTS SECTION
  // ==========================================================================
  concepts: {
    'awgn-channel': {
      title: 'AWGN Channel & Signal-to-Noise Ratio',
      subtitle: 'Understanding the fundamental communication channel model',
      sections: [
        {
          type: 'paragraph',
          text: 'The Additive White Gaussian Noise (AWGN) channel is the most fundamental model in digital communications. It represents an ideal channel where the only impairment is the addition of noise.'
        },
        {
          type: 'heading',
          text: 'The Channel Model',
          id: 'channel-model'
        },
        {
          type: 'paragraph',
          text: 'In the AWGN channel, the received signal $Y$ is the transmitted signal $X$ plus noise $N$:'
        },
        {
          type: 'formula',
          latex: 'Y = X + N',
          label: 'AWGN Channel'
        },
        {
          type: 'paragraph',
          text: 'The noise $N$ has three key properties:'
        },
        {
          type: 'list',
          items: [
            '**Additive**: The noise adds to the signal (it doesn\'t multiply or distort it in other ways)',
            '**White**: The noise has equal power at all frequencies (flat power spectral density)',
            '**Gaussian**: The noise amplitude follows a normal distribution with mean zero'
          ]
        },
        {
          type: 'heading',
          text: 'Signal-to-Noise Ratio (SNR)',
          id: 'snr'
        },
        {
          type: 'paragraph',
          text: 'The SNR measures how much stronger the signal is compared to the noise. In EPCalculator, we use the parameter $\\gamma$ (gamma) to represent SNR:'
        },
        {
          type: 'formula',
          latex: '\\gamma = \\frac{P_s}{N_0} = \\frac{E_s}{N_0}',
          label: 'SNR Definition'
        },
        {
          type: 'definitions',
          items: [
            { term: '$P_s$ or $E_s$', definition: 'Signal power (or energy per symbol)' },
            { term: '$N_0$', definition: 'Noise power spectral density (power per Hz)' },
            { term: '$\\gamma$', definition: 'SNR ratio (linear scale, not dB)' }
          ]
        },
        {
          type: 'note',
          text: 'EPCalculator uses linear SNR, not decibels. To convert: $\\gamma_{\\text{linear}} = 10^{\\gamma_{\\text{dB}}/10}$',
          variant: 'info'
        },
        {
          type: 'screenshot',
          name: 'snr-input',
          caption: 'The SNR input field with unit selector (linear or dB)',
          alt: 'SNR input showing value and linear/dB dropdown'
        },
        {
          type: 'heading',
          text: 'Why AWGN Matters'
        },
        {
          type: 'paragraph',
          text: 'Despite being an idealized model, AWGN is important because:'
        },
        {
          type: 'numbered-list',
          items: [
            'It provides a theoretical baseline for system performance',
            'Many real channels approximate AWGN behavior in certain conditions',
            'Error exponent calculations rely on this model',
            'It allows tractable mathematical analysis'
          ]
        },
        {
          type: 'try-it',
          params: { snr: 10, modulation: 'psk', M: 4 },
          label: 'Try QPSK at 10 dB SNR',
          description: 'See how a 4-PSK constellation performs with moderate noise'
        }
      ]
    },

    'error-exponent': {
      title: 'Error Probability & Error Exponents',
      subtitle: 'The mathematical heart of EPCalculator',
      sections: [
        {
          type: 'paragraph',
          text: 'The error exponent $E_0(\\rho)$ is a fundamental quantity in information theory that characterizes how quickly the error probability decreases as we increase block length or code complexity.'
        },
        {
          type: 'heading',
          text: 'Error Probability (Pe)',
          id: 'error-probability'
        },
        {
          type: 'paragraph',
          text: 'The error probability $P_e$ is the probability that a transmitted codeword is decoded incorrectly. For well-designed codes, this probability decreases exponentially with the code length $n$:'
        },
        {
          type: 'formula',
          latex: 'P_e \\leq \\exp(-n \\cdot E(R))',
          label: 'Error Probability Bound'
        },
        {
          type: 'paragraph',
          text: 'The exponent $E(R)$ depends on the code rate $R$ and channel conditions. This exponential decrease is why longer codes achieve better reliability.'
        },
        {
          type: 'heading',
          text: 'The Error Exponent Formula',
          id: 'formula'
        },
        {
          type: 'paragraph',
          text: 'For a given channel and input distribution, the error exponent at parameter $\\rho \\in [0,1]$ is:'
        },
        {
          type: 'formula',
          latex: 'E_0(\\rho) = -\\ln \\left( \\sum_y \\left[ \\sum_x P(x) \\cdot P(y|x)^{\\frac{1}{1+\\rho}} \\right]^{1+\\rho} \\right)',
          label: 'Gallager\'s E₀'
        },
        {
          type: 'definitions',
          items: [
            { term: '$\\rho$', definition: 'Optimization parameter, ranges from 0 to 1' },
            { term: '$P(x)$', definition: 'Input probability distribution (constellation point probabilities)' },
            { term: '$P(y|x)$', definition: 'Channel transition probability (given by AWGN model)' },
            { term: '$E_0(\\rho)$', definition: 'The error exponent value in nats' }
          ]
        },
        {
          type: 'heading',
          text: 'The ρ Parameter',
          id: 'rho'
        },
        {
          type: 'paragraph',
          text: 'The parameter $\\rho \\in [0,1]$ is an optimization variable in Gallager\'s bound. Different values of $\\rho$ trade off between tightness of the bound and computational tractability.'
        },
        {
          type: 'heading',
          text: 'Special Values of ρ',
          id: 'special-values'
        },
        {
          type: 'paragraph',
          text: 'The parameter $\\rho$ connects to different information-theoretic quantities:'
        },
        {
          type: 'list',
          items: [
            '$\\rho = 0$: Gives the mutual information $I(X;Y)$ — the channel capacity',
            '$\\rho = 1$: Gives the cutoff rate $R_0$ — a practical coding threshold',
            'The derivative at $\\rho = 0$ gives the channel dispersion'
          ]
        },
        {
          type: 'note',
          text: 'In EPCalculator, when you compute "Single Point" with rho=0, you get the mutual information. With rho=1, you get the cutoff rate.',
          variant: 'info'
        },
        {
          type: 'heading',
          text: 'Code Rate (R)',
          id: 'code-rate'
        },
        {
          type: 'paragraph',
          text: 'The code rate $R = k/n$ is the ratio of information bits ($k$) to total coded bits ($n$). Lower rate means more redundancy for error correction, but lower throughput.'
        },
        {
          type: 'formula',
          latex: 'R = \\frac{k}{n}, \\quad 0 < R \\leq C',
          label: 'Code Rate'
        },
        {
          type: 'paragraph',
          text: 'Reliable communication is only possible when $R < C$ (channel capacity). The error exponent $E(R)$ determines how quickly errors decrease as $n$ grows.'
        },
        {
          type: 'heading',
          text: 'Code Length (n)',
          id: 'code-length'
        },
        {
          type: 'paragraph',
          text: 'The code length $n$ is the number of symbols in each codeword. Longer codes achieve better error performance because the error probability decreases exponentially with $n$:'
        },
        {
          type: 'formula',
          latex: 'P_e \\leq e^{-n \\cdot E(R)}',
          label: 'Error vs Code Length'
        },
        {
          type: 'paragraph',
          text: 'Doubling $n$ roughly squares the reliability (in log scale, the exponent doubles). However, longer codes mean more latency and decoding complexity.'
        },
        {
          type: 'heading',
          text: 'Why Error Exponents Matter'
        },
        {
          type: 'paragraph',
          text: 'A larger error exponent means faster error decay, which translates to better system performance or the ability to use shorter block lengths.'
        },
        {
          type: 'try-it',
          params: { snr: 5, modulation: 'qam', M: 16, rho: 0.5 },
          label: 'Calculate E₀ for 16-QAM',
          description: 'Compute the error exponent at ρ=0.5 for a 16-QAM constellation'
        }
      ]
    },

    'modulation': {
      title: 'Modulation Schemes (PAM, PSK, QAM)',
      subtitle: 'How information is mapped to signal constellations',
      sections: [
        {
          type: 'paragraph',
          text: 'Modulation schemes define how bits are mapped to signal points (symbols) for transmission. EPCalculator supports three major families: PAM, PSK, and QAM.'
        },
        {
          type: 'screenshot',
          name: 'custom-constellation',
          caption: 'The constellation editor showing a custom pattern',
          alt: 'Custom constellation editor interface'
        },
        {
          type: 'heading',
          text: 'PAM (Pulse Amplitude Modulation)',
          id: 'pam'
        },
        {
          type: 'paragraph',
          text: 'PAM uses a one-dimensional constellation where symbols differ only in amplitude. For $M$-PAM, there are $M$ equally-spaced points on a line.'
        },
        {
          type: 'formula',
          latex: 'x_k = (2k - 1 - M) \\cdot d, \\quad k = 1, 2, \\ldots, M',
          label: 'PAM Constellation Points'
        },
        {
          type: 'list',
          items: [
            '2-PAM: Also known as BPSK (two points: -1, +1)',
            '4-PAM: Four amplitude levels',
            '8-PAM: Eight amplitude levels'
          ]
        },
        {
          type: 'screenshot',
          name: 'modulation-selector',
          caption: 'Select M and modulation type to configure your constellation',
          alt: 'Modulation selector showing M=16 and PAM type'
        },
        {
          type: 'heading',
          text: 'PSK (Phase Shift Keying)',
          id: 'psk'
        },
        {
          type: 'paragraph',
          text: 'PSK places symbols on a circle (constant amplitude), differing only in phase angle. For $M$-PSK, points are equally spaced around the unit circle:'
        },
        {
          type: 'formula',
          latex: 'x_k = e^{j \\cdot 2\\pi k / M}, \\quad k = 0, 1, \\ldots, M-1',
          label: 'PSK Constellation Points'
        },
        {
          type: 'list',
          items: [
            'BPSK (2-PSK): Two points at 0° and 180°',
            'QPSK (4-PSK): Four points at 45°, 135°, 225°, 315°',
            '8-PSK: Eight equally-spaced phases'
          ]
        },
        {
          type: 'screenshot',
          name: 'modulation-selector-psk8',
          caption: 'Selecting 8-PSK modulation',
          alt: 'Modulation selector configured for 8-PSK'
        },
        {
          type: 'heading',
          text: 'QAM (Quadrature Amplitude Modulation)',
          id: 'qam'
        },
        {
          type: 'paragraph',
          text: 'QAM combines amplitude and phase modulation, placing points on a 2D grid. This allows more bits per symbol but requires higher SNR.'
        },
        {
          type: 'list',
          items: [
            '4-QAM: Equivalent to QPSK',
            '16-QAM: 4×4 grid, 4 bits per symbol',
            '64-QAM: 8×8 grid, 6 bits per symbol',
            '256-QAM: 16×16 grid, 8 bits per symbol'
          ]
        },
        {
          type: 'screenshot',
          name: 'modulation-selector-qam16',
          caption: 'Selecting 16-QAM modulation',
          alt: 'Modulation selector configured for 16-QAM'
        },
        {
          type: 'note',
          text: 'Higher-order modulations (more points) carry more bits per symbol but are more susceptible to noise. The error exponent helps quantify this tradeoff.',
          variant: 'info'
        },
        {
          type: 'heading',
          text: 'Comparing Modulations'
        },
        {
          type: 'paragraph',
          text: 'Use EPCalculator\'s Plot Mode to compare how different modulations perform across SNR values. You\'ll see that higher-order schemes need higher SNR to achieve the same error performance.'
        },
        {
          type: 'try-it',
          params: { mode: 'plot', modulation: 'qam', M: [4, 16, 64] },
          label: 'Compare QAM Orders',
          description: 'Plot error exponents for 4-QAM, 16-QAM, and 64-QAM'
        }
      ]
    },

    'mutual-information': {
      title: 'Mutual Information & Cutoff Rate',
      subtitle: 'Key quantities derived from the error exponent',
      sections: [
        {
          type: 'paragraph',
          text: 'Two important quantities can be extracted from the error exponent function: the mutual information (channel capacity) and the cutoff rate.'
        },
        {
          type: 'heading',
          text: 'Mutual Information I(X;Y)',
          id: 'mutual-info'
        },
        {
          type: 'paragraph',
          text: 'The mutual information measures how much information (in bits or nats) can be reliably transmitted per channel use. It\'s the derivative of $E_0(\\rho)$ at $\\rho = 0$:'
        },
        {
          type: 'formula',
          latex: 'I(X;Y) = \\left. \\frac{\\partial E_0(\\rho)}{\\partial \\rho} \\right|_{\\rho=0}',
          label: 'Mutual Information'
        },
        {
          type: 'paragraph',
          text: 'This represents the channel capacity — the maximum rate at which information can be transmitted with arbitrarily low error probability.'
        },
        {
          type: 'heading',
          text: 'Cutoff Rate R₀',
          id: 'cutoff-rate'
        },
        {
          type: 'paragraph',
          text: 'The cutoff rate is a more practical threshold, defined as the value of $E_0(\\rho)$ at $\\rho = 1$:'
        },
        {
          type: 'formula',
          latex: 'R_0 = E_0(1)',
          label: 'Cutoff Rate'
        },
        {
          type: 'paragraph',
          text: 'Historically, the cutoff rate was important because sequential decoding algorithms become computationally feasible only when the code rate is below $R_0$.'
        },
        {
          type: 'note',
          text: 'While modern coding schemes like LDPC and Turbo codes can approach capacity (mutual information), the cutoff rate remains useful for understanding decoder complexity.',
          variant: 'info'
        },
        {
          type: 'try-it',
          params: { snr: 10, modulation: 'psk', M: 8, rho: 0 },
          label: 'Calculate Mutual Information',
          description: 'Compute I(X;Y) for 8-PSK at SNR=10'
        }
      ]
    },

    'probabilistic-shaping': {
      title: 'Probabilistic Shaping',
      subtitle: 'Optimizing constellation point probabilities',
      sections: [
        {
          type: 'paragraph',
          text: 'In standard constellations, all points are transmitted with equal probability. Probabilistic shaping assigns different probabilities to constellation points to improve performance.'
        },
        {
          type: 'heading',
          text: 'Uniform Distribution',
          id: 'uniform'
        },
        {
          type: 'paragraph',
          text: 'The simplest approach is uniform distribution, where each of the $M$ constellation points has equal probability $P(x_k) = 1/M$. This maximizes entropy but doesn\'t minimize transmission energy.'
        },
        {
          type: 'formula',
          latex: 'P(x_k) = \\frac{1}{M}, \\quad k = 1, 2, \\ldots, M',
          label: 'Uniform Distribution'
        },
        {
          type: 'heading',
          text: 'Why Shape?',
          id: 'why-shape'
        },
        {
          type: 'paragraph',
          text: 'The error exponent formula includes the input distribution $P(x)$. By optimizing these probabilities, we can increase the error exponent and approach channel capacity more closely.'
        },
        {
          type: 'formula',
          latex: 'E_0^{\\text{shaped}}(\\rho) \\geq E_0^{\\text{uniform}}(\\rho)',
          label: 'Shaping Gain'
        },
        {
          type: 'paragraph',
          text: 'The optimal distribution typically gives higher probabilities to points closer to the origin (lower energy) and lower probabilities to outer points.'
        },
        {
          type: 'heading',
          text: 'Maxwell-Boltzmann Distribution',
          id: 'maxwell-boltzmann'
        },
        {
          type: 'paragraph',
          text: 'A common shaping distribution is Maxwell-Boltzmann, which has the form:'
        },
        {
          type: 'formula',
          latex: 'P(x_k) = \\frac{e^{-\\lambda |x_k|^2}}{\\sum_j e^{-\\lambda |x_j|^2}}',
          label: 'Maxwell-Boltzmann'
        },
        {
          type: 'paragraph',
          text: 'The parameter $\\lambda$ controls how "peaked" the distribution is toward low-energy points.'
        },
        {
          type: 'note',
          text: 'EPCalculator allows custom constellations where you can specify individual point probabilities, enabling you to test various shaping strategies.',
          variant: 'info'
        },
        {
          type: 'try-it',
          params: { mode: 'custom' },
          label: 'Try Custom Constellation',
          description: 'Define your own constellation with custom probabilities'
        }
      ]
    },

    'plot-controls': {
      title: 'Plot Controls & Visualization',
      subtitle: 'Understanding scale options and data visualization',
      sections: [
        {
          type: 'paragraph',
          text: 'EPCalculator provides various controls for visualizing error probability data. Choosing the right scale and axis configuration helps reveal important patterns in your results.'
        },
        {
          type: 'heading',
          text: 'Linear vs Logarithmic Scales',
          id: 'scales'
        },
        {
          type: 'paragraph',
          text: 'The choice between linear and logarithmic scales dramatically affects how your data appears and what patterns become visible.'
        },
        {
          type: 'screenshot',
          name: 'plotting-controls',
          caption: 'The plotting controls panel with scale options',
          alt: 'Plot configuration showing linear and logarithmic scale options'
        },
        {
          type: 'heading',
          text: 'Linear X Scale',
          id: 'linear-x'
        },
        {
          type: 'paragraph',
          text: 'A linear scale shows equal spacing for equal value differences. If SNR goes from 0 to 20 dB, each 5 dB step takes the same visual distance.'
        },
        {
          type: 'list',
          items: [
            'Best when your data spans a small range (e.g., 0-20 dB)',
            'Shows the "true shape" of curves',
            'Intuitive for comparing absolute differences'
          ]
        },
        {
          type: 'heading',
          text: 'Logarithmic X Scale',
          id: 'log-x'
        },
        {
          type: 'paragraph',
          text: 'A logarithmic scale compresses large values and expands small ones. Equal visual distances represent equal ratios (e.g., each step might be 10×).'
        },
        {
          type: 'formula',
          latex: 'x_{\\text{visual}} = \\log_{10}(x)',
          label: 'Log Transform'
        },
        {
          type: 'list',
          items: [
            'Essential when data spans many orders of magnitude',
            'Reveals exponential relationships as straight lines',
            'Common in communications where SNR ratios vary widely'
          ]
        },
        {
          type: 'heading',
          text: 'Linear Y Scale',
          id: 'linear-y'
        },
        {
          type: 'paragraph',
          text: 'For the Y-axis (typically error probability or exponent), linear scale shows proportional differences directly.'
        },
        {
          type: 'list',
          items: [
            'Use when values are in a narrow range',
            'Good for mutual information plots (values typically 0-10)',
            'Shows relative magnitudes intuitively'
          ]
        },
        {
          type: 'heading',
          text: 'Logarithmic Y Scale',
          id: 'log-y'
        },
        {
          type: 'paragraph',
          text: 'Error probabilities often span from $10^{-1}$ to $10^{-10}$ or smaller. Without log scale, small probabilities would be invisible.'
        },
        {
          type: 'formula',
          latex: 'P_e = 10^{-5} \\text{ vs } P_e = 10^{-10}',
          label: 'Order of Magnitude Comparison'
        },
        {
          type: 'note',
          text: 'Log Y scale reveals that error probability often decreases linearly with SNR (in dB) - a fundamental property of the AWGN channel.',
          variant: 'info'
        },
        {
          type: 'heading',
          text: 'SNR Units: dB vs Linear',
          id: 'snr-units'
        },
        {
          type: 'paragraph',
          text: 'SNR can be expressed in two ways:'
        },
        {
          type: 'definitions',
          items: [
            { term: 'Linear SNR', definition: 'Direct power ratio: SNR = $P_s/N_0$. Values like 1, 10, 100, 1000.' },
            { term: 'dB SNR', definition: 'Logarithmic: SNR$_{\\text{dB}}$ = $10 \\log_{10}(\\text{SNR})$. Values like 0, 10, 20, 30 dB.' }
          ]
        },
        {
          type: 'formula',
          latex: '\\text{SNR}_{\\text{dB}} = 10 \\cdot \\log_{10}\\left(\\frac{P_s}{N_0}\\right)',
          label: 'dB Conversion'
        },
        {
          type: 'screenshot',
          name: 'snr-input-db',
          caption: 'SNR input in decibel (dB) mode',
          alt: 'SNR input showing 10 dB value'
        },
        {
          type: 'note',
          text: 'A 3 dB increase doubles the linear SNR. A 10 dB increase multiplies SNR by 10.',
          variant: 'info'
        },
        {
          type: 'heading',
          text: 'Transposing Axes',
          id: 'transpose'
        },
        {
          type: 'paragraph',
          text: 'Swapping X and Y axes can reveal different relationships. For example, plotting SNR vs error probability (instead of error probability vs SNR) shows "how much SNR do I need for a target error rate?"'
        },
        {
          type: 'heading',
          text: 'Quadrature Points (N)',
          id: 'quadrature'
        },
        {
          type: 'paragraph',
          text: 'The error exponent computation involves numerical integration using Gauss-Hermite quadrature. The parameter $N$ controls how many integration points are used.'
        },
        {
          type: 'formula',
          latex: '\\int_{-\\infty}^{\\infty} f(x) e^{-x^2} dx \\approx \\sum_{i=1}^{N} w_i f(x_i)',
          label: 'Gauss-Hermite Quadrature'
        },
        {
          type: 'list',
          items: [
            '$N = 20$: Fast, good for quick exploration',
            '$N = 50$: Balanced accuracy and speed (default)',
            '$N = 100+$: High precision for publication-quality results'
          ]
        },
        {
          type: 'note',
          text: 'Higher N gives more accurate results but slower computation. For most practical purposes, N=50 is sufficient.',
          variant: 'info'
        }
      ]
    }
  },

  // ==========================================================================
  // TUTORIALS SECTION
  // ==========================================================================
  tutorials: {
    'getting-started': {
      title: 'Getting Started with EPCalculator',
      subtitle: 'Your first steps in computing error exponents',
      sections: [
        {
          type: 'paragraph',
          text: 'Welcome to EPCalculator! This tutorial will walk you through the basics of computing error exponents for digital communication systems.'
        },
        {
          type: 'heading',
          text: 'What EPCalculator Does'
        },
        {
          type: 'paragraph',
          text: 'EPCalculator computes the error exponent $E_0(\\rho)$ for various modulation schemes over an AWGN channel. This quantity tells you how reliably you can communicate at a given SNR.'
        },
        {
          type: 'heading',
          text: 'The Two Modes'
        },
        {
          type: 'paragraph',
          text: 'EPCalculator has two main computation modes:'
        },
        {
          type: 'definitions',
          items: [
            {
              term: 'Single Point Mode',
              definition: 'Compute the error exponent for one specific set of parameters (SNR, modulation, ρ)'
            },
            {
              term: 'Plot Mode',
              definition: 'Generate a curve showing how the error exponent varies across a range of SNR values'
            }
          ]
        },
        {
          type: 'heading',
          text: 'The Interface Overview'
        },
        {
          type: 'screenshot',
          name: 'app-overview',
          caption: 'The main EPCalculator interface',
          alt: 'EPCalculator main interface showing parameter form and results panel'
        },
        {
          type: 'heading',
          text: 'Quick Start: Single Point'
        },
        {
          type: 'numbered-list',
          items: [
            'Select "Single Point" tab at the top',
            'Set your SNR value (e.g., 10 dB)',
            'Choose a modulation scheme (e.g., QPSK)',
            'Set the ρ parameter (0 for capacity, 1 for cutoff rate)',
            'Click "Calculate"'
          ]
        },
        {
          type: 'screenshot',
          name: 'modulation-selector',
          caption: 'The modulation selector showing M and type options',
          alt: 'Modulation selector dropdown menus'
        },
        {
          type: 'try-it',
          params: { mode: 'single', snr: 10, modulation: 'psk', M: 4, rho: 0 },
          label: 'Try: QPSK Capacity at 10dB',
          description: 'Compute the mutual information for QPSK'
        },
        {
          type: 'heading',
          text: 'Quick Start: Plot Mode'
        },
        {
          type: 'numbered-list',
          items: [
            'Select "Plot" tab at the top',
            'Set your SNR range (e.g., 0 to 20 dB)',
            'Choose modulation schemes to compare',
            'Click "Generate Plot"',
            'Hover over the curve to see values at specific points'
          ]
        },
        {
          type: 'note',
          text: 'Tip: You can export your results as CSV or save plots as images using the export buttons in the results panel.',
          variant: 'info'
        },
        {
          type: 'heading',
          text: 'Customizing the Interface'
        },
        {
          type: 'paragraph',
          text: 'EPCalculator supports light and dark themes, plus multiple languages. Use the controls in the header to switch:'
        },
        {
          type: 'screenshot',
          name: 'theme-language',
          caption: 'Theme and language selector controls',
          alt: 'Theme toggle and language dropdown in the header'
        },
        {
          type: 'screenshot',
          name: 'app-dark-mode',
          caption: 'EPCalculator in dark mode',
          alt: 'Full application interface with dark theme enabled'
        }
      ]
    },

    'single-point': {
      title: 'Single Point Computation',
      subtitle: 'Computing error exponents for specific parameters',
      sections: [
        {
          type: 'paragraph',
          text: 'Single Point mode lets you compute the exact error exponent for a specific combination of SNR, modulation, and ρ parameter.'
        },
        {
          type: 'heading',
          text: 'When to Use Single Point'
        },
        {
          type: 'list',
          items: [
            'You need the precise value at a specific operating point',
            'You want to compare a small number of configurations',
            'You\'re validating against theoretical formulas',
            'You need the result for further calculations'
          ]
        },
        {
          type: 'heading',
          text: 'Parameters Explained'
        },
        {
          type: 'screenshot',
          name: 'parameter-form-full',
          caption: 'The complete parameter form',
          alt: 'Parameter input form showing SNR, R, and other settings'
        },
        {
          type: 'definitions',
          items: [
            { term: 'SNR (γ)', definition: 'Signal-to-noise ratio in linear scale or dB (check your units!)' },
            { term: 'Modulation', definition: 'PAM, PSK, or QAM constellation family' },
            { term: 'Order (M)', definition: 'Number of constellation points (must be power of 2 for PSK/QAM)' },
            { term: 'ρ (rho)', definition: 'Error exponent parameter, between 0 and 1' }
          ]
        },
        {
          type: 'heading',
          text: 'Understanding the Output'
        },
        {
          type: 'paragraph',
          text: 'The result panel shows:'
        },
        {
          type: 'list',
          items: [
            '$E_0(\\rho)$: The error exponent value in nats',
            'Computation time: How long the calculation took',
            'Method used: WASM (fast) or JavaScript fallback'
          ]
        },
        {
          type: 'note',
          text: 'For ρ=0, the result is the mutual information. For ρ=1, it\'s the cutoff rate.',
          variant: 'info'
        },
        {
          type: 'heading',
          text: 'Running the Computation'
        },
        {
          type: 'paragraph',
          text: 'Once you\'ve set your parameters, click the compute button to run the calculation:'
        },
        {
          type: 'screenshot',
          name: 'compute-button',
          caption: 'The compute button starts the calculation',
          alt: 'Red compute error probability button'
        }
      ]
    },

    'plotting': {
      title: 'Creating Plots',
      subtitle: 'Visualizing error exponents across SNR ranges',
      sections: [
        {
          type: 'paragraph',
          text: 'Plot mode generates curves showing how the error exponent changes with SNR. This is ideal for comparing modulation schemes or understanding performance trends.'
        },
        {
          type: 'heading',
          text: 'Setting Up a Plot',
          id: 'setup'
        },
        {
          type: 'numbered-list',
          items: [
            'Switch to the "Plot" tab',
            'Set the SNR range (start, end, and number of points)',
            'Choose one or more modulation schemes',
            'Select the ρ value or multiple ρ curves',
            'Click "Generate Plot"'
          ]
        },
        {
          type: 'screenshot',
          name: 'plotting-controls',
          caption: 'The plotting controls panel with all configuration options',
          alt: 'Plot configuration showing axis scales, ranges, and options'
        },
        {
          type: 'heading',
          text: 'Line Plots',
          id: 'line-plot'
        },
        {
          type: 'paragraph',
          text: 'Line plots show a single variable (like error exponent) against another (like SNR). They\'re ideal for comparing different modulation schemes or parameter settings.'
        },
        {
          type: 'heading',
          text: 'Contour Plots',
          id: 'contour-plot'
        },
        {
          type: 'paragraph',
          text: 'Contour plots visualize three dimensions: two input variables (e.g., SNR and code rate) and one output (e.g., error exponent). Color indicates the output value, with contour lines connecting equal values.'
        },
        {
          type: 'heading',
          text: 'Plot Interactions'
        },
        {
          type: 'list',
          items: [
            '**Hover**: See exact values at any point',
            '**Click**: Pin a data point for comparison',
            '**Legend**: Click to show/hide specific curves',
            '**Zoom**: Scroll to zoom, drag to pan'
          ]
        },
        {
          type: 'heading',
          text: 'Exporting Results'
        },
        {
          type: 'paragraph',
          text: 'You can export your plots and data in several formats:'
        },
        {
          type: 'list',
          items: [
            '**PNG/SVG**: Image export for presentations',
            '**CSV**: Raw data for spreadsheets or other tools',
            '**JSON**: Full configuration for reproducibility'
          ]
        },
        {
          type: 'try-it',
          params: { mode: 'plot', snrRange: [0, 20], modulations: ['psk-4', 'qam-16'] },
          label: 'Compare QPSK vs 16-QAM',
          description: 'See how these common modulations compare across SNR'
        }
      ]
    },

    'custom-constellation': {
      title: 'Custom Constellations',
      subtitle: 'Define your own signal constellations',
      sections: [
        {
          type: 'paragraph',
          text: 'EPCalculator lets you define custom constellations with arbitrary point positions and probabilities. This enables analysis of non-standard modulations and probabilistic shaping.'
        },
        {
          type: 'heading',
          text: 'The Constellation Editor',
          id: 'editor'
        },
        {
          type: 'paragraph',
          text: 'The constellation editor provides an interactive IQ (In-phase/Quadrature) plot where you can drag points directly, plus a table for precise coordinate editing.'
        },
        {
          type: 'screenshot',
          name: 'custom-constellation',
          caption: 'The complete constellation editor modal with plot and table',
          alt: 'Custom constellation editor showing the interactive plot and point table'
        },
        {
          type: 'heading',
          text: 'Plot Controls',
          id: 'plot-controls'
        },
        {
          type: 'paragraph',
          text: 'The plot area includes several controls for visualization and editing:'
        },
        {
          type: 'heading',
          text: 'Polar/Cartesian Toggle',
          id: 'polar-toggle'
        },
        {
          type: 'paragraph',
          text: 'Switch between Cartesian (Re/Im) and Polar (magnitude/phase) coordinate display. In Polar mode, the grid shows concentric circles and radial lines for magnitude and phase.'
        },
        {
          type: 'screenshot',
          name: 'constellation-polar-toggle',
          caption: 'The Polar toggle button switches between coordinate systems',
          alt: 'Polar toggle button highlighted in the constellation editor'
        },
        {
          type: 'heading',
          text: 'Undo/Redo',
          id: 'undo-redo'
        },
        {
          type: 'paragraph',
          text: 'Made a mistake while dragging points? Use the undo (↶) and redo (↷) buttons to step through your edit history. Supports up to 50 undo states.'
        },
        {
          type: 'screenshot',
          name: 'constellation-undo-redo',
          caption: 'Undo and redo buttons for reverting changes',
          alt: 'Undo and redo buttons highlighted in the constellation editor'
        },
        {
          type: 'heading',
          text: 'Collapsible Views',
          id: 'collapsible'
        },
        {
          type: 'paragraph',
          text: 'The plot and table can be shown or hidden independently using the navigation arrows. This is useful when you want to focus on either the visual or numerical representation.'
        },
        {
          type: 'screenshot',
          name: 'constellation-hide-table',
          caption: 'Click the right arrow to hide the table and expand the plot',
          alt: 'Navigation arrow to hide table highlighted'
        },
        {
          type: 'screenshot',
          name: 'constellation-hide-plot',
          caption: 'Click the left arrow to hide the plot and show only the table',
          alt: 'Navigation arrow to hide plot highlighted'
        },
        {
          type: 'heading',
          text: 'Table Controls',
          id: 'table-controls'
        },
        {
          type: 'paragraph',
          text: 'The table shows precise coordinates for each point. You can edit values directly by clicking on them.'
        },
        {
          type: 'definitions',
          items: [
            { term: 'Re (Real)', definition: 'X-coordinate (in-phase component)' },
            { term: 'Im (Imaginary)', definition: 'Y-coordinate (quadrature component)' },
            { term: 'Probability', definition: 'Transmission probability (all must sum to 1)' }
          ]
        },
        {
          type: 'heading',
          text: 'Adding Points',
          id: 'add-point'
        },
        {
          type: 'paragraph',
          text: 'Click the "+ Add Point" button to add a new constellation point. New points start at the origin with a default probability.'
        },
        {
          type: 'screenshot',
          name: 'constellation-add-point',
          caption: 'The Add Point button creates new constellation points',
          alt: 'Add Point button highlighted at the bottom of the table'
        },
        {
          type: 'note',
          text: 'You can have up to 99 constellation points, but at least 2 are required.',
          variant: 'info'
        },
        {
          type: 'heading',
          text: 'Footer Buttons',
          id: 'footer-buttons'
        },
        {
          type: 'paragraph',
          text: 'The modal footer contains the main action buttons:'
        },
        {
          type: 'heading',
          text: 'Cancel',
          id: 'cancel-button'
        },
        {
          type: 'paragraph',
          text: 'Discard all changes and close the editor without saving.'
        },
        {
          type: 'screenshot',
          name: 'constellation-cancel-button',
          caption: 'The Cancel button discards changes',
          alt: 'Cancel button highlighted in the modal footer'
        },
        {
          type: 'heading',
          text: 'Random Constellation Generator',
          id: 'random'
        },
        {
          type: 'paragraph',
          text: 'The "I\'m Feeling Lucky" button generates interesting random constellation patterns inspired by real modulation schemes:'
        },
        {
          type: 'screenshot',
          name: 'constellation-lucky-button',
          caption: 'The I\'m Feeling Lucky button generates random constellations',
          alt: 'I\'m Feeling Lucky button highlighted in the modal footer'
        },
        {
          type: 'list',
          items: [
            '**Ring (PSK-like)**: Points evenly distributed on a circle',
            '**Grid (QAM-like)**: Rectangular arrangement (requires square point count)',
            '**Multi-Ring (APSK-like)**: Concentric rings with different radii',
            '**Clustered**: Points grouped into clusters around a ring',
            '**Scattered**: Uniformly random positions'
          ]
        },
        {
          type: 'heading',
          text: 'Customizing Random Generation',
          id: 'lucky-options'
        },
        {
          type: 'paragraph',
          text: 'Click the gear icon (⚙) next to "I\'m Feeling Lucky" to open the options panel. Three checkboxes control what gets randomized:'
        },
        {
          type: 'screenshot',
          name: 'constellation-lucky-dropdown',
          caption: 'The random generator options panel with three customizable settings',
          alt: 'Lucky options dropdown showing checkboxes for number of points, mean position, and point positions'
        },
        {
          type: 'heading',
          text: 'Option 1: Random Number of Points',
          id: 'lucky-num-points'
        },
        {
          type: 'list',
          items: [
            '**Checked (default)**: Each click generates a constellation with a random number of points within the specified range (e.g., 2 to 16)',
            '**Unchecked**: Uses a fixed number of points that you specify. Useful when you want to compare different patterns with the same symbol count.'
          ]
        },
        {
          type: 'heading',
          text: 'Option 2: Random Mean Position',
          id: 'lucky-mean'
        },
        {
          type: 'list',
          items: [
            '**Checked (default)**: The constellation is centered at a random position in the IQ plane',
            '**Unchecked**: You specify the center (Re, Im). Use (0, 0) for a standard centered constellation, or offset it to study non-centered modulations.'
          ]
        },
        {
          type: 'heading',
          text: 'Option 3: Random Point Positions',
          id: 'lucky-positions'
        },
        {
          type: 'list',
          items: [
            '**Checked (default)**: Points are placed according to the randomly selected pattern (ring, grid, clustered, etc.)',
            '**Unchecked**: Keeps the current point positions but may still change the number of points or center position based on the other options'
          ]
        },
        {
          type: 'note',
          text: 'Typical use case: Uncheck "Random number of points" and set it to 16, then click Lucky repeatedly to explore different 16-point constellation shapes.',
          variant: 'info'
        },
        {
          type: 'heading',
          text: 'Use / Normalize',
          id: 'use-button'
        },
        {
          type: 'paragraph',
          text: 'The rightmost button changes based on constellation validity:'
        },
        {
          type: 'list',
          items: [
            '**Use**: When probabilities sum to 1 and energy equals 1, click to apply the constellation',
            '**Normalize**: When invalid, click to automatically fix probabilities (sum to 1) and scale points (unit energy)'
          ]
        },
        {
          type: 'screenshot',
          name: 'constellation-use-button',
          caption: 'The Use button applies the constellation when valid',
          alt: 'Use button highlighted in the modal footer'
        },
        {
          type: 'note',
          text: 'Probabilities must sum to exactly 1 and the constellation must have unit average energy. The Normalize button fixes both automatically.',
          variant: 'warning'
        },
        {
          type: 'heading',
          text: 'Example: Shaped 4-QAM'
        },
        {
          type: 'paragraph',
          text: 'A Maxwell-Boltzmann shaped 4-QAM might have inner points (±0.5, ±0.5) with higher probability than outer points:'
        },
        {
          type: 'code',
          language: 'text',
          code: 'Point    Re    Im    Probability\n  1     -1    -1      0.15\n  2     -1    +1      0.15\n  3     +1    -1      0.15\n  4     +1    +1      0.15\n(Inner points would get higher probabilities)'
        }
      ]
    },

    'exporting': {
      title: 'Exporting Results',
      subtitle: 'Save your calculations for reports and further analysis',
      sections: [
        {
          type: 'paragraph',
          text: 'EPCalculator provides several ways to export your computation results for use in reports, papers, or other tools.'
        },
        {
          type: 'heading',
          text: 'Export Formats',
          id: 'formats'
        },
        {
          type: 'definitions',
          items: [
            {
              term: 'CSV',
              definition: 'Comma-separated values, opens in Excel/Google Sheets. Contains SNR values and corresponding error exponents.'
            },
            {
              term: 'JSON',
              definition: 'Complete data including all parameters used. Good for reproducibility.'
            },
            {
              term: 'PNG',
              definition: 'High-resolution image of your plot'
            },
            {
              term: 'SVG',
              definition: 'Vector graphics, scales perfectly for publications'
            }
          ]
        },
        {
          type: 'heading',
          text: 'Citing Your Results'
        },
        {
          type: 'paragraph',
          text: 'If you use EPCalculator in academic work, you can cite it as:'
        },
        {
          type: 'code',
          language: 'bibtex',
          code: '@software{epcalculator,\n  title = {EPCalculator: Error Exponent Calculator},\n  author = {Gordillo, Soldevila, Ranchal},\n  year = {2024},\n  url = {https://github.com/arnau-ranchal/EPCalculator}\n}'
        }
      ]
    }
  },

  // ==========================================================================
  // API SECTION
  // ==========================================================================
  api: {
    'overview': {
      title: 'API Overview',
      subtitle: 'Integrating EPCalculator into your applications',
      sections: [
        {
          type: 'paragraph',
          text: 'EPCalculator provides a REST API that lets you compute error exponents programmatically. This is useful for batch processing, integration with other tools, or building your own interfaces.'
        },
        {
          type: 'heading',
          text: 'Base URL'
        },
        {
          type: 'code',
          language: 'text',
          code: 'http://localhost:8000/api/v1'
        },
        {
          type: 'paragraph',
          text: 'For the deployed version, replace localhost with the server address.'
        },
        {
          type: 'heading',
          text: 'Available Endpoints'
        },
        {
          type: 'definitions',
          items: [
            { term: 'POST /compute/single/standard', definition: 'Single point calculation for standard constellations' },
            { term: 'POST /compute/single/custom', definition: 'Single point with custom constellation' },
            { term: 'POST /compute/range/standard', definition: 'Calculate over SNR range (for plotting)' },
            { term: 'GET /health', definition: 'Health check endpoint' }
          ]
        },
        {
          type: 'heading',
          text: 'Interactive Documentation'
        },
        {
          type: 'paragraph',
          text: 'Full API documentation with interactive examples is available at the Swagger UI:'
        },
        {
          type: 'code',
          language: 'text',
          code: '/docs'
        },
        {
          type: 'note',
          text: 'The Swagger UI lets you try API calls directly from your browser — no coding required!',
          variant: 'info'
        }
      ]
    },

    'endpoints': {
      title: 'Endpoints Reference',
      subtitle: 'Detailed API endpoint documentation',
      sections: [
        {
          type: 'heading',
          text: 'POST /compute/single/standard'
        },
        {
          type: 'paragraph',
          text: 'Computes the error exponent for a standard constellation at a single SNR point.'
        },
        {
          type: 'code',
          language: 'json',
          code: '{\n  "snr": 10.0,\n  "rho": 0.5,\n  "modulation": "qam",\n  "order": 16\n}'
        },
        {
          type: 'paragraph',
          text: 'Response:'
        },
        {
          type: 'code',
          language: 'json',
          code: '{\n  "e0": 1.234,\n  "computeTime": 0.015,\n  "method": "wasm"\n}'
        },
        {
          type: 'heading',
          text: 'POST /compute/single/custom'
        },
        {
          type: 'paragraph',
          text: 'Computes error exponent for a custom constellation.'
        },
        {
          type: 'code',
          language: 'json',
          code: '{\n  "snr": 10.0,\n  "rho": 0.5,\n  "points": [\n    {"re": 1.0, "im": 1.0, "prob": 0.25},\n    {"re": 1.0, "im": -1.0, "prob": 0.25},\n    {"re": -1.0, "im": 1.0, "prob": 0.25},\n    {"re": -1.0, "im": -1.0, "prob": 0.25}\n  ]\n}'
        },
        {
          type: 'heading',
          text: 'POST /compute/range/standard'
        },
        {
          type: 'paragraph',
          text: 'Computes error exponents across an SNR range for plotting.'
        },
        {
          type: 'code',
          language: 'json',
          code: '{\n  "snrStart": 0.0,\n  "snrEnd": 20.0,\n  "snrPoints": 100,\n  "rho": 0.5,\n  "modulation": "psk",\n  "order": 8\n}'
        }
      ]
    },

    'examples': {
      title: 'Code Examples',
      subtitle: 'Sample code for common API tasks',
      sections: [
        {
          type: 'heading',
          text: 'Python Example'
        },
        {
          type: 'code',
          language: 'python',
          code: 'import requests\n\nresponse = requests.post(\n    "http://localhost:8000/api/v1/compute/single/standard",\n    json={\n        "snr": 10.0,\n        "rho": 0.5,\n        "modulation": "qam",\n        "order": 16\n    }\n)\n\nresult = response.json()\nprint(f"E₀(ρ) = {result[\'e0\']:.4f} nats")'
        },
        {
          type: 'heading',
          text: 'JavaScript/Fetch Example'
        },
        {
          type: 'code',
          language: 'javascript',
          code: 'const response = await fetch(\n  "http://localhost:8000/api/v1/compute/single/standard",\n  {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({\n      snr: 10.0,\n      rho: 0.5,\n      modulation: "qam",\n      order: 16\n    })\n  }\n);\n\nconst result = await response.json();\nconsole.log(`E₀(ρ) = ${result.e0.toFixed(4)} nats`);'
        },
        {
          type: 'heading',
          text: 'cURL Example'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST http://localhost:8000/api/v1/compute/single/standard \\\n  -H "Content-Type: application/json" \\\n  -d \'{"snr": 10, "rho": 0.5, "modulation": "qam", "order": 16}\''
        },
        {
          type: 'note',
          text: 'All examples assume the server is running locally. Adjust the URL for your deployment.',
          variant: 'info'
        }
      ]
    }
  }
};
