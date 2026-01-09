# Plot Display Styling Changes - Session Summary

This document captures all the styling and UI changes made to the plot display in this session.

## Overview
Refined the plot display to have a cleaner, more professional appearance with consistent fonts, unified white backgrounds, and streamlined legend design.

---

## Changes Made

### 1. **Removed Welcome Section**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/App.svelte`
- Removed the "Welcome to EPCalculator v2" section from the top of the page
- App now goes straight to Simulation and Plotting panels

### 2. **Removed Toggle Selection Feature**
**Files**:
- `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlottingPanel.svelte`
- `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlotContainer.svelte`

**Changes**:
- Removed `selectedPlotId` variable
- Removed `handlePlotSelect()` function
- Removed toggle selection button (🔹/🔸)
- Removed `highlight` prop and all highlighting CSS

### 3. **Updated Download Button Icon**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlotExporter.svelte`

Changed from simple "↓" to proper SVG download icon:
```svg
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8 1V10M8 10L5 7M8 10L11 7"/>
  <path d="M2 13H14"/>
</svg>
```

### 4. **Fixed SNR Unit Handling**
**Files**:
- `/home/arnau/Documents/tfg/EPCalculator/src/frontend/stores/plotting.js`
- `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlottingPanel.svelte`

**Changes**:
- Added `SNRUnit` to duplicate detection in `areParametersIdentical()`, `findRangeExtensionPlot()`, and `findExactMatchPlot()`
- Fixed SNR unit display to read from `simulationParams.SNRUnit` instead of `plotParams.snrUnit`
- SNR only appears in global params if BOTH value and unit are identical across all series
- When SNR value OR unit varies, it shows in the legend with format "SNR: 10 dB" or "SNR: 10"

### 5. **Plot Header Styling**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlottingPanel.svelte`

**CSS Changes**:
```css
.plot-header {
  padding: var(--spacing-md);
  background: white;                    /* Changed from var(--result-background) */
  display: flex;
  justify-content: space-between;
  align-items: center;                  /* Changed from flex-start */
  gap: var(--spacing-sm);
  /* Removed: border-bottom: 1px solid var(--border-color); */
}
```

### 6. **Control Buttons Styling**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlottingPanel.svelte`

**CSS**:
```css
.plot-controls-header .log-toggle {
  background: black;                    /* Changed from white */
  border: 1px solid black;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 1em;
  transition: all var(--transition-fast);
  color: white;                         /* Changed from black */
  min-width: 32px;
  min-height: 32px;
}

.plot-controls-header .log-toggle:hover {
  background: #333;                     /* Changed from var(--result-background) */
  transform: translateY(-1px);
}
```

### 7. **Plot Title and Global Parameters**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlottingPanel.svelte`

**Structure**:
- Title on first line: "Error Exponent vs Code length (n)"
- Global parameters on second line: "16-PAM • SNR: 7 • R=0.5"

**CSS**:
```css
.plot-title {
  margin: 0 0 4px 0;
  font-size: var(--font-size-lg);
  color: var(--text-color);
  font-weight: 600;
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.plot-params-line {
  margin: 0 0 4px 0;
  font-size: var(--font-size-sm);      /* Smaller than title */
  color: #666;                          /* Lighter color */
  font-weight: 400;                     /* Normal weight */
}
```

### 8. **Removed Plot Details Section**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlottingPanel.svelte`

Removed the section showing "Line Plot (2 series) 6:51:39 PM" below the plot.

### 9. **Plot Container Styling**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlotContainer.svelte`

**CSS**:
```css
.plot-container {
  background: white;
  border-radius: 0 0 8px 8px;          /* Only bottom corners rounded */
  padding: var(--spacing-md);
  transition: all var(--transition-normal);
  /* Removed: border, box-shadow (handled by parent plot-item) */
  /* Removed: border-top to eliminate line between legend and plot */
}
```

### 10. **Series List (Legend) Styling**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlottingPanel.svelte`

**CSS**:
```css
.series-list {
  padding: var(--spacing-sm) var(--spacing-md);
  background: white;                    /* Changed from rgba(0, 0, 0, 0.02) */
  /* Removed: border-bottom: 1px solid var(--border-color); */
}
```

### 11. **Individual Legend Item Styling**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlottingPanel.svelte`

**CSS**:
```css
.series-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.08);  /* Very subtle border */
  transition: all var(--transition-fast);
}

.series-item:hover {
  background: rgba(0, 0, 0, 0.02);        /* Subtle gray on hover */
  border-color: rgba(0, 0, 0, 0.15);      /* Slightly darker border on hover */
}

.series-indicator {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
  /* Removed: border: 1px solid rgba(0, 0, 0, 0.2); */
}
```

### 12. **Legend Remove Button Styling**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlottingPanel.svelte`

**CSS**:
```css
.series-remove-button {
  background: none;
  border: none;
  outline: none;                        /* Explicitly removed */
  box-shadow: none;                     /* Explicitly removed */
  color: #999;
  font-size: 1.2em;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.series-remove-button:hover {
  background: #fef2f2;
  color: #dc2626;
}

.series-remove-button:focus {
  outline: none;
  box-shadow: none;
}
```

### 13. **Plot Font Styling**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlotContainer.svelte`

**In `createPlot()` options**:
```javascript
style: {
  background: 'white',
  fontSize: '12px',
  fontFamily: 'Inter, Arial, sans-serif'  /* Matches global parameters font */
  /* Note: No fontWeight specified, uses default 400 (normal) */
}
```

### 14. **Fixed Remove Plot Functionality**
**File**: `/home/arnau/Documents/tfg/EPCalculator/src/frontend/stores/plotting.js`

**In `removePlot()` function**:
- Now checks container `plotId` FIRST to remove entire multi-series plot
- Then checks individual series plotIds to remove single series
- Ensures clicking "Remove Plot" button removes all series at once

---

## Visual Result

### Before
- Gray background on plot header
- Gray background on legend area
- Border between plot header and plot content
- Border between legend and plot
- Plot details info at bottom
- Borders around legend items and color indicators
- Toggle selection button present
- Simple arrow "↓" for download

### After
- Unified white background throughout (header, legend, plot)
- No dividing lines between header/legend/plot sections
- Clean, seamless appearance
- Black control buttons with white text
- Title and parameters clearly separated
- Very subtle borders on legend items (rgba(0, 0, 0, 0.08))
- No borders on color indicators
- Clean remove buttons with no borders/shadows
- Proper SVG download icon
- Consistent Inter font throughout

---

## Key Files Modified

1. `/home/arnau/Documents/tfg/EPCalculator/src/frontend/App.svelte`
2. `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlottingPanel.svelte`
3. `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlotContainer.svelte`
4. `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlotExporter.svelte`
5. `/home/arnau/Documents/tfg/EPCalculator/src/frontend/stores/plotting.js`

---

## Notes

- All changes maintain responsive design
- Hover states preserved for better UX
- Accessibility maintained (though toggle selection removed)
- Font consistency achieved across title, parameters, plot axes, and legend
- Color scheme kept minimal: white backgrounds, black controls, subtle gray borders
