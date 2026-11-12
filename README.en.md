# Vitaliy Shestakov · portfolio

[Русский](README.md) · [Website](index.html) · [RU CV](resume.pdf) · [EN CV](resume-en.pdf)

Senior Flutter Developer portfolio with projects, experience, skills and contacts. Russian/English, light/dark themes and responsive layouts. Static HTML/CSS/JavaScript with local fonts and images.

## Local development

Project tools require **Node.js 22+**. There are no npm dependencies to install.

```sh
npm run dev
```

Open <http://127.0.0.1:8000/>. Override the port with `-- --port 8001`. The website also supports opening `index.html` directly.

## Checks and release

```sh
npm run check
npm test
npm run build
npm run preview
```

- `check` validates local assets, anchors, JavaScript syntax, RU/EN keys, PDFs and project materials.
- `test` builds a temporary release and verifies its contents, file bytes, HTTP responses and `/portfolio/` hosting.
- `build` recreates `dist/` from actual site references plus dynamic CV files. Validation runs before the build.
- `preview` serves the release from `dist/` at <http://127.0.0.1:8000/>.

Deploy **only the contents of `dist/`** to static hosting, including GitHub Pages under `/portfolio/`. No backend is required. Neither the build nor CI deploys automatically.

GitHub Actions runs checks, tests and the build on push/PR and uploads the `portfolio-release` artifact. See [.github/workflows/check.yml](.github/workflows/check.yml).

## Publishing to GitHub Pages

1. Open **Settings → Pages** in the repository.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages → Run workflow**, select `main` and run it.
4. Wait for both `build` and `deploy` to succeed.

Site URL: <https://vitaliyshestakov.github.io/portfolio/>. English version: `?lang=en`.

[.github/workflows/pages.yml](.github/workflows/pages.yml) validates the project and publishes only `dist/`. For subsequent updates, push to `main` and run the workflow again. Normal pushes run checks; publishing remains manual.

## Source layout

| Path | Purpose |
| --- | --- |
| `index.html` | Semantic HTML, Russian fallback content and gallery data |
| `styles.css` | Tokens, components, responsive layouts, themes and print styles |
| `theme.js` | Theme initialization before first paint |
| `locales.js` | RU/EN content, metadata and accessible labels |
| `script.js` | Preferences, localization and shared anchor navigation |
| `experience.js` | Platform mockups, career disclosures, expertise and motion |
| `interactions.js` | Command palette, gallery and email copying |
| `assets/` | Fonts, icons and app screenshots used by the site |
| `content/cv/` | Editable CV sources and portrait |
| `scripts/`, `tests/` | Dependency-free tooling and verification |

Generated `dist/`, `.cache/` and `.playwright/` directories are ignored by Git. Old site editions and intermediate artwork were removed after an external backup was created.

## Editing content

Update both locales and the corresponding HTML fallback when changing copy. Relative paths and existing anchors support root hosting, `/portfolio/` hosting and direct file opening.

[assets/apps/sources.json](assets/apps/sources.json) records screenshot provenance and vector preview metadata. Rebuild vector covers with `npm run assets:build`; the gallery retains original images. Onest is distributed under the [SIL Open Font License](assets/Onest-OFL.txt).

CV sources are excluded from the release. Generate their HTML with Python 3:

```sh
npm run cv:html
```

Start Chrome with remote debugging as described below, then export:

```sh
PORTFOLIO_DEBUG_URL=http://127.0.0.1:9223 npm run cv:export -- ru
PORTFOLIO_DEBUG_URL=http://127.0.0.1:9223 npm run cv:export -- en
```

Outputs and layout reports go to `.cache/cv/`. Review them before replacing root `resume.pdf` and `resume-en.pdf`, then rerun checks and the build. Exporting does not replace public PDFs automatically.

## Browser verification

After building, start `npm run preview` and a separate Chrome instance. Example for macOS:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --remote-debugging-port=9223 --user-data-dir=/tmp/portfolio-qa --no-first-run about:blank
```

```sh
PORTFOLIO_BASE_URL=http://127.0.0.1:8000 PORTFOLIO_DEBUG_URL=http://127.0.0.1:9223 npm run test:browser
PORTFOLIO_BASE_URL=http://127.0.0.1:8000 PORTFOLIO_DEBUG_URL=http://127.0.0.1:9223 npm run test:navigation
```

Checks cover both themes/locales, responsive layouts, iOS/Android/Web mockups, the gallery, dialogs, keyboard interaction, reduced motion, blocked storage, printing and no-JavaScript mode. Navigation checks additionally exercise 360–2560 px layouts, deep links, history and interrupted scrolling. Reports and screenshots are written only to `.playwright/`.
