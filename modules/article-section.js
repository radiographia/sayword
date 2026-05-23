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

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    // ── 1. Внешние стили и шрифты → document.head ────────────────────────
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !document.querySelector(`link[href="${href}"]`)) {
        document.head.appendChild(link.cloneNode(true));
      }
    });

    // ── 2. Собираем скрипты, удаляем из doc ──────────────────────────────
    const scripts = [...doc.querySelectorAll('script')];
    scripts.forEach(s => s.remove());

    // ── 3. Рендерим контент ───────────────────────────────────────────────
    this.shadowRoot.innerHTML = `<article>${doc.body.innerHTML}</article>`;

    // ── Helpers ───────────────────────────────────────────────────────────
    const hoistExternalScript = (original) => {
      const scriptSrc = original.getAttribute('src');
      if (document.querySelector(`script[src="${scriptSrc}"]`)) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptSrc;
        for (const attr of ['type', 'crossorigin', 'integrity', 'referrerpolicy']) {
          if (original.hasAttribute(attr)) script.setAttribute(attr, original.getAttribute(attr));
        }
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Не удалось загрузить: ${scriptSrc}`));
        document.head.appendChild(script);
      });
    };

    const executeInlineScript = (original) => {
      const script = document.createElement('script');
      if (original.hasAttribute('type')) script.type = original.getAttribute('type');
      script.textContent = original.textContent;
      document.head.appendChild(script);
      document.head.removeChild(script);
    };

    // ── 4. Инлайн-конфиги ПЕРВЫМИ (window.MathJax, window.hljs и т.п.) ──
    for (const script of scripts.filter(s => !s.hasAttribute('src'))) {
      if (!script.textContent.trim()) continue;
      try {
        executeInlineScript(script);
      } catch (e) {
        console.warn('[ArticleSection] Ошибка конфиг-скрипта:', e.message);
      }
    }

    // ── 5. Внешние библиотеки ПОСЛЕ конфигов ─────────────────────────────
    for (const script of scripts.filter(s => s.hasAttribute('src'))) {
      try {
        await hoistExternalScript(script);
      } catch (e) {
        console.warn('[ArticleSection] Ошибка загрузки скрипта:', e.message);
      }
    }

  } catch (e) {
    this.shadowRoot.innerHTML = `
      <div style="color: var(--accent-color);">Ошибка загрузки: ${e.message}</div>
    `;
  }
}

  
}

customElements.define('article-section', ArticleSection);
