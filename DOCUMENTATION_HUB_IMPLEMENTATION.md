# Documentation Hub Implementation Guide

This document explains the implementation of the EPCalculator Documentation Hub, created in 7 phases. Use this as a reference for understanding the architecture and for future frontend learning.

---

## Table of Contents

1. [Why `.js` vs `.svelte`?](#why-js-vs-svelte)
2. [Architecture Diagram](#architecture-diagram)
3. [Data Flow Diagram](#data-flow-diagram)
4. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
5. [File Reference](#file-reference)
6. [Key Svelte Concepts Used](#key-svelte-concepts-used)

---

## Why `.js` vs `.svelte`?

**The simple rule:**
- **`.svelte`** = Visual components (things you SEE on screen)
- **`.js`** = Logic/data (things you DON'T see - state, utilities, content)

| File Type | Purpose | Contains |
|-----------|---------|----------|
| `.svelte` | UI Components | HTML template + CSS styles + JS logic |
| `.js` (stores) | Shared State | Data that multiple components need |
| `.js` (utils) | Helper Functions | Reusable code (like KaTeX rendering) |
| `.js` (content) | Data | Article text, structure definitions |

### Separation of Concerns

Each file has ONE job:

| File | Responsibility |
|------|----------------|
| `learn.js` store | "What page is active?" (state) |
| `articles.js` | "What content exists?" (data) |
| `katex.js` | "How to render math?" (utility) |
| `LearnLayout.svelte` | "How does the page structure look?" (layout) |
| `LearnSidebar.svelte` | "How does navigation look?" (nav UI) |
| `LearnArticle.svelte` | "How does an article look?" (content UI) |

**Benefits:**
1. **Reusability**: `katex.js` can be used anywhere
2. **Testing**: Can test logic without UI
3. **Maintenance**: Change content in one place, UI in another
4. **Team work**: Designer edits `.svelte`, writer edits `articles.js`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER URL                                     │
│                    http://localhost:3000/#/learn/concepts/awgn              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            App.svelte (Router)                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  handleHashChange() listens to URL                                      │ │
│  │                                                                         │ │
│  │  if hash starts with "#/learn" → isInLearnMode = true                  │ │
│  │  else → show Calculator                                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
        ┌───────────────────┐               ┌───────────────────┐
        │   LEARN MODE      │               │  CALCULATOR MODE  │
        │   (Docs Hub)      │               │  (Original App)   │
        └───────────────────┘               └───────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LearnLayout.svelte                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        HEADER BAR                                     │   │
│  │   📚 Documentation                          [Back to Calculator]     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ┌────────────────┐  ┌──────────────────────────────────────────────────┐   │
│  │                │  │                                                   │   │
│  │ LearnSidebar   │  │              <slot />                            │   │
│  │   .svelte      │  │                                                   │   │
│  │                │  │     (Child content goes here)                    │   │
│  │  🏠 Home       │  │                                                   │   │
│  │  📐 Concepts   │  │     Either LearnHome or LearnArticle             │   │
│  │    └─ AWGN     │  │                                                   │   │
│  │    └─ Error... │  │                                                   │   │
│  │  📖 Tutorials  │  │                                                   │   │
│  │  ⚡ API        │  │                                                   │   │
│  │                │  │                                                   │   │
│  └────────────────┘  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
        ┌───────────────────┐               ┌───────────────────┐
        │  LearnHome.svelte │               │LearnArticle.svelte│
        │  (Landing page)   │               │ (Article content) │
        │                   │               │                   │
        │  Section cards    │               │  KaTeX formulas   │
        │  Quick links      │               │  Code blocks      │
        └───────────────────┘               │  "Try it" buttons │
                                            │  Prev/Next nav    │
                                            └───────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JAVASCRIPT FILES (.js)                            │
│                         (Data & Logic - No UI)                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  stores/learn.js    │     │  content/articles.js│     │  utils/katex.js     │
│                     │     │                     │     │                     │
│  • learnRoute       │     │  • articles = {     │     │  • renderBlockLatex │
│  • routeParts       │     │      concepts: {    │     │  • renderInlineLatex│
│  • sidebarExpanded  │     │        'awgn': {    │     │  • processInlineLatex│
│  • contentIndex     │     │          title,     │     │                     │
│  • navigateToLearn()│     │          sections   │     │  Converts LaTeX     │
│                     │     │        }            │     │  strings to HTML    │
│  Manages WHAT page  │     │      }              │     │                     │
│  user is viewing    │     │    }                │     │                     │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                           │                           │
           │         IMPORTED BY       │                           │
           ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SVELTE FILES (.svelte)                            │
│                            (Visual Components)                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  LearnSidebar.svelte│     │ LearnArticle.svelte │     │ LearnHome.svelte    │
│                     │     │                     │     │                     │
│  import {           │     │  import { articles }│     │  import {           │
│    contentIndex,    │     │  import { render... │     │    contentIndex,    │
│    routeParts,      │     │                     │     │    navigateToLearn  │
│    navigateToLearn  │     │  Uses articles data │     │  }                  │
│  }                  │     │  to render content  │     │                     │
│                     │     │  with KaTeX         │     │  Shows cards for    │
│  Reads contentIndex │     │                     │     │  each section       │
│  to build menu      │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

---

## Phase-by-Phase Implementation

### Phase 1: Create `stores/learn.js` (Route State)

**Concept**: Centralized state management using Svelte stores

**What we built**:
- `learnRoute` - writable store holding current path (e.g., `'concepts/error-exponent'`)
- `routeParts` - derived store that parses route into `{ section, article, isHome }`
- `sidebarExpanded` - tracks which sidebar sections are open
- `contentIndex` - defines the documentation structure (sections → articles)

**Key Svelte concept**:
```javascript
// writable = can be read AND written
export const learnRoute = writable('');

// derived = computed from other stores (read-only)
export const routeParts = derived(learnRoute, ($route) => {
  // ... compute parts from route
});
```

**File**: `src/frontend/stores/learn.js`

---

### Phase 2: Add Hash Routing to `App.svelte`

**Concept**: Client-side routing using URL hash (`#/learn/...`)

**What we built**:
- `handleHashChange()` function that reads `window.location.hash`
- Event listener for `hashchange` event
- `isInLearnMode` variable to toggle between calculator and docs

**Key pattern**:
```javascript
onMount(() => {
  handleHashChange();  // Check on load
  window.addEventListener('hashchange', handleHashChange);
});

onDestroy(() => {
  window.removeEventListener('hashchange', handleHashChange);
});
```

**Why hash routing?** No server changes needed - everything happens in the browser.

**File**: `src/frontend/App.svelte`

---

### Phase 3: Create `LearnLayout` and `LearnSidebar`

**Concept**: Layout components using CSS Flexbox

**LearnLayout structure**:
```
.learn-layout (flex column)
├── .learn-header (sticky top bar)
└── .learn-body (flex row)
    ├── .learn-sidebar (fixed width: 280px)
    └── .learn-content (flex: 1 = take remaining space)
```

**LearnSidebar features**:
- Expandable sections with animated chevrons
- Active state highlighting
- `{#each}` loops over `contentIndex`

**Files**:
- `src/frontend/components/learn/LearnLayout.svelte`
- `src/frontend/components/learn/LearnSidebar.svelte`

---

### Phase 4: Create `LearnHome` Landing Page

**Concept**: CSS Grid for responsive card layouts

**Key CSS**:
```css
.section-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}
```

This creates cards that automatically wrap to fit the screen width.

**File**: `src/frontend/components/learn/LearnHome.svelte`

---

### Phase 5: Update Header Navigation

**Concept**: Single entry point to documentation

**Change**:
- `<a href="/docs" target="_blank">` → `<a href="#/learn">`

Removed `target="_blank"` because it's now internal navigation.

**File**: `src/frontend/components/layout/Header.svelte`

---

### Phase 6: Create `LearnArticle` with KaTeX

**Concept**: Content-driven component with math rendering

**Files created**:
1. `src/frontend/utils/katex.js` - Shared KaTeX utilities
2. `src/frontend/content/articles.js` - Article content (13 articles)
3. `src/frontend/components/learn/LearnArticle.svelte` - Article renderer

**KaTeX usage**:
```svelte
{@html renderBlockLatex("E_0(\\rho) = -\\ln...")}
```

**Section types supported**:
- `heading` - Section headers
- `paragraph` - Text with inline math ($...$)
- `formula` - Block math equations
- `code` - Code blocks with language tag
- `list` - Bulleted lists
- `numbered-list` - Ordered lists
- `note` - Info/warning boxes
- `try-it` - Buttons linking to calculator
- `definitions` - Term/definition pairs
- `image` - Images with captions

---

### Phase 7: Interlink Hover Docs with Articles

**Concept**: Progressive disclosure - quick info → full article

**What we added**:
- `learnMoreUrl` property to relevant `documentationContent` entries
- "📚 Learn More" button in `DocumentationPanel.svelte` footer
- Links hover docs to full articles (e.g., modulation popup → modulation article)

**Pattern**:
```javascript
'modulation-pam': {
  title: 'PAM',
  // ... other fields
  learnMoreUrl: '#/learn/concepts/modulation'  // ← NEW
}
```

**Files**:
- `src/frontend/stores/documentation.js`
- `src/frontend/components/documentation/DocumentationPanel.svelte`

---

## File Reference

### All Files Created/Modified

```
src/frontend/
├── App.svelte                          # Modified: Added hash routing
├── stores/
│   ├── learn.js                        # CREATED: Route state management
│   └── documentation.js                # Modified: Added learnMoreUrl links
├── utils/
│   └── katex.js                        # CREATED: KaTeX rendering utilities
├── content/
│   └── articles.js                     # CREATED: Article content (13 articles)
├── components/
│   ├── layout/
│   │   └── Header.svelte               # Modified: Changed docs link
│   ├── learn/
│   │   ├── LearnLayout.svelte          # CREATED: Main layout
│   │   ├── LearnSidebar.svelte         # CREATED: Navigation sidebar
│   │   ├── LearnHome.svelte            # CREATED: Landing page
│   │   └── LearnArticle.svelte         # CREATED: Article renderer
│   └── documentation/
│       └── DocumentationPanel.svelte   # Modified: Added Learn More button
```

### Import Relationships

```
┌────────────────────────────────────────────────────────────────┐
│                    FILE IMPORT RULES                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  .js imports .js     ✓  (stores can import utils)             │
│  .svelte imports .js ✓  (components use stores/utils)         │
│  .svelte imports .svelte ✓ (components nest components)       │
│  .js imports .svelte ✗  (logic shouldn't know about UI)       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Key Svelte Concepts Used

### 1. Stores (Reactive State)

```javascript
// stores/learn.js
import { writable, derived } from 'svelte/store';

// Writable: can read and write
export const learnRoute = writable('');

// Derived: computed from other stores (read-only)
export const routeParts = derived(learnRoute, ($route) => {
  return parseRoute($route);
});
```

**Usage in components**:
```svelte
<script>
  import { learnRoute, routeParts } from '../stores/learn.js';
</script>

<!-- $ prefix auto-subscribes to store -->
<p>Current route: {$learnRoute}</p>
<p>Section: {$routeParts.section}</p>
```

### 2. Conditional Rendering

```svelte
{#if condition}
  <div>Show when true</div>
{:else if otherCondition}
  <div>Show when other is true</div>
{:else}
  <div>Show when all false</div>
{/if}
```

### 3. Loops

```svelte
{#each items as item, index}
  <div>{index}: {item.name}</div>
{/each}

<!-- With key for better performance -->
{#each items as item (item.id)}
  <div>{item.name}</div>
{/each}
```

### 4. Slots (Content Injection)

```svelte
<!-- LearnLayout.svelte -->
<div class="layout">
  <slot />  <!-- Child content goes here -->
</div>

<!-- Usage -->
<LearnLayout>
  <LearnArticle />  <!-- This goes into the slot -->
</LearnLayout>
```

### 5. Lifecycle Hooks

```javascript
import { onMount, onDestroy } from 'svelte';

onMount(() => {
  // Runs when component is added to DOM
  window.addEventListener('hashchange', handler);
});

onDestroy(() => {
  // Runs when component is removed from DOM
  window.removeEventListener('hashchange', handler);
});
```

### 6. Reactive Declarations

```svelte
<script>
  let count = 0;

  // $: makes this reactive - recalculates when count changes
  $: doubled = count * 2;

  // Can also run statements
  $: console.log('Count changed to', count);

  // With conditions
  $: if (count > 10) {
    alert('Count is high!');
  }
</script>
```

### 7. Event Handling

```svelte
<button on:click={handleClick}>Click me</button>
<button on:click={() => count++}>Increment</button>

<!-- Event modifiers -->
<a href="#/learn" on:click|preventDefault={handleNav}>Link</a>
```

### 8. CSS Scoping

```svelte
<style>
  /* These styles ONLY apply to this component */
  .button {
    color: red;
  }

  /* Use :global() to escape scoping */
  :global(.katex) {
    font-size: 1.2em;
  }
</style>
```

### 9. Raw HTML Rendering

```svelte
<!-- Renders HTML string (use carefully - XSS risk with untrusted content) -->
{@html katexHtmlString}
```

---

## Testing URLs

| Test | URL |
|------|-----|
| Documentation home | `http://localhost:3000/#/learn` |
| AWGN article | `http://localhost:3000/#/learn/concepts/awgn-channel` |
| Error exponent article | `http://localhost:3000/#/learn/concepts/error-exponent` |
| API examples | `http://localhost:3000/#/learn/api/examples` |
| Back to calculator | `http://localhost:3000/` or `http://localhost:3000/#/` |

---

## Adding New Articles

To add a new article:

1. **Add to `contentIndex`** in `stores/learn.js`:
```javascript
tutorials: {
  articles: [
    // ... existing
    { id: 'new-article', title: 'My New Article' }  // Add here
  ]
}
```

2. **Add content** in `content/articles.js`:
```javascript
tutorials: {
  'new-article': {
    title: 'My New Article',
    subtitle: 'A brief description',
    sections: [
      { type: 'paragraph', text: 'Introduction text...' },
      { type: 'formula', latex: 'E = mc^2' },
      // ... more sections
    ]
  }
}
```

3. **Optionally link from hover docs** in `stores/documentation.js`:
```javascript
'some-button': {
  title: '...',
  learnMoreUrl: '#/learn/tutorials/new-article'
}
```

---

*Document created: January 2026*
*EPCalculator v2.0.7*
