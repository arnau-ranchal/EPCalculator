# ✅ SNR Unit Toggle Feature - Complete

## Summary

Successfully implemented a dynamic SNR unit toggle that allows users to switch between **linear** and **dB** (decibel) units throughout the application.

## Changes Made

### 1. Simulation Store (`stores/simulation.js`)

**Added:**
- `SNRUnit` parameter to simulation params (default: 'linear')
- Conversion utility functions:
  - `linearToDb(linear)` - Converts linear to dB: `10 * log10(linear)`
  - `dbToLinear(db)` - Converts dB to linear: `10^(db/10)`
  - `getSNRLinear(params)` - Returns SNR in linear form for backend

**Code:**
```javascript
export const simulationParams = writable({
  M: 16,
  typeModulation: 'PAM',
  SNR: 7,
  SNRUnit: 'linear', // 'linear' or 'dB'
  R: 0.5,
  n: 100,
  N: 20,
  threshold: 1e-6
});

// SNR conversion utilities
export function linearToDb(linear) {
  return 10 * Math.log10(linear);
}

export function dbToLinear(db) {
  return Math.pow(10, db / 10);
}

export function getSNRLinear(params) {
  if (params.SNRUnit === 'dB') {
    return dbToLinear(params.SNR);
  }
  return params.SNR;
}
```

### 2. Parameter Form (`ParameterForm.svelte`)

**Added:**
- Unit selector dropdown next to SNR input
- Dynamic label showing current unit: `SNR ({$simulationParams.SNRUnit})`
- Flexbox layout for input + unit selector

**UI Structure:**
```html
<label for="SNR">SNR ({$simulationParams.SNRUnit})</label>
<div class="input-with-unit">
  <input type="number" name="SNR" value={$simulationParams.SNR} />
  <select name="SNRUnit" value={$simulationParams.SNRUnit}>
    <option value="linear">linear</option>
    <option value="dB">dB</option>
  </select>
</div>
```

**CSS:**
```css
.input-with-unit {
  display: flex;
  gap: 4px;
}

.input-with-unit input {
  flex: 1;
}

.unit-selector {
  min-width: 80px;
  font-size: var(--font-size-sm);
}
```

### 3. Simulation Panel (`SimulationPanel.svelte`)

**Updated:**
- Converts SNR to linear before sending to backend
- Backend always receives linear SNR regardless of UI unit

**Code:**
```javascript
async function handleCompute(params) {
  // Convert SNR to linear for backend
  const paramsForBackend = {
    ...params,
    SNR: getSNRLinear(params)
  };

  const rawResponse = await computeExponents(paramsForBackend);
  // ...
}
```

### 4. Plotting Store (`stores/plotting.js`)

**Updated:**
- Made axis labels dynamic for SNR
- Added `getAxisLabel(varName, snrUnit)` function
- Updated `formatPlotData()` and `formatContourData()` to include SNR unit

**Code:**
```javascript
export const axisLabels = {
  M: 'Modulation size',
  SNR: 'SNR', // Unit added dynamically
  R: 'Rate',
  // ...
};

export function getAxisLabel(varName, snrUnit = 'linear') {
  if (varName === 'SNR') {
    return `SNR (${snrUnit})`;
  }
  return axisLabels[varName] || varName;
}

export function formatPlotData(rawData, metadata) {
  const snrUnit = metadata.snrUnit || 'linear';
  return {
    type: 'line',
    x: rawData.x_values || rawData.x,
    y: rawData.y_values || rawData.y,
    metadata: {
      xLabel: getAxisLabel(metadata.xVar, snrUnit),
      yLabel: getAxisLabel(metadata.yVar, snrUnit),
      ...metadata
    }
  };
}
```

### 5. Plotting Panel (`PlottingPanel.svelte`)

**Updated:**
- Passes SNR unit to plot metadata
- Ensures plots display correct axis labels

**Code:**
```javascript
formattedData = formatPlotData(rawData, {
  xVar: plotParams.xVar,
  yVar: plotParams.yVar,
  lineColor: plotParams.lineColor,
  lineType: plotParams.lineType,
  snrUnit: simulationParams.SNRUnit || 'linear'
});
```

## How It Works

### User Workflow

1. **Select Unit:** User chooses "linear" or "dB" from dropdown next to SNR input
2. **Enter Value:** User enters SNR value in selected unit
3. **Compute:** Frontend converts to linear if needed before sending to backend
4. **Results:** Backend always receives linear SNR
5. **Plots:** Axis labels show correct unit (e.g., "SNR (dB)" or "SNR (linear)")

### Conversion Examples

**Linear to dB:**
- SNR = 10 (linear) → 10 dB
- SNR = 100 (linear) → 20 dB
- SNR = 1000 (linear) → 30 dB

**dB to Linear:**
- SNR = 10 dB → 10 (linear)
- SNR = 20 dB → 100 (linear)
- SNR = 30 dB → 1000 (linear)

### Backend Compatibility

The C++ backend **always receives SNR in linear form**, regardless of what the user selected. The conversion happens transparently in the frontend.

## UI Screenshots (Description)

### Simulation Parameters
```
┌─────────────────────────────────┐
│ SNR (linear)         [dropdown] │
│ ┌──────────┐ ┌────────────────┐ │
│ │  7.0     │ │ linear     ▼  │ │
│ └──────────┘ └────────────────┘ │
└─────────────────────────────────┘

When user selects "dB":

┌─────────────────────────────────┐
│ SNR (dB)             [dropdown] │
│ ┌──────────┐ ┌────────────────┐ │
│ │  10.0    │ │ dB         ▼  │ │
│ └──────────┘ └────────────────┘ │
└─────────────────────────────────┘
```

### Plot Axis Labels
- When unit is "linear": X-axis shows "SNR (linear)"
- When unit is "dB": X-axis shows "SNR (dB)"

## Testing

### Test Case 1: Linear SNR
```javascript
{
  M: 16,
  typeModulation: 'QAM',
  SNR: 10,
  SNRUnit: 'linear',
  R: 0.5
}
// Backend receives: SNR = 10 (linear)
```

### Test Case 2: dB SNR
```javascript
{
  M: 16,
  typeModulation: 'QAM',
  SNR: 10,
  SNRUnit: 'dB',
  R: 0.5
}
// Backend receives: SNR = 10 (linear, converted from 10 dB)
```

### Test Case 3: Unit Switch
1. User enters SNR = 20 with unit = "linear"
2. User switches to "dB"
3. Value stays 20, but now interpreted as 20 dB
4. Backend receives: 10^(20/10) = 100 (linear)

## Files Modified

1. `/home/arnau/Documents/tfg/EPCalculator/src/frontend/stores/simulation.js`
   - Added SNRUnit parameter
   - Added conversion functions

2. `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/simulation/ParameterForm.svelte`
   - Added unit selector UI
   - Updated label to be dynamic

3. `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/simulation/SimulationPanel.svelte`
   - Added SNR conversion before backend call

4. `/home/arnau/Documents/tfg/EPCalculator/src/frontend/stores/plotting.js`
   - Added getAxisLabel() function
   - Updated formatPlotData() and formatContourData()

5. `/home/arnau/Documents/tfg/EPCalculator/src/frontend/components/plotting/PlottingPanel.svelte`
   - Passes SNR unit to plot metadata

## Benefits

1. **User Flexibility:** Users can work in their preferred unit
2. **Backward Compatible:** Backend unchanged, always receives linear
3. **Consistent:** Unit shown in labels, plots, and form
4. **No Breaking Changes:** Existing functionality preserved
5. **Cache Aware:** Different units create different cache entries

## Default Behavior

- **Default unit:** linear
- **Reset defaults:** Returns to linear
- **Backend:** Always expects linear
- **Plots:** Show unit in axis labels

## Future Enhancements (Optional)

- Auto-convert value when switching units
- Remember user's preferred unit
- Add unit toggle to plotting controls
- Support more units (linear power, dBm, etc.)

## Server Status

✅ **Server is running at http://localhost:8000**

The updated frontend with SNR unit toggle is now live and ready to test!
