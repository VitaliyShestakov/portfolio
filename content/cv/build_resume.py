from base64 import b64encode
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).resolve().parent
OUT = ROOT / ".cache" / "cv"


def link(url, label):
    return f'<a href="{escape(url, quote=True)}">{escape(label)}</a>'


def links(items, prefix=""):
    return '<div class="project-links">' + escape(prefix) + ' <span class="separator">·</span> '.join(link(url, label) for label, url in items) + '</div>'


def job(company, role, dates, location, intro, bullets, urls, stack="", prefix=""):
    return f'''<article class="job">
      <div class="job-heading"><h3>{escape(company)}</h3><span class="dates">{escape(dates)}</span></div>
      <div class="job-meta"><strong>{escape(role)}</strong><span> / </span>{escape(location)}</div>
      <p class="job-intro">{intro}</p>
      <ul>{''.join('<li>' + text + '</li>' for text in bullets)}</ul>
      {('<p class="job-stack"><b>Стек:</b> ' + escape(stack) + '</p>') if stack else ''}
      {links(urls, prefix)}
    </article>'''


terra = job(
    'CRTEX', 'Senior Flutter Developer', '10.2023 — 11.2026', 'Москва, Россия',
    'Продукты Terra: мобильное приложение для iOS и Android, Terra Admin и форма регистрации на мероприятия. Создал продукты с нуля, вывел в production и полностью перенёс Terra в Web.',
    [
        'Спроектировал модульную архитектуру: <b>Clean Architecture, BLoC, DI, Repository</b>, разделение Domain / Data / Presentation. Обеспечил переиспользование бизнес-логики между платформами.',
        'Адаптировал навигацию, авторизацию и сохранение состояния к браузеру. Переработал инициализацию и загрузку модулей, сократив время запуска Web-приложения.',
        'Усилил REST/WebSocket-интеграции, восстановление соединений и синхронизацию данных. Добавил кэширование и пагинацию, сократил лишние запросы и перестроения виджетов.',
        'Разработал административные инструменты и регистрацию для запусков наставничества, собиравших <b>5&nbsp;000+ участников за день</b>.',
        'Настроил диагностику и выпуск обновлений: <b>60+ production-релизов</b>, crash-free sessions — <b>99,95%</b>.',
        'Провёл <b>50+ технических собеседований</b>, усилил Flutter-команду. Принимал технические решения, проводил code review, участвовал в планировании и передаче знаний.',
        'С начала 2026 года внедрял ИИ-инструменты: правила для агентов, архитектурные ограничения и RAG-базу. Использовал Cursor, Claude Code и Codex для анализа, рефакторинга, тестов и документации; проверял изменения через review, статический анализ и тестирование.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/terra-core/id6467891028'), ('Google Play', 'https://play.google.com/store/apps/details?id=com.club.terra'), ('Сайт Terra', 'https://club-terra.ru/')],
)

citadel = job(
    'Citadel.one', 'Flutter Developer', '08.2022 — 09.2023', 'Москва, Россия',
    'Web3-интеграции и операции с цифровыми активами в криптовалютном кошельке на Flutter для iOS и Android с поддержкой <b>40 блокчейн-сетей</b>.',
    [
        'Интегрировал WalletConnect для подключения кошелька к Web3-приложениям и подтверждения операций.',
        'Подключал DApps через WebView и JavaScript bridge: передача данных кошелька, обработка запросов и подтверждение транзакций.',
        'Разрабатывал отправку и получение токенов, отображение балансов и истории операций. Работал с криптовалютными API и особенностями разных сетей.',
        'Дорабатывал обработку состояний транзакций, сетевых ошибок и асинхронных событий; синхронизировал интерфейс с обновлениями балансов и результатами операций.',
    ],
    [('App Store', 'https://apps.apple.com/app/citadel-one/id1546701475'), ('Google Play', 'https://play.google.com/store/apps/details?id=one.citadel.mobile'), ('Сайт', 'https://citadel.one/')],
    'Data / Domain / Presentation, BLoC/Cubit, get_it, Repository, Use Cases, RxDart, built_value',
)

tayyab = job(
    'Tayyab', 'Flutter Developer', '06.2022 — 08.2022', 'Алматы, Казахстан',
    'Цифровой исламский финансовый сервис Казахстана. Платежи и карты; Flutter, iOS / Android.',
    [
        'Реализовал <b>3 ключевых раздела</b>: денежные переводы, выписки по счетам и историю операций.',
        'Поддерживал выпуск и активацию виртуальных и физических карт, дорабатывал платёжные сценарии.',
        'Исправлял критические ошибки, проводил рефакторинг и улучшал архитектуру приложения.',
        'Предлагал решения по UX/UI платёжных экранов, адаптивности и доступности интерфейсов с учётом пользовательского опыта.',
    ],
    [('App Store', 'https://apps.apple.com/kz/app/tayyab/id1562092088'), ('Google Play', 'https://play.google.com/store/apps/details?id=co.tayyab.app'), ('Сайт', 'https://tayyab.kz/')],
)

beauty = job(
    'Beauty Agent', 'Flutter Developer', '04.2022 — 06.2022', 'Москва, Россия',
    'Клиентская база и расписание мастеров сферы услуг. Flutter, iOS / Android.',
    [
        'Реализовал карточки клиентов: создание, редактирование и просмотр данных.',
        'Разработал расписание мастера и управление записями на приём, связав их с клиентской базой.',
        'Добавил регистрацию, авторизацию и push-уведомления.',
        'Поддерживал мультиязычность и адаптировал интерфейсы под разные размеры экранов. Участвовал в проработке требований и оценке задач.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/beauty-agent-запись-клиентов/id1451215026'), ('Google Play', 'https://play.google.com/store/apps/details?id=com.beautyagent'), ('Сайт', 'https://app.beautyagent.ru/')],
)

otis = job(
    'ОТИС', 'Flutter Developer', '02.2021 — 03.2022', 'Алматы, Казахстан',
    'Внутреннее приложение для групп быстрого реагирования. Flutter, iOS / Android.',
    [
        'Разрабатывал экраны и рабочие сценарии сотрудников; интегрировал Google Maps, отображение объектов и геолокацию.',
        'Реализовал несколько способов авторизации, включая социальный вход; дорабатывал обработку ошибок.',
        'Поддерживал WebSocket: получение событий, обновление интерфейса и восстановление связи после отключений. Исправлял ошибки и дорабатывал существующий код.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/otis-security/id6443658534'), ('Google Play', 'https://play.google.com/store/apps/details?id=kz.otisdevteam.otis_security'), ('Сайт ОТИС', 'https://www.otis.kz/')],
    prefix='Публичное приложение OTIS Security: ',
)

styles = '''
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
:root { --ink:#192534; --muted:#5d6878; --blue:#2459a6; --line:#dce3eb; }
html { background:#e8ecf1; }
body { margin:0; color:var(--ink); font-family:Arial,Helvetica,sans-serif; font-size:9.8pt; line-height:1.32; font-weight:400; }
a { color:var(--blue); text-decoration:none; border-bottom:0.4pt solid #a6bddb; }
b,strong { font-weight:650; }
p { margin:0; }
.page { background:#fff; width:210mm; height:297mm; padding:14mm 16mm 15mm; margin:8mm auto; position:relative; box-shadow:0 2mm 8mm #23334a13; break-after:page; }
.page:last-child { break-after:auto; }
.header { display:grid; grid-template-columns:minmax(0,1fr) 30mm; column-gap:17pt; align-items:start; margin-bottom:13pt; padding-bottom:11pt; border-bottom:1.4pt solid var(--blue); }
.portrait { display:block; width:30mm; height:30mm; object-fit:cover; border-radius:3pt; }
h1 { font-size:25pt; line-height:1.1; letter-spacing:-0.9pt; font-weight:700; margin:0 0 5pt; }
.position { color:var(--blue); font-size:12pt; font-weight:650; margin-bottom:5pt; }
.platforms { color:var(--muted); font-size:9pt; font-weight:400; white-space:nowrap; margin-left:6pt; }
.header-meta { font-size:9.2pt; color:var(--muted); margin-bottom:5pt; }
.header-work { font-size:8.7pt; color:var(--muted); margin-bottom:6pt; }
.contacts { display:flex; align-items:center; gap:5pt 14pt; flex-wrap:wrap; font-size:8.7pt; }
.section-title { font-size:10.5pt; font-weight:700; letter-spacing:.3pt; margin:0 0 7pt; padding-bottom:4pt; border-bottom:.5pt solid var(--line); }
.profile { margin-bottom:13pt; }
.profile p { margin-bottom:5pt; }
.profile p:last-child { margin-bottom:0; }
.job { margin-bottom:12pt; break-inside:avoid; }
.job:last-child { margin-bottom:0; }
.job-heading { display:flex; justify-content:space-between; align-items:baseline; gap:10pt; }
h3 { margin:0; font-size:11.1pt; line-height:1.25; font-weight:700; }
.dates { flex:none; color:var(--muted); font-size:8.5pt; font-variant-numeric:tabular-nums; }
.job-meta { font-size:8.8pt; color:var(--muted); margin-top:2pt; margin-bottom:4pt; }
.job-meta strong { color:var(--ink); font-weight:550; }
.job-meta span { color:#a4acb8; padding:0 3pt; }
.job-intro { margin-bottom:4pt; }
ul { margin:0 0 4pt; padding:0 0 0 12pt; }
li { margin-bottom:2.5pt; padding-left:1.5pt; }
li:last-child { margin-bottom:0; }
li::marker { color:#526579; font-size:7pt; }
.job-stack { font-size:8.6pt; color:var(--muted); margin:4pt 0; }
.project-links { font-size:8.3pt; color:var(--muted); margin-top:4pt; }
.separator { color:#9aabc0; margin:0 5pt; }
.continuation { display:flex; justify-content:space-between; align-items:baseline; padding-bottom:7pt; margin-bottom:11pt; border-bottom:1.4pt solid var(--blue); }
.continuation strong { font-size:12pt; font-weight:650; }
.continuation span { color:var(--muted); font-size:8.8pt; }
.compact .job { margin-bottom:9pt; }
.tech { margin-top:11pt; margin-bottom:11pt; }
.tech dl { display:grid; grid-template-columns:83pt 1fr; gap:3.5pt 9pt; margin:0; font-size:8.7pt; line-height:1.34; }
.tech dt { color:var(--muted); font-weight:550; }
.tech dd { margin:0; }
.bottom-grid { display:grid; grid-template-columns:1fr 135pt; gap:20pt; }
.bottom-grid p { font-size:8.7pt; line-height:1.4; }
.bottom-grid .section-title { margin-bottom:5pt; }
.footer { position:absolute; left:16mm; right:16mm; bottom:8mm; display:flex; align-items:center; justify-content:space-between; color:#778394; font-size:7.1pt; border-top:.5pt solid var(--line); padding-top:5pt; }
@media print { html { background:#fff; } .page { margin:0; box-shadow:none; } a { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
@media screen and (max-width:820px) { html { overflow-x:auto; } .page { margin:0 auto 5mm; } }
'''

contacts = ' '.join([
    link('mailto:shestakovvitaliy87@gmail.com', 'shestakovvitaliy87@gmail.com'),
    link('https://t.me/Shestakov_V', 'Telegram: @Shestakov_V'),
    link('https://www.linkedin.com/in/vitaliy-shestakov-67a9b0228', 'LinkedIn'),
])

photo = 'data:image/png;base64,' + b64encode((SOURCE / 'portrait.png').read_bytes()).decode()

html = f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Виталий Шестаков — Senior Flutter Developer</title>
<meta name="description" content="Резюме Виталия Шестакова, Senior Flutter Developer. 5+ лет коммерческого опыта, iOS, Android и Web.">
<style>{styles}</style></head><body>
<main>
<section class="page" aria-label="Страница 1">
  <div class="page-content">
    <header class="header">
      <div class="header-main">
      <h1>Виталий Шестаков</h1>
      <p class="position">Senior Flutter Developer <span class="platforms">· iOS / Android / Web</span></p>
      <p class="header-meta">Москва · 27 лет · 5+ лет коммерческого опыта</p>
      <p class="header-work">Полная занятость · удалённо или офис · готов к командировкам</p>
      <nav class="contacts" aria-label="Контакты">{contacts}</nav>
      </div>
      <img class="portrait" src="{photo}" alt="Фотография Виталия Шестакова" width="1254" height="1254">
    </header>
    <section class="profile"><h2 class="section-title">О себе</h2>
      <p>Создаю приложения от проектирования архитектуры и интеграции сервисов до публикации и сопровождения. Работал над финансовыми сервисами, криптовалютными кошельками, корпоративными приложениями и платформами для сообществ.</p>
      <p>Самостоятельно принимаю технические решения, декомпозирую задачи, оцениваю сроки и планирую разработку. Провожу code review и технические собеседования. Использую ИИ-агентов, настраиваю проектный контекст и проверяю качество изменений.</p>
    </section>
    <section aria-label="Опыт работы"><h2 class="section-title">Опыт работы</h2>{terra}{citadel}</section>
  </div>
  <footer class="footer"><span>Виталий Шестаков · Senior Flutter Developer</span><span>01 / 02</span></footer>
</section>
<section class="page compact" aria-label="Страница 2">
  <div class="page-content">
    <header class="continuation"><strong>Виталий Шестаков</strong><span>Senior Flutter Developer</span></header>
    <section aria-label="Опыт работы, продолжение"><h2 class="section-title">Опыт работы · продолжение</h2>{tayyab}{beauty}{otis}</section>
    <section class="tech"><h2 class="section-title">Технологии</h2>
      <dl>
        <dt>Архитектура и состояние</dt><dd>Clean Architecture, SOLID, MVVM, MVP, DI, BLoC/Cubit, Provider, Streams, RxDart, Melos; AutoRoute, GoRouter, Navigator.</dd>
        <dt>Сеть и данные</dt><dd>REST API, Dio, HTTP, WebSocket; SQLite, Drift, IndexedDB, Hive, SharedPreferences, Flutter Secure Storage.</dd>
        <dt>Интеграции</dt><dd>Firebase Authentication, FCM, Analytics, Crashlytics; Firestore и Remote Config — дополнительный опыт. Google / Apple / Telegram sign-in, deep links, Method Channels (Swift/Kotlin), AppsFlyer, AppMetrica, Sentry, Intercom.</dd>
        <dt>UI, качество и релизы</dt><dd>Figma, UI-киты, дизайн-токены, Widgetbook, intl, Localizely; unit- и widget-тесты, Dart DevTools; Freezed, json_serializable, build_runner, Git, GitLab CI/CD, GitHub Actions, Fastlane, FVM.</dd>
        <dt>ИИ и процессы</dt><dd>Cursor, Codex, Claude Code, MCP, RAG, инструкции для агентов; Agile, Scrum, Kanban, Jira, Trello, Week.</dd>
      </dl>
    </section>
    <section class="bottom-grid">
      <div><h2 class="section-title">Образование</h2><p><strong>Санкт-Петербургский гуманитарный университет профсоюзов</strong><br>Бакалавр · Прикладная информатика · 2017 — 2022</p></div>
      <div><h2 class="section-title">Языки</h2><p>Русский — родной<br>Английский — базовый</p></div>
    </section>
  </div>
  <footer class="footer"><span>{link('mailto:shestakovvitaliy87@gmail.com', 'shestakovvitaliy87@gmail.com')} · {link('https://t.me/Shestakov_V', '@Shestakov_V')}</span><span>02 / 02</span></footer>
</section>
</main></body></html>'''

def write_ru():
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / 'Vitaliy-Shestakov-CV-RU-photo.html'
    target.write_text(html, encoding='utf-8')
    print(target)


if __name__ == '__main__':
    write_ru()
