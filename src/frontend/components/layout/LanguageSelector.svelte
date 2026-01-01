<script>
  import { locale, _ } from 'svelte-i18n';
  import { languages, setLanguage } from '../../i18n/i18n.js';
  import { theme } from '../../stores/theme.js';
  import catalanFlag from '../../assets/flags/ca.png';

  let isOpen = false;
  let searchQuery = '';
  let dropdownRef;

  // Get current language info
  $: currentLang = languages.find(l => l.code === $locale) || languages[0];

  // Check if a flag is a custom flag (SVG or image)
  function isCustomFlag(flag) {
    return flag && (flag.startsWith('svg:') || flag.startsWith('img:'));
  }

  // Check if a flag is an image flag
  function isImageFlag(flag) {
    return flag && flag.startsWith('img:');
  }

  // Map of imported flag images
  const flagImages = {
    'ca': catalanFlag
  };

  // Get image path for flag
  function getFlagImagePath(flag) {
    const code = flag.replace('img:', '');
    return flagImages[code] || `/flags/${code}.png`;
  }

  // Filter languages based on search
  $: filteredLanguages = searchQuery
    ? languages.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : languages;

  function toggleDropdown() {
    isOpen = !isOpen;
    if (isOpen) {
      searchQuery = '';
      // Focus search input when opening
      setTimeout(() => {
        const input = dropdownRef?.querySelector('input');
        if (input) input.focus();
      }, 50);
    }
  }

  function selectLanguage(code) {
    setLanguage(code);
    // Apply language-specific theme (easter eggs)
    theme.applyLanguageTheme(code);
    isOpen = false;
    searchQuery = '';
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      isOpen = false;
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event) {
    if (dropdownRef && !dropdownRef.contains(event.target)) {
      isOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} on:keydown={handleKeydown} />

<div class="language-selector" bind:this={dropdownRef}>
  <button
    class="selector-button"
    on:click|stopPropagation={toggleDropdown}
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    title={$_('language.select')}
  >
    <span class="flag">
      {#if isImageFlag(currentLang.flag)}
        <img class="custom-flag-img" src={getFlagImagePath(currentLang.flag)} alt={currentLang.name} />
      {:else if isCustomFlag(currentLang.flag)}
        {#if currentLang.flag === 'svg:ca'}
          <!-- Catalan Senyera flag - waving pennant style (fallback) -->
          <svg class="custom-flag" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <path fill="#66757F" d="M5 2a2 2 0 0 0-2 2v29a2 2 0 1 0 4 0V4a2 2 0 0 0-2-2z"/>
            <circle fill="#66757F" cx="5" cy="2" r="2"/>
            <defs>
              <clipPath id="waveCa">
                <path d="M7 3c6 0 10 3 16 3s10-3 13-3v24c-3 0-7 3-13 3s-10-3-16-3V3z"/>
              </clipPath>
            </defs>
            <g clip-path="url(#waveCa)">
              <rect x="7" y="3" width="29" height="24" fill="#FCDD09"/>
              <rect x="7" y="5.67" width="29" height="2.67" fill="#DA121A"/>
              <rect x="7" y="11" width="29" height="2.67" fill="#DA121A"/>
              <rect x="7" y="16.33" width="29" height="2.67" fill="#DA121A"/>
              <rect x="7" y="21.67" width="29" height="2.67" fill="#DA121A"/>
            </g>
            <path fill="rgba(0,0,0,0.1)" d="M7 3c6 0 10 3 16 3s10-3 13-3v2c-3 0-7 3-13 3s-10-3-16-3V3z"/>
          </svg>
        {/if}
      {:else}
        {currentLang.flag}
      {/if}
    </span>
    <span class="lang-code">{currentLang.code.toUpperCase()}</span>
    <svg class="chevron" class:rotated={isOpen} width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>

  {#if isOpen}
    <div class="dropdown" role="listbox" aria-label={$_('language.select')}>
      <div class="search-container">
        <input
          type="text"
          placeholder={$_('language.search')}
          bind:value={searchQuery}
          on:click|stopPropagation
          class="search-input"
        />
      </div>

      <div class="language-list">
        {#each filteredLanguages as lang (lang.code)}
          <button
            class="language-option"
            class:selected={lang.code === $locale}
            on:click|stopPropagation={() => selectLanguage(lang.code)}
            role="option"
            aria-selected={lang.code === $locale}
          >
            <span class="option-flag">
              {#if isImageFlag(lang.flag)}
                <img class="custom-flag-option-img" src={getFlagImagePath(lang.flag)} alt={lang.name} />
              {:else if isCustomFlag(lang.flag)}
                {#if lang.flag === 'svg:ca'}
                  <!-- Catalan Senyera flag - waving pennant style (fallback) -->
                  <svg class="custom-flag-option" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#66757F" d="M5 2a2 2 0 0 0-2 2v29a2 2 0 1 0 4 0V4a2 2 0 0 0-2-2z"/>
                    <circle fill="#66757F" cx="5" cy="2" r="2"/>
                    <defs>
                      <clipPath id="waveCaOpt">
                        <path d="M7 3c6 0 10 3 16 3s10-3 13-3v24c-3 0-7 3-13 3s-10-3-16-3V3z"/>
                      </clipPath>
                    </defs>
                    <g clip-path="url(#waveCaOpt)">
                      <rect x="7" y="3" width="29" height="24" fill="#FCDD09"/>
                      <rect x="7" y="5.67" width="29" height="2.67" fill="#DA121A"/>
                      <rect x="7" y="11" width="29" height="2.67" fill="#DA121A"/>
                      <rect x="7" y="16.33" width="29" height="2.67" fill="#DA121A"/>
                      <rect x="7" y="21.67" width="29" height="2.67" fill="#DA121A"/>
                    </g>
                    <path fill="rgba(0,0,0,0.1)" d="M7 3c6 0 10 3 16 3s10-3 13-3v2c-3 0-7 3-13 3s-10-3-16-3V3z"/>
                  </svg>
                {/if}
              {:else}
                {lang.flag}
              {/if}
            </span>
            <span class="option-name">{lang.nativeName}</span>
            <span class="option-english">{lang.name}</span>
            {#if lang.code === $locale}
              <svg class="check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            {/if}
          </button>
        {/each}

        {#if filteredLanguages.length === 0}
          <div class="no-results">No languages found</div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .language-selector {
    position: relative;
    z-index: 1000;
  }

  .selector-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: white;
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: 600;
    transition: all var(--transition-fast);
  }

  .selector-button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .flag {
    font-size: 16px;
    line-height: 1;
    display: flex;
    align-items: center;
  }

  .custom-flag {
    width: 20px;
    height: 20px;
  }

  .custom-flag-img {
    width: 20px;
    height: auto;
    object-fit: contain;
  }

  .lang-code {
    font-size: 12px;
    letter-spacing: 0.5px;
  }

  .chevron {
    transition: transform 0.2s ease;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 320px;
    max-height: 400px;
    background: var(--card-background, white);
    border: 1px solid var(--border-color, transparent);
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    animation: slideDown 0.15s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .search-container {
    padding: 12px;
    border-bottom: 1px solid var(--border-color, #eee);
    background: var(--surface-color, #fafafa);
  }

  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    background: var(--input-background, white);
    color: var(--text-color, #333);
  }

  .search-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(200, 16, 46, 0.1);
  }

  .language-list {
    max-height: 320px;
    overflow-y: auto;
    padding: 4px;
  }

  .language-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s;
  }

  .language-option:hover {
    background: var(--hover-background, #f5f5f5);
  }

  .language-option.selected {
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  }

  .option-flag {
    font-size: 20px;
    line-height: 1;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .custom-flag-option {
    width: 24px;
    height: 24px;
  }

  .custom-flag-option-img {
    width: 24px;
    height: auto;
    object-fit: contain;
  }

  .option-name {
    font-weight: 600;
    color: var(--text-color, #333);
    font-size: 14px;
  }

  .option-english {
    font-size: 12px;
    color: var(--text-color-secondary, #888);
    margin-left: auto;
    flex-shrink: 0;
  }

  .check {
    color: var(--primary-color);
    flex-shrink: 0;
    margin-left: 4px;
  }

  .no-results {
    padding: 20px;
    text-align: center;
    color: var(--text-color-secondary, #888);
    font-size: 14px;
  }

  /* Scrollbar styling */
  .language-list::-webkit-scrollbar {
    width: 6px;
  }

  .language-list::-webkit-scrollbar-track {
    background: var(--surface-color, #f1f1f1);
  }

  .language-list::-webkit-scrollbar-thumb {
    background: var(--border-color, #ccc);
    border-radius: 3px;
  }

  .language-list::-webkit-scrollbar-thumb:hover {
    background: var(--text-color-secondary, #aaa);
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .dropdown {
      width: 280px;
      right: -10px;
    }

    .option-english {
      display: none;
    }
  }
</style>
