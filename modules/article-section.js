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

    // ── Парсим HTML-фрагмент ──────────────────────────────────────────────
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    // ── 1. Внешние стили и шрифты → document.head ────────────────────────
    // @font-face и внешние CSS работают в Shadow DOM только если
    // загружены на уровне документа
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !document.querySelector(`link[href="${href}"]`)) {
        document.head.appendChild(link.cloneNode(true));
      }
    });

    // ── 2. Собираем все скрипты в порядке документа ───────────────────────
    // До того как вставим HTML: браузер всё равно не выполнит скрипты
    // через innerHTML, но мы удаляем их для чистоты разметки
    const scripts = [...doc.querySelectorAll('script')];
    scripts.forEach(s => s.remove());

    // ── 3. Рендерим визуальный контент (без скриптов) ─────────────────────
    this.shadowRoot.innerHTML = `<article>${doc.body.innerHTML}</article>`;

    // ── 4. Helpers ────────────────────────────────────────────────────────

    // Загружает внешний скрипт, возвращает Promise
    // Пропускает если такой src уже есть в документе (дедупликация)
    const hoistExternalScript = (original) => {
      const scriptSrc = original.getAttribute('src');

      if (document.querySelector(`script[src="${scriptSrc}"]`)) {
        return Promise.resolve(); // уже загружен
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptSrc;

        // Пробрасываем значимые атрибуты оригинала
        for (const attr of ['type', 'crossorigin', 'integrity', 'referrerpolicy']) {
          if (original.hasAttribute(attr)) {
            script.setAttribute(attr, original.getAttribute(attr));
          }
        }

        script.onload = resolve;
        script.onerror = () => reject(new Error(`Не удалось загрузить скрипт: ${scriptSrc}`));
        document.head.appendChild(script);
      });
    };

    // Выполняет инлайн-скрипт синхронно через вставку в DOM
    // (единственный способ выполнить код, минуя ограничения innerHTML)
    const executeInlineScript = (original) => {
      const script = document.createElement('script');

      if (original.hasAttribute('type')) {
        script.type = original.getAttribute('type');
      }

      script.textContent = original.textContent;
      document.head.appendChild(script);
      document.head.removeChild(script); // код выполнен, узел больше не нужен
    };

    // ── 5. Выполняем скрипты строго последовательно ───────────────────────
    // Порядок важен: скрипты могут зависеть друг от друга
    // (например, инлайн-код использует функции из внешней библиотеки)
    for (const script of scripts) {
      // Пропускаем пустые инлайн-теги
      if (!script.hasAttribute('src') && !script.textContent.trim()) continue;

      try {
        if (script.hasAttribute('src')) {
          await hoistExternalScript(script);  // ждём загрузки
        } else {
          executeInlineScript(script);        // синхронно
        }
      } catch (e) {
        // Не прерываем цепочку — остальные скрипты секции должны выполниться
        console.warn('[ArticleSection] Ошибка скрипта:', e.message);
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
