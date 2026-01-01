import { writable, derived } from 'svelte/store';

// localStorage key for tutorial state
const TUTORIAL_STORAGE_KEY = 'epcalculator_tutorial';

// Default tutorial state
const defaultTutorialState = {
  hasSeenWelcome: false,
  hasSeenPlotTutorial: false,
  hasSeenContourComparisonTutorial: false,
  hasSeenConstellationTutorial: false
};

// Load initial state from localStorage
function loadTutorialState() {
  if (typeof window === 'undefined') return defaultTutorialState;

  try {
    const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (stored) {
      return { ...defaultTutorialState, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load tutorial state:', e);
  }
  return defaultTutorialState;
}

// Save state to localStorage
function saveTutorialState(state) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save tutorial state:', e);
  }
}

// Create the tutorial store
function createTutorialStore() {
  const { subscribe, set, update } = writable(loadTutorialState());

  return {
    subscribe,

    // Mark welcome as seen
    markWelcomeSeen: () => {
      update(state => {
        const newState = { ...state, hasSeenWelcome: true };
        saveTutorialState(newState);
        return newState;
      });
    },

    // Mark plot tutorial as seen
    markPlotTutorialSeen: () => {
      update(state => {
        const newState = { ...state, hasSeenPlotTutorial: true };
        saveTutorialState(newState);
        return newState;
      });
    },

    // Mark contour comparison tutorial as seen
    markContourComparisonTutorialSeen: () => {
      update(state => {
        const newState = { ...state, hasSeenContourComparisonTutorial: true };
        saveTutorialState(newState);
        return newState;
      });
    },

    // Mark constellation tutorial as seen
    markConstellationTutorialSeen: () => {
      update(state => {
        const newState = { ...state, hasSeenConstellationTutorial: true };
        saveTutorialState(newState);
        return newState;
      });
    },

    // Reset all tutorials (for testing/debugging)
    reset: () => {
      const newState = { ...defaultTutorialState };
      saveTutorialState(newState);
      set(newState);
    }
  };
}

export const tutorialState = createTutorialStore();

// Derived stores for convenience
export const isNewUser = derived(tutorialState, $state => !$state.hasSeenWelcome);
export const shouldShowPlotTutorial = derived(tutorialState, $state => !$state.hasSeenPlotTutorial);
export const shouldShowContourComparisonTutorial = derived(tutorialState, $state => !$state.hasSeenContourComparisonTutorial);
export const shouldShowConstellationTutorial = derived(tutorialState, $state => !$state.hasSeenConstellationTutorial);

// Current spotlight tutorial state
export const spotlightTutorial = writable({
  active: false,
  steps: [],
  currentStep: 0
});

// Start a spotlight tutorial with given steps
export function startSpotlightTutorial(steps) {
  spotlightTutorial.set({
    active: true,
    steps,
    currentStep: 0
  });
}

// Move to next step or end tutorial
export function nextSpotlightStep() {
  spotlightTutorial.update(state => {
    if (state.currentStep >= state.steps.length - 1) {
      return { active: false, steps: [], currentStep: 0 };
    }
    return { ...state, currentStep: state.currentStep + 1 };
  });
}

// End tutorial early
export function endSpotlightTutorial() {
  spotlightTutorial.set({ active: false, steps: [], currentStep: 0 });
}
