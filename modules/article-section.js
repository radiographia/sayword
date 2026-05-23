import { LazyModule } from './lazy-module.js';
// Настоятельно рекомендуется: import DOMPurify from 'dompurify';

export class ArticleSection extends LazyModule {
  constructor() {
    super();
    this.setStyles(`
      :host {
        display: block;
        min-height: 100vh;
        border-bottom: 1px solid var(--border-color);
      }
      .placeholder, .error {
        color: var(--text-color);
        padding: 20px;
      }
      .error { color: var(--accent-color, red); }
    `);

    // Контейнер для контента, чтобы не затирать базовые стили
    this._container = document.createElement('div');
    this.shadowRoot.appendChild(this._container);
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._activated) return;
    this._container.innerHTML = `<div class="placeholder">Section placeholder...</div>`;
  }

  // Очистка ресурсов при удалении компонента из DOM (Критично для SPA!)
  disconnectedCallback() {
    super.disconnectedCallback?.();
    // Удаляем все внешние стили, которые были инжектированы этой статьей
    document.querySelectorAll('link[data-article-style]').forEach(el => el.remove());
  }

  async onActivate() {
    const src = this.getAttribute('src');
    if (!src) return;

    // 1. Безопасное формирование URL с учетом <base href="...">
    let fullUrl;
    try {
      fullUrl = new URL(src, document.baseURI).href;
    } catch (e) {
      this._renderError('Некорректный URL статьи');
      return;
    }

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      if (!this.isConnected) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      // Helper: Резолвинг относительных путей статьи к абсолютным
      const resolveUrl = (relativeUrl) => {
        try { return new URL(relativeUrl, fullUrl).href; } 
        catch { return relativeUrl; }
      };

      // Очистка старых динамических стилей внутри Shadow DOM (защита от дублей)
      this.shadowRoot.querySelectorAll('style[data-article-style]').forEach(el => el.remove());

      // ── 1. Внешние шрифты и стили → document.head ──────────────────────
      doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        const absoluteHref = resolveUrl(href);
        
        // Проверяем дубликаты по абсолютному пути
        if (!document.querySelector(`link[href="${absoluteHref}"]`)) {
          const newLink = link.cloneNode(true);
          newLink.href = absoluteHref;
          newLink.setAttribute('data-article-style', 'true'); // Маркер для очистки
          document.head.appendChild(newLink);
        }
      });

      // ── 2. Инлайн-стили: инкапсуляция в Shadow DOM ─────────────────────
      doc.querySelectorAll('style').forEach(style => {
        const el = document.createElement('style');
        el.setAttribute('data-article-style', 'true'); // Маркер
        // Базовая замена body/root на :host
        el.textContent = style.textContent
          .replace(/(^|[\s,{])body(?=[\s,{])/g, '$1:host')
          .replace(/(^|[\s,{]):root(?=[\s,{])/g, '$1:host');
        this.shadowRoot.appendChild(el);
        style.remove(); 
      });

      // ── 3. Скрипты ─────────────────────────────────────────────────────
      const scripts = [...doc.querySelectorAll('script')];
      scripts.forEach(s => s.remove());

      // ── 4. Рендерим контент ────────────────────────────────────────────
      // ВНИМАНИЕ: Для защиты от XSS используйте DOMPurify.sanitize(doc.body.innerHTML)
      this._container.innerHTML = `<article>${doc.body.innerHTML}</article>`;

      // ── Helpers ────────────────────────────────────────────────────────
      const hoistExternalScript = async (original) => {
        const scriptSrc = original.getAttribute('src');
        if (!scriptSrc) return;
        const absoluteSrc = resolveUrl(scriptSrc);

        if (document.querySelector(`script[src="${absoluteSrc}"]`)) return;

        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = absoluteSrc;
          for (const attr of ['type', 'crossorigin', 'integrity', 'referrerpolicy']) {
            if (original.hasAttribute(attr)) script.setAttribute(attr, original.getAttribute(attr));
          }
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Не удалось загрузить: ${absoluteSrc}`));
          document.head.appendChild(script);
        });
      };

      const executeInlineScript = (original) => {
        const script = document.createElement('script');
        if (original.hasAttribute('type')) script.type = original.getAttribute('type');
        script.textContent = original.textContent;
        // Добавление в head вызывает синхронное выполнение
        document.head.appendChild(script);
        // Мгновенное удаление безопасно, так как инлайн-код уже выполнен
        document.head.removeChild(script);
      };

      // ── 5. Строгий порядок выполнения скриптов ─────────────────────────
      for (const script of scripts) {
        if (!this.isConnected) return; // Прерываем, если компонент уничтожили
        if (!script.hasAttribute('src') && !script.textContent.trim()) continue;
        
        try {
          if (script.hasAttribute('src')) {
            await hoistExternalScript(script);
          } else {
            executeInlineScript(script);
          }
        } catch (e) {
          console.warn('[ArticleSection] Ошибка скрипта:', e.message);
        }
      }

      // ── 6. MathJax: явный типсет для Shadow DOM ────────────────────────
      if (window.MathJax?.typesetPromise) {
        await window.MathJax.typesetPromise([this._container]);
      }

    } catch (e) {
      this._renderError(e.message);
    }
  }

  _renderError(message) {
    if (!this.isConnected) return;
    this._container.innerHTML = `<div class="error">Ошибка загрузки: ${message}</div>`;
  }
}

customElements.define('article-section', ArticleSection);
