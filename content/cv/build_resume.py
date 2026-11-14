"""Shared rendering and Russian content for the two-page CV."""
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '.cache' / 'cv'


def link(url, label):
    return f'<a href="{escape(url, quote=True)}">{escape(label)}</a>'


def job(company, role, dates, location, intro, bullets, urls):
    return f'''<article class="job">
      <div class="job-heading"><h3>{escape(role)} | {escape(company)}</h3><span class="dates">{escape(dates)}</span></div>
      <p class="job-location">{escape(location)}</p>
      <p class="job-intro">{intro}</p>
      <ul>{''.join('<li>' + text + '</li>' for text in bullets)}</ul>
      <nav class="project-links" aria-label="{escape(company, quote=True)}">{' <span class="separator">·</span> '.join(link(url, label) for label, url in urls)}</nav>
    </article>'''


styles = '''
@page { size:A4; margin:0; }
* { box-sizing:border-box; }
:root { --ink:#17202a; --muted:#53606d; --blue:#17628f; --line:#d8e1e8; }
html { background:#e8ecf1; }
body { margin:0; color:var(--ink); font-family:"Times New Roman",Times,serif; font-size:11pt; line-height:1.23; }
a { color:var(--blue); text-decoration:none; }
p { margin:0; }
b,strong { font-weight:700; }
.page { background:#fff; width:210mm; height:297mm; padding:14mm 16mm 15mm; margin:8mm auto; position:relative; box-shadow:0 2mm 8mm #23334a13; break-after:page; }
.page:last-child { break-after:auto; }
.header { text-align:center; margin-bottom:13pt; }
h1 { color:var(--blue); font-size:23pt; line-height:1.12; margin:0 0 4pt; }
.position { font-size:13pt; font-weight:700; margin-bottom:7pt; }
.contacts { font-size:10pt; line-height:1.4; }
.contacts a { white-space:nowrap; }
.separator { color:#8492a0; padding:0 3pt; }
.header-meta { margin-top:4pt; color:var(--muted); font-size:10pt; }
.section-title { color:var(--blue); font-size:11.5pt; text-transform:uppercase; margin:0 0 5pt; }
.profile { margin-bottom:11pt; }
.tech { margin-bottom:12pt; }
.skill-row { margin:0 0 2pt; font-size:10.5pt; line-height:1.2; }
.skill-row:last-child { margin-bottom:0; }
.job { margin-bottom:12pt; break-inside:avoid; }
.job:last-child { margin-bottom:0; }
.job-heading { display:flex; justify-content:space-between; align-items:baseline; gap:10pt; }
h3 { margin:0; font-size:11.5pt; line-height:1.2; }
.dates { flex:none; font-size:10pt; font-variant-numeric:tabular-nums; }
.job-location { color:var(--muted); font-size:9.5pt; margin:1pt 0 4pt; }
.job-intro { margin-bottom:5pt; }
ul { margin:0; padding-left:14pt; }
li { margin-bottom:3pt; padding-left:1pt; }
li:last-child { margin-bottom:0; }
.project-links { font-size:9pt; margin-top:5pt; }
.continuation { display:flex; justify-content:space-between; align-items:baseline; padding-bottom:6pt; margin-bottom:11pt; border-bottom:.5pt solid var(--line); }
.continuation strong { color:var(--blue); font-size:12pt; }
.continuation span { color:var(--muted); font-size:10pt; }
.education { margin-top:13pt; }
.education p { margin-bottom:3pt; }
.languages { margin-top:11pt; }
.footer { position:absolute; left:16mm; right:16mm; bottom:7mm; display:flex; justify-content:space-between; color:var(--muted); font-size:8pt; border-top:.5pt solid var(--line); padding-top:5pt; }
@media print { html { background:#fff; } .page { margin:0; box-shadow:none; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
@media screen and (max-width:820px) { html { overflow-x:auto; } .page { margin:0 auto 5mm; } }
'''


def render_cv(language, name, profile, skills, jobs, education, languages):
    ru = language == 'ru'
    labels = {
        'profile': 'О себе' if ru else 'Summary',
        'skills': 'Технические навыки' if ru else 'Technical skills',
        'experience': 'Опыт работы' if ru else 'Work experience',
        'continued': 'Опыт работы · продолжение' if ru else 'Work experience · continued',
        'education': 'Образование' if ru else 'Education',
        'languages': 'Языки' if ru else 'Languages',
    }
    contacts = ' <span class="separator">|</span> '.join([
        'Москва, Россия' if ru else 'Moscow, Russia',
        link('mailto:shestakovvitaliy87@gmail.com', 'shestakovvitaliy87@gmail.com'),
        link('tel:+79522711249', '+7 (952) 271-12-49'),
    ])
    social = ' <span class="separator">|</span> '.join([
        link('https://t.me/Shestakov_V', 'Telegram: @Shestakov_V'),
        link('https://www.linkedin.com/in/vitaliy-shestakov-67a9b0228', 'LinkedIn'),
        link(f'https://vitaliyshestakov.github.io/portfolio/?lang={language}', 'Портфолио' if ru else 'Portfolio'),
    ])
    skills_html = ''.join(f'<p class="skill-row"><b>{escape(label)}:</b> {escape(value)}</p>' for label, value in skills)
    meta = '5+ лет коммерческого опыта · Полная занятость · Удалённо / гибрид / офис' if ru else '5+ years of professional experience · Full-time · Remote / hybrid / on-site'
    return f'''<!doctype html>
<html lang="{language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} — Senior Flutter Developer</title>
<meta name="description" content="{name} · Senior Flutter Developer · iOS, Android, Web">
<style>{styles}</style></head><body><main>
<section class="page" aria-label="{'Страница' if ru else 'Page'} 1">
  <div class="page-content">
    <header class="header">
      <h1>{name}</h1>
      <p class="position">Senior Flutter Developer · iOS / Android / Web</p>
      <nav class="contacts">{contacts}<br>{social}</nav>
      <p class="header-meta">{meta}</p>
    </header>
    <section class="profile"><h2 class="section-title">{labels['profile']}</h2><p>{profile}</p></section>
    <section class="tech"><h2 class="section-title">{labels['skills']}</h2>{skills_html}</section>
    <section aria-label="{labels['experience']}"><h2 class="section-title">{labels['experience']}</h2>{jobs[0]}</section>
  </div>
  <footer class="footer"><span>{name} · Senior Flutter Developer</span><span>1 / 2</span></footer>
</section>
<section class="page" aria-label="{'Страница' if ru else 'Page'} 2">
  <div class="page-content">
    <header class="continuation"><strong>{name}</strong><span>Senior Flutter Developer</span></header>
    <section aria-label="{labels['continued']}"><h2 class="section-title">{labels['continued']}</h2>{''.join(jobs[1:])}</section>
    <section class="education"><h2 class="section-title">{labels['education']}</h2>{education}</section>
    <section class="languages"><h2 class="section-title">{labels['languages']}</h2><p>{languages}</p></section>
  </div>
  <footer class="footer"><span>{link('mailto:shestakovvitaliy87@gmail.com', 'shestakovvitaliy87@gmail.com')} · {link('https://t.me/Shestakov_V', '@Shestakov_V')}</span><span>2 / 2</span></footer>
</section>
</main></body></html>'''


terra = job(
    'CRTEX', 'Senior Flutter-разработчик', '10.2023 — 11.2026', 'Москва, Россия',
    'С нуля создал и запустил продукты Terra: приложение для iOS и Android, админку и форму регистрации на мероприятия. Отвечал за архитектуру, развитие, релизы и стабильность.',
    [
        'Перенёс Terra на Flutter Web, адаптировал навигацию и авторизацию. Оптимизировал инициализацию и загрузку модулей, сократив время запуска на <b>30%</b>.',
        'Реализовал кэширование и пагинацию при работе с REST API, сократив количество повторных запросов на <b>25%</b>.',
        'Оптимизировал управление состоянием на BLoC и перестроения виджетов, сократив время отображения списков и каталогов на <b>20%</b>.',
        'Доработал WebSocket-интеграции, восстановление соединений и синхронизацию данных.',
        'Разработал административные инструменты и регистрацию для запусков наставничества, собиравших <b>5&nbsp;000+ участников за день</b>.',
        'Настроил сбор ошибок, диагностику и выпуск обновлений. Выпустил <b>60+ production-релизов</b>, поддерживал <b>99,95% сессий без сбоев</b>.',
        'Провёл <b>50+ технических собеседований</b>. Принимал технические решения, проводил ревью кода, помогал планировать разработку и адаптировать новых участников команды.',
        'С начала 2026 года внедрял ИИ-инструменты: настроил правила для агентов, описал архитектурные ограничения и собрал RAG-базу по коду и документации.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/terra-core/id6467891028'), ('Google Play', 'https://play.google.com/store/apps/details?id=com.club.terra'), ('Сайт', 'https://club-terra.ru/')],
)

citadel = job(
    'Citadel.one', 'Flutter-разработчик', '08.2022 — 09.2023', 'Алматы, Казахстан',
    'Отвечал за Web3-интеграции и операции с цифровыми активами в криптовалютном кошельке для iOS и Android с поддержкой <b>40 блокчейн-сетей</b>.',
    [
        'Интегрировал <b>WalletConnect</b> для подключения к Web3-приложениям и подтверждения операций.',
        'Подключал <b>DApps</b> через <b>WebView</b> и <b>JavaScript bridge</b>: передача данных кошелька, обработка запросов и подтверждение транзакций.',
        'Разрабатывал отправку и получение токенов, отображение балансов и истории операций. Работал с криптовалютными API и особенностями разных блокчейн-сетей.',
        'Дорабатывал обработку состояний транзакций, сетевых ошибок и асинхронных событий. Синхронизировал интерфейс с изменениями балансов и результатами операций.',
    ],
    [('App Store', 'https://apps.apple.com/app/citadel-one/id1546701475'), ('Google Play', 'https://play.google.com/store/apps/details?id=one.citadel.mobile'), ('Сайт', 'https://citadel.one/')],
)

tayyab = job(
    'Tayyab', 'Flutter-разработчик', '06.2022 — 08.2022', 'Алматы, Казахстан',
    'Развивал платёжные функции и интерфейсы Tayyab — цифрового исламского финансового сервиса Казахстана.',
    [
        'Реализовал <b>3 ключевых раздела</b>: денежные переводы, выписки по счетам и историю операций.',
        'Поддерживал выпуск и активацию виртуальных и физических карт, дорабатывал платёжные сценарии.',
        'Устранял критические ошибки и повышал стабильность платёжных сценариев.',
    ],
    [('App Store', 'https://apps.apple.com/kz/app/tayyab/id1562092088'), ('Google Play', 'https://play.google.com/store/apps/details?id=co.tayyab.app'), ('Сайт', 'https://tayyab.kz/')],
)

beauty = job(
    'Beauty Agent', 'Flutter-разработчик', '04.2022 — 06.2022', 'Москва, Россия',
    'Работал над развитием Beauty Agent — приложения для мастеров сферы услуг с управлением клиентской базой, расписанием и записями.',
    [
        'Реализовал карточки клиентов: создание, редактирование и просмотр данных.',
        'Разработал расписание и управление записями на приём с привязкой к клиентской базе.',
        'Добавил мультиязычность и адаптировал экраны под разные размеры устройств.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/beauty-agent-запись-клиентов/id1451215026'), ('Google Play', 'https://play.google.com/store/apps/details?id=com.beautyagent'), ('Сайт', 'https://app.beautyagent.ru/')],
)

otis = job(
    'ОТИС', 'Flutter-разработчик', '02.2021 — 03.2022', 'Алматы, Казахстан',
    'Создавал внутреннее приложение на Flutter для групп быстрого реагирования охранной компании ОТИС.',
    [
        'Разрабатывал экраны и пользовательские сценарии для повседневной работы сотрудников охраны.',
        'Интегрировал <b>Google Maps</b>: отображение охраняемых объектов и работу с геолокацией.',
        'Реализовал несколько способов авторизации, включая вход через соцсети.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/otis-security/id6443658534'), ('Google Play', 'https://play.google.com/store/apps/details?id=kz.otisdevteam.otis_security'), ('Сайт', 'https://www.otis.kz/')],
)

skills = [
    ('Языки и платформы', 'Dart, Swift, Kotlin; Flutter, iOS, Android, Web'),
    ('Архитектура и принципы', 'Clean Architecture, MVVM, SOLID, ООП'),
    ('Состояние и реактивность', 'BLoC, Cubit, Provider, RxDart'),
    ('Сеть и API', 'REST API, GraphQL, WebSocket, Dio, Retrofit'),
    ('Хранение данных', 'Drift, SQLite, Hive, SharedPreferences, Secure Storage'),
    ('Интеграции', 'Firebase Auth, FCM, Google Maps, Platform Channels, Deep Links, WalletConnect, WebView, JavaScript Bridge'),
    ('Интерфейсы', 'Material Design, Cupertino, адаптивная вёрстка, локализация, Figma'),
    ('Тестирование и CI/CD', 'Модульные и виджет-тесты, Git, GitHub Actions, GitLab CI/CD, Fastlane'),
    ('ИИ-инструменты', 'Cursor, Claude Code, Codex, RAG'),
]


def write_ru():
    html = render_cv(
        'ru', 'Виталий Шестаков',
        '<b>Senior Flutter-разработчик с опытом более 5 лет</b> в финтехе, Web3 и платформах для сообществ. Разрабатываю приложения для iOS, Android и Web: от проектирования архитектуры до релиза и поддержки. Интегрирую внешние сервисы, реализую бизнес-логику, повышаю производительность и стабильность. Применяю Cursor, Claude Code и Codex для автоматизации задач разработки.',
        skills, [terra, citadel, tayyab, beauty, otis],
        '<p><b>Санкт-Петербургский гуманитарный университет профсоюзов</b> · 2022</p><p>Бакалавр · Прикладная информатика</p>',
        'Русский — родной · Английский — B1 (средний)',
    )
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / 'Vitaliy-Shestakov-CV-RU.html'
    target.write_text(html, encoding='utf-8')
    print(target)


if __name__ == '__main__':
    write_ru()
