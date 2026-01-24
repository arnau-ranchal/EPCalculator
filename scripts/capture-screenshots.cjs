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
  outputDir: path.join(__dirname, '..', 'public', 'tutorial-images'),
  viewport: { width: 1400, height: 900 },
  deviceScaleFactor: 2, // Retina quality

  // Screenshots to capture - full-page with spotlight highlighting
  screenshots: [
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
      description: 'Full app with modulation controls spotlighted',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 500 },
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
      description: '16-QAM modulation selected',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 300 },
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
      description: '8-PSK modulation selected',
      waitFor: '.simulation-panel',
      setup: [{ type: 'dismissTutorial' }],
      actions: [
        { type: 'wait', ms: 300 },
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

      case 'dismissTutorial':
        await page.evaluate(() => {
          const state = JSON.parse(localStorage.getItem('epcalculator_tutorial') || '{}');
          state.hasSeenWelcome = true;
          state.hasSeenPlotTutorial = true;
          state.hasSeenConstellationTutorial = true;
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

  // Launch browser
  console.log('🚀 Launching browser...\n');
  const browser = await chromium.launch({ headless: true });
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
