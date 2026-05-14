// router.js
import './modules/article-module.js';
import './modules/article-section.js';

// Функция навигации
export function navigateTo(path) {
  history.pushState(null, null, path);
  window.dispatchEvent(new Event('locationchange'));
}

// Основная функция рендеринга
function renderRoute(path) {
  const contentHost = document.querySelector('#content');
  if (!contentHost) return;
  
  // Очистка контента
  contentHost.innerHTML = '';

  // Управление активным состоянием ссылок в меню
  const links = document.querySelectorAll('nav a');
  links.forEach(link => {
    if (link.getAttribute('href') === path) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Определение секций для загрузки
  let sections = [];

  switch (path) {
    case '/home':
      sections = [
        '/content/articles/home/a.html',
        '/content/articles/home/d.html',
        '/content/articles/home/b.html',
        '/content/articles/home/c.html'
      ];
      break;

    case '/dev':
      sections = [
        '/content/articles/dev/a.html',
        '/content/articles/dev/b.html',
        '/content/articles/dev/c.html'
      ];
      break;

    case '/about':
      sections = [
        '/content/articles/home/a.html'
      ];
      break;

    default:
      contentHost.innerHTML = '<h2 style="color: var(--accent-color); text-align: center;">404 - Страница не найдена</h2>';
      return;
  }

  // Создание структуры статьи
  const article = document.createElement('article-module');

  sections.forEach(src => {
    const el = document.createElement('article-section');
    el.setAttribute('src', src);
    article.appendChild(el);
  });

  contentHost.appendChild(article);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  let currentPath = location.pathname;
  
  // Если путь пустой, перенаправляем на /home
  if (currentPath === '/' || currentPath === '') {
    history.replaceState(null, null, '/home');
    currentPath = '/home';
  }
  
  renderRoute(currentPath);

  // Перехват кликов по меню
  const links = document.querySelectorAll('nav a');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = link.getAttribute('href');
      navigateTo(path);
    });
  });
});

// Слушатели событий истории
window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));
window.addEventListener('locationchange', () => renderRoute(location.pathname));