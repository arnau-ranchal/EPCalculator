<script>
  /**
   * LearnSearchResults.svelte
   *
   * Displays search results as the main body content.
   * Shows grouped results by article with context snippets.
   * Replaces normal article content when user is searching.
   */

  import { _ } from 'svelte-i18n';
  import {
    searchQuery,
    searchResults,
    clearSearch
  } from '../../stores/search.js';
  import { navigateToLearn } from '../../stores/learn.js';

  // Section display labels and icons
  const sectionMeta = {
    concepts: { label: 'Concepts', icon: 'compass', color: '#2563eb' },
    tutorials: { label: 'Tutorials', icon: 'book', color: '#059669' },
    api: { label: 'API', icon: 'zap', color: '#d97706' }
  };

  /**
   * Navigate to a result and clear search.
   */
  function goToResult(article, anchor) {
    navigateToLearn(`${article.section}/${article.id}`, anchor);
    clearSearch();
  }

  /**
   * Highlight matched terms in text.
   * Returns HTML with <mark> tags around matches.
   */
  function highlightMatch(text, query) {
    if (!query || query.length < 2) return text;

    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    let result = text;

    for (const word of words) {
      const regex = new RegExp(`(${word})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    }

    return result;
  }
</script>

<div class="search-results-page">
  <!-- Results header -->
  <div class="results-header">
    <h1 class="results-title">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      Search Results
    </h1>
    <p class="results-summary">
      {#if $searchResults.length > 0}
        Found <strong>{$searchResults.length}</strong> article{$searchResults.length === 1 ? '' : 's'} matching "<strong>{$searchQuery}</strong>"
      {:else}
        No results for "<strong>{$searchQuery}</strong>"
      {/if}
    </p>
  </div>

  {#if $searchResults.length > 0}
    <!-- Results list -->
    <div class="results-list">
      {#each $searchResults as articleResult}
        <article class="result-card">
          <!-- Article header -->
          <div class="result-card-header">
            <span
              class="section-badge"
              style="--badge-color: {sectionMeta[articleResult.article.section]?.color || '#666'}"
            >
              {sectionMeta[articleResult.article.section]?.label || articleResult.article.section}
            </span>
            <h2 class="result-article-title">
              <button on:click={() => goToResult(articleResult.article, null)}>
                {@html highlightMatch(articleResult.article.title, $searchQuery)}
              </button>
            </h2>
          </div>

          <!-- Matched sections -->
          <ul class="result-matches">
            {#each articleResult.matches as match}
              <li class="result-match-item">
                <button
                  class="match-button"
                  on:click={() => goToResult(articleResult.article, match.anchor)}
                >
                  <div class="match-header">
                    {#if match.type === 'title'}
                      <span class="match-type-badge title">Article Title</span>
                    {:else if match.type === 'subtitle'}
                      <span class="match-type-badge subtitle">Subtitle</span>
                    {:else if match.type === 'heading'}
                      <span class="match-type-badge heading">Section</span>
                    {:else}
                      <span class="match-type-badge content">Content</span>
                    {/if}
                    {#if match.headingContext && match.type === 'content'}
                      <span class="match-section-name">in {match.headingContext}</span>
                    {/if}
                  </div>
                  <p class="match-context">
                    {@html highlightMatch(match.context, $searchQuery)}
                  </p>
                  <span class="match-go-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        </article>
      {/each}
    </div>
  {:else}
    <!-- No results state -->
    <div class="no-results">
      <div class="no-results-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
          <path d="M8 8l6 6M14 8l-6 6"/>
        </svg>
      </div>
      <h2>No results found</h2>
      <p>Try different keywords or check your spelling</p>
      <div class="search-suggestions">
        <p>Popular topics:</p>
        <div class="suggestion-chips">
          <button on:click={() => { $searchQuery = 'error exponent'; }}>error exponent</button>
          <button on:click={() => { $searchQuery = 'modulation'; }}>modulation</button>
          <button on:click={() => { $searchQuery = 'API'; }}>API</button>
          <button on:click={() => { $searchQuery = 'tutorial'; }}>tutorial</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .search-results-page {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-lg, 24px);
  }

  /* Header */
  .results-header {
    margin-bottom: var(--spacing-xl, 32px);
    padding-bottom: var(--spacing-lg, 24px);
    border-bottom: 1px solid var(--border-color, #e5e5e5);
  }

  .results-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
    font-size: var(--font-size-2xl, 1.75rem);
    font-weight: 700;
    color: var(--text-color, #333);
    margin: 0 0 var(--spacing-sm, 8px) 0;
  }

  .results-title svg {
    color: var(--primary-color, #C8102E);
  }

  .results-summary {
    font-size: var(--font-size-base, 1rem);
    color: var(--text-color-secondary, #666);
    margin: 0;
  }

  .results-summary strong {
    color: var(--text-color, #333);
  }

  /* Results list */
  .results-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg, 24px);
  }

  /* Result card */
  .result-card {
    background: var(--card-background, white);
    border-radius: 12px;
    border: 1px solid var(--border-color, #e5e5e5);
    overflow: hidden;
    transition: box-shadow 0.2s ease;
  }

  .result-card:hover {
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08));
  }

  .result-card-header {
    padding: var(--spacing-md, 16px) var(--spacing-lg, 24px);
    background: var(--background-secondary, #f9fafb);
    border-bottom: 1px solid var(--border-color, #e5e5e5);
  }

  .section-badge {
    display: inline-block;
    font-size: var(--font-size-xs, 0.7rem);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 3px 8px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--badge-color, #666) 15%, transparent);
    color: var(--badge-color, #666);
    margin-bottom: var(--spacing-xs, 4px);
  }

  .result-article-title {
    margin: 0;
    font-size: var(--font-size-lg, 1.25rem);
    font-weight: 600;
  }

  .result-article-title button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--text-color, #333);
    text-align: left;
    font-size: inherit;
    font-weight: inherit;
    transition: color 0.15s ease;
  }

  .result-article-title button:hover {
    color: var(--primary-color, #C8102E);
  }

  /* Matches list */
  .result-matches {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .result-match-item {
    border-bottom: 1px solid var(--border-color-light, #f0f0f0);
  }

  .result-match-item:last-child {
    border-bottom: none;
  }

  .match-button {
    width: 100%;
    display: block;
    padding: var(--spacing-md, 16px) var(--spacing-lg, 24px);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;
    position: relative;
  }

  .match-button:hover {
    background: var(--hover-background, #f5f5f5);
  }

  .match-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
    margin-bottom: var(--spacing-xs, 4px);
  }

  .match-type-badge {
    font-size: var(--font-size-xs, 0.7rem);
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .match-type-badge.title {
    background: color-mix(in srgb, var(--primary-color, #C8102E) 12%, transparent);
    color: var(--primary-color, #C8102E);
  }

  .match-type-badge.subtitle {
    background: color-mix(in srgb, #8b5cf6 12%, transparent);
    color: #8b5cf6;
  }

  .match-type-badge.heading {
    background: color-mix(in srgb, #2563eb 12%, transparent);
    color: #2563eb;
  }

  .match-type-badge.content {
    background: var(--background-secondary, #f3f4f6);
    color: var(--text-color-secondary, #666);
  }

  .match-section-name {
    font-size: var(--font-size-xs, 0.75rem);
    color: var(--text-color-secondary, #999);
  }

  .match-context {
    margin: 0;
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color, #333);
    line-height: 1.5;
    padding-right: var(--spacing-lg, 24px);
  }

  .match-context :global(mark) {
    background: color-mix(in srgb, var(--primary-color, #C8102E) 20%, transparent);
    color: inherit;
    padding: 1px 2px;
    border-radius: 2px;
  }

  .match-go-arrow {
    position: absolute;
    right: var(--spacing-lg, 24px);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-color-secondary, #999);
    opacity: 0;
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .match-button:hover .match-go-arrow {
    opacity: 1;
    transform: translateY(-50%) translateX(4px);
  }

  /* No results */
  .no-results {
    text-align: center;
    padding: var(--spacing-2xl, 48px) var(--spacing-lg, 24px);
  }

  .no-results-icon {
    margin-bottom: var(--spacing-lg, 24px);
    color: var(--text-color-secondary, #999);
    opacity: 0.5;
  }

  .no-results h2 {
    font-size: var(--font-size-xl, 1.5rem);
    font-weight: 600;
    color: var(--text-color, #333);
    margin: 0 0 var(--spacing-sm, 8px) 0;
  }

  .no-results > p {
    color: var(--text-color-secondary, #666);
    margin: 0 0 var(--spacing-xl, 32px) 0;
  }

  .search-suggestions {
    padding: var(--spacing-lg, 24px);
    background: var(--background-secondary, #f9fafb);
    border-radius: 12px;
  }

  .search-suggestions > p {
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color-secondary, #666);
    margin: 0 0 var(--spacing-sm, 8px) 0;
  }

  .suggestion-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm, 8px);
    justify-content: center;
  }

  .suggestion-chips button {
    padding: 8px 16px;
    background: var(--card-background, white);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 20px;
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color, #333);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .suggestion-chips button:hover {
    border-color: var(--primary-color, #C8102E);
    color: var(--primary-color, #C8102E);
    background: color-mix(in srgb, var(--primary-color, #C8102E) 5%, white);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .search-results-page {
      padding: var(--spacing-md, 16px);
    }

    .result-card-header,
    .match-button {
      padding-left: var(--spacing-md, 16px);
      padding-right: var(--spacing-md, 16px);
    }

    .results-title {
      font-size: var(--font-size-xl, 1.5rem);
    }
  }
</style>
