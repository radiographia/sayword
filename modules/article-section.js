// modules/article-section.js
import { LazyModule } from './lazy-module.js';

export class ArticleSection extends LazyModule {
  
  constructor() {
    super();
    // Стили с CSS-переменными для поддержки темы
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
    super.connectedCallback(); // Обязательный вызов super
    
    if (this._activated) return;

    this.shadowRoot.innerHTML = `
      <div class="placeholder">Section placeholder...</div>
    `;
  }

  async onActivate() {
    const src = this.getAttribute('src');
    if (!src) return;

    try {
      const md = await fetch(src).then(r => r.text());
      if (!this.isConnected) return;

      // Заменяем контент
      this.shadowRoot.innerHTML = `<article>${md}</article>`;
      
    } catch (e) {
      this.shadowRoot.innerHTML = `<div style="color: var(--accent-color);">Error loading content</div>`;
    }
  }
}

customElements.define('article-section', ArticleSection);