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
          text: 'The Additive White Gaussian Noise (AWGN) channel is the most fundamental model in digital communications. It represents an ideal channel where the only impairment is the addition of noise. This page describes the mathematical model used in EPCalculator.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // CHANNEL MODEL
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'The Channel Model',
          id: 'channel-model'
        },
        {
          type: 'paragraph',
          text: 'In the AWGN channel, the received signal $Y$ is the transmitted signal $X$ (scaled by $\\sqrt{\\text{SNR}}$) plus noise $N$:'
        },
        {
          type: 'formula',
          latex: 'Y = \\sqrt{\\text{SNR}} \\cdot X + N',
          label: 'AWGN Channel Model'
        },
        {
          type: 'paragraph',
          text: 'where $N$ is a complex Gaussian random variable with independent real and imaginary parts, each with variance $\\frac{1}{2}$ (so the total noise power is 1).'
        },
        {
          type: 'paragraph',
          text: 'The noise $N$ has three key properties:'
        },
        {
          type: 'list',
          items: [
            '**Additive**: The noise adds to the signal (doesn\'t multiply or distort)',
            '**White**: Equal power at all frequencies (flat power spectral density)',
            '**Gaussian**: The noise amplitude follows a normal distribution with mean zero'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // GAUSSIAN PDF
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'The Gaussian Probability Density Function',
          id: 'gaussian-pdf'
        },
        {
          type: 'paragraph',
          text: 'For the real-valued case, Gaussian noise has the familiar bell-curve PDF:'
        },
        {
          type: 'formula',
          latex: 'f_N(n) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} \\exp\\left(-\\frac{n^2}{2\\sigma^2}\\right)',
          label: 'Real Gaussian PDF'
        },
        {
          type: 'paragraph',
          text: 'For the complex-valued channel used in EPCalculator (with unit noise power), the transition probability density—the probability of receiving $y$ given that $x$ was transmitted—is:'
        },
        {
          type: 'formula',
          latex: 'W(y|x) = \\frac{1}{\\pi} \\exp\\left(-|y - \\sqrt{\\text{SNR}} \\cdot x|^2\\right)',
          label: 'Complex AWGN Transition Probability'
        },
        {
          type: 'paragraph',
          text: 'This is a complex Gaussian centered at $\\sqrt{\\text{SNR}} \\cdot x$ with unit variance. The $\\frac{1}{\\pi}$ normalization ensures the PDF integrates to 1 over the complex plane.'
        },
        {
          type: 'note',
          text: 'The kernel $e^{-|z|^2} = e^{-\\text{Re}(z)^2} \\cdot e^{-\\text{Im}(z)^2}$ is separable—this is why we can use product-form Gauss-Hermite quadrature for numerical integration.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // SNR
        // ─────────────────────────────────────────────────────────────────────
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
          latex: '\\gamma = \\frac{E_s}{N_0}',
          label: 'SNR Definition'
        },
        {
          type: 'definitions',
          items: [
            { term: '$E_s$', definition: 'Energy per symbol (average signal power times symbol duration)' },
            { term: '$N_0$', definition: 'Noise power spectral density (power per Hz)' },
            { term: '$\\gamma$', definition: 'SNR ratio (linear scale, not dB)' }
          ]
        },
        {
          type: 'heading',
          text: 'SNR in dB vs Linear',
          id: 'snr-conversion'
        },
        {
          type: 'paragraph',
          text: 'SNR is commonly expressed in decibels (dB), which is a logarithmic scale:'
        },
        {
          type: 'formula',
          latex: '\\text{SNR}_{\\text{dB}} = 10 \\log_{10}(\\gamma)',
          label: 'dB Conversion'
        },
        {
          type: 'paragraph',
          text: 'To convert from dB back to linear:'
        },
        {
          type: 'formula',
          latex: '\\gamma = 10^{\\text{SNR}_{\\text{dB}}/10}',
          label: 'Linear Conversion'
        },
        {
          type: 'note',
          text: 'EPCalculator allows input in either linear or dB units. Remember: 3 dB doubles the linear SNR, and 10 dB multiplies it by 10.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // WHY AWGN MATTERS
        // ─────────────────────────────────────────────────────────────────────
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
            'Error exponent calculations rely on this model for tractability',
            'The separable Gaussian kernel enables efficient numerical computation'
          ]
        },
        {
          type: 'try-it',
          params: { snr: 10, modulation: 'psk', M: 4 },
          label: 'Try QPSK at 10 dB SNR',
          description: 'See how a 4-PSK constellation performs with moderate noise'
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/error-exponent', label: 'Error Exponent for AWGN', description: 'How the channel model enters the E₀ formula' },
            { path: 'concepts/numerical-methods', label: 'Gauss-Hermite Quadrature', description: 'Numerical integration exploiting the Gaussian structure' }
          ]
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/single-point', label: 'Setting SNR in Single Point Mode', description: 'Learn how to input SNR values and choose between linear and dB units' },
            { path: 'tutorials/line-plots', label: 'Plotting Error Exponents vs SNR', description: 'Visualize how performance changes across SNR ranges' }
          ]
        }
      ]
    },

    'error-exponent': {
      title: 'Error Probability & Error Exponents',
      subtitle: 'The mathematical heart of EPCalculator',
      sections: [
        {
          type: 'paragraph',
          text: 'The error exponent $E_0(\\rho)$ is a fundamental quantity in information theory that characterizes how quickly the error probability decreases as we increase block length or code complexity. This page presents the complete mathematical derivation implemented in EPCalculator.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // ERROR PROBABILITY BOUND
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Error Probability Bound',
          id: 'error-probability'
        },
        {
          type: 'paragraph',
          text: 'The error probability $P_e$ is the probability that a transmitted codeword is decoded incorrectly. For well-designed codes using random coding arguments, Gallager showed that this probability is bounded exponentially in the code length $n$:'
        },
        {
          type: 'formula',
          latex: 'P_e \\leq 2^{-n E(R)}',
          label: 'Gallager\'s Error Probability Bound'
        },
        {
          type: 'paragraph',
          text: 'This is a remarkably powerful result: it tells us that with proper coding, errors can be made arbitrarily small by increasing $n$, as long as we operate below channel capacity. The error exponent $E(R)$ determines the rate of this exponential decay.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // IID ERROR EXPONENT
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'IID Random Coding Error Exponent',
          id: 'iid-exponent'
        },
        {
          type: 'paragraph',
          text: 'For IID (independent and identically distributed) random codes, where each codeword symbol is drawn independently from distribution $Q(x)$, the error exponent is:'
        },
        {
          type: 'formula',
          latex: 'E(R) = \\max_{0 \\leq \\rho \\leq 1} \\left\\{ E_0^{\\text{iid}}(\\rho) - \\rho R \\right\\}',
          label: 'IID Error Exponent Optimization'
        },
        {
          type: 'paragraph',
          text: 'This optimization over $\\rho$ finds the tightest bound for a given code rate $R$. The function being optimized is Gallager\'s $E_0$ function minus a linear term in the rate.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // GALLAGER'S E₀ FORMULA
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Gallager\'s E₀ Function',
          id: 'e0-formula'
        },
        {
          type: 'paragraph',
          text: 'The core quantity computed by EPCalculator is Gallager\'s $E_0^{\\text{iid}}(\\rho)$, defined for a channel with transition probability density $W(y|x)$ and input distribution $Q(x)$:'
        },
        {
          type: 'formula',
          latex: 'E_0^{\\text{iid}}(\\rho) = -\\log_2 \\sum_{x \\in \\mathcal{X}} Q(x) \\int_{y \\in \\mathcal{Y}} W(y|x) \\left( \\frac{\\sum_{\\bar{x} \\in \\mathcal{X}} Q(\\bar{x}) \\, W(y|\\bar{x})^{\\frac{1}{1+\\rho}}}{W(y|x)^{\\frac{1}{1+\\rho}}} \\right)^{\\rho} dy',
          label: 'General Gallager E₀'
        },
        {
          type: 'definitions',
          items: [
            { term: '$\\mathcal{X}$', definition: 'Input alphabet (constellation points)' },
            { term: '$\\mathcal{Y}$', definition: 'Output alphabet (received signal space, $\\mathbb{C}$ for complex AWGN)' },
            { term: '$Q(x)$', definition: 'Input probability distribution (constellation point probabilities)' },
            { term: '$W(y|x)$', definition: 'Channel transition probability density' },
            { term: '$\\rho$', definition: 'Optimization parameter in $[0,1]$' }
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // AWGN SPECIALIZATION
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Specialization to AWGN Channel',
          id: 'awgn-specialization'
        },
        {
          type: 'paragraph',
          text: 'For the Additive White Gaussian Noise (AWGN) channel, the transition probability density is a complex Gaussian centered at the transmitted symbol scaled by $\\sqrt{\\text{SNR}}$:'
        },
        {
          type: 'formula',
          latex: 'W(y|x) = \\frac{1}{\\pi} e^{-|y - \\sqrt{\\text{SNR}} \\cdot x|^2}',
          label: 'AWGN Transition Probability'
        },
        {
          type: 'paragraph',
          text: 'Substituting this into Gallager\'s formula, we obtain:'
        },
        {
          type: 'formula',
          latex: 'E_0^{\\text{iid}}(\\rho) = -\\log_2 \\sum_{x \\in \\mathcal{X}} \\frac{Q(x)}{\\pi} \\int_{y \\in \\mathbb{C}} e^{-|y-\\sqrt{\\text{SNR}}\\, x|^2} \\left( \\frac{\\sum_{\\bar{x}} Q(\\bar{x}) \\left(\\frac{1}{\\pi} e^{-|y-\\sqrt{\\text{SNR}}\\, \\bar{x}|^2}\\right)^{\\frac{1}{1+\\rho}}}{\\left(\\frac{1}{\\pi} e^{-|y-\\sqrt{\\text{SNR}}\\, x|^2}\\right)^{\\frac{1}{1+\\rho}}} \\right)^{\\rho} dy',
          label: 'E₀ for AWGN'
        },
        // ─────────────────────────────────────────────────────────────────────
        // KEY SUBSTITUTION
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'The Key Substitution',
          id: 'substitution'
        },
        {
          type: 'paragraph',
          text: 'The integral above is a non-elementary integral that cannot be solved in closed form. To enable numerical computation via Gauss-Hermite quadrature, we perform the substitution $z = y - \\sqrt{\\text{SNR}} \\cdot x$, which centers the integration around the noise distribution:'
        },
        {
          type: 'formula',
          latex: 'E_0^{\\text{iid}}(\\rho) = -\\log_2 \\sum_{x \\in \\mathcal{X}} \\frac{Q(x)}{\\pi} \\int_{z \\in \\mathbb{C}} e^{-|z|^2} \\left( \\frac{\\sum_{\\bar{x}} Q(\\bar{x}) \\left(\\frac{1}{\\pi} e^{-|z + \\sqrt{\\text{SNR}}(x-\\bar{x})|^2}\\right)^{\\frac{1}{1+\\rho}}}{\\left(\\frac{1}{\\pi} e^{-|z|^2}\\right)^{\\frac{1}{1+\\rho}}} \\right)^{\\rho} dz',
          label: 'E₀ After Substitution'
        },
        {
          type: 'note',
          text: 'This substitution is crucial! The kernel $e^{-|z|^2} = e^{-\\text{Re}(z)^2} \\cdot e^{-\\text{Im}(z)^2}$ is now separable into real and imaginary components, enabling efficient 2D Gauss-Hermite quadrature.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // FINAL COMPUTABLE FORM
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Final Computable Form',
          id: 'computable-form'
        },
        {
          type: 'paragraph',
          text: 'Using Gauss-Hermite quadrature (see Numerical Methods), we approximate the integral as a weighted sum over quadrature nodes $\\mathcal{Z}_n$:'
        },
        {
          type: 'formula',
          latex: 'E_0^{\\text{iid}}(\\rho) \\approx -\\log_2 \\sum_{x \\in \\mathcal{X}} \\frac{Q(x)}{\\pi} \\left[ \\sum_{z \\in \\mathcal{Z}_n} W(z) \\cdot f_{(x,z)}(\\rho)^{\\rho} \\right]',
          label: 'Discretized E₀'
        },
        {
          type: 'paragraph',
          text: 'where the inner function $f_{(x,z)}(\\rho)$ captures the likelihood ratio:'
        },
        {
          type: 'formula',
          latex: 'f_{(x,z)}(\\rho) = \\frac{\\sum_{\\bar{x} \\in \\mathcal{X}} Q(\\bar{x}) \\left(\\frac{1}{\\pi} e^{-|z + \\sqrt{\\text{SNR}}(x-\\bar{x})|^2}\\right)^{\\frac{1}{1+\\rho}}}{\\left(\\frac{1}{\\pi} e^{-|z|^2}\\right)^{\\frac{1}{1+\\rho}}}',
          label: 'Likelihood Ratio Function'
        },
        // ─────────────────────────────────────────────────────────────────────
        // THE ρ PARAMETER
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'The ρ Parameter',
          id: 'rho'
        },
        {
          type: 'paragraph',
          text: 'The parameter $\\rho \\in [0,1]$ is an optimization variable in Gallager\'s bound. Different values produce different error exponents, and the optimal $\\rho$ depends on the code rate $R$.'
        },
        {
          type: 'heading',
          text: 'Special Values of ρ',
          id: 'special-values'
        },
        {
          type: 'list',
          items: [
            '$\\rho = 0$: Gives the **mutual information** $I(X;Y)$ — the channel capacity',
            '$\\rho = 1$: Gives the **cutoff rate** $R_0$ — a practical coding threshold',
            'The **derivative** $\\frac{\\partial E_0}{\\partial \\rho}\\big|_{\\rho=0}$ gives the channel dispersion'
          ]
        },
        {
          type: 'note',
          text: 'In EPCalculator, when you compute "Single Point" with ρ=0, you get the mutual information. With ρ=1, you get the cutoff rate.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // CODE RATE AND LENGTH
        // ─────────────────────────────────────────────────────────────────────
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
          latex: 'P_e \\leq 2^{-n \\cdot E(R)}',
          label: 'Error vs Code Length'
        },
        {
          type: 'paragraph',
          text: 'Doubling $n$ roughly squares the reliability (in log scale, the exponent doubles). However, longer codes mean more latency and decoding complexity.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // WHY IT MATTERS
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Why Error Exponents Matter'
        },
        {
          type: 'paragraph',
          text: 'A larger error exponent means faster error decay, which translates to better system performance or the ability to use shorter block lengths. The error exponent provides a more nuanced view of channel quality than capacity alone.'
        },
        {
          type: 'try-it',
          params: { snr: 5, modulation: 'qam', M: 16, rho: 0.5 },
          label: 'Calculate E₀ for 16-QAM',
          description: 'Compute the error exponent at ρ=0.5 for a 16-QAM constellation'
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/numerical-methods', label: 'Gauss-Hermite Quadrature', description: 'How EPCalculator computes the non-elementary integrals in E₀' },
            { path: 'concepts/optimization-algorithms', label: 'Optimization Algorithms', description: 'How EPCalculator finds optimal ρ using gradient descent and interpolation' },
            { path: 'concepts/awgn-channel', label: 'AWGN Channel Model', description: 'The channel model underlying these calculations' }
          ]
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/single-point', label: 'Computing Single Point E₀', description: 'Step-by-step guide to calculating error exponents for specific parameters' },
            { path: 'tutorials/line-plots', label: 'Visualizing E₀ Curves', description: 'Plot error exponents across SNR ranges to compare modulations' }
          ]
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
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/getting-started', label: 'Selecting Modulation in the App', description: 'How to choose M and modulation type in the interface' },
            { path: 'tutorials/custom-constellation', label: 'Creating Custom Constellations', description: 'Design your own modulation schemes beyond PAM/PSK/QAM' }
          ]
        }
      ]
    },

    'mutual-information': {
      title: 'Mutual Information & Cutoff Rate',
      subtitle: 'Key quantities derived from the error exponent',
      sections: [
        {
          type: 'paragraph',
          text: 'Two important quantities can be extracted from the error exponent function: the mutual information (channel capacity) and the cutoff rate. These emerge naturally from the structure of $E_0(\\rho)$ at its boundary values.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // MUTUAL INFORMATION
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Mutual Information I(X;Y)',
          id: 'mutual-info'
        },
        {
          type: 'paragraph',
          text: 'The mutual information $I(X;Y)$ measures how much information (in bits or nats) can be reliably transmitted per channel use. It represents the channel capacity for a given input distribution.'
        },
        {
          type: 'heading',
          text: 'Connection to E₀',
          id: 'e0-connection'
        },
        {
          type: 'paragraph',
          text: 'The mutual information is intimately connected to Gallager\'s $E_0$ function. As $\\rho \\to 0$, we have:'
        },
        {
          type: 'formula',
          latex: 'I(X;Y) = \\left. \\frac{\\partial E_0(\\rho)}{\\partial \\rho} \\right|_{\\rho=0}',
          label: 'Mutual Information as Derivative'
        },
        {
          type: 'paragraph',
          text: 'Furthermore, $E_0(0) = 0$ always, so the mutual information equals the slope of $E_0(\\rho)$ at the origin. This is why setting $\\rho = 0$ in EPCalculator gives you the mutual information.'
        },
        {
          type: 'paragraph',
          text: 'The explicit formula for mutual information over an AWGN channel is:'
        },
        {
          type: 'formula',
          latex: 'I(X;Y) = -\\sum_{x \\in \\mathcal{X}} Q(x) \\int_{y} W(y|x) \\log_2 \\frac{W(y|x)}{\\sum_{\\bar{x}} Q(\\bar{x}) W(y|\\bar{x})} \\, dy',
          label: 'Mutual Information Formula'
        },
        // ─────────────────────────────────────────────────────────────────────
        // CUTOFF RATE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Cutoff Rate R₀',
          id: 'cutoff-rate'
        },
        {
          type: 'paragraph',
          text: 'The cutoff rate is defined as the value of $E_0(\\rho)$ at $\\rho = 1$:'
        },
        {
          type: 'formula',
          latex: 'R_0 = E_0(1)',
          label: 'Cutoff Rate'
        },
        {
          type: 'paragraph',
          text: 'Historically, the cutoff rate was crucial because sequential decoding algorithms become computationally feasible only when the code rate is below $R_0$. It represents a practical threshold below capacity.'
        },
        {
          type: 'heading',
          text: 'Relationship Between Capacity and Cutoff Rate',
          id: 'capacity-vs-cutoff'
        },
        {
          type: 'paragraph',
          text: 'For any channel, we always have:'
        },
        {
          type: 'formula',
          latex: 'R_0 \\leq I(X;Y) \\leq C',
          label: 'Ordering of Rates'
        },
        {
          type: 'paragraph',
          text: 'where $C$ is the channel capacity (maximized mutual information over all input distributions). The gap between $R_0$ and $I(X;Y)$ indicates how much "harder" the channel is for practical decoding.'
        },
        {
          type: 'note',
          text: 'While modern coding schemes like LDPC and Turbo codes can approach capacity (mutual information), the cutoff rate remains useful for understanding decoder complexity.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // SECOND DERIVATIVE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'The Second Derivative: Channel Dispersion',
          id: 'dispersion'
        },
        {
          type: 'paragraph',
          text: 'The second derivative of $E_0$ at $\\rho = 0$ relates to the channel dispersion $V$, which controls the finite-length performance:'
        },
        {
          type: 'formula',
          latex: 'V = -\\frac{\\partial^2 E_0}{\\partial \\rho^2}\\bigg|_{\\rho=0}',
          label: 'Channel Dispersion'
        },
        {
          type: 'paragraph',
          text: 'The dispersion determines how quickly the achievable rate approaches capacity as block length increases. It also plays a key role in determining the optimal learning rate for gradient descent optimization (see Optimization Algorithms).'
        },
        {
          type: 'try-it',
          params: { snr: 10, modulation: 'psk', M: 8, rho: 0 },
          label: 'Calculate Mutual Information',
          description: 'Compute I(X;Y) for 8-PSK at SNR=10'
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/error-exponent', label: 'The E₀ Function', description: 'Full derivation of Gallager\'s error exponent' },
            { path: 'concepts/optimization-algorithms', label: 'Learning Rate from E₀\'\'(0)', description: 'How the second derivative sets the optimization step size' }
          ]
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/single-point', label: 'Computing Capacity (ρ=0)', description: 'Set ρ=0 in Single Point mode to get mutual information' },
            { path: 'tutorials/single-point', label: 'Computing Cutoff Rate (ρ=1)', description: 'Set ρ=1 to obtain the cutoff rate R₀' }
          ]
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
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/custom-constellation', label: 'Custom Constellation Editor', description: 'Set individual point probabilities to implement shaping strategies' }
          ]
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
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/line-plots', label: 'Creating Line Plots', description: 'Configure axes, scales, and ranges for your visualizations' }
          ]
        }
      ]
    },

    'numerical-methods': {
      title: 'Numerical Methods: Gauss-Hermite Quadrature',
      subtitle: 'How EPCalculator evaluates non-elementary integrals',
      sections: [
        {
          type: 'paragraph',
          text: 'The error exponent formula involves integrals over Gaussian-weighted functions that cannot be solved analytically. EPCalculator uses Gauss-Hermite quadrature—a sophisticated numerical integration technique—to evaluate these integrals accurately and efficiently.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // NON-ELEMENTARY INTEGRALS
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Non-Elementary Integrals',
          id: 'non-elementary'
        },
        {
          type: 'paragraph',
          text: 'A non-elementary integral is one that cannot be expressed in terms of elementary functions (polynomials, exponentials, logarithms, trigonometric functions). The classic example is the Gaussian integral:'
        },
        {
          type: 'formula',
          latex: '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}',
          label: 'Gaussian Integral'
        },
        {
          type: 'paragraph',
          text: 'While this integral has a known value, its antiderivative cannot be written in closed form. The error function $\\text{erf}(x)$ is defined in terms of this integral:'
        },
        {
          type: 'formula',
          latex: '\\text{erf}(x) = \\frac{2}{\\sqrt{\\pi}} \\int_0^x e^{-t^2} dt',
          label: 'Error Function'
        },
        {
          type: 'paragraph',
          text: 'In the error exponent calculation, we encounter more complex integrals of the form $\\int e^{-|z|^2} f(z) \\, dz$ where $f(z)$ involves the constellation geometry and channel parameters.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // ONE-DIMENSIONAL QUADRATURE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'One-Dimensional Gauss-Hermite Quadrature',
          id: 'quadrature-1d'
        },
        {
          type: 'paragraph',
          text: 'Gauss-Hermite quadrature approximates integrals with Gaussian weighting kernels as a weighted sum of function evaluations at specific nodes:'
        },
        {
          type: 'formula',
          latex: '\\int_{\\mathbb{R}} \\psi(z) f(z) \\, dz \\approx \\sum_{z \\in \\mathcal{I}} w_z \\cdot f(z)',
          label: 'Gauss-Hermite Quadrature'
        },
        {
          type: 'paragraph',
          text: 'where:'
        },
        {
          type: 'definitions',
          items: [
            { term: '$\\psi(z)$', definition: 'The weighting kernel (Gaussian function $e^{-z^2}$)' },
            { term: '$\\mathcal{I}$', definition: 'The set of quadrature nodes: roots of the Hermite polynomial $H_n(z)$' },
            { term: '$w_z$', definition: 'Quadrature weights associated with each node' }
          ]
        },
        {
          type: 'heading',
          text: 'Hermite Polynomials',
          id: 'hermite'
        },
        {
          type: 'paragraph',
          text: 'The nodes $z$ are the roots of the physicist\'s Hermite polynomial $H_n(z)$. The corresponding weights are computed as:'
        },
        {
          type: 'formula',
          latex: 'w_z = \\frac{2^{n-1} \\cdot n! \\cdot \\sqrt{\\pi}}{n^2 \\cdot [H_{n-1}(z)]^2}',
          label: 'Hermite Quadrature Weights'
        },
        {
          type: 'paragraph',
          text: 'The beauty of Gaussian quadrature is that with $n$ nodes, it exactly integrates polynomials of degree up to $2n-1$. For smooth functions, it converges very rapidly.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // TWO-DIMENSIONAL QUADRATURE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Two-Dimensional (Complex) Quadrature',
          id: 'quadrature-2d'
        },
        {
          type: 'paragraph',
          text: 'Since our channel is complex (with in-phase and quadrature components), we need 2D quadrature. For complex noise $z = x + jy$ with independent real and imaginary parts, we can write:'
        },
        {
          type: 'formula',
          latex: '\\int_{\\mathbb{C}} \\psi(z) f(z) \\, dz \\approx \\sum_{z \\in \\mathcal{D}} W(z) \\cdot f(z)',
          label: '2D Gauss-Hermite Quadrature'
        },
        {
          type: 'paragraph',
          text: 'where the 2D nodes form a grid:'
        },
        {
          type: 'formula',
          latex: '\\mathcal{D} = \\{z \\in \\mathbb{C} \\mid H_n(\\text{Re}(z)) = 0 \\text{ and } H_n(\\text{Im}(z)) = 0\\}',
          label: '2D Node Grid'
        },
        {
          type: 'paragraph',
          text: 'and the 2D weights are products of 1D weights:'
        },
        {
          type: 'formula',
          latex: 'W(z) = w_{\\text{Re}(z)} \\cdot w_{\\text{Im}(z)}',
          label: 'Product Weights'
        },
        {
          type: 'note',
          text: 'This product structure only works because AWGN noise has independent real and imaginary components (zero correlation). The kernel $e^{-|z|^2} = e^{-\\text{Re}(z)^2} \\cdot e^{-\\text{Im}(z)^2}$ is separable.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // WEIGHT THRESHOLDING
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Weight Thresholding Optimization',
          id: 'thresholding'
        },
        {
          type: 'paragraph',
          text: 'The 2D grid has $n^2$ nodes, but many corner points have negligibly small weights. EPCalculator uses a thresholding technique to skip these:'
        },
        {
          type: 'formula',
          latex: '\\mathcal{F} = \\{z \\in \\mathcal{D} \\mid W(z) \\leq \\theta\\}',
          label: 'Thresholded Node Set'
        },
        {
          type: 'paragraph',
          text: 'where the threshold is set as:'
        },
        {
          type: 'formula',
          latex: '\\theta = \\max(\\mathcal{W}) - \\min(\\mathcal{W})',
          label: 'Weight Threshold'
        },
        {
          type: 'paragraph',
          text: 'This effectively keeps nodes within an "important" region (roughly a circle inscribed in the square grid), dramatically reducing computation while maintaining accuracy.'
        },
        {
          type: 'heading',
          text: 'Computational Efficiency',
          id: 'efficiency'
        },
        {
          type: 'list',
          items: [
            '**Without thresholding**: $n^2$ nodes (e.g., 2,500 for $n=50$)',
            '**With thresholding**: Approximately $\\frac{\\pi n^2}{4}$ nodes (e.g., ~1,963 for $n=50$)',
            '**Savings**: ~21% fewer evaluations with negligible accuracy loss'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // CHOOSING N
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Choosing the Number of Quadrature Points',
          id: 'choosing-n'
        },
        {
          type: 'paragraph',
          text: 'The parameter $n$ controls accuracy vs. computation time:'
        },
        {
          type: 'list',
          items: [
            '$n = 20$: Fast computation, suitable for exploration',
            '$n = 50$: Good balance (EPCalculator default)',
            '$n = 100+$: High precision for publication-quality results'
          ]
        },
        {
          type: 'paragraph',
          text: 'EPCalculator precomputes the weights and nodes for multiple values of $n$, allowing dynamic adjustment as computation progresses.'
        },
        {
          type: 'note',
          text: 'In EPCalculator, the "n" parameter in advanced settings controls the number of quadrature points. Higher values give more accurate results but slower computation.',
          variant: 'info'
        },
        {
          type: 'try-it',
          params: { snr: 10, modulation: 'psk', M: 8, n: 50 },
          label: 'Try with n=50 quadrature points',
          description: 'Compute E₀ for 8-PSK with default quadrature precision'
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/error-exponent', label: 'Error Exponent Formula', description: 'Where these integrals appear in the E₀ calculation' },
            { path: 'concepts/optimization-algorithms', label: 'Optimization Algorithms', description: 'How quadrature integrates with gradient descent optimization' }
          ]
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/single-point', label: 'Single Point Computation', description: 'Set quadrature precision in the advanced settings' }
          ]
        }
      ]
    },

    'optimization-algorithms': {
      title: 'Optimization Algorithms',
      subtitle: 'Gradient descent, Nesterov acceleration, and interpolation-based initial guesses',
      sections: [
        {
          type: 'paragraph',
          text: 'Finding the error exponent $E(R)$ requires optimizing over the parameter $\\rho$. EPCalculator implements sophisticated optimization algorithms including gradient descent, Nesterov\'s accelerated gradient, and a novel cubic Hermite interpolation for initial guess selection.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // THE OPTIMIZATION PROBLEM
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'The Optimization Problem',
          id: 'problem'
        },
        {
          type: 'paragraph',
          text: 'To find $E(R)$, we need to solve:'
        },
        {
          type: 'formula',
          latex: 'E(R) = \\max_{0 \\leq \\rho \\leq 1} \\left\\{ E_0(\\rho) - \\rho R \\right\\}',
          label: 'Optimization Problem'
        },
        {
          type: 'paragraph',
          text: 'We define $G(\\rho) = E_0(\\rho) - \\rho R$ and seek its maximum. Since $E_0(\\rho)$ is concave, $G(\\rho)$ is also concave, making gradient-based methods effective.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // GRADIENT DESCENT
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Gradient Descent',
          id: 'gradient-descent'
        },
        {
          type: 'paragraph',
          text: 'The basic gradient descent algorithm iteratively updates the parameter in the direction of steepest ascent:'
        },
        {
          type: 'formula',
          latex: '\\rho_{k+1} = \\rho_k + \\beta \\cdot \\nabla G(\\rho_k)',
          label: 'Gradient Descent Update'
        },
        {
          type: 'definitions',
          items: [
            { term: '$\\rho_k$', definition: 'Current parameter estimate at iteration $k$' },
            { term: '$\\beta$', definition: 'Learning rate (step size)' },
            { term: '$\\nabla G(\\rho_k)$', definition: 'Gradient of the objective at current point' }
          ]
        },
        {
          type: 'paragraph',
          text: 'Gradient descent has **linear convergence**, requiring $\\mathcal{O}(1/\\epsilon)$ iterations to achieve precision $\\epsilon$.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // NESTEROV'S ACCELERATED GRADIENT
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Nesterov\'s Accelerated Gradient (NAG)',
          id: 'nag'
        },
        {
          type: 'paragraph',
          text: 'NAG improves upon basic gradient descent by incorporating momentum. It achieves **optimal oracle complexity** for first-order methods on smooth convex problems:'
        },
        {
          type: 'formula',
          latex: '\\begin{aligned} y_{t+1} &= \\rho_t + \\beta \\cdot \\nabla G(\\rho_t) \\\\ \\rho_{t+1} &= \\left(1 + \\frac{\\sqrt{\\kappa}-1}{\\sqrt{\\kappa}+1}\\right) y_{t+1} - \\frac{\\sqrt{\\kappa}-1}{\\sqrt{\\kappa}+1} \\cdot y_t \\end{aligned}',
          label: 'NAG Update Rule'
        },
        {
          type: 'definitions',
          items: [
            { term: '$y_t$', definition: 'Auxiliary sequence (momentum term)' },
            { term: '$\\kappa$', definition: 'Condition number of the objective function' },
            { term: '$\\beta$', definition: 'Learning rate' }
          ]
        },
        {
          type: 'paragraph',
          text: 'NAG requires only $\\mathcal{O}(1/\\sqrt{\\epsilon})$ iterations—a quadratic improvement over basic gradient descent.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // LEARNING RATE SELECTION
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Learning Rate Selection',
          id: 'learning-rate'
        },
        {
          type: 'paragraph',
          text: 'Choosing the right learning rate $\\beta$ is crucial. For an $L$-smooth function (where the gradient is Lipschitz with constant $L$), theory guarantees convergence when $\\beta \\leq 2/L$.'
        },
        {
          type: 'paragraph',
          text: 'For the error exponent $E_0(\\rho)$, the smoothness constant is the maximum curvature, which occurs at $\\rho = 0$:'
        },
        {
          type: 'formula',
          latex: 'L = \\left| \\frac{\\partial^2 E_0}{\\partial \\rho^2} \\bigg|_{\\rho=0} \\right|',
          label: 'Smoothness Constant'
        },
        {
          type: 'paragraph',
          text: 'Therefore, EPCalculator sets the learning rate as:'
        },
        {
          type: 'formula',
          latex: '\\beta = \\frac{1}{\\left| E_0\'\'(0) \\right|}',
          label: 'Optimal Learning Rate'
        },
        {
          type: 'note',
          text: 'This adaptive learning rate ensures stable convergence regardless of SNR and modulation—the algorithm automatically adjusts to the curvature of $E_0$.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // CONDITION NUMBER
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Condition Number for NAG',
          id: 'condition-number'
        },
        {
          type: 'paragraph',
          text: 'The momentum parameter $\\kappa$ in NAG is the condition number—the ratio of maximum to minimum curvature:'
        },
        {
          type: 'formula',
          latex: '\\kappa = \\frac{|E_0\'\'(0)|}{|E_0\'\'(1)|}',
          label: 'Condition Number'
        },
        {
          type: 'paragraph',
          text: 'This ratio reflects how "stretched" the objective function is. A higher $\\kappa$ means the function is harder to optimize, but NAG handles this gracefully through its momentum term.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // CUBIC HERMITE INTERPOLATION
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Cubic Hermite Interpolation for Initial Guess',
          id: 'interpolation'
        },
        {
          type: 'paragraph',
          text: 'EPCalculator uses a novel technique to accelerate convergence: cubic Hermite interpolation provides an excellent initial guess for $\\rho^*$.'
        },
        {
          type: 'paragraph',
          text: 'Given the values and derivatives of $G(\\rho) = E_0(\\rho) - \\rho R$ at the endpoints $\\rho = 0$ and $\\rho = 1$, we construct a cubic polynomial approximation:'
        },
        {
          type: 'formula',
          latex: '\\tilde{G}(\\rho) = a + b\\rho + c\\rho^2 + d\\rho^3',
          label: 'Cubic Approximation'
        },
        {
          type: 'paragraph',
          text: 'The coefficients are determined by matching values and derivatives at both endpoints:'
        },
        {
          type: 'formula',
          latex: '\\begin{aligned} a &= E_0(0) \\\\ b &= E_0\'(0) - R \\\\ c &= 3(E_0(1) - R - E_0(0)) - 2(E_0\'(0) - R) - (E_0\'(1) - R) \\\\ d &= -2(E_0(1) - R - E_0(0)) + (E_0\'(0) - R) + (E_0\'(1) - R) \\end{aligned}',
          label: 'Hermite Coefficients'
        },
        {
          type: 'heading',
          text: 'Finding the Maximum of the Cubic',
          id: 'cubic-maximum'
        },
        {
          type: 'paragraph',
          text: 'To find the maximum of the cubic, we solve $\\tilde{G}\'(\\rho) = 0$, which is a quadratic equation:'
        },
        {
          type: 'formula',
          latex: '\\tilde{G}\'(\\rho) = b + 2c\\rho + 3d\\rho^2 = 0',
          label: 'Derivative of Cubic'
        },
        {
          type: 'paragraph',
          text: 'The algorithm evaluates $\\tilde{G}$ at $\\rho = 0$, $\\rho = 1$, and any roots of the derivative that lie in $[0, 1]$, returning the $\\rho$ that maximizes $\\tilde{G}$.'
        },
        {
          type: 'note',
          text: 'This interpolation often gives an initial guess within 0.1 of the optimal $\\rho^*$, dramatically reducing the number of gradient descent iterations needed.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // WHY NOT NEWTON'S METHOD?
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Why Not Newton\'s Method?',
          id: 'newton'
        },
        {
          type: 'paragraph',
          text: 'Newton\'s method has quadratic convergence (much faster than gradient descent), but requires computing and inverting the Hessian matrix. For the constant composition case with $|\\mathcal{X}|$ constellation points, this means:'
        },
        {
          type: 'list',
          items: [
            '**Hessian computation**: $\\mathcal{O}(|\\mathcal{X}|^2)$ second derivatives',
            '**Matrix inversion**: $\\mathcal{O}(|\\mathcal{X}|^3)$ operations',
            '**Per-iteration cost**: Too expensive for large constellations'
          ]
        },
        {
          type: 'paragraph',
          text: 'In contrast, gradient descent has only $\\mathcal{O}(|\\mathcal{X}|)$ cost per iteration, making it preferable for all but the smallest constellations.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // COMPARISON TABLE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Algorithm Comparison',
          id: 'comparison'
        },
        {
          type: 'code',
          language: 'text',
          code: 'Method              | Convergence     | Per-Iteration | Best For\n--------------------|-----------------|---------------|------------------\nGradient Descent    | O(1/ε)          | O(n)          | Simple cases\nNesterov (NAG)      | O(1/√ε)         | O(n)          | Most cases ✓\nNewton\'s Method     | O(log log 1/ε)  | O(n² + n³)    | Very small n only'
        },
        {
          type: 'try-it',
          params: { snr: 10, modulation: 'qam', M: 16, rho: 0.5 },
          label: 'See optimization in action',
          description: 'Compute E₀ and observe the convergence behavior'
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/error-exponent', label: 'Error Exponent Formula', description: 'The function being optimized' },
            { path: 'concepts/numerical-methods', label: 'Gauss-Hermite Quadrature', description: 'How derivatives are computed numerically' }
          ]
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/single-point', label: 'Single Point Computation', description: 'Run optimization for specific parameters' },
            { path: 'tutorials/line-plots', label: 'Line Plots', description: 'See how optimization runs across SNR ranges' }
          ]
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
          text: 'EPCalculator computes the [[concepts/error-exponent#e0-formula|error exponent]] $E_0(\\rho)$ for various [[concepts/modulation|modulation schemes]] over an [[concepts/awgn-channel#channel-model|AWGN channel]]. This quantity tells you how reliably you can communicate at a given [[concepts/awgn-channel#snr|SNR]].'
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
          type: 'screenshot',
          name: 'tab-single-point',
          caption: 'Select the "Single Point Computation" tab',
          alt: 'Single Point tab highlighted in the tab bar'
        },
        {
          type: 'numbered-list',
          items: [
            'Select "Single Point" tab at the top',
            'Set your SNR value (e.g., 10 dB)',
            'Choose a modulation scheme (e.g., QPSK: M=4, PSK)',
            'Set the [[concepts/error-exponent#rho|ρ parameter]] (0 for [[concepts/mutual-information#e0-connection|capacity]], 1 for [[concepts/mutual-information#cutoff-rate|cutoff rate]])',
            'Click "Calculate"'
          ]
        },
        {
          type: 'screenshot',
          name: 'quick-start-single-point',
          caption: 'Parameters filled in: SNR = 10 dB, QPSK (M=4, PSK), ρ = 0',
          alt: 'Single Point form showing SNR=10dB, M=4, PSK modulation, rho=0'
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
          type: 'screenshot',
          name: 'tab-plot-mode',
          caption: 'Select the "Plotting & Visualization" tab',
          alt: 'Plotting tab highlighted in the tab bar'
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
          type: 'screenshot',
          name: 'quick-start-plot-mode',
          caption: 'Plot mode controls with SNR range and modulation options',
          alt: 'Plotting tab showing SNR range inputs and modulation selection'
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
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/error-exponent', label: 'What is E₀(ρ)?', description: 'Learn about the error exponent formula and what it measures' },
            { path: 'concepts/awgn-channel', label: 'Understanding SNR', description: 'How signal-to-noise ratio affects channel performance' },
            { path: 'concepts/modulation', label: 'PAM, PSK, and QAM Explained', description: 'The math behind different modulation schemes' }
          ]
        }
      ]
    },

    'single-point': {
      title: 'Single Point Computation',
      subtitle: 'Computing error exponents for specific parameters',
      sections: [
        {
          type: 'paragraph',
          text: 'Single Point mode lets you compute the exact [[concepts/error-exponent#e0-formula|error exponent]] for a specific combination of [[concepts/awgn-channel#snr|SNR]], [[concepts/modulation|modulation]], and [[concepts/error-exponent#rho|ρ parameter]].'
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
            { term: 'Modulation', definition: '[[concepts/modulation#pam|PAM]], [[concepts/modulation#psk|PSK]], or [[concepts/modulation#qam|QAM]] constellation family' },
            { term: 'Order (M)', definition: 'Number of constellation points (must be power of 2 for PSK/QAM)' },
            { term: 'ρ (rho)', definition: 'Error exponent parameter, between 0 and 1' }
          ]
        },
        {
          type: 'heading',
          text: 'Setting SNR Units'
        },
        {
          type: 'paragraph',
          text: 'You can enter SNR values in either linear scale or decibels (dB). Use the dropdown next to the SNR input to switch between units:'
        },
        {
          type: 'screenshot',
          name: 'snr-input-db',
          caption: 'SNR input configured for decibel (dB) values',
          alt: 'SNR input field showing dB unit selector'
        },
        {
          type: 'note',
          text: 'Remember: 3 dB doubles the linear SNR, and 10 dB multiplies it by 10.',
          variant: 'info'
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
          text: 'For ρ=0, the result is the [[concepts/mutual-information#mutual-info|mutual information]]. For ρ=1, it\'s the [[concepts/mutual-information#cutoff-rate|cutoff rate]].',
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
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/error-exponent', label: 'The E₀(ρ) Formula', description: 'Deep dive into Gallager\'s error exponent and its parameters' },
            { path: 'concepts/mutual-information', label: 'Mutual Information & Cutoff Rate', description: 'What ρ=0 and ρ=1 really mean' },
            { path: 'concepts/awgn-channel', label: 'SNR in the AWGN Channel', description: 'How noise affects your computation results' }
          ]
        }
      ]
    },

    'line-plots': {
      title: 'Line Plots',
      subtitle: 'Visualizing error exponents as curves across parameter ranges',
      sections: [
        {
          type: 'paragraph',
          text: 'Line plots are the primary visualization mode in EPCalculator. They show how the [[concepts/error-exponent#e0-formula|error exponent]] $E_0(\\rho)$ varies as a function of SNR, making it easy to compare different modulation schemes and understand performance trends.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // WHAT LINE PLOTS SHOW
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'What Line Plots Show',
          id: 'what-line-plots-show'
        },
        {
          type: 'paragraph',
          text: 'Each line represents one modulation configuration. The X-axis shows SNR (in dB or linear), and the Y-axis shows the computed error exponent value. Multiple lines let you compare:'
        },
        {
          type: 'list',
          items: [
            'Different modulation schemes ([[concepts/modulation#psk|PSK]] vs [[concepts/modulation#qam|QAM]] vs [[concepts/modulation#pam|PAM]])',
            'Different modulation orders (4-[[concepts/modulation#qam|QAM]] vs 16-QAM vs 64-QAM)',
            'Different ρ values for the same modulation',
            'Custom constellations vs standard ones'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // SETTING UP
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Setting Up a Line Plot',
          id: 'setup'
        },
        {
          type: 'numbered-list',
          items: [
            'Switch to the "Plotting & Visualization" tab',
            'Ensure "Line Plot" is selected as the visualization mode',
            'Set the SNR range (start, end, and number of points)',
            'Choose one or more modulation schemes',
            'Set the ρ parameter',
            'Click "Compute" to generate the plot'
          ]
        },
        {
          type: 'screenshot',
          name: 'plotting-controls',
          caption: 'The plotting controls panel configured for line plot mode',
          alt: 'Plot configuration showing axis scales, ranges, and line plot option selected'
        },
        {
          type: 'paragraph',
          text: 'After clicking "Generate Plot", the computation runs and displays your results:'
        },
        {
          type: 'screenshot',
          name: 'line-plot-generated',
          caption: 'A generated line plot showing the error exponent E₀(ρ) curve for QPSK modulation across SNR values',
          alt: 'Line plot with E₀ curve for 4-PSK modulation with spotlight highlight on the plot card'
        },
        // ─────────────────────────────────────────────────────────────────────
        // MERGING PLOTS (moved before axis config)
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Creating Multiline Plots',
          id: 'merging'
        },
        {
          type: 'paragraph',
          text: 'One of the most powerful features is comparing multiple modulation schemes on the same plot. Here\'s how to create a multiline plot step by step:'
        },
        {
          type: 'heading',
          text: 'Step 1: Generate Your First Plot',
          id: 'merge-step1'
        },
        {
          type: 'paragraph',
          text: 'Start by configuring and generating your first curve. For this example, we\'ll use QPSK modulation (M=4, PSK). Set your parameters and click "Generate Plot":'
        },
        {
          type: 'screenshot',
          name: 'line-plot-step1-complete',
          caption: 'The interface after generating the first plot: QPSK error exponent curve with the plotting controls on the left',
          alt: 'Full EPCalculator interface showing a generated QPSK line plot with controls visible'
        },
        {
          type: 'heading',
          text: 'Step 2: Change Parameters for Second Curve',
          id: 'merge-step2'
        },
        {
          type: 'paragraph',
          text: 'With your first plot visible, change one or more parameters. For example, switch from QPSK (M=4) to 8-PSK (M=8) to compare these modulation schemes:'
        },
        {
          type: 'screenshot',
          name: 'line-plot-step2-params',
          caption: 'After generating a QPSK plot, change the modulation order to M=8 (8-PSK) for comparison',
          alt: 'Plotting controls with M=8 selected, ready to generate a second curve'
        },
        {
          type: 'heading',
          text: 'Step 3: The Merge Prompt',
          id: 'merge-step3'
        },
        {
          type: 'paragraph',
          text: 'When you click "Generate Plot" again with compatible parameters, EPCalculator detects that you already have a plot with the same axes and displays a merge prompt:'
        },
        {
          type: 'screenshot',
          name: 'line-plot-merge-modal',
          caption: 'The merge confirmation modal offers three choices: Cancel, New Figure, or Merge',
          alt: 'Modal dialog asking whether to merge the new data with the existing plot or create a separate figure'
        },
        {
          type: 'list',
          items: [
            '**Cancel**: Abort and don\'t generate the new curve',
            '**New Figure**: Create the second curve as a separate, independent plot',
            '**Merge**: Combine both curves into a single multiline plot (recommended for comparison)'
          ]
        },
        {
          type: 'heading',
          text: 'Step 4: The Merged Multiline Plot',
          id: 'merge-step4'
        },
        {
          type: 'paragraph',
          text: 'After clicking "Merge", both curves appear on the same plot with a legend showing each configuration:'
        },
        {
          type: 'screenshot',
          name: 'line-plot-multiline',
          caption: 'The merged plot showing both QPSK and 8-PSK error exponent curves for direct comparison',
          alt: 'Line plot with two curves representing different modulation schemes, with legend'
        },
        {
          type: 'note',
          text: 'You can keep adding more curves! Repeat steps 2-4 to compare multiple modulation schemes on the same plot.',
          variant: 'tip'
        },
        {
          type: 'heading',
          text: 'Merge Compatibility',
          id: 'merge-compatibility'
        },
        {
          type: 'paragraph',
          text: 'Line plots can be merged when they meet these two conditions:'
        },
        {
          type: 'list',
          items: [
            '**Visualization mode**: Both must be line plots',
            '**Same axes**: The X-axis and Y-axis parameters must match'
          ]
        },
        {
          type: 'note',
          text: 'If the Merge button is disabled, hover over it to see which compatibility requirement is not met.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // CONFIGURING AXES
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Configuring Axes and Scales',
          id: 'configuring-axes'
        },
        {
          type: 'paragraph',
          text: 'The app automatically selects the optimal scale (linear or logarithmic) for each axis based on your data. You can override these defaults using the control buttons above the plot to reveal different insights about modulation performance.'
        },
        {
          type: 'screenshot',
          name: 'line-plot-axis-linear',
          caption: 'The axis control buttons appear above the plot. Use them to toggle scales or transpose axes.',
          alt: 'Multiline plot showing axis control buttons highlighted in the plot header'
        },
        {
          type: 'heading',
          text: 'Scale Options',
          id: 'scale-options'
        },
        {
          type: 'definitions',
          items: [
            { term: 'SNR Units', definition: 'Matches what you entered in parameters (dB or linear). You can toggle between them after plotting.' },
            { term: 'Y-Axis Scale', definition: 'Auto-detected as linear or log based on your data range. Toggle manually if needed.' },
            { term: 'Transpose', definition: 'Swap X and Y axes to answer "What SNR do I need for this error rate?" instead of "What error rate at this SNR?"' }
          ]
        },
        {
          type: 'heading',
          text: 'Logarithmic Y-Axis',
          id: 'log-y-axis'
        },
        {
          type: 'paragraph',
          text: 'The app auto-selects log scale when your data spans multiple orders of magnitude. You can manually toggle this if you prefer a different view:'
        },
        {
          type: 'screenshot',
          name: 'line-plot-axis-log-y',
          caption: 'Logarithmic Y scale emphasizes differences between curves at low error exponent values',
          alt: 'Multiline plot with logarithmic Y axis scale selected'
        },
        {
          type: 'heading',
          text: 'SNR Unit Toggle',
          id: 'snr-units'
        },
        {
          type: 'paragraph',
          text: 'The X-axis SNR units initially match your input parameters. If you entered SNR in dB, the plot shows dB; if you entered linear values, it shows linear. You can toggle between them:'
        },
        {
          type: 'screenshot',
          name: 'line-plot-axis-log-x',
          caption: 'Toggling SNR units switches between dB and linear representation on the X-axis',
          alt: 'Multiline plot with SNR units toggled'
        },
        {
          type: 'heading',
          text: 'Transposed View',
          id: 'transpose-view'
        },
        {
          type: 'paragraph',
          text: 'Transposing the axes swaps X and Y, providing a different perspective on the data. This is useful for asking "At what SNR do I achieve a given error exponent?":'
        },
        {
          type: 'screenshot',
          name: 'line-plot-axis-transpose',
          caption: 'Transposed view with E₀ on X-axis and SNR on Y-axis',
          alt: 'Multiline plot with transposed axes showing E₀ on X and SNR on Y'
        },
        // ─────────────────────────────────────────────────────────────────────
        // PLOT INTERACTIONS
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Plot Interactions',
          id: 'interactions'
        },
        {
          type: 'paragraph',
          text: 'Line plots support interactive features that help you explore and compare your data.'
        },
        {
          type: 'heading',
          text: 'Hover on Legend',
          id: 'interaction-legend'
        },
        {
          type: 'paragraph',
          text: 'Hovering over a legend entry highlights the corresponding curve in the plot, making it easy to identify which line belongs to which modulation scheme:'
        },
        {
          type: 'screenshot',
          name: 'line-plot-hover-legend',
          caption: 'Hovering over a legend entry highlights that curve while dimming the others',
          alt: 'Multiline plot with one curve highlighted after hovering on its legend entry'
        },
        {
          type: 'heading',
          text: 'Hover on Plot',
          id: 'interaction-plot'
        },
        {
          type: 'paragraph',
          text: 'Hovering directly on the plot area displays a tooltip with the exact coordinates at that point:'
        },
        {
          type: 'screenshot',
          name: 'line-plot-hover-point',
          caption: 'Hovering on the plot shows a tooltip with the exact SNR and error exponent values',
          alt: 'Multiline plot with tooltip showing coordinates at the cursor position'
        },
        // ─────────────────────────────────────────────────────────────────────
        // EXPORTING
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Exporting Line Plots',
          id: 'exporting'
        },
        {
          type: 'paragraph',
          text: 'Once you\'ve generated a plot, you can export both the visualization and the underlying data. Look for the download icon in the plot header:'
        },
        {
          type: 'screenshot',
          name: 'line-plot-export-button',
          caption: 'The export button (download icon) in the multiline plot header allows exporting all curves together',
          alt: 'Multiline plot card with export button highlighted'
        },
        {
          type: 'paragraph',
          text: 'Click the export button to reveal the available formats:'
        },
        {
          type: 'screenshot',
          name: 'line-plot-export-menu',
          caption: 'Export your multiline comparison as images (SVG, PNG) or data files (CSV, JSON)',
          alt: 'Export menu showing four format options with icons and descriptions'
        },
        {
          type: 'heading',
          text: 'Export Formats Explained',
          id: 'export-formats'
        },
        {
          type: 'definitions',
          items: [
            { term: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> SVG', definition: 'Vector graphics format. Scales perfectly for any size, ideal for publications and LaTeX documents. Editable in vector graphics software.' },
            { term: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> PNG', definition: 'Raster image at high resolution (2x). Best for presentations, web pages, and quick sharing.' },
            { term: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> CSV', definition: 'Comma-separated values with SNR and E₀ columns. Import into Excel, MATLAB, Python, or any data analysis tool.' },
            { term: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> JSON', definition: 'Complete plot data including all parameters, series data, and metadata. Perfect for reproducibility or reimporting into EPCalculator.' }
          ]
        },
        {
          type: 'try-it',
          params: { mode: 'plot', snrRange: [0, 20], modulations: ['psk-4', 'qam-16'] },
          label: 'Compare QPSK vs 16-QAM',
          description: 'See how these common modulations compare across SNR'
        },
        // ─────────────────────────────────────────────────────────────────────
        // API REFERENCE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'For Developers: API Access',
          id: 'api-access'
        },
        {
          type: 'paragraph',
          text: 'The line plot data is generated by the **Range Computation API**. If you need to automate computations, integrate with external tools, or build custom visualizations, you can call this endpoint directly:'
        },
        {
          type: 'api-link',
          endpoint: '/api/v1/compute/range/standard',
          method: 'POST',
          description: 'Compute error probability or error exponent over an SNR range for standard modulation schemes',
          docsPath: '/docs#/computation/computeRangeStandard'
        },
        {
          type: 'paragraph',
          text: 'The API returns the same x/y data arrays that power the plots in the UI. See the [[api-reference|API Reference]] for full documentation on request parameters and response format.'
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/plot-controls', label: 'Linear vs Log Scales', description: 'When to use different axis scales for your data' },
            { path: 'concepts/error-exponent', label: 'Understanding E₀ Curves', description: 'What the shape of your plot tells you' }
          ]
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/contour-plots', label: 'Contour Plots', description: 'Visualize two parameters simultaneously' },
            { path: 'tutorials/3d-surfaces', label: '3D Surface Plots', description: 'See the full parameter landscape' },
            { path: 'tutorials/table-mode', label: 'Table Mode', description: 'View raw numerical data' }
          ]
        }
      ]
    },

    'contour-plots': {
      title: 'Contour Plots',
      subtitle: 'Visualizing error exponents across two parameter dimensions',
      sections: [
        {
          type: 'paragraph',
          text: 'Contour plots show how the error exponent varies across two parameters simultaneously, using color to represent the third dimension. This visualization is powerful for understanding performance trade-offs across a parameter space.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // WHAT CONTOUR PLOTS SHOW
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'What Contour Plots Show',
          id: 'what-contour-plots-show'
        },
        {
          type: 'paragraph',
          text: 'A contour plot displays three dimensions of data on a 2D surface:'
        },
        {
          type: 'list',
          items: [
            '**X-axis**: First parameter (e.g., SNR)',
            '**Y-axis**: Second parameter (e.g., code rate R or ρ)',
            '**Color**: The error exponent value, with contour lines connecting equal values'
          ]
        },
        {
          type: 'paragraph',
          text: 'Contour lines (like elevation lines on a topographic map) connect points with equal error exponent values, making it easy to see "iso-performance" regions.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // SETTING UP
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Setting Up a Contour Plot',
          id: 'setup'
        },
        {
          type: 'numbered-list',
          items: [
            'Switch to the "Plotting & Visualization" tab',
            'Select "Contour Plot" as the visualization mode',
            'Configure the X-axis parameter range (e.g., SNR 0-20 dB)',
            'Configure the Y-axis parameter range (e.g., ρ from 0 to 1)',
            'Select your modulation scheme',
            'Click "Compute" to generate the contour plot'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // READING THE PLOT
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Reading Contour Plots',
          id: 'reading'
        },
        {
          type: 'list',
          items: [
            '**Warmer colors** (red/yellow): Higher error exponents (better performance)',
            '**Cooler colors** (blue/purple): Lower error exponents',
            '**Dense contour lines**: Rapid change in performance (steep gradient)',
            '**Sparse contour lines**: Gradual change in performance (flat region)'
          ]
        },
        {
          type: 'note',
          text: 'Hover over any point to see the exact SNR, ρ, and E₀ values at that location.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // COMPARE FEATURE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Compare Feature',
          id: 'compare'
        },
        {
          type: 'paragraph',
          text: 'The Compare feature lets you view exactly **two** contour plots side-by-side to directly compare different configurations:'
        },
        {
          type: 'numbered-list',
          items: [
            'Generate your first contour plot',
            'Change parameters (e.g., different modulation) and generate a second plot',
            'Select both plots in the results panel',
            'Click "Compare" to view them side-by-side'
          ]
        },
        {
          type: 'paragraph',
          text: 'Compare mode shows synchronized views—hovering on one plot highlights the corresponding point on the other, making direct comparison easy.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // BENCHMARK FEATURE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Benchmark Feature',
          id: 'benchmark'
        },
        {
          type: 'paragraph',
          text: 'The Benchmark feature lets you compare **two or more** configurations quantitatively:'
        },
        {
          type: 'numbered-list',
          items: [
            'Generate multiple contour plots with different configurations',
            'Select all plots you want to benchmark (minimum 2)',
            'Click "Benchmark" to see comparative statistics'
          ]
        },
        {
          type: 'paragraph',
          text: 'Benchmark provides metrics like:'
        },
        {
          type: 'list',
          items: [
            'Average error exponent across the parameter space',
            'Maximum and minimum values',
            'Regions where each configuration outperforms others',
            'SNR gain/loss at equivalent performance levels'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // MERGING
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Merge Compatibility for Contour Plots',
          id: 'merge-compatibility'
        },
        {
          type: 'paragraph',
          text: 'Contour plots can be merged when they have identical:'
        },
        {
          type: 'list',
          items: [
            '**Visualization mode**: Both must be contour plots',
            '**X-axis range and parameter**: Same SNR or ρ range',
            '**Y-axis range and parameter**: Same second parameter range',
            '**Resolution**: Same grid density'
          ]
        },
        {
          type: 'try-it',
          params: { mode: 'contour', snrRange: [0, 15], rhoRange: [0, 1], modulation: 'psk-8' },
          label: 'Create 8-PSK Contour Plot',
          description: 'Visualize E₀ across SNR and ρ for 8-PSK'
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/error-exponent', label: 'The ρ Parameter', description: 'Understanding what varying ρ means' },
            { path: 'concepts/plot-controls', label: 'Axis Scales', description: 'Choosing between linear and log scales' }
          ]
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/line-plots', label: 'Line Plots', description: 'Single-parameter visualization' },
            { path: 'tutorials/3d-surfaces', label: '3D Surface Plots', description: 'Alternative 3D visualization' }
          ]
        }
      ]
    },

    '3d-surfaces': {
      title: '3D Surface Plots',
      subtitle: 'Exploring error exponent landscapes in three dimensions',
      sections: [
        {
          type: 'paragraph',
          text: '3D surface plots provide an immersive view of how the error exponent varies across two parameters. The surface height represents the error exponent value, giving an intuitive understanding of the performance landscape.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // WHAT 3D PLOTS SHOW
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'What 3D Surface Plots Show',
          id: 'what-3d-plots-show'
        },
        {
          type: 'paragraph',
          text: 'A 3D surface plot renders the error exponent as a physical surface:'
        },
        {
          type: 'list',
          items: [
            '**X-axis**: First parameter (e.g., SNR)',
            '**Y-axis**: Second parameter (e.g., code rate R or ρ)',
            '**Z-axis (height)**: The error exponent value',
            '**Color**: Additional encoding of the Z value for clarity'
          ]
        },
        {
          type: 'paragraph',
          text: 'The surface naturally shows peaks (best performance), valleys (worst performance), and gradients (how quickly performance changes).'
        },
        // ─────────────────────────────────────────────────────────────────────
        // SETTING UP
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Setting Up a 3D Surface Plot',
          id: 'setup'
        },
        {
          type: 'numbered-list',
          items: [
            'Switch to the "Plotting & Visualization" tab',
            'Select "3D Surface" as the visualization mode',
            'Configure both X and Y parameter ranges',
            'Select your modulation scheme',
            'Click "Compute" to generate the 3D surface'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // INTERACTIONS
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: '3D Interactions',
          id: 'interactions'
        },
        {
          type: 'paragraph',
          text: '3D surface plots are fully interactive:'
        },
        {
          type: 'list',
          items: [
            '**Rotate**: Click and drag to rotate the view angle',
            '**Zoom**: Scroll to zoom in and out',
            '**Pan**: Right-click and drag to pan the view',
            '**Reset**: Double-click to reset to the default view',
            '**Hover**: See exact values at any point on the surface'
          ]
        },
        {
          type: 'note',
          text: 'Try rotating the surface to view it from different angles—sometimes a side view reveals structure that\'s hidden from above.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // COMPARE FEATURE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Compare Feature',
          id: 'compare'
        },
        {
          type: 'paragraph',
          text: 'Compare exactly **two** 3D surfaces side-by-side:'
        },
        {
          type: 'numbered-list',
          items: [
            'Generate two 3D surface plots with different configurations',
            'Select both plots in the results panel',
            'Click "Compare" to view them side-by-side'
          ]
        },
        {
          type: 'paragraph',
          text: 'In Compare mode, rotation is synchronized—rotating one surface automatically rotates the other, making visual comparison straightforward.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // BENCHMARK FEATURE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Benchmark Feature',
          id: 'benchmark'
        },
        {
          type: 'paragraph',
          text: 'Benchmark **two or more** 3D surface plots for quantitative comparison:'
        },
        {
          type: 'numbered-list',
          items: [
            'Generate multiple 3D surfaces (different modulations, parameters, etc.)',
            'Select all surfaces to benchmark (minimum 2)',
            'Click "Benchmark" to see comparative analysis'
          ]
        },
        {
          type: 'paragraph',
          text: 'Benchmark provides:'
        },
        {
          type: 'list',
          items: [
            'Difference surfaces showing where one configuration beats another',
            'Volume under surface comparisons',
            'Cross-over boundaries where performance switches'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // MERGING
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Merge Compatibility for 3D Surfaces',
          id: 'merge-compatibility'
        },
        {
          type: 'paragraph',
          text: '3D surface plots can be merged (overlaid) when they share:'
        },
        {
          type: 'list',
          items: [
            '**Visualization mode**: Both must be 3D surfaces',
            '**X-axis and Y-axis ranges**: Identical parameter ranges',
            '**Grid resolution**: Same number of sample points'
          ]
        },
        {
          type: 'paragraph',
          text: 'Merged 3D surfaces appear as semi-transparent layers, letting you see where they intersect.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // PERFORMANCE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Performance Considerations',
          id: 'performance'
        },
        {
          type: 'paragraph',
          text: '3D rendering can be computationally intensive. For smooth interaction:'
        },
        {
          type: 'list',
          items: [
            'Start with moderate resolution (20-30 points per axis)',
            'Increase resolution only when needed for publication',
            'Consider using contour plots for initial exploration'
          ]
        },
        {
          type: 'try-it',
          params: { mode: '3d', snrRange: [0, 15], rhoRange: [0, 1], modulation: 'qam-16' },
          label: 'Create 16-QAM 3D Surface',
          description: 'Explore the E₀ landscape for 16-QAM'
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/contour-plots', label: 'Contour Plots', description: 'Alternative 2D visualization of the same data' },
            { path: 'tutorials/line-plots', label: 'Line Plots', description: 'Single-parameter slices through the surface' }
          ]
        }
      ]
    },

    'table-mode': {
      title: 'Table Mode',
      subtitle: 'Viewing raw numerical data in tabular format',
      sections: [
        {
          type: 'paragraph',
          text: 'Table mode displays computation results as raw numbers in a spreadsheet-like format. This is ideal for precise analysis, data export, and verification of computed values.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // WHEN TO USE TABLE MODE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'When to Use Table Mode',
          id: 'when-to-use'
        },
        {
          type: 'list',
          items: [
            '**Precise values**: When you need exact numbers, not visual approximations',
            '**Data export**: For importing into spreadsheets or analysis tools',
            '**Verification**: Checking specific computed values',
            '**Documentation**: Including exact numbers in reports or papers',
            '**Comparison**: Directly comparing numerical values across configurations'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // SETTING UP
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Setting Up Table Mode',
          id: 'setup'
        },
        {
          type: 'numbered-list',
          items: [
            'Switch to the "Plotting & Visualization" tab',
            'Select "Table" as the visualization mode',
            'Configure your parameter range (SNR, modulation, etc.)',
            'Click "Compute" to generate the table'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // TABLE STRUCTURE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Understanding the Table',
          id: 'table-structure'
        },
        {
          type: 'paragraph',
          text: 'The table displays:'
        },
        {
          type: 'definitions',
          items: [
            { term: 'Index Column', definition: 'Row number for reference' },
            { term: 'Parameter Columns', definition: 'SNR, ρ, or other input parameters' },
            { term: 'Result Columns', definition: 'Computed E₀ values' },
            { term: 'Metadata', definition: 'Computation time, method used (optional)' }
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // SORTING AND FILTERING
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Sorting and Filtering',
          id: 'sorting'
        },
        {
          type: 'list',
          items: [
            '**Click column headers**: Sort ascending/descending by that column',
            '**Filter rows**: Type in the filter box to show matching rows',
            '**Select rows**: Click to select individual rows for export'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // MERGE IN TABLE MODE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Merging Tables',
          id: 'merging'
        },
        {
          type: 'paragraph',
          text: 'Tables can be merged when they have the same parameter columns. Merged tables show all configurations side-by-side, with result columns differentiated by modulation or configuration name.'
        },
        {
          type: 'paragraph',
          text: 'Merge compatibility requires:'
        },
        {
          type: 'list',
          items: [
            '**Same visualization mode**: All must be tables',
            '**Same parameter range**: Identical SNR values',
            '**Compatible columns**: Same structure (may differ in result values)'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // EXPORTING
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Exporting Table Data',
          id: 'exporting'
        },
        {
          type: 'paragraph',
          text: 'Table mode excels at data export:'
        },
        {
          type: 'list',
          items: [
            '**CSV**: Comma-separated values for Excel, Google Sheets, etc.',
            '**JSON**: Structured data for programmatic access',
            '**Copy to clipboard**: Paste directly into other applications'
          ]
        },
        {
          type: 'note',
          text: 'For large datasets, CSV export is recommended as it preserves full precision and is universally compatible.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // PRECISION
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Numerical Precision',
          id: 'precision'
        },
        {
          type: 'paragraph',
          text: 'EPCalculator displays values with configurable precision. The underlying computation maintains full double-precision accuracy; display precision only affects viewing.'
        },
        {
          type: 'try-it',
          params: { mode: 'table', snrRange: [0, 20], modulation: 'psk-4' },
          label: 'Generate QPSK Data Table',
          description: 'View E₀ values for QPSK across SNR range'
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/line-plots', label: 'Line Plots', description: 'Visualize the same data as curves' },
            { path: 'tutorials/exporting', label: 'Exporting Results', description: 'More export options and formats' }
          ]
        }
      ]
    },

    'custom-constellation': {
      title: 'Custom Constellations',
      subtitle: 'Define your own signal constellations',
      sections: [
        {
          type: 'paragraph',
          text: 'EPCalculator lets you define custom [[concepts/modulation|constellations]] with arbitrary point positions and probabilities. This enables analysis of non-standard modulations and [[concepts/probabilistic-shaping|probabilistic shaping]].'
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
          text: 'A [[concepts/probabilistic-shaping#maxwell-boltzmann|Maxwell-Boltzmann]] shaped 4-[[concepts/modulation#qam|QAM]] might have inner points (±0.5, ±0.5) with higher probability than outer points:'
        },
        {
          type: 'code',
          language: 'text',
          code: 'Point    Re    Im    Probability\n  1     -1    -1      0.15\n  2     -1    +1      0.15\n  3     +1    -1      0.15\n  4     +1    +1      0.15\n(Inner points would get higher probabilities)'
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/modulation', label: 'Standard Modulation Schemes', description: 'How PAM, PSK, and QAM constellations are mathematically defined' },
            { path: 'concepts/probabilistic-shaping', label: 'Probabilistic Shaping Theory', description: 'Why non-uniform probabilities can improve performance' }
          ]
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
    },

    'import-data': {
      title: 'Importing Data',
      subtitle: 'Load external data into EPCalculator for comparison and analysis',
      sections: [
        {
          type: 'paragraph',
          text: 'The Import Data feature allows you to bring external datasets into EPCalculator for comparison with computed results. This is useful for validating against simulation data, comparing with published results, or analyzing measurements.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // ACCESSING IMPORT
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Accessing the Import Feature',
          id: 'accessing'
        },
        {
          type: 'paragraph',
          text: 'Click the "Import Data" button in the Plotting & Visualization tab to open the import dialog. This provides three methods for bringing data into EPCalculator.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // UPLOAD TAB
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Option 1: File Upload',
          id: 'upload'
        },
        {
          type: 'paragraph',
          text: 'The Upload tab lets you import data from files on your computer:'
        },
        {
          type: 'numbered-list',
          items: [
            'Click "Choose File" or drag and drop a file',
            'Supported formats: CSV, JSON, TXT',
            'The file is parsed and previewed before import',
            'Map columns to the appropriate parameters (SNR, E₀, etc.)',
            'Click "Import" to add the data to your workspace'
          ]
        },
        {
          type: 'heading',
          text: 'CSV File Format',
          id: 'csv-format'
        },
        {
          type: 'paragraph',
          text: 'For CSV files, EPCalculator expects a header row followed by data rows:'
        },
        {
          type: 'code',
          language: 'text',
          code: 'snr,e0,modulation\n0,0.123,QPSK\n5,0.456,QPSK\n10,0.789,QPSK\n15,1.234,QPSK'
        },
        {
          type: 'note',
          text: 'Column names are flexible—EPCalculator will attempt to auto-detect meaning from common names like "SNR", "snr_db", "E0", "error_exponent", etc.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // MANUAL ENTRY TAB
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Option 2: Manual Entry',
          id: 'manual-entry'
        },
        {
          type: 'paragraph',
          text: 'The Manual Entry tab provides a spreadsheet-like interface for entering data directly:'
        },
        {
          type: 'numbered-list',
          items: [
            'Click cells to edit values',
            'Use Tab to move between cells',
            'Add rows with the "+ Add Row" button',
            'Delete rows by selecting and pressing Delete',
            'Set the data label for the legend'
          ]
        },
        {
          type: 'paragraph',
          text: 'Manual entry is ideal for:'
        },
        {
          type: 'list',
          items: [
            'Small datasets (5-20 points)',
            'Quickly entering reference values from papers',
            'Testing or demonstration purposes'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // PASTE TAB
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Option 3: Paste from Clipboard',
          id: 'paste'
        },
        {
          type: 'paragraph',
          text: 'The Paste tab accepts data copied from spreadsheets or other applications:'
        },
        {
          type: 'numbered-list',
          items: [
            'Copy data from Excel, Google Sheets, or any spreadsheet',
            'Click in the paste area',
            'Press Ctrl+V (Cmd+V on Mac) or right-click and paste',
            'Data is automatically parsed (tab or comma separated)',
            'Preview shows how the data will be interpreted',
            'Click "Import" to add to workspace'
          ]
        },
        {
          type: 'note',
          text: 'This is often the fastest way to import data from papers or existing analyses—just copy from the source and paste directly.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // DATA VALIDATION
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Data Validation',
          id: 'validation'
        },
        {
          type: 'paragraph',
          text: 'EPCalculator validates imported data before adding it to your workspace:'
        },
        {
          type: 'list',
          items: [
            '**Numeric check**: All values must be valid numbers',
            '**Range check**: SNR values should be reasonable (e.g., -50 to +50 dB)',
            '**Monotonicity**: Optional check that SNR values are increasing',
            '**Duplicates**: Warning if duplicate SNR values are found'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // USING IMPORTED DATA
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Using Imported Data',
          id: 'using-data'
        },
        {
          type: 'paragraph',
          text: 'Once imported, your data appears in the results panel alongside computed results. You can:'
        },
        {
          type: 'list',
          items: [
            '**Merge**: Combine imported data with computed curves on the same plot',
            '**Compare**: View imported vs computed side-by-side',
            '**Export**: Re-export combined data in different formats',
            '**Delete**: Remove imported data when no longer needed'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // COMMON USE CASES
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Common Use Cases',
          id: 'use-cases'
        },
        {
          type: 'definitions',
          items: [
            { term: 'Validation', definition: 'Import simulation results and compare with EPCalculator\'s analytical computation' },
            { term: 'Literature Comparison', definition: 'Digitize curves from published papers and overlay with your computed results' },
            { term: 'Measurement Data', definition: 'Import real-world measurements for comparison with theoretical predictions' },
            { term: 'Custom Configurations', definition: 'Import results computed with custom constellations or external tools' }
          ]
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/exporting', label: 'Exporting Results', description: 'Export computed data for use elsewhere' },
            { path: 'tutorials/line-plots', label: 'Line Plots', description: 'Visualize imported data as curves' }
          ]
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/error-exponent', label: 'Error Exponent Theory', description: 'Understanding what the imported values represent' }
          ]
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
