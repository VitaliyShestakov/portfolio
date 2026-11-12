# Виталий Шестаков · портфолио

[English](README.en.md) · [Сайт](index.html) · [Резюме RU](resume.pdf) · [CV EN](resume-en.pdf)

Портфолио Senior Flutter Developer: проекты, опыт, стек и контакты. Русский и английский языки, светлая и тёмная темы, адаптивная вёрстка. Сайт работает на статическом HTML/CSS/JavaScript с локальными шрифтами и изображениями.

## Локальный запуск

Для инструментов проекта нужен **Node.js 22+**. Устанавливать npm-зависимости не требуется.

```sh
npm run dev
```

Открыть <http://127.0.0.1:8000/>. Порт можно задать через `-- --port 8001`. Сам сайт также открывается напрямую через `index.html`.

## Проверка и релиз

```sh
npm run check
npm test
npm run build
npm run preview
```

- `check` проверяет локальные ресурсы, якоря, синтаксис JavaScript, RU/EN, PDF и материалы карточек.
- `test` собирает временный релиз, проверяет состав и байты файлов, HTTP-ответы и работу под `/portfolio/`.
- `build` заново создаёт `dist/` из файлов, на которые ссылается сайт, и динамически выбираемых PDF. Проверки выполняются до сборки.
- `preview` обслуживает именно `dist/` по адресу <http://127.0.0.1:8000/>.

Для публикации использовать **только содержимое `dist/`**. Оно подходит для статического хостинга, включая GitHub Pages под `/portfolio/`. Серверная часть не нужна. Сборка и CI не публикуют сайт автоматически.

GitHub Actions выполняет проверки, тесты и сборку на push/PR и сохраняет `portfolio-release` как артефакт. Конфигурация: [.github/workflows/check.yml](.github/workflows/check.yml).

## Публикация в GitHub Pages

1. В репозитории открыть **Settings → Pages**.
2. В **Build and deployment → Source** выбрать **GitHub Actions**.
3. Открыть **Actions → Deploy GitHub Pages → Run workflow**, выбрать `main` и запустить.
4. Дождаться успешного выполнения `build` и `deploy`.

Адрес сайта: <https://vitaliyshestakov.github.io/portfolio/>. Английская версия: `?lang=en`.

Workflow находится в [.github/workflows/pages.yml](.github/workflows/pages.yml), проверяет проект и публикует только `dist/`. После следующих изменений отправить коммит в `main` и повторить **Run workflow**. Обычный push запускает проверки; публикация остаётся ручной.

## Структура

| Путь | Назначение |
| --- | --- |
| `index.html` | Семантическая разметка, содержимое RU и данные галереи |
| `styles.css` | Токены, компоненты, адаптивность, темы и печать |
| `theme.js` | Тема до первого отображения страницы |
| `locales.js` | Тексты RU/EN, метаданные и доступные подписи |
| `script.js` | Настройки, локализация и общая навигация по якорям |
| `experience.js` | Макеты платформ, раскрытие опыта, стек и анимация |
| `interactions.js` | Командная панель, галерея и копирование email |
| `assets/` | Используемые шрифты, иконки и экраны приложений |
| `content/cv/` | Редактируемые исходники резюме и фотография |
| `scripts/`, `tests/` | Инструменты и проверки без внешних пакетов |

`dist/`, `.cache/` и `.playwright/` генерируются и не включаются в Git. Старые версии сайта и промежуточные изображения удалены; перед очисткой сохранена резервная копия вне проекта.

## Обновление материалов

При изменении текста обновлять обе локали и соответствующее содержимое HTML для режима без JavaScript. Навигация, галерея, карточки и резюме используют существующие якоря и относительные пути, поэтому работают и в корне домена, и под `/portfolio/`.

Происхождение оригинальных изображений и сведения о векторных превью находятся в [assets/apps/sources.json](assets/apps/sources.json). Векторные обложки пересобираются командой `npm run assets:build`; оригиналы доступны в галерее. Шрифт Onest распространяется по [SIL Open Font License](assets/Onest-OFL.txt).

Исходники резюме не публикуются со сборкой. Для HTML нужен Python 3:

```sh
npm run cv:html
```

Для экспорта PDF запустить Chrome с remote debugging, как указано ниже, затем:

```sh
PORTFOLIO_DEBUG_URL=http://127.0.0.1:9223 npm run cv:export -- ru
PORTFOLIO_DEBUG_URL=http://127.0.0.1:9223 npm run cv:export -- en
```

Результат и проверка вёрстки сохраняются в `.cache/cv/`. После просмотра заменить корневые `resume.pdf` и `resume-en.pdf`, затем повторить `npm run check` и `npm run build`. Экспорт не заменяет опубликованные PDF автоматически.

## Проверка в браузере

Запустить `npm run preview` после сборки и отдельный Chrome. Пример для macOS:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --remote-debugging-port=9223 --user-data-dir=/tmp/portfolio-qa --no-first-run about:blank
```

```sh
PORTFOLIO_BASE_URL=http://127.0.0.1:8000 PORTFOLIO_DEBUG_URL=http://127.0.0.1:9223 npm run test:browser
PORTFOLIO_BASE_URL=http://127.0.0.1:8000 PORTFOLIO_DEBUG_URL=http://127.0.0.1:9223 npm run test:navigation
```

Проверяются обе темы и локали, адаптивность, макеты iOS/Android/Web, галерея, диалоги, клавиатура, reduced motion, недоступный localStorage, печать и режим без JavaScript. Навигационные проверки дополнительно покрывают ширины 360–2560 px, прямые ссылки, историю и прерывание прокрутки. Отчёты и снимки сохраняются только в `.playwright/`.
