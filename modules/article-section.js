// modules/article-module.js
import { ShadowModule } from './shadow-module.js';
import './article-section.js';

export class ArticleModule extends ShadowModule {
  constructor() {
    super();
    this._io = null; // храним ссылку для последующего disconnect

    this.setStyles(`
      :host {
        display: block;
      }
    `);
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.shadowRoot.querySelector('slot')) {
      const slot = document.createElement('slot');
      this.shadowRoot.appendChild(slot);
    }

    // Одной задержки достаточно
    setTimeout(() => this.observe(), 0);
  }

  disconnectedCallback() {
    // Фиксируем Баг 5: чистим observer при удалении из DOM
    this._io?.disconnect();
    this._io = null;
  }

  observe() {
    // Фиксируем Баг 4: не работаем на отсоединённом элементе
    if (!this.isConnected) return;

    const sections = this.querySelectorAll('article-section');
    console.log('article-module: observed', sections.length, 'sections');
    if (sections.length === 0) return;

    // ── Якоря в Light DOM ───────────────────────────────────────────────
    sections.forEach((sec, index) => {
      // Фиксируем Баг 3: проверяем по data-атрибуту, а не по id
      if (sec.previousElementSibling?.dataset.sectionAnchor) return;

      const anchor = document.createElement('a');
      anchor.id = String(index + 1);
      anchor.dataset.sectionAnchor = 'true'; // маркер для проверки дублей
      anchor.setAttribute('aria-hidden', 'true');

      Object.assign(anchor.style, {
        display:       'block',
        position:      'relative',
        top:           'var(--header-offset, -60px)',
        height:        '0',
        visibility:    'hidden',
        pointerEvents: 'none',
      });

      sec.parentNode.insertBefore(anchor, sec);
    });

    // ── IntersectionObserver ────────────────────────────────────────────
    // Фиксируем Баг 1 и Баг 2: отключаем старый, сохраняем новый
    this._io?.disconnect();
    this._io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const section = entry.target;
        if (typeof section.activate === 'function') {
          console.log('Activate section', section.getAttribute('src'));
          section.activate();
          this._io.unobserve(section);
        } else {
          console.warn('Section has no activate()', section);
        }
      });
    }, { rootMargin: '200px' });

    sections.forEach(sec => this._io.observe(sec));
  }
}

if (!customElements.get('article-module')) {
  customElements.define('article-module', ArticleModule);
}
