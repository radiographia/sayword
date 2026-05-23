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

customElements.define('article-module', ArticleModule);
