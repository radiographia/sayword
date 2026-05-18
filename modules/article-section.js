// modules/article-section.js
import { LazyModule } from './lazy-module.js';

export class ArticleSection extends LazyModule {
  constructor() {
    super();
    this.setStyles(`
      :host {
        display: block;
        min-height: 100vh;
        border-bottom: 1px solid var(--border-color);
      }
      .placeholder {
        color: var(--text-color);
        opacity: 0.5;
        padding: 20px;
      }
    `);
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._activated) return;

    this.shadowRoot.innerHTML = `
      <div class="placeholder">Section placeholder...</div>
    `;
  }

async onActivate() {
  const src = this.getAttribute('src');
  if (!src) return;

  const baseEl = document.querySelector('base');
  const base = baseEl ? baseEl.getAttribute('href') : '/';
  const cleanSrc = src.replace(/^\//, '');
  const fullUrl = base + cleanSrc;
  console.log('Fetching', fullUrl);

  try {
    const response = await fetch(fullUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!this.isConnected) return;

    // Парсим HTML-фрагмент
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    // Поднимаем <link rel="stylesheet"> в document.head
    // (шрифты — глобальный ресурс, они работают в Shadow DOM только так)
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !document.querySelector(`link[href="${href}"]`)) {
        document.head.appendChild(link.cloneNode(true));
      }
    });

    this.shadowRoot.innerHTML = `<article>${text}</article>`;
  } catch (e) {
    this.shadowRoot.innerHTML = `
      <div style="color: var(--accent-color);">Ошибка загрузки: ${e.message}</div>
    `;
  }
}
}

customElements.define('article-section', ArticleSection);
