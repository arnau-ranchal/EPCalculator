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
          text: 'The Additive White Gaussian Noise (AWGN) channel is the most fundamental model in digital communications. It represents an ideal channel where the only impairment is the addition of noise. This page describes the mathematical model used in EPCalculator, following the treatment in standard references [1, 2].'
        },
        // ─────────────────────────────────────────────────────────────────────
        // CONTINUOUS-TIME MODEL
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'From Continuous to Discrete Time',
          id: 'continuous-time'
        },
        {
          type: 'paragraph',
          text: 'In the physical channel, transmission occurs in continuous time. The received signal $y(t)$ is the sum of the transmitted signal $x(t)$ and noise $z(t)$:'
        },
        {
          type: 'formula',
          latex: 'y(t) = x(t) + z(t)',
          label: 'Continuous-Time AWGN Model'
        },
        {
          type: 'paragraph',
          text: 'The noise $z(t)$ is a Gaussian random process with three key properties:'
        },
        {
          type: 'list',
          items: [
            '**Additive**: The noise adds to the signal (doesn\'t multiply or distort)',
            '**White**: Equal power at all frequencies (flat power spectral density $N_0/2$)',
            '**Gaussian**: At any time $t$, the noise amplitude follows a normal distribution with mean zero'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // DISCRETE-TIME MODEL
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Discrete-Time Symbol Model',
          id: 'discrete-time'
        },
        {
          type: 'paragraph',
          text: 'Digital communication operates on discrete symbols. After matched filtering and sampling at the symbol rate, we obtain the discrete-time model:'
        },
        {
          type: 'formula',
          latex: 'y_i = x_i + z_i',
          label: 'Discrete-Time Model'
        },
        {
          type: 'paragraph',
          text: 'where $x_i$ is the transmitted symbol with energy $E_s$ (energy per symbol), and $z_i$ is complex Gaussian noise with variance $N_0$ (noise power spectral density).'
        },
        // ─────────────────────────────────────────────────────────────────────
        // NORMALIZED MODEL
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'The Normalized Channel Model',
          id: 'channel-model'
        },
        {
          type: 'paragraph',
          text: 'For mathematical convenience, we normalize the model. Let $\\tilde{x}_i$ be the unit-energy version of the transmitted symbol ($E[|\\tilde{x}_i|^2] = 1$) and $\\tilde{z}_i$ be unit-variance noise. Then:'
        },
        {
          type: 'formula',
          latex: 'y_i = \\sqrt{E_s} \\cdot \\tilde{x}_i + \\sqrt{N_0} \\cdot \\tilde{z}_i',
          label: 'Normalized Components'
        },
        {
          type: 'paragraph',
          text: 'Dividing both sides by $\\sqrt{N_0}$ and defining the normalized output $Y = y_i / \\sqrt{N_0}$, input $X = \\tilde{x}_i$, and noise $N = \\tilde{z}_i$:'
        },
        {
          type: 'formula',
          latex: 'Y = \\sqrt{\\frac{E_s}{N_0}} \\cdot X + N = \\sqrt{\\text{SNR}} \\cdot X + N',
          label: 'AWGN Channel Model'
        },
        {
          type: 'paragraph',
          text: 'This is the standard form used in EPCalculator. Here $X$ has unit average energy and $N$ is a complex Gaussian with independent real and imaginary parts, each with variance $\\frac{1}{2}$ (so total noise power is 1).'
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
        // ─────────────────────────────────────────────────────────────────────
        // REFERENCES
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'References',
          id: 'references'
        },
        {
          type: 'numbered-list',
          items: [
            'J. G. Proakis and M. Salehi, *Digital Communications*, 5th ed. McGraw-Hill, 2007.',
            'T. M. Cover and J. A. Thomas, *Elements of Information Theory*, 2nd ed. Wiley-Interscience, 2006.'
          ]
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
          type: 'paragraph',
          text: 'The parameter $\\rho$ takes values in $[0,1]$, and important quantities emerge at the boundaries:'
        },
        {
          type: 'list',
          items: [
            '$E_0(0) = 0$ always (the formula reduces to $-\\log_2(1) = 0$)',
            '$E_0(1) = R_0$ — the **cutoff rate**, a practical coding threshold',
            '$\\left.\\frac{\\partial E_0}{\\partial \\rho}\\right|_{\\rho=0} = I(X;Y)$ — the **mutual information** (channel capacity for given input distribution)',
            '$\\left.\\frac{\\partial^2 E_0}{\\partial \\rho^2}\\right|_{\\rho=0}$ — related to the **channel dispersion** (characterizes finite-length performance)'
          ]
        },
        {
          type: 'note',
          text: 'In EPCalculator, the mutual information is computed as the derivative of $E_0(\\rho)$ at $\\rho=0$. The cutoff rate is $E_0(1)$.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // CODE PARAMETERS
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Code Parameters: n, k, and R',
          id: 'code-parameters'
        },
        {
          type: 'paragraph',
          text: 'Block codes are characterized by two fundamental parameters that determine their structure:'
        },
        {
          type: 'definitions',
          items: [
            { term: '$n$ (code length)', definition: 'The number of channel symbols in each codeword. This is the block length sent over the channel.' },
            { term: '$k$ (information bits)', definition: 'The number of information bits encoded into each codeword. These are the "useful" bits being transmitted.' }
          ]
        },
        {
          type: 'heading',
          text: 'Code Rate (R)',
          id: 'code-rate'
        },
        {
          type: 'paragraph',
          text: 'The code rate $R$ is defined as the ratio of information bits to codeword symbols:'
        },
        {
          type: 'formula',
          latex: 'R = \\frac{k}{n} \\quad \\text{bits per channel use}',
          label: 'Code Rate'
        },
        {
          type: 'paragraph',
          text: 'Lower rate means more redundancy (smaller $k$ for fixed $n$), providing stronger error protection at the cost of throughput. Reliable communication is only possible when $R < C$ (channel capacity). The error exponent $E(R)$ determines how quickly errors decrease as $n$ grows.'
        },
        {
          type: 'heading',
          text: 'Code Length (n)',
          id: 'code-length'
        },
        {
          type: 'paragraph',
          text: 'The code length $n$ directly controls reliability. Longer codes achieve better error performance because the error probability decreases exponentially with $n$:'
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
        // ─────────────────────────────────────────────────────────────────────
        // REFERENCES
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'References',
          id: 'references'
        },
        {
          type: 'numbered-list',
          items: [
            'R. G. Gallager, *Information Theory and Reliable Communication*. Wiley, 1968.',
            'J. Scarlett, A. Martinez, and A. Guillén i Fàbregas, "Mismatched decoding: Error exponents, second-order rates and saddlepoint approximations," *IEEE Trans. Inf. Theory*, vol. 60, no. 5, 2014.',
            'T. M. Cover and J. A. Thomas, *Elements of Information Theory*, 2nd ed. Wiley-Interscience, 2006.'
          ]
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
            'BPSK (2-PSK): Two points at 0° and 180° (k=0,1)',
            'QPSK (4-PSK): Four points at 0°, 90°, 180°, 270° (k=0,1,2,3)',
            '8-PSK: Eight equally-spaced phases at 0°, 45°, 90°, ..., 315°'
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
          text: 'Note that $E_0(0) = 0$ always (not the mutual information itself). The mutual information is the **slope** (derivative) of $E_0(\\rho)$ at the origin. EPCalculator computes the mutual information by evaluating this derivative numerically.'
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
      subtitle: 'Optimizing constellation point probabilities for better performance',
      sections: [
        {
          type: 'paragraph',
          text: 'Probabilistic shaping (or constellation shaping) assigns non-uniform probabilities to constellation points, allowing the input distribution to be optimized for the channel. This is distinct from geometric shaping (changing point positions) and can provide significant performance gains.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // UNIFORM DISTRIBUTION
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Uniform Distribution (Baseline)',
          id: 'uniform'
        },
        {
          type: 'paragraph',
          text: 'In standard modulation schemes, each of the $M$ constellation points is transmitted with equal probability:'
        },
        {
          type: 'formula',
          latex: 'Q(x_k) = \\frac{1}{M}, \\quad k = 1, 2, \\ldots, M',
          label: 'Uniform Distribution'
        },
        {
          type: 'paragraph',
          text: 'This uniform distribution maximizes the entropy of the transmitted symbols (achieving $\\log_2 M$ bits per symbol) but does not account for the different "costs" (energies) of constellation points.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // WHY SHAPE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Why Shape the Distribution?',
          id: 'why-shape'
        },
        {
          type: 'paragraph',
          text: 'The error exponent $E_0(\\rho)$ explicitly depends on the input distribution $Q(x)$. By choosing $Q(x)$ wisely, we can potentially improve performance. The theoretical motivation comes from the capacity-achieving distribution, which for AWGN channels is Gaussian—concentrating probability on lower-energy points.'
        },
        {
          type: 'paragraph',
          text: 'However, shaping gain is **not guaranteed** for arbitrary distributions. The inequality:'
        },
        {
          type: 'formula',
          latex: 'E_0^{Q}(\\rho) \\geq E_0^{\\text{uniform}}(\\rho)',
          label: 'Potential Shaping Gain'
        },
        {
          type: 'paragraph',
          text: 'holds only when $Q(x)$ is appropriately chosen. A poorly chosen distribution can actually **decrease** the error exponent. The optimal distribution depends on the SNR, modulation order, and the value of $\\rho$.'
        },
        {
          type: 'note',
          text: 'Shaping gain comes at a cost: the effective number of transmitted bits decreases because high-probability symbols carry less information. The rate reduction is $H(Q) - \\log_2 M$ where $H(Q)$ is the entropy of the shaped distribution.',
          variant: 'warning'
        },
        // ─────────────────────────────────────────────────────────────────────
        // MAXWELL-BOLTZMANN
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Maxwell-Boltzmann Distribution',
          id: 'maxwell-boltzmann'
        },
        {
          type: 'paragraph',
          text: 'A popular parametric family for shaping is the Maxwell-Boltzmann (exponential) distribution, which assigns probability based on symbol energy:'
        },
        {
          type: 'formula',
          latex: 'Q(x_k) = \\frac{e^{-\\lambda |x_k|^2}}{\\sum_{j=1}^{M} e^{-\\lambda |x_j|^2}}',
          label: 'Maxwell-Boltzmann Distribution'
        },
        {
          type: 'definitions',
          items: [
            { term: '$\\lambda$', definition: 'Shaping parameter controlling the distribution "peakedness"' },
            { term: '$|x_k|^2$', definition: 'Energy of constellation point $x_k$' }
          ]
        },
        {
          type: 'paragraph',
          text: 'Special cases of the parameter $\\lambda$:'
        },
        {
          type: 'list',
          items: [
            '$\\lambda = 0$: Uniform distribution (all points equally likely)',
            '$\\lambda > 0$: Lower-energy points have higher probability',
            '$\\lambda \\to \\infty$: Only the lowest-energy point(s) are transmitted'
          ]
        },
        {
          type: 'paragraph',
          text: 'The optimal $\\lambda$ depends on the operating point (SNR, rate) and must be found by optimization or exhaustive search. EPCalculator allows you to sweep $\\lambda$ values to find the best shaping for your scenario.'
        },
        {
          type: 'note',
          text: 'EPCalculator supports custom constellations where you can specify individual point probabilities, enabling testing of any shaping strategy—including optimal distributions found by numerical optimization.',
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
            '$N = 20$: Default in EPCalculator—good balance of speed and accuracy',
            '$N = 30$-$40$: Higher precision for detailed analysis',
            '$N = 50+$: Maximum precision for publication-quality results'
          ]
        },
        {
          type: 'note',
          text: 'Higher N gives more accurate results but slower computation. For most practical purposes, N=20 is sufficient and is the EPCalculator default.',
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
            '$n = 20$: Good balance of speed and accuracy (EPCalculator default)',
            '$n = 50$: Higher precision for detailed analysis',
            '$n = 100+$: Maximum precision for publication-quality results'
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
          params: { snr: 10, modulation: 'psk', M: 8, n: 20 },
          label: 'Try with n=20 quadrature points',
          description: 'Compute E₀ for 8-PSK with the default quadrature precision'
        },
        // ─────────────────────────────────────────────────────────────────────
        // REFERENCES
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'References',
          id: 'references'
        },
        {
          type: 'numbered-list',
          items: [
            'P. Jäckel, "A Note on Multivariate Gaussian-Hermite Quadrature," 2005. Available: http://www.jaeckel.org/',
            'M. Abramowitz and I. A. Stegun, *Handbook of Mathematical Functions*. Dover Publications, 1972.',
            'W. H. Press et al., *Numerical Recipes: The Art of Scientific Computing*, 3rd ed. Cambridge University Press, 2007.'
          ]
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
      subtitle: 'Gradient descent with Nesterov acceleration and cubic Hermite interpolation',
      sections: [
        {
          type: 'paragraph',
          text: 'Finding the error exponent $E(R)$ requires optimizing over the parameter $\\rho$. EPCalculator uses **gradient descent with Nesterov\'s accelerated gradient (NAG)** combined with **cubic Hermite interpolation** for intelligent initial guess selection. This combination provides fast, reliable convergence across all SNR values and constellation sizes.'
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
          text: 'For an $L$-smooth function (where the gradient is Lipschitz with constant $L$), theory guarantees convergence when $\\beta \\leq 2/L$. In practice, we simply set:'
        },
        {
          type: 'formula',
          latex: '\\beta = \\frac{1}{L}',
          label: 'Learning Rate'
        },
        {
          type: 'paragraph',
          text: 'For our objective function $G(\\rho) = E_0(\\rho) - \\rho R$, the smoothness constant $L$ equals the maximum curvature. Since $E_0$ is concave with maximum curvature at $\\rho = 0$:'
        },
        {
          type: 'formula',
          latex: 'L = \\left| E_0\'\'(0) \\right| \\quad \\Rightarrow \\quad \\beta = \\frac{1}{\\left| E_0\'\'(0) \\right|}',
          label: 'Learning Rate for E₀ Optimization'
        },
        {
          type: 'note',
          text: 'This choice of $\\beta = 1/L$ provides simplicity and stability. The algorithm automatically adapts to different SNR values and modulation schemes by computing the second derivative at $\\rho = 0$.',
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
        // WHY GRADIENT DESCENT OVER NEWTON'S METHOD?
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Why Gradient Descent Over Newton\'s Method?',
          id: 'newton'
        },
        {
          type: 'paragraph',
          text: 'Newton\'s method has quadratic convergence (faster than gradient descent), but requires computing and inverting the Hessian matrix. For the constant composition case with $|\\mathcal{X}|$ constellation points:'
        },
        {
          type: 'list',
          items: [
            '**Hessian computation**: $\\mathcal{O}(|\\mathcal{X}|^2)$ second derivatives',
            '**Matrix inversion**: $\\mathcal{O}(|\\mathcal{X}|^3)$ operations',
            '**Gradient descent (GD/NAG)**: Only $\\mathcal{O}(|\\mathcal{X}|)$ per iteration'
          ]
        },
        {
          type: 'paragraph',
          text: 'For small constellations like BPSK ($|\\mathcal{X}| = 2$) or QPSK ($|\\mathcal{X}| = 4$), Newton\'s method could be viable. However, for larger constellations like 64-QAM or 256-QAM, the computational savings of gradient-based methods are substantial.'
        },
        {
          type: 'note',
          text: 'EPCalculator uses gradient descent with Nesterov acceleration (NAG) and cubic Hermite interpolation for initial guesses. This combination provides good convergence with low per-iteration cost across all constellation sizes.',
          variant: 'info'
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
          type: 'paragraph',
          text: 'The following table compares the optimization methods considered for EPCalculator:'
        },
        {
          type: 'code',
          language: 'text',
          code: 'Method              | Pros                              | Cons\n--------------------|-----------------------------------|----------------------------------\nGradient Descent    | Simple implementation, scalable   | Slow convergence, sensitive to β\nNewton\'s Method     | Fast convergence, accurate        | Requires Hessian, O(n²+n³) cost\nNesterov (NAG)      | Faster than GD, scalable         | More complex, requires κ tuning'
        },
        {
          type: 'paragraph',
          text: 'EPCalculator uses **NAG with cubic Hermite interpolation** as its primary optimization method, combining good convergence with the scalability needed for large constellations.'
        },
        {
          type: 'try-it',
          params: { snr: 10, modulation: 'qam', M: 16, rho: 0.5 },
          label: 'See optimization in action',
          description: 'Compute E₀ and observe the convergence behavior'
        },
        // ─────────────────────────────────────────────────────────────────────
        // REFERENCES
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'References',
          id: 'references'
        },
        {
          type: 'numbered-list',
          items: [
            'S. Bubeck, *Convex Optimization: Algorithms and Complexity*. Foundations and Trends in Machine Learning, vol. 8, no. 3-4, 2015.',
            'Y. Nesterov, *Introductory Lectures on Convex Optimization: A Basic Course*. Springer, 2004.',
            'S. Boyd and L. Vandenberghe, *Convex Optimization*. Cambridge University Press, 2004.'
          ]
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
          text: 'With your first plot visible, change one or more parameters. For example, switch from [[concepts/modulation#psk|QPSK]] (M=4) to [[concepts/modulation#psk|8-PSK]] (M=8) to compare these [[concepts/modulation|modulation schemes]]:'
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
          text: 'Contour plots show how the [[concepts/error-exponent#e0-formula|error exponent]] varies across two parameters simultaneously, using color to represent the third dimension. This visualization is powerful for understanding performance trade-offs across a parameter space.'
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
            '**X-axis**: First parameter (e.g., [[concepts/awgn-channel#snr|SNR]])',
            '**Y-axis**: Second parameter (e.g., code rate R or [[concepts/error-exponent#rho|ρ]])',
            '**Color**: The [[concepts/error-exponent#e0-formula|error exponent]] value, with contour lines connecting equal values'
          ]
        },
        {
          type: 'paragraph',
          text: 'Contour lines (like elevation lines on a topographic map) connect points with equal [[concepts/error-exponent#e0-formula|error exponent]] values, making it easy to see "iso-performance" regions.'
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
            'Configure the X-axis parameter range (e.g., [[concepts/awgn-channel#snr|SNR]] 0-20 dB)',
            'Configure the Y-axis parameter range (e.g., [[concepts/error-exponent#rho|ρ]] from 0 to 1)',
            'Select your [[concepts/modulation|modulation scheme]]',
            'Click "Compute" to generate the contour plot'
          ]
        },
        {
          type: 'paragraph',
          text: 'After clicking "Compute", the calculation runs and displays your results:'
        },
        {
          type: 'screenshot',
          name: 'contour-plot-generated',
          caption: 'A generated contour plot showing the error exponent E₀ across SNR and ρ for QPSK modulation',
          alt: 'Contour plot with color gradient showing E₀ values and contour lines connecting equal values'
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
          type: 'paragraph',
          text: 'Hover over any point to see the exact SNR, ρ, and E₀ values at that location:'
        },
        {
          type: 'screenshot',
          name: 'contour-plot-hover',
          caption: 'Hovering on the contour plot displays a tooltip with the exact parameter values and error exponent',
          alt: 'Contour plot with tooltip showing SNR, ρ, and E₀ values at cursor position'
        },
        // ─────────────────────────────────────────────────────────────────────
        // COMPARE/BENCHMARK WORKFLOW
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Comparing Multiple Contour Plots',
          id: 'comparing'
        },
        {
          type: 'paragraph',
          text: 'Unlike line plots which use a merge modal, contour plots use a **selection-based workflow** with checkboxes. This allows you to select multiple plots and then choose how to compare them.'
        },
        {
          type: 'heading',
          text: 'Step 1: Generate Your First Contour Plot',
          id: 'compare-step1'
        },
        {
          type: 'paragraph',
          text: 'Start by configuring and generating your first contour plot. For this example, we\'ll use [[concepts/modulation#psk|QPSK]] modulation:'
        },
        {
          type: 'screenshot',
          name: 'contour-plot-step1-complete',
          caption: 'The interface after generating the first contour plot: QPSK error exponent surface with controls on the left',
          alt: 'Full EPCalculator interface showing a generated QPSK contour plot'
        },
        {
          type: 'heading',
          text: 'Step 2: Change Parameters and Generate Second Plot',
          id: 'compare-step2'
        },
        {
          type: 'paragraph',
          text: 'With your first plot visible, change one or more parameters. For example, switch from [[concepts/modulation#psk|QPSK]] (M=4) to [[concepts/modulation#psk|8-PSK]] (M=8) to compare these [[concepts/modulation|modulation schemes]]:'
        },
        {
          type: 'screenshot',
          name: 'contour-plot-step2-params',
          caption: 'After generating a QPSK contour plot, change the modulation order to M=8 (8-PSK) for comparison',
          alt: 'Plotting controls with M=8 selected, ready to generate a second contour plot'
        },
        {
          type: 'paragraph',
          text: 'Click "Compute" again to generate the second contour plot. Both plots now appear in the results area.'
        },
        {
          type: 'heading',
          text: 'Step 3: Select Plots for Comparison',
          id: 'compare-step3'
        },
        {
          type: 'paragraph',
          text: 'When you have multiple contour plots, selection checkboxes appear on each plot card. Click the checkbox to select plots for comparison:'
        },
        {
          type: 'screenshot',
          name: 'contour-plot-checkbox-selection',
          caption: 'Checkboxes appear on contour plot cards allowing you to select plots for comparison or benchmarking',
          alt: 'Two contour plots with selection checkboxes visible on each card'
        },
        {
          type: 'heading',
          text: 'Step 4: Use the Action Bar',
          id: 'compare-step4'
        },
        {
          type: 'paragraph',
          text: 'Once you select at least one plot, an action bar appears at the bottom of the screen with **Compare** and **Benchmark** buttons:'
        },
        {
          type: 'screenshot',
          name: 'contour-plot-action-bar',
          caption: 'The action bar shows selection count and provides Compare (2 plots) and Benchmark (2+ plots) options',
          alt: 'Action bar at bottom of screen showing 2 plots selected with Comparison and Benchmark buttons'
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
          text: 'The **Compare** feature requires exactly **two** contour plots. It creates a side-by-side view showing the **difference** between configurations:'
        },
        {
          type: 'list',
          items: [
            '**Left panel**: First selected plot',
            '**Middle panel**: Difference plot (Plot A - Plot B)',
            '**Right panel**: Second selected plot'
          ]
        },
        {
          type: 'screenshot',
          name: 'contour-plot-comparison',
          caption: 'The comparison view shows both plots side-by-side with a difference visualization in the center',
          alt: 'Side-by-side comparison showing two contour plots and their difference'
        },
        {
          type: 'note',
          text: 'In comparison mode, hovering on one plot highlights the corresponding point on all three panels, making it easy to see how performance differs at specific parameter values.',
          variant: 'tip'
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
          text: 'The **Benchmark** feature works with **two or more** contour plots. It creates a 3D overlay visualization where all surfaces are rendered together:'
        },
        {
          type: 'screenshot',
          name: 'contour-plot-benchmark',
          caption: 'The 3D benchmark overlay shows all selected surfaces together for visual comparison',
          alt: '3D surface plot showing multiple modulation schemes overlaid for benchmarking'
        },
        {
          type: 'paragraph',
          text: 'The 3D benchmark view is interactive:'
        },
        {
          type: 'list',
          items: [
            '**Rotate**: Click and drag to rotate the view angle',
            '**Zoom**: Scroll to zoom in and out',
            '**Pan**: Right-click and drag to pan the view',
            '**Legend**: Each surface is color-coded and labeled for identification'
          ]
        },
        {
          type: 'note',
          text: 'Benchmark mode is ideal for comparing 3 or more configurations simultaneously, as the 3D overlay clearly shows which surface is "on top" (better performance) at each point.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // COMPATIBILITY
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Compatibility Requirements',
          id: 'compatibility'
        },
        {
          type: 'paragraph',
          text: 'Contour plots can be compared or benchmarked when they have compatible axes:'
        },
        {
          type: 'list',
          items: [
            '**Visualization mode**: Both must be contour plots',
            '**X-axis parameter**: Same parameter type (e.g., both use SNR)',
            '**Y-axis parameter**: Same parameter type (e.g., both use ρ)',
            '**Resolution**: Same grid density (number of points)'
          ]
        },
        {
          type: 'note',
          text: 'If the Compare or Benchmark button is disabled, hover over it to see which compatibility requirement is not met.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // EXPORTING
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Exporting Contour Plots',
          id: 'exporting'
        },
        {
          type: 'paragraph',
          text: 'You can export individual contour plots or comparison/benchmark results. Look for the download icon in the plot header:'
        },
        {
          type: 'screenshot',
          name: 'contour-plot-export-button',
          caption: 'The export button (download icon) allows exporting the contour plot as an image or data file',
          alt: 'Contour plot card with export button highlighted'
        },
        {
          type: 'paragraph',
          text: 'Click the export button to see available formats:'
        },
        {
          type: 'screenshot',
          name: 'contour-plot-export-menu',
          caption: 'Export your contour plot as images (SVG, PNG) or data files (CSV, JSON)',
          alt: 'Export menu showing four format options with icons and descriptions'
        },
        {
          type: 'definitions',
          items: [
            { term: 'SVG', definition: 'Vector graphics format. Perfect for publications and documents where scalability matters.' },
            { term: 'PNG', definition: 'High-resolution raster image. Best for presentations and web sharing.' },
            { term: 'CSV', definition: 'Grid data with X, Y, and Z columns. Import into MATLAB, Python, Excel, or any data tool.' },
            { term: 'JSON', definition: 'Complete plot data with metadata. Perfect for reimporting or automated processing.' }
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
          text: '3D surface plots provide an immersive view of how the [[concepts/error-exponent#e0-formula|error exponent]] varies across two parameters. The surface height represents the error exponent value, giving an intuitive understanding of the performance landscape.'
        },
        {
          type: 'screenshot',
          name: 'surface-plot-generated',
          caption: 'A 3D surface plot showing the error exponent landscape for QPSK modulation',
          alt: '3D surface visualization with error exponent as height'
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
          text: 'A 3D surface plot renders the [[concepts/error-exponent#e0-formula|error exponent]] as a physical surface:'
        },
        {
          type: 'list',
          items: [
            '**X-axis**: First parameter (e.g., [[concepts/awgn-channel#snr|SNR]])',
            '**Y-axis**: Second parameter (e.g., code rate R or [[concepts/error-exponent#rho|ρ]])',
            '**Z-axis (height)**: The [[concepts/error-exponent#e0-formula|error exponent]] value',
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
            'Configure both X1 ([[concepts/awgn-channel#snr|SNR]]) and X2 (Rate) parameter ranges',
            'Select your [[concepts/modulation|modulation scheme]] (e.g., [[concepts/modulation#psk|QPSK]])',
            'Click "Generate Plot" to compute the 3D surface'
          ]
        },
        {
          type: 'screenshot',
          name: 'surface-plot-step1-complete',
          caption: 'The interface after generating a 3D surface: QPSK error exponent landscape with controls on the left',
          alt: 'Full EPCalculator interface showing a generated QPSK 3D surface plot'
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
        // COMPARE AND BENCHMARK WORKFLOW
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Compare and Benchmark Workflow',
          id: 'compare-benchmark-workflow'
        },
        {
          type: 'paragraph',
          text: 'When you have **two or more 3D surfaces**, selection checkboxes appear automatically. This enables the Compare and Benchmark features:'
        },
        {
          type: 'heading',
          text: 'Step 1: Generate Multiple Surfaces',
          level: 3
        },
        {
          type: 'paragraph',
          text: 'Create two or more 3D surface plots with different configurations. For example, generate [[concepts/modulation#psk|QPSK]] and [[concepts/modulation#psk|8-PSK]] surfaces to compare their performance:'
        },
        {
          type: 'screenshot',
          name: 'surface-plot-step2-params',
          caption: 'After generating the first QPSK surface, change M to 8 to set up a second 8-PSK surface',
          alt: 'Parameter controls showing M=8 being selected for the second surface'
        },
        {
          type: 'heading',
          text: 'Step 2: Select Surfaces',
          level: 3
        },
        {
          type: 'paragraph',
          text: 'Once you have two surfaces, checkboxes appear next to each plot. Click the checkboxes to select the surfaces you want to compare or benchmark:'
        },
        {
          type: 'screenshot',
          name: 'surface-plot-checkbox-selection',
          caption: 'Selection checkboxes appear when you have 2+ surfaces. Click to select surfaces for comparison.',
          alt: 'Two 3D surface plots with selection checkboxes visible'
        },
        {
          type: 'heading',
          text: 'Step 3: Use the Action Bar',
          level: 3
        },
        {
          type: 'paragraph',
          text: 'When surfaces are selected, a floating action bar appears at the bottom with your options:'
        },
        {
          type: 'screenshot',
          name: 'surface-plot-action-bar',
          caption: 'The action bar shows "2 plots selected" with Compare and Benchmark buttons',
          alt: 'Action bar with selection count and comparison action buttons'
        },
        {
          type: 'list',
          items: [
            '**Comparison**: Creates a 3D difference surface (requires exactly 2 surfaces)',
            '**Benchmark**: Creates an overlay visualization (requires 2+ surfaces)',
            '**Select All Compatible**: Quickly select all surfaces with matching axes'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // COMPARE FEATURE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Comparison: 3D Difference Surface',
          id: 'compare'
        },
        {
          type: 'paragraph',
          text: 'The **Comparison** feature (exactly 2 surfaces) creates a 3D difference surface showing where one configuration outperforms another:'
        },
        {
          type: 'screenshot',
          name: 'surface-plot-comparison',
          caption: 'The 3D comparison surface uses a diverging color scheme (blue-white-red) to show which configuration performs better at each point',
          alt: '3D difference surface showing performance comparison between QPSK and 8-PSK'
        },
        {
          type: 'list',
          items: [
            '**Positive values (red)**: First surface has higher error exponent (better)',
            '**Zero (white)**: Both surfaces have equal performance',
            '**Negative values (blue)**: Second surface has higher error exponent (better)'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // BENCHMARK FEATURE
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Benchmark: 3D Overlay',
          id: 'benchmark'
        },
        {
          type: 'paragraph',
          text: 'The **Benchmark** feature (2 or more surfaces) overlays all selected surfaces in a single 3D visualization. Each surface gets a distinct color:'
        },
        {
          type: 'screenshot',
          name: 'surface-plot-benchmark',
          caption: 'The 3D benchmark overlay shows all surfaces together, making it easy to see which is "on top" at each point',
          alt: '3D benchmark overlay with multiple colored surfaces'
        },
        {
          type: 'paragraph',
          text: 'Benchmark mode lets you:'
        },
        {
          type: 'list',
          items: [
            '**Rotate together**: All surfaces rotate in sync for consistent viewing',
            '**Visual dominance**: See which configuration has the highest surface at each point',
            '**Compare 3+ configurations**: Unlike Comparison (limited to 2), Benchmark handles multiple surfaces',
            '**Identify crossover regions**: Where surfaces intersect shows where performance switches'
          ]
        },
        {
          type: 'note',
          text: 'Benchmark mode is especially powerful for comparing 3 or more configurations—the 3D overlay instantly reveals which option dominates in different parameter regions.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // EXPORTING
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Exporting 3D Surfaces',
          id: 'export'
        },
        {
          type: 'paragraph',
          text: 'Export your 3D surface plots for presentations, papers, or further analysis:'
        },
        {
          type: 'screenshot',
          name: 'surface-plot-export-button',
          caption: 'Click the export button (download icon) in the plot toolbar',
          alt: '3D surface plot with export button highlighted'
        },
        {
          type: 'paragraph',
          text: 'Available export formats:'
        },
        {
          type: 'list',
          items: [
            '**PNG**: High-resolution image of the current view angle',
            '**SVG**: Vector format for scalable graphics (2D projection)',
            '**CSV**: Raw data for external analysis',
            '**JSON**: Complete data with metadata'
          ]
        },
        {
          type: 'screenshot',
          name: 'surface-plot-export-menu',
          caption: 'The export menu provides multiple format options for your 3D surface',
          alt: 'Export menu showing PNG, SVG, CSV, and JSON options'
        },
        {
          type: 'note',
          text: 'When exporting 3D surfaces as images, rotate to your preferred view angle first—the export captures the current perspective.',
          variant: 'info'
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
            'Consider using contour plots for initial exploration',
            'Close other browser tabs when working with high-resolution surfaces'
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
          text: 'Table mode displays computation results as raw numbers in a spreadsheet-like format. Unlike other visualization modes that show a single metric, tables display **all computed values at once** — [[concepts/error-exponent#e0-formula|error exponent]], error probability, optimal [[concepts/error-exponent#rho|ρ]], [[concepts/mutual-information#mutual-info|mutual information]], [[concepts/mutual-information#cutoff-rate|cutoff rate]], and critical rate — making it ideal for precise analysis and data export.'
        },
        // ─────────────────────────────────────────────────────────────────────
        // GENERATED TABLE SCREENSHOT
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'screenshot',
          name: 'table-mode-generated',
          caption: 'A generated table showing all metrics for QPSK modulation across SNR range',
          alt: 'Table mode showing computed values including SNR, Error Exponent, Error Probability, Optimal ρ, Mutual Information, Cutoff Rate, and Critical Rate'
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
            '**Precise values**: When you need exact numbers, not visual approximations from plots',
            '**All metrics at once**: View E₀, Pe, ρ*, MI, Rcutoff, and Rcrit simultaneously',
            '**Data export**: For importing into spreadsheets, MATLAB, or analysis tools',
            '**Verification**: Cross-checking computed values against reference tables',
            '**Documentation**: Including exact numbers in research papers or reports'
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // STEP-BY-STEP WORKFLOW
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Generating a Table',
          id: 'workflow'
        },
        {
          type: 'paragraph',
          text: 'Follow these steps to generate a data table:'
        },
        {
          type: 'numbered-list',
          items: [
            '**Switch to Plotting tab**: Click "Plotting & Visualization" to access the plotting controls',
            '**Select Table mode**: In the Visualization dropdown, choose "Table"',
            '**Configure parameters**: Set your [[concepts/awgn-channel#snr|SNR]] range, number of points, and [[concepts/modulation|modulation]] type',
            '**Click Generate**: The computation runs and displays results in a table format'
          ]
        },
        {
          type: 'note',
          text: 'Table mode uses an efficient batch API that computes all metrics (E₀, Pe, ρ*, MI, Rcutoff, Rcrit) in a single request, making it faster than generating separate plots for each metric.',
          variant: 'info'
        },
        // ─────────────────────────────────────────────────────────────────────
        // TABLE COLUMNS
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Understanding Table Columns',
          id: 'columns'
        },
        {
          type: 'screenshot',
          name: 'table-mode-columns',
          caption: 'Table column headers showing all available metrics',
          alt: 'Table header row with columns for Index, SNR, Error Exponent, Error Probability, Optimal rho, Mutual Information, Cutoff Rate, and Critical Rate'
        },
        {
          type: 'definitions',
          items: [
            { term: '#', definition: 'Row index for reference' },
            { term: 'SNR (dB)', definition: '[[concepts/awgn-channel#snr|Signal-to-noise ratio]] in the configured unit' },
            { term: 'E₀ (Error Exponent)', definition: '[[concepts/error-exponent#e0-formula|Gallager\'s random coding error exponent]]' },
            { term: 'Pe (Error Probability)', definition: 'Upper bound on block error probability' },
            { term: 'ρ* (Optimal ρ)', definition: 'Optimal value of the [[concepts/error-exponent#rho|Gallager parameter ρ]]' },
            { term: 'MI (Mutual Information)', definition: '[[concepts/mutual-information#mutual-info|Channel capacity]] in bits per symbol' },
            { term: 'R_cutoff (Cutoff Rate)', definition: '[[concepts/mutual-information#cutoff-rate|Rate below which error exponent is positive]]' },
            { term: 'R_crit (Critical Rate)', definition: 'Rate at which sphere-packing and random coding exponents meet' }
          ]
        },
        // ─────────────────────────────────────────────────────────────────────
        // MERGING TABLES
        // ─────────────────────────────────────────────────────────────────────
        {
          type: 'heading',
          text: 'Merging Tables',
          id: 'merging'
        },
        {
          type: 'paragraph',
          text: 'When you generate a second table with compatible parameters (same [[concepts/awgn-channel#snr|SNR]] range), EPCalculator detects this and offers to merge them. Merged tables show all configurations side-by-side, making comparison easy.'
        },
        {
          type: 'screenshot',
          name: 'table-mode-merge-modal',
          caption: 'Merge modal appears when a compatible table is detected',
          alt: 'Modal dialog asking whether to merge the new table with existing one or create a separate table'
        },
        {
          type: 'paragraph',
          text: 'Merge compatibility requires:'
        },
        {
          type: 'list',
          items: [
            '**Same visualization mode**: Both must be tables',
            '**Same [[concepts/awgn-channel#snr|SNR]] range**: Identical X-axis values',
            '**Same SNR unit**: Both linear or both dB'
          ]
        },
        {
          type: 'screenshot',
          name: 'table-mode-merged',
          caption: 'Merged table showing QPSK and 8-PSK data with columns grouped by modulation',
          alt: 'Merged table with columns for each modulation type showing all metrics side-by-side'
        },
        {
          type: 'note',
          text: 'Merged tables group columns by [[concepts/modulation|modulation]] type. Each metric appears multiple times — once per configuration — allowing direct numerical comparison.',
          variant: 'info'
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
          text: 'Tables are ideal for data export. Click the export button to access format options:'
        },
        {
          type: 'screenshot',
          name: 'table-mode-export-button',
          caption: 'Export button in the table header toolbar',
          alt: 'Table with export button highlighted in the toolbar'
        },
        {
          type: 'screenshot',
          name: 'table-mode-export-menu',
          caption: 'Export menu showing available formats: CSV and JSON',
          alt: 'Dropdown menu showing CSV and JSON export options'
        },
        {
          type: 'definitions',
          items: [
            { term: 'CSV', definition: 'Comma-separated values — opens in Excel, Google Sheets, MATLAB. Preserves full numerical precision.' },
            { term: 'JSON', definition: 'Structured data format — ideal for programmatic access, Python scripts, or web applications.' }
          ]
        },
        {
          type: 'note',
          text: 'Exported data maintains full double-precision accuracy. The display in the browser may show rounded values, but exports contain the complete computed precision.',
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
          text: 'EPCalculator computes values using IEEE 754 double-precision arithmetic (64-bit floats). The table displays a reasonable number of decimal places for readability, but exports preserve the full computed precision (~15-17 significant digits).'
        },
        {
          type: 'try-it',
          params: { mode: 'table', snrRange: [0, 20], modulation: 'psk-4' },
          label: 'Generate QPSK Data Table',
          description: 'View all metrics for QPSK across SNR range'
        },
        {
          type: 'cross-reference',
          variant: 'tutorial',
          links: [
            { path: 'tutorials/line-plots', label: 'Line Plots', description: 'Visualize metrics as curves' },
            { path: 'tutorials/contour-plots', label: 'Contour Plots', description: '2D heatmaps for two-variable analysis' },
            { path: 'tutorials/exporting', label: 'Citing EPCalculator', description: 'Reference EPCalculator in academic work' }
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
      title: 'Citing EPCalculator',
      subtitle: 'Reference EPCalculator in your academic work',
      sections: [
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
            { path: 'tutorials/exporting', label: 'Citing EPCalculator', description: 'Reference EPCalculator in academic work' },
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
      subtitle: 'REST API for computing error exponents programmatically',
      sections: [
        {
          type: 'paragraph',
          text: 'EPCalculator provides a powerful REST API that lets you compute [[concepts/error-exponent#e0-formula|error exponents]] programmatically. The API uses a unified design where each parameter can accept multiple input formats, enabling everything from single-point calculations to complex multi-dimensional sweeps over [[concepts/awgn-channel#snr|SNR]], [[concepts/modulation|modulation schemes]], and other parameters.'
        },
        {
          type: 'heading',
          text: 'Base URL',
          id: 'base-url'
        },
        {
          type: 'code',
          language: 'text',
          code: 'https://epcalculator.matcom.sb.upf.edu/api/v1'
        },
        {
          type: 'heading',
          text: 'Endpoints',
          id: 'endpoints'
        },
        {
          type: 'definitions',
          items: [
            { term: 'POST /compute/standard', definition: 'Compute error metrics for standard modulations ([[concepts/modulation#pam|PAM]], [[concepts/modulation#psk|PSK]], [[concepts/modulation#qam|QAM]])' },
            { term: 'POST /compute/custom', definition: 'Compute error metrics for [[concepts/probabilistic-shaping#custom-constellations|custom constellation]] points' },
            { term: 'GET /health', definition: 'Health check endpoint' }
          ]
        },
        {
          type: 'heading',
          text: 'Key Features',
          id: 'features'
        },
        {
          type: 'list',
          items: [
            '**Polymorphic parameters**: Each numeric parameter accepts single values, arrays, or ranges',
            '**Multi-dimensional sweeps**: Combine multiple varying parameters (Cartesian product)',
            '**Flexible output**: Choose which metrics to compute and response format (flat or matrix)',
            '**Caching**: Results are cached for faster repeated queries',
            '**Cancellation**: Long-running computations can be cancelled'
          ]
        },
        {
          type: 'heading',
          text: 'Interactive Documentation',
          id: 'swagger'
        },
        {
          type: 'paragraph',
          text: 'Full interactive API documentation is available at the Swagger UI:'
        },
        {
          type: 'code',
          language: 'text',
          code: '/docs'
        },
        {
          type: 'note',
          text: 'The Swagger UI lets you try API calls directly from your browser with auto-generated examples!',
          variant: 'info'
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/error-exponent', label: 'Error Exponent E₀(ρ)', description: 'The main metric computed by the API' },
            { path: 'concepts/modulation', label: 'Modulation Schemes', description: 'Understanding PAM, PSK, and QAM' },
            { path: 'concepts/awgn-channel', label: 'AWGN Channel & SNR', description: 'The channel model underlying all computations' }
          ]
        }
      ]
    },

    'parameters': {
      title: 'Parameter Formats',
      subtitle: 'Understanding the polymorphic parameter system',
      sections: [
        {
          type: 'paragraph',
          text: 'The API uses a polymorphic parameter system where each numeric parameter can be specified in four different ways. This enables everything from single-point calculations to complex multi-dimensional sweeps with a single API call.'
        },
        {
          type: 'heading',
          text: 'The Four Parameter Formats',
          id: 'formats'
        },
        // Format 1: Single Value
        {
          type: 'heading',
          text: '1. Single Value',
          id: 'single-value'
        },
        {
          type: 'paragraph',
          text: 'The simplest format — just provide a number:'
        },
        {
          type: 'code',
          language: 'json',
          code: '"SNR": 10'
        },
        {
          type: 'paragraph',
          text: 'Use this when you want to compute at exactly one value for this parameter.'
        },
        // Format 2: Array
        {
          type: 'heading',
          text: '2. Array of Values',
          id: 'array'
        },
        {
          type: 'paragraph',
          text: 'Provide an explicit list of values to compute:'
        },
        {
          type: 'code',
          language: 'json',
          code: '"SNR": [0, 5, 10, 15, 20]'
        },
        {
          type: 'paragraph',
          text: 'Use this when you need specific non-uniform values, like [1, 2, 4, 8, 16] for comparing different modulation orders.'
        },
        // Format 3: Range with Step
        {
          type: 'heading',
          text: '3. Range with Step',
          id: 'range-step'
        },
        {
          type: 'paragraph',
          text: 'Generate values from min to max with a fixed step (like Python\'s `range` or NumPy\'s `arange`):'
        },
        {
          type: 'code',
          language: 'json',
          code: '"SNR": { "min": 0, "max": 20, "step": 2 }'
        },
        {
          type: 'paragraph',
          text: 'This generates: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]. Use this when you need uniform spacing with a specific step size.'
        },
        // Format 4: Range with Points
        {
          type: 'heading',
          text: '4. Range with Points',
          id: 'range-points'
        },
        {
          type: 'paragraph',
          text: 'Generate exactly N evenly-spaced values between min and max (like NumPy\'s `linspace`):'
        },
        {
          type: 'code',
          language: 'json',
          code: '"SNR": { "min": 0, "max": 20, "points": 11 }'
        },
        {
          type: 'paragraph',
          text: 'This generates: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]. Use this when you need a specific number of points, common for plotting.'
        },
        // Cartesian Product
        {
          type: 'heading',
          text: 'Multi-Parameter Sweeps',
          id: 'cartesian'
        },
        {
          type: 'paragraph',
          text: 'When multiple parameters have multiple values, the API computes the Cartesian product — all combinations. For example:'
        },
        {
          type: 'code',
          language: 'json',
          code: '{\n  "M": [4, 16, 64],\n  "SNR": { "min": 0, "max": 20, "points": 5 }\n}'
        },
        {
          type: 'paragraph',
          text: 'This computes 3 × 5 = 15 points: all combinations of M ∈ {4, 16, 64} and SNR ∈ {0, 5, 10, 15, 20}.'
        },
        {
          type: 'note',
          text: 'Maximum 10,000 total points per request. Maximum 1,000 values per individual parameter.',
          variant: 'warning'
        },
        // Parameter Reference
        {
          type: 'heading',
          text: 'Parameter Reference',
          id: 'reference'
        },
        {
          type: 'paragraph',
          text: '**Standard modulation parameters:**'
        },
        {
          type: 'definitions',
          items: [
            { term: 'M', definition: '[[concepts/modulation|Modulation order]]. Range: 2–64. Default: 4' },
            { term: 'typeModulation', definition: '[[concepts/modulation|Modulation type]]: "[[concepts/modulation#pam|PAM]]", "[[concepts/modulation#psk|PSK]]", or "[[concepts/modulation#qam|QAM]]". Default: "QAM"' },
            { term: 'SNR', definition: '[[concepts/awgn-channel#snr|Signal-to-noise ratio]]. Range: -30 to 10²⁰ (depends on unit). Default: 10' },
            { term: 'R', definition: '[[concepts/error-exponent#code-rate|Code rate]]. Range: 0 to 10²⁰. Default: 0.5' },
            { term: 'N', definition: '[[concepts/numerical-methods#gauss-hermite|Gauss-Hermite quadrature]] order. Range: 2–40. Default: 20' },
            { term: 'n', definition: '[[concepts/error-exponent#block-length|Block length]] (codeword length). Range: 1 to 1,000,000. Default: 128' },
            { term: 'threshold', definition: '[[concepts/optimization-algorithms|Convergence threshold]] for optimization. Range: 10⁻¹⁵ to 0.1. Default: 10⁻⁹' }
          ]
        },
        {
          type: 'paragraph',
          text: '**Options:**'
        },
        {
          type: 'definitions',
          items: [
            { term: 'snrUnit', definition: '"dB" (default) or "linear". Determines how SNR values are interpreted.' },
            { term: 'metrics', definition: 'Array of metrics to compute. Default: ["error_probability", "error_exponent"]' },
            { term: 'format', definition: '"flat" (default) or "matrix". Response format for multi-dimensional results.' }
          ]
        },
        // Metrics
        {
          type: 'heading',
          text: 'Available Metrics',
          id: 'metrics'
        },
        {
          type: 'definitions',
          items: [
            { term: 'error_probability', definition: 'Pₑ — [[concepts/error-exponent#error-probability|Probability of decoding error]]' },
            { term: 'error_exponent', definition: 'E₀(ρ) — [[concepts/error-exponent#e0-formula|Random coding error exponent]] (bits)' },
            { term: 'optimal_rho', definition: 'ρ* — [[concepts/error-exponent#rho|Optimal Gallager parameter]]' },
            { term: 'mutual_information', definition: 'I(X;Y) — [[concepts/mutual-information#mutual-info|Channel mutual information]] (bits/symbol)' },
            { term: 'cutoff_rate', definition: 'R₀ — [[concepts/mutual-information#cutoff-rate|Cutoff rate]] (bits/symbol)' },
            { term: 'critical_rate', definition: 'Rᶜʳⁱᵗ — [[concepts/mutual-information#critical-rate|Critical rate]] (bits/symbol)' }
          ]
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/error-exponent', label: 'Error Exponent Formula', description: 'Mathematical derivation of E₀(ρ) and its parameters' },
            { path: 'concepts/numerical-methods', label: 'Gauss-Hermite Quadrature', description: 'How the N parameter affects computation accuracy' },
            { path: 'concepts/mutual-information', label: 'Mutual Information & Cutoff Rate', description: 'Understanding the metrics returned by the API' }
          ]
        }
      ]
    },

    'standard': {
      title: 'Standard Modulation Endpoint',
      subtitle: 'POST /api/v1/compute/standard',
      sections: [
        {
          type: 'paragraph',
          text: 'Computes [[concepts/error-exponent#e0-formula|error metrics]] for standard digital [[concepts/modulation|modulation schemes]]: [[concepts/modulation#pam|PAM]] (Pulse Amplitude Modulation), [[concepts/modulation#psk|PSK]] (Phase Shift Keying), and [[concepts/modulation#qam|QAM]] (Quadrature Amplitude Modulation).'
        },
        {
          type: 'heading',
          text: 'Request Format',
          id: 'request'
        },
        {
          type: 'code',
          language: 'json',
          code: '{\n  "M": 16,\n  "typeModulation": "QAM",\n  "SNR": { "min": 0, "max": 20, "points": 21 },\n  "R": 0.5,\n  "N": 20,\n  "n": 128,\n  "threshold": 1e-9,\n  "snrUnit": "dB",\n  "metrics": ["error_probability", "error_exponent", "mutual_information"],\n  "format": "flat"\n}'
        },
        {
          type: 'heading',
          text: 'Response Format (flat)',
          id: 'response-flat'
        },
        {
          type: 'code',
          language: 'json',
          code: '{\n  "format": "flat",\n  "axes": [\n    { "name": "SNR", "values": [0, 1, 2, ...], "unit": "dB" }\n  ],\n  "results": [\n    {\n      "params": { "SNR": 0, "M": 16, "R": 0.5, ... },\n      "metrics": {\n        "error_probability": 0.156,\n        "error_exponent": 0.023,\n        "mutual_information": 1.245\n      },\n      "cached": false,\n      "computation_time_ms": 45.2\n    },\n    ...\n  ],\n  "meta": {\n    "total_points": 21,\n    "cached_points": 0,\n    "total_computation_time_ms": 892.5\n  }\n}'
        },
        {
          type: 'heading',
          text: 'Optional Parameters & Defaults',
          id: 'defaults'
        },
        {
          type: 'paragraph',
          text: 'Three parameters are optional and will use sensible defaults if omitted:'
        },
        {
          type: 'definitions',
          items: [
            { term: 'snrUnit', definition: 'Default: "dB". Set to "linear" if providing SNR as a power ratio instead of decibels.' },
            { term: 'metrics', definition: 'Default: ["error_probability", "error_exponent"]. Available metrics: error_probability, error_exponent, optimal_rho, mutual_information, cutoff_rate, critical_rate.' },
            { term: 'format', definition: 'Default: "flat". Response format — "flat" returns a simple list of results, "matrix" returns nested arrays matching the parameter grid structure.' }
          ]
        },
        {
          type: 'note',
          text: 'The examples below omit these optional parameters for brevity — they use the defaults shown above.',
          variant: 'info'
        },
        {
          type: 'heading',
          text: 'Example: Single Point Calculation',
          id: 'example-single'
        },
        {
          type: 'paragraph',
          text: 'Compute error exponent for 16-QAM at SNR = 10 dB:'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST https://epcalculator.matcom.sb.upf.edu/api/v1/compute/standard \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "M": 16,\n    "typeModulation": "QAM",\n    "SNR": 10,\n    "R": 0.5,\n    "N": 20,\n    "n": 128,\n    "threshold": 1e-9\n  }\''
        },
        {
          type: 'heading',
          text: 'Example: SNR Sweep for Plotting',
          id: 'example-sweep'
        },
        {
          type: 'paragraph',
          text: 'Compute error probability vs SNR curve with 51 points from 0 to 25 dB:'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST https://epcalculator.matcom.sb.upf.edu/api/v1/compute/standard \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "M": 16,\n    "typeModulation": "QAM",\n    "SNR": { "min": 0, "max": 25, "points": 51 },\n    "R": 0.5,\n    "N": 20,\n    "n": 128,\n    "threshold": 1e-9,\n    "metrics": ["error_probability"]\n  }\''
        },
        {
          type: 'heading',
          text: 'Example: Compare Modulation Orders',
          id: 'example-compare'
        },
        {
          type: 'paragraph',
          text: 'Compare 4-QAM, 16-QAM, and 64-QAM across an SNR range:'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST https://epcalculator.matcom.sb.upf.edu/api/v1/compute/standard \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "M": [4, 16, 64],\n    "typeModulation": "QAM",\n    "SNR": { "min": 0, "max": 30, "points": 31 },\n    "R": 0.5,\n    "N": 20,\n    "n": 128,\n    "threshold": 1e-9\n  }\''
        },
        {
          type: 'note',
          text: 'This returns 3 × 31 = 93 points — all combinations of M and SNR values.',
          variant: 'info'
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/modulation', label: 'Modulation Schemes', description: 'Deep dive into PAM, PSK, and QAM constellation diagrams' },
            { path: 'concepts/awgn-channel', label: 'AWGN Channel', description: 'Understanding SNR and the Gaussian channel model' },
            { path: 'concepts/error-exponent', label: 'Error Exponent E₀(ρ)', description: 'What the returned metrics mean' }
          ]
        }
      ]
    },

    'custom': {
      title: 'Custom Constellation Endpoint',
      subtitle: 'POST /api/v1/compute/custom',
      sections: [
        {
          type: 'paragraph',
          text: 'Computes [[concepts/error-exponent#e0-formula|error metrics]] for user-defined [[concepts/probabilistic-shaping#custom-constellations|constellation points]]. Each point is specified with its complex coordinates (real/imaginary) and probability, enabling [[concepts/probabilistic-shaping|probabilistic shaping]] experiments.'
        },
        {
          type: 'heading',
          text: 'Constellation Point Format',
          id: 'point-format'
        },
        {
          type: 'paragraph',
          text: 'Each constellation point has three properties:'
        },
        {
          type: 'definitions',
          items: [
            { term: 'real', definition: 'Real (in-phase) component of the symbol' },
            { term: 'imag', definition: 'Imaginary (quadrature) component of the symbol' },
            { term: 'prob', definition: 'Probability of transmitting this symbol (must sum to 1.0 across all points)' }
          ]
        },
        {
          type: 'note',
          text: 'Probabilities must sum to exactly 1.0. Minimum 2 points, maximum 256 points.',
          variant: 'warning'
        },
        {
          type: 'heading',
          text: 'Request Format',
          id: 'request'
        },
        {
          type: 'code',
          language: 'json',
          code: '{\n  "customConstellation": {\n    "points": [\n      { "real": 1, "imag": 0, "prob": 0.5 },\n      { "real": -1, "imag": 0, "prob": 0.5 }\n    ]\n  },\n  "SNR": { "min": 0, "max": 15, "points": 16 },\n  "R": 0.5,\n  "N": 20,\n  "n": 128,\n  "threshold": 1e-9\n}'
        },
        {
          type: 'heading',
          text: 'Optional Parameters & Defaults',
          id: 'defaults'
        },
        {
          type: 'paragraph',
          text: 'Three parameters are optional and will use sensible defaults if omitted:'
        },
        {
          type: 'definitions',
          items: [
            { term: 'snrUnit', definition: 'Default: "dB". Set to "linear" if providing SNR as a power ratio instead of decibels.' },
            { term: 'metrics', definition: 'Default: ["error_probability", "error_exponent"]. Available metrics: error_probability, error_exponent, optimal_rho, mutual_information, cutoff_rate, critical_rate.' },
            { term: 'format', definition: 'Default: "flat". Response format — "flat" returns a simple list of results, "matrix" returns nested arrays matching the parameter grid structure.' }
          ]
        },
        {
          type: 'note',
          text: 'The examples below omit these optional parameters for brevity — they use the defaults shown above.',
          variant: 'info'
        },
        {
          type: 'heading',
          text: 'Example: BPSK Constellation',
          id: 'example-bpsk'
        },
        {
          type: 'paragraph',
          text: 'BPSK uses two points on the real axis with equal probability:'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST https://epcalculator.matcom.sb.upf.edu/api/v1/compute/custom \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "customConstellation": {\n      "points": [\n        { "real": 1, "imag": 0, "prob": 0.5 },\n        { "real": -1, "imag": 0, "prob": 0.5 }\n      ]\n    },\n    "SNR": { "min": 0, "max": 15, "points": 16 },\n    "R": 0.5,\n    "N": 20,\n    "n": 128,\n    "threshold": 1e-9\n  }\''
        },
        {
          type: 'heading',
          text: 'Example: 4-QAM (QPSK) Constellation',
          id: 'example-qpsk'
        },
        {
          type: 'paragraph',
          text: '4-QAM has four points at the corners of a square:'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST https://epcalculator.matcom.sb.upf.edu/api/v1/compute/custom \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "customConstellation": {\n      "points": [\n        { "real": 1, "imag": 1, "prob": 0.25 },\n        { "real": 1, "imag": -1, "prob": 0.25 },\n        { "real": -1, "imag": 1, "prob": 0.25 },\n        { "real": -1, "imag": -1, "prob": 0.25 }\n      ]\n    },\n    "SNR": 10,\n    "R": 0.5,\n    "N": 20,\n    "n": 128,\n    "threshold": 1e-9\n  }\''
        },
        {
          type: 'heading',
          text: 'Example: Non-Uniform Probabilities',
          id: 'example-nonuniform'
        },
        {
          type: 'paragraph',
          text: '[[concepts/probabilistic-shaping|Probabilistic shaping]] assigns higher probabilities to lower-energy symbols. This 4-point constellation uses [[concepts/probabilistic-shaping#maxwell-boltzmann|Maxwell-Boltzmann-like shaping]]:'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST https://epcalculator.matcom.sb.upf.edu/api/v1/compute/custom \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "customConstellation": {\n      "points": [\n        { "real": 0.5, "imag": 0.5, "prob": 0.4 },\n        { "real": 0.5, "imag": -0.5, "prob": 0.4 },\n        { "real": 1.5, "imag": 0, "prob": 0.1 },\n        { "real": -1.5, "imag": 0, "prob": 0.1 }\n      ]\n    },\n    "SNR": { "min": 0, "max": 20, "points": 21 },\n    "R": 0.5,\n    "N": 20,\n    "n": 128,\n    "threshold": 1e-9\n  }\''
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/probabilistic-shaping', label: 'Probabilistic Shaping', description: 'Understanding non-uniform probability distributions' },
            { path: 'concepts/modulation', label: 'Constellation Diagrams', description: 'How points are arranged in the complex plane' },
            { path: 'tutorials/custom-constellation', label: 'Custom Constellation Tutorial', description: 'Step-by-step guide to creating custom constellations in the UI' }
          ]
        }
      ]
    },

    'examples': {
      title: 'Practical Examples',
      subtitle: 'Copy-paste examples for common use cases',
      sections: [
        {
          type: 'paragraph',
          text: 'These examples use curl and can be run directly in your terminal. All requests go to the production server.'
        },
        {
          type: 'heading',
          text: 'Example 1: Quick Single Point',
          id: 'ex-single'
        },
        {
          type: 'paragraph',
          text: 'The simplest possible request — compute one point for [[concepts/modulation#qam|16-QAM]] at 10 dB:'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST https://epcalculator.matcom.sb.upf.edu/api/v1/compute/standard \\\n  -H "Content-Type: application/json" \\\n  -d \'{"M": 16, "typeModulation": "QAM", "SNR": 10, "R": 0.5, "N": 20, "n": 128, "threshold": 1e-9}\''
        },
        {
          type: 'heading',
          text: 'Example 2: Generate Plot Data',
          id: 'ex-plot'
        },
        {
          type: 'paragraph',
          text: 'Generate 101 points for a smooth [[concepts/error-exponent#error-probability|error probability]] vs [[concepts/awgn-channel#snr|SNR]] curve:'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST https://epcalculator.matcom.sb.upf.edu/api/v1/compute/standard \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "M": 16,\n    "typeModulation": "QAM",\n    "SNR": { "min": 0, "max": 30, "points": 101 },\n    "R": 0.5,\n    "N": 20,\n    "n": 128,\n    "threshold": 1e-9,\n    "metrics": ["error_probability"]\n  }\''
        },
        {
          type: 'heading',
          text: 'Example 3: Compare All QAM Orders',
          id: 'ex-compare-qam'
        },
        {
          type: 'paragraph',
          text: 'Compare [[concepts/modulation#qam|4-QAM through 64-QAM]] in one request (uses array format for M):'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST https://epcalculator.matcom.sb.upf.edu/api/v1/compute/standard \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "M": [4, 16, 64],\n    "typeModulation": "QAM",\n    "SNR": { "min": 0, "max": 25, "step": 1 },\n    "R": 0.5,\n    "N": 20,\n    "n": 128,\n    "threshold": 1e-9\n  }\''
        },
        {
          type: 'heading',
          text: 'Example 4: 2D Parameter Sweep',
          id: 'ex-2d'
        },
        {
          type: 'paragraph',
          text: 'Sweep both [[concepts/awgn-channel#snr|SNR]] and [[concepts/error-exponent#code-rate|code rate R]] (creates a 2D grid of results):'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST https://epcalculator.matcom.sb.upf.edu/api/v1/compute/standard \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "M": 16,\n    "typeModulation": "QAM",\n    "SNR": { "min": 0, "max": 20, "points": 21 },\n    "R": { "min": 0.1, "max": 0.9, "points": 9 },\n    "N": 20,\n    "n": 128,\n    "threshold": 1e-9,\n    "format": "matrix"\n  }\''
        },
        {
          type: 'note',
          text: 'Using format: "matrix" organizes results as a nested array matching the axes order.',
          variant: 'info'
        },
        {
          type: 'heading',
          text: 'Example 5: Get All Metrics',
          id: 'ex-all-metrics'
        },
        {
          type: 'paragraph',
          text: 'Request all available metrics at once:'
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -X POST https://epcalculator.matcom.sb.upf.edu/api/v1/compute/standard \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "M": 16,\n    "typeModulation": "QAM",\n    "SNR": 10,\n    "R": 0.5,\n    "N": 20,\n    "n": 128,\n    "threshold": 1e-9,\n    "metrics": ["error_probability", "error_exponent", "optimal_rho", "mutual_information", "cutoff_rate", "critical_rate"]\n  }\''
        },
        {
          type: 'heading',
          text: 'Example 6: Python Script',
          id: 'ex-python'
        },
        {
          type: 'paragraph',
          text: 'Complete Python example for generating and plotting data:'
        },
        {
          type: 'code',
          language: 'python',
          code: 'import requests\nimport matplotlib.pyplot as plt\n\n# Request error probability vs SNR\nresponse = requests.post(\n    "https://epcalculator.matcom.sb.upf.edu/api/v1/compute/standard",\n    json={\n        "M": 16,\n        "typeModulation": "QAM",\n        "SNR": {"min": 0, "max": 25, "points": 51},\n        "R": 0.5,\n        "N": 20,\n        "n": 128,\n        "threshold": 1e-9,\n        "metrics": ["error_probability"]\n    }\n)\n\ndata = response.json()\n\n# Extract SNR values and error probabilities\nsnr_values = data["axes"][0]["values"]\nerror_probs = [r["metrics"]["error_probability"] for r in data["results"]]\n\n# Plot\nplt.semilogy(snr_values, error_probs)\nplt.xlabel("SNR (dB)")\nplt.ylabel("Error Probability")\nplt.title("16-QAM Error Probability")\nplt.grid(True)\nplt.show()'
        },
        {
          type: 'heading',
          text: 'Example 7: JavaScript/Fetch',
          id: 'ex-javascript'
        },
        {
          type: 'code',
          language: 'javascript',
          code: 'const response = await fetch(\n  "https://epcalculator.matcom.sb.upf.edu/api/v1/compute/standard",\n  {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({\n      M: 16,\n      typeModulation: "QAM",\n      SNR: { min: 0, max: 20, points: 21 },\n      R: 0.5,\n      N: 20,\n      n: 128,\n      threshold: 1e-9\n    })\n  }\n);\n\nconst data = await response.json();\nconsole.log(`Computed ${data.meta.total_points} points`);\nconsole.log(`Total time: ${data.meta.total_computation_time_ms}ms`);'
        },
        {
          type: 'cross-reference',
          variant: 'concept',
          links: [
            { path: 'concepts/error-exponent', label: 'Error Exponent Theory', description: 'Understanding what the API computes' },
            { path: 'concepts/modulation', label: 'Modulation Schemes', description: 'PAM, PSK, and QAM explained' },
            { path: 'tutorials/line-plots', label: 'Line Plot Tutorial', description: 'Visualize API results in the EPCalculator UI' }
          ]
        }
      ]
    }
  }
};
