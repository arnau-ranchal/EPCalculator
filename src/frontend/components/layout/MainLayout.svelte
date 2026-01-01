<script>
  import Header from './Header.svelte';
  import Footer from './Footer.svelte';

  export let title = 'EPCalculator v2';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content="Error Probability Calculator for Digital Transmission Systems - Modern web implementation with interactive plotting and real-time calculations">
  <meta name="keywords" content="error probability, digital transmission, modulation, PAM, PSK, QAM, information theory">
  <meta name="author" content="EPCalculator Team">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">

  <!-- Open Graph -->
  <meta property="og:title" content={title}>
  <meta property="og:description" content="Error Probability Calculator for Digital Transmission Systems">
  <meta property="og:type" content="website">

  <!-- Preload critical fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">
</svelte:head>

<div class="app-layout">
  <Header />

  <main class="main-content" role="main">
    <div class="content-wrapper">
      <slot />
    </div>
  </main>

  <Footer />
</div>

<style>
  .app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--background-color);
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-xl) 0;
    background: linear-gradient(
      to bottom,
      rgba(200, 16, 46, 0.02) 0%,
      transparent 10%,
      transparent 90%,
      rgba(0, 0, 0, 0.02) 100%
    );
  }

  .content-wrapper {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  @media (max-width: 1100px) {
    .content-wrapper {
      max-width: 100%;
      padding: 0 var(--spacing-md);
    }
  }

  @media (max-width: 768px) {
    .main-content {
      padding: var(--spacing-lg) 0;
    }

    .content-wrapper {
      padding: 0 var(--spacing-sm);
      gap: var(--spacing-lg);
    }
  }

  /* Loading state */
  .content-wrapper:empty::before {
    content: '';
    display: block;
    width: 100%;
    height: 200px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(200, 16, 46, 0.1),
      transparent
    );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 8px;
  }

  @keyframes loading {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .content-wrapper:empty::before {
      animation: none;
    }
  }

  /* Print styles */
  @media print {
    .app-layout {
      background: white;
    }

    .main-content {
      background: none;
      padding: 0;
    }
  }
</style>