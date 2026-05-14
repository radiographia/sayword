// modules/article-module.js
import { ShadowModule } from './shadow-module.js';
import './article-section.js';

export class ArticleModule extends ShadowModule {

  constructor() {
    super();
    // Используем метод базового класса для стилей
    this.setStyles(`
      :host {
        display: block;
      }
    `);
  }

  connectedCallback() {
    super.connectedCallback(); // Вызываем метод родителя
    
    // Отрисовка слота
    this.shadowRoot.innerHTML = `<slot></slot>`;

    // Запускаем наблюдение после рендера
    // requestAnimationFrame гарантирует, что дети уже в DOM
    requestAnimationFrame(() => this.observe());
  }

  observe() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && e.target.activate) {
          e.target.activate();
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '200px' });

    // Ищем элементы внутри себя (this)
    this.querySelectorAll('article-section').forEach(sec => io.observe(sec));
  }
}

customElements.define('article-module', ArticleModule);