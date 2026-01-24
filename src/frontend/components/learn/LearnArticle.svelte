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
   * Get the current article based on route.
   * Returns null if article doesn't exist yet.
   */
  $: currentArticle = articles[$routeParts.section]?.[$routeParts.article] || null;

  /**
   * Get previous and next articles for navigation.
   */
  $: navigation = getNavigation($routeParts.section, $routeParts.article);

  /**
   * Scroll to a section by ID.
   * Uses smooth scrolling and highlights the target briefly.
   */
  async function scrollToSection(sectionId) {
    // Wait for DOM to update (tick ensures Svelte has rendered)
    await tick();

    const element = document.getElementById(sectionId);
    if (element) {
      // Scroll into view with smooth animation
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Add highlight effect briefly
      element.classList.add('scroll-highlight');
      setTimeout(() => {
        element.classList.remove('scroll-highlight');
      }, 2000);
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
    <div class="article-body">
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
            <span class="note-icon">{section.variant === 'warning' ? '⚠️' : '💡'}</span>
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
              <dt>{@html processInlineLatex(item.term)}</dt>
              <dd>{@html processInlineLatex(item.definition)}</dd>
            {/each}
          </dl>

        <!-- Screenshot from Playwright capture -->
        {:else if section.type === 'screenshot'}
          <figure class="section-screenshot">
            <img
              src="/tutorial-images/{section.name}.png"
              alt={section.alt || section.caption || section.name}
              loading="lazy"
              on:error={(e) => e.target.style.display = 'none'}
            />
            {#if section.caption}
              <figcaption>{section.caption}</figcaption>
            {/if}
          </figure>

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

  /* Scroll highlight animation for deep linking */
  .section-heading.scroll-highlight {
    animation: highlightPulse 2s ease-out;
  }

  @keyframes highlightPulse {
    0% {
      background: color-mix(in srgb, var(--primary-color, #C8102E) 25%, transparent);
      border-radius: 8px;
      padding-left: var(--spacing-md, 16px);
      margin-left: calc(-1 * var(--spacing-md, 16px));
    }
    100% {
      background: transparent;
      padding-left: 0;
      margin-left: 0;
    }
  }

  /* Paragraphs */
  .section-paragraph {
    font-size: var(--font-size-base, 1rem);
    color: var(--text-color, #333);
    margin: 0 0 var(--spacing-md, 16px) 0;
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
    gap: var(--spacing-md, 16px);
    background: color-mix(in srgb, var(--primary-color, #C8102E) 8%, white);
    border-left: 4px solid var(--primary-color, #C8102E);
    border-radius: 0 8px 8px 0;
    padding: var(--spacing-md, 16px);
    margin: var(--spacing-md, 16px) 0;
  }

  .section-note.warning {
    background: color-mix(in srgb, #f59e0b 10%, white);
    border-left-color: #f59e0b;
  }

  .note-icon {
    font-size: 1.5em;
    flex-shrink: 0;
  }

  .note-content {
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color, #333);
    line-height: 1.5;
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
    text-align: center;
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
  }

  /* Definition list */
  .section-definitions {
    margin: var(--spacing-md, 16px) 0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--spacing-sm, 8px) var(--spacing-md, 16px);
  }

  .section-definitions dt {
    font-weight: 600;
    color: var(--primary-color, #C8102E);
  }

  .section-definitions dd {
    margin: 0;
    color: var(--text-color, #333);
  }

  /* Screenshot images from Playwright */
  .section-screenshot {
    margin: var(--spacing-lg, 24px) 0;
    text-align: center;
  }

  .section-screenshot img {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
    border: 1px solid var(--border-color, #e5e5e5);
  }

  .section-screenshot figcaption {
    margin-top: var(--spacing-sm, 8px);
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--text-color-secondary, #6c757d);
    font-style: italic;
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
