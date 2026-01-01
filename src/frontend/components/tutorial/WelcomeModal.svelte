<script>
  import { _ } from 'svelte-i18n';
  import { createEventDispatcher, onMount } from 'svelte';
  import { tutorialState } from '../../stores/tutorial.js';

  const dispatch = createEventDispatcher();

  let visible = false;

  onMount(() => {
    // Small delay for smooth entrance
    setTimeout(() => {
      visible = true;
    }, 100);
  });

  function handleClose() {
    visible = false;
    tutorialState.markWelcomeSeen();
    setTimeout(() => {
      dispatch('close');
    }, 300);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="welcome-backdrop" class:visible on:click={handleClose}>
  <div class="welcome-modal" class:visible on:click|stopPropagation>
    <div class="welcome-header">
      <div class="welcome-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>
      <h2>{$_('tutorial.welcomeTitle')}</h2>
      <p class="welcome-subtitle">{$_('tutorial.welcomeSubtitle')}</p>
    </div>

    <div class="welcome-content">
      <div class="tab-card">
        <div class="tab-icon">🎯</div>
        <div class="tab-info">
          <h3>{$_('tabs.singlePoint')}</h3>
          <p>{$_('tutorial.singlePointDesc')}</p>
        </div>
      </div>

      <div class="tab-card">
        <div class="tab-icon">📈</div>
        <div class="tab-info">
          <h3>{$_('tabs.plotting')}</h3>
          <p>{$_('tutorial.plottingDesc')}</p>
        </div>
      </div>
    </div>

    <div class="welcome-footer">
      <button class="button-primary" on:click={handleClose}>
        {$_('tutorial.getStarted')}
      </button>
      <p class="welcome-hint">{$_('tutorial.pressEscHint')}</p>
    </div>
  </div>
</div>

<style>
  .welcome-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease;
    backdrop-filter: blur(0px);
  }

  .welcome-backdrop.visible {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }

  .welcome-modal {
    background: var(--card-background);
    border-radius: 16px;
    padding: 0;
    max-width: 480px;
    width: 90%;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
    opacity: 0;
    transform: translateY(20px) scale(0.95);
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .welcome-modal.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .welcome-header {
    text-align: center;
    padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-md);
    background: linear-gradient(135deg,
      color-mix(in srgb, var(--primary-color) 8%, transparent),
      color-mix(in srgb, var(--primary-color) 3%, transparent)
    );
    border-bottom: 1px solid var(--border-color);
  }

  .welcome-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    background: var(--primary-color);
    color: white;
    border-radius: 16px;
    margin-bottom: var(--spacing-md);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--primary-color) 30%, transparent);
  }

  .welcome-header h2 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
  }

  .welcome-subtitle {
    margin: 0;
    color: var(--text-color-secondary);
    font-size: var(--font-size-base);
  }

  .welcome-content {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .tab-card {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--surface-color);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    transition: all 0.2s ease;
  }

  .tab-card:hover {
    border-color: var(--primary-color);
    transform: translateX(4px);
  }

  .tab-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--card-background);
    border-radius: 10px;
    border: 1px solid var(--border-color);
  }

  .tab-info h3 {
    margin: 0 0 4px 0;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-color);
  }

  .tab-info p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    line-height: 1.5;
  }

  .welcome-footer {
    padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
    text-align: center;
    border-top: 1px solid var(--border-color);
    background: var(--surface-color);
  }

  .welcome-footer button {
    min-width: 160px;
    padding: 12px 32px;
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  .welcome-hint {
    margin: var(--spacing-sm) 0 0 0;
    font-size: var(--font-size-xs);
    color: var(--text-color-secondary);
    opacity: 0.7;
  }

  @media (max-width: 480px) {
    .welcome-modal {
      width: 95%;
      margin: var(--spacing-md);
    }

    .welcome-header {
      padding: var(--spacing-lg) var(--spacing-md) var(--spacing-sm);
    }

    .welcome-content {
      padding: var(--spacing-md);
    }

    .tab-card {
      padding: var(--spacing-sm);
    }

    .tab-icon {
      width: 40px;
      height: 40px;
      font-size: 1.5rem;
    }
  }
</style>
