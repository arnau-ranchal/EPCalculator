/**
 * KaTeX Utility Functions
 *
 * Shared utilities for rendering LaTeX math expressions.
 * Used by both the documentation hub and inline hover documentation.
 *
 * KaTeX is a fast math typesetting library. It converts LaTeX strings
 * (like "\frac{a}{b}") into HTML that displays as beautiful math formulas.
 */

import katex from 'katex';

/**
 * Render a LaTeX formula as a display block (centered, larger).
 *
 * @param {string} formula - LaTeX string (e.g., "E_0(\\rho) = -\\ln...")
 * @returns {string} HTML string to be used with {@html ...}
 *
 * @example
 * // In Svelte template:
 * {@html renderBlockLatex("\\frac{a}{b}")}
 * // Displays: a/b as a fraction, centered
 */
export function renderBlockLatex(formula) {
  try {
    return katex.renderToString(formula, {
      throwOnError: false,  // Don't crash on bad LaTeX, show error message instead
      displayMode: true     // Display mode = centered, larger font
    });
  } catch (e) {
    console.warn('KaTeX block render error:', e);
    return `<span class="katex-error">${formula}</span>`;
  }
}

/**
 * Render a LaTeX formula inline (within text, smaller).
 *
 * @param {string} formula - LaTeX string
 * @returns {string} HTML string
 *
 * @example
 * // "The signal power is " + renderInlineLatex("P_s") + " watts"
 */
export function renderInlineLatex(formula) {
  try {
    return katex.renderToString(formula, {
      throwOnError: false,
      displayMode: false    // Inline mode = smaller, flows with text
    });
  } catch (e) {
    console.warn('KaTeX inline render error:', e);
    return `<span class="katex-error">${formula}</span>`;
  }
}

/**
 * Process text containing $...$ delimiters for inline math,
 * basic markdown formatting (**bold**, *italic*, `code`),
 * and Wikipedia-style article links ([[path|text]]).
 *
 * This finds all $formula$ patterns in a string and renders them,
 * then processes markdown-style formatting and article links.
 *
 * @param {string} text - Text with $...$ math delimiters, markdown, and links
 * @returns {string} HTML with rendered math, formatting, and links
 *
 * @example
 * processInlineLatex("The **SNR** is $\\gamma = P_s / N_0$")
 * // Returns HTML where the formula is rendered and bold text is wrapped in <strong>
 *
 * @example
 * processInlineLatex("See [[concepts/error-exponent|error exponent]] for details")
 * // Returns HTML with a clickable link to the error-exponent article
 *
 * @example
 * processInlineLatex("Learn about [[concepts/error-exponent#e0-formula|Gallager's E₀]]")
 * // Returns HTML with a link that scrolls to the e0-formula section
 */
export function processInlineLatex(text) {
  if (!text) return '';

  try {
    // First, process LaTeX ($...$)
    // Regular expression explanation:
    // \$       - Match a literal dollar sign
    // ([^$]+)  - Capture one or more characters that aren't dollar signs
    // \$       - Match the closing dollar sign
    let result = text.replace(/\$([^$]+)\$/g, (match, latex) => {
      return renderInlineLatex(latex);
    });

    // Process Wikipedia-style article links: [[path|display text]] or [[path#anchor|display text]]
    // Creates clickable links that navigate within the documentation hub
    // Supports optional #anchor for deep linking to sections within articles
    result = result.replace(/\[\[([^\]|#]+)(#[^\]|]+)?\|([^\]]+)\]\]/g, (match, path, anchor, displayText) => {
      // anchor includes the # if present, e.g., "#e0-formula" or undefined
      const anchorId = anchor ? anchor.substring(1) : ''; // Remove the # prefix
      const anchorAttr = anchorId ? ` data-anchor="${anchorId}"` : '';
      // Use # routing for SPA navigation within learn section
      return `<a href="#/learn/${path}" class="article-link" data-article-path="${path}"${anchorAttr}>${displayText}</a>`;
    });

    // Also support [[path]] or [[path#anchor]] without display text (uses path as text)
    result = result.replace(/\[\[([^\]|#]+)(#[^\]|]+)?\]\]/g, (match, path, anchor) => {
      const displayText = path.split('/').pop().replace(/-/g, ' ');
      const anchorId = anchor ? anchor.substring(1) : '';
      const anchorAttr = anchorId ? ` data-anchor="${anchorId}"` : '';
      return `<a href="#/learn/${path}" class="article-link" data-article-path="${path}"${anchorAttr}>${displayText}</a>`;
    });

    // Process markdown bold (**text**)
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Process markdown italic (*text*) - but not inside ** or after processing
    result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    // Process inline code (`code`)
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

    return result;
  } catch (e) {
    console.warn('KaTeX text processing error:', e);
    return text;
  }
}

/**
 * Process text containing $$...$$ for block math and $...$ for inline.
 *
 * @param {string} text - Text with math delimiters
 * @returns {string} HTML with rendered math
 */
export function processAllLatex(text) {
  if (!text) return '';

  try {
    // First handle block math ($$...$$)
    let result = text.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
      return `<div class="math-block">${renderBlockLatex(latex)}</div>`;
    });

    // Then handle inline math ($...$)
    result = result.replace(/\$([^$]+)\$/g, (match, latex) => {
      return renderInlineLatex(latex);
    });

    return result;
  } catch (e) {
    console.warn('KaTeX processing error:', e);
    return text;
  }
}
