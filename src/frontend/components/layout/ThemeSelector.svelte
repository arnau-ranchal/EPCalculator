<script>
  import { _ } from 'svelte-i18n';
  import { theme, colorThemes, applyTheme } from '../../stores/theme.js';
  import { onMount } from 'svelte';

  let isOpen = false;
  let dropdownRef;

  // Apply theme whenever it changes
  $: applyTheme($theme);

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function selectColor(colorId) {
    theme.setColorTheme(colorId);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      isOpen = false;
    }
  }

  function handleClickOutside(event) {
    if (dropdownRef && !dropdownRef.contains(event.target)) {
      isOpen = false;
    }
  }

  // Apply theme on mount
  onMount(() => {
    applyTheme($theme);
  });
</script>

<svelte:window on:click={handleClickOutside} on:keydown={handleKeydown} />

<div class="theme-selector" bind:this={dropdownRef}>
  <button
    class="selector-button"
    on:click|stopPropagation={toggleDropdown}
    aria-expanded={isOpen}
    aria-haspopup="true"
    title={$_('theme.select')}
  >
    {#if $theme.darkMode}
      <svg class="theme-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    {:else}
      <svg class="theme-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    {/if}
    <svg class="chevron" class:rotated={isOpen} width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>

  {#if isOpen}
    <div class="dropdown" role="menu">
      <div class="section">
        <h4 class="section-title">{$_('theme.colorTheme')}</h4>
        <div class="color-grid">
          {#each colorThemes as colorTheme (colorTheme.id)}
            <button
              class="color-option"
              class:selected={$theme.colorTheme === colorTheme.id}
              style="--color: {colorTheme.primary}"
              on:click|stopPropagation={() => selectColor(colorTheme.id)}
              title={colorTheme.name}
            >
              <span class="color-swatch"></span>
              {#if $theme.colorTheme === colorTheme.id}
                <svg class="check" width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4.5L6.5 11.5L3 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <button
          class="dark-mode-toggle"
          on:click|stopPropagation={() => theme.toggleDarkMode()}
        >
          <span class="toggle-label">
            {#if $theme.darkMode}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            {:else}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            {/if}
            <span>{$_('theme.darkMode')}</span>
          </span>
          <span class="toggle-switch" class:active={$theme.darkMode}>
            <span class="toggle-knob"></span>
          </span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .theme-selector {
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

  .theme-icon {
    width: 16px;
    height: 16px;
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
    width: 220px;
    background: var(--card-background, white);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    animation: slideDown 0.15s ease;
    padding: 12px;
  }

  :global(.dark-mode) .dropdown {
    border: 1px solid var(--border-color);
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

  .section {
    padding: 4px 0;
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-color-secondary, #666);
    margin: 0 0 10px 0;
    padding: 0 4px;
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .color-option {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 2px solid transparent;
    background: transparent;
    cursor: pointer;
    padding: 4px;
    transition: all 0.15s ease;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-option:hover {
    transform: scale(1.1);
  }

  .color-option.selected {
    border-color: var(--color);
  }

  .color-swatch {
    width: 100%;
    height: 100%;
    border-radius: 6px;
    background: var(--color);
    display: block;
  }

  .color-option .check {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
  }

  .divider {
    height: 1px;
    background: var(--border-color, #eee);
    margin: 12px 0;
  }

  .dark-mode-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 8px;
    background: var(--hover-background, rgba(0,0,0,0.05));
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .dark-mode-toggle:hover {
    background: var(--hover-background, rgba(0,0,0,0.08));
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color, #333);
  }

  .toggle-label svg {
    color: var(--text-color-secondary, #666);
  }

  .toggle-switch {
    width: 40px;
    height: 22px;
    background: var(--border-color, #ddd);
    border-radius: 11px;
    position: relative;
    transition: background 0.2s ease;
  }

  .toggle-switch.active {
    background: var(--primary-color);
  }

  .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .toggle-switch.active .toggle-knob {
    transform: translateX(18px);
  }

  @media (max-width: 768px) {
    .dropdown {
      width: 200px;
      right: -10px;
    }

    .color-option {
      width: 36px;
      height: 36px;
    }
  }
</style>
