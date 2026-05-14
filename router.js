// router.js
import './modules/article-module.js';
import './modules/article-section.js';

// Определяем базовый путь приложения
// (можно взять из тега <base>, если он задан, или из URL репозитория)
const BASE_PATH = (document.querySelector('base')?.href || location.origin + '/')
                    .replace(/\/$/, ''); // убираем завершающий слеш

// Вспомогательная функция: из полного пути получаем относительный путь приложения
function getRelativePath(fullPath) {
  // Убираем базовый префикс из pathname
  let rel = fullPath.replace(BASE_PATH, '') || '';
  // Убираем начальный слеш, если остался
  if (rel.startsWith('/')) rel = rel.slice(1);
  // Пустая строка — это home
  return rel || 'home';
}

// Функция навигации
export function navigateTo(path) {
  // path — относительный (например, 'home', 'dev')
  history.pushState(null, null, path);
  window.dispatchEvent(new Event('locationchange'));
}

// Основная функция рендеринга
function renderRoute(fullPath) {
  const contentHost = document.querySelector('#content');
  if (!contentHost) return;

  // Преобразуем полный путь в относительный (без префикса)
  const path = getRelativePath(fullPath);

  // Очистка контента
  contentHost.innerHTML = '';

  // Обновляем активный пункт меню
  const links = document.querySelectorAll('nav a');
  links.forEach(link => {
    const href = link.getAttribute('href'); // должно быть 'home', 'dev' и т.д.
    if (href === path) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Определяем секции для загрузки
  let sections = [];
  switch (path) {
    case 'home':
      sections = [
        'content/articles/home/a.html',
        'content/articles/home/d.html',
        'content/articles/home/b.html',
        'content/articles/home/c.html'
      ];
      break;
    case 'dev':
      sections = [
        'content/articles/dev/a.html',
        'content/articles/dev/b.html',
        'content/articles/dev/c.html'
      ];
      break;
    case 'about':
      sections = [
        'content/articles/home/a.html'
      ];
      break;
    default:
      contentHost.innerHTML = '<h2 style="color: var(--accent-color); text-align: center;">404 - Страница не найдена</h2>';
      return;
  }

  // Создаём структуру статьи
  const article = document.createElement('article-module');
  sections.forEach(src => {
    const el = document.createElement('article-section');
    el.setAttribute('src', src); // относительный путь, будет разрешён через <base>
    article.appendChild(el);
  });
  contentHost.appendChild(article);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  renderRoute(location.pathname); // отдаём полный pathname, внутри он обрежется

  // Перехватываем клики по меню
  const links = document.querySelectorAll('nav a');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = link.getAttribute('href'); // относительный (home, dev...)
      navigateTo(path);
    });
  });
});

// Слушатели истории
window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));
window.addEventListener('locationchange', () => renderRoute(location.pathname));
