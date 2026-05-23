// modules/article-module.js
import { ShadowModule } from './shadow-module.js';
import './article-section.js';

export class ArticleModule extends ShadowModule {
  constructor() {
    super();
    this._io         = null;
    this._onHashChange = null;

    this.setStyles(`
      :host {
        display: block;
      }
    `);
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.shadowRoot.querySelector('slot')) {
      this.shadowRoot.appendChild(document.createElement('slot'));
    }

    customElements.whenDefined('article-section').then(() => {
      this.querySelectorAll('article-section').forEach(el => {
        customElements.upgrade(el);
      });
      this.observe();
    });

    this._onHashChange = () => {
      const sections = [...this.querySelectorAll('article-section')];
      this._handleHash(sections);
    };
    window.addEventListener('hashchange', this._onHashChange);
  }

  disconnectedCallback() {
    this._io?.disconnect();
    this._io = null;
    window.removeEventListener('hashchange', this._onHashChange);
    this._onHashChange = null;
  }

  observe() {
    if (!this.isConnected) return;

    const sections = [...this.querySelectorAll('article-section')];
    console.log('article-module: observed', sections.length, 'sections');
    if (sections.length === 0) return;

    // ── id и scroll-margin прямо на элемент секции ───────────────────────
    // Не нужны отдельные якорные элементы — браузер найдёт секцию по id
    sections.forEach((sec, i) => {
      sec.id = String(i + 1);
      // Компенсация высоты sticky-хедера при нативном скролле браузера
      sec.style.scrollMarginTop = 'var(--header-offset, 60px)';
    });

    // ── IntersectionObserver: ленивая активация секций ───────────────────
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

    // ── Обработка хэша при первой загрузке ──────────────────────────────
    this._handleHash(sections);
  }

  async _handleHash(sections) {
    const hash = window.location.hash.slice(1); // "3" из "#3"
    if (!hash) return;

    const targetIndex = parseInt(hash, 10) - 1;
    if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= sections.length) return;

    const target = sections[targetIndex];

    // Активируем все секции от первой до целевой включительно —
    // пока они не загружены, их высота нестабильна и скролл попадёт мимо
    const toActivate = sections.slice(0, targetIndex + 1);

    await Promise.all(
      toActivate.map(sec =>
        typeof sec.activate === 'function'
          ? sec.activate()
          : Promise.resolve()
      )
    );

    // Высоты секций теперь стабильны — скроллим точно
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
}

if (!customElements.get('article-module')) {
  customElements.define('article-module', ArticleModule);
}
