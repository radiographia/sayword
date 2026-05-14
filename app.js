// \www\app.js
import './modules/article-module.js';
import './modules/article-section.js';
// 1. Импортируем контроллер темы и общую таблицу стилей
import { globalThemeSheet, initTheme, applyTheme } from './modules/theme-controller.js';

class PortalShell extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // 2. Подключаем глобальную таблицу стилей с переменными
    // Использование adoptedStyleSheets позволяет обновлять тему во всех компонентах сразу
    this.shadowRoot.adoptedStyleSheets = [globalThemeSheet];

    this.shadowRoot.innerHTML = `
      <style>
        /* Основные стили теперь используют переменные */
        :host {
          display: block;
          min-height: 100vh;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: var(--bg-color);
          color: var(--text-color);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* --- Header --- */
        header {
          display: flex;
          align-items: center;
          justify-content: space-between; /* Раздвигаем логотип и кнопку */
          padding: 20px;
          background-color: var(--header-bg);
          border-bottom: 1px solid var(--border-color);
          gap: 15px;
        }
        
        .header-group {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        header img {
          height: 40px;
          width: auto;
          border-radius: 4px;
        }

        header h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 300;
          color: var(--text-color);
          text-transform: uppercase;
          letter-spacing: 3px;
        }

        /* --- Theme Switcher --- */
        #theme-switcher {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-color);
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        #theme-switcher:hover {
          background-color: var(--accent-color);
          color: #fff;
          border-color: var(--accent-color);
        }

        /* --- Navigation --- */
        nav {
          background-color: var(--nav-bg);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        nav ul {
          list-style: none;
          display: flex;
          justify-content: center;
          margin: 0;
          padding: 0;
        }

        nav li {
          border-right: 1px solid var(--border-color);
        }

        nav li:first-child {
          border-left: 1px solid var(--border-color);
        }

        nav a {
          display: block;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--text-color);
          padding: 15px 30px;
          transition: background-color 0.2s, color 0.2s;
          text-transform: uppercase;
        }

        nav a:hover {
          background-color: var(--bg-color);
          opacity: 0.9;
        }

        nav a.active {
          background-color: var(--accent-color);
          color: #ffffff;
        }

        /* --- Content --- */
        #content {
          display: block;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 30px 20px;
          box-sizing: border-box;
        }

        /* --- Footer --- */
        footer {
          padding: 20px;
          background-color: var(--header-bg);
          color: var(--text-color);
          text-align: center;
          font-size: 0.8rem;
          border-top: 1px solid var(--border-color);
          opacity: 0.7;
          margin-top: 40px;
        }

        /* --- Mobile Adaptation --- */
        @media (max-width: 768px) {
          header {
            flex-direction: column;
            gap: 10px;
          }
          
          .header-group {
             justify-content: center;
          }
          
          header h1 {
            font-size: 1.2rem;
            letter-spacing: 1px;
          }
          
          nav ul {
            flex-direction: column;
          }

          nav li {
            border-right: none;
            border-bottom: 1px solid var(--border-color);
          }
          
          nav li:first-child {
            border-left: none;
          }

          nav a {
            padding: 12px 20px;
            text-align: center;
          }
        }
      </style>

      <header>
        <div class="header-group">
          <!-- Вставляем ваш логотип -->
          <img src="https://z-cdn-media.chatglm.cn/files/cb86c63f-78b1-4790-be3a-694b94d7fbc8.png?auth_key=1871045873-a9f8e162ae694a4ba44f01f87b872b92-0-1b9d71e8d3cf62c49351400f257c2358" alt="Logo">
          <h1>RADIOGRAPHIA</h1>
        </div>
        <!-- Кнопка переключения темы -->
        <button id="theme-switcher">Сменить тему</button>
      </header>

      <nav>
        <ul>
          <li><a href="/home">Главная</a></li>
          <li><a href="/dev">Направления</a></li>
          <li><a href="/about">О нас</a></li>
        </ul>
      </nav>

      <div id="content"></div>

      <footer>© 2026 RADIOGRAPHIA.ORG</footer>
    `;

    // Обработчики событий меню
    this.shadowRoot.querySelector('nav a')
      .addEventListener('click', e => {
        e.preventDefault();
        history.pushState(null, '', '/home');
        this.render();
      });
      
    // Обработчик кнопки темы
    this.shadowRoot.querySelector('#theme-switcher')
      .addEventListener('click', () => {
        const current = localStorage.getItem('app-theme');
        const next = current === 'dark' ? 'ivory' : 'dark';
        applyTheme(next);
      });

    window.addEventListener('popstate', () => this.render());
  }

  connectedCallback() {
    // 3. Инициализируем тему при подключении элемента
    initTheme();

    if (location.pathname === '/' || location.pathname === '') {
      history.replaceState(null, '', '/home');
    }
    this.render();
  }

  render() {
    const content = this.shadowRoot.querySelector('#content');
    content.innerHTML = '';

    // Управление активным состоянием ссылок
    const links = this.shadowRoot.querySelectorAll('nav a');
    links.forEach(link => {
      if (link.getAttribute('href') === location.pathname) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // выбираем раздел по пути
    let sections = []; 

    switch (location.pathname) {
      case '/home':
        sections = [
          '/content/articles/home/a.md',
          '/content/articles/home/d.md',
          '/content/articles/home/b.md',
          '/content/articles/home/c.md'
        ];
        break;

      case '/dev':
        sections = [
          '/content/articles/dev/a.md',
          '/content/articles/dev/b.md',
          '/content/articles/dev/c.md'
        ];
        break;

      case '/about':
        sections = [
          '/content/articles/home/a.md'
        ];
        break;

      default:
        content.innerHTML = '<h2 style="color: var(--accent-color); text-align: center;">404 - Страница не найдена</h2>';
        return;
    }

    // создаем article-module
    const article = document.createElement('article-module');

    // вставляем секции статьи
    sections.forEach(src => {
      const el = document.createElement('article-section');
      el.setAttribute('src', src);
      article.appendChild(el);
    });

    content.appendChild(article);
  }
} 

customElements.define('portal-shell', PortalShell);