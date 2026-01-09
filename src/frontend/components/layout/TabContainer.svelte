<script>
  import { writable } from 'svelte/store';

  export let tabs = [];
  export let activeTab = 0;

  // Create a store for active tab to allow external control
  const activeTabStore = writable(activeTab);

  // Update store when prop changes
  $: activeTabStore.set(activeTab);

  function selectTab(index) {
    activeTabStore.set(index);
    activeTab = index;
  }

  // Export the store so parent can control it
  export function setActiveTab(index) {
    selectTab(index);
  }
</script>

<div class="tabs-container">
  <!-- Tab Navigation -->
  <nav class="tab-nav" role="tablist">
    {#each tabs as tab, index}
      <button
        type="button"
        role="tab"
        aria-selected={$activeTabStore === index}
        aria-controls="tabpanel-{index}"
        id="tab-{index}"
        class="tab-button"
        class:active={$activeTabStore === index}
        on:click={() => selectTab(index)}
      >
        {#if tab.decoration}
          <span class="tab-decoration" aria-hidden="true">{@html tab.decoration}</span>
        {/if}
        {#if tab.icon}
          <span class="tab-icon">{@html tab.icon}</span>
        {/if}
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </nav>

  <!-- Tab Content - Single slot for all content -->
  <div class="tab-panels">
    <slot {activeTab} />
  </div>
</div>

<style>
  .tabs-container {
    background: var(--card-background);
    border-radius: 8px;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    border: 1px solid var(--border-color);
  }

  .tab-nav {
    display: flex;
    background: var(--surface-color);
  }

  .tab-button {
    flex: 1;
    padding: 18px 24px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: none;
    transform: none;
    overflow: hidden; /* Contain the decoration SVG */
  }

  .tab-button:hover {
    background: var(--hover-background);
    color: var(--text-color);
    transform: none;
    box-shadow: none;
  }

  .tab-button.active {
    background: var(--card-background);
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
  }

  .tab-button:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }

  .tab-icon {
    font-size: 1.3em;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* SVG icon styling */
  .tab-icon :global(svg) {
    display: block;
    stroke: currentColor;
  }

  /* Decorative background art - only visible on hover */
  .tab-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    opacity: 0;
    color: var(--text-color-secondary);
    transition: opacity var(--transition-fast), color var(--transition-fast);
  }

  .tab-decoration :global(svg) {
    width: 100%;
    height: 100%;
  }

  .tab-button:hover .tab-decoration {
    opacity: 0.8;
    color: var(--text-color);
  }

  .tab-button.active:hover .tab-decoration {
    color: var(--primary-color);
  }

  /* Ensure icon and label are above decoration */
  .tab-icon,
  .tab-label {
    position: relative;
    z-index: 1;
  }

  .tab-label {
    font-size: 0.95em;
  }

  .tab-panels {
    position: relative;
  }

  @media (max-width: 768px) {
    .tab-nav {
      flex-direction: column;
    }

    .tab-button {
      padding: 14px 18px;
      justify-content: flex-start;
    }

    .tab-label {
      font-size: 0.9em;
    }
  }

  @media (max-width: 600px) {
    .tab-icon {
      font-size: 1.1em;
    }

    .tab-label {
      font-size: 0.85em;
    }
  }
</style>
