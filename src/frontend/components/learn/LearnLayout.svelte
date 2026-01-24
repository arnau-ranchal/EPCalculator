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

  import { _ } from 'svelte-i18n';
  import LearnSidebar from './LearnSidebar.svelte';
  import { learnRoute, exitLearn } from '../../stores/learn.js';

  // This will be used later for mobile responsive sidebar toggle
  let sidebarOpen = true;

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
</script>

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
        <span class="learn-icon">📚</span>
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
    <aside class="learn-sidebar" class:open={sidebarOpen}>
      <LearnSidebar />
    </aside>

    <!-- Main content area -->
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
    font-size: 1.2em;
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
    width: 280px;
    background: var(--card-background, white);
    border-right: 1px solid var(--border-color, #e5e5e5);
    overflow-y: auto;     /* Scroll if content is tall */
    position: sticky;
    top: 60px;            /* Below header */
    height: calc(100vh - 60px);  /* Full height minus header */
  }

  /* Main content area */
  .learn-content {
    flex: 1;              /* Take all remaining horizontal space */
    padding: var(--spacing-xl, 32px);
    overflow-y: auto;
    max-width: 900px;     /* Readable line length */
  }

  /*
   * RESPONSIVE DESIGN
   *
   * @media queries let us change styles based on screen size.
   * On mobile (< 768px), we:
   *   - Hide the sidebar by default
   *   - Show the hamburger menu button
   *   - Make sidebar overlay the content when open
   */
  @media (max-width: 768px) {
    .menu-toggle {
      display: block;  /* Show hamburger on mobile */
    }

    .learn-sidebar {
      position: fixed;
      left: -280px;      /* Hidden off-screen */
      top: 60px;
      height: calc(100vh - 60px);
      z-index: 50;
      transition: left 0.3s ease;
      box-shadow: var(--shadow-lg, 0 4px 16px rgba(0,0,0,0.15));
    }

    .learn-sidebar.open {
      left: 0;  /* Slide in when open */
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
