<script>
  import { _ } from 'svelte-i18n';
  import { defaultShowFrame, plotShowFrame, activePlots } from '../../stores/plotting.js';
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  // Local state that syncs with store
  let hideFrame = false;

  // Sync with store on open
  $: if (isOpen) {
    hideFrame = !$defaultShowFrame;
  }

  function handleToggle() {
    hideFrame = !hideFrame;
    const showFrame = !hideFrame;

    // Update default preference
    defaultShowFrame.set(showFrame);

    // Auto-apply to all existing plots
    plotShowFrame.update(map => {
      const newMap = new Map(map);
      $activePlots.forEach(plot => {
        newMap.set(plot.plotId, showFrame);
      });
      return newMap;
    });
  }

  function close() {
    isOpen = false;
    dispatch('close');
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content">
      <div class="modal-header">
        <h2>{$_('preferences.title')}</h2>
        <button class="close-button" on:click={close}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <section class="preference-section">
          <h3>{$_('preferences.plotSettings')}</h3>

          <div class="preference-item">
            <label class="toggle-label">
              <span class="toggle-text">
                <span class="toggle-title">{$_('preferences.hideFrameByDefault')}</span>
                <span class="toggle-desc">{$_('preferences.hideFrameDesc')}</span>
              </span>
              <button
                class="toggle-switch"
                class:active={hideFrame}
                on:click={handleToggle}
                role="switch"
                aria-checked={hideFrame}
              >
                <span class="toggle-knob"></span>
              </button>
            </label>
          </div>
        </section>
      </div>

      <div class="modal-footer">
        <button class="button-primary" on:click={close}>
          {$_('preferences.close')}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--card-background);
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 450px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h2 {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--text-color);
  }

  .close-button {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--text-color-secondary);
    border-radius: 4px;
    transition: all var(--transition-fast);
  }

  .close-button:hover {
    background: var(--surface-color);
    color: var(--text-color);
  }

  .modal-body {
    padding: var(--spacing-lg);
    overflow-y: auto;
  }

  .preference-section h3 {
    margin: 0 0 var(--spacing-md) 0;
    font-size: var(--font-size-lg);
    color: var(--text-color);
    font-weight: 600;
  }

  .preference-item {
    margin-bottom: var(--spacing-md);
  }

  .toggle-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    cursor: pointer;
  }

  .toggle-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .toggle-title {
    font-weight: 500;
    color: var(--text-color);
  }

  .toggle-desc {
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
  }

  .toggle-switch {
    position: relative;
    width: 48px;
    height: 26px;
    background: var(--border-color);
    border: none;
    border-radius: 13px;
    cursor: pointer;
    transition: background var(--transition-fast);
    flex-shrink: 0;
  }

  .toggle-switch.active {
    background: var(--primary-color);
  }

  .toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform var(--transition-fast);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch.active .toggle-knob {
    transform: translateX(22px);
  }

  .modal-footer {
    padding: var(--spacing-md) var(--spacing-lg);
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
  }
</style>
