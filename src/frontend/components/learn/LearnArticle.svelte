<script>
  /**
   * LearnArticle.svelte
   *
   * Renders documentation articles with:
   * - Markdown-style content (headings, paragraphs, lists)
   * - KaTeX math formulas (both block and inline)
   * - Code blocks with syntax highlighting
   * - "Try it" buttons that link to the calculator
   * - Previous/Next navigation
   * - Deep linking to sections (scroll to specific heading)
   */

  import { onMount, tick } from 'svelte';
  import { _ } from 'svelte-i18n';
  import 'katex/dist/katex.min.css';
  import { renderBlockLatex, processInlineLatex } from '../../utils/katex.js';
  import {
    routeParts,
    navigateToLearn,
    tryInCalculator,
    contentIndex,
    scrollTarget,
    clearScrollTarget
  } from '../../stores/learn.js';
  import { articles } from '../../content/articles.js';

  /**
   * Track which screenshot images have failed to load.
   * Using a Set for O(1) lookup.
   */
  let failedImages = new Set();

  /**
   * Handle image load error - mark the image as failed.
   */
  function handleImageError(imageName) {
    failedImages.add(imageName);
    failedImages = failedImages; // Trigger Svelte reactivity
  }

  /**
   * Check if an image has failed to load.
   */
  function hasImageFailed(imageName) {
    return failedImages.has(imageName);
  }

  /**
   * Get the current article based on route.
   * Returns null if article doesn't exist yet.
   */
  $: currentArticle = articles[$routeParts.section]?.[$routeParts.article] || null;

  // Reset failed images when article changes
  $: if (currentArticle) {
    failedImages = new Set();
  }

  /**
   * Get previous and next articles for navigation.
   */
  $: navigation = getNavigation($routeParts.section, $routeParts.article);

  /**
   * Scroll to a section by ID.
   * Uses smooth scrolling and highlights the target briefly.
   * Accounts for the fixed header height to avoid covering the section.
   */
  async function scrollToSection(sectionId) {
    // Wait for DOM to update (tick ensures Svelte has rendered)
    await tick();

    const element = document.getElementById(sectionId);
    if (element) {
      // Get the header height to offset the scroll position
      // The header is fixed, so we need to scroll a bit less to avoid covering the title
      const header = document.querySelector('header.site-header, .header, header');
      const headerHeight = header ? header.offsetHeight : 60; // fallback to 60px
      const extraPadding = 16; // additional breathing room

      // Calculate the target scroll position
      const elementRect = element.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const targetScrollPosition = absoluteElementTop - headerHeight - extraPadding;

      // Scroll instantly to the target position
      window.scrollTo({
        top: targetScrollPosition,
        behavior: 'instant'
      });

      // Force animation restart by removing and re-adding class
      element.classList.remove('scroll-highlight');
      // Trigger reflow to ensure the removal is processed
      void element.offsetWidth;
      element.classList.add('scroll-highlight');

      setTimeout(() => {
        element.classList.remove('scroll-highlight');
      }, 2500);
    }

    // Clear the scroll target so it doesn't re-scroll
    clearScrollTarget();
  }

  /**
   * Watch for scrollTarget changes and scroll when set.
   * This reactive statement runs whenever $scrollTarget changes.
   */
  $: if ($scrollTarget && currentArticle) {
    scrollToSection($scrollTarget);
  }

  /**
   * Also check on mount in case we navigated directly with a scroll target.
   */
  onMount(() => {
    if ($scrollTarget) {
      scrollToSection($scrollTarget);
    }
  });

  function getNavigation(section, articleId) {
    const sectionData = contentIndex[section];
    if (!sectionData) return { prev: null, next: null };

    const articleList = sectionData.articles;
    const currentIndex = articleList.findIndex(a => a.id === articleId);

    return {
      prev: currentIndex > 0
        ? { ...articleList[currentIndex - 1], section }
        : null,
      next: currentIndex < articleList.length - 1
        ? { ...articleList[currentIndex + 1], section }
        : null
    };
  }

  /**
   * Handle "Try it" button click.
   * Navigates to calculator with preset parameters.
   */
  function handleTryIt(params) {
    tryInCalculator(params);
  }

  /**
   * Track which formula was recently copied (for visual feedback).
   * Maps formula latex string to a timeout ID.
   */
  let copiedFormulas = new Set();

  /**
   * Copy LaTeX formula source to clipboard.
   * Shows brief visual feedback on success.
   */
  async function copyLatex(latex) {
    try {
      await navigator.clipboard.writeText(latex);
      copiedFormulas.add(latex);
      copiedFormulas = copiedFormulas; // Trigger reactivity

      // Reset after 2 seconds
      setTimeout(() => {
        copiedFormulas.delete(latex);
        copiedFormulas = copiedFormulas;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy LaTeX:', err);
    }
  }

  /**
   * Handle clicks on article links (Wikipedia-style [[path|text]] links).
   * Uses event delegation to catch clicks on dynamically rendered links.
   *
   * This intercepts clicks on .article-link elements to use our
   * navigateToLearn function with proper scroll target support.
   */
  function handleArticleLinkClick(event) {
    // Find the closest .article-link if clicked on a child element
    const link = event.target.closest('.article-link');
    if (!link) return;

    // Prevent default anchor behavior
    event.preventDefault();

    // Extract path and optional anchor from data attributes
    const path = link.dataset.articlePath;
    const anchor = link.dataset.anchor || null;

    // Navigate using our store-based navigation with scroll target support
    navigateToLearn(path, anchor);
  }
</script>

<article class="learn-article">
  {#if currentArticle}
    <!-- Article Header -->
    <header class="article-header">
      <div class="breadcrumb">
        <button class="breadcrumb-link" on:click={() => navigateToLearn('')}>
          Home
        </button>
        <span class="breadcrumb-sep">›</span>
        <button class="breadcrumb-link" on:click={() => navigateToLearn($routeParts.section)}>
          {contentIndex[$routeParts.section]?.title || $routeParts.section}
        </button>
      </div>
      <h1 class="article-title">{currentArticle.title}</h1>
      {#if currentArticle.subtitle}
        <p class="article-subtitle">{currentArticle.subtitle}</p>
      {/if}
    </header>

    <!-- Article Content -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="article-body" on:click={handleArticleLinkClick}>
      {#each currentArticle.sections as section}
        <!-- Heading (with optional id for deep linking) -->
        {#if section.type === 'heading'}
          <h2
            class="section-heading"
            id={section.id || null}
          >{section.text}</h2>

        <!-- Paragraph with inline LaTeX -->
        {:else if section.type === 'paragraph'}
          <p class="section-paragraph">{@html processInlineLatex(section.text)}</p>

        <!-- Block formula (centered, large) -->
        {:else if section.type === 'formula'}
          <div class="section-formula">
            {@html renderBlockLatex(section.latex)}
            {#if section.label}
              <span class="formula-label">{section.label}</span>
            {/if}
            <button
              class="copy-latex-btn"
              class:copied={copiedFormulas.has(section.latex)}
              on:click={() => copyLatex(section.latex)}
              title="Copy LaTeX"
            >
              {#if copiedFormulas.has(section.latex)}
                <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              {:else}
                <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              {/if}
            </button>
          </div>

        <!-- Code block -->
        {:else if section.type === 'code'}
          <div class="section-code">
            {#if section.language}
              <span class="code-language">{section.language}</span>
            {/if}
            <pre><code>{section.code}</code></pre>
          </div>

        <!-- Bulleted list -->
        {:else if section.type === 'list'}
          <ul class="section-list">
            {#each section.items as item}
              <li>{@html processInlineLatex(item)}</li>
            {/each}
          </ul>

        <!-- Numbered list -->
        {:else if section.type === 'numbered-list'}
          <ol class="section-list numbered">
            {#each section.items as item}
              <li>{@html processInlineLatex(item)}</li>
            {/each}
          </ol>

        <!-- Info/Note box -->
        {:else if section.type === 'note'}
          <aside class="section-note" class:warning={section.variant === 'warning'}>
            {#if section.variant === 'warning'}
              <svg class="note-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            {:else}
              <svg class="note-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            {/if}
            <div class="note-content">{@html processInlineLatex(section.text)}</div>
          </aside>

        <!-- "Try it" button -->
        {:else if section.type === 'try-it'}
          <div class="section-try-it">
            <button class="try-it-button" on:click={() => handleTryIt(section.params)}>
              <span class="try-it-icon">🧪</span>
              {section.label || 'Try it in Calculator'}
            </button>
            {#if section.description}
              <p class="try-it-description">{section.description}</p>
            {/if}
          </div>

        <!-- Image -->
        {:else if section.type === 'image'}
          <figure class="section-image">
            <img src={section.src} alt={section.alt || ''} />
            {#if section.caption}
              <figcaption>{section.caption}</figcaption>
            {/if}
          </figure>

        <!-- Definition list (term: definition) -->
        {:else if section.type === 'definitions'}
          <dl class="section-definitions">
            {#each section.items as item}
              <div class="definition-item">
                <dt>{@html processInlineLatex(item.term)}</dt>
                <dd>{@html processInlineLatex(item.definition)}</dd>
              </div>
            {/each}
          </dl>

        <!-- Screenshot from Playwright capture -->
        {:else if section.type === 'screenshot'}
          <figure class="section-screenshot">
            <div class="screenshot-container">
              {#if !failedImages.has(section.name)}
                <img
                  src="/src/frontend/assets/tutorial-images/{section.name}.png"
                  alt={section.alt || section.caption || section.name}
                  loading="lazy"
                  on:error={() => handleImageError(section.name)}
                />
              {:else}
                <div class="screenshot-placeholder">
                  <span class="placeholder-icon">📷</span>
                  <span class="placeholder-text">Screenshot: {section.name}</span>
                  <span class="placeholder-hint">{section.caption || 'Image not yet captured'}</span>
                </div>
              {/if}
            </div>
            {#if section.caption}
              <figcaption>{section.caption}</figcaption>
            {/if}
          </figure>

        <!-- Cross-reference to other articles (only show tutorial variants) -->
        {:else if section.type === 'cross-reference' && section.variant === 'tutorial'}
          <aside class="section-cross-reference to-tutorial">
            <div class="cross-ref-header">
              <span class="cross-ref-icon">🎯</span>
              <span class="cross-ref-title">Apply This in the App</span>
            </div>
            <div class="cross-ref-links">
              {#each section.links as link}
                <button
                  class="cross-ref-link"
                  on:click={() => navigateToLearn(link.path)}
                >
                  <span class="link-label">{link.label}</span>
                  {#if link.description}
                    <span class="link-desc">{link.description}</span>
                  {/if}
                </button>
              {/each}
            </div>
          </aside>

        <!-- API Link card -->
        {:else if section.type === 'api-link'}
          <aside class="section-api-link">
            <div class="api-link-header">
              <span class="api-method {section.method?.toLowerCase() || 'get'}">{section.method || 'GET'}</span>
              <code class="api-endpoint">{section.endpoint}</code>
            </div>
            {#if section.description}
              <p class="api-description">{section.description}</p>
            {/if}
            <a
              href={section.docsPath}
              class="api-docs-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>View in API Reference</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </aside>

        {/if}
      {/each}
    </div>

    <!-- Navigation -->
    <nav class="article-nav">
      {#if navigation.prev}
        <button
          class="nav-button prev"
          on:click={() => navigateToLearn(`${navigation.prev.section}/${navigation.prev.id}`)}
        >
          <span class="nav-arrow">←</span>
          <span class="nav-info">
            <span class="nav-label">Previous</span>
            <span class="nav-title">{navigation.prev.title}</span>
          </span>
        </button>
      {:else}
        <div class="nav-spacer"></div>
      {/if}

      {#if navigation.next}
        <button
          class="nav-button next"
          on:click={() => navigateToLearn(`${navigation.next.section}/${navigation.next.id}`)}
        >
          <span class="nav-info">
            <span class="nav-label">Next</span>
            <span class="nav-title">{navigation.next.title}</span>
          </span>
          <span class="nav-arrow">→</span>
        </button>
      {/if}
    </nav>

  {:else}
    <!-- Article not found -->
    <div class="article-not-found">
      <span class="not-found-icon">📝</span>
      <h2>Article Coming Soon</h2>
      <p>
        This article is currently being written.
        Check back soon, or explore other topics in the sidebar.
      </p>
      <button class="back-button" on:click={() => navigateToLearn('')}>
        ← Back to Documentation Home
      </button>
    </div>
  {/if}
</article>

<style>
  .learn-article {
    max-width: 100%;
  }

  /* Header */
  .article-header {
    margin-bottom: var(--spacing-xl, 32px);
    padding-bottom: var(--spacing-lg, 24px);
    border-bottom: 1px solid var(--border-color, #e5e5e5);
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    margin-bottom: var(--spacing-md, 16px);
    font-size: var(--font-size-sm, 0.875rem);
  }

  .breadcrumb-link {
    background: none;
    border: none;
    color: var(--text-color-secondary, #666);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.15s ease;
  }

  .breadcrumb-link:hover {
    background: var(--hover-background, #f5f5f5);
    color: var(--primary-color, #C8102E);
  }

  .breadcrumb-sep {
    color: var(--text-color-secondary, #666);
  }

  .article-title {
    font-size: var(--font-size-xxl, 2rem);
    font-weight: 700;
    color: var(--text-color, #333);
    margin: 0;
    line-height: 1.3;
  }

  .article-subtitle {
    font-size: var(--font-size-lg, 1.125rem);
    color: var(--text-color-secondary, #666);
    margin: var(--spacing-sm, 8px) 0 0 0;
    line-height: 1.5;
  }

  /* Body */
  .article-body {
    line-height: 1.7;
  }

  /* Headings */
  .section-heading {
    font-size: var(--font-size-xl, 1.5rem);
    font-weight: 600;
    color: var(--text-color, #333);
    margin: var(--spacing-xl, 32px) 0 var(--spacing-md, 16px) 0;
    padding-top: var(--spacing-md, 16px);
    border-top: 1px solid var(--border-color, #e5e5e5);
  }

  .section-heading:first-child {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }

  /* Scroll highlight for deep linking - no fade, persistent highlight */
  .section-heading.scroll-highlight {
    /* No animation - just scroll into view without visual highlight */
  }

  /* Paragraphs */
  .section-paragraph {
    font-size: var(--font-size-base, 1rem);
    color: var(--text-color, #333);
    margin: 0 0 var(--spacing-md, 16px) 0;
  }

  /* Wikipedia-style article links [[path|text]] */
  :global(.article-link) {
    color: var(--accent-color, #c8102e);
    text-decoration: none;
    border-bottom: 1px dotted var(--accent-color, #c8102e);
    transition: border-bottom-style 0.15s ease;
  }

  :global(.article-link:hover) {
    border-bottom-style: solid;
  }

  :global(.article-link:visited) {
    color: var(--accent-color-dark, #a00d26);
  }

  /* Formulas */
  .section-formula {
    background: var(--surface-color, #f5f5f5);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 8px;
    padding: var(--spacing-lg, 24px);
    margin: var(--spacing-lg, 24px) 0;
    text-align: center;
    overflow-x: auto;
    position: relative;
  }

  .section-formula :global(.katex) {
    font-size: 1.3em;
  }

  .formula-label {
    position: absolute;
    right: var(--spacing-md, 16px);
    bottom: var(--spacing-sm, 8px);
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color-secondary, #666);
    font-style: italic;
  }

  /* Copy LaTeX button */
  .copy-latex-btn {
    position: absolute;
    top: var(--spacing-sm, 8px);
    right: var(--spacing-sm, 8px);
    background: var(--card-background, white);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 6px;
    padding: 6px 10px;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .section-formula:hover .copy-latex-btn {
    opacity: 1;
  }

  .copy-latex-btn:hover {
    background: var(--hover-background, #f0f0f0);
    border-color: var(--primary-color, #C8102E);
  }

  .copy-latex-btn.copied {
    opacity: 1;
    background: color-mix(in srgb, #10b981 15%, var(--card-background, white));
    border-color: #10b981;
    color: #10b981;
  }

  .copy-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  /* Code blocks */
  .section-code {
    position: relative;
    margin: var(--spacing-md, 16px) 0;
  }

  .code-language {
    position: absolute;
    top: 0;
    right: 0;
    background: var(--primary-color, #C8102E);
    color: white;
    font-size: var(--font-size-xs, 0.75rem);
    padding: 4px 12px;
    border-radius: 0 8px 0 8px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .section-code pre {
    background: var(--surface-color, #f5f5f5);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 8px;
    padding: var(--spacing-md, 16px);
    overflow-x: auto;
    margin: 0;
  }

  .section-code code {
    font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
    font-size: var(--font-size-sm, 0.875rem);
    line-height: 1.5;
  }

  /* Lists */
  .section-list {
    margin: 0 0 var(--spacing-md, 16px) 0;
    padding-left: var(--spacing-lg, 24px);
  }

  .section-list li {
    margin-bottom: var(--spacing-sm, 8px);
    color: var(--text-color, #333);
  }

  .section-list.numbered {
    list-style-type: decimal;
  }

  /* Notes */
  .section-note {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm, 10px);
    background: var(--surface-color, #f8f9fa);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 8px;
    padding: var(--spacing-md, 16px);
    margin: var(--spacing-lg, 24px) 0;
  }

  .section-note .note-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: #0969da;
    margin-top: 2px;
  }

  .section-note .note-content {
    font-size: var(--font-size-base, 1rem);
    color: var(--text-color, #333);
    line-height: 1.6;
  }

  /* Warning variant */
  .section-note.warning {
    background: #fff8e6;
    border-color: #f5c518;
  }

  .section-note.warning .note-icon {
    color: #9a6700;
  }

  /* Dark mode support */
  :global(.dark) .section-note {
    background: var(--surface-color, #1e1e1e);
    border-color: var(--border-color, #3a3a3a);
  }

  :global(.dark) .section-note .note-icon {
    color: #58a6ff;
  }

  :global(.dark) .section-note .note-content {
    color: var(--text-color, #e0e0e0);
  }

  :global(.dark) .section-note.warning {
    background: #2d2a1f;
    border-color: #9e8026;
  }

  :global(.dark) .section-note.warning .note-icon {
    color: #f5c518;
  }

  /* Try it button */
  .section-try-it {
    margin: var(--spacing-lg, 24px) 0;
    padding: var(--spacing-md, 16px);
    background: linear-gradient(135deg,
      color-mix(in srgb, var(--primary-color, #C8102E) 8%, white),
      color-mix(in srgb, var(--primary-color, #C8102E) 4%, white)
    );
    border-radius: 12px;
    border: 1px solid var(--border-color, #e5e5e5);
  }

  .try-it-button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
    background: var(--primary-color, #C8102E);
    color: white;
    border: none;
    border-radius: 8px;
    padding: var(--spacing-sm, 8px) var(--spacing-lg, 24px);
    font-size: var(--font-size-base, 1rem);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .try-it-button:hover {
    background: var(--primary-color-dark, #a00d25);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.15));
  }

  .try-it-icon {
    font-size: 1.2em;
  }

  .try-it-description {
    margin: var(--spacing-sm, 8px) 0 0 0;
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color-secondary, #666);
  }

  /* Images */
  .section-image {
    margin: var(--spacing-lg, 24px) 0;
  }

  .section-image img {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1));
  }

  .section-image figcaption {
    margin-top: var(--spacing-sm, 8px);
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color-secondary, #666);
    font-style: italic;
    text-align: center;
  }

  /* Definition list */
  .section-definitions {
    margin: var(--spacing-md, 16px) 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs, 6px) var(--spacing-lg, 24px);
  }

  .section-definitions .definition-item {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .section-definitions dt {
    font-weight: 600;
    color: var(--primary-color, #C8102E);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .section-definitions dt :global(svg) {
    flex-shrink: 0;
    vertical-align: middle;
  }

  .section-definitions dt::after {
    content: ':';
  }

  .section-definitions dd {
    margin: 0;
    color: var(--text-color, #333);
  }

  /* Screenshot images from Playwright */
  .section-screenshot {
    margin: var(--spacing-lg, 24px) 0;
  }

  .screenshot-container {
    position: relative;
    width: 100%;
  }

  .section-screenshot img {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
    border: 1px solid var(--border-color, #e5e5e5);
  }

  .screenshot-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px 24px;
    background: linear-gradient(135deg, #fff5f5, #ffebeb);
    border: 2px dashed #e8a0a0;
    border-radius: 8px;
    min-height: 150px;
    width: 100%;
    box-sizing: border-box;
  }

  :global(.dark) .screenshot-placeholder {
    background: linear-gradient(135deg, #2d2020, #352525);
    border-color: #6b4040;
  }

  .placeholder-icon {
    font-size: 2.5rem;
    opacity: 0.7;
  }

  .placeholder-text {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.85rem;
    color: #C8102E;
    background: rgba(200, 16, 46, 0.1);
    padding: 6px 14px;
    border-radius: 6px;
    font-weight: 500;
  }

  :global(.dark) .placeholder-text {
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.15);
  }

  .placeholder-hint {
    font-size: 0.8rem;
    color: #888;
    font-style: italic;
    max-width: 350px;
    text-align: center;
    line-height: 1.4;
  }

  :global(.dark) .placeholder-hint {
    color: #999;
  }

  .section-screenshot figcaption {
    margin-top: var(--spacing-sm, 8px);
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color-secondary, #6c757d);
    font-style: italic;
    text-align: center;
  }

  /* Cross-reference links */
  .section-cross-reference {
    margin: var(--spacing-lg, 24px) 0;
    padding: var(--spacing-md, 16px);
    border-radius: 12px;
    border: 1px solid var(--border-color, #e5e5e5);
  }

  .section-cross-reference.to-tutorial {
    background: linear-gradient(135deg,
      color-mix(in srgb, #10b981 8%, var(--card-background, white)),
      color-mix(in srgb, #10b981 4%, var(--card-background, white))
    );
    border-color: color-mix(in srgb, #10b981 30%, var(--border-color, #e5e5e5));
  }

  .cross-ref-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
    margin-bottom: var(--spacing-md, 16px);
  }

  .cross-ref-icon {
    font-size: 1.25rem;
  }

  .cross-ref-title {
    font-weight: 600;
    font-size: var(--font-size-base, 1rem);
    color: var(--text-color, #333);
  }

  .cross-ref-links {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm, 8px);
  }

  .cross-ref-link {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
    background: var(--card-background, white);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
    width: 100%;
    text-align: left;
  }

  .cross-ref-link:hover {
    border-color: var(--primary-color, #C8102E);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.08));
    transform: translateX(4px);
  }

  .cross-ref-link .link-label {
    font-weight: 500;
    color: var(--primary-color, #C8102E);
  }

  .cross-ref-link .link-desc {
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color-secondary, #666);
  }

  /* API Link Card */
  .section-api-link {
    background: var(--card-background, white);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 12px;
    padding: var(--spacing-lg, 24px);
    margin: var(--spacing-lg, 24px) 0;
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.08));
  }

  .api-link-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
    margin-bottom: var(--spacing-md, 16px);
    flex-wrap: wrap;
  }

  .api-method {
    font-size: var(--font-size-xs, 0.75rem);
    font-weight: 700;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  .api-method.post {
    background: #dcfce7;
    color: #166534;
  }

  .api-method.get {
    background: #dbeafe;
    color: #1e40af;
  }

  .api-method.put {
    background: #fef3c7;
    color: #92400e;
  }

  .api-method.delete {
    background: #fee2e2;
    color: #991b1b;
  }

  :global(.dark) .api-method.post {
    background: #166534;
    color: #dcfce7;
  }

  :global(.dark) .api-method.get {
    background: #1e40af;
    color: #dbeafe;
  }

  :global(.dark) .api-method.put {
    background: #92400e;
    color: #fef3c7;
  }

  :global(.dark) .api-method.delete {
    background: #991b1b;
    color: #fee2e2;
  }

  .api-endpoint {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: var(--font-size-base, 1rem);
    color: var(--text-color, #1a1a1a);
    background: var(--inline-code-bg, #f4f4f5);
    padding: 4px 10px;
    border-radius: 6px;
  }

  .api-description {
    color: var(--text-color-secondary, #666);
    margin-bottom: var(--spacing-md, 16px);
    line-height: 1.6;
  }

  .api-docs-link {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
    padding: 10px 16px;
    background: var(--primary-color, #C8102E);
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    font-size: var(--font-size-sm, 0.875rem);
    transition: all 0.2s ease;
  }

  .api-docs-link:hover {
    background: var(--primary-hover, #a00d24);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(200, 16, 46, 0.3);
  }

  .api-docs-link svg {
    width: 16px;
    height: 16px;
  }

  /* Navigation */
  .article-nav {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-md, 16px);
    margin-top: var(--spacing-xxl, 48px);
    padding-top: var(--spacing-lg, 24px);
    border-top: 1px solid var(--border-color, #e5e5e5);
  }

  .nav-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-md, 16px);
    padding: var(--spacing-md, 16px);
    background: var(--card-background, white);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    max-width: 45%;
    text-align: left;
  }

  .nav-button:hover {
    border-color: var(--primary-color, #C8102E);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.08));
  }

  .nav-button.next {
    text-align: right;
    margin-left: auto;
  }

  .nav-arrow {
    font-size: var(--font-size-xl, 1.5rem);
    color: var(--primary-color, #C8102E);
  }

  .nav-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-label {
    font-size: var(--font-size-xs, 0.75rem);
    color: var(--text-color-secondary, #666);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .nav-title {
    font-weight: 600;
    color: var(--text-color, #333);
    font-size: var(--font-size-base, 1rem);
  }

  .nav-spacer {
    flex: 1;
  }

  /* Not found state */
  .article-not-found {
    text-align: center;
    padding: var(--spacing-xxl, 48px) var(--spacing-lg, 24px);
  }

  .not-found-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: var(--spacing-lg, 24px);
    opacity: 0.6;
  }

  .article-not-found h2 {
    font-size: var(--font-size-xl, 1.5rem);
    color: var(--text-color, #333);
    margin: 0 0 var(--spacing-sm, 8px) 0;
  }

  .article-not-found p {
    color: var(--text-color-secondary, #666);
    margin: 0 0 var(--spacing-lg, 24px) 0;
  }

  .back-button {
    background: var(--primary-color, #C8102E);
    color: white;
    border: none;
    border-radius: 8px;
    padding: var(--spacing-sm, 8px) var(--spacing-lg, 24px);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .back-button:hover {
    background: var(--primary-color-dark, #a00d25);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .article-title {
      font-size: var(--font-size-xl, 1.5rem);
    }

    .section-heading {
      font-size: var(--font-size-lg, 1.25rem);
    }

    .article-nav {
      flex-direction: column;
    }

    .nav-button {
      max-width: 100%;
    }

    .nav-button.next {
      text-align: left;
    }
  }
</style>
