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

    // Безопасно добавляем слот, не затирая shadowRoot
    if (!this.shadowRoot.querySelector('slot')) {
      const slot = document.createElement('slot');
      this.shadowRoot.appendChild(slot);
    }

    requestAnimationFrame(() => {
      // Небольшая задержка для полной уверенности, что дочерние элементы в DOM
      setTimeout(() => this.observe(), 0);
    });
  }

  observe() {
    const sections = this.querySelectorAll('article-section');
    console.log('article-module: observed', sections.length, 'sections');

    if (sections.length === 0) return;

    // ── Точечное внедрение якорей в Light DOM ───────────────────────────
    sections.forEach((sec, index) => {
      const anchorId = String(index + 1);
      
      // Защита от дублей, если observe() вызовётся повторно
      if (sec.previousElementSibling?.id === anchorId) return;

      const anchor = document.createElement('a');
      anchor.id = anchorId;
      
      // Скрываем визуально, но оставляем в потоке для нативного скролла браузера
      Object.assign(anchor.style, {
        display: 'block',
        position: 'relative',
        top: 'var(--header-offset, -60px)', // Компенсация высоты sticky-хедера
        height: '0',
        visibility: 'hidden',
        pointerEvents: 'none'
      });
      anchor.setAttribute('aria-hidden', 'true');

      // Вставляем в Light DOM прямо перед секцией (слот подхватит автоматически)
      sec.parentNode.insertBefore(anchor, sec);
    });
    // ─────────────────────────────────────────────────────────────────────

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

// ── Защита от ошибки "already been used with this registry" ─────────────
if (!customElements.get('article-module')) {
  customElements.define('article-module', ArticleModule);
}
