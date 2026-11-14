"""English translation of the Russian CV, with the same two-page structure."""
from build_resume import OUT, job, render_cv, write_ru

terra = job(
    'CRTEX', 'Senior Flutter Developer', 'Oct 2023 — Nov 2026', 'Moscow, Russia',
    'Built and launched Terra products from scratch: an iOS/Android app, an admin panel and an event registration form. Owned architecture, development, releases and stability.',
    [
        'Ported Terra to Flutter Web, adapting navigation and authentication. Optimized initialization and module loading, reducing startup time by <b>30%</b>.',
        'Implemented caching and pagination for REST APIs, reducing redundant requests by <b>25%</b>.',
        'Optimized BLoC state management and widget rebuilds, reducing list and catalog display time by <b>20%</b>.',
        'Improved WebSocket integrations, reconnection and data synchronization.',
        'Built admin tools and registration flows for mentoring launches attracting <b>5,000+ participants in a single day</b>.',
        'Set up error reporting, diagnostics and release delivery. Shipped <b>60+ production releases</b> while maintaining <b>99.95% crash-free sessions</b>.',
        'Conducted <b>50+ technical interviews</b>. Made technical decisions, reviewed code and supported development planning and onboarding.',
        'Introduced AI tooling in early 2026: configured agent instructions, documented architecture constraints and built a RAG knowledge base for code and documentation.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/terra-core/id6467891028'), ('Google Play', 'https://play.google.com/store/apps/details?id=com.club.terra'), ('Website', 'https://club-terra.ru/')],
)

citadel = job(
    'Citadel.one', 'Flutter Developer', 'Aug 2022 — Sep 2023', 'Almaty, Kazakhstan',
    'Owned Web3 integrations and digital asset operations in an iOS/Android cryptocurrency wallet supporting <b>40 blockchain networks</b>.',
    [
        'Integrated <b>WalletConnect</b> to connect to Web3 applications and confirm operations.',
        'Integrated <b>DApps</b> through <b>WebView</b> and a <b>JavaScript bridge</b>: wallet data exchange, request handling and transaction confirmation.',
        'Built token transfers, balance displays and transaction history. Worked with cryptocurrency APIs and network-specific behavior.',
        'Improved transaction state handling, network error handling and asynchronous event processing. Synchronized the UI with balance updates and operation results.',
    ],
    [('App Store', 'https://apps.apple.com/app/citadel-one/id1546701475'), ('Google Play', 'https://play.google.com/store/apps/details?id=one.citadel.mobile'), ('Website', 'https://citadel.one/')],
)

tayyab = job(
    'Tayyab', 'Flutter Developer', 'Jun 2022 — Aug 2022', 'Almaty, Kazakhstan',
    'Developed payment features and interfaces for Tayyab, a digital Islamic financial service in Kazakhstan.',
    [
        'Built <b>three key sections</b>: money transfers, account statements and transaction history.',
        'Maintained issuance and activation flows for virtual and physical cards and improved payment workflows.',
        'Fixed critical bugs and improved the stability of payment workflows.',
    ],
    [('App Store', 'https://apps.apple.com/kz/app/tayyab/id1562092088'), ('Google Play', 'https://play.google.com/store/apps/details?id=co.tayyab.app'), ('Website', 'https://tayyab.kz/')],
)

beauty = job(
    'Beauty Agent', 'Flutter Developer', 'Apr 2022 — Jun 2022', 'Moscow, Russia',
    'Contributed to Beauty Agent, an application for service professionals to manage clients, schedules and appointments.',
    [
        'Built client profiles with creation, editing and viewing functionality.',
        'Built scheduling and appointment management connected to the client database.',
        'Added multilingual support and adapted screens to different device sizes.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/beauty-agent-запись-клиентов/id1451215026'), ('Google Play', 'https://play.google.com/store/apps/details?id=com.beautyagent'), ('Website', 'https://app.beautyagent.ru/')],
)

otis = job(
    'OTIS', 'Flutter Developer', 'Feb 2021 — Mar 2022', 'Almaty, Kazakhstan',
    'Built an internal Flutter application for rapid response teams at OTIS, a security company.',
    [
        'Developed screens and workflows for the daily operations of security personnel.',
        'Integrated <b>Google Maps</b> to display protected properties and support geolocation.',
        'Implemented multiple authentication methods, including sign-in through social networks.',
    ],
    [('App Store', 'https://apps.apple.com/ru/app/otis-security/id6443658534'), ('Google Play', 'https://play.google.com/store/apps/details?id=kz.otisdevteam.otis_security'), ('Website', 'https://www.otis.kz/')],
)

skills = [
    ('Languages & platforms', 'Dart, Swift, Kotlin; Flutter, iOS, Android, Web'),
    ('Architecture & principles', 'Clean Architecture, MVVM, SOLID, OOP'),
    ('State & reactive programming', 'BLoC, Cubit, Provider, RxDart'),
    ('Networking & APIs', 'REST APIs, GraphQL, WebSocket, Dio, Retrofit'),
    ('Data storage', 'Drift, SQLite, Hive, SharedPreferences, Secure Storage'),
    ('Integrations', 'Firebase Auth, FCM, Google Maps, Platform Channels, Deep Links, WalletConnect, WebView, JavaScript Bridge'),
    ('UI', 'Material Design, Cupertino, adaptive layouts, localization, Figma'),
    ('Testing & CI/CD', 'Unit and widget tests, Git, GitHub Actions, GitLab CI/CD, Fastlane'),
    ('AI tools', 'Cursor, Claude Code, Codex, RAG'),
]


def write_en():
    html = render_cv(
        'en', 'Vitaliy Shestakov',
        '<b>Senior Flutter Developer with 5+ years of professional experience</b> across fintech, Web3 and community platforms. I build applications for iOS, Android and Web, from architecture design to release and maintenance. I integrate external services, implement business logic and improve application performance and stability. I use Cursor, Claude Code and Codex to automate development tasks.',
        skills, [terra, citadel, tayyab, beauty, otis],
        '<p><b>Saint Petersburg Humanitarian University of Trade Unions</b> · 2022</p><p>Bachelor’s degree · Applied Informatics</p>',
        'Russian — native · English — B1 (intermediate)',
    )
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / 'Vitaliy-Shestakov-CV-EN.html'
    target.write_text(html, encoding='utf-8')
    print(target)


if __name__ == '__main__':
    write_ru()
    write_en()
