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
        {#if tab.icon}
          <span class="tab-icon">{tab.icon}</span>
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
    border-bottom: 2px solid var(--border-color);
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
