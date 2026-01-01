<script>
  import './styles/global.css';
  import { _, isLoading, locale } from 'svelte-i18n';
  import { onMount, onDestroy } from 'svelte';
  import MainLayout from './components/layout/MainLayout.svelte';
  import TabContainer from './components/layout/TabContainer.svelte';
  import SimulationPanel from './components/simulation/SimulationPanel.svelte';
  import PlottingPanel from './components/plotting/PlottingPanel.svelte';
  import WelcomeModal from './components/tutorial/WelcomeModal.svelte';
  import SpotlightTutorial from './components/tutorial/SpotlightTutorial.svelte';
  import DocumentationPanel from './components/documentation/DocumentationPanel.svelte';
  import { simulationParams } from './stores/simulation.js';
  import { plotParams } from './stores/plotting.js';
  import { isNewUser, tutorialState } from './stores/tutorial.js';

  // Tutorial state
  let showWelcome = false;

  onMount(() => {
    // Show welcome modal for new users after a short delay
    setTimeout(() => {
      showWelcome = $isNewUser;
    }, 500);
  });

  console.log('EPCalculator v2 Frontend initialized');

  // Tab configuration - reactive to language changes
  $: tabs = [
    { label: $_('tabs.singlePoint'), icon: '🎯' },
    { label: $_('tabs.plotting'), icon: '📈' }
  ];

  let activeTab = 0;
  let tabContainerRef;

  // Function to switch tabs (called from child components)
  function navigateToTab(tabIndex) {
    activeTab = tabIndex;
    if (tabContainerRef) {
      tabContainerRef.setActiveTab(tabIndex);
    }
  }

  // Sparkle cursor effect for Enchanting Table language
  let sparkleContainer;
  let mouseMoveHandler;
  let sparkleActive = false;

  $: isEnchanting = $locale === 'gal';

  $: if (typeof document !== 'undefined') {
    if (isEnchanting && !sparkleActive) {
      enableSparkles();
    } else if (!isEnchanting && sparkleActive) {
      disableSparkles();
    }
  }

  function createSparkle(x, y) {
    if (!sparkleContainer) return;

    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';

    // Random offset from cursor
    const offsetX = (Math.random() - 0.5) * 30;
    const offsetY = (Math.random() - 0.5) * 30;

    // Random sparkle character
    const chars = ['✦', '✧', '⋆', '✶', '✴', '✷', '❋', '✺'];
    sparkle.textContent = chars[Math.floor(Math.random() * chars.length)];

    // Random size and color
    const size = 10 + Math.random() * 14;
    const hue = 260 + Math.random() * 60; // Purple to pink range
    sparkle.style.cssText = `
      left: ${x + offsetX}px;
      top: ${y + offsetY}px;
      font-size: ${size}px;
      color: hsl(${hue}, 100%, 70%);
      text-shadow: 0 0 ${size/2}px hsl(${hue}, 100%, 80%);
    `;

    sparkleContainer.appendChild(sparkle);

    // Remove after animation
    setTimeout(() => sparkle.remove(), 1000);
  }

  function enableSparkles() {
    sparkleActive = true;

    // Create container if needed
    if (!sparkleContainer) {
      sparkleContainer = document.createElement('div');
      sparkleContainer.className = 'sparkle-container';
      document.body.appendChild(sparkleContainer);
    }

    let lastSparkle = 0;
    mouseMoveHandler = (e) => {
      const now = Date.now();
      if (now - lastSparkle > 50) { // Throttle
        createSparkle(e.clientX, e.clientY);
        lastSparkle = now;
      }
    };

    document.addEventListener('mousemove', mouseMoveHandler);
  }

  function disableSparkles() {
    sparkleActive = false;
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler);
      mouseMoveHandler = null;
    }
    if (sparkleContainer) {
      sparkleContainer.remove();
      sparkleContainer = null;
    }
  }

  onDestroy(() => {
    disableSparkles();
  });
</script>

{#if $isLoading}
  <div class="loading-container">
    <div class="loading-spinner"></div>
  </div>
{:else}
  <MainLayout title={$_('app.title')}>
    <div class="app-content">
      <TabContainer {tabs} bind:activeTab bind:this={tabContainerRef} let:activeTab={currentTab}>
        {#if currentTab === 0}
          <div class="tab-panel" role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0">
            <SimulationPanel />
          </div>
        {:else if currentTab === 1}
          <div class="tab-panel" role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1">
            <PlottingPanel onNavigateToParams={() => navigateToTab(0)} />
          </div>
        {/if}
      </TabContainer>
    </div>
  </MainLayout>

  <!-- Tutorial components -->
  {#if showWelcome}
    <WelcomeModal on:close={() => showWelcome = false} />
  {/if}

  <SpotlightTutorial />

  <!-- Documentation panel (hover help) -->
  <DocumentationPanel />
{/if}

<style>
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(135deg, #fdf5f6 0%, #fff 100%);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #eee;
    border-top-color: var(--primary-color, #C8102E);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .app-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .tab-panel {
    padding: var(--spacing-xl);
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .tab-panel {
      padding: var(--spacing-lg);
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .tab-panel {
      animation: none;
    }
  }
</style>
