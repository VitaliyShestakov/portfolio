"""English version of the approved Russian resume, using the same layout."""
from build_resume import OUT, styles, photo, link, job, write_ru

terra = job(
    'CRTEX', 'Senior Flutter Developer', 'Oct 2023 — Nov 2026', 'Moscow, Russia',
    'Terra products: an iOS/Android app, Terra Admin and an event registration form. Built and shipped all three from scratch, then fully ported Terra to Web.',
    [
        'Designed a modular architecture using <b>Clean Architecture, BLoC, DI and Repository</b>, with separate Domain / Data / Presentation layers. Enabled business logic reuse across platforms.',
        'Adapted navigation, authentication and state persistence to the browser. Reworked initialization and module loading to reduce Web application startup time.',
        'Improved REST/WebSocket integrations, reconnection and data synchronization. Added caching and pagination, reducing redundant requests and widget rebuilds.',
        'Built admin tools and registration flows for mentoring launches attended by <b>5,000+ people in a single day</b>.',
        'Set up diagnostics and release delivery: <b>60+ production releases</b> and <b>99.95% crash-free sessions</b>.',
        'Conducted <b>50+ technical interviews</b> and strengthened the Flutter team. Made technical decisions, reviewed code and contributed to planning and knowledge sharing.',
        'From early 2026, introduced AI tooling, agent instructions, architecture constraints and a RAG knowledge base. Used Cursor, Claude Code and Codex for analysis, refactoring, tests and documentation, validating changes through review, static analysis and testing.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/terra-core/id6467891028'), ('Google Play', 'https://play.google.com/store/apps/details?id=com.club.terra'), ('Terra website', 'https://club-terra.ru/')],
)

citadel = job(
    'Citadel.one', 'Flutter Developer', 'Aug 2022 — Sep 2023', 'Moscow, Russia',
    'Web3 integrations and digital asset operations in a Flutter cryptocurrency wallet for iOS and Android supporting <b>40 blockchain networks</b>.',
    [
        'Integrated WalletConnect to connect the wallet to Web3 applications and confirm operations.',
        'Integrated DApps through WebView and a JavaScript bridge, exchanging wallet data, handling requests and confirming transactions.',
        'Built token sending and receiving, balance displays and transaction history. Worked with cryptocurrency APIs and network-specific behavior.',
        'Improved transaction state handling, network error handling and asynchronous event processing; synchronized the UI with balance updates and operation results.',
    ],
    [('App Store', 'https://apps.apple.com/app/citadel-one/id1546701475'), ('Google Play', 'https://play.google.com/store/apps/details?id=one.citadel.mobile'), ('Website', 'https://citadel.one/')],
    'Data / Domain / Presentation, BLoC/Cubit, get_it, Repository, Use Cases, RxDart, built_value',
)

tayyab = job(
    'Tayyab', 'Flutter Developer', 'Jun 2022 — Aug 2022', 'Almaty, Kazakhstan',
    'A digital Islamic financial service in Kazakhstan. Payments and cards; Flutter, iOS / Android.',
    [
        'Built <b>three key sections</b>: money transfers, account statements and transaction history.',
        'Maintained issuance and activation flows for virtual and physical cards and improved payment functionality.',
        'Fixed critical bugs, refactored code and improved the application architecture.',
        'Proposed UX/UI, responsive layout and accessibility improvements for payment screens based on user experience.',
    ],
    [('App Store', 'https://apps.apple.com/kz/app/tayyab/id1562092088'), ('Google Play', 'https://play.google.com/store/apps/details?id=co.tayyab.app'), ('Website', 'https://tayyab.kz/')],
)

beauty = job(
    'Beauty Agent', 'Flutter Developer', 'Apr 2022 — Jun 2022', 'Moscow, Russia',
    'Client management and scheduling for service professionals. Flutter, iOS / Android.',
    [
        'Built client profiles with creation, editing and viewing functionality.',
        'Built scheduling and appointment management, connected to the client database.',
        'Added registration, authentication and push notifications.',
        'Supported multiple languages and adapted interfaces to different screen sizes. Contributed to requirements and task estimates.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/beauty-agent-запись-клиентов/id1451215026'), ('Google Play', 'https://play.google.com/store/apps/details?id=com.beautyagent'), ('Website', 'https://app.beautyagent.ru/')],
)

otis = job(
    'OTIS', 'Flutter Developer', 'Feb 2021 — Mar 2022', 'Almaty, Kazakhstan',
    'An internal application for rapid response security teams. Flutter, iOS / Android.',
    [
        'Built employee screens and workflows; integrated Google Maps, protected property locations and geolocation.',
        'Implemented multiple authentication methods, including social sign-in, and improved error handling.',
        'Maintained WebSocket connections, incoming events, UI updates and reconnection after interruptions. Fixed bugs and improved existing code.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/otis-security/id6443658534'), ('Google Play', 'https://play.google.com/store/apps/details?id=kz.otisdevteam.otis_security'), ('OTIS website', 'https://www.otis.kz/')],
    prefix='Public OTIS Security app: ',
)

def english_job(markup):
    return markup.replace('<b>Стек:</b>', '<b>Stack:</b>')

contacts = ' '.join([
    link('mailto:shestakovvitaliy87@gmail.com', 'shestakovvitaliy87@gmail.com'),
    link('https://t.me/Shestakov_V', 'Telegram: @Shestakov_V'),
    link('https://www.linkedin.com/in/vitaliy-shestakov-67a9b0228', 'LinkedIn'),
])

html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vitaliy Shestakov — Senior Flutter Developer</title>
<meta name="description" content="Vitaliy Shestakov, Senior Flutter Developer. 5+ years of commercial experience building iOS, Android and Web products.">
<style>{styles}</style></head><body><main>
<section class="page" aria-label="Page 1">
  <div class="page-content">
    <header class="header"><div class="header-main">
      <h1>Vitaliy Shestakov</h1>
      <p class="position">Senior Flutter Developer <span class="platforms">· iOS / Android / Web</span></p>
      <p class="header-meta">Moscow · 27 years old · 5+ years of commercial experience</p>
      <p class="header-work">Full-time · remote or on-site · open to business travel</p>
      <nav class="contacts" aria-label="Contact details">{contacts}</nav>
    </div><img class="portrait" src="{photo}" alt="Portrait of Vitaliy Shestakov" width="1254" height="1254"></header>
    <section class="profile"><h2 class="section-title">Profile</h2>
      <p>I build applications from architecture and service integrations to release and maintenance. My experience includes financial services, cryptocurrency wallets, internal business applications and community platforms.</p>
      <p>I make technical decisions, break down requirements, estimate tasks and plan development. I review code and conduct technical interviews. I use AI coding agents, configure project context and validate proposed changes.</p>
    </section>
    <section aria-label="Experience"><h2 class="section-title">Experience</h2>{english_job(terra)}{english_job(citadel)}</section>
  </div><footer class="footer"><span>Vitaliy Shestakov · Senior Flutter Developer</span><span>01 / 02</span></footer>
</section>
<section class="page compact" aria-label="Page 2"><div class="page-content">
    <header class="continuation"><strong>Vitaliy Shestakov</strong><span>Senior Flutter Developer</span></header>
    <section aria-label="Experience, continued"><h2 class="section-title">Experience · continued</h2>{english_job(tayyab)}{english_job(beauty)}{english_job(otis)}</section>
    <section class="tech"><h2 class="section-title">Technologies</h2><dl>
      <dt>Architecture &amp; state</dt><dd>Clean Architecture, SOLID, MVVM, MVP, DI, BLoC/Cubit, Provider, Streams, RxDart, Melos; AutoRoute, GoRouter, Navigator.</dd>
      <dt>Networking &amp; data</dt><dd>REST APIs, Dio, HTTP, WebSocket; SQLite, Drift, IndexedDB, Hive, SharedPreferences, Flutter Secure Storage.</dd>
      <dt>Integrations</dt><dd>Firebase Authentication, FCM, Analytics, Crashlytics; additional experience with Firestore and Remote Config. Google / Apple / Telegram sign-in, deep links, Method Channels (Swift/Kotlin), AppsFlyer, AppMetrica, Sentry, Intercom.</dd>
      <dt>UI, quality &amp; delivery</dt><dd>Figma, UI kits, design tokens, Widgetbook, intl, Localizely; unit and widget tests, Dart DevTools; Freezed, json_serializable, build_runner, Git, GitLab CI/CD, GitHub Actions, Fastlane, FVM.</dd>
      <dt>AI &amp; teamwork</dt><dd>Cursor, Codex, Claude Code, MCP, RAG, agent instructions; Agile, Scrum, Kanban, Jira, Trello, Week.</dd>
    </dl></section>
    <section class="bottom-grid">
      <div><h2 class="section-title">Education</h2><p><strong>Saint Petersburg Humanitarian University of Trade Unions</strong><br>Bachelor’s degree · Applied Informatics · 2017 — 2022</p></div>
      <div><h2 class="section-title">Languages</h2><p>Russian — native<br>English — basic</p></div>
    </section>
  </div><footer class="footer"><span>{link('mailto:shestakovvitaliy87@gmail.com', 'shestakovvitaliy87@gmail.com')} · {link('https://t.me/Shestakov_V', '@Shestakov_V')}</span><span>02 / 02</span></footer>
</section></main></body></html>'''

def write_en():
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / 'Vitaliy-Shestakov-CV-EN-photo.html'
    target.write_text(html, encoding='utf-8')
    print(target)


if __name__ == '__main__':
    write_ru()
    write_en()
