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

  // =========================================================================
  // LEARN MODE (Documentation Hub) - Hash-based routing
  // =========================================================================
  import { learnRoute, initializeFromHash } from './stores/learn.js';
  // We'll import LearnLayout once we create it:
  // import LearnLayout from './components/learn/LearnLayout.svelte';

  // This variable controls whether we show the documentation hub or calculator
  let isInLearnMode = false;

  /**
   * Handle URL hash changes to switch between calculator and learn mode.
   *
   * This function is called:
   * 1. When the page first loads (to check initial URL)
   * 2. When the user clicks a link that changes the hash
   * 3. When user uses browser back/forward buttons
   *
   * TODO(human): Implement this function!
   * It should:
   * - Get the current hash from window.location.hash
   * - Check if it starts with '#/learn'
   * - Set isInLearnMode to true or false accordingly
   * - If in learn mode, call initializeFromHash() to sync the store
   */
  function handleHashChange() {
    const hash = window.location.hash;
    {#if hash.startsWith('#/learn')}
      isInLearnMode = true;
      initializeFromHash();
    {:else}
      isInLearnMode = false;
    {\if}
  }

  // Tutorial state
  let showWelcome = false;

  onMount(() => {
    // Check initial URL hash when page loads
    handleHashChange();

    // Listen for hash changes (when user navigates)
    window.addEventListener('hashchange', handleHashChange);

    // Show welcome modal for new users after a short delay
    setTimeout(() => {
      showWelcome = $isNewUser;
    }, 500);
  });

  // Clean up event listener when component is destroyed
  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('hashchange', handleHashChange);
    }
  });

  console.log('EPCalculator v2 Frontend initialized');

  // Custom SVG icons for tabs (instead of emojis)
  const crosshairIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="8"/>
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
  </svg>`;

  const chartIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 20 3 4"/>
    <polyline points="3 20 21 20"/>
    <path d="M6 16 L10 10 L14 14 L20 6"/>
  </svg>`;

  // ============================================
  // STYLE 1: Flowing Wave/Swoosh (uncomment to try)
  // ============================================
  // const singlePointDecor = `<svg viewBox="0 0 200 100" preserveAspectRatio="xMinYMid slice">
  //   <defs>
  //     <linearGradient id="fadeRight1" x1="0%" y1="0%" x2="100%" y2="0%">
  //       <stop offset="0%" stop-color="currentColor" stop-opacity="0.3"/>
  //       <stop offset="70%" stop-color="currentColor" stop-opacity="0.1"/>
  //       <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
  //     </linearGradient>
  //   </defs>
  //   <path d="M-20 120 Q40 80 100 90 T200 70" fill="none" stroke="url(#fadeRight1)" stroke-width="2"/>
  //   <path d="M-20 100 Q50 60 110 70 T200 50" fill="none" stroke="url(#fadeRight1)" stroke-width="1.5"/>
  //   <path d="M-20 80 Q60 40 120 50 T200 30" fill="none" stroke="url(#fadeRight1)" stroke-width="1"/>
  //   <circle cx="20" cy="70" r="4" fill="currentColor" opacity="0.2"/>
  // </svg>`;
  //
  // const plottingDecor = `<svg viewBox="0 0 200 100" preserveAspectRatio="xMinYMid slice">
  //   <defs>
  //     <linearGradient id="fadeRight2" x1="0%" y1="0%" x2="100%" y2="0%">
  //       <stop offset="0%" stop-color="currentColor" stop-opacity="0.3"/>
  //       <stop offset="70%" stop-color="currentColor" stop-opacity="0.1"/>
  //       <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
  //     </linearGradient>
  //   </defs>
  //   <path d="M0 85 Q30 80 60 60 T120 30 T180 15" fill="none" stroke="url(#fadeRight2)" stroke-width="2.5"/>
  //   <path d="M0 95 Q40 85 80 65 T140 40 T200 25" fill="none" stroke="url(#fadeRight2)" stroke-width="1.5"/>
  //   <path d="M0 75 Q25 70 50 55 T100 35 T160 20" fill="none" stroke="url(#fadeRight2)" stroke-width="1" opacity="0.7"/>
  // </svg>`;

  // ============================================
  // STYLE 2: Geometric/Angular (ACTIVE)
  // ============================================
  const singlePointDecor = `<svg viewBox="0 0 200 100" preserveAspectRatio="xMinYMid slice">
    <defs>
      <linearGradient id="fadeRight1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="0,100 80,100 40,50 0,50" fill="url(#fadeRight1)"/>
    <polygon points="0,50 60,50 30,20 0,20" fill="url(#fadeRight1)" opacity="0.6"/>
    <circle cx="50" cy="60" r="6" fill="currentColor" opacity="0.2"/>
  </svg>`;

  const plottingDecor = `<svg viewBox="0 0 200 100" preserveAspectRatio="xMinYMid slice">
    <defs>
      <linearGradient id="fadeRight2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="0,100 100,100 60,40 0,60" fill="url(#fadeRight2)"/>
    <polygon points="20,60 90,40 50,10 0,30" fill="url(#fadeRight2)" opacity="0.5"/>
  </svg>`;

  // ============================================
  // STYLE 3: Constellation/Dots (uncomment to try)
  // ============================================
  // const singlePointDecor = `<svg viewBox="0 0 200 100" preserveAspectRatio="xMinYMid slice">
  //   <defs>
  //     <linearGradient id="fadeRight1" x1="0%" y1="0%" x2="100%" y2="0%">
  //       <stop offset="0%" stop-color="currentColor" stop-opacity="0.3"/>
  //       <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
  //     </linearGradient>
  //   </defs>
  //   <!-- Connected dots -->
  //   <circle cx="20" cy="70" r="5" fill="currentColor" opacity="0.25"/>
  //   <circle cx="50" cy="45" r="3" fill="currentColor" opacity="0.2"/>
  //   <circle cx="85" cy="55" r="4" fill="currentColor" opacity="0.15"/>
  //   <circle cx="120" cy="35" r="3" fill="currentColor" opacity="0.1"/>
  //   <line x1="20" y1="70" x2="50" y2="45" stroke="url(#fadeRight1)" stroke-width="1"/>
  //   <line x1="50" y1="45" x2="85" y2="55" stroke="url(#fadeRight1)" stroke-width="1"/>
  //   <line x1="85" y1="55" x2="120" y2="35" stroke="url(#fadeRight1)" stroke-width="1"/>
  // </svg>`;
  //
  // const plottingDecor = `<svg viewBox="0 0 200 100" preserveAspectRatio="xMinYMid slice">
  //   <defs>
  //     <linearGradient id="fadeRight2" x1="0%" y1="0%" x2="100%" y2="0%">
  //       <stop offset="0%" stop-color="currentColor" stop-opacity="0.3"/>
  //       <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
  //     </linearGradient>
  //   </defs>
  //   <!-- Multiple dot clusters with connections -->
  //   <circle cx="15" cy="80" r="4" fill="currentColor" opacity="0.25"/>
  //   <circle cx="40" cy="60" r="5" fill="currentColor" opacity="0.22"/>
  //   <circle cx="70" cy="40" r="4" fill="currentColor" opacity="0.18"/>
  //   <circle cx="100" cy="50" r="3" fill="currentColor" opacity="0.14"/>
  //   <circle cx="130" cy="30" r="4" fill="currentColor" opacity="0.1"/>
  //   <path d="M15 80 L40 60 L70 40 L100 50 L130 30" fill="none" stroke="url(#fadeRight2)" stroke-width="1.5"/>
  //   <!-- Second line -->
  //   <circle cx="25" cy="90" r="3" fill="currentColor" opacity="0.2"/>
  //   <circle cx="55" cy="75" r="3" fill="currentColor" opacity="0.15"/>
  //   <circle cx="90" cy="60" r="3" fill="currentColor" opacity="0.1"/>
  //   <path d="M25 90 L55 75 L90 60 L140 45" fill="none" stroke="url(#fadeRight2)" stroke-width="1" opacity="0.7"/>
  // </svg>`;

  // Tab configuration - reactive to language changes
  $: tabs = [
    { label: $_('tabs.singlePoint'), icon: crosshairIcon, decoration: singlePointDecor },
    { label: $_('tabs.plotting'), icon: chartIcon, decoration: plottingDecor }
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
