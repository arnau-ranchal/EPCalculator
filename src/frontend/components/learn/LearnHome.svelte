<script>
  /**
   * LearnHome.svelte
   *
   * The landing page for the documentation hub.
   * Shows cards for each section that users can click to explore.
   *
   * This is what users see when they visit /#/learn (without a specific article).
   */

  import { navigateToLearn, contentIndex, expandSection } from '../../stores/learn.js';

  // Map section IDs to their first article
  const firstArticles = {
    concepts: 'awgn-channel',
    tutorials: 'getting-started',
    api: 'overview'
  };

  // Navigate to the first article of a section and expand it in the sidebar
  function goToFirstArticle(sectionId) {
    // Expand the selected section in the sidebar
    expandSection(sectionId);

    const firstArticle = firstArticles[sectionId];
    if (firstArticle) {
      navigateToLearn(`${sectionId}/${firstArticle}`);
    } else {
      navigateToLearn(sectionId);
    }
  }
</script>

<div class="learn-home">
  <!-- Welcome header -->
  <header class="home-header">
    <h1>Welcome to EPCalculator Documentation</h1>
    <p class="subtitle">
      Learn the mathematical concepts behind error probability calculations,
      follow step-by-step tutorials, or dive into the API reference.
    </p>
  </header>

  <!-- Section cards -->
  <div class="section-cards">
    {#each Object.entries(contentIndex) as [sectionId, section]}
      <button
        class="section-card"
        on:click={() => goToFirstArticle(sectionId)}
      >
        <span class="card-icon">
          {#if sectionId === 'concepts'}
            <!-- Mathematical Concepts - Ruler/Triangle icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21L21 3" />
              <path d="M3 21V11h10v10H3z" />
              <path d="M7 21v-4" />
              <path d="M11 21v-2" />
              <path d="M3 17h4" />
              <path d="M3 13h2" />
              <path d="M13 3l8 8" />
              <path d="M17 3h4v4" />
            </svg>
          {:else if sectionId === 'tutorials'}
            <!-- Tutorials - Book/Guide icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M8 7h8" />
              <path d="M8 11h6" />
            </svg>
          {:else if sectionId === 'api'}
            <!-- API Reference - Code/Terminal icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
              <line x1="12" y1="2" x2="12" y2="22" />
            </svg>
          {/if}
        </span>
        <h2 class="card-title">{section.title}</h2>
        <p class="card-description">
          {#if sectionId === 'concepts'}
            Understand the mathematical foundations: AWGN channels, modulation schemes, error exponents, and more.
          {:else if sectionId === 'tutorials'}
            Step-by-step guides to help you use EPCalculator effectively.
          {:else if sectionId === 'api'}
            Technical reference for integrating with the EPCalculator API.
          {/if}
        </p>
        <span class="card-count">{section.articles.length} articles</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .learn-home {
    width: 100%;
    max-width: 800px;
    margin: auto;         /* Centers both vertically and horizontally in flex parent */
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--spacing-xl, 32px) 0;
  }

  /* Welcome header */
  .home-header {
    text-align: center;
    margin-bottom: var(--spacing-xxl, 48px);
  }

  .home-header h1 {
    font-size: var(--font-size-xxl, 2rem);
    color: var(--text-color, #333);
    margin: 0 0 var(--spacing-md, 16px) 0;
  }

  .subtitle {
    font-size: var(--font-size-lg, 1.125rem);
    color: var(--text-color-secondary, #666);
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* Section cards grid */
  .section-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--spacing-lg, 24px);
    margin-bottom: var(--spacing-xxl, 48px);
  }

  .section-card {
    background: var(--card-background, white);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 12px;
    padding: var(--spacing-xl, 32px) var(--spacing-lg, 24px);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;

    /* Reset button styles */
    font-family: inherit;
    font-size: inherit;
    width: 100%;
  }

  .section-card:hover {
    border-color: var(--primary-color, #C8102E);
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1));
    transform: translateY(-2px);
  }

  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-md, 16px);
  }

  .card-icon svg {
    width: 48px;
    height: 48px;
    stroke: var(--primary-color, #C8102E);
    transition: stroke 0.2s ease;
  }

  .section-card:hover .card-icon svg {
    stroke: var(--primary-color-dark, #a00d25);
  }

  .card-title {
    font-size: var(--font-size-lg, 1.125rem);
    color: var(--text-color, #333);
    margin: 0 0 var(--spacing-sm, 8px) 0;
  }

  .card-description {
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color-secondary, #666);
    line-height: 1.5;
    margin: 0 0 var(--spacing-md, 16px) 0;
  }

  .card-count {
    font-size: var(--font-size-xs, 0.75rem);
    color: var(--text-color-secondary, #666);
    background: var(--surface-color, #f5f5f5);
    padding: 4px 12px;
    border-radius: 12px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .home-header h1 {
      font-size: var(--font-size-xl, 1.5rem);
    }

    .subtitle {
      font-size: var(--font-size-base, 1rem);
    }

    .section-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
