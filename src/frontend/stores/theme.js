import { writable, derived } from 'svelte/store';

// Available color themes (shown in selector)
export const colorThemes = [
  { id: 'red', name: 'Ruby Red', primary: '#C8102E', primaryDark: '#A00E24', primaryLight: '#FCF2F4' },
  { id: 'blue', name: 'Ocean Blue', primary: '#1976D2', primaryDark: '#1565C0', primaryLight: '#E3F2FD' },
  { id: 'green', name: 'Forest Green', primary: '#2E7D32', primaryDark: '#1B5E20', primaryLight: '#E8F5E9' },
  { id: 'purple', name: 'Royal Purple', primary: '#7B1FA2', primaryDark: '#6A1B9A', primaryLight: '#F3E5F5' },
  { id: 'orange', name: 'Sunset Orange', primary: '#E65100', primaryDark: '#BF360C', primaryLight: '#FFF3E0' },
  { id: 'teal', name: 'Teal', primary: '#00796B', primaryDark: '#004D40', primaryLight: '#E0F2F1' },
  { id: 'pink', name: 'Pink', primary: '#C2185B', primaryDark: '#AD1457', primaryLight: '#FCE4EC' },
  { id: 'indigo', name: 'Indigo', primary: '#303F9F', primaryDark: '#283593', primaryLight: '#E8EAF6' }
];

// Hidden color themes (easter eggs, not shown in selector)
const hiddenColorThemes = [
  { id: 'black', name: 'Obsidian', primary: '#1a1a1a', primaryDark: '#000000', primaryLight: '#f0f0f0' }
];

// All color themes combined for lookup
const allColorThemes = [...colorThemes, ...hiddenColorThemes];

// Get stored preferences or defaults
function getStoredTheme() {
  if (typeof window === 'undefined') return { colorTheme: 'red', darkMode: false, previousColorTheme: null };

  const stored = localStorage.getItem('theme');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { ...parsed, previousColorTheme: parsed.previousColorTheme || null };
    } catch (e) {
      return { colorTheme: 'red', darkMode: false, previousColorTheme: null };
    }
  }

  // Default to light mode
  return { colorTheme: 'red', darkMode: false, previousColorTheme: null };
}

// Create the theme store
function createThemeStore() {
  const initial = getStoredTheme();
  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    setColorTheme: (colorTheme) => {
      update(state => {
        const newState = { ...state, colorTheme };
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', JSON.stringify(newState));
        }
        return newState;
      });
    },
    toggleDarkMode: () => {
      update(state => {
        const newState = { ...state, darkMode: !state.darkMode };
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', JSON.stringify(newState));
        }
        return newState;
      });
    },
    setDarkMode: (darkMode) => {
      update(state => {
        const newState = { ...state, darkMode };
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', JSON.stringify(newState));
        }
        return newState;
      });
    },
    // Handle language-based theme changes (easter eggs)
    applyLanguageTheme: (languageCode) => {
      update(state => {
        // Enchanting Table language gets black theme
        if (languageCode === 'gal') {
          // Save current theme before switching to easter egg
          const newState = {
            ...state,
            previousColorTheme: state.colorTheme !== 'black' ? state.colorTheme : state.previousColorTheme,
            colorTheme: 'black'
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('theme', JSON.stringify(newState));
          }
          return newState;
        } else if (state.colorTheme === 'black' && state.previousColorTheme) {
          // Revert to previous theme when leaving easter egg language
          const newState = {
            ...state,
            colorTheme: state.previousColorTheme,
            previousColorTheme: null
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('theme', JSON.stringify(newState));
          }
          return newState;
        }
        return state;
      });
    }
  };
}

export const theme = createThemeStore();

// Derived store for current color theme object
export const currentColorTheme = derived(theme, $theme =>
  allColorThemes.find(t => t.id === $theme.colorTheme) || colorThemes[0]
);

// Apply theme to document
export function applyTheme(themeState) {
  if (typeof document === 'undefined') return;

  const colorTheme = allColorThemes.find(t => t.id === themeState.colorTheme) || colorThemes[0];
  const root = document.documentElement;

  // Apply color theme
  root.style.setProperty('--primary-color', colorTheme.primary);
  root.style.setProperty('--primary-color-dark', colorTheme.primaryDark);
  root.style.setProperty('--primary-color-light', colorTheme.primaryLight);

  // Apply dark mode
  if (themeState.darkMode) {
    root.classList.add('dark-mode');
  } else {
    root.classList.remove('dark-mode');
  }
}
