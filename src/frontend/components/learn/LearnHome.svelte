<script>
  /**
   * LearnHome.svelte
   *
   * The landing page for the documentation hub.
   * Shows cards for each section that users can click to explore.
   *
   * This is what users see when they visit /#/learn (without a specific article).
   */

  import { navigateToLearn, contentIndex } from '../../stores/learn.js';
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
        on:click={() => navigateToLearn(sectionId)}
      >
        <span class="card-icon">{section.icon}</span>
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

  <!-- Quick links -->
  <section class="quick-start">
    <h2>Quick Start</h2>
    <div class="quick-links">
      <a
        href="#/learn/tutorials/getting-started"
        class="quick-link"
        on:click|preventDefault={() => navigateToLearn('tutorials/getting-started')}
      >
        <span class="quick-icon">🚀</span>
        <div>
          <strong>Getting Started</strong>
          <span>New to EPCalculator? Start here!</span>
        </div>
      </a>
      <a
        href="#/learn/concepts/error-exponent"
        class="quick-link"
        on:click|preventDefault={() => navigateToLearn('concepts/error-exponent')}
      >
        <span class="quick-icon">📐</span>
        <div>
          <strong>Error Exponents</strong>
          <span>Learn the core mathematical concept</span>
        </div>
      </a>
      <a
        href="#/learn/api/overview"
        class="quick-link"
        on:click|preventDefault={() => navigateToLearn('api/overview')}
      >
        <span class="quick-icon">⚡</span>
        <div>
          <strong>API Overview</strong>
          <span>Integrate EPCalculator into your projects</span>
        </div>
      </a>
    </div>
  </section>
</div>

<style>
  .learn-home {
    max-width: 800px;
    margin: 0 auto;
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
    font-size: 2.5rem;
    display: block;
    margin-bottom: var(--spacing-md, 16px);
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

  /* Quick start section */
  .quick-start {
    background: var(--card-background, white);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 12px;
    padding: var(--spacing-xl, 32px);
  }

  .quick-start h2 {
    font-size: var(--font-size-lg, 1.125rem);
    color: var(--text-color, #333);
    margin: 0 0 var(--spacing-lg, 24px) 0;
  }

  .quick-links {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md, 16px);
  }

  .quick-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-md, 16px);
    padding: var(--spacing-md, 16px);
    background: var(--surface-color, #f5f5f5);
    border-radius: 8px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
  }

  .quick-link:hover {
    background: color-mix(in srgb, var(--primary-color, #C8102E) 8%, var(--surface-color, #f5f5f5));
  }

  .quick-icon {
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--card-background, white);
    border-radius: 8px;
  }

  .quick-link div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .quick-link strong {
    color: var(--text-color, #333);
    font-size: var(--font-size-base, 1rem);
  }

  .quick-link span {
    color: var(--text-color-secondary, #666);
    font-size: var(--font-size-sm, 0.875rem);
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
