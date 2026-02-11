/**
 * Search Store - Full-text search for documentation
 *
 * This store provides search functionality across all documentation articles.
 * It builds an index on first use and supports:
 * - Fuzzy matching (tolerates typos)
 * - Section-level results (links to specific headings)
 * - Context snippets showing matched text
 *
 * Architecture:
 * 1. Index is built lazily on first search
 * 2. Each searchable item has: text, article path, section anchor, type
 * 3. Results are scored by relevance and grouped by article
 */

import { writable, derived } from 'svelte/store';
import { articles } from '../content/articles.js';
import { contentIndex } from './learn.js';

// =============================================================================
// STORES
// =============================================================================

/** The current search query */
export const searchQuery = writable('');

/** Whether search is active (input is focused or has content) */
export const searchActive = writable(false);

/** The built search index (null until first search) */
const searchIndex = writable(null);

// =============================================================================
// INDEX BUILDING
// =============================================================================

/**
 * Extract searchable text from a section.
 * Different section types store text in different fields.
 *
 * @param {object} section - A section object from an article
 * @returns {string} The text content to index
 */
function extractSectionText(section) {
  switch (section.type) {
    case 'heading':
      return section.text || '';
    case 'paragraph':
      // Remove LaTeX delimiters for cleaner search
      return (section.text || '').replace(/\$[^$]+\$/g, ' ');
    case 'list':
    case 'numbered-list':
      return (section.items || []).join(' ').replace(/\$[^$]+\$/g, ' ');
    case 'formula':
      // Include label if present (e.g., "AWGN Channel Model")
      return section.label || '';
    case 'note':
      return (section.text || '').replace(/\$[^$]+\$/g, ' ');
    case 'code':
      return section.code || '';
    case 'definitions':
      return (section.items || [])
        .map(item => `${item.term} ${item.definition}`)
        .join(' ');
    case 'try-it':
      return `${section.label || ''} ${section.description || ''}`;
    default:
      return '';
  }
}

/**
 * Build the search index from all articles.
 * Creates an array of searchable items, each with:
 * - text: The searchable content
 * - textLower: Lowercase version for matching
 * - article: { section, id, title } for navigation
 * - anchor: Section ID for deep-linking (optional)
 * - type: 'title' | 'heading' | 'content'
 * - context: Text to show in results
 *
 * @returns {Array} The search index
 */
function buildIndex() {
  const index = [];

  // Iterate through all sections and articles
  for (const [sectionKey, sectionArticles] of Object.entries(articles)) {
    for (const [articleId, article] of Object.entries(sectionArticles)) {
      // Get article title from contentIndex for consistent naming
      const articleMeta = contentIndex[sectionKey]?.articles.find(a => a.id === articleId);
      const articleTitle = articleMeta?.title || article.title;

      // Add article title as a searchable item
      index.push({
        text: articleTitle,
        textLower: articleTitle.toLowerCase(),
        article: { section: sectionKey, id: articleId, title: articleTitle },
        anchor: null,
        type: 'title',
        context: article.subtitle || articleTitle
      });

      // Add subtitle if present
      if (article.subtitle) {
        index.push({
          text: article.subtitle,
          textLower: article.subtitle.toLowerCase(),
          article: { section: sectionKey, id: articleId, title: articleTitle },
          anchor: null,
          type: 'subtitle',
          context: article.subtitle
        });
      }

      // Process each section in the article
      let lastHeadingId = null;
      let lastHeadingText = null;

      for (const section of article.sections || []) {
        // Track the most recent heading for context
        if (section.type === 'heading') {
          lastHeadingId = section.id || null;
          lastHeadingText = section.text || null;

          // Add heading as searchable item
          if (section.text) {
            index.push({
              text: section.text,
              textLower: section.text.toLowerCase(),
              article: { section: sectionKey, id: articleId, title: articleTitle },
              anchor: section.id,
              type: 'heading',
              context: section.text
            });
          }
        } else {
          // Add content from other section types
          const text = extractSectionText(section);
          if (text && text.trim().length > 10) {
            // Create a context snippet (first 120 chars)
            const context = text.substring(0, 120).trim() + (text.length > 120 ? '...' : '');

            index.push({
              text: text,
              textLower: text.toLowerCase(),
              article: { section: sectionKey, id: articleId, title: articleTitle },
              anchor: lastHeadingId,
              type: 'content',
              context: context,
              headingContext: lastHeadingText
            });
          }
        }
      }
    }
  }

  return index;
}

/**
 * Get or build the search index (lazy initialization).
 */
function getIndex() {
  let index;
  searchIndex.subscribe(val => index = val)();

  if (!index) {
    index = buildIndex();
    searchIndex.set(index);
  }

  return index;
}

// =============================================================================
// SEARCH ALGORITHM
// =============================================================================

/**
 * Calculate a fuzzy match score between query and text.
 * Higher score = better match.
 *
 * Scoring factors:
 * - Exact substring match: highest score
 * - Word prefix match: high score
 * - All query words present: medium score
 *
 * @param {string} query - Search query (lowercase)
 * @param {string} text - Text to search in (lowercase)
 * @param {string} type - Item type for boosting ('title' > 'heading' > 'content')
 * @returns {number} Match score (0 = no match)
 */
function calculateScore(query, text, type) {
  if (!query || !text) return 0;

  // Type boost: titles and headings rank higher
  const typeBoost = type === 'title' ? 3 : type === 'heading' ? 2 : type === 'subtitle' ? 2.5 : 1;

  // Exact substring match - highest priority
  if (text.includes(query)) {
    // Boost if match is at start of text or word
    const atStart = text.startsWith(query) || text.includes(' ' + query);
    return (atStart ? 100 : 80) * typeBoost;
  }

  // Split query into words
  const queryWords = query.split(/\s+/).filter(w => w.length > 1);
  if (queryWords.length === 0) return 0;

  // Check how many query words are found
  let matchedWords = 0;
  let prefixMatches = 0;

  for (const word of queryWords) {
    if (text.includes(word)) {
      matchedWords++;
      // Check if it's a word prefix match
      const wordBoundaryMatch = text.includes(' ' + word) || text.startsWith(word);
      if (wordBoundaryMatch) prefixMatches++;
    }
  }

  if (matchedWords === 0) return 0;

  // Score based on proportion of matched words
  const matchRatio = matchedWords / queryWords.length;
  const prefixBonus = prefixMatches * 5;

  return (matchRatio * 50 + prefixBonus) * typeBoost;
}

/**
 * Search the index and return ranked results.
 *
 * @param {string} query - The search query
 * @returns {Array} Results grouped by article with scores
 */
export function search(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const index = getIndex();
  const queryLower = query.toLowerCase().trim();

  // Score all items
  const scored = [];
  for (const item of index) {
    const score = calculateScore(queryLower, item.textLower, item.type);
    if (score > 0) {
      scored.push({ ...item, score });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Group by article, keeping best match per section
  const articleMap = new Map();
  const seenAnchors = new Set();

  for (const result of scored) {
    const articleKey = `${result.article.section}/${result.article.id}`;
    const anchorKey = `${articleKey}#${result.anchor || ''}`;

    // Skip if we already have this exact anchor
    if (seenAnchors.has(anchorKey)) continue;
    seenAnchors.add(anchorKey);

    if (!articleMap.has(articleKey)) {
      articleMap.set(articleKey, {
        article: result.article,
        topScore: result.score,
        matches: []
      });
    }

    const articleResult = articleMap.get(articleKey);

    // Limit matches per article to avoid clutter
    if (articleResult.matches.length < 3) {
      articleResult.matches.push({
        anchor: result.anchor,
        context: result.context,
        headingContext: result.headingContext,
        type: result.type,
        score: result.score
      });
    }
  }

  // Convert to array and sort by top score
  const results = Array.from(articleMap.values());
  results.sort((a, b) => b.topScore - a.topScore);

  // Limit total results
  return results.slice(0, 10);
}

// =============================================================================
// DERIVED STORE FOR REACTIVE RESULTS
// =============================================================================

/**
 * Derived store that automatically updates search results when query changes.
 * This is the main store components should subscribe to.
 */
export const searchResults = derived(
  searchQuery,
  ($query) => search($query)
);

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Clear the search query and deactivate search.
 */
export function clearSearch() {
  searchQuery.set('');
  searchActive.set(false);
}

/**
 * Activate search mode (e.g., when input is focused).
 */
export function activateSearch() {
  searchActive.set(true);
}

/**
 * Deactivate search mode (e.g., when clicking outside).
 */
export function deactivateSearch() {
  // Only deactivate if query is empty
  let query;
  searchQuery.subscribe(q => query = q)();
  if (!query) {
    searchActive.set(false);
  }
}
