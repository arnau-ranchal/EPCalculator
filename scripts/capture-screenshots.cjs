#!/usr/bin/env node
/**
 * Real-Time Screenshot Capture with Spotlight Effect
 *
 * Captures FULL-PAGE screenshots from the running EPCalculator app
 * with spotlight highlighting on specific components.
 *
 * Features:
 * - Full-page screenshots (shows entire app context)
 * - Spotlight effect: dims page except target element
 * - Proper dark mode toggle via localStorage
 * - Tutorial dismissal via localStorage
 *
 * Usage:
 *   node scripts/capture-screenshots.cjs              # Capture all
 *   node scripts/capture-screenshots.cjs modulation   # Capture matching "modulation"
 *   node scripts/capture-screenshots.cjs --watch      # Watch mode
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 *   npm run dev  (app must be running)
 */

const path = require('path');
const fs = require('fs');

// Check if Playwright is available
let chromium;
try {
  chromium = require('@playwright/test').chromium;
} catch (e) {
  console.error('❌ Playwright not installed. Run:');
  console.error('   npm install -D @playwright/test');
  console.error('   npx playwright install chromium');
  process.exit(1);
}

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  outputDir: path.join(__dirname, '..', 'src', 'frontend', 'assets', 'tutorial-images'),
  viewport: { width: 1400, height: 900 },
  deviceScaleFactor: 2, // Retina quality

  // Screenshots to capture - full-page with spotlight highlighting
  screenshots: [
    // ============================================================
    // FULL PAGE WITH SPOTLIGHT - TAB NAVIGATION
    // ============================================================
    {
      name: 'tab-single-point',
      fullPage: true,
      url: '/',
      description: 'Single Point tab highlighted',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Stay on Single Point tab (first tab) and spotlight it
        { type: 'spotlight', selector: '.tab-button:nth-child(1), .tab-button:first-child, [role="tab"]:first-child' }
      ]
    },
    {
      name: 'tab-plot-mode',
      fullPage: true,
      url: '/',
      description: 'Plotting & Visualization tab highlighted',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Click Plot tab first then spotlight it
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 400 },
        { type: 'spotlight', selector: '.tab-button:nth-child(2), [role="tab"]:nth-child(2)' }
      ]
    },

    // ============================================================
    // QUICK START SCREENSHOTS - showing filled parameters
    // ============================================================
    {
      name: 'quick-start-single-point',
      fullPage: true,
      url: '/',
      description: 'Single Point form with QPSK at 10dB, ρ=0',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Fill in the example parameters: SNR=10, M=4, PSK, rho=0
        { type: 'fill', selector: '#SNR, input[name="SNR"]', value: '10' },
        { type: 'select', selector: 'select[name="SNRUnit"], .snr-unit', value: 'dB' },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'fill', selector: '#rho, input[name="rho"]', value: '0' },
        { type: 'wait', ms: 400 },
        // Spotlight the entire parameter form
        { type: 'spotlight', selector: '.parameter-form, .simulation-parameters, .basic-params' }
      ]
    },
    {
      name: 'quick-start-plot-mode',
      fullPage: true,
      url: '/',
      description: 'Plot mode form with SNR range 0-20dB',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Switch to Plot tab
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        // The plot tab should already have sensible defaults
        // Spotlight the plotting controls
        { type: 'spotlight', selector: '.plotting-controls, .plot-controls, .parameter-form' }
      ]
    },

    // ============================================================
    // FULL PAGE WITH SPOTLIGHT - PARAMETER INPUTS
    // ============================================================
    {
      name: 'parameter-form-full',
      fullPage: true,
      url: '/',
      description: 'Full app with parameter form spotlighted',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'spotlight', selector: '.parameter-form, .simulation-parameters' }
      ]
    },
    {
      name: 'modulation-selector',
      fullPage: true,
      url: '/',
      description: 'Full app with modulation controls spotlighted (Single Point tab)',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Stay on Single Point tab (default) for getting-started tutorial
        { type: 'spotlight', selector: '.form-row:has(select), .basic-params .form-row:first-child' }
      ]
    },
    {
      name: 'snr-input',
      fullPage: true,
      url: '/',
      description: 'Full app with SNR input spotlighted',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'spotlight', selector: '.snr-input, .form-group:has(#SNR), [class*="snr"]' }
      ]
    },
    {
      name: 'compute-button',
      fullPage: true,
      url: '/',
      description: 'Full app with compute button spotlighted',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'spotlight', selector: '.compute-button, button[type="submit"], .button-primary' }
      ]
    },

    // ============================================================
    // FULL PAGE WITH SPOTLIGHT - CONSTELLATION MODAL
    // ============================================================
    {
      name: 'custom-constellation',
      fullPage: true,
      url: '/',
      description: 'Full app with entire constellation editor modal spotlighted',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Switch to Plotting & Visualization tab first
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        // Click the pencil/edit button to open constellation editor
        { type: 'click', selector: '.edit-constellation-btn, button[title*="Edit"], .pencil-btn' },
        { type: 'wait', ms: 800 },
        // Spotlight the ENTIRE modal container
        { type: 'spotlight', selector: '.modal-container' }
      ]
    },

    // Constellation button: Add Point
    {
      name: 'constellation-add-point',
      fullPage: true,
      url: '/',
      description: 'Spotlight on the Add Point button in constellation editor',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.edit-constellation-btn, button[title*="Edit"], .pencil-btn' },
        { type: 'wait', ms: 800 },
        // Spotlight the "+ Add Point" button
        { type: 'spotlight', selector: '.table-actions .button-secondary, .add-point-row button' }
      ]
    },

    // Constellation button: Polar toggle
    {
      name: 'constellation-polar-toggle',
      fullPage: true,
      url: '/',
      description: 'Spotlight on the Polar/Cartesian toggle',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.edit-constellation-btn, button[title*="Edit"], .pencil-btn' },
        { type: 'wait', ms: 800 },
        // Spotlight the Polar toggle button
        { type: 'spotlight', selector: '.polar-toggle, .plot-overlay-top-right button' }
      ]
    },

    // Constellation button: Undo/Redo
    {
      name: 'constellation-undo-redo',
      fullPage: true,
      url: '/',
      description: 'Spotlight on the Undo/Redo buttons',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.edit-constellation-btn, button[title*="Edit"], .pencil-btn' },
        { type: 'wait', ms: 800 },
        // Spotlight the undo/redo buttons container
        { type: 'spotlight', selector: '.plot-overlay-top-left' }
      ]
    },

    // Constellation button: Cancel
    {
      name: 'constellation-cancel-button',
      fullPage: true,
      url: '/',
      description: 'Spotlight on the Cancel button in modal footer',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.edit-constellation-btn, button[title*="Edit"], .pencil-btn' },
        { type: 'wait', ms: 800 },
        // Spotlight the Cancel button - it's the first .button-secondary in footer
        { type: 'spotlight', selector: '.modal-footer .button-group > .button-secondary:first-child' }
      ]
    },

    // Constellation button: Use/Normalize
    {
      name: 'constellation-use-button',
      fullPage: true,
      url: '/',
      description: 'Spotlight on the Use button in modal footer',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.edit-constellation-btn, button[title*="Edit"], .pencil-btn' },
        { type: 'wait', ms: 800 },
        // Spotlight the Use/Normalize button (the action button)
        { type: 'spotlight', selector: '.modal-footer .action-btn, .modal-footer .button-primary, .modal-footer .button-group > button:last-child' }
      ]
    },

    // I'm Feeling Lucky button (unclicked - spotlight on button)
    {
      name: 'constellation-lucky-button',
      fullPage: true,
      url: '/',
      description: 'Spotlight on the I\'m Feeling Lucky button',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.edit-constellation-btn, button[title*="Edit"], .pencil-btn' },
        { type: 'wait', ms: 800 },
        // Spotlight the Lucky button container (button + gear)
        { type: 'spotlight', selector: '.lucky-container, .lucky-btn' }
      ]
    },

    // I'm Feeling Lucky dropdown (clicked - spotlight on options)
    {
      name: 'constellation-lucky-dropdown',
      fullPage: true,
      url: '/',
      description: 'Spotlight on the I\'m Feeling Lucky options dropdown',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.edit-constellation-btn, button[title*="Edit"], .pencil-btn' },
        { type: 'wait', ms: 800 },
        // Hover over the Lucky button first to reveal the gear icon
        { type: 'hover', selector: '.lucky-btn' },
        { type: 'wait', ms: 300 },
        // Click the gear icon to open the dropdown (use JS click for visibility)
        { type: 'jsClick', selector: '.lucky-gear' },
        { type: 'wait', ms: 400 },
        // Spotlight the dropdown
        { type: 'spotlight', selector: '.lucky-dropdown' }
      ]
    },

    // Hide/Show navigation: Hide Table arrow
    {
      name: 'constellation-hide-table',
      fullPage: true,
      url: '/',
      description: 'Spotlight on the navigation arrow to hide table',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.edit-constellation-btn, button[title*="Edit"], .pencil-btn' },
        { type: 'wait', ms: 800 },
        // The nav arrows are in .nav-divider when both plot and table are visible
        // The right arrow (to hide table) is .nav-arrow-right
        { type: 'spotlight', selector: '.nav-divider .nav-arrow-right, .nav-divider:not(.nav-divider-edge) .nav-arrow:last-child' }
      ]
    },

    // Hide/Show navigation: Hide Plot arrow
    {
      name: 'constellation-hide-plot',
      fullPage: true,
      url: '/',
      description: 'Spotlight on the navigation arrow to hide plot',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.edit-constellation-btn, button[title*="Edit"], .pencil-btn' },
        { type: 'wait', ms: 800 },
        // The left arrow (to hide plot) is .nav-arrow-left
        { type: 'spotlight', selector: '.nav-divider .nav-arrow-left, .nav-divider:not(.nav-divider-edge) .nav-arrow:first-child' }
      ]
    },

    // ============================================================
    // FULL PAGE WITH SPOTLIGHT - PLOTTING
    // ============================================================
    {
      name: 'plotting-controls',
      fullPage: true,
      url: '/',
      description: 'Full app with plotting controls spotlighted',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Click Plot tab first
        { type: 'click', selector: '[data-tab="plot"], .tab-button:nth-child(2), button:has-text("Plot")' },
        { type: 'wait', ms: 300 },
        { type: 'spotlight', selector: '.plotting-controls, .plot-controls, .plotting-panel' }
      ]
    },

    // LINE PLOT WITH GENERATED RESULT
    {
      name: 'line-plot-generated',
      fullPage: true,
      url: '/',
      description: 'Line plot with generated E₀ curve showing results',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Switch to Plot tab
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        // Use simpler modulation (QPSK) for faster computation
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        // Click the Compute/Generate Plot button
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        // Wait longer for computation to complete (WASM/backend can be slow)
        { type: 'wait', ms: 15000 },
        // Spotlight the plots section containing the generated chart
        { type: 'spotlight', selector: '.plot-item, .plots-grid, .plots-section' }
      ]
    },

    // EXPORT BUTTON - On multiline plot (showing export button)
    {
      name: 'line-plot-export-button',
      fullPage: true,
      url: '/',
      description: 'Export button highlighted on a multiline plot',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Switch to Plot tab
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        // Generate first plot (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 },
        // Change to 8-PSK and generate second plot
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        // Wait for merge modal
        { type: 'wait', ms: 16000 },
        { type: 'waitForSelector', selector: '.modal-container, .modal-backdrop' },
        { type: 'wait', ms: 500 },
        // Click Merge button
        { type: 'click', selector: '.modal-footer .btn-primary, .modal-footer button:last-child' },
        { type: 'wait', ms: 2000 },
        // Spotlight the export button area
        { type: 'spotlight', selector: '[data-tutorial="export"], .export-trigger, .plot-exporter' }
      ]
    },

    // EXPORT MENU - On multiline plot (showing export options)
    {
      name: 'line-plot-export-menu',
      fullPage: true,
      url: '/',
      description: 'Export menu open on multiline plot showing all format options',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Switch to Plot tab
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        // Generate first plot (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 },
        // Change to 8-PSK and generate second plot
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        // Wait for merge modal
        { type: 'wait', ms: 16000 },
        { type: 'waitForSelector', selector: '.modal-container, .modal-backdrop' },
        { type: 'wait', ms: 500 },
        // Click Merge button
        { type: 'click', selector: '.modal-footer .btn-primary, .modal-footer button:last-child' },
        { type: 'wait', ms: 2000 },
        // Click the export button to open the menu
        { type: 'click', selector: '.export-trigger' },
        { type: 'wait', ms: 500 },
        // Spotlight the export menu
        { type: 'spotlight', selector: '.export-menu, .export-menu-container' }
      ]
    },

    // MULTILINE PLOT WORKFLOW - Step 1: First plot generated (no spotlight)
    {
      name: 'line-plot-step1-complete',
      fullPage: true,
      url: '/',
      description: 'First plot (QPSK) generated, showing full interface without highlights',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Switch to Plot tab
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        // Generate first plot (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 }
        // No spotlight - show full interface
      ]
    },

    // MULTILINE PLOT WORKFLOW - Step 2: Change parameters for second plot
    {
      name: 'line-plot-step2-params',
      fullPage: true,
      url: '/',
      description: 'After first plot, changing modulation to 8-PSK for second curve',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Switch to Plot tab
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        // Generate first plot (QPSK)
        { type: 'select', selector: '#ref-M, #M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#ref-type, #typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 },
        // Now change to 8-PSK for the second plot
        { type: 'select', selector: '#ref-M, #M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 300 },
        // Spotlight the param-row containing the M dropdown (showing M=8)
        { type: 'spotlight', selector: '.param-row:has(#ref-M), .param-reference .param-row:first-of-type' }
      ]
    },

    // MULTILINE PLOT WORKFLOW - Step 3: Merge confirmation modal
    {
      name: 'line-plot-merge-modal',
      fullPage: true,
      url: '/',
      description: 'Merge confirmation modal asking to merge or create new figure',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Switch to Plot tab
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        // Generate first plot (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 },
        // Change to 8-PSK and generate second plot
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        // Wait for merge modal to appear
        { type: 'wait', ms: 16000 },
        { type: 'waitForSelector', selector: '.modal-container, .modal-backdrop' },
        { type: 'wait', ms: 500 },
        // Spotlight the merge modal
        { type: 'spotlight', selector: '.modal-container' }
      ]
    },

    // MULTILINE PLOT WORKFLOW - Step 4: Final merged multiline plot
    {
      name: 'line-plot-multiline',
      fullPage: true,
      url: '/',
      description: 'Merged plot showing both QPSK and 8-PSK curves together',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Switch to Plot tab
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        // Generate first plot (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 },
        // Change to 8-PSK and generate second plot
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        // Wait for merge modal
        { type: 'wait', ms: 16000 },
        { type: 'waitForSelector', selector: '.modal-container, .modal-backdrop' },
        { type: 'wait', ms: 500 },
        // Click Merge button (the primary button)
        { type: 'click', selector: '.modal-footer .btn-primary, .modal-footer button:last-child' },
        // Wait for merge to complete and plot to update
        { type: 'wait', ms: 2000 },
        // Spotlight the merged plot showing multiple curves
        { type: 'spotlight', selector: '.plot-item, .plots-grid' }
      ]
    },

    // ============================================================
    // PLOT INTERACTION SCREENSHOTS - Hover effects
    // ============================================================
    // Hover on legend - highlights the corresponding curve
    {
      name: 'line-plot-hover-legend',
      fullPage: true,
      url: '/',
      description: 'Hovering over legend entry highlights the corresponding curve',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 },
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 16000 },
        { type: 'waitForSelector', selector: '.modal-container, .modal-backdrop' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.modal-footer .btn-primary, .modal-footer button:last-child' },
        { type: 'wait', ms: 2000 },
        // Hover over the first legend entry (series-item)
        { type: 'hover', selector: '.series-list .series-item:first-child, .series-items .series-item:first-child' },
        { type: 'wait', ms: 500 }
        // No spotlight - the hover effect IS the visual highlight
      ]
    },

    // Hover on plot - shows tooltip with coordinates
    {
      name: 'line-plot-hover-point',
      fullPage: true,
      url: '/',
      description: 'Hovering on plot shows tooltip with coordinates',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 },
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 16000 },
        { type: 'waitForSelector', selector: '.modal-container, .modal-backdrop' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.modal-footer .btn-primary, .modal-footer button:last-child' },
        { type: 'wait', ms: 2000 },
        // Hover on the plot area to trigger tooltip - target middle of plot SVG
        { type: 'hoverCoordinates', selector: '.plot-content svg', offsetX: 0.5, offsetY: 0.5 },
        { type: 'wait', ms: 500 }
        // No spotlight - the tooltip IS the visual highlight
      ]
    },

    // ============================================================
    // AXIS CONFIGURATION SCREENSHOTS - Using multiline plot
    // ============================================================
    // Axis config: Default linear scales (no spotlight, just showing the plot)
    {
      name: 'line-plot-axis-linear',
      fullPage: true,
      url: '/',
      description: 'Multiline plot with default linear X and Y scales',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 },
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 16000 },
        { type: 'waitForSelector', selector: '.modal-container, .modal-backdrop' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.modal-footer .btn-primary, .modal-footer button:last-child' },
        { type: 'wait', ms: 2000 },
        // Spotlight the scale buttons group
        { type: 'spotlight', selector: '.plot-controls-header, .plot-item .plot-controls-header' }
      ]
    },

    // Axis config: Log Y scale
    {
      name: 'line-plot-axis-log-y',
      fullPage: true,
      url: '/',
      description: 'Multiline plot with logarithmic Y scale',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 },
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 16000 },
        { type: 'waitForSelector', selector: '.modal-container, .modal-backdrop' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.modal-footer .btn-primary, .modal-footer button:last-child' },
        { type: 'wait', ms: 2000 },
        // Click the Y-axis scale toggle to switch to log
        { type: 'click', selector: '[data-tutorial="scale-y"], .log-toggle:last-of-type' },
        { type: 'wait', ms: 500 },
        // Spotlight the Y-axis scale button
        { type: 'spotlight', selector: '[data-tutorial="scale-y"]' }
      ]
    },

    // Axis config: Log X scale (dB mode for SNR)
    {
      name: 'line-plot-axis-log-x',
      fullPage: true,
      url: '/',
      description: 'Multiline plot with logarithmic X scale (linear SNR units)',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 },
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 16000 },
        { type: 'waitForSelector', selector: '.modal-container, .modal-backdrop' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.modal-footer .btn-primary, .modal-footer button:last-child' },
        { type: 'wait', ms: 2000 },
        // Click the X-axis scale toggle (toggles between dB and linear)
        { type: 'click', selector: '[data-tutorial="scale-x"]' },
        { type: 'wait', ms: 500 },
        // Spotlight the X-axis scale button
        { type: 'spotlight', selector: '[data-tutorial="scale-x"]' }
      ]
    },

    // Axis config: Transpose (swap X and Y)
    {
      name: 'line-plot-axis-transpose',
      fullPage: true,
      url: '/',
      description: 'Multiline plot with transposed axes (E₀ on X, SNR on Y)',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 15000 },
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 16000 },
        { type: 'waitForSelector', selector: '.modal-container, .modal-backdrop' },
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.modal-footer .btn-primary, .modal-footer button:last-child' },
        { type: 'wait', ms: 2000 },
        // Click the transpose button
        { type: 'click', selector: '[data-tutorial="transpose"], .transpose-button' },
        { type: 'wait', ms: 500 },
        // Spotlight the transpose button
        { type: 'spotlight', selector: '[data-tutorial="transpose"], .transpose-button' }
      ]
    },

    // ============================================================
    // CONTOUR PLOT SCREENSHOTS
    // ============================================================
    // CONTOUR PLOT - Generated result
    {
      name: 'contour-plot-generated',
      fullPage: true,
      url: '/',
      description: 'Generated contour plot showing E₀ across SNR and ρ',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        // Switch to Plot tab
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        // Select contour plot mode
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'contour' },
        { type: 'wait', ms: 300 },
        // Use QPSK for faster computation
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        // Click Compute button
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        // Wait for computation (contour takes longer)
        { type: 'wait', ms: 20000 },
        // Spotlight the generated contour plot
        { type: 'spotlight', selector: '.plot-item, .plots-grid' }
      ]
    },

    // CONTOUR PLOT WORKFLOW - Step 1: First plot complete
    {
      name: 'contour-plot-step1-complete',
      fullPage: true,
      url: '/',
      description: 'First contour plot (QPSK) generated with interface visible',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'contour' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 }
        // No spotlight - show full interface
      ]
    },

    // CONTOUR PLOT WORKFLOW - Step 2: Changing parameters for second plot
    {
      name: 'contour-plot-step2-params',
      fullPage: true,
      url: '/',
      description: 'Changing modulation to 8-PSK for second contour plot',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'contour' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Change to 8-PSK
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 300 },
        // Spotlight the modulation param row
        { type: 'spotlight', selector: '.param-row:has(#ref-M), .param-reference .param-row:first-of-type' }
      ]
    },

    // CONTOUR PLOT WORKFLOW - Step 3: Two plots with checkboxes visible
    {
      name: 'contour-plot-checkbox-selection',
      fullPage: true,
      url: '/',
      description: 'Two contour plots with selection checkboxes visible',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'contour' },
        { type: 'wait', ms: 300 },
        // Generate first plot (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Generate second plot (8-PSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Wait for checkboxes to appear (they show when 2+ contour plots exist)
        { type: 'waitForSelector', selector: '[data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Click first checkbox using JS click for reliability
        { type: 'jsClick', selector: '[data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Spotlight the checkbox area
        { type: 'spotlight', selector: '[data-tutorial="contour-checkbox"]' }
      ]
    },

    // CONTOUR PLOT WORKFLOW - Step 4: Action bar with Compare/Benchmark buttons
    {
      name: 'contour-plot-action-bar',
      fullPage: true,
      url: '/',
      description: 'Action bar showing Compare and Benchmark buttons after selecting two plots',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'contour' },
        { type: 'wait', ms: 300 },
        // Generate first plot (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Generate second plot (8-PSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Wait for checkboxes to appear
        { type: 'waitForSelector', selector: '[data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Select both plots using JS clicks (nth-of-type works in evaluate context)
        { type: 'jsClick', selector: '.plots-grid .plot-item:first-of-type [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        { type: 'jsClick', selector: '.plots-grid .plot-item:nth-of-type(2) [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Wait for action bar to appear with .visible class
        { type: 'waitForSelector', selector: '.action-bar.visible' },
        { type: 'wait', ms: 300 },
        // Spotlight the action bar at the bottom
        { type: 'spotlight', selector: '.action-bar' }
      ]
    },

    // CONTOUR PLOT - Comparison result (2D difference)
    {
      name: 'contour-plot-comparison',
      fullPage: true,
      url: '/',
      description: 'Side-by-side comparison of two contour plots showing differences',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'contour' },
        { type: 'wait', ms: 300 },
        // Generate first plot (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Generate second plot (8-PSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Wait for checkboxes to appear
        { type: 'waitForSelector', selector: '[data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Select both plots
        { type: 'jsClick', selector: '.plots-grid .plot-item:first-of-type [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        { type: 'jsClick', selector: '.plots-grid .plot-item:nth-of-type(2) [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Wait for action bar and click Comparison button
        { type: 'waitForSelector', selector: '.action-bar.visible' },
        { type: 'wait', ms: 300 },
        { type: 'click', selector: '.comparison-btn:not([disabled])' },
        { type: 'wait', ms: 5000 },
        // Wait for the 3rd plot (comparison result) to appear
        { type: 'waitForSelector', selector: '.plots-grid .plot-item:nth-of-type(3)' },
        { type: 'wait', ms: 1000 },
        // Scroll the 3rd plot into view and spotlight it
        { type: 'scrollIntoView', selector: '.plots-grid .plot-item:nth-of-type(3)' },
        { type: 'wait', ms: 500 },
        { type: 'spotlight', selector: '.plots-grid .plot-item:nth-of-type(3)' }
      ]
    },

    // CONTOUR PLOT - Benchmark result (3D overlay)
    {
      name: 'contour-plot-benchmark',
      fullPage: true,
      url: '/',
      description: '3D benchmark overlay of multiple contour plots',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'contour' },
        { type: 'wait', ms: 300 },
        // Generate first plot (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Generate second plot (8-PSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Wait for checkboxes to appear
        { type: 'waitForSelector', selector: '[data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Select both plots
        { type: 'jsClick', selector: '.plots-grid .plot-item:first-of-type [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        { type: 'jsClick', selector: '.plots-grid .plot-item:nth-of-type(2) [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Wait for action bar and click Benchmark button
        { type: 'waitForSelector', selector: '.action-bar.visible' },
        { type: 'wait', ms: 300 },
        { type: 'click', selector: '.benchmark-btn:not([disabled])' },
        { type: 'wait', ms: 5000 },
        // Wait for the 3rd plot (benchmark result) to appear
        { type: 'waitForSelector', selector: '.plots-grid .plot-item:nth-of-type(3)' },
        { type: 'wait', ms: 1000 },
        // Scroll the 3rd plot into view and spotlight it
        { type: 'scrollIntoView', selector: '.plots-grid .plot-item:nth-of-type(3)' },
        { type: 'wait', ms: 500 },
        { type: 'spotlight', selector: '.plots-grid .plot-item:nth-of-type(3)' }
      ]
    },

    // CONTOUR PLOT - Hover tooltip
    {
      name: 'contour-plot-hover',
      fullPage: true,
      url: '/',
      description: 'Hovering on contour plot shows tooltip with SNR, ρ, and E₀ values',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'contour' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Hover on the plot area to trigger tooltip
        { type: 'hoverCoordinates', selector: '.plot-content svg', offsetX: 0.5, offsetY: 0.5 },
        { type: 'wait', ms: 500 }
        // No spotlight - the tooltip IS the visual highlight
      ]
    },

    // CONTOUR PLOT - Export button
    {
      name: 'contour-plot-export-button',
      fullPage: true,
      url: '/',
      description: 'Export button highlighted on a contour plot',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'contour' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Spotlight the export button
        { type: 'spotlight', selector: '[data-tutorial="export"], .export-trigger, .plot-exporter' }
      ]
    },

    // CONTOUR PLOT - Export menu open
    {
      name: 'contour-plot-export-menu',
      fullPage: true,
      url: '/',
      description: 'Export menu open on contour plot showing format options',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'contour' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 20000 },
        // Click the export button to open the menu
        { type: 'click', selector: '.export-trigger' },
        { type: 'wait', ms: 500 },
        // Spotlight the export menu
        { type: 'spotlight', selector: '.export-menu, .export-menu-container' }
      ]
    },

    // ============================================================
    // 3D SURFACE PLOTS - Follows same workflow as contour plots
    // ============================================================

    // SURFACE PLOT - Single generated 3D surface
    {
      name: 'surface-plot-generated',
      fullPage: true,
      url: '/',
      description: '3D surface plot showing error exponent landscape',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'surface' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        { type: 'spotlight', selector: '.plot-item' }
      ]
    },

    // SURFACE PLOT - Step 1 complete (first surface generated)
    {
      name: 'surface-plot-step1-complete',
      fullPage: true,
      url: '/',
      description: 'First 3D surface generated (QPSK), ready for comparison workflow',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'surface' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        { type: 'spotlight', selector: '.plots-grid' }
      ]
    },

    // SURFACE PLOT - Step 2 params (setting up second surface)
    {
      name: 'surface-plot-step2-params',
      fullPage: true,
      url: '/',
      description: 'Setting parameters for second 3D surface (8-PSK)',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'surface' },
        { type: 'wait', ms: 300 },
        // Generate first plot
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        // Now change M to 8 to show we're setting up second plot
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 300 },
        // Spotlight the controls to show parameter change
        { type: 'spotlight', selector: '.plotting-controls, .control-panel' }
      ]
    },

    // SURFACE PLOT - Checkbox selection (one surface selected)
    {
      name: 'surface-plot-checkbox-selection',
      fullPage: true,
      url: '/',
      description: 'Two 3D surfaces with selection checkboxes visible',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'surface' },
        { type: 'wait', ms: 300 },
        // Generate first plot (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        // Generate second plot (8-PSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        // Wait for checkboxes to appear
        { type: 'waitForSelector', selector: '[data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Select first plot
        { type: 'jsClick', selector: '[data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Spotlight the checkbox
        { type: 'spotlight', selector: '[data-tutorial="contour-checkbox"]' }
      ]
    },

    // SURFACE PLOT - Action bar (2 surfaces selected)
    {
      name: 'surface-plot-action-bar',
      fullPage: true,
      url: '/',
      description: 'Action bar showing Compare and Benchmark buttons for 3D surfaces',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'surface' },
        { type: 'wait', ms: 300 },
        // Generate first plot
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        // Generate second plot
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        // Wait for checkboxes
        { type: 'waitForSelector', selector: '[data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Select both plots
        { type: 'jsClick', selector: '.plots-grid .plot-item:first-of-type [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        { type: 'jsClick', selector: '.plots-grid .plot-item:nth-of-type(2) [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Wait for action bar and spotlight it
        { type: 'waitForSelector', selector: '.action-bar.visible' },
        { type: 'wait', ms: 300 },
        { type: 'spotlight', selector: '.action-bar' }
      ]
    },

    // SURFACE PLOT - Comparison result (3D difference surface)
    {
      name: 'surface-plot-comparison',
      fullPage: true,
      url: '/',
      description: '3D difference surface showing comparison between two surfaces',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'surface' },
        { type: 'wait', ms: 300 },
        // Generate first plot
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        // Generate second plot
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        // Wait for checkboxes
        { type: 'waitForSelector', selector: '[data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Select both plots
        { type: 'jsClick', selector: '.plots-grid .plot-item:first-of-type [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        { type: 'jsClick', selector: '.plots-grid .plot-item:nth-of-type(2) [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Click Comparison
        { type: 'waitForSelector', selector: '.action-bar.visible' },
        { type: 'wait', ms: 300 },
        { type: 'click', selector: '.comparison-btn:not([disabled])' },
        { type: 'wait', ms: 5000 },
        // Wait for 3rd plot and spotlight it
        { type: 'waitForSelector', selector: '.plots-grid .plot-item:nth-of-type(3)' },
        { type: 'wait', ms: 1000 },
        { type: 'scrollIntoView', selector: '.plots-grid .plot-item:nth-of-type(3)' },
        { type: 'wait', ms: 500 },
        { type: 'spotlight', selector: '.plots-grid .plot-item:nth-of-type(3)' }
      ]
    },

    // SURFACE PLOT - Benchmark result (3D overlay)
    {
      name: 'surface-plot-benchmark',
      fullPage: true,
      url: '/',
      description: '3D benchmark overlay showing multiple surfaces together',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'surface' },
        { type: 'wait', ms: 300 },
        // Generate first plot
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        // Generate second plot
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        // Wait for checkboxes
        { type: 'waitForSelector', selector: '[data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Select both plots
        { type: 'jsClick', selector: '.plots-grid .plot-item:first-of-type [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        { type: 'jsClick', selector: '.plots-grid .plot-item:nth-of-type(2) [data-tutorial="contour-checkbox"]' },
        { type: 'wait', ms: 500 },
        // Click Benchmark
        { type: 'waitForSelector', selector: '.action-bar.visible' },
        { type: 'wait', ms: 300 },
        { type: 'click', selector: '.benchmark-btn:not([disabled])' },
        { type: 'wait', ms: 5000 },
        // Wait for 3rd plot and spotlight it
        { type: 'waitForSelector', selector: '.plots-grid .plot-item:nth-of-type(3)' },
        { type: 'wait', ms: 1000 },
        { type: 'scrollIntoView', selector: '.plots-grid .plot-item:nth-of-type(3)' },
        { type: 'wait', ms: 500 },
        { type: 'spotlight', selector: '.plots-grid .plot-item:nth-of-type(3)' }
      ]
    },

    // SURFACE PLOT - Export button highlighted
    {
      name: 'surface-plot-export-button',
      fullPage: true,
      url: '/',
      description: 'Export button highlighted on 3D surface plot',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'surface' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        { type: 'spotlight', selector: '[data-tutorial="export"], .export-trigger' }
      ]
    },

    // SURFACE PLOT - Export menu open
    {
      name: 'surface-plot-export-menu',
      fullPage: true,
      url: '/',
      description: 'Export menu open on 3D surface plot showing format options',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'surface' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 25000 },
        { type: 'click', selector: '.export-trigger' },
        { type: 'wait', ms: 500 },
        { type: 'spotlight', selector: '.export-menu, .export-menu-container' }
      ]
    },

    // ============================================================
    // TABLE MODE SCREENSHOTS
    // ============================================================

    // TABLE MODE - Generated table showing all metrics
    {
      name: 'table-mode-generated',
      fullPage: true,
      url: '/',
      description: 'Table showing all computed metrics (E₀, Pe, ρ*, etc.) for QPSK',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        // Select Table mode (rawData)
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'rawData' },
        { type: 'wait', ms: 300 },
        // Configure modulation
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        // Generate table
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 8000 },
        // Spotlight the table
        { type: 'spotlight', selector: '.plot-item' }
      ]
    },

    // TABLE MODE - Column headers showing all metrics
    {
      name: 'table-mode-columns',
      fullPage: true,
      url: '/',
      description: 'Table with column headers highlighted showing SNR, E₀, Pe, ρ*, MI, etc.',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'rawData' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 8000 },
        // Spotlight the table header row
        { type: 'spotlight', selector: '.plot-item table thead, .plot-item th' }
      ]
    },

    // TABLE MODE - Merge modal appearing for compatible table
    {
      name: 'table-mode-merge-modal',
      fullPage: true,
      url: '/',
      description: 'Merge modal appearing when a second compatible table is generated',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'rawData' },
        { type: 'wait', ms: 300 },
        // Generate first table (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 8000 },
        // Generate second table (8-PSK) - this triggers merge modal
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 5000 },
        // Wait for merge modal
        { type: 'waitForSelector', selector: '.merge-modal, .modal-container' },
        { type: 'wait', ms: 300 },
        // Spotlight the modal
        { type: 'spotlight', selector: '.merge-modal, .modal-container, .modal-content' }
      ]
    },

    // TABLE MODE - Merged table showing multiple modulations
    {
      name: 'table-mode-merged',
      fullPage: true,
      url: '/',
      description: 'Merged table showing QPSK and 8-PSK data side-by-side',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'rawData' },
        { type: 'wait', ms: 300 },
        // Generate first table (QPSK)
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 8000 },
        // Generate second table (8-PSK) and click merge
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 5000 },
        // Wait for merge modal and click merge button
        { type: 'waitForSelector', selector: '.merge-modal, .modal-container' },
        { type: 'wait', ms: 300 },
        { type: 'click', selector: 'button:has-text("Merge"), button:has-text("merge"), .merge-btn, button.primary' },
        { type: 'wait', ms: 3000 },
        // Spotlight the merged table
        { type: 'spotlight', selector: '.plot-item' }
      ]
    },

    // TABLE MODE - Export button highlighted
    {
      name: 'table-mode-export-button',
      fullPage: true,
      url: '/',
      description: 'Export button highlighted on table',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'rawData' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 8000 },
        { type: 'spotlight', selector: '[data-tutorial="export"], .export-trigger' }
      ]
    },

    // TABLE MODE - Export menu open
    {
      name: 'table-mode-export-menu',
      fullPage: true,
      url: '/',
      description: 'Export menu open on table showing CSV and JSON options',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 500 },
        { type: 'select', selector: '#plotType, select[name="plotType"]', value: 'rawData' },
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '#M, select[name="M"]', value: '4' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 200 },
        { type: 'click', selector: '.plot-button, .compute-button, button[type="submit"]' },
        { type: 'wait', ms: 8000 },
        { type: 'click', selector: '.export-trigger' },
        { type: 'wait', ms: 500 },
        { type: 'spotlight', selector: '.export-menu, .export-menu-container' }
      ]
    },

    // ============================================================
    // FULL PAGE WITH SPOTLIGHT - HEADER CONTROLS
    // ============================================================
    {
      name: 'theme-language',
      fullPage: true,
      url: '/',
      description: 'Full app with theme/language controls spotlighted',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
        { type: 'spotlight', selector: '.theme-selector, .language-selector, header .selector-group, header nav' }
      ]
    },

    // ============================================================
    // FULL PAGE - APP OVERVIEW (no spotlight)
    // ============================================================
    {
      name: 'app-overview',
      fullPage: true,
      url: '/',
      description: 'Full application overview (light mode)',
      waitFor: '.simulation-panel',
      setup: [
        { type: 'dismissTutorial' },
        { type: 'setTheme', darkMode: false }
      ],
      actions: [{ type: 'wait', ms: 500 }]
    },

    // ============================================================
    // FULL PAGE - DARK MODE
    // ============================================================
    {
      name: 'app-dark-mode',
      fullPage: true,
      url: '/',
      description: 'Full application in dark mode',
      waitFor: '.simulation-panel',
      setup: [
        { type: 'dismissTutorial' },
        { type: 'setTheme', darkMode: true }
      ],
      actions: [{ type: 'wait', ms: 500 }]
    },

    // ============================================================
    // VARIANT SCREENSHOTS (for specific modulation types)
    // ============================================================
    {
      name: 'modulation-selector-qam16',
      fullPage: true,
      url: '/',
      description: '16-QAM modulation selected (Plotting tab)',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 300 },
        // Switch to Plotting & Visualization tab first
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 400 },
        { type: 'select', selector: '#M, select[name="M"]', value: '16' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'QAM' },
        { type: 'wait', ms: 300 },
        { type: 'spotlight', selector: '.form-row:has(select), .modulation-controls' }
      ]
    },
    {
      name: 'modulation-selector-psk8',
      fullPage: true,
      url: '/',
      description: '8-PSK modulation selected (Plotting tab)',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 300 },
        // Switch to Plotting & Visualization tab first
        { type: 'click', selector: '.tab-button:nth-child(2)' },
        { type: 'wait', ms: 400 },
        { type: 'select', selector: '#M, select[name="M"]', value: '8' },
        { type: 'select', selector: '#typeModulation, select[name="typeModulation"]', value: 'PSK' },
        { type: 'wait', ms: 300 },
        { type: 'spotlight', selector: '.form-row:has(select), .modulation-controls' }
      ]
    },
    {
      name: 'snr-input-db',
      fullPage: true,
      url: '/',
      description: 'SNR input in dB mode',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 300 },
        { type: 'select', selector: '.snr-unit, select[name="SNRUnit"], .unit-selector', value: 'dB' },
        { type: 'fill', selector: '#SNR, input[name="SNR"]', value: '10' },
        { type: 'wait', ms: 300 },
        { type: 'spotlight', selector: '.snr-input, .form-group:has(#SNR)' }
      ]
    }
  ]
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Build URL for a screenshot config
 */
function buildUrl(screenshot) {
  return `${CONFIG.baseUrl}${screenshot.url || '/'}`;
}

/**
 * Execute an action on the page
 */
async function executeAction(page, action) {
  try {
    switch (action.type) {
      case 'click':
        // Try multiple selectors (comma-separated)
        const clickSelectors = action.selector.split(',').map(s => s.trim());
        for (const sel of clickSelectors) {
          try {
            const elem = await page.$(sel);
            if (elem) {
              await elem.click({ timeout: 3000 });
              console.log(`     ✓ Clicked: ${sel}`);
              return;
            }
          } catch (e) { /* try next */ }
        }
        console.warn(`     ⚠️ Click: no matching selector found`);
        break;

      case 'fill':
        const fillSelectors = action.selector.split(',').map(s => s.trim());
        for (const sel of fillSelectors) {
          try {
            const elem = await page.$(sel);
            if (elem) {
              await elem.fill(action.value);
              console.log(`     ✓ Filled: ${sel}`);
              return;
            }
          } catch (e) { /* try next */ }
        }
        break;

      case 'select':
        const selectSelectors = action.selector.split(',').map(s => s.trim());
        for (const sel of selectSelectors) {
          try {
            const elem = await page.$(sel);
            if (elem) {
              await elem.selectOption(action.value);
              console.log(`     ✓ Selected: ${sel} = ${action.value}`);
              return;
            }
          } catch (e) { /* try next */ }
        }
        break;

      case 'hover':
        await page.hover(action.selector);
        console.log(`     ✓ Hovered: ${action.selector}`);
        break;

      case 'hoverCoordinates':
        // Hover at specific coordinates within an element (offsetX/Y are 0-1 percentages)
        const hoverSelectors = action.selector.split(',').map(s => s.trim());
        for (const sel of hoverSelectors) {
          try {
            const elem = await page.$(sel);
            if (elem) {
              const box = await elem.boundingBox();
              if (box) {
                const x = box.x + (box.width * (action.offsetX || 0.5));
                const y = box.y + (box.height * (action.offsetY || 0.5));
                await page.mouse.move(x, y);
                console.log(`     ✓ Hovered at coordinates: ${sel} (${Math.round(x)}, ${Math.round(y)})`);
                break;
              }
            }
          } catch (e) { /* try next */ }
        }
        break;

      case 'jsClick':
        // Click via JavaScript - useful for elements that may be hidden or have CSS issues
        const jsClickSelectors = action.selector.split(',').map(s => s.trim());
        for (const sel of jsClickSelectors) {
          try {
            const clicked = await page.evaluate((selector) => {
              const el = document.querySelector(selector);
              if (el) {
                el.click();
                return true;
              }
              return false;
            }, sel);
            if (clicked) {
              console.log(`     ✓ JS Clicked: ${sel}`);
              return;
            }
          } catch (e) { /* try next */ }
        }
        console.warn(`     ⚠️ JS Click: no matching selector found`);
        break;

      case 'wait':
        await page.waitForTimeout(action.ms);
        break;

      case 'waitForSelector':
        await page.waitForSelector(action.selector, { timeout: 10000 });
        break;

      case 'scrollIntoView':
        // Scroll an element into view
        const scrollSelectors = action.selector.split(',').map(s => s.trim());
        let scrolledElement = null;
        for (const sel of scrollSelectors) {
          try {
            const elem = await page.$(sel);
            if (elem) {
              await elem.scrollIntoViewIfNeeded();
              scrolledElement = sel;
              break;
            }
          } catch (e) { /* try next */ }
        }
        if (scrolledElement) {
          console.log(`     ✓ Scrolled into view: ${scrolledElement}`);
        } else {
          console.log(`     ⚠️ ScrollIntoView: no matching selector found`);
        }
        break;

      case 'dismissTutorial':
        await page.evaluate(() => {
          const state = JSON.parse(localStorage.getItem('epcalculator_tutorial') || '{}');
          state.hasSeenWelcome = true;
          state.hasSeenPlotTutorial = true;
          state.hasSeenConstellationTutorial = true;
          state.hasSeenContourComparisonTutorial = true;  // Dismiss the contour comparison tutorial too
          localStorage.setItem('epcalculator_tutorial', JSON.stringify(state));
        });
        console.log(`     ✓ Tutorial dismissed`);
        break;

      case 'setTheme':
        await page.evaluate((darkMode) => {
          const state = JSON.parse(localStorage.getItem('theme') || '{}');
          state.darkMode = darkMode;
          localStorage.setItem('theme', JSON.stringify(state));
        }, action.darkMode);
        console.log(`     ✓ Theme set: ${action.darkMode ? 'dark' : 'light'}`);
        break;

      case 'spotlight':
        // Try multiple selectors to find the element
        const spotlightSelectors = action.selector.split(',').map(s => s.trim());
        let box = null;
        let foundSelector = null;

        for (const sel of spotlightSelectors) {
          try {
            const elem = await page.$(sel);
            if (elem) {
              box = await elem.boundingBox();
              if (box) {
                foundSelector = sel;
                break;
              }
            }
          } catch (e) { /* try next */ }
        }

        if (box && foundSelector) {
          // Add padding around the element
          const padding = 12;
          box = {
            x: Math.max(0, box.x - padding),
            y: Math.max(0, box.y - padding),
            width: box.width + padding * 2,
            height: box.height + padding * 2
          };

          // Create SVG overlay with cutout
          await page.evaluate(({ box }) => {
            // Remove any existing spotlight
            document.querySelector('.screenshot-spotlight')?.remove();

            const overlay = document.createElement('div');
            overlay.className = 'screenshot-spotlight';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99998;pointer-events:none;';
            overlay.innerHTML = `
              <svg width="100%" height="100%" style="position:absolute;top:0;left:0;">
                <defs>
                  <mask id="spotlight-mask">
                    <rect width="100%" height="100%" fill="white"/>
                    <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"
                          rx="12" ry="12" fill="black"/>
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#spotlight-mask)"/>
                <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"
                      rx="12" ry="12" fill="none" stroke="rgba(200,16,46,0.8)" stroke-width="3"/>
              </svg>
            `;
            document.body.appendChild(overlay);
          }, { box });

          console.log(`     ✓ Spotlight applied to: ${foundSelector}`);
        } else {
          console.warn(`     ⚠️ Spotlight: no matching element found for any selector`);
        }
        await page.waitForTimeout(100);
        break;
    }
  } catch (e) {
    console.warn(`     ⚠️ Action failed: ${action.type} - ${e.message}`);
  }
}

/**
 * Wait for Svelte app to fully hydrate
 */
async function waitForAppReady(page, timeout = 20000) {
  // Wait for loading overlay to disappear
  try {
    await page.waitForFunction(() => {
      const body = document.body;
      if (!body) return false;
      const text = body.innerText || '';
      // Loading overlay contains this text - wait for it to be gone
      if (text.includes('Loading modern web interface')) return false;
      if (text.includes('Loading...')) return false;
      if (text.includes('Cargando')) return false;
      // Check that we have actual content
      return body.querySelector('.simulation-panel') ||
             body.querySelector('.main-layout') ||
             body.querySelector('.app-container');
    }, { timeout });
  } catch (e) {
    console.warn(`     ⚠️ Timeout waiting for content, proceeding anyway`);
  }

  // Additional settle time for animations/transitions and i18n
  await page.waitForTimeout(800);
}

/**
 * Capture a single screenshot
 */
async function captureScreenshot(page, screenshot, index, total) {
  const url = buildUrl(screenshot);
  const outputPath = path.join(CONFIG.outputDir, `${screenshot.name}.png`);

  console.log(`[${index + 1}/${total}] 📸 ${screenshot.name}`);
  console.log(`     ${screenshot.description}`);

  try {
    // Set viewport
    const viewport = screenshot.viewport || CONFIG.viewport;
    await page.setViewportSize(viewport);

    // Navigate first (needed to access localStorage)
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });

    // Execute setup actions (after navigation to access localStorage)
    if (screenshot.setup) {
      for (const action of screenshot.setup) {
        await executeAction(page, action);
      }
      // Reload to apply localStorage changes
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    }

    // Wait for app to fully hydrate
    await waitForAppReady(page, 20000);

    // Wait for specific element if specified
    if (screenshot.waitFor) {
      try {
        await page.waitForSelector(screenshot.waitFor, { timeout: 10000, state: 'visible' });
      } catch (e) {
        console.warn(`     ⚠️ waitFor selector not found: ${screenshot.waitFor}`);
      }
    }

    // Execute actions (including spotlight)
    if (screenshot.actions) {
      for (const action of screenshot.actions) {
        await executeAction(page, action);
      }
    }

    // Extra delay for any final rendering
    await page.waitForTimeout(300);

    // Capture
    await page.screenshot({ path: outputPath, type: 'png', fullPage: false });

    console.log(`     ✅ Saved: ${screenshot.name}.png`);
    return { success: true, name: screenshot.name };
  } catch (error) {
    console.error(`     ❌ Error: ${error.message}`);
    return { success: false, name: screenshot.name, error: error.message };
  }
}

/**
 * Check if the app is running
 */
async function checkAppRunning() {
  const http = require('http');
  return new Promise((resolve) => {
    const url = new URL(CONFIG.baseUrl);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: '/',
      method: 'HEAD',
      timeout: 3000
    }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

/**
 * Generate manifest file for articles to reference
 */
function generateManifest(results) {
  const manifest = {
    generated: new Date().toISOString(),
    baseUrl: '/tutorial-images/',
    screenshots: {}
  };

  for (const screenshot of CONFIG.screenshots) {
    manifest.screenshots[screenshot.name] = {
      file: `${screenshot.name}.png`,
      description: screenshot.description,
      success: results.find(r => r.name === screenshot.name)?.success || false
    };
  }

  const manifestPath = path.join(CONFIG.outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📋 Manifest saved: ${manifestPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     EPCalculator Screenshot Capture (Spotlight Mode)       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Parse CLI args
  const args = process.argv.slice(2);
  const filter = args.find(a => !a.startsWith('--'));
  const watchMode = args.includes('--watch');

  // Check if app is running
  console.log(`🔍 Checking if app is running at ${CONFIG.baseUrl}...`);
  const isRunning = await checkAppRunning();
  if (!isRunning) {
    console.error('❌ App is not running!');
    console.error('   Start the dev server first: npm run dev');
    process.exit(1);
  }
  console.log('✅ App is running\n');

  // Filter screenshots
  let screenshots = CONFIG.screenshots;
  if (filter) {
    screenshots = screenshots.filter(s =>
      s.name.includes(filter) ||
      s.description.toLowerCase().includes(filter.toLowerCase())
    );
    console.log(`🔎 Filtered to ${screenshots.length} screenshots matching "${filter}"\n`);
  }

  if (screenshots.length === 0) {
    console.log('No screenshots to capture.');
    return;
  }

  // Launch browser with WebGL support for 3D plots
  console.log('🚀 Launching browser...\n');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--enable-webgl',
      '--enable-webgl2',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization',
      '--enable-accelerated-2d-canvas',
      '--disable-gpu-sandbox',
      '--use-gl=swiftshader'
    ]
  });
  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    deviceScaleFactor: CONFIG.deviceScaleFactor
  });
  const page = await context.newPage();

  // Capture all screenshots
  const results = [];
  for (let i = 0; i < screenshots.length; i++) {
    const result = await captureScreenshot(page, screenshots[i], i, screenshots.length);
    results.push(result);
    console.log('');
  }

  // Close browser
  await browser.close();

  // Generate manifest
  generateManifest(results);

  // Summary
  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('════════════════════════════════════════════════════════════');
  console.log(`✅ Success: ${success}    ❌ Failed: ${failed}`);
  console.log('════════════════════════════════════════════════════════════');

  if (failed > 0) {
    console.log('\nFailed screenshots:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  // Watch mode
  if (watchMode) {
    console.log('\n👀 Watch mode enabled. Press Ctrl+C to stop.');
    console.log('   Re-running in 30 seconds...\n');
    setTimeout(() => main(), 30000);
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
