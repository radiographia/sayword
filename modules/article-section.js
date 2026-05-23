// modules/article-module.js
import { ShadowModule } from './shadow-module.js';
import './article-section.js';

export class ArticleModule extends ShadowModule {
  constructor() {
    super();
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

    requestAnimationFrame(() => {
      setTimeout(() => this.observe(), 0);
    });
  }

  observe() {
    const sections = this.querySelectorAll('article-section');
    console.log('article-module: observed', sections.length, 'sections');

    if (sections.length === 0) return;

    // ── 1. Автоматическая расстановка якорей в Light DOM ──────────────────
    sections.forEach((sec, index) => {
      // Формируем ID. 
      // ⚠️ См. примечание ниже про префиксы, если на странице несколько модулей!
      const anchorId = String(index + 1); 
      
      // Защита от дублей (если observe() вызовется повторно)
      if (sec.previousElementSibling && sec.previousElementSibling.id === anchorId) {
        return; 
      }

      const anchor = document.createElement('a');
      anchor.id = anchorId;
      anchor.setAttribute('aria-hidden', 'true'); // Скрываем от скринридеров
      
      // Трюк с невидимостью и компенсацией хедера (подробнее ниже)
      Object.assign(anchor.style, {
        display: 'block',
        position: 'relative',
        top: 'var(--header-offset, -60px)', 
        visibility: 'hidden',
        height: '0',
        pointerEvents: 'none'
      });

      // Вставляем в Light DOM прямо перед секцией. 
      // Слот <slot> подхватит его автоматически.
      sec.parentNode.insertBefore(anchor, sec);
    });

    // ── 2. Обработка прямого перехода по ссылке (хешу) ────────────────────
    // Если пользователь зашел по прямой ссылке (site.com/page#3), 
    // браузер не успеет проскроллить к якорю, так как мы создаем их асинхронно.
    if (window.location.hash) {
      const hashId = window.location.hash.substring(1);
      requestAnimationFrame(() => {
        const target = document.getElementById(hashId);
        if (target) {
          target.scrollIntoView({ block: 'start' });
        }
      });
    }

    // ── 3. Intersection Observer для ленивой загрузки ─────────────────────
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const section = entry.target;
          if (typeof section.activate === 'function') {
            console.log('Activate section', section.getAttribute('src'));
            section.activate();
            io.unobserve(section);
          } else {
            console.warn('Section has no activate()', section);
          }
        }
      });
    }, { rootMargin: '200px' });

    sections.forEach(sec => io.observe(sec));
  }
}

if (!customElements.get('article-module')) {
  customElements.define('article-module', ArticleModule);
}
