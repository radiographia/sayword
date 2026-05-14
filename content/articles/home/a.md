<style>
  .section {
    min-height: 200vh; /* два экрана */
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2rem;

    padding: 4rem;
    box-sizing: border-box;

    /* --- ЗАМЕНА НА ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ --- */
    background-color: var(--bg-color);       /* Был #1e1e2f */
    color: var(--text-color);                /* Был #f0f0f0 */
    border-bottom: 1px solid var(--border-color); /* Добавил для красоты разделения */
    
    /* Плавная смена цветов при переключении темы */
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
    
    font-family: system-ui, sans-serif;
  }

  .section h1, h2, h3 {
    /*font-size: 3rem;*/
    margin: 0;
    /* Заголовок делаем акцентным цветом (красный/бордо) */
    color: var(--accent-color); 
  }

  .section p {
    font-size: 1.3rem;
    max-width: 60ch;
    line-height: 1.6;
  }

  .spacer {
    height: 100vh;
  }
</style>

<div class="section">
  <h1>Demo Article — Section A</h1>

  <h2>
    This is the first section of a large article.
	</h2><h3>
    It is intentionally tall and behaves like a landing block.
  </h3>

  <p>
    The content is loaded lazily when the section enters the viewport.
    Styles are fully encapsulated inside the markdown file.
  </p>

  <div class="spacer"></div>

  <p>
    Scroll continues inside the same section, occupying the second screen.
    This makes it suitable for storytelling, promos, or visual narratives.
  </p>
</div>