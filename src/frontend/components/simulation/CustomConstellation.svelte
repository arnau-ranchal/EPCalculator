<script>
  import { createEventDispatcher, onMount, onDestroy, tick } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { theme } from '../../stores/theme.js';
  import { showDocumentation, hideDocumentation } from '../../stores/documentation.js';

  const dispatch = createEventDispatcher();

  // Constellation points: array of {real, imag, prob}
  export let points = [
    { real: 1, imag: 0, prob: 0.25 },
    { real: 0, imag: 1, prob: 0.25 },
    { real: -1, imag: 0, prob: 0.25 },
    { real: 0, imag: -1, prob: 0.25 }
  ];

  export let showTable = true;
  export let showPlot = true;
  export let showHeader = true;
  export let plotMode = 'cartesian'; // 'cartesian' (Re/Im) or 'polar' (Magnitude/Phase)
  export let isTransitioning = false; // Disable scroll-to-row during modal transitions

  // Expose functions for external control
  export function doNormalize() { normalize(); }
  export function doGenerateRandom(options) { generateRandomConstellation(options); }
  export function doLoadPreset(preset) { loadPreset(preset); }
  export function doUndo() { undo(); }

  // Undo/Redo history - stores snapshots of points array
  let undoHistory = [];
  let redoHistory = [];
  const MAX_HISTORY = 50;

  function saveToHistory() {
    // Deep copy current points
    const snapshot = points.map(p => ({ ...p }));
    undoHistory = [...undoHistory, snapshot];
    if (undoHistory.length > MAX_HISTORY) {
      undoHistory = undoHistory.slice(-MAX_HISTORY);
    }
    // Clear redo history when a new action is performed
    redoHistory = [];
  }

  function undo() {
    if (undoHistory.length > 0) {
      // Save current state to redo history
      const currentState = points.map(p => ({ ...p }));
      redoHistory = [...redoHistory, currentState];

      // Restore previous state
      const previousState = undoHistory[undoHistory.length - 1];
      undoHistory = undoHistory.slice(0, -1);
      points = previousState;
      notifyChange();
    }
  }

  function redo() {
    if (redoHistory.length > 0) {
      // Save current state to undo history
      const currentState = points.map(p => ({ ...p }));
      undoHistory = [...undoHistory, currentState];

      // Restore next state
      const nextState = redoHistory[redoHistory.length - 1];
      redoHistory = redoHistory.slice(0, -1);
      points = nextState;
      notifyChange();
    }
  }

  $: canUndo = undoHistory.length > 0;
  $: canRedo = redoHistory.length > 0;

  let selectedPointIndex = -1;
  let draggedPointIndex = -1;
  let isDragging = false;
  let svgElement;
  let tableScrollElement;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let edgePushExpansion = 0;
  let isAtEdge = false;
  let expansionFrameId = null;
  let lockedAxisRange = null; // Lock axis during drag to prevent auto-expansion
  let lastSvgX = 0; // Track raw SVG coordinates for edge expansion
  let lastSvgY = 0;
  let edgePressure = 0; // How far past the boundary the mouse is pushing (affects expansion speed)
  let isAtOrigin = false;
  let shrinkFrameId = null;
  let originPressure = 0; // How close to origin the point is (affects shrink speed)
  let showMeanLabel = false;
  let showEnergyLabel = false;
  let energyLabelX = 0;
  let energyLabelY = 0;

  // Track which input is being actively edited to prevent cursor jumping
  let activeInputIndex = -1;
  let activeInputField = null;

  // Input blur handlers
  function handleInputBlur(e, index, field) {
    activeInputIndex = -1;
    activeInputField = null;
    // Final update on blur
    handlePointInput(index, field, e.target.value);
  }

  function handlePolarBlur(e, index, field) {
    activeInputIndex = -1;
    activeInputField = null;
    handlePolarInput(index, field, e.target.value);
  }

  function handleInputKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); // Prevent form submission / plot generation
      e.target.blur();
    }
  }

  // Svelte action to manage input value without cursor jumping
  function editableValue(node, params) {
    let isFocused = false;
    let currentParams = params;

    function updateValue() {
      if (!isFocused) {
        node.value = currentParams.value;
      }
    }

    function handleFocus() {
      isFocused = true;
      activeInputIndex = currentParams.index;
      activeInputField = currentParams.field;
    }

    function handleBlur() {
      isFocused = false;
      activeInputIndex = -1;
      activeInputField = null;
      // Value will be updated by the blur handler
    }

    node.addEventListener('focus', handleFocus);
    node.addEventListener('blur', handleBlur);

    // Initial value
    updateValue();

    return {
      update(newParams) {
        currentParams = newParams;
        updateValue();
      },
      destroy() {
        node.removeEventListener('focus', handleFocus);
        node.removeEventListener('blur', handleBlur);
      }
    };
  }

  // Polar coordinate conversions
  function toPolar(real, imag) {
    const magnitude = Math.sqrt(real * real + imag * imag);
    const phase = Math.atan2(imag, real); // radians, -π to π
    return { magnitude, phase };
  }

  function toCartesian(magnitude, phase) {
    const real = magnitude * Math.cos(phase);
    const imag = magnitude * Math.sin(phase);
    return { real, imag };
  }

  // Format phase for display (in degrees)
  function formatPhase(radians) {
    const degrees = radians * (180 / Math.PI);
    return degrees.toFixed(1) + '°';
  }

  // Parse phase input (accepts degrees)
  function parsePhase(value) {
    const degrees = parseFloat(value) || 0;
    return degrees * (Math.PI / 180);
  }

  // Get polar coordinates for each point (reactive)
  $: polarPoints = points.map(p => {
    const polar = toPolar(p.real, p.imag);
    return { ...p, magnitude: polar.magnitude, phase: polar.phase };
  });

  // Validation state
  $: probSum = points.reduce((sum, p) => sum + p.prob, 0);
  $: energy = points.reduce((sum, p) => sum + p.prob * (p.real * p.real + p.imag * p.imag), 0);
  $: isProbSumValid = Math.abs(probSum - 1.0) < 0.001;
  $: isEnergyValid = Math.abs(energy - 1.0) < 0.001;
  $: isValid = isProbSumValid && isEnergyValid;

  // Compute weighted mean (centroid) of constellation
  $: meanReal = probSum > 0 ? points.reduce((sum, p) => sum + p.prob * p.real, 0) / probSum : 0;
  $: meanImag = probSum > 0 ? points.reduce((sum, p) => sum + p.prob * p.imag, 0) / probSum : 0;

  // Emphasis color for points, mean, and energy circle
  const emphasisColor = 'var(--primary-color, #C8102E)';

  // Format number for display: simply format with fixed decimals, centered as text
  function formatForCenter(value, decimals = 4) {
    return value.toFixed(decimals);
  }

  // Helper to notify parent of changes (called manually to avoid infinite loops)
  function notifyChange() {
    // Calculate fresh validation from current points
    const currentProbSum = points.reduce((sum, p) => sum + p.prob, 0);
    const currentEnergy = points.reduce((sum, p) => sum + p.prob * (p.real * p.real + p.imag * p.imag), 0);
    const currentIsProbSumValid = Math.abs(currentProbSum - 1.0) < 0.001;
    const currentIsEnergyValid = Math.abs(currentEnergy - 1.0) < 0.001;
    const currentIsValid = currentIsProbSumValid && currentIsEnergyValid;

    dispatch('change', { points, isValid: currentIsValid });
  }

  // Initialize store on mount and add window event listeners for drag
  onMount(() => {
    notifyChange();
    window.addEventListener('mousemove', handleSvgMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  });

  onDestroy(() => {
    window.removeEventListener('mousemove', handleSvgMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    stopEdgeExpansion();
    if (docHoverTimeout) clearTimeout(docHoverTimeout);
  });

  // Documentation hover with delay
  let docHoverTimeout = null;
  const DOC_HOVER_DELAY = 1500; // 1.5 seconds

  function handleDocHover(docKey, event) {
    if (docHoverTimeout) clearTimeout(docHoverTimeout);
    const targetElement = event.currentTarget; // Capture immediately before async
    docHoverTimeout = setTimeout(() => {
      if (targetElement) {
        showDocumentation(docKey, targetElement, 'top');
      }
    }, DOC_HOVER_DELAY);
  }

  function handleDocLeave() {
    // Only cancel pending hover, don't close an already-open panel
    // The panel has its own close mechanism (click outside, Escape key)
    if (docHoverTimeout) {
      clearTimeout(docHoverTimeout);
      docHoverTimeout = null;
    }
  }

  function addPoint() {
    if (points.length >= 99) return;
    const newIndex = points.length;
    points = [...points, { real: 0, imag: 0, prob: 1.0 / (points.length + 1) }];
    notifyChange();
    // Select the new point to show intro effect, then deselect after a short moment
    selectedPointIndex = newIndex;
    setTimeout(() => {
      if (selectedPointIndex === newIndex) {
        selectedPointIndex = -1;
      }
    }, 800);
    // Scroll to the new point after DOM update
    tick().then(() => {
      if (tableScrollElement && points.length > 5) {
        const rows = tableScrollElement.querySelectorAll('tbody tr');
        if (rows[newIndex]) {
          rows[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    });
  }

  function selectPoint(index) {
    if (isDragging) return;
    selectedPointIndex = index;
    // Scroll to make the selected point visible in the table (skip during transitions)
    if (tableScrollElement && points.length > 5 && !isTransitioning) {
      const rows = tableScrollElement.querySelectorAll('tbody tr');
      if (rows[index]) {
        const row = rows[index];
        const containerRect = tableScrollElement.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        // Check if row is outside visible area
        if (rowRect.top < containerRect.top || rowRect.bottom > containerRect.bottom) {
          row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }

  function removePoint(index) {
    if (points.length <= 2) {
      alert($_('constellation.minPoints'));
      return;
    }
    points = points.filter((_, i) => i !== index);
    notifyChange();
  }

  function normalize() {
    // Step 1: Normalize probabilities to sum to 1
    const currentProbSum = points.reduce((sum, p) => sum + p.prob, 0);
    if (currentProbSum > 0) {
      points = points.map(p => ({ ...p, prob: p.prob / currentProbSum }));
    }

    // Step 2: Calculate energy with normalized probabilities
    const currentEnergy = points.reduce((sum, p) => sum + p.prob * (p.real * p.real + p.imag * p.imag), 0);

    // Step 3: Scale constellation points by 1/sqrt(energy)
    if (currentEnergy > 0) {
      const scale = 1.0 / Math.sqrt(currentEnergy);
      points = points.map(p => ({ ...p, real: p.real * scale, imag: p.imag * scale }));
    }
    notifyChange();
  }

  // Store last used options for regeneration with same config
  let lastLuckyOptions = {
    randomizeNumPoints: true,
    randomizeMean: true,
    randomizePositions: true,
    numPoints: 4,
    meanReal: 0,
    meanImag: 0
  };

  /**
   * Generate random constellation with intelligent pattern selection.
   *
   * All 8 combinations of the 3 checkboxes produce meaningful results:
   *
   * | NumPts | Mean | Positions | Behavior |
   * |--------|------|-----------|----------|
   * | ✓ | ✓ | ✓ | Full Random: new count, new center, interesting pattern |
   * | ✓ | ✓ | ✗ | Adjust & Shift: modify count, shift to new center |
   * | ✓ | ✗ | ✓ | New Pattern at Fixed Center: random count around origin/fixed |
   * | ✓ | ✗ | ✗ | Adjust Count: add/remove points, keep center |
   * | ✗ | ✓ | ✓ | Fixed Count, New Pattern: same count, random positions/center |
   * | ✗ | ✓ | ✗ | Shift Only: translate pattern to new center |
   * | ✗ | ✗ | ✓ | Shuffle: new positions at current/fixed center |
   * | ✗ | ✗ | ✗ | Normalize Only: just fix probabilities/energy |
   */
  function generateRandomConstellation(options = {}) {
    // Cancel any pending documentation hover (user clicked the button)
    if (docHoverTimeout) {
      clearTimeout(docHoverTimeout);
      docHoverTimeout = null;
    }

    // Merge with defaults
    const opts = {
      randomizeNumPoints: true,
      randomizeMean: true,
      randomizePositions: true,
      fixedNumPoints: 4,
      fixedMeanReal: 0,
      fixedMeanImag: 0,
      numPointsMin: 2,
      numPointsMax: 16,
      ...options
    };

    // Step 1: Determine number of points
    let numPoints;
    if (opts.randomizeNumPoints) {
      const minPts = Math.max(2, Math.min(50, opts.numPointsMin));
      const maxPts = Math.max(minPts, Math.min(50, opts.numPointsMax));
      numPoints = Math.floor(Math.random() * (maxPts - minPts + 1)) + minPts;
      lastLuckyOptions.numPoints = numPoints;
    } else {
      numPoints = opts.fixedNumPoints || points.length || 4;
      numPoints = Math.max(2, Math.min(50, numPoints));
    }

    // Step 2: Determine center position
    let centerReal, centerImag;
    if (opts.randomizeMean) {
      // Random center, but not too far from origin for practical constellations
      const maxOffset = 0.8;
      centerReal = (Math.random() - 0.5) * 2 * maxOffset;
      centerImag = (Math.random() - 0.5) * 2 * maxOffset;
      lastLuckyOptions.meanReal = centerReal;
      lastLuckyOptions.meanImag = centerImag;
    } else {
      centerReal = opts.fixedMeanReal ?? 0;
      centerImag = opts.fixedMeanImag ?? 0;
    }

    // Step 3: Generate or modify points based on randomizePositions
    if (opts.randomizePositions) {
      // Generate new constellation with interesting pattern
      points = generateInterestingPattern(numPoints, centerReal, centerImag);
    } else {
      // Preserve existing pattern but adjust count and/or shift center
      points = modifyExistingConstellation(numPoints, centerReal, centerImag, opts.randomizeMean);
    }

    // Step 4: Normalize to ensure valid constellation
    normalize();
    notifyChange();
  }

  /**
   * Generate an interesting random pattern. Sometimes structured (ring, grid),
   * sometimes scattered, to produce varied and useful constellations.
   */
  function generateInterestingPattern(numPoints, centerReal, centerImag) {
    // Choose pattern type based on point count and randomness
    const roll = Math.random();

    // For specific counts, prefer structured patterns
    const isPowerOf2 = (numPoints & (numPoints - 1)) === 0;
    const isSquare = Number.isInteger(Math.sqrt(numPoints));

    let newPoints;

    if (numPoints <= 2) {
      // 2 points: always BPSK-like (antipodal)
      newPoints = generateAntipodalPattern(numPoints, centerReal, centerImag);
    } else if (roll < 0.35) {
      // 35% chance: Ring/PSK-like pattern
      newPoints = generateRingPattern(numPoints, centerReal, centerImag);
    } else if (roll < 0.55 && isSquare && numPoints >= 4) {
      // 20% chance (if square): Grid/QAM-like pattern
      newPoints = generateGridPattern(numPoints, centerReal, centerImag);
    } else if (roll < 0.70 && numPoints >= 4) {
      // 15% chance: Multi-ring pattern (like 16-APSK)
      newPoints = generateMultiRingPattern(numPoints, centerReal, centerImag);
    } else if (roll < 0.85) {
      // 15% chance: Clustered pattern
      newPoints = generateClusteredPattern(numPoints, centerReal, centerImag);
    } else {
      // 15% chance: Fully random scattered
      newPoints = generateScatteredPattern(numPoints, centerReal, centerImag);
    }

    return newPoints;
  }

  /**
   * Generate antipodal (BPSK-like) pattern for 2 points
   */
  function generateAntipodalPattern(numPoints, centerReal, centerImag) {
    const angle = Math.random() * Math.PI; // Random orientation
    const radius = 0.8 + Math.random() * 0.4; // Slightly varied radius
    const pts = [];
    for (let i = 0; i < numPoints; i++) {
      const a = angle + i * Math.PI;
      pts.push({
        real: centerReal + radius * Math.cos(a),
        imag: centerImag + radius * Math.sin(a),
        prob: 1 / numPoints
      });
    }
    return pts;
  }

  /**
   * Generate ring/PSK-like pattern - points evenly distributed on a circle
   */
  function generateRingPattern(numPoints, centerReal, centerImag) {
    const radius = 0.7 + Math.random() * 0.5; // Radius between 0.7 and 1.2
    const startAngle = Math.random() * 2 * Math.PI; // Random rotation
    const pts = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = startAngle + (2 * Math.PI * i) / numPoints;
      // Add tiny perturbation for more natural look
      const perturbR = (Math.random() - 0.5) * 0.05;
      const perturbA = (Math.random() - 0.5) * 0.1;
      pts.push({
        real: centerReal + (radius + perturbR) * Math.cos(angle + perturbA),
        imag: centerImag + (radius + perturbR) * Math.sin(angle + perturbA),
        prob: 1 / numPoints
      });
    }
    return pts;
  }

  /**
   * Generate grid/QAM-like pattern - rectangular arrangement
   */
  function generateGridPattern(numPoints, centerReal, centerImag) {
    const gridSize = Math.sqrt(numPoints);
    const spacing = 0.5 + Math.random() * 0.3; // Grid spacing
    const rotation = Math.random() * Math.PI / 4; // Random rotation up to 45°
    const pts = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Grid coordinates centered at origin
        const gx = (i - (gridSize - 1) / 2) * spacing;
        const gy = (j - (gridSize - 1) / 2) * spacing;
        // Apply rotation
        const rx = gx * Math.cos(rotation) - gy * Math.sin(rotation);
        const ry = gx * Math.sin(rotation) + gy * Math.cos(rotation);
        // Add small perturbation
        const perturbX = (Math.random() - 0.5) * 0.05;
        const perturbY = (Math.random() - 0.5) * 0.05;
        pts.push({
          real: centerReal + rx + perturbX,
          imag: centerImag + ry + perturbY,
          prob: 1 / numPoints
        });
      }
    }
    return pts;
  }

  /**
   * Generate multi-ring pattern (like APSK) - points on concentric rings
   */
  function generateMultiRingPattern(numPoints, centerReal, centerImag) {
    // Determine number of rings based on point count
    let rings;
    if (numPoints <= 6) {
      rings = [{ count: numPoints, radius: 0.8 }];
    } else if (numPoints <= 12) {
      const inner = Math.floor(numPoints / 3);
      rings = [
        { count: inner, radius: 0.4 },
        { count: numPoints - inner, radius: 0.9 }
      ];
    } else {
      const inner = Math.floor(numPoints / 4);
      const middle = Math.floor(numPoints / 3);
      rings = [
        { count: inner, radius: 0.3 },
        { count: middle, radius: 0.65 },
        { count: numPoints - inner - middle, radius: 1.0 }
      ];
    }

    const startAngle = Math.random() * 2 * Math.PI;
    const pts = [];

    for (const ring of rings) {
      const ringOffset = Math.random() * Math.PI / ring.count; // Offset between rings
      for (let i = 0; i < ring.count; i++) {
        const angle = startAngle + ringOffset + (2 * Math.PI * i) / ring.count;
        pts.push({
          real: centerReal + ring.radius * Math.cos(angle),
          imag: centerImag + ring.radius * Math.sin(angle),
          prob: 1 / numPoints
        });
      }
    }
    return pts;
  }

  /**
   * Generate clustered pattern - points grouped in a few clusters
   */
  function generateClusteredPattern(numPoints, centerReal, centerImag) {
    const numClusters = Math.min(Math.floor(numPoints / 2), 2 + Math.floor(Math.random() * 3));
    const pointsPerCluster = Math.floor(numPoints / numClusters);
    const remainder = numPoints % numClusters;

    // Generate cluster centers on a ring
    const clusterRadius = 0.6 + Math.random() * 0.3;
    const clusterSpread = 0.15 + Math.random() * 0.15;
    const startAngle = Math.random() * 2 * Math.PI;

    const pts = [];
    let pointsAdded = 0;

    for (let c = 0; c < numClusters; c++) {
      const clusterAngle = startAngle + (2 * Math.PI * c) / numClusters;
      const clusterCenterReal = centerReal + clusterRadius * Math.cos(clusterAngle);
      const clusterCenterImag = centerImag + clusterRadius * Math.sin(clusterAngle);

      const pointsInThisCluster = pointsPerCluster + (c < remainder ? 1 : 0);

      for (let i = 0; i < pointsInThisCluster; i++) {
        pts.push({
          real: clusterCenterReal + (Math.random() - 0.5) * clusterSpread * 2,
          imag: clusterCenterImag + (Math.random() - 0.5) * clusterSpread * 2,
          prob: 1 / numPoints
        });
        pointsAdded++;
      }
    }

    return pts;
  }

  /**
   * Generate fully scattered random pattern
   */
  function generateScatteredPattern(numPoints, centerReal, centerImag) {
    const spread = 0.8 + Math.random() * 0.6;
    const pts = [];

    for (let i = 0; i < numPoints; i++) {
      // Use polar coordinates for better distribution
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.sqrt(Math.random()) * spread; // sqrt for uniform area distribution
      pts.push({
        real: centerReal + radius * Math.cos(angle),
        imag: centerImag + radius * Math.sin(angle),
        prob: 1 / numPoints
      });
    }
    return pts;
  }

  /**
   * Modify existing constellation - adjust count and/or shift center
   * while preserving the relative pattern as much as possible
   */
  function modifyExistingConstellation(targetCount, newCenterReal, newCenterImag, shouldShift) {
    if (points.length === 0) {
      // No existing points - must generate new ones
      return generateScatteredPattern(targetCount, newCenterReal, newCenterImag);
    }

    // Calculate current center
    const currentCenterReal = points.reduce((s, p) => s + p.real, 0) / points.length;
    const currentCenterImag = points.reduce((s, p) => s + p.imag, 0) / points.length;

    // Determine the target center
    const targetCenterReal = shouldShift ? newCenterReal : currentCenterReal;
    const targetCenterImag = shouldShift ? newCenterImag : currentCenterImag;

    // Start with current points, shifted to target center
    const shiftReal = targetCenterReal - currentCenterReal;
    const shiftImag = targetCenterImag - currentCenterImag;

    let newPoints = points.map(p => ({
      real: p.real + shiftReal,
      imag: p.imag + shiftImag,
      prob: p.prob
    }));

    // Adjust count if needed
    if (newPoints.length < targetCount) {
      // Need to add points - add them intelligently near existing pattern
      const currentRadius = Math.max(
        ...newPoints.map(p =>
          Math.sqrt(Math.pow(p.real - targetCenterReal, 2) + Math.pow(p.imag - targetCenterImag, 2))
        )
      ) || 0.5;

      while (newPoints.length < targetCount) {
        // Add new points at similar radius, in gaps between existing points
        const angle = Math.random() * 2 * Math.PI;
        const radius = currentRadius * (0.8 + Math.random() * 0.4);
        newPoints.push({
          real: targetCenterReal + radius * Math.cos(angle),
          imag: targetCenterImag + radius * Math.sin(angle),
          prob: 0 // Will be equalized
        });
      }
    } else if (newPoints.length > targetCount) {
      // Need to remove points - remove the ones farthest from center
      newPoints.sort((a, b) => {
        const distA = Math.pow(a.real - targetCenterReal, 2) + Math.pow(a.imag - targetCenterImag, 2);
        const distB = Math.pow(b.real - targetCenterReal, 2) + Math.pow(b.imag - targetCenterImag, 2);
        return distA - distB;
      });
      newPoints = newPoints.slice(0, targetCount);
    }

    // Equalize probabilities
    return newPoints.map(p => ({ ...p, prob: 1 / targetCount }));
  }

  function loadPreset(preset) {
    switch(preset) {
      case 'qpsk':
        points = [
          { real: 1/Math.sqrt(2), imag: 1/Math.sqrt(2), prob: 0.25 },
          { real: -1/Math.sqrt(2), imag: 1/Math.sqrt(2), prob: 0.25 },
          { real: -1/Math.sqrt(2), imag: -1/Math.sqrt(2), prob: 0.25 },
          { real: 1/Math.sqrt(2), imag: -1/Math.sqrt(2), prob: 0.25 }
        ];
        break;
      case '8psk':
        const angle8 = 2 * Math.PI / 8;
        points = Array.from({ length: 8 }, (_, i) => ({
          real: Math.cos(i * angle8),
          imag: Math.sin(i * angle8),
          prob: 0.125
        }));
        break;
      case '16qam':
        const levels = [-3, -1, 1, 3];
        const scale16 = 1 / Math.sqrt(10); // Normalize for unit energy
        points = [];
        for (let i of levels) {
          for (let q of levels) {
            points.push({ real: i * scale16, imag: q * scale16, prob: 1/16 });
          }
        }
        break;
      case 'bpsk':
        points = [
          { real: 1, imag: 0, prob: 0.5 },
          { real: -1, imag: 0, prob: 0.5 }
        ];
        break;
      case '4pam':
        points = [
          { real: -3/Math.sqrt(5), imag: 0, prob: 0.25 },
          { real: -1/Math.sqrt(5), imag: 0, prob: 0.25 },
          { real: 1/Math.sqrt(5), imag: 0, prob: 0.25 },
          { real: 3/Math.sqrt(5), imag: 0, prob: 0.25 }
        ];
        break;
    }
    notifyChange();
    // Scroll table to top after loading preset
    tick().then(() => {
      if (showTable && tableScrollElement) {
        tableScrollElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  function handlePointInput(index, field, value) {
    // Allow typing partial negative numbers like "-" or "-0." or "-.5"
    // Don't update if user is in the middle of typing a negative number
    if (value === '' || value === '-' || value === '.' || value === '-.' || value === '-0' || value === '-0.') {
      return; // Let user continue typing
    }

    const numValue = parseFloat(value);

    // Only update if it's a valid number
    if (isNaN(numValue)) {
      return;
    }

    // Clamp real/imag to [-1000, 1000]
    let clampedValue = numValue;
    if (field === 'real' || field === 'imag') {
      clampedValue = Math.max(-1000, Math.min(1000, numValue));
    }

    points = points.map((p, i) => i === index ? { ...p, [field]: clampedValue } : p);
    notifyChange();
  }

  // Handle polar coordinate input (magnitude and phase in degrees)
  function handlePolarInput(index, field, value) {
    // Allow typing partial negative numbers for phase
    if (value === '' || value === '-' || value === '.' || value === '-.' || value === '-0' || value === '-0.') {
      return; // Let user continue typing
    }

    const point = points[index];
    const currentPolar = toPolar(point.real, point.imag);

    let magnitude = currentPolar.magnitude;
    let phase = currentPolar.phase;

    if (field === 'magnitude') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;
      magnitude = Math.max(0, Math.min(1000, numValue));
    } else if (field === 'phase') {
      // Parse degrees input and convert to radians
      phase = parsePhase(value);
    }

    const cart = toCartesian(magnitude, phase);
    points = points.map((p, i) => i === index ? { ...p, real: cart.real, imag: cart.imag } : p);
    notifyChange();
  }

  // SVG visualization parameters
  const svgSize = 340;
  const margin = 40;
  const plotSize = svgSize - 2 * margin;

  // Dynamic axis range based on constellation points and energy circle
  $: maxPointExtent = Math.max(
    ...points.map(p => Math.abs(p.real)),
    ...points.map(p => Math.abs(p.imag))
  );
  $: energyRadius = Math.sqrt(Math.max(0, energy));
  $: maxExtent = Math.max(maxPointExtent, energyRadius);

  // Always ensure axis contains content with 10% margin, minimum of 2
  $: baseAxisRange = Math.max(2, maxExtent * 1.1);
  // During drag, use locked axis + edge expansion; otherwise use base axis
  $: axisRange = lockedAxisRange !== null
    ? lockedAxisRange + edgePushExpansion
    : baseAxisRange;
  $: scale = plotSize / (2 * axisRange); // Scale for coordinate system (-axisRange to axisRange)

  // Generate nice grid tick values based on axis range (max ~8 ticks per side)
  $: gridTicks = (() => {
    const ticks = [];
    // Choose step to keep roughly 4-8 ticks per side
    let step;
    if (axisRange <= 2) step = 1;
    else if (axisRange <= 5) step = 1;
    else if (axisRange <= 10) step = 2;
    else if (axisRange <= 25) step = 5;
    else if (axisRange <= 50) step = 10;
    else if (axisRange <= 100) step = 20;
    else if (axisRange <= 250) step = 50;
    else if (axisRange <= 500) step = 100;
    else step = Math.ceil(axisRange / 5 / 100) * 100; // Round to nice numbers

    const maxTick = Math.floor(axisRange / step) * step;
    for (let v = -maxTick; v <= maxTick; v += step) {
      if (v !== 0) ticks.push(v);
    }
    return ticks;
  })();

  // Polar grid: concentric circles for magnitude
  $: polarRadii = (() => {
    const radii = [];
    let step;
    if (axisRange <= 2) step = 0.5;
    else if (axisRange <= 5) step = 1;
    else if (axisRange <= 10) step = 2;
    else step = Math.ceil(axisRange / 5);

    for (let r = step; r <= axisRange; r += step) {
      radii.push(r);
    }
    return radii;
  })();

  // Polar grid: radial lines for phase angles (every 30°)
  const polarAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  // Theme-aware colors for SVG
  $: isDarkMode = $theme.darkMode;
  $: svgColors = {
    background: isDarkMode ? '#1A1A1A' : 'white',
    border: isDarkMode ? '#2D2D2D' : '#DCDCDC',
    unitCircle: isDarkMode ? '#444' : '#e0e0e0',
    axis: isDarkMode ? '#666' : '#999',
    grid: isDarkMode ? '#2a2a2a' : '#f0f0f0',
    labelPrimary: isDarkMode ? '#E8E8E8' : '#333',
    labelSecondary: isDarkMode ? '#888' : '#666',
    tickLabel: isDarkMode ? '#888' : '#999'
  };

  function toSvgX(real) {
    return margin + plotSize / 2 + real * scale;
  }

  function toSvgY(imag) {
    return margin + plotSize / 2 - imag * scale; // Flip Y axis
  }

  function fromSvgX(svgX) {
    return (svgX - margin - plotSize / 2) / scale;
  }

  function fromSvgY(svgY) {
    return -(svgY - margin - plotSize / 2) / scale; // Flip Y axis back
  }

  // Compute label positions to avoid overlaps
  // Returns array of {above: boolean} for each point
  $: labelPositions = (() => {
    const positions = [];
    const labelWidth = 25;  // Approximate width of "P99"
    const labelHeight = 14; // Approximate height
    const aboveOffset = -12;
    const belowOffset = 24;

    for (let i = 0; i < points.length; i++) {
      const x = toSvgX(points[i].real);
      const yAbove = toSvgY(points[i].imag) + aboveOffset;
      const yBelow = toSvgY(points[i].imag) + belowOffset;

      // Check if "above" position overlaps with any previous label
      let useAbove = true;
      for (let j = 0; j < i; j++) {
        const prevX = toSvgX(points[j].real);
        const prevY = toSvgY(points[j].imag) + (positions[j].above ? aboveOffset : belowOffset);

        const dx = Math.abs(x - prevX);
        const dy = Math.abs(yAbove - prevY);

        if (dx < labelWidth && dy < labelHeight) {
          useAbove = false;
          break;
        }
      }

      positions.push({ above: useAbove });
    }
    return positions;
  })();

  // Continuous expansion when pushing against edge (pressure-sensitive)
  function expandWhileAtEdge() {
    if (isAtEdge && isDragging && draggedPointIndex >= 0) {
      // Base rate + pressure bonus: more pressure = faster expansion
      const baseRate = 0.008;
      const pressureBonus = edgePressure * 0.05;
      const expansionAmount = baseRate + pressureBonus;
      edgePushExpansion += expansionAmount;

      // Recalculate point position using current axis range
      const currentAxisRange = lockedAxisRange + edgePushExpansion;
      const currentScale = plotSize / (2 * currentAxisRange);

      // Convert stored SVG coords to data coords with new scale (max 1000 per dimension)
      const maxCoord = 1000;
      const newReal = Math.max(-maxCoord, Math.min(maxCoord, (lastSvgX - margin - plotSize / 2) / currentScale));
      const newImag = Math.max(-maxCoord, Math.min(maxCoord, -(lastSvgY - margin - plotSize / 2) / currentScale));

      points = points.map((p, i) =>
        i === draggedPointIndex
          ? { ...p, real: newReal, imag: newImag }
          : p
      );

      expansionFrameId = requestAnimationFrame(expandWhileAtEdge);
    }
  }

  function startEdgeExpansion() {
    if (!isAtEdge) {
      isAtEdge = true;
      expandWhileAtEdge();
    }
  }

  function stopEdgeExpansion() {
    isAtEdge = false;
    if (expansionFrameId) {
      cancelAnimationFrame(expansionFrameId);
      expansionFrameId = null;
    }
  }

  // Continuous shrinking when pushing toward origin (pressure-sensitive)
  function shrinkWhileAtOrigin() {
    if (isAtOrigin && isDragging && draggedPointIndex >= 0) {
      // Base rate + pressure bonus: closer to origin = faster shrinking
      const baseRate = 0.03;
      const pressureBonus = originPressure * 0.15;
      const shrinkAmount = baseRate + pressureBonus;

      // Calculate minimum axis range based on furthest point from origin (excluding dragged point)
      const otherPoints = points.filter((_, i) => i !== draggedPointIndex);
      const maxOtherExtent = otherPoints.length > 0
        ? Math.max(...otherPoints.map(p => Math.max(Math.abs(p.real), Math.abs(p.imag))))
        : 0;
      // Include dragged point's current position
      const draggedPoint = points[draggedPointIndex];
      const draggedExtent = Math.max(Math.abs(draggedPoint.real), Math.abs(draggedPoint.imag));
      const maxPointExtent = Math.max(maxOtherExtent, draggedExtent);
      const minAxisRange = Math.max(2, maxPointExtent * 1.1);

      // Only shrink if we have room to shrink
      const currentAxisRange = lockedAxisRange + edgePushExpansion;
      if (currentAxisRange > minAxisRange + 0.01) {
        edgePushExpansion -= shrinkAmount;
        // Clamp so we don't shrink below minimum
        const newAxisRange = lockedAxisRange + edgePushExpansion;
        if (newAxisRange < minAxisRange) {
          edgePushExpansion = minAxisRange - lockedAxisRange;
        }
      }

      shrinkFrameId = requestAnimationFrame(shrinkWhileAtOrigin);
    }
  }

  function startOriginShrink() {
    if (!isAtOrigin) {
      isAtOrigin = true;
      shrinkWhileAtOrigin();
    }
  }

  function stopOriginShrink() {
    isAtOrigin = false;
    if (shrinkFrameId) {
      cancelAnimationFrame(shrinkFrameId);
      shrinkFrameId = null;
    }
  }

  // Drag handlers
  function handlePointMouseDown(event, index) {
    event.preventDefault();
    saveToHistory(); // Save state before drag
    isDragging = true;
    draggedPointIndex = index;
    selectedPointIndex = index;
    lockedAxisRange = axisRange; // Lock current axis range during drag
    dispatch('dragstart');

    // Calculate offset between click position and point position
    const svgRect = svgElement.getBoundingClientRect();
    const clickSvgX = event.clientX - svgRect.left;
    const clickSvgY = event.clientY - svgRect.top;
    const pointSvgX = toSvgX(points[index].real);
    const pointSvgY = toSvgY(points[index].imag);
    dragOffsetX = pointSvgX - clickSvgX;
    dragOffsetY = pointSvgY - clickSvgY;
  }

  function handleSvgMouseMove(event) {
    if (!isDragging || draggedPointIndex < 0 || !svgElement) return;

    const svgRect = svgElement.getBoundingClientRect();
    let svgX = event.clientX - svgRect.left + dragOffsetX;
    let svgY = event.clientY - svgRect.top + dragOffsetY;

    // Calculate how far past the boundary the mouse is (pressure)
    const overflowLeft = margin - svgX;
    const overflowRight = svgX - (margin + plotSize);
    const overflowTop = margin - svgY;
    const overflowBottom = svgY - (margin + plotSize);
    const maxOverflow = Math.max(0, overflowLeft, overflowRight, overflowTop, overflowBottom);
    edgePressure = maxOverflow / 50; // Normalize: 50px past = 1.0 pressure

    // Clamp SVG coordinates to stay within the plot area
    svgX = Math.max(margin, Math.min(margin + plotSize, svgX));
    svgY = Math.max(margin, Math.min(margin + plotSize, svgY));

    // Store raw SVG coordinates for edge expansion
    lastSvgX = svgX;
    lastSvgY = svgY;

    const real = fromSvgX(svgX);
    const imag = fromSvgY(svgY);

    // Check if point is at the axis boundary (triggers expansion)
    const edgeThreshold = axisRange * 0.02; // 2% of axis range
    const atEdge = Math.abs(real) >= axisRange - edgeThreshold ||
                   Math.abs(imag) >= axisRange - edgeThreshold;

    // Check if point is near origin (triggers shrinking)
    // Calculate the minimum axis range needed to fit all other points
    const otherPoints = points.filter((_, i) => i !== draggedPointIndex);
    const maxOtherExtent = otherPoints.length > 0
      ? Math.max(...otherPoints.map(p => Math.max(Math.abs(p.real), Math.abs(p.imag))))
      : 0;
    const minNeededRange = Math.max(2, maxOtherExtent * 1.1);
    const canShrink = axisRange > minNeededRange + 0.1;

    const distanceFromOrigin = Math.sqrt(real * real + imag * imag);
    const originThreshold = axisRange * 0.15; // 15% of axis range
    const atOrigin = distanceFromOrigin <= originThreshold && canShrink;

    // Calculate origin pressure (closer = more pressure)
    originPressure = atOrigin ? (1 - distanceFromOrigin / originThreshold) : 0;

    if (atEdge) {
      stopOriginShrink();
      startEdgeExpansion();
    } else if (atOrigin) {
      stopEdgeExpansion();
      startOriginShrink();
    } else {
      stopEdgeExpansion();
      stopOriginShrink();
    }

    // Clamp to max 1000 per dimension
    const maxCoord = 1000;
    const clampedReal = Math.max(-maxCoord, Math.min(maxCoord, real));
    const clampedImag = Math.max(-maxCoord, Math.min(maxCoord, imag));

    points = points.map((p, i) =>
      i === draggedPointIndex
        ? { ...p, real: clampedReal, imag: clampedImag }
        : p
    );
  }

  function handleMouseUp() {
    if (isDragging) {
      stopEdgeExpansion();
      stopOriginShrink();
      edgePushExpansion = 0; // Reset expansion when drag ends
      lockedAxisRange = null; // Unlock axis to fit content
      isDragging = false;
      draggedPointIndex = -1;
      dispatch('dragend');
      notifyChange();
    }
  }
</script>

<div class="custom-constellation">
  {#if showHeader}
    <div class="header">
      <div class="header-left">
        {#if !isValid}
          <button
            type="button"
            class="normalize-btn"
            on:click={normalize}
            title={$_('constellation.normalizeTooltip')}
          >
            {$_('constellation.normalize')}
          </button>
        {/if}
      </div>
      <div class="header-actions">
        <div class="plot-mode-toggle">
          <button
            type="button"
            class="mode-btn"
            class:active={plotMode === 'cartesian'}
            on:click={() => plotMode = 'cartesian'}
            title={$_('constellation.cartesianMode')}
          >
            Re/Im
          </button>
          <button
            type="button"
            class="mode-btn"
            class:active={plotMode === 'polar'}
            on:click={() => plotMode = 'polar'}
            title={$_('constellation.polarMode')}
          >
            |z|/θ
          </button>
        </div>
        <button
          type="button"
          class="lucky-btn"
          on:click={generateRandomConstellation}
          on:mouseenter={(e) => handleDocHover('constellation-lucky', e)}
          on:mouseleave={handleDocLeave}
        >
          {$_('constellation.feelingLucky')}
        </button>
        <select on:change={(e) => { loadPreset(e.target.value); e.target.value = ''; }}>
          <option value="">{$_('constellation.loadPreset')}</option>
          <option value="bpsk">BPSK (2 {$_('constellation.points')})</option>
          <option value="qpsk">QPSK (4 {$_('constellation.points')})</option>
          <option value="4pam">4-PAM</option>
          <option value="8psk">8-PSK</option>
          <option value="16qam">16-QAM</option>
        </select>
        <button
          type="button"
          class="button-secondary"
          on:click={() => showTable = !showTable}
          on:mouseenter={(e) => handleDocHover('constellation-hide-table', e)}
          on:mouseleave={handleDocLeave}
        >
          {showTable ? $_('constellation.hideTable') : $_('constellation.showTable')}
        </button>
      </div>
    </div>
  {/if}

  <div class="content-layout" class:table-hidden={!showTable} class:plot-hidden={!showPlot}>
    <!-- SVG Visualization -->
    {#if showPlot}
    <div class="visualization-wrapper">
    <div class="visualization">
      <div class="plot-overlay-top-right">
        <button
          type="button"
          class="polar-toggle"
          class:active={plotMode === 'polar'}
          on:click={() => plotMode = plotMode === 'polar' ? 'cartesian' : 'polar'}
          title={plotMode === 'polar' ? ($_('constellation.cartesianModeInfo') || 'Switch to Cartesian (Re/Im)') : ($_('constellation.polarModeInfo') || 'Switch to Polar (|z|/θ)')}
        >
          Polar
        </button>
      </div>
      <div class="plot-overlay-top-left">
        <button
          type="button"
          class="undo-btn-small"
          on:click={undo}
          disabled={!canUndo}
          title={$_('constellation.undo') || 'Undo'}
        >
          ↶
        </button>
        <button
          type="button"
          class="undo-btn-small"
          on:click={redo}
          disabled={!canRedo}
          title={$_('constellation.redo') || 'Redo'}
        >
          ↷
        </button>
      </div>
      <svg
        bind:this={svgElement}
        width={svgSize}
        height={svgSize}
        viewBox="0 0 {svgSize} {svgSize}"
        class="constellation-svg"
      >
        <!-- Background -->
        <rect width={svgSize} height={svgSize} fill={svgColors.background}/>

        <!-- Unit circle -->
        <circle
          cx={margin + plotSize / 2}
          cy={margin + plotSize / 2}
          r={scale}
          fill="none"
          stroke={svgColors.unitCircle}
          stroke-width="1"
          stroke-dasharray="5,5"
        />

        <!-- Axes -->
        <line
          x1={margin} y1={margin + plotSize / 2}
          x2={margin + plotSize} y2={margin + plotSize / 2}
          stroke={svgColors.axis} stroke-width="1"
        />
        <line
          x1={margin + plotSize / 2} y1={margin}
          x2={margin + plotSize / 2} y2={margin + plotSize}
          stroke={svgColors.axis} stroke-width="1"
        />

        <!-- Axis labels - change based on mode -->
        {#if plotMode === 'cartesian'}
          <text x={margin + plotSize + 5} y={margin + plotSize / 2 + 4} font-size="12" fill={svgColors.labelSecondary}>Re</text>
          <text x={margin + plotSize / 2 - 4} y={margin - 10} font-size="12" fill={svgColors.labelSecondary} text-anchor="end">Im</text>
        {:else}
          <text x={margin + plotSize + 5} y={margin + plotSize / 2 + 4} font-size="12" fill={svgColors.labelSecondary}>0°</text>
          <text x={margin + plotSize / 2 + 4} y={margin - 5} font-size="12" fill={svgColors.labelSecondary}>90°</text>
          <text x={margin - 10} y={margin + plotSize / 2 + 4} font-size="12" fill={svgColors.labelSecondary} text-anchor="end">180°</text>
          <text x={margin + plotSize / 2 + 4} y={margin + plotSize + 15} font-size="12" fill={svgColors.labelSecondary}>-90°</text>
        {/if}

        <!-- Grid lines - Cartesian mode -->
        {#if plotMode === 'cartesian'}
          {#each gridTicks as val}
            <line
              x1={toSvgX(val)} y1={margin}
              x2={toSvgX(val)} y2={margin + plotSize}
              stroke={svgColors.grid} stroke-width="1"
            />
            <line
              x1={margin} y1={toSvgY(val)}
              x2={margin + plotSize} y2={toSvgY(val)}
              stroke={svgColors.grid} stroke-width="1"
            />
            <text x={toSvgX(val)} y={margin + plotSize + 15} font-size="10" fill={svgColors.tickLabel} text-anchor="middle">{val}</text>
            <text x={margin - 8} y={toSvgY(val) + 4} font-size="10" fill={svgColors.tickLabel} text-anchor="end">{val}</text>
          {/each}
        {:else}
          <!-- Grid - Polar mode: concentric circles for magnitude -->
          {#each polarRadii as r}
            <circle
              cx={margin + plotSize / 2}
              cy={margin + plotSize / 2}
              r={r * scale}
              fill="none"
              stroke={svgColors.grid}
              stroke-width="1"
            />
            <!-- Magnitude label on right side -->
            <text
              x={margin + plotSize / 2 + r * scale + 3}
              y={margin + plotSize / 2 - 3}
              font-size="9"
              fill={svgColors.tickLabel}
            >{r}</text>
          {/each}
          <!-- Grid - Polar mode: radial lines for phase angles -->
          {#each polarAngles as angle}
            {@const rad = angle * Math.PI / 180}
            {@const x2 = margin + plotSize / 2 + Math.cos(rad) * plotSize / 2}
            {@const y2 = margin + plotSize / 2 - Math.sin(rad) * plotSize / 2}
            <line
              x1={margin + plotSize / 2}
              y1={margin + plotSize / 2}
              x2={x2}
              y2={y2}
              stroke={svgColors.grid}
              stroke-width="1"
              stroke-dasharray={angle % 90 === 0 ? "none" : "3,3"}
            />
            <!-- Angle labels at the edge (skip 0, 90, 180, 270 as they have axis labels) -->
            {#if angle % 90 !== 0}
              {@const labelR = plotSize / 2 + 12}
              {@const lx = margin + plotSize / 2 + Math.cos(rad) * labelR}
              {@const ly = margin + plotSize / 2 - Math.sin(rad) * labelR}
              <text
                x={lx}
                y={ly + 3}
                font-size="9"
                fill={svgColors.tickLabel}
                text-anchor="middle"
              >{angle}°</text>
            {/if}
          {/each}
        {/if}

        <!-- Current energy circle (rendered after axes so it appears on top) -->
        {#if energy > 0}
          <g
            class="energy-circle"
            on:mouseenter={(e) => {
              showEnergyLabel = true;
              const rect = svgElement.getBoundingClientRect();
              energyLabelX = e.clientX - rect.left;
              energyLabelY = e.clientY - rect.top;
            }}
            on:mousemove={(e) => {
              const rect = svgElement.getBoundingClientRect();
              energyLabelX = e.clientX - rect.left;
              energyLabelY = e.clientY - rect.top;
            }}
            on:mouseleave={() => showEnergyLabel = false}
          >
            <circle
              cx={margin + plotSize / 2}
              cy={margin + plotSize / 2}
              r={Math.sqrt(energy) * scale}
              fill="none"
              stroke={svgColors.axis}
              stroke-width="2"
              style="cursor: default;"
            />
            <!-- Invisible wider stroke for easier hover -->
            <circle
              cx={margin + plotSize / 2}
              cy={margin + plotSize / 2}
              r={Math.sqrt(energy) * scale}
              fill="none"
              stroke="transparent"
              stroke-width="10"
            />
            {#if showEnergyLabel}
              <text
                x={energyLabelX}
                y={energyLabelY - 15}
                font-size="11"
                fill={svgColors.labelPrimary}
                text-anchor="middle"
                font-weight="500"
              >
                {$_('constellation.energyMean')}
              </text>
            {/if}
          </g>
        {/if}

        <!-- Mean point as dot (rendered before constellation points so points appear on top) -->
        {#if points.length > 0}
          <g
            class="mean-marker"
            on:mouseenter={() => showMeanLabel = true}
            on:mouseleave={() => showMeanLabel = false}
          >
            <!-- Invisible hit area for easier hover -->
            <circle
              cx={toSvgX(meanReal)}
              cy={toSvgY(meanImag)}
              r="10"
              fill="transparent"
              style="cursor: default;"
            />
            <!-- Filled dot for mean marker -->
            <circle
              cx={toSvgX(meanReal)}
              cy={toSvgY(meanImag)}
              r="5"
              fill={svgColors.axis}
            />
            {#if showMeanLabel}
              {@const meanPolar = toPolar(meanReal, meanImag)}
              <text
                x={toSvgX(meanReal)}
                y={toSvgY(meanImag) - 12}
                font-size="11"
                fill={svgColors.labelPrimary}
                text-anchor="middle"
                font-weight="500"
              >
                {$_('constellation.mean')}
              </text>
              <text
                x={toSvgX(meanReal)}
                y={toSvgY(meanImag) + 20}
                font-size="10"
                fill={svgColors.labelSecondary}
                text-anchor="middle"
              >
                {#if plotMode === 'cartesian'}
                  ({meanReal.toFixed(2)}, {meanImag.toFixed(2)})
                {:else}
                  (|z|={meanPolar.magnitude.toFixed(2)}, θ={formatPhase(meanPolar.phase)})
                {/if}
              </text>
            {/if}
          </g>
        {/if}

        <!-- Constellation points as "+" symbols -->
        {#each points as point, i}
          <g
            class="constellation-point"
            class:selected={selectedPointIndex === i}
            class:dragging={draggedPointIndex === i}
            on:mouseenter={() => selectPoint(i)}
            on:mouseleave={() => !isDragging && (selectedPointIndex = -1)}
          >
            <!-- Invisible larger hit area for easier dragging -->
            <circle
              cx={toSvgX(point.real)}
              cy={toSvgY(point.imag)}
              r="12"
              fill="transparent"
              style="cursor: {isDragging && draggedPointIndex === i ? 'grabbing' : 'grab'};"
              on:mousedown={(e) => handlePointMouseDown(e, i)}
            />
            <!-- "+" symbol for constellation point -->
            <line
              x1={toSvgX(point.real) - (selectedPointIndex === i ? 8 : 6)}
              y1={toSvgY(point.imag)}
              x2={toSvgX(point.real) + (selectedPointIndex === i ? 8 : 6)}
              y2={toSvgY(point.imag)}
              stroke={emphasisColor}
              stroke-width={selectedPointIndex === i ? 3 : 2.5}
              stroke-linecap="round"
              style="transition: all 0.15s ease;"
            />
            <line
              x1={toSvgX(point.real)}
              y1={toSvgY(point.imag) - (selectedPointIndex === i ? 8 : 6)}
              x2={toSvgX(point.real)}
              y2={toSvgY(point.imag) + (selectedPointIndex === i ? 8 : 6)}
              stroke={emphasisColor}
              stroke-width={selectedPointIndex === i ? 3 : 2.5}
              stroke-linecap="round"
              style="transition: all 0.15s ease;"
            />
            <text
              x={toSvgX(point.real)}
              y={toSvgY(point.imag) + (labelPositions[i]?.above ? -12 : 24)}
              font-size="11"
              fill={svgColors.labelPrimary}
              text-anchor="middle"
              font-weight="500"
              style="cursor: {isDragging && draggedPointIndex === i ? 'grabbing' : 'grab'};"
              on:mousedown={(e) => handlePointMouseDown(e, i)}
            >
              P{i+1}
            </text>
          </g>
        {/each}

        <!-- Coordinate tooltips layer (rendered on top of all point labels) -->
        {#each points as point, i}
          <g class="coordinate-tooltip">
            <!-- Background pill for coordinates -->
            <rect
              x={toSvgX(point.real) - 45}
              y={toSvgY(point.imag) + (labelPositions[i]?.above ? 12 : -28)}
              width="90"
              height="14"
              rx="4"
              ry="4"
              fill={svgColors.background}
              fill-opacity="0.9"
              style="opacity: {selectedPointIndex === i ? 1 : 0}; transition: opacity 0.3s ease-out; pointer-events: none;"
            />
            <text
              x={toSvgX(point.real)}
              y={toSvgY(point.imag) + (labelPositions[i]?.above ? 20 : -20)}
              font-size="10"
              fill={svgColors.labelSecondary}
              text-anchor="middle"
              style="cursor: {isDragging && draggedPointIndex === i ? 'grabbing' : 'grab'}; opacity: {selectedPointIndex === i ? 1 : 0}; transition: opacity 0.3s ease-out;"
              on:mousedown={(e) => handlePointMouseDown(e, i)}
            >
              {#if plotMode === 'cartesian'}
                ({point.real.toFixed(2)}, {point.imag.toFixed(2)})
              {:else}
                {@const polar = toPolar(point.real, point.imag)}
                (|z|={polar.magnitude.toFixed(2)}, θ={formatPhase(polar.phase)})
              {/if}
            </text>
          </g>
        {/each}
      </svg>
    </div>
    <!-- Arrow overlay when table is hidden -->
    {#if !showTable}
      <div class="nav-divider nav-divider-edge nav-divider-right">
        <button
          type="button"
          class="nav-arrow"
          on:click={() => showTable = true}
          title={$_('constellation.showTable') || 'Show table'}
        >
          <svg viewBox="0 0 10 24" fill="currentColor">
            <path d="M2 2 L8 12 L2 22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    {/if}
    </div>
    {/if}

    <!-- Navigation Arrows (center divider when both visible) -->
    {#if showPlot && showTable}
    <div class="nav-divider">
      <button
        type="button"
        class="nav-arrow nav-arrow-left"
        on:click={() => showPlot = false}
        title={$_('constellation.hidePlot') || 'Hide plot'}
      >
        <svg viewBox="0 0 10 24" fill="currentColor">
          <path d="M8 2 L2 12 L8 22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button
        type="button"
        class="nav-arrow nav-arrow-right"
        on:click={() => showTable = false}
        title={$_('constellation.hideTable') || 'Hide table'}
      >
        <svg viewBox="0 0 10 24" fill="currentColor">
          <path d="M2 2 L8 12 L2 22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    {/if}

    <!-- Points Table -->
    {#if showTable}
      <div class="points-table-container" class:few-points={points.length <= 5}>
        <!-- Arrow overlay when plot is hidden -->
        {#if !showPlot}
          <div class="nav-divider nav-divider-edge nav-divider-left">
            <button
              type="button"
              class="nav-arrow"
              on:click={() => showPlot = true}
              title={$_('constellation.showPlot') || 'Show plot'}
            >
              <svg viewBox="0 0 10 24" fill="currentColor">
                <path d="M8 2 L2 12 L8 22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        {/if}
        <table class="points-table points-table-header">
          <thead>
            <tr>
              <th></th>
              {#if plotMode === 'cartesian'}
                <th>{$_('constellation.real')}</th>
                <th>{$_('constellation.imaginary')}</th>
              {:else}
                <th>{$_('constellation.magnitude')}</th>
                <th>{$_('constellation.phase')}</th>
              {/if}
              <th>{$_('constellation.probability')}</th>
              <th></th>
            </tr>
          </thead>
        </table>
        <div class="points-table-scroll" bind:this={tableScrollElement}>
        <table class="points-table">
          <tbody>
            {#each points as point, i}
              {@const polar = toPolar(point.real, point.imag)}
              <tr
                class:selected={selectedPointIndex === i}
                on:mouseenter={() => selectedPointIndex = i}
                on:mouseleave={() => selectedPointIndex = -1}
              >
                <td class="point-label">P{i+1}</td>
                {#if plotMode === 'cartesian'}
                  <td>
                    <input
                      type="text"
                      inputmode="decimal"
                      use:editableValue={{ value: formatForCenter(point.real), index: i, field: 'real' }}
                      title={`Full precision: ${point.real}`}
                      on:blur={(e) => handleInputBlur(e, i, 'real')}
                      on:keydown={handleInputKeydown}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputmode="decimal"
                      use:editableValue={{ value: formatForCenter(point.imag), index: i, field: 'imag' }}
                      title={`Full precision: ${point.imag}`}
                      on:blur={(e) => handleInputBlur(e, i, 'imag')}
                      on:keydown={handleInputKeydown}
                    />
                  </td>
                {:else}
                  <td>
                    <input
                      type="text"
                      inputmode="decimal"
                      use:editableValue={{ value: formatForCenter(polar.magnitude), index: i, field: 'magnitude' }}
                      title={`Full precision: ${polar.magnitude}`}
                      on:blur={(e) => handlePolarBlur(e, i, 'magnitude')}
                      on:keydown={handleInputKeydown}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputmode="decimal"
                      use:editableValue={{ value: formatForCenter(polar.phase * 180 / Math.PI, 1), index: i, field: 'phase' }}
                      title={`Full precision: ${polar.phase * 180 / Math.PI}°`}
                      on:blur={(e) => handlePolarBlur(e, i, 'phase')}
                      on:keydown={handleInputKeydown}
                    />
                  </td>
                {/if}
                <td>
                  <input
                    type="text"
                    inputmode="decimal"
                    use:editableValue={{ value: formatForCenter(point.prob), index: i, field: 'prob' }}
                    title={`Full precision: ${point.prob}`}
                    on:blur={(e) => handleInputBlur(e, i, 'prob')}
                    on:keydown={handleInputKeydown}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    class="button-danger-small"
                    on:click={() => removePoint(i)}
                    disabled={points.length <= 2}
                  >
                    ×
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        </div>
        <div class="table-actions">
          <div class="add-point-row">
            <button
              type="button"
              class="button-secondary"
              on:click={addPoint}
              disabled={points.length >= 99}
            >
              + {$_('constellation.addPoint')}
            </button>
            {#if points.length >= 99}
              <span class="max-points-msg">{$_('constellation.maxPoints')}</span>
            {/if}
          </div>
          <span class="point-count">{points.length} {$_('constellation.points')}</span>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .custom-constellation {
    background: var(--simulation-background, #f9fafb);
    border-radius: 8px;
    padding: var(--spacing-sm, 8px);
    border: 1px solid var(--border-color, #e5e7eb);
    text-align: left;
    width: fit-content;
    overflow: visible;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md, 12px);
    flex-wrap: wrap;
    gap: var(--spacing-sm, 8px);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
  }

  .header h4 {
    margin: 0;
    color: var(--text-color, #1f2937);
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-sm, 8px);
    align-items: center;
  }

  .header-actions select,
  .header-actions button {
    font-size: var(--font-size-sm, 14px);
    padding: 6px 12px;
  }

  .plot-mode-toggle {
    display: flex;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    overflow: hidden;
  }

  .mode-btn {
    background: var(--surface-color);
    border: none;
    color: var(--text-color-secondary);
    font-size: 13px;
    font-weight: 500;
    padding: 6px 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mode-btn:first-child {
    border-right: 1px solid var(--border-color);
  }

  .mode-btn:hover:not(.active) {
    background: var(--hover-background);
  }

  .mode-btn.active {
    background: var(--primary-color);
    color: white;
  }

  .lucky-btn {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-color);
    font-size: var(--font-size-sm, 14px);
    font-weight: 500;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .lucky-btn:hover {
    background: var(--hover-background);
    border-color: var(--text-color-secondary);
  }

  .lucky-btn:active {
    transform: scale(0.97);
  }

  .button-icon svg {
    width: 18px;
    height: 18px;
  }

  .normalize-btn {
    background: #6b7280;
    border: 1px solid #6b7280;
    color: white;
    font-weight: 500;
    font-size: var(--font-size-sm, 14px);
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .normalize-btn:hover {
    background: #4b5563;
    border-color: #4b5563;
  }

  .content-layout {
    display: grid;
    grid-template-columns: 340px auto 340px;
    gap: 0;
    align-items: start;
    max-width: 720px;
    overflow: visible;
  }

  .content-layout.table-hidden {
    grid-template-columns: 340px;
    max-width: 360px;
  }

  .content-layout.plot-hidden {
    grid-template-columns: 340px;
    max-width: 360px;
  }

  /* Navigation Divider with Arrows */
  .nav-divider {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    width: 20px;
    height: 340px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .content-layout:hover .nav-divider {
    opacity: 1;
  }

  .nav-divider-edge {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 100px;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-divider-right {
    right: -12px;
  }

  .nav-divider-left {
    left: -12px;
  }

  .nav-arrow {
    background: transparent;
    border: none;
    padding: 4px 2px;
    cursor: pointer;
    color: var(--text-color-secondary);
    opacity: 0.5;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    box-shadow: none;
  }

  .nav-arrow:hover {
    opacity: 1;
    color: var(--primary-color);
    background: var(--hover-background);
    transform: none;
    box-shadow: none;
  }

  .nav-arrow svg {
    width: 12px;
    height: 80px;
  }

  .visualization-wrapper {
    display: flex;
    flex-shrink: 0;
    flex-grow: 0;
    width: 340px;
    position: relative;
  }

  .visualization {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: fit-content;
    position: relative;
  }

  .visualization svg {
    border-radius: 8px;
    border: 1px solid var(--border-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .constellation-svg text {
    font-family: 'Inter', sans-serif;
    font-weight: 400;
  }

  .plot-overlay-top-right {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    flex-direction: row;
    gap: 2px;
    z-index: 10;
  }

  .plot-overlay-top-left {
    position: absolute;
    top: 8px;
    left: 8px;
    display: flex;
    flex-direction: row;
    gap: 2px;
    z-index: 10;
  }

  .polar-toggle {
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-color-secondary);
    font-size: 13px;
    font-weight: 500;
    padding: 4px 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.85;
  }

  .polar-toggle:hover {
    opacity: 1;
    background: var(--hover-background);
  }

  .polar-toggle.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
    opacity: 1;
  }

  .undo-btn-small {
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-color-secondary);
    font-size: 16px;
    font-weight: 500;
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.85;
    line-height: 1;
    min-width: 28px;
    min-height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .undo-btn-small:hover:not(:disabled) {
    opacity: 1;
    background: var(--hover-background);
  }

  .undo-btn-small:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .points-table-container {
    background: var(--card-background);
    border-radius: 8px;
    padding: var(--spacing-md, 12px);
    border: 1px solid var(--border-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    height: 340px;
    width: 340px;
    display: flex;
    flex-direction: column;
    overflow: visible;
    position: relative;
  }

  .points-table-scroll {
    flex: 1;
    overflow-y: scroll;
    overflow-x: hidden;
    min-height: 0;
  }

  /* Center table rows vertically when 5 or fewer points */
  .points-table-container.few-points .points-table-scroll {
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow-y: auto;
  }

  /* Add top border to first row when centered (to match bottom border of last row) */
  .points-table-container.few-points .points-table tbody tr:first-child td {
    border-top: 1px solid var(--border-color);
  }

  .points-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-family, 'Inter', Arial, sans-serif);
    font-size: var(--font-size-base, 1em);
    table-layout: fixed;
  }

  .points-table-header {
    flex-shrink: 0;
    padding-right: 8px; /* Account for scrollbar width in body table */
  }

  .points-table th {
    background: var(--surface-color);
    padding: 8px;
    text-align: center;
    font-weight: 600;
    font-size: var(--font-size-base, 1em);
    color: var(--text-color);
    border-bottom: 1px solid var(--border-color);
  }

  .points-table th:nth-child(1),
  .points-table td:nth-child(1) {
    width: 40px;
    min-width: 40px;
    padding: 6px 4px 6px 8px;
    white-space: nowrap;
    text-align: center;
  }

  .points-table th:nth-child(2),
  .points-table th:nth-child(3),
  .points-table th:nth-child(4),
  .points-table td:nth-child(2),
  .points-table td:nth-child(3),
  .points-table td:nth-child(4) {
    width: auto;
    padding: 6px 4px;
  }

  .points-table th:nth-child(5),
  .points-table td:nth-child(5) {
    width: 34px;
    padding: 6px 8px 6px 4px;
    white-space: nowrap;
  }

  .points-table td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--border-color);
    text-align: center;
    font-size: var(--font-size-base, 1em);
  }

  .points-table tbody tr:last-child td {
    border-bottom: none;
  }

  .points-table tr:hover {
    background: var(--hover-background);
  }

  .points-table tr.selected {
    background: color-mix(in srgb, var(--primary-color) 10%, var(--card-background));
  }

  .point-label {
    font-weight: 600;
    font-family: var(--font-family, 'Inter', Arial, sans-serif);
    color: var(--text-color-secondary);
    text-align: right;
  }

  .points-table input {
    width: 100%;
    padding: 5px 6px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: var(--font-size-base, 1em);
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    min-width: 70px;
    background: var(--input-background);
    color: var(--text-color);
    text-align: center;
    box-sizing: border-box;
  }

  .points-table input:focus {
    outline: none;
    border-color: var(--primary-color, #C8102E);
    box-shadow: 0 0 0 2px rgba(200, 16, 46, 0.1);
  }

  /* Hide number input spinners for more space */
  .points-table input[type="number"]::-webkit-outer-spin-button,
  .points-table input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .points-table input[type="number"] {
    -moz-appearance: textfield;
  }

  .button-danger-small {
    background: transparent;
    color: var(--text-color);
    border: none;
    border-radius: 4px;
    width: 22px;
    height: 22px;
    padding: 0;
    cursor: pointer;
    font-size: 14px;
    font-weight: 400;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.3;
    transition: opacity 0.15s ease;
    box-shadow: none;
    outline: none;
  }

  .button-danger-small:hover:not(:disabled) {
    opacity: 0.8;
  }

  .button-danger-small:disabled {
    opacity: 0.15;
    cursor: not-allowed;
  }

  .points-table tr:hover .button-danger-small {
    opacity: 0.5;
  }

  .points-table tr:hover .button-danger-small:hover:not(:disabled) {
    opacity: 1;
  }

  .table-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--spacing-sm, 8px);
    border-top: 1px solid var(--border-color);
    background: var(--card-background);
  }

  .add-point-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
  }

  .max-points-msg {
    font-size: 12px;
    color: var(--text-color-secondary);
    flex-shrink: 0;
  }

  .point-count {
    font-size: 13px;
    color: var(--text-color-secondary);
    font-weight: 500;
    margin-right: var(--spacing-md, 12px);
  }

  .constellation-point {
    transition: all 0.2s ease;
  }

  .constellation-point.dragging {
    transition: none;
  }


  .visualization svg {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
  }

  @media (max-width: 768px) {
    .content-layout {
      grid-template-columns: 1fr;
      max-width: 400px;
    }

    .content-layout.table-hidden {
      max-width: 400px;
    }

    .points-table-container {
      min-width: unset;
      width: 100%;
    }

    .validation-metrics {
      flex-direction: column;
      gap: var(--spacing-sm, 8px);
    }
  }
</style>
