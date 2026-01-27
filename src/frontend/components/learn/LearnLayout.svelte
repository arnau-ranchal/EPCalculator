<script>
  /**
   * LearnLayout.svelte
   *
   * This is the main layout component for the documentation hub.
   * It provides:
   *   - A header bar with title and "back to calculator" link
   *   - A sidebar for navigation (LearnSidebar component)
   *   - A main content area where articles/pages appear
   *
   * LAYOUT CONCEPT:
   * We use CSS Flexbox to arrange elements. Think of it like this:
   *   - The outer container is a vertical stack (column)
   *   - Inside, we have header on top, then sidebar+content side by side (row)
   */

  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import LearnSidebar from './LearnSidebar.svelte';
  import { learnRoute, exitLearn } from '../../stores/learn.js';

  // Sidebar state
  let sidebarOpen = true;
  let innerWidth = 1200;
  let userToggled = false;  // Track if user manually toggled

  // Breakpoint where sidebar should auto-collapse (sidebar 280px + content ~700px min)
  const COLLAPSE_BREAKPOINT = 1024;

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    userToggled = true;  // User has manually controlled the sidebar
  }

  // Auto-collapse/expand based on window width (unless user manually toggled)
  $: if (!userToggled) {
    sidebarOpen = innerWidth > COLLAPSE_BREAKPOINT;
  }

  // Reset userToggled when crossing the breakpoint significantly
  $: if (innerWidth > COLLAPSE_BREAKPOINT + 200 || innerWidth < COLLAPSE_BREAKPOINT - 200) {
    userToggled = false;
  }
</script>

<svelte:window bind:innerWidth />

<!--
  THE LAYOUT STRUCTURE:

  .learn-layout (full page container)
    ├── .learn-header (top bar)
    │     ├── title
    │     └── back button
    └── .learn-body (sidebar + content)
          ├── LearnSidebar (left navigation)
          └── .learn-content (main area with <slot/>)
-->

<div class="learn-layout">
  <!-- HEADER BAR -->
  <header class="learn-header">
    <div class="header-left">
      <!-- Mobile menu button (hamburger) -->
      <button class="menu-toggle" on:click={toggleSidebar} aria-label="Toggle menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <h1 class="learn-title">
        <svg class="learn-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        Documentation
      </h1>
    </div>

    <div class="header-right">
      <!-- Back to Calculator button -->
      <button class="back-button" on:click={exitLearn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Calculator
      </button>
    </div>
  </header>

  <!-- BODY: Sidebar + Content -->
  <div class="learn-body">
    <!-- Sidebar (navigation) -->
    <aside class="learn-sidebar" class:collapsed={!sidebarOpen}>
      <LearnSidebar />
    </aside>

    <!-- Toggle button - outside sidebar, appears on hover near edge -->
    <button
      class="sidebar-toggle"
      class:collapsed={!sidebarOpen}
      on:click={toggleSidebar}
      aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        {#if sidebarOpen}
          <polyline points="15 18 9 12 15 6"/>
        {:else}
          <polyline points="9 18 15 12 9 6"/>
        {/if}
      </svg>
    </button>

    <!-- Main content area wrapper - centers content horizontally -->
    <div class="learn-content-wrapper">
      <main class="learn-content">
        <!--
          <slot /> is where child content appears.
          When we use <LearnLayout><SomeComponent/></LearnLayout>,
          SomeComponent goes here.
        -->
        <slot />
      </main>
    </div>
  </div>
</div>

<style>
  /*
   * CSS LAYOUT EXPLANATION:
   *
   * We use Flexbox - a CSS system for arranging items in rows or columns.
   *
   * Key properties:
   *   display: flex      → "I want to use flexbox for my children"
   *   flex-direction     → row (side by side) or column (stacked)
   *   flex: 1            → "take up all remaining space"
   *   gap                → space between items
   */

  /* Full page container - vertical stack */
  .learn-layout {
    display: flex;
    flex-direction: column;  /* Stack children vertically: header, then body */
    min-height: 100vh;       /* vh = viewport height (full screen) */
    background: var(--background-color, #fafafa);
  }

  /* Header bar at top */
  .learn-header {
    display: flex;
    justify-content: space-between;  /* Push left and right apart */
    align-items: center;             /* Vertically center items */
    padding: var(--spacing-md, 16px) var(--spacing-lg, 24px);
    background: linear-gradient(135deg, var(--primary-color, #C8102E) 0%, var(--primary-color-dark, #a00d25) 100%);
    color: white;
    box-shadow: var(--shadow-md, 0 2px 8px rgba(0,0,0,0.1));
    position: sticky;        /* Stays at top when scrolling */
    top: 0;
    z-index: 100;            /* Above other content */
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md, 16px);
  }

  .menu-toggle {
    display: none;  /* Hidden on desktop, shown on mobile */
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
  }

  .menu-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .learn-title {
    font-size: var(--font-size-xl, 1.5rem);
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
  }

  .learn-icon {
    flex-shrink: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-md, 16px);
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateX(-2px);
  }

  /* Body: sidebar + content side by side */
  .learn-body {
    display: flex;
    flex: 1;  /* Take all remaining vertical space */
  }

  /* Sidebar */
  .learn-sidebar {
    position: sticky;
    top: 60px;            /* Below header */
    height: calc(100vh - 60px);  /* Full height minus header */
    width: 280px;
    background: var(--card-background, white);
    border-right: 1px solid var(--border-color, #e5e5e5);
    overflow-y: auto;     /* Scroll if content is tall */
    overflow-x: hidden;
    transition: width 0.2s ease;
    flex-shrink: 0;
  }

  /* Collapsed sidebar state */
  .learn-sidebar.collapsed {
    width: 0;
    border-right: none;
    overflow: hidden;
  }

  /* Sidebar toggle button - fixed position, no background */
  .sidebar-toggle {
    position: fixed;
    left: 284px;          /* Just outside sidebar (280px + small gap) */
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color-secondary, #999);
    opacity: 0;
    transition: opacity 0.15s ease, color 0.15s ease, left 0.2s ease;
    z-index: 10;
    padding: 0;
  }

  /* Show toggle on hover near sidebar edge */
  .learn-sidebar:hover ~ .sidebar-toggle,
  .sidebar-toggle:hover {
    opacity: 1;
  }

  .sidebar-toggle:hover {
    color: var(--primary-color, #C8102E);
  }

  /* When sidebar is collapsed */
  .sidebar-toggle.collapsed {
    left: 4px;
    opacity: 0.5;
  }

  .sidebar-toggle.collapsed:hover {
    opacity: 1;
  }

  /* Content wrapper - takes remaining space and centers content */
  .learn-content-wrapper {
    flex: 1;              /* Take all remaining horizontal space */
    overflow-y: auto;
    display: flex;
    justify-content: center;  /* Center the content horizontally */
  }

  /* Main content area */
  .learn-content {
    width: 100%;
    max-width: 900px;     /* Readable line length */
    padding: var(--spacing-xl, 32px);
  }

  /*
   * RESPONSIVE DESIGN
   *
   * @media queries let us change styles based on screen size.
   *
   * Medium screens (768px - 1024px):
   *   - Sidebar can be toggled but starts collapsed
   *   - Toggle button always visible when collapsed
   *
   * Mobile (< 768px):
   *   - Hide the sidebar by default
   *   - Show the hamburger menu button
   *   - Make sidebar overlay the content when open
   */

  /* Medium screens - sidebar toggle always visible when collapsed */
  @media (max-width: 1024px) {
    .sidebar-toggle.collapsed {
      opacity: 0.7;
    }

    .learn-content {
      padding: var(--spacing-lg, 24px);
    }
  }

  @media (max-width: 768px) {
    .menu-toggle {
      display: block;  /* Show hamburger on mobile */
    }

    .sidebar-toggle {
      display: none;  /* Hide toggle button on mobile, use hamburger instead */
    }

    .learn-sidebar {
      position: fixed;
      left: -280px;      /* Hidden off-screen */
      top: 60px;
      width: 280px;
      height: calc(100vh - 60px);
      z-index: 50;
      transition: left 0.3s ease;
      box-shadow: var(--shadow-lg, 0 4px 16px rgba(0,0,0,0.15));
    }

    .learn-sidebar:not(.collapsed) {
      left: 0;  /* Slide in when open */
    }

    .learn-sidebar.collapsed {
      width: 280px;  /* On mobile, don't shrink - just slide off */
    }

    .learn-content-wrapper {
      justify-content: flex-start;  /* On mobile, don't center - use full width */
    }

    .learn-content {
      padding: var(--spacing-lg, 24px) var(--spacing-md, 16px);
    }

    .learn-title {
      font-size: var(--font-size-lg, 1.25rem);
    }

    .back-button span {
      display: none;  /* Hide text, keep icon */
    }
  }
</style>
