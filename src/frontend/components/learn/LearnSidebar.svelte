<script>
  /**
   * LearnSidebar.svelte
   *
   * The navigation sidebar for the documentation hub.
   * Shows a tree structure of sections and articles that users can click.
   *
   * STRUCTURE:
   *   Concepts          ← Section (clickable to expand/collapse)
   *     ├── AWGN        ← Article link
   *     ├── Modulation  ← Article link
   *     └── ...
   *   Tutorials
   *     ├── Getting Started
   *     └── ...
   *   API Reference
   *     └── ...
   */

  import { _ } from 'svelte-i18n';
  import {
    learnRoute,
    routeParts,
    sidebarExpanded,
    toggleSection,
    navigateToLearn,
    contentIndex
  } from '../../stores/learn.js';

  // Reactive values extracted from store for proper Svelte tracking
  $: currentSection = $routeParts.section;
  $: currentArticle = $routeParts.article;
  $: isHome = $routeParts.isHome;

  /**
   * Map section IDs to their SVG icon identifiers.
   * This allows us to render different icons for each section.
   */
  const sectionIcons = {
    concepts: 'compass',    // Mathematical concepts - compass/protractor
    tutorials: 'book-open', // Tutorials - open book
    api: 'zap'              // API - lightning bolt
  };
</script>

<nav class="sidebar-nav" aria-label="Documentation navigation">
  <!-- Home link -->
  <a
    href="#/learn"
    class="nav-home"
    class:active={isHome}
    on:click|preventDefault={() => navigateToLearn('')}
  >
    <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
    Home
  </a>

  <!-- Section list -->
  <ul class="nav-sections">
    <!--
      {#each} loops over items in Svelte.
      Object.entries() converts { concepts: {...}, tutorials: {...} }
      into [ ['concepts', {...}], ['tutorials', {...}] ]
    -->
    {#each Object.entries(contentIndex) as [sectionId, section]}
      <li class="nav-section">
        <!--
          Section header (clickable to expand/collapse)
          The button toggles whether we show the articles list below
        -->
        <button
          class="section-header"
          class:active={currentSection === sectionId}
          class:expanded={$sidebarExpanded[sectionId]}
          on:click={() => toggleSection(sectionId)}
          aria-expanded={$sidebarExpanded[sectionId]}
        >
          <span class="section-icon">
            {#if sectionIcons[sectionId] === 'compass'}
              <!-- Compass/protractor icon for Mathematical Concepts -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
            {:else if sectionIcons[sectionId] === 'book-open'}
              <!-- Open book icon for Tutorials -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            {:else if sectionIcons[sectionId] === 'zap'}
              <!-- Lightning bolt icon for API -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            {/if}
          </span>
          <span class="section-title">{section.title}</span>
          <!--
            Chevron icon that rotates when expanded.
            CSS transform: rotate() handles the animation.
          -->
          <svg
            class="chevron"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <!--
          Articles list - only shown when section is expanded.
          {#if} conditionally renders content.
        -->
        {#if $sidebarExpanded[sectionId]}
          <ul class="nav-articles">
            {#each section.articles as article}
              <li>
                <a
                  href="#/learn/{sectionId}/{article.id}"
                  class="article-link"
                  class:active={currentSection === sectionId && currentArticle === article.id}
                  on:click|preventDefault={() => navigateToLearn(`${sectionId}/${article.id}`)}
                >
                  {article.title}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
</nav>

<style>
  /*
   * SIDEBAR NAVIGATION STYLES
   *
   * Key CSS concepts used here:
   *   - list-style: none    → Remove bullet points from lists
   *   - transition          → Animate property changes smoothly
   *   - :hover              → Style when mouse is over element
   *   - transform           → Move, rotate, or scale elements
   */

  .sidebar-nav {
    padding: var(--spacing-md, 16px);
  }

  /* Home link at top */
  .nav-home {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
    padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
    margin-bottom: var(--spacing-md, 16px);
    border-radius: 8px;
    text-decoration: none;
    color: var(--text-color, #333);
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .nav-home:hover {
    background: var(--hover-background, #f5f5f5);
  }

  .nav-home.active {
    background: color-mix(in srgb, var(--primary-color, #C8102E) 10%, transparent);
    color: var(--primary-color, #C8102E);
  }

  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Remove default list styles */
  .nav-sections,
  .nav-articles {
    list-style: none;  /* No bullet points */
    margin: 0;
    padding: 0;
  }

  .nav-section {
    margin-bottom: var(--spacing-xs, 4px);
  }

  /* Section header button */
  .section-header {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    font-size: var(--font-size-base, 1rem);
    font-weight: 600;
    color: var(--text-color, #333);
    transition: all 0.2s ease;
  }

  .section-header:hover {
    background: var(--hover-background, #f5f5f5);
  }

  .section-header.active {
    color: var(--primary-color, #C8102E);
  }

  .section-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--spacing-sm, 8px);
    flex-shrink: 0;
  }

  .section-title {
    flex: 1;  /* Take remaining space, pushing chevron to right */
  }

  /* Chevron rotation animation */
  .chevron {
    transition: transform 0.2s ease;
    opacity: 0.5;
  }

  .section-header.expanded .chevron {
    transform: rotate(90deg);  /* Point down when expanded */
  }

  .section-header:hover .chevron {
    opacity: 1;
  }

  /* Articles list (nested under sections) */
  .nav-articles {
    padding-left: var(--spacing-lg, 24px);
    margin-top: var(--spacing-xs, 4px);
    border-left: 2px solid var(--border-color, #e5e5e5);
    margin-left: var(--spacing-lg, 24px);
  }

  .article-link {
    display: block;
    padding: var(--spacing-xs, 4px) var(--spacing-md, 16px);
    margin: 2px 0;
    border-radius: 6px;
    text-decoration: none;
    color: var(--text-color-secondary, #666);
    font-size: var(--font-size-sm, 0.875rem);
    transition: all 0.15s ease;
  }

  .article-link:hover {
    background: var(--hover-background, #f5f5f5);
    color: var(--text-color, #333);
  }

  .article-link.active {
    background: color-mix(in srgb, var(--primary-color, #C8102E) 12%, transparent);
    color: var(--primary-color, #C8102E);
    font-weight: 600;
  }

  /*
   * ANIMATION FOR ARTICLES LIST
   * When a section expands, the articles slide in smoothly.
   */
  .nav-articles {
    animation: slideIn 0.2s ease;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
