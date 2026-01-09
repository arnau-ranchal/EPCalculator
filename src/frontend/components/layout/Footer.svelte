<script>
  import { _ } from 'svelte-i18n';
  import PreferencesModal from './PreferencesModal.svelte';

  const currentYear = new Date().getFullYear();
  let preferencesOpen = false;

  function openPreferences(event) {
    event.preventDefault();
    preferencesOpen = true;
  }
</script>

<footer class="footer">
  <div class="footer-content">
    <div class="footer-section">
      <h4>{$_('footer.title')}</h4>
      <p>{$_('footer.description')}</p>
    </div>

    <div class="footer-section">
      <h4>{$_('footer.features')}</h4>
      <ul>
        <li>{$_('footer.featureModulation')}</li>
        <li>{$_('footer.featurePlotting')}</li>
        <li>{$_('footer.featureOptimization')}</li>
        <li>{$_('footer.featureExport')}</li>
      </ul>
    </div>

    <div class="footer-section">
      <h4>{$_('footer.technicalDetails')}</h4>
      <ul>
        <li>{$_('footer.techGallager')}</li>
        <li>{$_('footer.techHermite')}</li>
        <li>{$_('footer.techGradient')}</li>
        <li>{$_('footer.techWasm')}</li>
      </ul>
    </div>

    <div class="footer-section">
      <h4>{$_('footer.resources')}</h4>
      <ul>
        <li><a href="/docs" target="_blank">{$_('footer.documentation')}</a></li>
        <li><a href="/api" target="_blank">{$_('footer.apiReference')}</a></li>
        <li><a href="https://github.com/arnau-ranchal/EPCalculator" target="_blank">{$_('footer.sourceCode')}</a></li>
        <li><a href="/examples" target="_blank">{$_('footer.examples')}</a></li>
        <li><a href="#preferences" on:click={openPreferences}>{$_('footer.preferences')}</a></li>
      </ul>
    </div>
  </div>

  <div class="footer-bottom">
    <div class="footer-bottom-content">
      <p>&copy; {currentYear} {$_('footer.copyright')}</p>
      <div class="tech-stack">
        <span>Svelte</span>
        <span>Observable Plot</span>
        <span>Fastify</span>
        <span>WebAssembly</span>
      </div>
    </div>
  </div>
</footer>

<PreferencesModal bind:isOpen={preferencesOpen} />

<style>
  .footer {
    background: #1a1a1a;
    color: #e5e5e5;
    margin-top: auto;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-lg);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-xl);
  }

  .footer-section h4 {
    color: white;
    margin-bottom: var(--spacing-md);
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  .footer-section p {
    margin: 0;
    line-height: 1.6;
    color: #b8b8b8;
  }

  .footer-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .footer-section li {
    margin-bottom: 8px;
    color: #b8b8b8;
  }

  .footer-section a {
    color: #b8b8b8;
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .footer-section a:hover {
    color: var(--primary-color);
  }

  .footer-bottom {
    border-top: 1px solid #333;
    background: #0f0f0f;
  }

  .footer-bottom-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
  }

  .footer-bottom p {
    margin: 0;
    color: #888;
    font-size: var(--font-size-sm);
  }

  .tech-stack {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .tech-stack span {
    background: #333;
    color: #e5e5e5;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .footer-content {
      grid-template-columns: 1fr;
      padding: var(--spacing-lg);
      gap: var(--spacing-lg);
    }

    .footer-bottom-content {
      flex-direction: column;
      text-align: center;
      gap: var(--spacing-sm);
    }

    .tech-stack {
      justify-content: center;
    }
  }
</style>
