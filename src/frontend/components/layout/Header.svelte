<script>
  import { version } from '../../../../package.json';
  import { _, locale } from 'svelte-i18n';
  import LanguageSelector from './LanguageSelector.svelte';
  import ThemeSelector from './ThemeSelector.svelte';

  // Check if current locale is Klingon for space theme
  $: isKlingon = $locale === 'tlh';
  // Check if current locale is Pirate for ocean theme
  $: isPirate = $locale === 'en-pirate';
</script>

<header class="header" class:space-theme={isKlingon} class:pirate-theme={isPirate}>
  <div class="header-content">
    <div class="logo-section">
      <h1 class="logo">EPCalculator</h1>
      <span class="version">v{version}</span>
    </div>

    <div class="header-info">
      <p class="tagline">{$_('app.tagline')}</p>
    </div>

    <div class="links">
      <a href="https://github.com/arnau-ranchal/EPCalculator" target="_blank" rel="noopener noreferrer">
        {$_('nav.github')}
      </a>
      <a href="/docs" target="_blank" rel="noopener noreferrer">
        {$_('nav.documentation')}
      </a>
      <ThemeSelector />
      <LanguageSelector />
    </div>
  </div>
</header>

<style>
  .header {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
    color: white;
    padding: var(--spacing-lg) 0;
    box-shadow: var(--shadow-md);
    position: relative;
    transition: background 0.5s ease;
  }

  /* Klingon space theme */
  .header.space-theme {
    background: linear-gradient(135deg, #0a0a2e 0%, #16213e 50%, #1a1a4e 100%);
  }

  .header.space-theme::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(2px 2px at 20px 15px, white, transparent),
      radial-gradient(2px 2px at 40px 35px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 90px 20px, white, transparent),
      radial-gradient(2px 2px at 130px 40px, rgba(255,255,255,0.9), transparent),
      radial-gradient(1px 1px at 160px 10px, white, transparent),
      radial-gradient(2px 2px at 200px 30px, rgba(255,255,255,0.7), transparent),
      radial-gradient(1px 1px at 250px 5px, white, transparent),
      radial-gradient(2px 2px at 300px 25px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 350px 15px, white, transparent),
      radial-gradient(2px 2px at 400px 35px, rgba(255,255,255,0.9), transparent),
      radial-gradient(1px 1px at 450px 8px, white, transparent),
      radial-gradient(2px 2px at 500px 22px, white, transparent),
      radial-gradient(1px 1px at 550px 40px, rgba(255,255,255,0.8), transparent),
      radial-gradient(2px 2px at 600px 12px, white, transparent),
      radial-gradient(1px 1px at 650px 28px, rgba(255,255,255,0.7), transparent),
      radial-gradient(2px 2px at 700px 18px, white, transparent),
      radial-gradient(1px 1px at 750px 32px, rgba(255,255,255,0.9), transparent),
      radial-gradient(2px 2px at 800px 10px, white, transparent),
      radial-gradient(1px 1px at 850px 38px, white, transparent),
      radial-gradient(2px 2px at 900px 20px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 950px 30px, white, transparent),
      radial-gradient(2px 2px at 1000px 15px, rgba(255,255,255,0.9), transparent),
      radial-gradient(1px 1px at 1050px 25px, white, transparent),
      radial-gradient(2px 2px at 1100px 8px, white, transparent),
      radial-gradient(1px 1px at 1150px 35px, rgba(255,255,255,0.7), transparent),
      radial-gradient(3px 3px at 100px 25px, rgba(255,255,200,0.9), transparent),
      radial-gradient(3px 3px at 500px 15px, rgba(200,220,255,0.9), transparent),
      radial-gradient(3px 3px at 900px 30px, rgba(255,200,200,0.8), transparent);
    background-repeat: repeat-x;
    background-size: 1200px 100%;
    animation: twinkle 4s ease-in-out infinite alternate;
    pointer-events: none;
    z-index: 0;
  }

  .header.space-theme .header-content {
    position: relative;
    z-index: 1;
  }

  @keyframes twinkle {
    0% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  /* Pirate ocean theme */
  .header.pirate-theme {
    background: linear-gradient(180deg, #1a3a4a 0%, #0d5c75 40%, #0a4d63 100%);
  }

  .header.pirate-theme::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 200%;
    height: 25px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,20 C150,80 350,20 500,50 C650,80 850,20 1000,50 C1150,80 1350,20 1500,50 L1500,120 L0,120 Z' fill='%230d6986'/%3E%3C/svg%3E");
    background-repeat: repeat-x;
    background-size: 600px 100%;
    animation: wave 8s linear infinite;
    pointer-events: none;
    z-index: 0;
  }

  .header.pirate-theme::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 200%;
    height: 18px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,40 C150,90 350,40 500,70 C650,100 850,40 1000,70 C1150,100 1350,40 1500,70 L1500,120 L0,120 Z' fill='%23085a73'/%3E%3C/svg%3E");
    background-repeat: repeat-x;
    background-size: 600px 100%;
    animation: wave 6s linear infinite reverse;
    pointer-events: none;
    z-index: 0;
  }

  .header.pirate-theme .header-content {
    position: relative;
    z-index: 3;
  }

  @keyframes wave {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .logo {
    font-size: var(--font-size-xxl);
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .version {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 8px;
    border-radius: 12px;
    font-size: var(--font-size-sm);
    font-weight: 600;
  }

  .header-info {
    flex: 1;
    text-align: center;
    max-width: 400px;
  }

  .tagline {
    margin: 0;
    font-size: var(--font-size-base);
    opacity: 0.9;
    font-weight: 400;
  }

  .links {
    display: flex;
    gap: var(--spacing-md);
  }

  .links a {
    color: white;
    text-decoration: none;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    transition: all var(--transition-fast);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .links a:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      text-align: center;
      gap: var(--spacing-sm);
    }

    .logo {
      font-size: var(--font-size-xl);
    }

    .header-info {
      max-width: none;
    }

    .tagline {
      font-size: var(--font-size-sm);
    }

    .links {
      justify-content: center;
      gap: var(--spacing-sm);
    }
  }
</style>