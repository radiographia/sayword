// modules/article-module.js
import { ShadowModule } from './shadow-module.js';
import './article-section.js';

export class ArticleModule extends ShadowModule {
  constructor() {
    super();
    this._io          = null;
    this._onHashChange = null;
    this._onLinkClick  = null;

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

    // ── Перехват кликов по якорным ссылкам ──────────────────────────────
    // Проблема: <base href="/sayword/"> резолвит href="#2" как /sayword/#2
    // вместо /sayword/home#2 — путь меняется, хэш теряется.
    // Решение: перехватываем клик, обновляем URL вручную через pushState.
    this._onLinkClick = (e) => {
      // composedPath() проникает сквозь shadow DOM boundary —
      // находим реальный <a> даже если клик был внутри article-section
      const link = e.composedPath().find(
        el => el instanceof HTMLAnchorElement
           && el.getAttribute('href')?.startsWith('#')
      );
      if (!link) return;

      e.preventDefault();
      const hash = link.getAttribute('href'); // "#2"

      // Сохраняем текущий путь, меняем только хэш
      history.pushState(null, '', location.pathname + hash);

      // pushState не стреляет hashchange — вызываем вручную
      this._handleHash([...this.querySelectorAll('article-section')]);
    };
    this.addEventListener('click', this._onLinkClick);

    // Навигация кнопками браузера (назад/вперёд по хэшам)
    this._onHashChange = () => {
      this._handleHash([...this.querySelectorAll('article-section')]);
    };
    window.addEventListener('hashchange', this._onHashChange);
  }

  disconnectedCallback() {
    this._io?.disconnect();
    this._io = null;
    this.removeEventListener('click', this._onLinkClick);
    window.removeEventListener('hashchange', this._onHashChange);
  }

  observe() {
    if (!this.isConnected) return;

    const sections = [...this.querySelectorAll('article-section')];
    console.log('article-module: observed', sections.length, 'sections');
    if (sections.length === 0) return;

    // ── id и scroll-margin прямо на элемент секции ───────────────────────
    sections.forEach((sec, i) => {
      sec.id = String(i + 1);
      sec.style.scrollMarginTop = 'var(--header-offset, 60px)';
    });

    // ── IntersectionObserver: ленивая активация ──────────────────────────
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

    // ── Хэш при первой загрузке страницы ────────────────────────────────
    this._handleHash(sections);
  }

// Было: #2  →  Стало: #dev/2
// Парсим секцию из второй части: "dev/2".split('/')[1] = "2"
async _handleHash(sections) {
  const hash  = location.hash.slice(1);       // "dev/2" или "dev"
  const parts = hash.split('/');
  const num   = parts[1] ?? parts[0];         // берём секцию где есть
  const targetIndex = parseInt(num, 10) - 1;

  if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= sections.length) return;

  const target = sections[targetIndex];

  await Promise.all(
    sections.slice(0, targetIndex + 1).map(sec =>
      typeof sec.activate === 'function' ? sec.activate() : Promise.resolve()
    )
  );

  target.scrollIntoView({ behavior: 'instant', block: 'start' });
}

// Клик по <a href="#2"> → обновляем hash как "#dev/2"
this._onLinkClick = (e) => {
  const link = e.composedPath().find(
    el => el instanceof HTMLAnchorElement
       && el.getAttribute('href')?.startsWith('#')
  );
  if (!link) return;
  e.preventDefault();

  const sectionNum = link.getAttribute('href').slice(1); // "2"
  const currentPage = location.hash.slice(1).split('/')[0]; // "dev"

  // Обновляем hash: "#dev/2" — стреляет hashchange
  location.hash = currentPage + '/' + sectionNum;
};

  
}

if (!customElements.get('article-module')) {
  customElements.define('article-module', ArticleModule);
}
